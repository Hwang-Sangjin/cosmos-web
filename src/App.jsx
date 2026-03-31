import { Canvas, useFrame, extend } from "@react-three/fiber";
import { OrbitControls, shaderMaterial } from "@react-three/drei";
import { useRef } from "react";

const PlanetMaterial = shaderMaterial(
  { uTime: 0 },
  // vertex shader
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPos;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPos = normalize((modelMatrix * vec4(position, 1.0)).xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment shader
  `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPos;

    vec2 rot2(vec2 p, float t) {
      float c = cos(t), s = sin(t);
      return vec2(p.x*c + p.y*s, -p.x*s + p.y*c);
    }

    float snoise(vec2 p) {
      const float K1 = 0.366025404, K2 = 0.211324865;
      vec2 i = floor(p + (p.x + p.y) * K1);
      vec2 a = p - i + (i.x + i.y) * K2;
      vec2 o = (a.x > a.y) ? vec2(1, 0) : vec2(0, 1);
      vec2 b = a - o + K2;
      vec2 c2 = a - 1.0 + 2.0 * K2;
      float t = uTime * 0.08;
      a = rot2(a, t); b = rot2(b, t); c2 = rot2(c2, t);
      vec2 ha = -1.0 + 2.0 * fract(sin(vec2(dot(i,       vec2(127.1, 311.7)), dot(i,       vec2(269.5, 183.3)))) * 43758.5453);
      vec2 hb = -1.0 + 2.0 * fract(sin(vec2(dot(i + o,   vec2(127.1, 311.7)), dot(i + o,   vec2(269.5, 183.3)))) * 43758.5453);
      vec2 hc = -1.0 + 2.0 * fract(sin(vec2(dot(i + 1.0, vec2(127.1, 311.7)), dot(i + 1.0, vec2(269.5, 183.3)))) * 43758.5453);
      vec3 h = max(0.5 - vec3(dot(a,a), dot(b,b), dot(c2,c2)), 0.0);
      h = h * h * h * h;
      return dot(h, vec3(dot(a, ha), dot(b, hb), dot(c2, hc))) * 70.0;
    }

    float fbm(vec2 p) {
      float v = 0.0, amp = 0.5;
      mat2 m = mat2(0.8, -0.6, 0.6, 0.8);
      for (int i = 0; i < 5; i++) {
        p = m * p;
        v += amp * snoise(p);
        p *= 2.1;
        amp *= 0.5;
      }
      return v;
    }

    float pot(vec2 p) {
      vec2 tp = p + vec2(uTime * 0.04, 0.0);
      float n = snoise(tp);
      n += 0.5 * snoise(tp * 2.13 + vec2(1.3, 2.1));
      n += 3.0 * snoise(p * 0.333 + vec2(uTime * 0.015));
      return n;
    }

    vec2 curl(vec2 p) {
      float e = 0.08;
      float n = pot(p), nx = pot(p + vec2(e, 0)), ny = pot(p + vec2(0, e));
      return vec2(-(ny - n), nx - n) / e;
    }

    float warp(vec2 p, out vec2 q, out vec2 r) {
      q = vec2(fbm(p + vec2(0.0, 0.0)), fbm(p + vec2(5.2, 1.3)));
      r = vec2(
        fbm(p + 3.0 * q + vec2(1.7 + uTime * 0.012, 9.2)),
        fbm(p + 3.0 * q + vec2(8.3, 2.8 + uTime * 0.010))
      );
      return fbm(p + 3.0 * r);
    }

    void main() {
      vec2 sUV = vUv;

      vec2 p = sUV * 4.0 + vec2(uTime * 0.01, 0.0);

      vec2 q, r;
      float f = warp(p, q, r);
      float pct = f * 0.5 + 0.5;

      vec2 bigC = curl(sUV * 2.5 + uTime * 0.02);
      vec2 smlC = curl(sUV * 6.0 - uTime * 0.015);
      float turb = fbm(sUV * 4.0 + bigC * 0.12 + smlC * 0.04 + uTime * 0.015);
      pct = mix(pct, turb * 0.5 + 0.5, 0.35);

      // 기본 초록 팔레트
      vec3 g0 = vec3(0.0,  0.03, 0.0);
      vec3 g1 = vec3(0.01, 0.15, 0.01);
      vec3 g2 = vec3(0.04, 0.65, 0.04);
      vec3 g3 = vec3(0.08, 0.92, 0.08);
      vec3 g4 = vec3(0.28, 1.0,  0.15);
      vec3 gc;
      if (pct < 0.25)      gc = mix(g0, g1, pct / 0.25);
      else if (pct < 0.5)  gc = mix(g1, g2, (pct - 0.25) / 0.25);
      else if (pct < 0.75) gc = mix(g2, g3, (pct - 0.5)  / 0.25);
      else                 gc = mix(g3, g4, (pct - 0.75) / 0.25);

      // 노란 주황 팔레트
      vec3 o1v = vec3(0.95, 0.55, 0.0);
      vec3 o2v = vec3(1.0,  0.72, 0.0);
      vec3 o3v = vec3(1.0,  0.90, 0.05);
      vec3 oc = mix(o1v, o2v, smoothstep(0.3,  0.65, pct));
      oc       = mix(oc,  o3v, smoothstep(0.65, 1.0,  pct));

      // 주황 포인트 마스크
      float orangeHigh  = smoothstep(0.08,  0.5,   f);
      float orangeLow   = smoothstep(-0.08, -0.45,  f);
      float orangePoint = max(orangeHigh, orangeLow);
      orangePoint = pow(orangePoint, 1.2);

      // 색상 합성
      vec3 col = gc;
      col = mix(col, oc, orangePoint);

      // 어두운 영역
      float darkness = smoothstep(0.35, 0.15, pct);
      col = mix(col, g0, darkness * 0.65);

      // 조명
      vec3 lightDir = normalize(vec3(1.0, 0.3, 1.5));
      float diff = clamp(dot(vNormal, lightDir), 0.0, 1.0);
      col *= (diff * 0.8 + 0.25);

      // 프레넬 대기
      float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
      vec3 atm = mix(vec3(0.04, 0.5, 0.01), vec3(0.95, 0.6, 0.0), orangePoint * 0.8);
      col = mix(col, atm, fresnel * 0.5);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
);

extend({ PlanetMaterial });

function Planet() {
  const matRef = useRef();
  useFrame((state) => {
    if (matRef.current) matRef.current.uTime = state.clock.elapsedTime;
  });
  return (
    <mesh>
      <sphereGeometry args={[3, 128, 128]} />
      <planetMaterial ref={matRef} />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
      <color attach="background" args={["#000000"]} />
      <Planet />
      <OrbitControls />
    </Canvas>
  );
}
