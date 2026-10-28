import * as THREE from 'three';

export const ExhaustShader = {
  uniforms: {
    uTime: { value: 0 },
    uThrottle: { value: 1.0 },
    uIntensity: { value: 1.0 },
    uExpansion: { value: 1.0 },
    uMode: { value: 0 } // 0: Kerolox, 1: Hydrolox, 2: Fusion, 3: Antimatter, 4: Singularity
  },
  vertexShader: `
    uniform float uTime;
    uniform float uThrottle;
    uniform float uExpansion;
    varying vec2 vUv;
    varying float vNoise;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Expansion at nozzle exit in vacuum
      if (pos.y < -0.2) {
        float factor = abs(pos.y) * 0.4 * uExpansion;
        pos.x *= (1.0 + factor);
        pos.z *= (1.0 + factor);
      }

      // High speed turbulent jitter
      float noise = hash(uv + vec2(uTime * 10.0, pos.y));
      vNoise = noise;
      pos.x += (noise - 0.5) * 0.05 * uThrottle;
      pos.z += (noise - 0.5) * 0.05 * uThrottle;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uThrottle;
    uniform float uIntensity;
    uniform int uMode;
    varying vec2 vUv;
    varying float vNoise;

    void main() {
      if (uThrottle < 0.01) discard;

      float distFromCenter = abs(vUv.x - 0.5) * 2.0;
      float core = 1.0 - smoothstep(0.0, 0.8, distFromCenter);
      float lengthFade = 1.0 - smoothstep(0.0, 1.0, vUv.y);

      // Mach shock diamonds - optimized pow(x, 4.0) to (s2 * s2)
      float shockSin = abs(sin(vUv.y * 35.0 - uTime * 30.0));
      float shockSq = shockSin * shockSin;
      float shocks = (shockSq * shockSq) * core * 0.6;

      vec3 col = vec3(0.0);

      if (uMode == 0) {
        // Kerolox: Deep orange core, white hot shocks
        vec3 coreColor = mix(vec3(1.0, 0.4, 0.05), vec3(1.0, 0.9, 0.5), shocks);
        col = mix(vec3(0.9, 0.2, 0.0), coreColor, core);
      } else if (uMode == 1) {
        // Hydrolox: Transparent purple/blue core
        vec3 coreColor = mix(vec3(0.4, 0.2, 1.0), vec3(0.8, 0.7, 1.0), shocks);
        col = mix(vec3(0.1, 0.05, 0.6), coreColor, core);
      } else if (uMode == 2) {
        // Fusion: Electric cyan / neon teal
        vec3 coreColor = mix(vec3(0.0, 0.8, 1.0), vec3(0.7, 1.0, 1.0), shocks);
        col = mix(vec3(0.0, 0.3, 0.8), coreColor, core);
      } else if (uMode == 3) {
        // Antimatter: Neon violet / hot magenta
        vec3 coreColor = mix(vec3(0.9, 0.0, 1.0), vec3(1.0, 0.7, 1.0), shocks);
        col = mix(vec3(0.4, 0.0, 0.6), coreColor, core);
      } else {
        // Singularity: Pure white core, void black event horizon edge
        vec3 coreColor = mix(vec3(0.1, 0.8, 1.0), vec3(1.0, 1.0, 1.0), shocks);
        col = mix(vec3(0.0, 0.0, 0.2), coreColor, core);
      }

      float alpha = core * lengthFade * uIntensity * (0.8 + 0.2 * vNoise);
      gl_FragColor = vec4(col, alpha);
    }
  `
};

export const PlasmaShader = {
  uniforms: {
    uTime: { value: 0 },
    uIntensity: { value: 0 }
  },
  vertexShader: `
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uIntensity;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      if (uIntensity < 0.01) discard;

      float baseFresnel = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
      float fresnel = baseFresnel * baseFresnel;
      vec3 col = mix(vec3(1.0, 0.3, 0.0), vec3(1.0, 0.9, 0.2), fresnel);
      
      float alpha = fresnel * uIntensity * 0.8;
      gl_FragColor = vec4(col, alpha);
    }
  `
};

export const StarfieldShader = {
  uniforms: {
    uOpacity: { value: 0.0 },
    uMap: { value: null }
  },
  vertexShader: `
    attribute float size;
    attribute vec3 color;
    varying vec3 vColor;

    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uOpacity;
    uniform sampler2D uMap;
    varying vec3 vColor;

    void main() {
      if (uOpacity < 0.001) discard;
      vec4 texColor = texture2D(uMap, gl_PointCoord);
      gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * uOpacity);
    }
  `
};
