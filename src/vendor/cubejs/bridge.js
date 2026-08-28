import { cubelet2facelet } from '../../cube/CubePosition';
import { CUBIE_SLOTS } from '../../components/cubieGeometry';

// Offset dei facelet di ciascun pezzo, presi ESATTAMENTE dal codice sorgente di
// cubejs (cube.js, array cornerFacelet/edgeFacelet/centerFacelet): non sono una
// nostra congettura sulla convenzione riga/colonna, ma una trascrizione diretta.
// Per ogni pezzo, l'ordine degli offset coincide con l'ordine delle lettere nel
// nome (verificato leggendo il sorgente) — es. URF: [U9, R1, F3].
const FACE_BASE = {
  U: 0, R: 9, F: 18, D: 27, L: 36, B: 45,
};
function offsetIndex(code) {
  return FACE_BASE[code[0]] + (parseInt(code.slice(1), 10) - 1);
}

const CORNER_NAMES = ['URF', 'UFL', 'ULB', 'UBR', 'DFR', 'DLF', 'DBL', 'DRB'];
const CORNER_OFFSET_CODES = [
  ['U9', 'R1', 'F3'], ['U7', 'F1', 'L3'], ['U1', 'L1', 'B3'], ['U3', 'B1', 'R3'],
  ['D3', 'F9', 'R7'], ['D1', 'L9', 'F7'], ['D7', 'B9', 'L7'], ['D9', 'R9', 'B7'],
];
const EDGE_NAMES = ['UR', 'UF', 'UL', 'UB', 'DR', 'DF', 'DL', 'DB', 'FR', 'FL', 'BL', 'BR'];
const EDGE_OFFSET_CODES = [
  ['U6', 'R2'], ['U8', 'F2'], ['U4', 'L2'], ['U2', 'B2'],
  ['D6', 'R8'], ['D2', 'F8'], ['D4', 'L8'], ['D8', 'B8'],
  ['F6', 'R4'], ['F4', 'L6'], ['B6', 'L4'], ['B4', 'R6'],
];
const CENTER_OFFSET_CODES = ['U5', 'R5', 'F5', 'D5', 'L5', 'B5'];
const CENTER_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'];

// il nostro ordine di colore interno (vedi faceletColorSolved in CubePosition.js)
const OUR_LETTERS = ['L', 'U', 'F', 'R', 'D', 'B'];
const OUR_FACE_INDEX = { L: 0, U: 1, F: 2, R: 3, D: 4, B: 5 };

const AXIS_FACE = {
  x: { 1: 'R', '-1': 'L' },
  y: { 1: 'U', '-1': 'D' },
  z: { 1: 'F', '-1': 'B' },
};

function faceSetKey(position) {
  const [x, y, z] = position;
  const faces = [];
  if (x !== 0) faces.push(AXIS_FACE.x[x]);
  if (y !== 0) faces.push(AXIS_FACE.y[y]);
  if (z !== 0) faces.push(AXIS_FACE.z[z]);
  return faces.sort().join('');
}

// mappa "insieme di lettere ordinato" (es. "FRU") -> indice della nostra slot (0-19)
const SLOT_BY_FACESET = new Map();
CUBIE_SLOTS.forEach((slot) => {
  if (slot.index < 20) {
    SLOT_BY_FACESET.set(faceSetKey(slot.position), slot.index);
  }
});

function ourSlotForName(name) {
  const key = name.split('').sort().join('');
  const slot = SLOT_BY_FACESET.get(key);
  if (slot === undefined) throw new Error(`Nessuna cubie trovata per il nome ${name}`);
  return slot;
}

// per una slot fissa e una lettera di faccia, trova il colore CORRENTE mostrato
// da quella slot sul lato rivolto verso quella faccia, usando la nostra
// faceletColor (che riflette gia' correttamente permutazione/orientazione attuali)
function colorLetterOnFace(slotIndex, faceLetter, faceletColor) {
  const targetFace = OUR_FACE_INDEX[faceLetter];
  const facelets = cubelet2facelet[slotIndex];
  for (let j = 0; j < facelets.length; j++) {
    const f = facelets[j];
    if (f >= 0 && Math.floor(f / 9) === targetFace) {
      return OUR_LETTERS[faceletColor[f]];
    }
  }
  throw new Error(`Slot ${slotIndex} non ha una facelet sulla faccia ${faceLetter}`);
}

// precalcola, una sola volta, a quale nostra slot corrisponde ciascun pezzo
// nominato da cubejs (le posizioni sono fisse, non dipendono dallo stato attuale)
const CORNER_SLOTS = CORNER_NAMES.map(ourSlotForName);
const EDGE_SLOTS = EDGE_NAMES.map(ourSlotForName);

// costruisce la stringa facelet a 54 caratteri nel formato atteso da cubejs
// (ordine U,R,F,D,L,B, ciascuna faccia raster secondo la convenzione di cubejs)
// a partire dal nostro modello CubePosition, per corrispondenza di nome pezzo.
export function cubePositionToFaceletString(cubePos) {
  const faceletColor = cubePos.getFaceletColors();
  const str = new Array(54);

  CENTER_NAMES.forEach((name, i) => {
    str[offsetIndex(CENTER_OFFSET_CODES[i])] = name;
  });

  CORNER_NAMES.forEach((name, i) => {
    const slot = CORNER_SLOTS[i];
    name.split('').forEach((faceLetter, j) => {
      str[offsetIndex(CORNER_OFFSET_CODES[i][j])] = colorLetterOnFace(slot, faceLetter, faceletColor);
    });
  });

  EDGE_NAMES.forEach((name, i) => {
    const slot = EDGE_SLOTS[i];
    name.split('').forEach((faceLetter, j) => {
      str[offsetIndex(EDGE_OFFSET_CODES[i][j])] = colorLetterOnFace(slot, faceLetter, faceletColor);
    });
  });

  return str.join('');
}
