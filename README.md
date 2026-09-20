# Percorso Lavoro

Web app/PWA personale ottimizzata per iPhone e iPad.

## Cosa fa

- Partenza: **Via J. F. Kennedy 9, Reggello (FI)**
- Destinazione: **Via Panciatichi 17, Firenze**
- Confronta ogni **5 minuti**:
  - percorso più veloce con autostrade consentite;
  - percorso più veloce evitando le autostrade.
- Usa **TomTom Routing API** con traffico live.
- Mostra il meteo in partenza e destinazione tramite **Open-Meteo**.
- Apre **Waze** sulla destinazione.
- Tema chiaro/scuro automatico.
- Interfaccia unica responsive che usa tutto lo spazio su iPhone e iPad.
- Può essere aggiunta alla Home Screen come PWA.

## Chiave TomTom

La chiave **non è nel repository**.

Al primo avvio la web app apre `⚙︎ Impostazioni`:

1. incolla la chiave TomTom;
2. premi **Salva e verifica**;
3. la chiave viene salvata in `localStorage` sul dispositivo.

Su ogni nuovo iPhone/iPad/browser va inserita una volta.

> Nota di sicurezza: in una web app puramente statica una chiave usata dal browser non può essere considerata un segreto forte. Salvarla in localStorage evita di pubblicarla su GitHub, ma un utente con accesso al browser/devtools può comunque leggerla. Per una protezione più forte serve un piccolo backend/serverless proxy.

## Pubblicazione su GitHub Pages

1. Crea un nuovo repository GitHub.
2. Carica **tutti i file di questa cartella nella root del repository**.
3. Apri `Settings → Pages`.
4. In `Build and deployment`, scegli `Deploy from a branch`.
5. Seleziona `main` e cartella `/ (root)`.
6. Salva.
7. Apri l'URL Pages generato da GitHub.

Su iPhone/iPad:

1. apri il sito in Safari;
2. Condividi;
3. **Aggiungi a Home**.

In modalità Home Screen usa tutto il display disponibile e gestisce automaticamente safe area/notch/Dynamic Island.


## Waze: nota importante

La dashboard usa TomTom per decidere quale percorso è migliore.

Un normale Waze Deep Link può aprire Waze e avviare la navigazione verso la destinazione, ma Waze ricalcola il percorso usando le proprie impostazioni. Il pulsante `No A1` non può imporre a Waze il percorso TomTom senza un'integrazione Waze più avanzata.

## File

- `index.html` — struttura
- `styles.css` — responsive iPhone/iPad + glass + dark mode
- `app.js` — TomTom, meteo, refresh 5 min, impostazioni, Waze
- `manifest.webmanifest` — installazione PWA
- `sw.js` — cache dei file locali
- `icon.svg` — icona app
