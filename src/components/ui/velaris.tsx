import { useEffect, useRef } from "react";
import "./velaris.css";

const vertexShader = `
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }
`;

/* Adapted from Velaris: simplex-noise field, vignette and grain, tuned for slow mineral light. */
const fragmentShader = `
precision mediump float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_grain;
uniform vec3 u_colors[4];
uniform vec3 u_bg;
uniform vec2 u_focus;
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
void main() {
  vec2 uv = vUv;
  vec2 p = uv - u_focus;
  p.x *= u_resolution.x / u_resolution.y;
  float t = u_time * 0.1;
  float n1 = snoise(p * 0.4 + vec2(t * 0.2, -t * 0.3));
  float n2 = snoise(p * 0.55 + vec2(-t * 0.15, t * 0.25) + n1 * 0.25);
  float n3 = snoise(p * 0.75 + vec2(t * 0.1, -t * 0.2) + n2 * 0.2);
  vec3 col = u_bg;
  float dist = length(p) * 1.5;
  float vignette = 1.0 - smoothstep(0.3, 1.25, dist);
  col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85);
  col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.7);
  col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.6);
  col = mix(col, u_colors[3], smoothstep(0.0, 0.7, n1 * n2) * 0.5);
  col += u_colors[1] * smoothstep(0.8, 0.0, dist) * 0.22;
  col = mix(col * 0.25, col, vignette);
  float grain = fract(sin(dot(uv * u_resolution, vec2(12.9898, 78.233))) * 43758.5453 + u_time);
  col += (grain - 0.5) * u_grain * 0.1;
  gl_FragColor = vec4(col, 1.0);
}
`;

const hexToRgb = (hex: string): [number, number, number] => {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
};

export type VelarisProps = {
  bg?: string;
  colors?: readonly [string, string, string, string];
  speed?: number;
  grain?: number;
  focusX?: number;
  focusY?: number;
  className?: string;
  paused?: boolean;
};

/** Decorative living gradient. Paused offscreen, in hidden tabs or when `paused` is set. */
export function Velaris({
  bg = "#0a0c0e",
  colors = ["#24292d", "#4a5257", "#16191c", "#7d868c"],
  speed = 0.55,
  grain = 0.35,
  focusX = 0.62,
  focusY = 0.5,
  className = "",
  paused = false,
}: VelarisProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const scheduleRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    pausedRef.current = paused;
    scheduleRef.current?.();
  }, [paused]);
  const [c0, c1, c2, c3] = colors;
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexShader);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentShader);
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    const dispose = () => {
      gl.useProgram(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      delete canvas.dataset["ready"];
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      // Do not lose a connected canvas during React effect replay or a prop change.
      if (!canvas.isConnected && !gl.isContextLost()) {
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
    };
    if (!vertex || !fragment || !program || !buffer) {
      dispose();
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      dispose();
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    if (position < 0) {
      dispose();
      return;
    }
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, "u_resolution");
    const time = gl.getUniformLocation(program, "u_time");
    gl.uniform1f(gl.getUniformLocation(program, "u_grain"), grain);
    gl.uniform3f(gl.getUniformLocation(program, "u_bg"), ...hexToRgb(bg));
    gl.uniform2f(gl.getUniformLocation(program, "u_focus"), focusX, focusY);
    gl.uniform3fv(
      gl.getUniformLocation(program, "u_colors"),
      new Float32Array([c0, c1, c2, c3].flatMap(hexToRgb)),
    );
    let frame = 0;
    let visible = false;
    let sized = false;
    let contextLost = false;
    let needsDraw = true;
    let elapsed = 0;
    let last = 0;
    const draw = () => {
      gl.uniform1f(time, elapsed * 0.001 * speed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (needsDraw) canvas.dataset["ready"] = "true";
      needsDraw = false;
    };
    const loop = (now: number) => {
      if (last) elapsed += now - last;
      last = now;
      draw();
      frame = requestAnimationFrame(loop);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      last = 0;
      if (!visible || document.hidden || !sized || contextLost) return;
      if (pausedRef.current) {
        if (needsDraw) draw();
        return;
      }
      frame = requestAnimationFrame(loop);
    };
    scheduleRef.current = schedule;
    const lost = () => {
      contextLost = true;
      cancelAnimationFrame(frame);
      last = 0;
      delete canvas.dataset["ready"];
    };
    const sizeObserver = new ResizeObserver(([entry]) => {
      if (!entry || contextLost) return;
      const ratio = Math.min(window.devicePixelRatio, 1.5);
      const width = Math.max(1, Math.round(entry.contentRect.width * ratio));
      const height = Math.max(1, Math.round(entry.contentRect.height * ratio));
      if (sized && canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(resolution, width, height);
      sized = true;
      needsDraw = true;
      // Resizing clears the canvas; repaint at once so it never flashes blank.
      draw();
      schedule();
    });
    sizeObserver.observe(container);
    const viewObserver = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      visible = entry.isIntersecting;
      schedule();
    });
    viewObserver.observe(container);
    canvas.addEventListener("webglcontextlost", lost);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      scheduleRef.current = null;
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      viewObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      document.removeEventListener("visibilitychange", schedule);
      dispose();
    };
  }, [bg, c0, c1, c2, c3, speed, grain, focusX, focusY]);
  return (
    <div className={`velaris ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
