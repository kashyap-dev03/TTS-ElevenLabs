/**
 * WebGL Background Shader: ANIMATION_1
 * Vocal Waveform — organic sound-wave harmonics with pastel acoustic field
 * Palette: silk cream, airy lavender, gentle melon, crystal mist, voice glow
 */
(function () {
  function initShader() {
    const canvas = document.getElementById('shader-canvas-ANIMATION_1');
    if (!canvas) return;

    function syncSize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor((canvas.clientWidth || window.innerWidth || 1280) * dpr);
      const h = Math.floor((canvas.clientHeight || window.innerHeight || 720) * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncSize).observe(canvas);
    }
    window.addEventListener('resize', syncSize);
    syncSize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('WebGL not supported for background shader');
      return;
    }

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

// Simplex-ish noise helper
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 uv = (st - 0.5) * aspect;

    vec2 mouse = u_mouse / u_resolution;
    vec2 mouseOffset = (mouse - 0.5) * 0.2;

    float t = u_time * 0.45;

    // Organic vocal sound wave layered harmonics
    float wave1 = sin(uv.x * 5.0 + t * 1.5 + snoise(uv * 2.0 + t * 0.2) * 2.5) * 0.12;
    float wave2 = cos(uv.x * 8.0 - t * 1.2 + wave1 * 4.0) * 0.08;
    float wave3 = sin(uv.x * 12.0 + t * 2.0) * 0.04;
    float waveField = wave1 + wave2 + wave3;

    // Fluid acoustic resonance field
    vec2 warpedUv = uv + mouseOffset;
    float n1 = snoise(warpedUv * 2.2 + vec2(t * 0.3, -t * 0.2));
    float n2 = snoise(warpedUv * 4.5 + vec2(-t * 0.25, t * 0.35) + n1 * 0.8);
    float n3 = snoise(warpedUv * 1.2 + n2 * 0.5);

    // Light palette: soft silk cream, airy lavender, gentle melon, crystal mist, voice glow
    vec3 bgBase    = vec3(0.976, 0.973, 0.965); // #f9f8f6 soft silk cream
    vec3 lilacRose = vec3(0.933, 0.890, 0.980); // #eee3fa airy lavender
    vec3 warmPeach = vec3(0.996, 0.914, 0.871); // #feeedd gentle melon
    vec3 mistCyan  = vec3(0.898, 0.949, 0.988); // #e5f2fc crystal mist
    vec3 voiceGlow = vec3(0.792, 0.730, 0.970); // #caaef7 glowing voice harmonic

    // Color mixing based on procedural acoustic waves
    vec3 col = bgBase;
    col = mix(col, mistCyan,  smoothstep(-0.4, 0.5, n1 + uv.y * 0.6));
    col = mix(col, warmPeach, smoothstep(-0.2, 0.6, n2 - uv.x * 0.5));
    col = mix(col, lilacRose, smoothstep(0.1, 0.85, n3 + waveField * 2.0));

    // Sound ribbon / formant ribbon glow
    float ribbonDist = abs(uv.y - waveField + 0.08 * n2);
    float ribbonIntensity = exp(-ribbonDist * 16.0);
    col = mix(col, voiceGlow, ribbonIntensity * 0.45);

    // Secondary subtle high-frequency harmonic line
    float thinRibbon = exp(-abs(uv.y - waveField * 1.4 - 0.08) * 45.0);
    col = mix(col, vec3(0.68, 0.58, 0.94), thinRibbon * 0.3);

    // Subtle vignette to focus interface
    float vignette = smoothstep(1.2, 0.4, length(st - 0.5));
    col = mix(vec3(0.95, 0.94, 0.92), col, vignette);

    gl_FragColor = vec4(col, 1.0);
}`;

    function cs(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s));
      }
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Shader link error:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime  = gl.getUniformLocation(prog, 'u_time');
    const uRes   = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse       = { x: canvas.width / 2, y: canvas.height / 2 };
    let targetMouse = { x: canvas.width / 2, y: canvas.height / 2 };

    window.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        targetMouse.x = nx * canvas.width;
        targetMouse.y = ny * canvas.height;
      }
    });

    function render(t) {
      // Smooth mouse lerp
      mouse.x += (targetMouse.x - mouse.x) * 0.06;
      mouse.y += (targetMouse.y - mouse.y) * 0.06;

      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime)  gl.uniform1f(uTime, t * 0.001);
      if (uRes)   gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShader);
  } else {
    initShader();
  }
})();
