// Schema colori standard occidentale, associato all'ordine interno L,U,F,R,D,B
export const FACE_COLORS = ['#ff8a1e', '#ffffff', '#28a745', '#e6353a', '#ffe14d', '#2b6fe0'];
export const FACE_NAMES = ['L', 'U', 'F', 'R', 'D', 'B'];

// layout "a croce" del net piatto, replica esatta di ViewerFlat.java
// [faccia (indice colore 0-5), colonna, riga] in unita' di FACE
export const NET_LAYOUT = [
  { face: 0, col: 0, row: 1 }, // L
  { face: 1, col: 1, row: 0 }, // U
  { face: 2, col: 1, row: 1 }, // F
  { face: 3, col: 2, row: 1 }, // R
  { face: 4, col: 1, row: 2 }, // D
  { face: 5, col: 3, row: 1 }, // B
];
