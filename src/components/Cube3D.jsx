import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CUBIE_SLOTS } from './cubieGeometry';
import { FACE_COLORS } from '../cube/constants';
import { ANIMATION_DURATION_MS } from './moveAnimation';

const CUBIE_SIZE = 0.95;
const GAP = 1.02;
const STICKER_SIZE = 0.82;
const STICKER_OFFSET = 0.481;

const SLOT_BY_INDEX = new Map(CUBIE_SLOTS.map((s) => [s.index, s]));

// il piano di three.js ha normale di default +z: ruotiamo ciascuno sticker
// perche' la sua normale coincida con la direzione della faccia della cubie
const ROTATION_FOR_NORMAL = {
  '0,0,1': [0, 0, 0],
  '0,0,-1': [0, Math.PI, 0],
  '1,0,0': [0, Math.PI / 2, 0],
  '-1,0,0': [0, -Math.PI / 2, 0],
  '0,1,0': [-Math.PI / 2, 0, 0],
  '0,-1,0': [Math.PI / 2, 0, 0],
};

function Sticker({ normal, colorIdx }) {
  const [nx, ny, nz] = normal;
  const rotation = ROTATION_FOR_NORMAL[`${nx},${ny},${nz}`];
  const color = colorIdx >= 0 ? FACE_COLORS[colorIdx] : '#333333';
  return (
    <mesh position={[nx * STICKER_OFFSET, ny * STICKER_OFFSET, nz * STICKER_OFFSET]} rotation={rotation}>
      <planeGeometry args={[STICKER_SIZE, STICKER_SIZE]} />
      <meshStandardMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Cubie({ slot, faceletColor }) {
  return (
    <group position={slot.position.map((v) => v * GAP)}>
      <mesh>
        <boxGeometry args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} />
        <meshStandardMaterial color="#0c0c0c" />
      </mesh>
      {slot.stickers.map((sticker) => (
        <Sticker key={sticker.facelet} normal={sticker.normal} colorIdx={faceletColor[sticker.facelet]} />
      ))}
    </group>
  );
}

// ruota un gruppo di cubie da 0 all'angolo finale nell'arco di ANIMATION_DURATION_MS;
// le coordinate delle cubie sono gia' relative al centro del cubo, quindi la rotazione
// del group avviene correttamente attorno all'origine
function RotatingGroup({ group, faceletColor }) {
  const ref = useRef();
  const elapsedRef = useRef(0);
  const axisVec = useMemo(
    () => new THREE.Vector3(...group.axis).normalize(),
    [group.axis],
  );
  const angleRad = (group.angleDeg * Math.PI) / 180;

  useFrame((_, delta) => {
    elapsedRef.current = Math.min(ANIMATION_DURATION_MS, elapsedRef.current + delta * 1000);
    const t = elapsedRef.current / ANIMATION_DURATION_MS;
    const eased = 1 - (1 - t) ** 2; // ease-out: parte veloce, rallenta in chiusura
    if (ref.current) {
      ref.current.quaternion.setFromAxisAngle(axisVec, angleRad * eased);
    }
  });

  return (
    <group ref={ref}>
      {group.slots.map((idx) => (
        <Cubie key={idx} slot={SLOT_BY_INDEX.get(idx)} faceletColor={faceletColor} />
      ))}
    </group>
  );
}

export default function Cube3D({ faceletColor, animation }) {
  const animatedIndices = useMemo(() => {
    if (!animation) return new Set();
    return new Set(animation.groups.flatMap((g) => g.slots));
  }, [animation]);

  const staticSlots = useMemo(
    () => CUBIE_SLOTS.filter((s) => !animatedIndices.has(s.index)),
    [animatedIndices],
  );

  return (
    <div style={{ width: 320, height: 320, borderRadius: 8, overflow: 'hidden' }}>
      <Canvas camera={{ position: [4.2, 3.6, 5], fov: 42 }}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[5, 8, 6]} intensity={0.6} />
        <directionalLight position={[-6, -4, -5]} intensity={0.25} />
        {staticSlots.map((slot) => (
          <Cubie key={slot.index} slot={slot} faceletColor={faceletColor} />
        ))}
        {animation && animation.groups.map((group, i) => (
          // key include l'id dell'animazione per resettare lo stato interno ad ogni mossa
          <RotatingGroup key={`${animation.id}-${i}`} group={group} faceletColor={faceletColor} />
        ))}
        <OrbitControls enablePan={false} minDistance={4} maxDistance={12} />
      </Canvas>
    </div>
  );
}
