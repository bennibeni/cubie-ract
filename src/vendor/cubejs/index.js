// Punto di ingresso del cubejs vendorizzato (vedi cube.js per la nota di provenienza).
// solve.js estende Cube.prototype in-place: e' fondamentale importarlo qui prima
// di usare Cube altrove, cosi' il metodo .solve() e' sempre disponibile.
import Cube from './cube.js';
import './solve.js';

export default Cube;
