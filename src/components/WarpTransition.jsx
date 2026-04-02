import { useEffect, useRef } from "react";

export default function WarpTransition({ onDone }) {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    const vert = `attribute vec2 a; void main(){ gl_Position=vec4(a,0,1); }`;
    const frag = `
      precision highp float;
      uniform float uT; uniform vec2 uR;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      void main(){
        vec3 ray; ray.xy=2.0*(gl_FragCoord.xy-uR*0.5)/uR.x; ray.z=1.0;
        float offset=uT*0.5;
        float speed2=(cos(offset)+1.0)*2.0;
        float speed=speed2+0.1;
        offset+=sin(offset)*0.96; offset*=2.0;
        vec3 col=vec3(0); vec3 stp=ray/max(abs(ray.x),abs(ray.y));
        vec3 pos=2.0*stp+0.5;
        for(int i=0;i<20;i++){
          float z=hash(floor(pos.xy));
          z=fract(z-offset);
          float d=50.0*z-pos.z;
          float w=pow(max(0.0,1.0-8.0*length(fract(pos.xy)-0.5)),2.0);
          vec3 c=max(vec3(0),vec3(
            1.0-abs(d+speed2*0.5)/speed,
            1.0-abs(d)/speed,
            1.0-abs(d-speed2*0.5)/speed
          ));
          col+=1.5*(1.0-z)*c*w; pos+=stp;
        }
        col=pow(max(col,vec3(0)),vec3(1.0/2.2));
        vec2 p=gl_FragCoord.xy/uR;
        col*=0.5+0.5*sqrt(16.0*p.x*p.y*(1.0-p.x)*(1.0-p.y));
        gl_FragColor=vec4(col,1.0);
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

    const DURATION = 10000;
    const startTime = performance.now();
    let raf;

    function render(now) {
      const elapsed = (now - startTime) / 1000;
      gl.uniform1f(uT, elapsed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (now - startTime < DURATION) {
        raf = requestAnimationFrame(render);
      } else {
        onDone?.();
      }
    }
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block z-[8] bg-black"
    />
  );
}
