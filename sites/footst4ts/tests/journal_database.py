import sqlite3,json,pathlib
sql=pathlib.Path('lib/football/journal.ts').read_text().split('export const SUMMARY_SQL=`',1)[1].split('`;',1)[0]
db=sqlite3.connect(':memory:');db.row_factory=sqlite3.Row
db.execute('CREATE TABLE predictions(id TEXT PRIMARY KEY,version TEXT,kickoff TEXT,published_at TEXT,payload TEXT,result TEXT)')
def put(id,v='paper-v1',result=(1,0),price=2):
 db.execute('INSERT INTO predictions(id,version,kickoff,published_at,payload,result) VALUES(?,?,?,?,?,?)',(str(id),v,'2026-09-19T12:00:00Z','2026-09-19T11:00:00Z',json.dumps({'kind':'paper','selection':{'market':'home','price':price}}),json.dumps(dict(zip(['hg','ag'],result))) if result is not None else None))
for i in range(1005):put(f'a{i:04}')
put('z1',result=(0,1));put('z2',result=(0,1));put('z3',result=None)
put('v2','paper-v2-prudent',result=(0,1))
r={x['strategy']:dict(x) for x in db.execute(sql)}
assert r['paper-v1']['total']==1008 and r['paper-v1']['settled']==1007
assert r['paper-v1']['profit']==1003 and r['paper-v1']['drawdown']==2
assert r['paper-v1']['pending']==1 and r['paper-v2-prudent']['profit']==-1
prefix=sql[:sql.index('SELECT version AS strategy')]
rows=db.execute(prefix+' SELECT id FROM peaks WHERE version=? ORDER BY kickoff DESC,id DESC LIMIT 30 OFFSET ?',('paper-v1',990)).fetchall()
assert len(rows)==18
print('Journal SQL: full archive >1000, isolated versions, pending, drawdown, pagination verified')
# Pending postponed records must not starve later completed matches.
db.execute('ALTER TABLE predictions ADD COLUMN match_id TEXT')
for i in range(120):
 put('pending'+str(i),result=None)
 db.execute('UPDATE predictions SET match_id=? WHERE id=?',('postponed'+str(i),'pending'+str(i)))
put('completed',result=None);db.execute("UPDATE predictions SET match_id='fixture' WHERE id='completed'")
source=pathlib.Path('lib/football/prospective.ts').read_text()
update=source.split('prepare(`WITH finished',1)[1].split('`)',1)[0]
update='WITH finished'+update
actual=[{'id':'fixture','utc':'2026-09-19T12:00:00Z','hg':2,'ag':1,'collectedAt':'2026-09-19T15:00:00Z'}]
db.execute(update,(json.dumps(actual),))
assert db.execute("SELECT result FROM predictions WHERE id='completed'").fetchone()[0] is not None
assert db.execute("SELECT count(*) FROM predictions WHERE id LIKE 'pending%' AND result IS NULL").fetchone()[0]==120
print('Settlement SQL: later results processed despite 120 pending postponed matches')
