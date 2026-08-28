// Porting delle utility generiche di Solver.java, usate da tutti i solver a ricerca IDA*.

export function swap(pr, i, j) {
  const c = pr[i]; pr[i] = pr[j]; pr[j] = c;
}

export function cycle(pr, i, j, k, l) {
  const c = pr[i]; pr[i] = pr[j]; pr[j] = pr[k]; pr[k] = pr[l]; pr[l] = c;
}

// vero se la permutazione pieces[start..start+len-1] e' dispari
export function parityOdd(pieces, start, len) {
  let p = false;
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < i; j++) {
      p = p !== pieces[start + i] < pieces[start + j];
    }
  }
  return p;
}

// converte un numero in una permutazione di 0..len-1, scritta in pieces[start..]
export function num2perm(pieces, start, len, pos0) {
  let pos = pos0;
  const w = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  for (let i = 0; i < len; i++) {
    const r = pos % (len - i);
    pos = (pos - r) / (len - i);
    pieces[start + i] = w[r];
    for (let k = r + 1; k < len; k++) w[k - 1] = w[k];
  }
}

// converte un numero in una permutazione parziale di np pezzi (numerati p0..p0+np-1)
// tra len posizioni 0..len-1
export function num2partperm(pieces, start, len, np, p0, pos0) {
  let pos = pos0;
  for (let i = 0; i < np; i++) {
    const r0 = pos % (len - i);
    pos = (pos - r0) / (len - i);
    let r = r0;
    let j = start;
    while (j < start + len && ((pieces[j] >= p0 && pieces[j] < p0 + np) || r > 0)) {
      if (pieces[j] < p0 || pieces[j] >= p0 + np) r--;
      j++;
    }
    pieces[j] = p0 + i;
  }
}

// converte un numero in un'orientazione di 0..val-1, scritta in pieces[start..start+len-1]
export function num2ori(pieces, start, len, val, pos0) {
  let pos = pos0;
  let j = 0;
  for (let i = 0; i < len - 1; i++) {
    const k = pos % val;
    j += val - k;
    pos = (pos - k) / val;
    pieces[start + i] = k;
  }
  pieces[start + len - 1] = j % val;
}

export function ori2num(pieces, start, len, val) {
  let j = 0;
  for (let i = len - 2; i >= 0; i--) j = j * val + (pieces[start + i] % val);
  return j;
}

export function perm2num(pieces, start, len) {
  let p = 0;
  for (let i = len - 1; i >= 0; i--) {
    let r = 0;
    for (let j = i + 1; j < len; j++) {
      if (pieces[start + j] < pieces[start + i]) r++;
    }
    p = p * (len - i) + r;
  }
  return p;
}

export function partperm2num(perm, len, start, p0, np) {
  let pos = 0;
  for (let i = np - 1; i >= 0; i--) {
    let r = 0;
    for (let j = 0; j < len; j++) {
      if (perm[start + j] === p0 + i) break;
      if (perm[start + j] < p0 || perm[start + j] > p0 + i) r++;
    }
    pos = pos * (len - i) + r;
  }
  return pos;
}
