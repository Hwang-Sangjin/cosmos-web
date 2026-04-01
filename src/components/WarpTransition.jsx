import { useEffect, useRef } from "react";
import "./WarpTransition.css";

export default function WarpTransition() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    const vert = `
      attribute vec2 a;
      void main() { gl_Position = vec4(a, 0, 1); }
    `;

    const frag = `
      precision highp float;
      uniform float uT;
      uniform vec2 uR;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float star(vec2 p) {
        vec2 f = fract(p) - 0.5;
        return pow(max(0.0, 1.0 - 6.0 * length(f)), 2.0);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uR;
        vec3 ray;
        ray.xy = 2.0 * (gl_FragCoord.xy - uR * 0.5) / uR.x;
        ray.z = 1.0;

        // 가속 — 시작은 느리고 끝은 빠르게
        float t = uT;
        float speed2 = (cos(t * 0.8) + 1.0) * 3.0 + t * 2.0;
        float speed = speed2 + 0.1;
        float offset = t * 1.5 + sin(t) * 0.5;

        vec3 stp = ray / max(abs(ray.x), abs(ray.y));
        vec3 pos = 2.0 * stp + 0.5;

        vec3 col = vec3(0.0);

        for (int i = 0; i < 20; i++) {
          // 노이즈 텍스처 대신 hash로 별 위치 생성
          float z = hash(floor(pos.xy));
          z = fract(z - offset);
          float d = 50.0 * z - pos.z;

          // 원형 파티클
          float w = pow(max(0.0, 1.0 - 8.0 * length(fract(pos.xy) - 0.5)), 2.0);

          // RGB 채널 분리 — 속도감/색 번짐
          vec3 c = max(vec3(0.0), vec3(
            1.0 - abs(d + speed2 * 0.5) / speed,
            1.0 - abs(d)                / speed,
            1.0 - abs(d - speed2 * 0.5) / speed
          ));

          col += 1.5 * (1.0 - z) * c * w;
          pos += stp;
        }

        // 감마 보정
        col = pow(col, vec3(1.0 / 2.2));

        // 중앙 집중 비네팅
        vec2 p = gl_FragCoord.xy / uR;
        float vign = 16.0 * p.x * p.y * (1.0 - p.x) * (1.0 - p.y);
        vign = pow(vign, 0.15);
        col *= vign;

        // 흰색 플래시 — 끝부분
        float flash = smoothstep(0.6, 1.0, uT / 0.9);
        col = mix(col, vec3(1.0), flash);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aloc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(aloc);
    gl.vertexAttribPointer(aloc, 2, gl.FLOAT, false, 0, 0);

    const uT = gl.getUniformLocation(prog, "uT");
    const uR = gl.getUniformLocation(prog, "uR");
    gl.uniform2f(uR, canvas.width, canvas.height);

    const duration = 900; // ms
    const startTime = performance.now();
    let raf;

    function render(now) {
      const elapsed = (now - startTime) / 1000;
      const t = Math.min(elapsed / (duration / 1000), 1.0);
      gl.uniform1f(uT, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (t < 1.0) {
        raf = requestAnimationFrame(render);
      }
    }

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="warp-canvas"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
