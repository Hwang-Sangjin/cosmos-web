import { Canvas, useFrame, extend } from "@react-three/fiber";
import { OrbitControls, shaderMaterial } from "@react-three/drei";
import { useRef } from "react";

const PlanetMaterial = shaderMaterial(
  { uTime: 0 },
  // vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment shader
  `
  uniform float uTime;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      
      // 변경 — 스케일 up, 패스 늘리기, y도 추가
      vec2 p = (uv - 0.5) * 12.0;

      for(float i = 0.0; i < 20.0; i++) {
        p.x += sin(p.y + i * 0.5 + uTime * 0.2);
        p.y += cos(p.x + i * 0.3 + uTime * 0.15);
        p *= mat2(6, -8, 8, 6) / 8.5;
      }

      vec4 raw = sin(p.xyxy * 0.5 + vec4(0, 1, 2, 3)) * 0.5 + 0.5;

      // raw.x = 주황 강도, raw.y = 초록 강도
      vec3 green  = vec3(0.05, 0.9, 0.1);
      vec3 orange = vec3(1.0, 0.42, 0.0);
      vec3 yellow = vec3(1.0, 0.85, 0.0);
      vec3 dark   = vec3(0.0, 0.04, 0.0);

      vec3 col = mix(dark, green, raw.y);
      col = mix(col, orange, raw.x * raw.z * 0.7);
      col = mix(col, yellow, raw.w * raw.x * 0.4);

      gl_FragColor = vec4(col, 1.0);
    }`,
);

extend({ PlanetMaterial });

function Planet() {
  const matRef = useRef();

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uTime = state.clock.elapsedTime;
    }
  });

  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[10, 2048, 2048]} />
      <planetMaterial ref={matRef} />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 30], fov: 60 }}>
      <color attach="background" args={["#000000"]} />
      <Planet />
      <OrbitControls />
    </Canvas>
  );
}
