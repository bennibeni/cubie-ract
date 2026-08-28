import MoveSequence from '../cube/MoveSequence';
import {
  cycle, parityOdd, num2perm, num2ori, ori2num, perm2num,
} from './solverUtils';

// Porting di SolverTwoGen.java: risolve il sottogruppo generato dalle sole mosse U e R
// (<U,R>). Le tabelle sono piccole (max 5040 stati) quindi si possono costruire in modo
// sincrono al primo utilizzo, senza bisogno di un web worker.
export default class SolverTwoGen {
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
    for (let i = 0; i < this.sollen; i++) m[i] = this.solmoves[i] * 2 + 1;
    return new MoveSequence(this.sollen, m, this.solamount);
  }

  // mescola il cubo con una posizione casuale all'interno del gruppo <U,R>
  mix(cubePos) {
    let i, j;
    cubePos.reset();
    j = Math.floor(6 * Math.random());
    if (j === 4) cubePos.doMove(3);
    else if (j < 4) {
      while (j > 0) { cubePos.doMove(1); j--; }
      cubePos.doMove(3); cubePos.doMove(3);
    }
    j = Math.floor(5 * Math.random());
    if (j < 4) {
      while (j > 0) { cubePos.doMove(1); j--; }
      cubePos.doMove(3); cubePos.doMove(3); cubePos.doMove(3);
      cubePos.doMove(1); cubePos.doMove(3);
    }
    j = Math.floor(4 * Math.random());
    while (j > 0) { cubePos.doMove(1); j--; }

    num2ori(cubePos.cubeletOri, 0, 6, 3, Math.floor(243 * Math.random()));

    const edges = [8, 9, 10, 11, 12, 13, 16];
    const pr = new Array(7);
    do {
      num2perm(pr, 0, 7, Math.floor(5040 * Math.random()));
    } while (parityOdd(pr, 0, 7) !== parityOdd(cubePos.cubeletPerm, 0, 6));
    for (i = 0; i < 7; i++) {
      cubePos.cubeletPerm[edges[i]] = edges[pr[i]];
      j = (i === 4 || i === 5) ? 1 : 0;
      if (pr[i] === 4 || pr[i] === 5) j = 1 - j;
      cubePos.cubeletOri[edges[i]] = j;
    }

    i = Math.floor(8 * Math.random());
    cubePos.cubeletOri[21] = i & 3;
    cubePos.cubeletOri[23] = (i & 4) >> 1;
    if (parityOdd(cubePos.cubeletPerm, 0, 6)) {
      cubePos.cubeletOri[23] += 1 - (i & 1);
    } else {
      cubePos.cubeletOri[23] += (i & 1);
    }
  }

  setPosition(cubePos, test, superGroup) {
    let i, j;
    const block = [6, 7, 14, 15, 17, 18, 19];
    for (i = 0; i < 7; i++) {
      if (cubePos.cubeletOri[block[i]] !== 0 || cubePos.cubeletPerm[block[i]] !== block[i]) return false;
    }

    j = 0;
    for (i = 0; i < 8; i++) { j += cubePos.cubeletOri[i]; if (j > 2) j -= 3; }
    if (j !== 0) return false;

    for (i = 8; i < 20; i++) {
      j = cubePos.cubeletOri[i];
      if (i >= 12 && i < 16) j = 1 - j;
      if (cubePos.cubeletPerm[i] >= 12 && cubePos.cubeletPerm[i] < 16) j = 1 - j;
      if (j !== 0) return false;
    }

    if (parityOdd(cubePos.cubeletPerm, 0, 20)) return false;

    if (superGroup) {
      if (cubePos.cubeletOri[20] !== 0 || cubePos.cubeletOri[22] !== 0
        || cubePos.cubeletOri[24] !== 0 || cubePos.cubeletOri[25] !== 0) return false;
      if (parityOdd(cubePos.cubeletPerm, 0, 8)) {
        if ((cubePos.cubeletOri[21] & 1) === (cubePos.cubeletOri[23] & 1)) return false;
      } else if ((cubePos.cubeletOri[21] & 1) !== (cubePos.cubeletOri[23] & 1)) return false;
    }

    const corn = new Array(7);
    for (i = 0; i < 6; i++) corn[i] = cubePos.cubeletPerm[i];
    if (corn[1] === 0) cycle(corn, 1, 2, 3, 0);
    else if (corn[2] === 0) cycle(corn, 2, 1, 5, 0);
    else if (corn[3] === 0) cycle(corn, 3, 2, 1, 0);
    else if (corn[4] === 0) cycle(corn, 4, 5, 1, 0);
    else if (corn[5] === 0) cycle(corn, 5, 1, 2, 0);

    if (corn[2] === 1) cycle(corn, 2, 5, 4, 1);
    else if (corn[3] === 1) cycle(corn, 3, 2, 5, 1);
    else if (corn[4] === 1) cycle(corn, 4, 5, 2, 1);
    else if (corn[5] === 1) cycle(corn, 5, 2, 3, 1);

    while (corn[3] === 2 || corn[4] === 2 || corn[5] === 2) cycle(corn, 2, 3, 5, 4);

    if (corn[3] !== 3 || corn[4] !== 4 || corn[5] !== 5) return false;

    if (test) return true;
    if (!this.prepared) return false;

    const newpos = [0, 0, 0];
    for (i = 0; i < 6; i++) corn[i] = cubePos.cubeletPerm[i];
    newpos[0] = perm2num(corn, 0, 6);
    const edg = [8, 9, 10, 11, 12, 13, 16];
    for (i = 0; i < 7; i++) corn[i] = cubePos.cubeletPerm[edg[i]];
    newpos[1] = perm2num(corn, 0, 7);
    newpos[2] = 0;
    for (i = 4; i >= 0; i--) newpos[2] = newpos[2] * 3 + cubePos.cubeletOri[i];
    if (superGroup) {
      newpos[2] = (newpos[2] << 4) + (cubePos.cubeletOri[23] << 2) + cubePos.cubeletOri[21];
    }

    if (this.positionlist == null) {
      this.positionlist = Array.from({ length: 40 }, () => [0, 0, 0]);
      this.maxdepth = 0; this.sollen = 0;
      this.solmoves[0] = -1; this.solamount[0] = 3;
    } else if (this.positionlist[0][0] !== newpos[0]
      || this.positionlist[0][1] !== newpos[1]
      || this.positionlist[0][2] !== newpos[2]) {
      this.maxdepth = 0; this.sollen = 0;
      this.solmoves[0] = -1; this.solamount[0] = 3;
    }
    [this.positionlist[0][0], this.positionlist[0][1], this.positionlist[0][2]] = newpos;
    return true;
  }

  init() {
    let i, m;
    this.transEdge = Array.from({ length: 5040 }, () => [0, 0]);
    this.transCorn = Array.from({ length: 720 }, () => [0, 0]);
    this.transOri = Array.from({ length: 243 }, () => [0, 0]);
    this.transOri2 = Array.from({ length: 3888 }, () => [0, 0]);
    this.pruneEdge = new Int8Array(5040);
    this.pruneCorn = new Int8Array(720);
    this.pruneOri = new Int8Array(243);
    this.pruneOri2 = new Int8Array(3888);

    for (i = 0; i < 5040; i++) for (m = 0; m < 2; m++) this.transEdge[i][m] = this._gettransEdge(i, m);
    for (i = 0; i < 720; i++) for (m = 0; m < 2; m++) this.transCorn[i][m] = this._gettransCorn(i, m);
    for (i = 0; i < 243; i++) for (m = 0; m < 2; m++) this.transOri[i][m] = this._gettransOri(i, m);
    for (i = 0; i < 3888; i++) for (m = 0; m < 2; m++) this.transOri2[i][m] = this._gettransOri2(i, m);

    this._fillPrune(this.pruneEdge, this.transEdge, 5040, 2, [0]);
    this._fillPrune(this.pruneCorn, this.transCorn, 720, 2, [0]);
    this._fillPrune(this.pruneOri, this.transOri, 243, 2, [0]);
    this._fillPrune(this.pruneOri2, this.transOri2, 3888, 2, [0]);

    this.prepared = true;
  }

  _fillPrune(prune, trans, size, nMoves, starts) {
    let l = 1;
    starts.forEach((s) => { prune[s] = 1; });
    let k;
    do {
      k = 0;
      for (let i = 0; i < size; i++) {
        if (prune[i] === l) {
          for (let m = 0; m < nMoves; m++) {
            let p = i;
            for (let q = 0; q < 3; q++) {
              p = trans[p][m];
              if (prune[p] === 0) { prune[p] = l + 1; k++; }
            }
          }
        }
      }
      l++;
    } while (k !== 0);
  }

  _gettransEdge(pos, m) {
    const edges = new Array(7);
    num2perm(edges, 0, 7, pos);
    if (m === 0) cycle(edges, 0, 3, 2, 1);
    else if (m === 1) cycle(edges, 0, 5, 6, 4);
    return perm2num(edges, 0, 7);
  }

  _gettransCorn(pos, m) {
    const corn = new Array(6);
    num2perm(corn, 0, 6, pos);
    if (m === 0) cycle(corn, 0, 3, 2, 1);
    else if (m === 1) cycle(corn, 0, 1, 5, 4);
    return perm2num(corn, 0, 6);
  }

  _gettransOri(pos, m) {
    const corn = new Array(6);
    num2ori(corn, 0, 6, 3, pos);
    if (m === 0) cycle(corn, 0, 3, 2, 1);
    else if (m === 1) {
      cycle(corn, 0, 1, 5, 4);
      corn[0] += 2; corn[1]++; corn[5] += 2; corn[4]++;
    }
    return ori2num(corn, 0, 6, 3);
  }

  _gettransOri2(pos, m) {
    const corn = new Array(8);
    num2ori(corn, 0, 6, 3, pos >> 4);
    corn[6] = pos & 3;
    corn[7] = (pos >> 2) & 3;
    if (m === 0) {
      cycle(corn, 0, 3, 2, 1);
      corn[6] = (corn[6] + 3) & 3;
    } else if (m === 1) {
      cycle(corn, 0, 1, 5, 4);
      corn[0] += 2; corn[1]++; corn[5] += 2; corn[4]++;
      corn[7] = (corn[7] + 3) & 3;
    }
    return (ori2num(corn, 0, 6, 3) << 4) + (corn[7] << 2) + corn[6];
  }

  // risolve sincronamente con IDA*, restituisce true se trovata una soluzione
  solve(superGroup) {
    while (!this._search(superGroup)) this.maxdepth++;
    return true;
  }

  _search(superGroup) {
    let m, nxt;
    if (this.maxdepth === 0 && this.sollen === 0
      && this.positionlist[0][0] === 0 && this.positionlist[0][1] === 0 && this.positionlist[0][2] === 0) return true;

    while (this.sollen >= 0) {
      nxt = this.sollen + 1;
      if (!this.positionlist[nxt]) this.positionlist[nxt] = [0, 0, 0];
      m = this.solmoves[this.sollen];
      // NB: quando m>=0 la trasformazione si applica al valore GIA' presente in
      // positionlist[nxt] (accumulatore), non a positionlist[sollen]: e' cosi' che
      // l'algoritmo originale costruisce 1,2,3 quarti di giro successivi della stessa
      // faccia riusando la stessa cella. Va copiato da positionlist[sollen] SOLO
      // quando si inizia una nuova mossa (m<0, dummy).
      if (m >= 0) {
        this.positionlist[nxt][0] = this.transCorn[this.positionlist[nxt][0]][m];
        this.positionlist[nxt][1] = this.transEdge[this.positionlist[nxt][1]][m];
        if (superGroup) {
          this.positionlist[nxt][2] = this.transOri2[this.positionlist[nxt][2]][m];
        } else {
          this.positionlist[nxt][2] = this.transOri[this.positionlist[nxt][2]][m];
        }
      } else {
        this.positionlist[nxt][0] = this.positionlist[this.sollen][0];
        this.positionlist[nxt][1] = this.positionlist[this.sollen][1];
        this.positionlist[nxt][2] = this.positionlist[this.sollen][2];
      }
      this.solamount[this.sollen]++;
      if (this.solamount[this.sollen] > 3) {
        this.solamount[this.sollen] = 0;
        do {
          this.solmoves[this.sollen]++;
        } while (this.sollen !== 0 && this.solmoves[this.sollen] === this.solmoves[this.sollen - 1]);
        if (this.solmoves[this.sollen] >= 2) { this.sollen--; continue; }
        continue;
      }

      const p = this.positionlist[nxt];
      if (this.sollen + this.pruneCorn[p[0]] < this.maxdepth + 1
        && this.sollen + this.pruneEdge[p[1]] < this.maxdepth + 1
        && (superGroup || this.sollen + this.pruneOri[p[2]] < this.maxdepth + 1)
        && (!superGroup || this.sollen + this.pruneOri2[p[2]] < this.maxdepth + 1)) {
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
