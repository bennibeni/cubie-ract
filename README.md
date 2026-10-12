# React + Vite

## Risoluzione da una posizione casuale

### Gioco manuale

I pulsanti delle facce mostrano icone orarie e antiorarie, con etichette accessibili e tooltip. Un bordo giallo indica il quarto di giro suggerito nella posizione corrente. Il suggerimento viene calcolato in background anche all'apertura, dopo annullamento, ripristino e nuovo mescolamento; le risposte obsolete vengono ignorate. Seguendo il percorso suggerito si riusano le posizioni già calcolate. Un mezzo giro della soluzione viene presentato come due quarti di giro orari consecutivi. Il suggerimento scompare durante animazioni e a cubo risolto. Il primo calcolo può richiedere alcuni secondi.

Il pannello **Gioca tu** permette di eseguire L, U, F, R, D e B, ciascuna come quarto di giro, inversa o mezzo giro. Il verso è riferito alla faccia vista dall'esterno, indipendentemente dalla visuale della camera. Il trascinamento del cubo cambia soltanto la visuale.

Le mosse manuali sono animate, contate e riportate nella cronologia; **Annulla ultima mossa** esegue l'inversa. La cronologia manuale viene svuotata quando comincia una riproduzione automatica, quando si ricomincia o si genera una nuova posizione. **Ricomincia dalla posizione iniziale** ripristina il mescolamento originale. Una mossa manuale invalida la soluzione precedente: **Mostra risoluzione** risolve quindi la posizione corrente. Al raggiungimento dello stato risolto compare un messaggio di completamento.

All'apertura il cubo viene mescolato con 30 mosse casuali, evitando facce consecutive uguali (non è un campionamento uniforme di tutte le configurazioni). **Mostra risoluzione** calcola una soluzione completa con Kociemba e la riproduce automaticamente. Il calcolo avviene in un Web Worker e la sequenza viene verificata sul modello prima della riproduzione.

Controlli disponibili: nuova posizione casuale, pausa alla fine della mossa corrente, ripresa, una mossa avanti, ritorno alla stessa posizione iniziale e tre velocità. Il contatore e la sequenza evidenziano l'avanzamento. I controlli che cambiano posizione sono bloccati durante calcolo e animazione. La selezione dei sottogruppi è stata rimossa dall'interfaccia.

Sorgenti del flusso: `src/App.jsx`, `src/solvers/solve.worker.js`; animazione 3D in `src/components/Cube3D.jsx`.

## Diagramma delle permutazioni

Il controllo **Mostra diagramma dei cerchi** affianca al cubo (3D o Net 2D) un SVG con tre famiglie di tre cerchi e 54 punti. Ogni punto legge direttamente una delle 54 facelet del modello, usando gli stessi colori del cubo. Il diagramma segue mosse, mescolamento, azzeramento e applicazione delle soluzioni. Durante le rotazioni 3D supportate i cerchi interessati diventano bianchi; i 12 punti laterali scorrono sulla circonferenza, conservando il colore. Le 8 etichette periferiche della faccia ruotano nel proprio gruppo. Durata e curva di accelerazione seguono il cubo 3D.

Sorgenti: `src/components/CubeCircles.jsx` (rendering, parametri `faceletColor`, `animation`, `width`, `dotRadius`, `colors`) e `src/components/circleDiagramGeometry.js` (intersezioni e associazione alle facelet). Le coordinate dei punti sono ricavate dalle intersezioni e associate alle posizioni fisiche di `cubieGeometry.js`.

Verifica della geometria e della corrispondenza tra strati e mosse:

```sh
node --test src/components/circleDiagramGeometry.test.js
```

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.


