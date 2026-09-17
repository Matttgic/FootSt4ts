import sqlite3, pathlib, concurrent.futures,tempfile
sql=pathlib.Path('drizzle/0000_abnormal_freak.sql').read_text()
with tempfile.TemporaryDirectory() as d:
 path=d+'/test.db'; c=sqlite3.connect(path);c.executescript(sql);c.close()
 def reserve(_):
  c=sqlite3.connect(path,timeout=10)
  r=c.execute('INSERT INTO budget(key,used,"limit") SELECT ?,?,? WHERE ?<=? ON CONFLICT(key) DO UPDATE SET used=budget.used+excluded.used WHERE budget.used+excluded.used<=excluded."limit" RETURNING used',('day',1,80,1,80)).fetchone();c.commit();c.close();return bool(r)
 with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex: results=list(ex.map(reserve,range(150)))
 assert sum(results)==80, sum(results)
 c=sqlite3.connect(path);assert c.execute('select used from budget').fetchone()[0]==80
 print('PASS : quota atomique, 150 tentatives concurrentes, 80 autorisées ; migration SQLite valide')
