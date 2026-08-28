// Porting fedele di CubePosition.java (progetto "Cubie" di Jaap Scherphuis).
// Rappresentazione interna generale del cubo: 20 "cubie" (8 angoli + 12 spigoli)
// più 6 marcatori di colore centrale (indici 20-25).

// m=0-5: L U F R D B (facce normali)
// m=6-8: Lc Uc Fc (rotazione dell'intero cubo, alias "cube turn")
// Le altre combinazioni (middle slice, slice, anti-slice) sono gestite da doMove(m,q,allowRot)
// con m esteso a 9-17, esattamente come nell'originale.
const movePerm = [
  // L
  [
    [0, 1, 3, 7, 4, 5, 2, 6, 8, 9, 15, 11, 12, 13, 10, 18, 16, 17, 14, 19, 20, 21, 22, 23, 24, 25],
    [0, 0, 2, 1, 0, 0, 1, 2, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 3, 0, 0, 0, 0, 0],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  // U
  [
    [3, 0, 1, 2, 4, 5, 6, 7, 11, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  // F
  [
    [0, 2, 6, 3, 4, 1, 5, 7, 8, 14, 10, 11, 12, 9, 17, 15, 16, 13, 18, 19, 20, 21, 22, 23, 24, 25],
    [0, 2, 1, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  // R
  [
    [1, 5, 2, 3, 0, 4, 6, 7, 13, 9, 10, 11, 8, 16, 14, 15, 12, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    [2, 1, 0, 0, 1, 2, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 3, 0, 0],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  // D
  [
    [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 16, 20, 21, 22, 23, 24, 25],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  // B
  [
    [4, 1, 2, 0, 7, 5, 6, 3, 8, 9, 10, 12, 19, 13, 14, 11, 16, 17, 18, 15, 20, 21, 22, 23, 24, 25],
    [1, 0, 0, 2, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  // Lc (rotazione dell'intero cubo attorno all'asse L/R)
  [
    [4, 0, 3, 7, 5, 1, 2, 6, 12, 11, 15, 19, 16, 8, 10, 18, 13, 9, 14, 17, 20, 25, 21, 23, 22, 24],
    [2, 1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [1, 5, 6, 2, 0, 4, 7, 3, 13, 17, 14, 9, 8, 16, 18, 10, 12, 19, 15, 11, 20, 21, 22, 23, 24, 25],
    [1, 2, 1, 2, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [3, 2, 0, 1, 0, 2],
  ],
  // Uc
  [
    [3, 0, 1, 2, 7, 4, 5, 6, 11, 8, 9, 10, 15, 12, 13, 14, 19, 16, 17, 18, 22, 21, 23, 25, 24, 20],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 2, 3, 0, 5, 6, 7, 4, 9, 10, 11, 8, 13, 14, 15, 12, 17, 18, 19, 16, 20, 21, 22, 23, 24, 25],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 3, 0, 0, 1, 0],
  ],
  // Fc
  [
    [3, 2, 6, 7, 0, 1, 5, 4, 10, 14, 18, 15, 11, 9, 17, 19, 8, 13, 16, 12, 24, 20, 22, 21, 23, 25],
    [1, 2, 1, 2, 2, 1, 2, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [4, 5, 1, 0, 7, 6, 2, 3, 16, 13, 8, 12, 19, 17, 9, 11, 18, 14, 10, 15, 20, 21, 22, 23, 24, 25],
    [2, 1, 2, 1, 1, 2, 1, 2, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [3, 3, 3, 3, 3, 1],
  ],
];

const refPerm = [
  6, 7, 4, 5, 2, 3, 0, 1, 18, 19, 16, 17, 14, 15, 12, 13, 10, 11, 8, 9, 23, 24, 25, 20, 21, 22,
];

const pceTypes = [20, 26, 4, 0, 8, 3, 8, 20, 2];

export const faceletColorSolved = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5,
];

const faceletOriDiff = [
  0, 0, 1, 3, 0, 1, 3, 2, 2, 0, 0, 1, 3, 0, 1, 3, 2, 2, 0, 0, 1, 3, 0, 1, 3, 2, 2, 0, 0, 1, 3, 0, 1,
  3, 2, 2, 0, 0, 1, 3, 0, 1, 3, 2, 2, 0, 0, 1, 3, 0, 1, 3, 2, 2,
];

const cubeletColors = [
  [1, 5, 3], [1, 3, 2], [1, 2, 0], [1, 0, 5],
  [4, 3, 5], [4, 2, 3], [4, 0, 2], [4, 5, 0],
  [1, 3, -1], [1, 2, -1], [1, 0, -1], [1, 5, -1],
  [3, 5, -1], [3, 2, -1], [0, 2, -1], [0, 5, -1],
  [4, 3, -1], [4, 2, -1], [4, 0, -1], [4, 5, -1],
];

export const cubelet2facelet = [
  [11, 45, 29], [17, 27, 20], [15, 18, 2], [9, 0, 47],
  [44, 35, 51], [38, 26, 33], [36, 8, 24], [42, 53, 6],
  [14, 28, -1], [16, 19, -1], [12, 1, -1], [10, 46, -1],
  [32, 48, -1], [30, 23, -1], [5, 21, -1], [3, 50, -1],
  [41, 34, -1], [37, 25, -1], [39, 7, -1], [43, 52, -1],
  [4, -1, -1], [13, -1, -1], [22, -1, -1], [31, -1, -1], [40, -1, -1], [49, -1, -1],
];

export default class CubePosition {
  constructor() {
    this.cubeletPerm = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    ];
    this.cubeletOri = new Array(26).fill(0);
    this.faceOri = [0, 0, 0, 0, 0, 0];
    this.faceletColor = faceletColorSolved.slice();
    this.faceletOri = new Array(54).fill(0);
  }

  // reset alla posizione risolta (non tocca i colori/etichette dei centri)
  reset() {
    for (let j = 0; j < 20; j++) {
      this.cubeletPerm[j] = j;
      this.cubeletOri[j] = 0;
    }
    for (let j = 0; j < 6; j++) this.cubeletOri[j + 20] = 0;
  }

  // riorienta il cubo (senza mescolarlo) cosi' che le etichette dei centri siano allineate
  resetView() {
    while (this.faceOri[1] !== 0) this.doMove(7);
    if (this.faceOri[0] === 1 || this.faceOri[0] === 3) this.doMove(6);
    else if (this.faceOri[0] === 2) { this.doMove(6); this.doMove(6); }
    while (this.faceOri[1] !== 0) this.doMove(7);
  }

  // m=0-5 mossa normale, m=6-8 rotazione layer centrale, m=9-11 rotazione intero cubo,
  // m=12-14 slice, m=15-17 anti-slice. q = +-1 o +-2.
  doMove(m, q0 = 1, allowRot = true) {
    let q = q0;
    if (q < 0) q += 4;
    while (q > 0) {
      // NB: nell'originale Java, tutte le chiamate doMove(x) qui sotto sono a un solo
      // argomento e quindi risolvono sempre all'overload "raw" (applicazione diretta
      // di un singolo quarto di giro), mai alla versione ricorsiva a 3 argomenti.
      // Replichiamo lo stesso comportamento chiamando sempre _doMoveRaw direttamente.
      if (m >= 15) {
        this._doMoveRaw(m - 15, this.cubeletPerm, this.cubeletOri, this.faceOri);
        this._doMoveRaw(m - 12, this.cubeletPerm, this.cubeletOri, this.faceOri);
      } else if (m >= 12) {
        this._doMoveRaw(m - 12, this.cubeletPerm, this.cubeletOri, this.faceOri);
        this._doMoveRaw(m - 9, this.cubeletPerm, this.cubeletOri, this.faceOri);
        this._doMoveRaw(m - 9, this.cubeletPerm, this.cubeletOri, this.faceOri);
        this._doMoveRaw(m - 9, this.cubeletPerm, this.cubeletOri, this.faceOri);
      } else if (m >= 9) {
        if (allowRot) this._doMoveRaw(m - 3, this.cubeletPerm, this.cubeletOri, this.faceOri);
      } else if (m >= 6) {
        if (allowRot) this._doMoveRaw(m, this.cubeletPerm, this.cubeletOri, this.faceOri);
        this._doMoveRaw(m - 3, this.cubeletPerm, this.cubeletOri, this.faceOri);
        this._doMoveRaw(m - 6, this.cubeletPerm, this.cubeletOri, this.faceOri);
        this._doMoveRaw(m - 6, this.cubeletPerm, this.cubeletOri, this.faceOri);
        this._doMoveRaw(m - 6, this.cubeletPerm, this.cubeletOri, this.faceOri);
      } else {
        this._doMoveRaw(m, this.cubeletPerm, this.cubeletOri, this.faceOri);
      }
      q--;
    }
  }

  // versione "raw" a mossa singola, opera direttamente sugli array passati
  _doMoveRaw(m, p0, o0, f0) {
    const perm = new Array(26);
    const ori = new Array(26);
    const fc = new Array(6);
    const mp = movePerm[m];
    for (let i = 0; i < 26; i++) {
      perm[i] = p0[mp[0][i]];
      ori[i] = o0[mp[0][i]];
      if (ori[i] >= 0) ori[i] += mp[1][i];
      if (perm[i] >= 0) {
        perm[i] = mp[2][perm[i]];
        if (ori[i] >= 0) ori[i] += mp[3][perm[i]];
      }
      if (ori[i] >= 0) {
        if (i < 8) { while (ori[i] > 2) ori[i] -= 3; }
        else if (i < 20) { while (ori[i] > 1) ori[i] -= 2; }
        else { while (ori[i] > 3) ori[i] -= 4; }
      }
    }
    for (let i = 0; i < 6; i++) {
      fc[i] = f0[mp[0][i + 20] - 20] + mp[4][i];
      while (fc[i] > 3) fc[i] -= 4;
    }
    for (let i = 0; i < 26; i++) { p0[i] = perm[i]; o0[i] = ori[i]; }
    for (let i = 0; i < 6; i++) f0[i] = fc[i];
  }

  doSequence(ms, l = ms.getLength()) {
    this.reset();
    const moves = ms.getMoves();
    const amount = ms.getAmount();
    for (let i = 0; i < l; i++) this.doMove(moves[i], amount[i], true);
  }

  editMove(c1, o1, c2, o2) {
    let i;
    if (c1 < 8 && c2 < 8) {
      if (c1 === c2) {
        this.cubeletOri[c1] += o1 + 3 - o2;
        while (this.cubeletOri[c1] > 2) this.cubeletOri[c1] -= 3;
      } else {
        i = this.cubeletPerm[c1]; this.cubeletPerm[c1] = this.cubeletPerm[c2]; this.cubeletPerm[c2] = i;
        i = this.cubeletOri[c1]; this.cubeletOri[c1] = this.cubeletOri[c2]; this.cubeletOri[c2] = i;
        this.cubeletOri[c1] += o2 + 3 - o1;
        this.cubeletOri[c2] += o1 + 3 - o2;
        while (this.cubeletOri[c1] > 2) this.cubeletOri[c1] -= 3;
        while (this.cubeletOri[c2] > 2) this.cubeletOri[c2] -= 3;
      }
    } else if (c1 >= 8 && c2 >= 8 && c1 < 20 && c2 < 20) {
      if (c1 === c2) {
        this.cubeletOri[c1] += o2 + o1;
        while (this.cubeletOri[c1] > 1) this.cubeletOri[c1] -= 2;
      } else {
        i = this.cubeletPerm[c1]; this.cubeletPerm[c1] = this.cubeletPerm[c2]; this.cubeletPerm[c2] = i;
        i = this.cubeletOri[c1]; this.cubeletOri[c1] = this.cubeletOri[c2]; this.cubeletOri[c2] = i;
        this.cubeletOri[c1] += o2 + o1;
        this.cubeletOri[c2] += o1 + o2;
        while (this.cubeletOri[c1] > 1) this.cubeletOri[c1] -= 2;
        while (this.cubeletOri[c2] > 1) this.cubeletOri[c2] -= 2;
      }
    } else if (c1 >= 20 && c2 >= 20) {
      if (c1 === c2) {
        if (this.cubeletOri[c1] <= 0) this.cubeletOri[c1] = 3;
        else this.cubeletOri[c1]--;
      } else {
        i = this.cubeletPerm[c1]; this.cubeletPerm[c1] = this.cubeletPerm[c2]; this.cubeletPerm[c2] = i;
        i = this.cubeletOri[c1]; this.cubeletOri[c1] = this.cubeletOri[c2]; this.cubeletOri[c2] = i;
      }
    }
  }

  _doReflect(p0, o0, f0) {
    const perm = new Array(26);
    const ori = new Array(26);
    const fc = new Array(6);
    for (let i = 0; i < 26; i++) {
      perm[i] = p0[refPerm[i]];
      ori[i] = o0[refPerm[i]];
      if (ori[i] > 0) {
        if (i < 8) ori[i] ^= 3;
        else if (i >= 20) ori[i] = 4 - ori[i];
      }
      if (i < 20 && perm[i] >= 0) perm[i] = refPerm[perm[i]];
    }
    for (let i = 0; i < 6; i++) {
      fc[i] = 4 - f0[refPerm[i + 20] - 20];
      if (i !== 1 && i !== 4) fc[i] ^= 2;
    }
    for (let i = 0; i < 26; i++) { p0[i] = perm[i]; o0[i] = ori[i]; }
    for (let i = 0; i < 6; i++) f0[i] = fc[i];
  }

  doSym(m, fixCentres) {
    if (fixCentres) {
      const saveCentres = new Array(6);
      for (let i = 0; i < 6; i++) saveCentres[i] = this.cubeletPerm[20 + i];
      this._doSymRaw(m, this.cubeletPerm, this.cubeletOri, this.faceOri);
      for (let i = 0; i < 6; i++) this.cubeletPerm[20 + i] = saveCentres[i];
    } else {
      this._doSymRaw(m, this.cubeletPerm, this.cubeletOri, this.faceOri);
    }
  }

  _doSymRaw(m, p0, o0, f0) {
    switch (m) {
      case 0: this._doReflect(p0, o0, f0); break;
      case 1: case 2: case 3:
        this._doSymRaw(26 + (m - 1), p0, o0, f0); this._doReflect(p0, o0, f0); break;
      case 4: case 5: case 6:
        this._doSymRaw(23 + (m - 4), p0, o0, f0); this._doReflect(p0, o0, f0); break;
      case 7: case 8: case 9: case 10: case 11: case 12:
        this._doSymRaw(13 + (m - 7), p0, o0, f0); this._doReflect(p0, o0, f0); break;
      case 13: case 14: case 15:
        this._doSymRaw(16 + (m - 13), p0, o0, f0); this._doSymRaw(16 + (m - 13), p0, o0, f0); break;
      case 16: this._doMoveRaw(7, p0, o0, f0); break;
      case 17: this._doMoveRaw(6, p0, o0, f0); this._doMoveRaw(6, p0, o0, f0); this._doMoveRaw(6, p0, o0, f0); break;
      case 18: this._doMoveRaw(8, p0, o0, f0); break;
      case 19: this._doMoveRaw(6, p0, o0, f0); this._doMoveRaw(7, p0, o0, f0); break;
      case 20: this._doMoveRaw(7, p0, o0, f0); this._doMoveRaw(6, p0, o0, f0); break;
      case 21: this._doMoveRaw(7, p0, o0, f0); this._doSymRaw(17, p0, o0, f0); break;
      case 22: this._doMoveRaw(7, p0, o0, f0); this._doMoveRaw(8, p0, o0, f0); break;
      case 23: this._doSymRaw(22, p0, o0, f0); this._doMoveRaw(8, p0, o0, f0); break;
      case 24: this._doSymRaw(20, p0, o0, f0); this._doMoveRaw(8, p0, o0, f0); break;
      case 25: this._doSymRaw(22, p0, o0, f0); this._doSymRaw(17, p0, o0, f0); break;
      case 26: this._doSymRaw(21, p0, o0, f0); this._doSymRaw(17, p0, o0, f0); break;
      case 27: this._doSymRaw(19, p0, o0, f0); this._doMoveRaw(7, p0, o0, f0); break;
      case 28: this._doSymRaw(20, p0, o0, f0); this._doMoveRaw(7, p0, o0, f0); break;
      default: break;
    }
  }

  getSym() {
    let t = 0, m = 1;
    for (let i = 0; i < 29; i++) {
      if (this._checkSym(i)) t |= m;
      m <<= 1;
    }
    return t;
  }

  _checkSym(m) {
    const p = this.cubeletPerm.slice();
    const o = this.cubeletOri.slice();
    const f = this.faceOri.slice();
    this._doSymRaw(m, p, o, f);
    let ret = true;
    for (let i = 0; i < 20 && ret; i++) {
      ret = ret && p[i] === this.cubeletPerm[i] && o[i] === this.cubeletOri[i];
    }
    return ret;
  }

  // mescola casualmente mantenendo una data simmetria (usato per posizioni "carine")
  mix(t, centres, twoCol) {
    const p0 = new Array(26).fill(-1);
    const o0 = new Array(26).fill(-1);
    const f0 = new Array(6).fill(-1);
    for (let i = 20; i < 26; i++) {
      p0[i] = i;
      o0[i] = centres ? -1 : 0;
    }
    if (this._mixRest(0, p0, o0, f0, t, centres, twoCol, false)) {
      for (let i = 0; i < 26; i++) {
        if (i < 20) this.cubeletPerm[i] = p0[i];
        this.cubeletOri[i] = o0[i];
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('Errore di programmazione - nessuna posizione mescolata trovata');
    }
  }

  _mixRest(pt0, p0, o0, f0, t, centres, twoCol, doOri) {
    let pt = pt0;
    const p1 = p0.slice();
    const o1 = o0.slice();

    if (this._testSym(p0, o0, f0, t, centres, twoCol)) {
      let fs = pceTypes[pt];
      while (fs < pceTypes[pt + 1] && ((!doOri && p0[fs] >= 0) || (doOri && o0[fs] >= 0))) fs++;
      if (fs >= pceTypes[pt + 1]) {
        if (!doOri) pt += 3;
        if (pt >= pceTypes.length || this._mixRest(pt, p0, o0, f0, t, centres, twoCol, doOri)) return true;
      } else {
        let lst; let ll = 0;
        if (doOri) {
          lst = [];
          for (let i = 0; i < pceTypes[pt + 2]; i++) lst[ll++] = i;
        } else {
          lst = new Array(12);
          for (let i = pceTypes[pt]; i < pceTypes[pt + 1]; i++) lst[ll++] = i;
          for (let i = pceTypes[pt]; i < pceTypes[pt + 1]; i++) {
            if (p0[i] >= 0) {
              let j = 0;
              while (j < ll && lst[j] !== p0[i]) j++;
              lst[j] = lst[ll - 1];
              ll--;
            }
          }
        }
        while (ll > 0) {
          const i = Math.floor(ll * Math.random());
          if (doOri) o0[fs] = lst[i];
          else p0[fs] = lst[i];
          if (this._mixRest(pt, p0, o0, f0, t, centres, twoCol, !doOri)) return true;
          ll--;
          lst[i] = lst[ll];
        }
      }
    }
    for (let i = 0; i < 26; i++) { p0[i] = p1[i]; o0[i] = o1[i]; }
    return false;
  }

  _testSym(p0, o0, f0, t0, centres, twoCol) {
    let tryAgain;
    do {
      tryAgain = false;
      for (let i = 0; i < 29; i++) {
        if ((t0 & (1 << i)) !== 0) {
          const p1 = p0.slice();
          const o1 = o0.slice();
          this._doSymRaw(i, p0, o0, f0);
          for (let j = 0; j < 26; j++) {
            if (p0[j] >= 0) {
              if (p1[j] >= 0 && p1[j] !== p0[j] && j < 20) return false;
            } else if (p1[j] >= 0) {
              p0[j] = p1[j];
              tryAgain = true;
            }
            if (o0[j] >= 0) {
              if (o1[j] >= 0 && o1[j] !== o0[j]) return false;
            } else if (o1[j] >= 0) {
              o0[j] = o1[j];
              tryAgain = true;
            }
          }
        }
      }
    } while (tryAgain);

    for (let i = 0; i < 20; i++) {
      if (p0[i] >= 0) {
        for (let j = i + 1; j < 20; j++) if (p0[i] === p0[j]) return false;
      }
    }
    let j = 0, i;
    for (i = 0; i < 8 && o0[i] >= 0; i++) j += o0[i];
    if (i >= 8 && j % 3 !== 0) return false;

    j = 0;
    for (i = 8; i < 20 && o0[i] >= 0; i++) j += o0[i];
    if (i >= 20 && (j & 1) !== 0) return false;

    let parity = false;
    for (i = 0; i < 20; i++) {
      if (p0[i] < 0) break;
      for (j = i + 1; j < 20; j++) if (p0[j] < p0[i]) parity = !parity;
    }
    if (i >= 20 && parity) return false;

    if (centres) {
      parity = false;
      for (i = 0; i < 8; i++) {
        for (j = i + 1; j < 8; j++) if (p0[j] < p0[i]) parity = !parity;
      }
      for (i = 20; i < 26 && o0[i] >= 0; i++) if ((o0[i] & 1) !== 0) parity = !parity;
      if (i >= 26 && parity) return false;
    }

    if (twoCol) {
      const fc = new Array(54).fill(0);
      const fo = new Array(54).fill(0);
      this._getFaceletColorsRaw(p0, o0, f0, fc, fo);
      const lst = new Array(7);
      for (i = 0; i < 54; i += 9) {
        let ll = 0;
        for (j = i; j < i + 9; j++) {
          if (fc[j] >= 0) {
            let k = 0;
            while (k < ll && lst[k] !== fc[j]) k++;
            if (k >= ll) lst[ll++] = fc[j];
          }
        }
        if (ll > 2) return false;
      }
    }
    return true;
  }

  // converte la rappresentazione interna in colori delle 54 facelet + loro orientamento
  getFaceletColors() {
    this._getFaceletColorsRaw(this.cubeletPerm, this.cubeletOri, this.faceOri, this.faceletColor, this.faceletOri);
    return this.faceletColor;
  }

  _getFaceletColorsRaw(p0, o0, f0, fc, fo) {
    for (let i = 0; i < 54; i++) fc[i] = -1;
    for (let i = 0; i < 20; i++) {
      const k = p0[i];
      let o = o0[i];
      if (k >= 0 && o >= 0) {
        for (let j = 0; j < 3 && (j < 2 || i < 8); j++) {
          let c = cubeletColors[k][o];
          fc[cubelet2facelet[i][j]] = c;
          c = f0[c];
          c += faceletOriDiff[cubelet2facelet[k][o]] - faceletOriDiff[cubelet2facelet[i][j]];
          c &= 3;
          fo[cubelet2facelet[i][j]] = c;
          o = (o === 2 || (o === 1 && i >= 8)) ? 0 : o + 1;
        }
      }
    }
    for (let i = 20; i < 26; i++) {
      const o = o0[i];
      fc[cubelet2facelet[i][0]] = i - 20;
      if (o >= 0) {
        let c = f0[i - 20];
        c += o;
        c &= 3;
        fo[cubelet2facelet[i][0]] = c;
      }
    }
  }
}
