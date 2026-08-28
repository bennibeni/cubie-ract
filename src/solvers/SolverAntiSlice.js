import MoveSequence from '../cube/MoveSequence';
import { cycle, swap } from './solverUtils';

const transCorn = [
  [4, 0, 6, 2, 5, 1, 7, 3], // La
  [1, 2, 3, 0, 7, 4, 5, 6], // Ua
  [3, 5, 1, 7, 0, 6, 2, 4], // Fa
];
const transEdge = [
  [4, 1, 6, 3, 8, 0, 10, 2, 5, 9, 7, 11], // La
  [1, 2, 3, 0, 4, 5, 6, 7, 11, 8, 9, 10], // Ua
  [0, 5, 2, 7, 3, 9, 1, 11, 8, 6, 10, 4], // Fa
];
const transOri = [
  [2, 1, 0, 3], // La
  [0, 2, 1, 3], // Ua
  [0, 1, 3, 2], // Fa
];

export default class SolverAntiSlice {
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
    for (let i = 0; i < this.sollen; i++) {
      m[i] = 15 + this.solmoves[i];
      if (m[i] > 17) m[i] -= 3;
    }
    return new MoveSequence(this.sollen, m, this.solamount);
  }

  mix(cubePos) {
    let j;
    cubePos.reset();

    j = Math.floor(4 * Math.random());
    if (j === 1 || j === 3) {
      cubePos.cubeletOri[12] = cubePos.cubeletOri[13] = cubePos.cubeletOri[14] = cubePos.cubeletOri[15] = 1;
    }
    if (j > 1) {
      cubePos.cubeletOri[8] = cubePos.cubeletOri[10] = cubePos.cubeletOri[16] = cubePos.cubeletOri[18] = 1;
    }
    if (j === 1 || j === 2) {
      cubePos.cubeletOri[9] = cubePos.cubeletOri[11] = cubePos.cubeletOri[17] = cubePos.cubeletOri[19] = 1;
    }

    j = Math.floor(4 * Math.random());
    if (j < 2) {
      swap(cubePos.cubeletPerm, 9, 11); swap(cubePos.cubeletPerm, 17, 19);
      swap(cubePos.cubeletPerm, 8, 10); swap(cubePos.cubeletPerm, 16, 18);
    }
    if (j === 1 || j === 3) {
      swap(cubePos.cubeletPerm, 9, 17); swap(cubePos.cubeletPerm, 11, 19);
      swap(cubePos.cubeletPerm, 13, 14); swap(cubePos.cubeletPerm, 12, 15);
    }

    j = Math.floor(4 * Math.random());
    if (j < 2) {
      swap(cubePos.cubeletPerm, 8, 10); swap(cubePos.cubeletPerm, 16, 18);
      swap(cubePos.cubeletPerm, 12, 14); swap(cubePos.cubeletPerm, 13, 15);
    }
    if (j === 1 || j === 3) {
      swap(cubePos.cubeletPerm, 8, 18); swap(cubePos.cubeletPerm, 10, 16);
      swap(cubePos.cubeletPerm, 13, 14); swap(cubePos.cubeletPerm, 12, 15);
    }

    j = Math.floor(2 * Math.random());
    if (j === 1) {
      cubePos.doMove(0); cubePos.doMove(3);
      cubePos.doMove(0); cubePos.doMove(3);
    }
    j = Math.floor(4 * Math.random());
    while (j > 0) { cubePos.doMove(1); cubePos.doMove(4); j--; }
    j = Math.floor(3 * Math.random());
    while (j > 0) {
      cubePos.doMove(0); cubePos.doMove(3);
      cubePos.doMove(1); cubePos.doMove(4);
      j--;
    }

    j = Math.floor(4 * Math.random());
    if (j === 0) {
      cubePos.doMove(0); cubePos.doMove(3);
      cubePos.doMove(1); cubePos.doMove(4);
      cubePos.doMove(0); cubePos.doMove(3);
      cubePos.doMove(0); cubePos.doMove(3);
      cubePos.doMove(0); cubePos.doMove(3);
      cubePos.doMove(2); cubePos.doMove(5);
      cubePos.doMove(2); cubePos.doMove(5);
      cubePos.doMove(2); cubePos.doMove(5);
    } else if (j === 1) {
      cubePos.doMove(1); cubePos.doMove(4);
      cubePos.doMove(2); cubePos.doMove(5);
      cubePos.doMove(1); cubePos.doMove(4);
      cubePos.doMove(1); cubePos.doMove(4);
      cubePos.doMove(1); cubePos.doMove(4);
      cubePos.doMove(0); cubePos.doMove(3);
      cubePos.doMove(0); cubePos.doMove(3);
      cubePos.doMove(0); cubePos.doMove(3);
    } else if (j === 2) {
      cubePos.doMove(2); cubePos.doMove(5);
      cubePos.doMove(0); cubePos.doMove(3);
      cubePos.doMove(2); cubePos.doMove(5);
      cubePos.doMove(2); cubePos.doMove(5);
      cubePos.doMove(2); cubePos.doMove(5);
      cubePos.doMove(1); cubePos.doMove(4);
      cubePos.doMove(1); cubePos.doMove(4);
      cubePos.doMove(1); cubePos.doMove(4);
    }
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
    if ((cubePos.cubeletOri[8] ^ cubePos.cubeletOri[9] ^ cubePos.cubeletOri[12]) !== 0) return false;

    if (superGroup && (
      cubePos.cubeletOri[20] !== cubePos.cubeletOri[23]
      || cubePos.cubeletOri[21] !== cubePos.cubeletOri[24]
      || cubePos.cubeletOri[22] !== cubePos.cubeletOri[25])) return false;

    const perm = new Array(23);
    for (i = 0; i < 20; i++) perm[i] = cubePos.cubeletPerm[i];
    for (i = 20; i < 23; i++) perm[i] = cubePos.cubeletOri[i] & 1;

    if (cubePos.cubeletOri[0] === 1) {
      perm[22] ^= 1;
      cycle(perm, 0, 3, 7, 4); cycle(perm, 1, 5, 6, 2);
      cycle(perm, 9, 13, 17, 14); cycle(perm, 11, 15, 19, 12);
    } else if (cubePos.cubeletOri[0] === 2) {
      perm[20] ^= 1;
      cycle(perm, 0, 1, 5, 4); cycle(perm, 3, 7, 6, 2);
      cycle(perm, 8, 13, 16, 12); cycle(perm, 10, 15, 18, 14);
    }
    if (perm[4] === 0 || perm[5] === 0 || perm[6] === 0 || perm[7] === 0) {
      swap(perm, 0, 7); swap(perm, 4, 3);
      swap(perm, 1, 6); swap(perm, 5, 2);
      swap(perm, 11, 19); swap(perm, 12, 15);
      swap(perm, 9, 17); swap(perm, 13, 14);
    }
    while (perm[0] !== 0) {
      perm[21] ^= 1;
      cycle(perm, 0, 1, 2, 3); cycle(perm, 4, 7, 6, 5);
      cycle(perm, 8, 9, 10, 11); cycle(perm, 16, 19, 18, 17);
    }
    if (perm[0] !== 0 || perm[2] !== 2 || perm[5] !== 5 || perm[7] !== 7) return false;

    if (perm[3] === 1) {
      perm[20] ^= 1; perm[22] ^= 1;
      swap(perm, 1, 3); swap(perm, 4, 6);
      swap(perm, 12, 14); swap(perm, 13, 15);
    } else if (perm[4] === 1) {
      perm[21] ^= 1; perm[22] ^= 1;
      swap(perm, 1, 4); swap(perm, 3, 6);
      swap(perm, 9, 19); swap(perm, 11, 17);
    } else if (perm[6] === 1) {
      perm[20] ^= 1; perm[21] ^= 1;
      swap(perm, 1, 6); swap(perm, 3, 4);
      swap(perm, 8, 18); swap(perm, 10, 16);
    }
    if (perm[1] !== 1 || perm[3] !== 3 || perm[4] !== 4 || perm[6] !== 6) return false;

    if (perm[11] === 9) {
      swap(perm, 9, 11); swap(perm, 17, 19);
      swap(perm, 8, 10); swap(perm, 16, 18);
    } else if (perm[17] === 9) {
      swap(perm, 9, 17); swap(perm, 11, 19);
      swap(perm, 13, 14); swap(perm, 12, 15);
    } else if (perm[19] === 9) {
      swap(perm, 9, 19); swap(perm, 11, 17);
      swap(perm, 12, 13); swap(perm, 14, 15);
    }
    if (perm[9] !== 9 || perm[11] !== 11 || perm[17] !== 17 || perm[19] !== 19) return false;

    if (perm[10] === 8) {
      swap(perm, 8, 10); swap(perm, 16, 18);
      swap(perm, 12, 14); swap(perm, 13, 15);
    } else if (perm[18] === 8) {
      swap(perm, 8, 18); swap(perm, 10, 16);
      swap(perm, 13, 14); swap(perm, 12, 15);
    } else if (perm[16] === 8) {
      swap(perm, 8, 16); swap(perm, 10, 18);
      swap(perm, 12, 13); swap(perm, 14, 15);
    }

    for (i = 0; i < 20; i++) if (perm[i] !== i) return false;
    if (superGroup) {
      for (i = 20; i < 23; i++) if (perm[i] !== 0) return false;
    }

    if (test) return true;
    if (!this.prepared) return false;

    for (i = 0; i < 8; i++) if (cubePos.cubeletPerm[i] === 0) perm[0] = i;
    for (i = 8; i < 20; i++) {
      if (cubePos.cubeletPerm[i] === 8) perm[1] = i - 8;
      else if (cubePos.cubeletPerm[i] === 9) perm[2] = i - 8;
      else if (cubePos.cubeletPerm[i] === 12) perm[3] = i - 8;
    }
    perm[4] = cubePos.cubeletOri[8] * 2 + cubePos.cubeletOri[9];
    if (superGroup) {
      perm[5] = (cubePos.cubeletOri[20] << 4) + (cubePos.cubeletOri[21] << 2) + cubePos.cubeletOri[22];
    } else {
      perm[5] = -1;
    }

    if (this.positionlist == null) {
      this.positionlist = Array.from({ length: 40 }, () => [0, 0, 0, 0, 0, 0]);
      this.maxdepth = 0; this.sollen = 0;
      this.solmoves[0] = -1; this.solamount[0] = 3;
    } else if (this.positionlist[0][0] !== perm[0] || this.positionlist[0][1] !== perm[1]
      || this.positionlist[0][2] !== perm[2] || this.positionlist[0][3] !== perm[3]
      || this.positionlist[0][4] !== perm[4] || this.positionlist[0][5] !== perm[5]) {
      this.maxdepth = 0; this.sollen = 0;
      this.solmoves[0] = -1; this.solamount[0] = 3;
    }
    for (i = 0; i < 6; i++) this.positionlist[0][i] = perm[i];
    return true;
  }

  init() {
    this.transFace = [new Array(64), new Array(64), new Array(64)];
    this.pruneFace = new Int8Array(64);
    // prune[i1][i2][i3][i4][i5], dimensioni 8x12x12x12x4
    this.prune = new Int8Array(8 * 12 * 12 * 12 * 4);

    let k = 0;
    for (let i1 = 0; i1 < 4; i1++) {
      for (let i2 = 0; i2 < 4; i2++) {
        for (let i3 = 0; i3 < 4; i3++) {
          this.transFace[0][k] = (((i1 + 3) & 3) << 4) + (i2 << 2) + i3;
          this.transFace[1][k] = (i1 << 4) + (((i2 + 3) & 3) << 2) + i3;
          this.transFace[2][k] = (i1 << 4) + (i2 << 2) + ((i3 + 3) & 3);
          let v = 1;
          if (i1 !== 0) v++;
          if (i2 !== 0) v++;
          if (i3 !== 0) v++;
          this.pruneFace[k] = v;
          k++;
        }
      }
    }

    const idx = (i1, i2, i3, i4, i5) => (((i1 * 12 + i2) * 12 + i3) * 12 + i4) * 4 + i5;
    let l = 1;
    this.prune[idx(0, 0, 1, 4, 0)] = 1;
    let kk;
    do {
      kk = 0;
      for (let i1 = 0; i1 < 8; i1++) {
        for (let i2 = 0; i2 < 12; i2++) {
          for (let i3 = 0; i3 < 12; i3++) {
            for (let i4 = 0; i4 < 12; i4++) {
              for (let i5 = 0; i5 < 4; i5++) {
                if (this.prune[idx(i1, i2, i3, i4, i5)] === l) {
                  for (let m = 0; m < 3; m++) {
                    let j1 = i1, j2 = i2, j3 = i3, j4 = i4, j5 = i5;
                    for (let q = 0; q < 3; q++) {
                      j1 = transCorn[m][j1];
                      j2 = transEdge[m][j2];
                      j3 = transEdge[m][j3];
                      j4 = transEdge[m][j4];
                      j5 = transOri[m][j5];
                      const id = idx(j1, j2, j3, j4, j5);
                      if (this.prune[id] === 0) { this.prune[id] = l + 1; kk++; }
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
    this._pruneIdx = idx;
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
      && this.positionlist[0][4] === 0 && this.positionlist[0][5] <= 0) return true;

    while (this.sollen >= 0) {
      nxt = this.sollen + 1;
      if (!this.positionlist[nxt]) this.positionlist[nxt] = [0, 0, 0, 0, 0, 0];
      m = this.solmoves[this.sollen];
      const nxtP = this.positionlist[nxt];
      // vedi nota in SolverTwoGen: si trasforma l'accumulatore nxtP, non il genitore.
      if (m >= 0) {
        nxtP[0] = transCorn[m][nxtP[0]];
        nxtP[1] = transEdge[m][nxtP[1]];
        nxtP[2] = transEdge[m][nxtP[2]];
        nxtP[3] = transEdge[m][nxtP[3]];
        nxtP[4] = transOri[m][nxtP[4]];
        if (superGroup) nxtP[5] = this.transFace[m][nxtP[5]];
      } else {
        const cur = this.positionlist[this.sollen];
        for (let i = 0; i < 6; i++) nxtP[i] = cur[i];
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
      if (this.sollen + this.prune[this._pruneIdx(p[0], p[1], p[2], p[3], p[4])] < this.maxdepth + 1
        && (!superGroup || this.sollen + this.pruneFace[p[5]] < this.maxdepth + 1)) {
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
