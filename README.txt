MATTINO TRAFFICO — v31 iPhone-safe

Questa build mantiene la logica v30 che funziona su PC, ma elimina i punti più delicati su iPhone:
- URL nuovo v31.html per evitare la cache della vecchia PWA
- nessun Service Worker
- cache HTML disabilitata
- impostazioni senza tag <dialog>
- localStorage protetto
- sintassi JavaScript più compatibile
- errori rete/CORS mostrati direttamente a schermo
- manifest con start_url v31.html?build=31

Dopo aver caricato TUTTI i file su GitHub, apri una volta:
https://TUO-UTENTE.github.io/NOME-REPO/v31.html

Se il repository è il sito principale username.github.io:
https://TUO-UTENTE.github.io/v31.html

Se vedi in alto 'v31.0', stai usando sicuramente questa build.


v31 iPHONE CLEAN
- Caricare TUTTI i file sostituendo quelli vecchi.
- Aprire UNA VOLTA: reset-v31.html
- La pagina elimina vecchi Service Worker e Cache Storage e apre v31.html.
- Da quel momento usare v31.html oppure reinstallare "Aggiungi a Home".
