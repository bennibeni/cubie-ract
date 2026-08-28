import MoveSequence from '../cube/MoveSequence';
import { cycle, swap } from './solverUtils';

const transCorn = [
  [1, 5, 6, 2, 0, 4, 7, 3], // Ls
  [1, 2, 3, 0, 5, 6, 7, 4], // Us
  [4, 5, 1, 0, 7, 6, 2, 3], // Fs
];
const transEdge = [
  [5, 1, 6, 3, 0, 8, 10, 2, 4, 9, 7, 11], // Ls
  [1, 2, 3, 0, 4, 5, 6, 7, 9, 10, 11, 8], // Us
  [0, 5, 2, 4, 11, 9, 1, 3, 8, 6, 10, 7], // Fs
];

export default class SolverSlice {
  constructor() {
    this.prepared = false;
    this.sollen = 0;
    this.solmoves = new Array(40);
    this.solamount = new Array(40);
    this.positionlist = null;
    this.maxdepth = 0;
  }

  getGenerator() {
    const m = new Array(this.sollen);
    const a = new Array(this.sollen);
    for (let i = 0; i < this.sollen; i++) {
      m[i] = 12 + this.solmoves[i];
      a[i] = this.solamount[i];
      if (m[i] > 14) { m[i] -= 3; a[i] = 4 - a[i]; }
    }
    return new MoveSequence(this.sollen, m, a);
  }

  mix(cubePos) {
    let j;
    cubePos.reset();
    j = Math.floor(3 * Math.random());
    if (j === 1) { cubePos.doMove(0); cubePos.doMove(3); cubePos.doMove(3); cubePos.doMove(3); }
    else if (j === 2) { cubePos.doMove(2); cubePos.doMove(5); cubePos.doMove(5); cubePos.doMove(5); }

    j = Math.floor(2 * Math.random());
    if (j !== 0) { cubePos.doMove(0); cubePos.doMove(0); cubePos.doMove(3); cubePos.doMove(3); }

    j = Math.floor(4 * Math.random());
    while (j > 0) {
      cubePos.doMove(1); cubePos.doMove(4); cubePos.doMove(4); cubePos.doMove(4);
      j--;
    }

    j = Math.floor(4 * Math.random());
    while (j > 0) {
      cubePos.doMove(0); cubePos.doMove(3); cubePos.doMove(3); cubePos.doMove(3);
      cubePos.doMove(1); cubePos.doMove(4); cubePos.doMove(4); cubePos.doMove(4);
      cubePos.doMove(2); cubePos.doMove(5); cubePos.doMove(5); cubePos.doMove(5);
      cubePos.doMove(4); cubePos.doMove(1); cubePos.doMove(1); cubePos.doMove(1);
      j--;
    }
    j = Math.floor(4 * Math.random());
    while (j > 0) {
      cubePos.doMove(1); cubePos.doMove(4); cubePos.doMove(4); cubePos.doMove(4);
      cubePos.doMove(2); cubePos.doMove(5); cubePos.doMove(5); cubePos.doMove(5);
      cubePos.doMove(0); cubePos.doMove(3); cubePos.doMove(3); cubePos.doMove(3);
      cubePos.doMove(2); cubePos.doMove(2); cubePos.doMove(2); cubePos.doMove(5);
      j--;
    }
    j = Math.floor(2 * Math.random());
    if (j !== 0) { swap(cubePos.cubeletPerm, 12, 14); swap(cubePos.cubeletPerm, 13, 15); }

    j = Math.floor(4 * Math.random());
    cubePos.cubeletOri[20] = j;
    cubePos.cubeletOri[23] = (4 - j) & 3;
    j = Math.floor(4 * Math.random());
    cubePos.cubeletOri[21] = j;
    cubePos.cubeletOri[24] = (4 - j) & 3;
    j = Math.floor(2 * Math.random());
    cubePos.cubeletOri[22] = j + j;
    if (cubePos.cubeletPerm[1] === 0 || cubePos.cubeletPerm[3] === 0
      || cubePos.cubeletPerm[4] === 0 || cubePos.cubeletPerm[6] === 0) {
      cubePos.cubeletOri[22] ^= 1;
    }
    if (((cubePos.cubeletOri[20] + cubePos.cubeletOri[21]) & 1) !== 0) {
      cubePos.cubeletOri[22] ^= 1;
    }
    cubePos.cubeletOri[25] = (4 - cubePos.cubeletOri[22]) & 3;
  }

  setPosition(cubePos, test, superGroup) {
    let i, j;

    for (i = 0; i < 7; i++) {
      if (i === 3) j = cubePos.cubeletOri[0] + cubePos.cubeletOri[4];
      else j = cubePos.cubeletOri[i] + cubePos.cubeletOri[i + 1];
      if (j !== 0 && j !== 3) return false;
    }

    if (cubePos.cubeletOri[8] !== cubePos.cubeletOri[10]
      || cubePos.cubeletOri[8] !== cubePos.cubeletOri[16]
      || cubePos.cubeletOri[8] !== cubePos.cubeletOri[18]) return false;
    if (cubePos.cubeletOri[9] !== cubePos.cubeletOri[11]
      || cubePos.cubeletOri[9] !== cubePos.cubeletOri[17]
      || cubePos.cubeletOri[9] !== cubePos.cubeletOri[19]) return false;
    if (cubePos.cubeletOri[12] !== cubePos.cubeletOri[13]
      || cubePos.cubeletOri[12] !== cubePos.cubeletOri[14]
      || cubePos.cubeletOri[12] !== cubePos.cubeletOri[15]) return false;

    if (superGroup) {
      for (i = 0; i < 3; i++) {
        if (((cubePos.cubeletOri[20 + i] + cubePos.cubeletOri[23 + i]) & 3) !== 0) return false;
      }
      if (cubePos.cubeletPerm[1] === 0 || cubePos.cubeletPerm[3] === 0
        || cubePos.cubeletPerm[4] === 0 || cubePos.cubeletPerm[6] === 0) {
        if (((cubePos.cubeletOri[20] + cubePos.cubeletOri[21] + cubePos.cubeletOri[22]) & 1) === 0) return false;
      } else if (((cubePos.cubeletOri[20] + cubePos.cubeletOri[21] + cubePos.cubeletOri[22]) & 1) !== 0) return false;
    }

    const perm = new Array(20);
    const ori = new Array(3);
    for (i = 0; i < 20; i++) perm[i] = cubePos.cubeletPerm[i];
    ori[0] = cubePos.cubeletOri[8];
    ori[1] = cubePos.cubeletOri[9];
    ori[2] = cubePos.cubeletOri[12];

    if (cubePos.cubeletOri[0] === 1) {
      cycle(perm, 0, 4, 7, 3); cycle(perm, 1, 5, 6, 2);
      cycle(perm, 9, 13, 17, 14); cycle(perm, 11, 12, 19, 15);
      swap(ori, 1, 2);
    } else if (cubePos.cubeletOri[0] === 2) {
      cycle(perm, 0, 1, 5, 4); cycle(perm, 3, 2, 6, 7);
      cycle(perm, 8, 13, 16, 12); cycle(perm, 10, 14, 18, 15);
      i = ori[0]; ori[0] = 1 - ori[2]; ori[2] = 1 - i;
    }
    if (perm[4] === 0 || perm[5] === 0 || perm[6] === 0 || perm[7] === 0) {
      swap(perm, 0, 7); swap(perm, 4, 3);
      swap(perm, 1, 6); swap(perm, 5, 2);
      swap(perm, 11, 19); swap(perm, 12, 15);
      swap(perm, 9, 17); swap(perm, 13, 14);
    }
    while (perm[0] !== 0) {
      cycle(perm, 0, 1, 2, 3); cycle(perm, 4, 5, 6, 7);
      cycle(perm, 8, 9, 10, 11); cycle(perm, 16, 17, 18, 19);
      swap(ori, 0, 1);
    }
    for (i = 0; i < 8; i++) if (perm[i] !== i) return false;

    if (perm[9] !== 9 && perm[11] !== 9 && perm[17] !== 9 && perm[19] !== 9) return false;
    while (perm[9] !== 9) {
      cycle(perm, 9, 17, 19, 11); cycle(perm, 12, 13, 14, 15);
      ori[1] = 1 - ori[1]; ori[2] = 1 - ori[2];
    }
    if (ori[1] !== 0 || perm[11] !== 11 || perm[17] !== 17 || perm[19] !== 19) return false;

    if (perm[8] !== 8 && perm[10] !== 8 && perm[16] !== 8 && perm[18] !== 8) return false;
    while (perm[8] !== 8) {
      cycle(perm, 8, 16, 18, 10); cycle(perm, 12, 13, 14, 15);
      ori[0] = 1 - ori[0]; ori[2] = 1 - ori[2];
    }
    if (ori[0] !== 0 || perm[10] !== 10 || perm[16] !== 16 || perm[18] !== 18) return false;

    if (perm[14] === 12) { swap(perm, 12, 14); swap(perm, 13, 15); }
    if (ori[2] !== 0 || perm[12] !== 12 || perm[13] !== 13 || perm[14] !== 14 || perm[15] !== 15) return false;

    if (test) return true;
    if (!this.prepared) return false;

    for (i = 0; i < 8; i++) if (cubePos.cubeletPerm[i] === 0) perm[0] = i;
    for (i = 8; i < 20; i++) {
      if (cubePos.cubeletPerm[i] === 8) perm[1] = i - 8;
      else if (cubePos.cubeletPerm[i] === 9) perm[2] = i - 8;
      else if (cubePos.cubeletPerm[i] === 12) perm[3] = i - 8;
    }
    perm[4] = (cubePos.cubeletOri[20] << 4) + (cubePos.cubeletOri[21] << 2) + cubePos.cubeletOri[22];

    if (this.positionlist == null) {
      this.positionlist = Array.from({ length: 40 }, () => [0, 0, 0, 0, 0]);
      this.maxdepth = 0; this.sollen = 0;
      this.solmoves[0] = -1; this.solamount[0] = 3;
    } else if (this.positionlist[0][0] !== perm[0] || this.positionlist[0][1] !== perm[1]
      || this.positionlist[0][2] !== perm[2] || this.positionlist[0][3] !== perm[3]
      || (this.positionlist[0][4] !== perm[4] && superGroup)) {
      this.maxdepth = 0; this.sollen = 0;
      this.solmoves[0] = -1; this.solamount[0] = 3;
    }
    for (i = 0; i < 5; i++) this.positionlist[0][i] = perm[i];
    return true;
  }

  init() {
    this.transOri = new Array(64);
    // prune[i1][i2][i3][i4] dimensioni 8x12x12x12
    this.prune = new Int8Array(8 * 12 * 12 * 12);
    // prune2[i1][i2][i3][i4][i5] dimensioni 8x12x12x12x64
    this.prune2 = new Int8Array(8 * 12 * 12 * 12 * 64);

    let k = 0;
    for (let i1 = 0; i1 < 4; i1++) {
      for (let i2 = 0; i2 < 4; i2++) {
        for (let i3 = 0; i3 < 4; i3++) {
          this.transOri[k] = [
            (((i1 + 3) & 3) << 4) + (i2 << 2) + i3,
            (i1 << 4) + (((i2 + 3) & 3) << 2) + i3,
            (i1 << 4) + (i2 << 2) + ((i3 + 3) & 3),
          ];
          k++;
        }
      }
    }

    const idx1 = (i1, i2, i3, i4) => ((i1 * 12 + i2) * 12 + i3) * 12 + i4;
    const idx2 = (i1, i2, i3, i4, i5) => (((i1 * 12 + i2) * 12 + i3) * 12 + i4) * 64 + i5;
    this._idx1 = idx1;
    this._idx2 = idx2;

    let l = 1;
    this.prune[idx1(0, 0, 1, 4)] = 1;
    let kk;
    do {
      kk = 0;
      for (let i1 = 0; i1 < 8; i1++) {
        for (let i2 = 0; i2 < 12; i2++) {
          for (let i3 = 0; i3 < 12; i3++) {
            for (let i4 = 0; i4 < 12; i4++) {
              if (this.prune[idx1(i1, i2, i3, i4)] === l) {
                for (let m = 0; m < 3; m++) {
                  let j1 = i1, j2 = i2, j3 = i3, j4 = i4;
                  for (let q = 0; q < 3; q++) {
                    j1 = transCorn[m][j1];
                    j2 = transEdge[m][j2];
                    j3 = transEdge[m][j3];
                    j4 = transEdge[m][j4];
                    const id = idx1(j1, j2, j3, j4);
                    if (this.prune[id] === 0) { this.prune[id] = l + 1; kk++; }
                  }
                }
              }
            }
          }
        }
      }
      l++;
    } while (kk !== 0);

    l = 1;
    this.prune2[idx2(0, 0, 1, 4, 0)] = 1;
    do {
      kk = 0;
      for (let i1 = 0; i1 < 8; i1++) {
        for (let i2 = 0; i2 < 12; i2++) {
          for (let i3 = 0; i3 < 12; i3++) {
            for (let i4 = 0; i4 < 12; i4++) {
              for (let i5 = 0; i5 < 64; i5++) {
                if (this.prune2[idx2(i1, i2, i3, i4, i5)] === l) {
                  for (let m = 0; m < 3; m++) {
                    let j1 = i1, j2 = i2, j3 = i3, j4 = i4, j5 = i5;
                    for (let q = 0; q < 3; q++) {
                      j1 = transCorn[m][j1];
                      j2 = transEdge[m][j2];
                      j3 = transEdge[m][j3];
                      j4 = transEdge[m][j4];
                      j5 = this.transOri[j5][m];
                      const id = idx2(j1, j2, j3, j4, j5);
                      if (this.prune2[id] === 0) { this.prune2[id] = l + 1; kk++; }
                    }
                  }
                }
              }
            }
          }
        }
      }
      l++;
    } while (kk !== 0);

    this.prepared = true;
  }

  solve(superGroup) {
    while (!this._search(superGroup)) this.maxdepth++;
    return true;
  }

  _search(superGroup) {
    let m, nxt;
    if (this.maxdepth === 0 && this.sollen === 0
      && this.positionlist[0][0] === 0 && this.positionlist[0][1] === 0
      && this.positionlist[0][2] === 1 && this.positionlist[0][3] === 4
      && (!superGroup || this.positionlist[0][4] === 0)) return true;

    while (this.sollen >= 0) {
      nxt = this.sollen + 1;
      if (!this.positionlist[nxt]) this.positionlist[nxt] = [0, 0, 0, 0, 0];
      m = this.solmoves[this.sollen];
      const nxtP = this.positionlist[nxt];
      // vedi nota in SolverTwoGen: quando m>=0 si trasforma il valore gia' presente
      // in nxtP (accumulatore di quarti di giro), non quello del genitore.
      if (m >= 0) {
        nxtP[0] = transCorn[m][nxtP[0]];
        nxtP[1] = transEdge[m][nxtP[1]];
        nxtP[2] = transEdge[m][nxtP[2]];
        nxtP[3] = transEdge[m][nxtP[3]];
        if (superGroup) nxtP[4] = this.transOri[nxtP[4]][m];
      } else {
        const cur = this.positionlist[this.sollen];
        for (let i = 0; i < 5; i++) nxtP[i] = cur[i];
      }
      this.solamount[this.sollen]++;
      if (this.solamount[this.sollen] > 3) {
        this.solamount[this.sollen] = 0;
        do {
          this.solmoves[this.sollen]++;
        } while (this.sollen !== 0 && this.solmoves[this.sollen] === this.solmoves[this.sollen - 1]);
        if (this.solmoves[this.sollen] >= 3) { this.sollen--; continue; }
        continue;
      }

      const p = nxtP;
      if ((superGroup || this.sollen + this.prune[this._idx1(p[0], p[1], p[2], p[3])] < this.maxdepth + 1)
        && (!superGroup || this.sollen + this.prune2[this._idx2(p[0], p[1], p[2], p[3], p[4])] < this.maxdepth + 1)) {
        this.solmoves[nxt] = -1;
        this.solamount[nxt] = 3;
        this.sollen = nxt;
        if (this.sollen >= this.maxdepth) return true;
      }
    }
    this.solmoves[0] = -1;
    this.solamount[0] = 3;
    this.sollen = 0;
    return false;
  }
}
