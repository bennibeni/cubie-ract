// MoveSequence.simplify can combine opposite faces into slice/anti-slice moves.
// The UI exposes only individual outer faces, so expand those combinations.
export function expandFaceMove(face, amount) {
  if (!Number.isInteger(face) || ![1, 2, 3].includes(amount)) throw new Error('Mossa non valida.');
  if (face >= 0 && face < 6) return [{ face, amount }];
  if (face >= 12 && face < 15) return [
    { face: face - 12, amount }, { face: face - 9, amount: 4 - amount },
  ];
  if (face >= 15 && face < 18) return [
    { face: face - 15, amount }, { face: face - 12, amount },
  ];
  throw new Error('La soluzione contiene una rotazione non supportata dai pulsanti.');
}
