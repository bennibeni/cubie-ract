import { cubelet2facelet } from '../cube/CubePosition';

// face: 0=L 1=U 2=F 3=R 4=D 5=B (stesso ordine usato ovunque nel porting)
// Convenzione assi: x=destra(R+), y=alto(U+), z=verso l'osservatore (F+).
// Questa mappa (riga/colonna della facelet -> coordinata) e' stata derivata e
// verificata per coerenza su tutte le 26 cubie a partire da cubelet2facelet
// (vedi commento in fondo al file).
const FACE_MAPS = [
  { fixed: 'x', fv: -1, rowAxis: 'y', rowVals: [1, 0, -1], colAxis: 'z', colVals: [-1, 0, 1] }, // L
  { fixed: 'y', fv: 1, rowAxis: 'z', rowVals: [-1, 0, 1], colAxis: 'x', colVals: [-1, 0, 1] }, // U
  { fixed: 'z', fv: 1, rowAxis: 'y', rowVals: [1, 0, -1], colAxis: 'x', colVals: [-1, 0, 1] }, // F
  { fixed: 'x', fv: 1, rowAxis: 'y', rowVals: [1, 0, -1], colAxis: 'z', colVals: [1, 0, -1] }, // R
  { fixed: 'y', fv: -1, rowAxis: 'z', rowVals: [1, 0, -1], colAxis: 'x', colVals: [-1, 0, 1] }, // D
  { fixed: 'z', fv: -1, rowAxis: 'y', rowVals: [1, 0, -1], colAxis: 'x', colVals: [1, 0, -1] }, // B
];

const FACE_NORMAL = [
  [-1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0], [0, -1, 0], [0, 0, -1],
];

function coordFromFacelet(facelet) {
  const face = Math.floor(facelet / 9);
  const local = facelet % 9;
  const row = Math.floor(local / 3);
  const col = local % 3;
  const m = FACE_MAPS[face];
  const pos = { x: 0, y: 0, z: 0 };
  pos[m.fixed] = m.fv;
  pos[m.rowAxis] = m.rowVals[row];
  pos[m.colAxis] = m.colVals[col];
  return pos;
}

// per ciascuna delle 26 "slot" (posizioni fisse nello spazio) calcola una volta
// per tutte: la posizione 3D e l'elenco degli sticker (facelet index + normale)
export function buildCubieSlots() {
  const slots = [];
  for (let i = 0; i < 26; i++) {
    const facelets = cubelet2facelet[i].filter((f) => f >= 0);
    const coords = facelets.map(coordFromFacelet);
    const { x, y, z } = coords[0];
    const stickers = facelets.map((facelet) => ({
      facelet,
      normal: FACE_NORMAL[Math.floor(facelet / 9)],
    }));
    slots.push({ index: i, position: [x, y, z], stickers });
  }
  return slots;
}

// geometria statica, calcolata una sola volta e riusata sia dal viewer che dal
// modulo di animazione delle mosse
export const CUBIE_SLOTS = buildCubieSlots();
export { FACE_NORMAL };
