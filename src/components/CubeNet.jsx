import { FACE_COLORS, NET_LAYOUT } from '../cube/constants';

const CELL = 34;
const FACE = CELL * 3;
const GAP = 4;

export default function CubeNet({ faceletColor }) {
  const width = FACE * 4 + GAP * 3;
  const height = FACE * 3 + GAP * 2;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ background: '#111', borderRadius: 8 }}>
      {NET_LAYOUT.map(({ face, col, row }) => {
        const ox = col * (FACE + GAP);
        const oy = row * (FACE + GAP);
        const cells = [];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const faceletIndex = face * 9 + r * 3 + c;
            const colorIdx = faceletColor[faceletIndex];
            cells.push(
              <rect
                key={faceletIndex}
                x={ox + c * CELL + 1.5}
                y={oy + r * CELL + 1.5}
                width={CELL - 3}
                height={CELL - 3}
                rx={3}
                fill={colorIdx >= 0 ? FACE_COLORS[colorIdx] : '#333'}
                stroke="#000"
                strokeWidth={1}
              />,
            );
          }
        }
        return <g key={face}>{cells}</g>;
      })}
    </svg>
  );
}
