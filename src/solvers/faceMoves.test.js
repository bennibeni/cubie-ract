import test from 'node:test';
import assert from 'node:assert/strict';
import CubePosition from '../cube/CubePosition.js';
import MoveSequence from '../cube/MoveSequence.js';
import { expandFaceMove } from './faceMoves.js';

test('all combined opposite-face moves expand to equivalent playable moves', () => {
  for (let face = 12; face < 18; face++) for (const amount of [1, 2, 3]) {
    const a = new CubePosition(), b = new CubePosition();
    for (const cube of [a,b]) { cube.doMove(2,1); cube.doMove(1,3); cube.doMove(3,2); }
    a.doMove(face,amount);
    const moves = expandFaceMove(face,amount);
    for (const move of moves) {
      assert.ok(move.face >= 0 && move.face < 6);
      b.doMove(move.face,move.amount);
    }
    assert.deepEqual(b.cubeletPerm,a.cubeletPerm);
    assert.deepEqual(b.cubeletOri,a.cubeletOri);
    assert.deepEqual(b.getFaceletColors(),a.getFaceletColors());
  }
});
test('regression: simplified L R and L R prime never reach UI as unnamed faces', () => {
  for (const text of ['L R', "L R'", 'U2 D2', "F B'"]) {
    const sequence = new MoveSequence(); sequence.parse(text,false);
    assert.ok(sequence.getMoves().some(face => face >= 12));
    const moves = sequence.getMoves().flatMap((face,i) => expandFaceMove(face,sequence.getAmount()[i]));
    assert.ok(moves.every(move => 'LUFRDB'[move.face] !== undefined));
  }
});
