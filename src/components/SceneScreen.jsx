import { useRef, useState } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { OrbitControls, shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

const PlanetMaterial = shaderMaterial(
  { uTime: 0 },
  `
    varying vec2 vUv; varying vec3 vNormal; varying vec3 vPos;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPos = normalize((modelMatrix * vec4(position, 1.0)).xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    varying vec2 vUv; varying vec3 vNormal; varying vec3 vPos;
    vec2 rot2(vec2 p,float t){float c=cos(t),s=sin(t);return vec2(p.x*c+p.y*s,-p.x*s+p.y*c);}
    float snoise(vec2 p){
      const float K1=0.366025404,K2=0.211324865;
      vec2 i=floor(p+(p.x+p.y)*K1);vec2 a=p-i+(i.x+i.y)*K2;
      vec2 o=(a.x>a.y)?vec2(1,0):vec2(0,1);vec2 b=a-o+K2;vec2 c2=a-1.0+2.0*K2;
      float t=uTime*0.08;a=rot2(a,t);b=rot2(b,t);c2=rot2(c2,t);
      vec2 ha=-1.0+2.0*fract(sin(vec2(dot(i,vec2(127.1,311.7)),dot(i,vec2(269.5,183.3))))*43758.5453);
      vec2 hb=-1.0+2.0*fract(sin(vec2(dot(i+o,vec2(127.1,311.7)),dot(i+o,vec2(269.5,183.3))))*43758.5453);
      vec2 hc=-1.0+2.0*fract(sin(vec2(dot(i+1.0,vec2(127.1,311.7)),dot(i+1.0,vec2(269.5,183.3))))*43758.5453);
      vec3 h=max(0.5-vec3(dot(a,a),dot(b,b),dot(c2,c2)),0.0);h=h*h*h*h;
      return dot(h,vec3(dot(a,ha),dot(b,hb),dot(c2,hc)))*70.0;}
    float fbm(vec2 p){float v=0.0,amp=0.5;mat2 m=mat2(0.8,-0.6,0.6,0.8);for(int i=0;i<5;i++){p=m*p;v+=amp*snoise(p);p*=2.1;amp*=0.5;}return v;}
    float pot(vec2 p){vec2 tp=p+vec2(uTime*0.04,0.0);float n=snoise(tp);n+=0.5*snoise(tp*2.13+vec2(1.3,2.1));n+=3.0*snoise(p*0.333+vec2(uTime*0.015));return n;}
    vec2 curl(vec2 p){float e=0.08;float n=pot(p),nx=pot(p+vec2(e,0)),ny=pot(p+vec2(0,e));return vec2(-(ny-n),nx-n)/e;}
    float warp(vec2 p,out vec2 q,out vec2 r){
      q=vec2(fbm(p+vec2(0.0,0.0)),fbm(p+vec2(5.2,1.3)));
      r=vec2(fbm(p+3.0*q+vec2(1.7+uTime*0.012,9.2)),fbm(p+3.0*q+vec2(8.3,2.8+uTime*0.010)));
      return fbm(p+3.0*r);}
    void main(){
      vec2 sUV=vUv;vec2 p=sUV*4.0+vec2(uTime*0.01,0.0);vec2 q,r;
      float f=warp(p,q,r);float pct=f*0.5+0.5;
      vec2 bigC=curl(sUV*2.5+uTime*0.02);vec2 smlC=curl(sUV*6.0-uTime*0.015);
      float turb=fbm(sUV*4.0+bigC*0.12+smlC*0.04+uTime*0.015);
      pct=mix(pct,turb*0.5+0.5,0.35);
      vec3 g0=vec3(0.0,0.03,0.0),g1=vec3(0.01,0.15,0.01),g2=vec3(0.04,0.65,0.04),g3=vec3(0.08,0.92,0.08),g4=vec3(0.28,1.0,0.15);
      vec3 gc;
      if(pct<0.25)gc=mix(g0,g1,pct/0.25);
      else if(pct<0.5)gc=mix(g1,g2,(pct-0.25)/0.25);
      else if(pct<0.75)gc=mix(g2,g3,(pct-0.5)/0.25);
      else gc=mix(g3,g4,(pct-0.75)/0.25);
      vec3 o1v=vec3(0.95,0.55,0.0),o2v=vec3(1.0,0.72,0.0),o3v=vec3(1.0,0.90,0.05);
      vec3 oc=mix(o1v,o2v,smoothstep(0.3,0.65,pct));oc=mix(oc,o3v,smoothstep(0.65,1.0,pct));
      float oH=smoothstep(0.08,0.5,f),oL=smoothstep(-0.08,-0.45,f);float op=pow(max(oH,oL),1.2);
      vec3 col=gc;col=mix(col,oc,op);col=mix(col,g0,smoothstep(0.35,0.15,pct)*0.65);
      col*=(clamp(dot(vNormal,normalize(vec3(1.0,0.3,1.5))),0.0,1.0)*0.8+0.25);
      float fr=pow(1.0-abs(dot(vNormal,vec3(0,0,1))),3.5);
      col=mix(col,mix(vec3(0.04,0.5,0.01),vec3(0.95,0.6,0.0),op*0.8),fr*0.4);
      col=mix(col,vec3(0.1,0.85,0.15),pow(1.0-abs(dot(vNormal,vec3(0,0,1))),4.0)*0.35);
      gl_FragColor=vec4(col,1.0);}
  `,
);

// ── 선홍색 파티클 셰이더 (인터스텔라 스타일) ──
const ParticleMaterial = shaderMaterial(
  { uTime: 0, uProgress: 0 },
  `
    attribute float aSize;
    attribute float aRandom;
    attribute vec3  aColor;
    varying   float vRandom;
    varying   vec3  vColor;
    uniform   float uTime;
    uniform   float uProgress;
    void main() {
      vRandom = aRandom;
      vColor  = aColor;
      vec3 pos = position;
      pos.x += sin(uTime * 0.8 + aRandom * 6.28) * 0.1  * aRandom;
      pos.y += cos(uTime * 0.6 + aRandom * 3.14) * 0.08 * aRandom;
      pos.z += sin(uTime * 0.4 + aRandom * 9.42) * 0.06;
      vec4 mvPos   = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aSize * (300.0 / -mvPos.z) * uProgress;
      gl_Position  = projectionMatrix * mvPos;
    }
  `,
  `
    varying float vRandom;
    varying vec3  vColor;
    uniform float uTime;
    uniform float uProgress;
    void main() {
      vec2  uv      = gl_PointCoord - 0.5;
      float dist    = length(uv);
      if (dist > 0.5) discard;
      float alpha   = smoothstep(0.5, 0.0, dist);
      float core    = smoothstep(0.15, 0.0, dist) * 0.9;
      float twinkle = 0.65 + 0.35 * sin(uTime * 3.0 + vRandom * 12.56);
      gl_FragColor  = vec4(vColor + core, alpha * twinkle * uProgress);
    }
  `,
);

// ── 선홍색 배경 글로우 셰이더 ──
const GlowMaterial = shaderMaterial(
  { uTime: 0, uProgress: 0 },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform float uProgress;
    varying vec2  vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1,0)), f.x),
        mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
        f.y
      );
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
      return v;
    }

    void main() {
      vec2  uv     = vUv - 0.5;
      float n1     = fbm(uv * 2.0  + vec2(uTime * 0.025, uTime * 0.018));
      float n2     = fbm(uv * 4.5  + vec2(n1 * 1.5) + uTime * 0.012);
      float n      = mix(n1, n2, 0.55);
      float radial = 1.0 - smoothstep(0.0, 0.85, length(uv));

      vec3 dark   = vec3(0.06, 0.0,  0.0);
      vec3 mid    = vec3(0.42, 0.01, 0.05);
      vec3 bright = vec3(0.92, 0.04, 0.16);

      vec3 col = mix(dark, mid, n);
      col = mix(col, bright, radial * n * 0.9);
      col *= (0.5 + 0.5 * radial);

      gl_FragColor = vec4(col, uProgress * 0.98);
    }
  `,
);

extend({ PlanetMaterial, ParticleMaterial, GlowMaterial });

// ── 행성 ──
function Planet() {
  const matRef = useRef();
  useFrame((s) => {
    if (matRef.current) matRef.current.uTime = s.clock.elapsedTime;
  });
  return (
    <mesh>
      <sphereGeometry args={[3, 128, 128]} />
      <planetMaterial ref={matRef} />
    </mesh>
  );
}

// ── 파티클 데이터 ──
function buildParticles(count) {
  const pos = new Float32Array(count * 3);
  const sz = new Float32Array(count);
  const rnd = new Float32Array(count);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 2.0 + Math.random() * 14;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    sz[i] = 0.4 + Math.random() * 2.8;
    rnd[i] = Math.random();
    const t = Math.random();
    if (t < 0.5) {
      // 선홍색
      col[i * 3] = 0.85 + Math.random() * 0.15;
      col[i * 3 + 1] = 0.02 + Math.random() * 0.06;
      col[i * 3 + 2] = 0.05 + Math.random() * 0.1;
    } else if (t < 0.8) {
      // 밝은 분홍
      col[i * 3] = 1.0;
      col[i * 3 + 1] = 0.25 + Math.random() * 0.35;
      col[i * 3 + 2] = 0.25 + Math.random() * 0.35;
    } else {
      // 거의 흰색
      col[i * 3] = 1.0;
      col[i * 3 + 1] = 0.75 + Math.random() * 0.25;
      col[i * 3 + 2] = 0.75 + Math.random() * 0.25;
    }
  }
  return { pos, sz, rnd, col };
}

const PARTICLE_DATA = buildParticles(3000);

// ── 선홍색 씬 ──
function CrimsonScene({ progress }) {
  const particleRef = useRef();
  const glowRef = useRef();

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (particleRef.current) {
      particleRef.current.uTime = t;
      particleRef.current.uProgress = progress;
    }
    if (glowRef.current) {
      glowRef.current.uTime = t;
      glowRef.current.uProgress = progress;
    }
  });

  return (
    <>
      {/* 배경 글로우 */}
      <mesh position={[0, 0, -10]}>
        <planeGeometry args={[50, 50]} />
        <glowMaterial
          ref={glowRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 파티클 */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[PARTICLE_DATA.pos, 3]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[PARTICLE_DATA.sz, 1]}
          />
          <bufferAttribute
            attach="attributes-aRandom"
            args={[PARTICLE_DATA.rnd, 1]}
          />
          <bufferAttribute
            attach="attributes-aColor"
            args={[PARTICLE_DATA.col, 3]}
          />
        </bufferGeometry>
        <particleMaterial
          ref={particleRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

// ── 페이드 오버레이 ──
function FadeOverlay({ opacity }) {
  if (opacity <= 0) return null;
  return (
    <mesh position={[0, 0, 5]}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial
        color="#000000"
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── SceneScreen ──
export default function SceneScreen({ onBack }) {
  const [mode, setMode] = useState("planet");
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const [crimsonProg, setCrimsonProg] = useState(0);

  const handleSwitch = () => {
    if (mode !== "planet") return;
    setMode("fading");

    const startFade = performance.now();
    const animFade = (now) => {
      const t = Math.min((now - startFade) / 1500, 1.0);
      setFadeOpacity(t);
      if (t < 1.0) {
        requestAnimationFrame(animFade);
      } else {
        setMode("crimson");
        const startC = performance.now();
        const animC = (now2) => {
          const t2 = Math.min((now2 - startC) / 1500, 1.0);
          setFadeOpacity(1.0 - t2);
          setCrimsonProg(t2);
          if (t2 < 1.0) requestAnimationFrame(animC);
        };
        requestAnimationFrame(animC);
      }
    };
    requestAnimationFrame(animFade);
  };

  return (
    <div className="absolute inset-0 z-[3]">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <color attach="background" args={["#000000"]} />

        {/* 행성 — planet/fading 단계 */}
        {(mode === "planet" || mode === "fading") && <Planet />}

        {/* 선홍색 씬 — crimson/fading 단계 */}
        {(mode === "crimson" || mode === "fading") && (
          <CrimsonScene progress={crimsonProg} />
        )}

        <FadeOverlay opacity={fadeOpacity} />
        <OrbitControls />
      </Canvas>

      {/* UI 오버레이 */}
      <div className="absolute inset-0 pointer-events-none z-[4]">
        {/* 뒤로가기 */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 pointer-events-auto bg-transparent border border-[#1a4a1a] text-[#3a8a3a] px-4 py-2 text-[11px] tracking-[3px] font-mono cursor-pointer hover:border-[#4dff4d] hover:text-[#4dff4d] transition-all duration-300"
        >
          ← GALAXY MAP
        </button>

        {/* 씬 전환 버튼 — planet 단계에만 표시 */}
        {mode === "planet" && (
          <button
            onClick={handleSwitch}
            className="absolute bottom-14 left-1/2 -translate-x-1/2 pointer-events-auto bg-transparent border border-[#8B0000] text-[#ff4444] px-6 py-2.5 text-[11px] tracking-[4px] font-mono cursor-pointer hover:border-[#ff4444] hover:shadow-[0_0_20px_rgba(255,68,68,0.3)] transition-all duration-300 animate-pulse"
          >
            ASTROPHAGE DETECTED →
          </button>
        )}

        {/* 씬 타이틀 */}
        <div
          className={`absolute bottom-7 left-1/2 -translate-x-1/2 text-[11px] tracking-[6px] font-mono whitespace-nowrap transition-colors duration-500 ${
            mode === "crimson" ? "text-[#6a1a1a]" : "text-[#2a5a2a]"
          }`}
        >
          {mode === "crimson"
            ? "ASTROPHAGE DETECTED"
            : "PROJECT HAIL MARY — TAU CETI SYSTEM"}
        </div>
      </div>
    </div>
  );
}
