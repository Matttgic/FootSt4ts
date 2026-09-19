import {database} from './store';
import {paperReport,STRATEGY,PRUDENT_STRATEGY} from './decision';
// SQL aggregates over the whole archive. Pagination affects display only.
export const SUMMARY_SQL=`
WITH clean AS (
 SELECT id,version,kickoff,published_at,
 CASE WHEN json_valid(payload) THEN payload ELSE '{}' END AS p,
 CASE WHEN json_valid(result) THEN result ELSE '{}' END AS r
 FROM predictions WHERE version IN ('paper-v1','paper-v2-prudent')
), fields AS (
 SELECT *,json_extract(p,'$.selection.price') AS price,
 json_extract(p,'$.selection.market') AS market,
 json_extract(r,'$.hg') AS h,json_extract(r,'$.ag') AS a
 FROM clean WHERE json_extract(p,'$.kind')='paper'
 AND julianday(published_at)<julianday(kickoff)
), outcomes AS (
 SELECT *,CASE WHEN typeof(h)='integer' AND typeof(a)='integer' AND h>=0 AND a>=0 THEN
 CASE market WHEN 'home' THEN h>a WHEN 'draw' THEN h=a WHEN 'away' THEN h<a
 WHEN 'over15' THEN h+a>1.5 WHEN 'under15' THEN h+a<1.5
 WHEN 'over25' THEN h+a>2.5 WHEN 'under25' THEN h+a<2.5 END END AS won
 FROM fields WHERE typeof(price) IN ('integer','real') AND price>1
), nets AS (
 SELECT *,CASE WHEN won=1 THEN price-1 WHEN won=0 THEN -1 END AS net FROM outcomes
), cumulative AS (
 SELECT *,sum(coalesce(net,0)) OVER (PARTITION BY version ORDER BY kickoff,id ROWS UNBOUNDED PRECEDING) AS running FROM nets
), peaks AS (
 SELECT *,max(0,max(running) OVER (PARTITION BY version ORDER BY kickoff,id ROWS UNBOUNDED PRECEDING)) AS peak FROM cumulative
)
SELECT version AS strategy,count(*) AS total,count(net) AS settled,
sum(net IS NULL) AS pending,coalesce(sum(won=1),0) AS wins,
coalesce(sum(net),0) AS profit,coalesce(max(peak-running),0) AS drawdown,
min(published_at) AS startedAt,max(published_at) AS latestAt
FROM peaks GROUP BY version`;
export async function loadJournal(strategy=PRUDENT_STRATEGY,page=0){
 const [summaries,rows]=await Promise.all([
 database().prepare(SUMMARY_SQL).all(),
 database().prepare(SUMMARY_SQL.slice(0,SUMMARY_SQL.indexOf('SELECT version AS strategy'))+' SELECT id,version,kickoff,published_at,p AS payload,r AS result FROM peaks WHERE version=? ORDER BY kickoff DESC,id DESC LIMIT 30 OFFSET ?').bind(strategy,page*30).all()
 ]);
 const defaults={total:0,settled:0,pending:0,wins:0,profit:0,drawdown:0,startedAt:null,latestAt:null};
 const comparisons=[STRATEGY,PRUDENT_STRATEGY].map(version=>{const s:any={...defaults,...summaries.results.find((s:any)=>s.strategy===version),strategy:version};return {...s,roi:s.settled?s.profit/s.settled:null}});
 return {...comparisons.find(s=>s.strategy===strategy),strategy,page,pageSize:30,entries:paperReport(rows.results).entries,comparisons};
}
