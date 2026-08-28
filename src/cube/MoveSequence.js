// Porting fedele di MoveSequence.java.
// Codifica mossa: m=0-5 normale, m=6-8 slice centrale, m=9-11 rotazione cubo,
// m=12-14 slice, m=15-17 anti-slice. amount: 1=', 2=2, 3=normale (in notazione interna
// l'ampiezza e' memorizzata "invertita": si legga toString() per la conversione in stringa).

const symPerm = [
  [3, 4, 5, 0, 1, 2],
  [5, 1, 3, 2, 4, 0], [0, 2, 1, 3, 5, 4], [4, 3, 2, 1, 0, 5], [2, 1, 0, 5, 4, 3], [0, 5, 4, 3, 2, 1], [1, 0, 2, 4, 3, 5],
  [0, 4, 2, 3, 1, 5], [3, 1, 2, 0, 4, 5], [0, 1, 5, 3, 4, 2],
  [2, 4, 3, 5, 1, 0], [3, 2, 4, 0, 5, 1], [4, 0, 5, 1, 3, 2],
  [3, 1, 5, 0, 4, 2], [0, 4, 5, 3, 1, 2], [3, 4, 2, 0, 1, 5],
  [5, 1, 0, 2, 4, 3], [0, 5, 1, 3, 2, 4], [1, 3, 2, 4, 0, 5],
  [5, 0, 4, 2, 3, 1], [1, 2, 0, 4, 5, 3], [4, 5, 0, 1, 2, 3], [5, 3, 1, 2, 0, 4],
  [5, 4, 3, 2, 1, 0], [3, 2, 1, 0, 5, 4], [4, 3, 5, 1, 0, 2],
  [2, 4, 0, 5, 1, 3], [3, 5, 4, 0, 2, 1], [1, 0, 5, 4, 3, 2],
];

export default class MoveSequence {
  constructor(l, mvs, amt) {
    this.len = 0;
    this.moves = [];
    this.amount = [];
    if (l !== undefined) {
      // dato un elenco di mosse di risoluzione, costruisce la sequenza generatrice (inversa)
      this.len = l;
      this.moves = new Array(l);
      this.amount = new Array(l);
      for (let i = 0; i < l; i++) {
        this.amount[i] = 4 - amt[l - 1 - i];
        this.moves[i] = mvs[l - 1 - i];
      }
      this.simplify();
    }
  }

  getMoves() { return this.moves; }
  getAmount() { return this.amount; }
  getLength() { return this.len; }

  toString(inverse = false, pos = -1) {
    let i, di;
    let qtm = 0, ftm = 0, stm = 0;
    let sol = '';
    if (this.len === 0) return '';
    if (inverse) { i = this.len - 1; di = -1; } else { i = 0; di = 1; }
    while (i >= 0 && i < this.len) {
      if ((i === pos && di > 0) || (i + 1 === pos && di < 0)) sol += '_ ';
      let q = this.amount[i];
      const m = this.moves[i];
      if (inverse) q = 4 - q;
      let j;
      if (m < 6) {
        sol += 'LUFRDB'.charAt(m);
        j = 1;
      } else {
        sol += 'LUF'.charAt(m % 3);
        sol += 'xxmcsa'.charAt(Math.floor(m / 3));
        j = (m < 9 || m > 11) ? 2 : 0;
      }
      if (q > 1) sol += "2'".charAt(q - 2);
      if (q === 2) qtm += j;
      qtm += j; ftm += j; if (j !== 0) stm++;
      i += di;
      sol += ' ';
    }
    if ((pos === this.len && di > 0) || (pos === 0 && di < 0)) sol += '_ ';
    if (qtm !== 0) {
      sol += `(${ftm}`;
      if (ftm !== qtm) sol += `,${qtm}q`;
      if (stm !== ftm) sol += `,${stm}s`;
      sol += ')';
    }
    return sol;
  }

  parse(inp, inverse) {
    const mv = new Array(80);
    const am = new Array(80);
    let ln = 0;
    let c, m = -1, q = -1, t = -1, i = 0, p = 0;
    while ((i !== 0 || p < inp.length) && ln < 80) {
      c = p < inp.length ? inp.charAt(p) : '\0';
      if (i === 0) {
        p++;
        m = 'LUFRDBTlufrdbt'.indexOf(c);
        if (m < 0) continue;
        if (m > 6) m -= 7;
        if (m === 6) m = 1;
        i++;
      } else if (i === 1) {
        t = 'mcsaMCSA'.indexOf(c);
        if (t >= 4) t -= 4;
        if (t >= 0) p++;
        i++;
      } else if (i === 2) {
        q = "1+23'-".indexOf(c);
        if (q >= 0) p++; else q = 1;
        if (q > 3) q = 3;
        else if (q <= 1) q = 1;
        if (t >= 0 && m > 2) {
          m -= 3;
          if (t !== 3) q = 4 - q;
        }
        mv[ln] = t < 0 ? m : m + 6 + 3 * t;
        am[ln] = q;
        ln++;
        i = 0;
      }
    }
    this.len = ln;
    this.moves = new Array(ln);
    this.amount = new Array(ln);
    for (i = 0; i < ln; i++) { this.moves[i] = mv[i]; this.amount[i] = am[i]; }
    this.simplify();
    if (inverse) {
      let tt;
      for (i = 0, tt = this.len - 1; i < tt; i++, tt--) {
        q = this.moves[i]; this.moves[i] = this.moves[tt]; this.moves[tt] = q;
        q = this.amount[i]; this.amount[i] = 4 - this.amount[tt]; this.amount[tt] = 4 - q;
      }
      if (i === tt) this.amount[i] = 4 - this.amount[i];
    }
  }

  simplify() {
    let { len } = this;
    const axis = new Array(len);
    const type = new Array(len);
    for (let i = 0; i < len; i++) {
      axis[i] = this.moves[i] % 3;
      type[i] = (this.moves[i] - axis[i]) / 3;
    }

    let i = 0;
    while (i < len) {
      const turns = [0, 0, 0];
      let j;
      for (j = i; j < len && axis[i] === axis[j]; j++) {
        switch (type[j]) {
          case 0: turns[0] += this.amount[j]; break;
          case 1: turns[2] += this.amount[j]; break;
          case 2: turns[1] += this.amount[j]; break;
          case 3: turns[0] += this.amount[j]; turns[1] += this.amount[j]; turns[2] -= this.amount[j]; break;
          case 4: turns[0] += this.amount[j]; turns[2] -= this.amount[j]; break;
          case 5: turns[0] += this.amount[j]; turns[2] += this.amount[j]; break;
          default: break;
        }
      }

      if (j <= i + 1) { i++; continue; }

      turns[0] &= 3; turns[1] &= 3; turns[2] &= 3;
      if (turns[0] === 0 && turns[1] === 0 && turns[2] === 0) {
        // annichilazione
      } else if (turns[0] === turns[1] && turns[0] + turns[2] === 4) {
        this.amount[i] = turns[0]; type[i] = 3; this.moves[i] = 9 + axis[i]; i++;
      } else if (turns[1] === 0 && turns[2] === 0) {
        this.amount[i] = turns[0]; type[i] = 0; this.moves[i] = axis[i]; i++;
      } else if (turns[0] === 0 && turns[1] === 0) {
        this.amount[i] = turns[2]; type[i] = 1; this.moves[i] = 3 + axis[i]; i++;
      } else if (turns[0] === 0 && turns[2] === 0) {
        this.amount[i] = turns[1]; type[i] = 2; this.moves[i] = 6 + axis[i]; i++;
      } else if (turns[1] === 0 && turns[0] + turns[2] === 4) {
        this.amount[i] = turns[0]; type[i] = 4; this.moves[i] = 12 + axis[i]; i++;
      } else if (turns[1] === 0 && turns[0] === turns[2]) {
        this.amount[i] = turns[0]; type[i] = 5; this.moves[i] = 15 + axis[i]; i++;
      } else if (turns[0] === turns[1]) {
        this.amount[i] = turns[0]; type[i] = 3; this.moves[i] = 9 + axis[i]; i++;
        this.amount[i] = (turns[2] + turns[0]) & 3; type[i] = 1; this.moves[i] = 3 + axis[i]; i++;
      } else if (turns[2] + turns[1] === 4) {
        this.amount[i] = turns[1]; type[i] = 3; this.moves[i] = 9 + axis[i]; i++;
        this.amount[i] = (turns[0] + turns[2]) & 3; type[i] = 0; this.moves[i] = axis[i]; i++;
      } else if (turns[2] + turns[0] === 4) {
        this.amount[i] = turns[1]; type[i] = 3; this.moves[i] = 9 + axis[i]; i++;
        this.amount[i] = (turns[0] - turns[1]) & 3; type[i] = 4; this.moves[i] = 12 + axis[i]; i++;
      } else if (((turns[0] - 2 * turns[1] - turns[2]) & 3) === 0) {
        this.amount[i] = turns[1]; type[i] = 3; this.moves[i] = 9 + axis[i]; i++;
        this.amount[i] = (turns[0] - turns[1]) & 3; type[i] = 5; this.moves[i] = 15 + axis[i]; i++;
      } else if (turns[0] === 0 || turns[1] === 0 || turns[2] === 0) {
        if (turns[0] !== 0) { this.amount[i] = turns[0]; type[i] = 0; this.moves[i] = axis[i]; i++; }
        if (turns[1] !== 0) { this.amount[i] = turns[1]; type[i] = 2; this.moves[i] = 6 + axis[i]; i++; }
        if (turns[2] !== 0) { this.amount[i] = turns[2]; type[i] = 1; this.moves[i] = 3 + axis[i]; i++; }
      } else {
        this.amount[i] = (turns[0] - turns[1]) & 3; type[i] = 0; this.moves[i] = axis[i]; i++;
        this.amount[i] = turns[1]; type[i] = 3; this.moves[i] = 9 + axis[i]; i++;
        this.amount[i] = (turns[1] + turns[2]) & 3; type[i] = 1; this.moves[i] = 3 + axis[i]; i++;
      }

      const shrink = j - i;
      len -= shrink;
      for (let k = i; k < len; k++) {
        this.moves[k] = this.moves[k + shrink];
        this.amount[k] = this.amount[k + shrink];
        axis[k] = axis[k + shrink];
        type[k] = type[k + shrink];
      }
    }
    this.len = len;
    this.moves.length = len;
    this.amount.length = len;
  }

  doSym(s) {
    for (let i = 0; i < this.len; i++) {
      let q = this.amount[i];
      let m = this.moves[i];
      if (s < 13) q = 4 - q;
      if (m < 6) {
        m = symPerm[s][m];
      } else {
        const t = Math.floor((m - 6) / 3);
        m %= 3;
        m = symPerm[s][m];
        if (m > 2) {
          m -= 3;
          if (t < 3) q = 4 - q;
        }
        m = 6 + 3 * t + m;
      }
      this.amount[i] = q;
      this.moves[i] = m;
    }
  }
}
