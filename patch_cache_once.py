from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
s=s.replace('./ios27.css?v=1','./ios27.css?v=3')
s=s.replace('./ios27.css?v=2','./ios27.css?v=3')
if '<meta name="dashboard-build" content="3">' not in s:
    s=s.replace('<title>Traffico</title>','<title>Traffico</title>\n<meta name="dashboard-build" content="3">',1)
p.write_text(s,encoding='utf-8')
