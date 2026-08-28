import MoveSequence from '../cube/MoveSequence';
import {
  num2perm, perm2num, parityOdd, swap,
} from './solverUtils';

// UR,DR,DL,UL  RB,RF,LF,LB  UF,DF,DB,UB   UBR,UFL,DFR,DBL,  URF,ULB,DRB,DLF
const orbits = [
  [8, 16, 18, 10], [12, 13, 14, 15], [9, 17, 19, 11],
  [0, 2, 5, 7], [1, 3, 4, 6],
];

export default class SolverSquare {
  constructor() {
    this.prepared = false;
    this.sollen = 0;
    this.solmoves = new Array(40);
    this.solamount = new Array(40);
    this.positionlist = null;
    this.maxdepth = 0;
  }

  getGenerator() {
    const a = new Array(this.sollen).fill(2);
    return new MoveSequence(this.sollen, this.solmoves, a);
  }

  mix(cubePos) {
    let i, j;
    cubePos.reset();
    j = Math.floor(4 * Math.random());
    if (j !== 3) { cubePos.doMove(j); cubePos.doMove(j); }
    j = Math.floor(3 + 3 * Math.random());
    if (j !== 5) { cubePos.doMove(j); cubePos.doMove(j); }
    j = Math.floor(2 * Math.random());
    if (j !== 0) { cubePos.doMove(5); cubePos.doMove(5); }
    j = Math.floor(4 * Math.random());
    if (j === 0) {
      cubePos.doMove(2); cubePos.doMove(2);
      cubePos.doMove(3); cubePos.doMove(3);
      cubePos.doMove(1); cubePos.doMove(1);
      cubePos.doMove(3); cubePos.doMove(3);
    } else if (j === 1) {
      cubePos.doMove(3); cubePos.doMove(3);
      cubePos.doMove(1); cubePos.doMove(1);
      cubePos.doMove(2); cubePos.doMove(2);
      cubePos.doMove(1); cubePos.doMove(1);
    } else if (j === 2) {
      cubePos.doMove(1); cubePos.doMove(1);
      cubePos.doMove(2); cubePos.doMove(2);
      cubePos.doMove(3); cubePos.doMove(3);
      cubePos.doMove(2); cubePos.doMove(2);
    }

    const order = new Array(4);
    for (i = 0; i < 3; i++) {
      num2perm(order, 0, 4, Math.floor(4 * Math.random()));
      for (j = 0; j < 4; j++) {
        cubePos.cubeletPerm[orbits[i][j]] = orbits[i][order[j]];
      }
    }
    if (parityOdd(cubePos.cubeletPerm, 8, 12)) {
      swap(cubePos.cubeletPerm, 8, 10);
    }

    const perm = new Array(20);
    let c = 0;
    for (i = 0; i < 5; i++) {
      for (j = 0; j < 4; j++) {
        let k = 0;
        while (k < 4 && cubePos.cubeletPerm[orbits[i][j]] !== orbits[i][k]) k++;
        perm[c++] = k;
      }
    }

    j = 0; // 210:LUF
    for (i = 0; i < 6; i++) cubePos.cubeletOri[20 + i] = 0;
    if (parityOdd(perm, 12, 4)) j ^= 7;
    if (parityOdd(perm, 0, 4)) j ^= 6;
    if (parityOdd(perm, 4, 4)) j ^= 5;
    if (parityOdd(perm, 8, 4)) j ^= 3;
    if ((j & 4) !== 0) cubePos.cubeletOri[20] = 2;
    if ((j & 2) !== 0) cubePos.cubeletOri[21] = 2;
    if ((j & 1) !== 0) cubePos.cubeletOri[22] = 2;

    j = Math.floor(8 * Math.random());
    if ((j & 4) !== 0) { cubePos.cubeletOri[20] ^= 2; cubePos.cubeletOri[23] ^= 2; }
    if ((j & 2) !== 0) { cubePos.cubeletOri[21] ^= 2; cubePos.cubeletOri[24] ^= 2; }
    if ((j & 1) !== 0) { cubePos.cubeletOri[22] ^= 2; cubePos.cubeletOri[25] ^= 2; }
  }

  setPosition(cubePos, test, superGroup) {
    let i, j, k, c;
    const perm = new Array(20);

    if (parityOdd(cubePos.cubeletPerm, 0, 20)) return false;
    for (i = 0; i < 20; i++) if (cubePos.cubeletOri[i] !== 0) return false;

    c = 0;
    for (i = 0; i < 5; i++) {
      for (j = 0; j < 4; j++) {
        k = 0;
        while (k < 4 && cubePos.cubeletPerm[orbits[i][j]] !== orbits[i][k]) k++;
        if (k >= 4) return false;
        perm[c++] = k;
      }
    }
    if (parityOdd(perm, 12, 4) !== parityOdd(perm, 16, 4)) return false;

    if (superGroup) {
      for (i = 0; i < 6; i++) if ((cubePos.cubeletOri[20 + i] & 1) !== 0) return false;
      j = 0; // 210:LUF
      if (parityOdd(perm, 12, 4)) j ^= 7;
      if (parityOdd(perm, 0, 4)) j ^= 6;
      if (parityOdd(perm, 4, 4)) j ^= 5;
      if (parityOdd(perm, 8, 4)) j ^= 3;
      if (cubePos.cubeletOri[20] !== cubePos.cubeletOri[23]) j ^= 4;
      if (cubePos.cubeletOri[21] !== cubePos.cubeletOri[24]) j ^= 2;
      if (cubePos.cubeletOri[22] !== cubePos.cubeletOri[25]) j ^= 1;
      if (j !== 0) return false;
    }

    const newpos = new Array(4);
    newpos[0] = perm2num(perm, 0, 4);
    newpos[1] = perm2num(perm, 4, 4);
    newpos[2] = perm2num(perm, 8, 4);
    newpos[3] = perm2num(perm, 12, 4);
    for (k = 0; k < 4; k++) if (cubePos.cubeletPerm[orbits[4][k]] === orbits[4][0]) break;
    newpos[3] = newpos[3] * 4 + k;
    if (superGroup) {
      j = 0;
      if (cubePos.cubeletOri[20] !== 0) j ^= 4;
      if (cubePos.cubeletOri[21] !== 0) j ^= 2;
      if (cubePos.cubeletOri[22] !== 0) j ^= 1;
      newpos[3] = (newpos[3] << 3) + j;
    }

    // risolve i corner (usando la stessa procedura dell'originale) per verificare la validita'
    if (perm[13] === 0) { swap(perm, 12, 13); swap(perm, 14, 15); }
    else if (perm[14] === 0) { swap(perm, 12, 14); swap(perm, 13, 15); }
    else if (perm[15] === 0) { swap(perm, 12, 15); swap(perm, 13, 14); }

    if (perm[14] === 1) { swap(perm, 13, 14); swap(perm, 16, 19); }
    else if (perm[15] === 1) { swap(perm, 13, 15); swap(perm, 17, 19); }

    if (perm[15] === 2) { swap(perm, 14, 15); swap(perm, 18, 19); }

    if (perm[17] === 0) { swap(perm, 16, 17); swap(perm, 18, 19); }
    else if (perm[18] === 0) { swap(perm, 16, 18); swap(perm, 17, 19); }
    else if (perm[19] === 0) { swap(perm, 16, 19); swap(perm, 17, 18); }
    if (perm[17] !== 1 || perm[18] !== 2 || perm[19] !== 3) return false;

    if (test) return true;
    if (!this.prepared) return false;

    if (this.positionlist == null) {
      this.positionlist = Array.from({ length: 40 }, () => [0, 0, 0, 0]);
      this.maxdepth = 0; this.sollen = 0;
      this.solmoves[0] = -1; this.solamount[0] = 3;
    } else if (this.positionlist[0][0] !== newpos[0] || this.positionlist[0][1] !== newpos[1]
      || this.positionlist[0][2] !== newpos[2] || this.positionlist[0][3] !== newpos[3]) {
      this.maxdepth = 0; this.sollen = 0;
      this.solmoves[0] = -1; this.solamount[0] = 3;
    }
    for (i = 0; i < 4; i++) this.positionlist[0][i] = newpos[i];
    return true;
  }

  solve(superGroup) {
    while (!this._search(superGroup)) this.maxdepth++;
    return true;
  }

  _search(superGroup) {
    let m, nxt;
    if (this.maxdepth === 0 && this.sollen === 0
      && this.positionlist[0][0] === 0 && this.positionlist[0][1] === 0
      && this.positionlist[0][2] === 0 && this.positionlist[0][3] === 0) return true;

    while (this.sollen >= 0) {
      nxt = this.sollen + 1;
      if (!this.positionlist[nxt]) this.positionlist[nxt] = [0, 0, 0, 0];
      m = this.solmoves[this.sollen];
      const nxtP = this.positionlist[nxt];
      // vedi nota in SolverTwoGen: si trasforma l'accumulatore nxtP, non il genitore.
      if (m >= 0) {
        nxtP[0] = this.transEdge[0][nxtP[0]][m];
        nxtP[1] = this.transEdge[1][nxtP[1]][m];
        nxtP[2] = this.transEdge[2][nxtP[2]][m];
        nxtP[3] = superGroup ? this.transCorn2[nxtP[3]][m] : this.transCorn[nxtP[3]][m];
      } else {
        const cur = this.positionlist[this.sollen];
        for (let i = 0; i < 4; i++) nxtP[i] = cur[i];
      }
      this.solamount[this.sollen] += 2;
      if (this.solamount[this.sollen] > 3) {
        this.solamount[this.sollen] = 0;
        do {
          this.solmoves[this.sollen]++;
        } while (this.sollen !== 0 && (this.solmoves[this.sollen] === this.solmoves[this.sollen - 1]
          || this.solmoves[this.sollen] === this.solmoves[this.sollen - 1] + 3));
        if (this.solmoves[this.sollen] >= 6) { this.sollen--; continue; }
        continue;
      }

      const p = nxtP;
      if (this.sollen + this.pruneEdge[p[0]][p[1]][p[2]] < this.maxdepth + 1
        && (superGroup || this.sollen + this.pruneCorn[p[3]] < this.maxdepth + 1)
        && (!superGroup || this.sollen + this.pruneCorn2[p[3]] < this.maxdepth + 1)) {
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

  init() {
    this.transEdge = [
      Array.from({ length: 24 }, () => new Array(6)),
      Array.from({ length: 24 }, () => new Array(6)),
      Array.from({ length: 24 }, () => new Array(6)),
    ];
    this.transCorn = Array.from({ length: 96 }, () => new Array(6));
    this.transCorn2 = Array.from({ length: 768 }, () => new Array(6));
    this.pruneEdge = Array.from({ length: 24 }, () => Array.from({ length: 24 }, () => new Int8Array(24)));
    this.pruneCorn = new Int8Array(96);
    this.pruneCorn2 = new Int8Array(768);

    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < 24; i++) {
        for (let m = 0; m < 6; m++) this.transEdge[k][i][m] = this._gettransEdge(k, i, m);
      }
    }
    for (let i = 0; i < 96; i++) for (let m = 0; m < 6; m++) this.transCorn[i][m] = this._gettransCorn(i, m);
    for (let i = 0; i < 768; i++) for (let m = 0; m < 6; m++) this.transCorn2[i][m] = this._gettransCorn2(i, m);

    let l = 1;
    this.pruneCorn[0] = 1;
    let k;
    do {
      k = 0;
      for (let i = 0; i < 96; i++) {
        if (this.pruneCorn[i] === l) {
          for (let m = 0; m < 6; m++) {
            const t = this.transCorn[i][m];
            if (this.pruneCorn[t] === 0) { this.pruneCorn[t] = l + 1; k++; }
          }
        }
      }
      l++;
    } while (k !== 0);

    l = 1;
    this.pruneCorn2[0] = 1;
    do {
      k = 0;
      for (let i = 0; i < 768; i++) {
        if (this.pruneCorn2[i] === l) {
          for (let m = 0; m < 6; m++) {
            const t = this.transCorn2[i][m];
            if (this.pruneCorn2[t] === 0) { this.pruneCorn2[t] = l + 1; k++; }
          }
        }
      }
      l++;
    } while (k !== 0);

    l = 1;
    this.pruneEdge[0][0][0] = 1;
    do {
      k = 0;
      for (let i = 0; i < 24; i++) {
        for (let i2 = 0; i2 < 24; i2++) {
          for (let i3 = 0; i3 < 24; i3++) {
            if (this.pruneEdge[i][i2][i3] === l) {
              for (let m = 0; m < 6; m++) {
                const a = this.transEdge[0][i][m];
                const b = this.transEdge[1][i2][m];
                const c = this.transEdge[2][i3][m];
                if (this.pruneEdge[a][b][c] === 0) { this.pruneEdge[a][b][c] = l + 1; k++; }
              }
            }
          }
        }
      }
      l++;
    } while (k !== 0);

    this.prepared = true;
  }

  _gettransEdge(slice, pos, m) {
    const edges = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3];
    num2perm(edges, slice * 4, 4, pos);
    if (m === 0) { swap(edges, 2, 3); swap(edges, 6, 7); }
    else if (m === 1) { swap(edges, 0, 3); swap(edges, 8, 11); }
    else if (m === 2) { swap(edges, 5, 6); swap(edges, 8, 9); }
    else if (m === 3) { swap(edges, 0, 1); swap(edges, 4, 5); }
    else if (m === 4) { swap(edges, 1, 2); swap(edges, 9, 10); }
    else if (m === 5) { swap(edges, 4, 7); swap(edges, 10, 11); }
    return perm2num(edges, slice * 4, 4);
  }

  _gettransCorn(pos, m) {
    const corners = [0, 1, 2, 3, 0, 0, 0, 0];
    num2perm(corners, 0, 4, pos >> 2);
    corners[4 + (pos & 3)] = 1;
    if (m === 0) { swap(corners, 1, 3); swap(corners, 5, 7); }
    else if (m === 1) { swap(corners, 0, 1); swap(corners, 4, 5); }
    else if (m === 2) { swap(corners, 1, 2); swap(corners, 4, 7); }
    else if (m === 3) { swap(corners, 0, 2); swap(corners, 4, 6); }
    else if (m === 4) { swap(corners, 2, 3); swap(corners, 6, 7); }
    else if (m === 5) { swap(corners, 0, 3); swap(corners, 5, 6); }
    return perm2num(corners, 0, 4) * 4 + corners[5] + corners[6] * 2 + corners[7] * 3;
  }

  _gettransCorn2(pos, m) {
    const corners = [0, 1, 2, 3, 0, 0, 0, 0];
    num2perm(corners, 0, 4, pos >> 5);
    corners[4 + ((pos >> 3) & 3)] = 1;
    let c = pos & 7;
    if (m === 0) { swap(corners, 1, 3); swap(corners, 5, 7); c ^= 4; }
    else if (m === 1) { swap(corners, 0, 1); swap(corners, 4, 5); c ^= 2; }
    else if (m === 2) { swap(corners, 1, 2); swap(corners, 4, 7); c ^= 1; }
    else if (m === 3) { swap(corners, 0, 2); swap(corners, 4, 6); }
    else if (m === 4) { swap(corners, 2, 3); swap(corners, 6, 7); }
    else if (m === 5) { swap(corners, 0, 3); swap(corners, 5, 6); }
    return (perm2num(corners, 0, 4) << 5) + ((corners[5] + corners[6] * 2 + corners[7] * 3) << 3) + c;
  }
}
