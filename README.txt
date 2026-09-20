MATTINO TRAFFICO — v30

Carica tutti questi file nella root del repository GitHub Pages:
- index.html
- manifest.webmanifest
- icon-180.png
- icon-192.png
- icon-512.png
- .nojekyll

Non c'è Service Worker: scelta voluta per evitare vecchie versioni in cache su iPhone.

Funzionamento:
- A1: percorso forzato attraverso i caselli Incisa-Reggello e Firenze Sud.
- NO A1: percorso TomTom con avoid=motorways.
- TomTom Traffic calcola tempi e ritardo live.
- Open-Meteo gestisce Reggello e Firenze.
- Aggiornamento automatico ogni 5 minuti.
- Waze è usato solo per aprire la navigazione, perché non può essere usato come fonte dati embedded in questa PWA.

La chiave TomTom non è nei file: viene salvata localmente nel browser.
La nuova app prova anche a recuperare automaticamente la chiave dalle precedenti versioni sullo stesso dominio.
