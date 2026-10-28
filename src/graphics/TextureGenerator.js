import * as THREE from 'three';

export class TextureGenerator {
  static _cache = new Map();

  static _getOrCreate(key, generatorFn) {
    if (this._cache.has(key)) {
      return this._cache.get(key);
    }
    const texture = generatorFn();
    this._cache.set(key, texture);
    return texture;
  }

  static createTitaniumTexture() {
    return this._getOrCreate('titanium', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#9aa5b5';
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 400; i++) {
        const y = Math.random() * 512;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#333a44';
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, 504, 504);
      ctx.strokeRect(128, 4, 256, 504);

      ctx.fillStyle = '#11161d';
      for (let y = 16; y < 512; y += 32) {
        ctx.beginPath();
        ctx.arc(8, y, 2.5, 0, Math.PI * 2);
        ctx.arc(504, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  static createCarbonFiberTexture() {
    return this._getOrCreate('carbon_fiber', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#121418';
      ctx.fillRect(0, 0, 512, 512);

      const tileSize = 16;
      for (let y = 0; y < 512; y += tileSize) {
        for (let x = 0; x < 512; x += tileSize) {
          const isPattern = (x / tileSize + y / tileSize) % 2 === 0;
          ctx.fillStyle = isPattern ? '#2a2e36' : '#1a1d24';
          ctx.fillRect(x, y, tileSize, tileSize);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          if (isPattern) {
            ctx.fillRect(x, y, tileSize, tileSize / 2);
          } else {
            ctx.fillRect(x, y, tileSize / 2, tileSize);
          }
        }
      }

      ctx.strokeStyle = 'rgba(180, 200, 220, 0.3)';
      ctx.lineWidth = 2;
      for (let x = 0; x < 512; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 6);
      return tex;
    });
  }

  static createHexHeatShieldTexture() {
    return this._getOrCreate('hex_heatshield', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#15171c';
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = '#2d333f';
      ctx.lineWidth = 2;
      const r = 20;
      const h = r * Math.sqrt(3);

      for (let y = -h; y < 512 + h; y += h) {
        for (let x = -r; x < 512 + r; x += r * 3) {
          const drawHex = (cx, cy) => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (i * Math.PI) / 3;
              const px = cx + r * Math.cos(angle);
              const py = cy + r * Math.sin(angle);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
          };
          drawHex(x, y);
          drawHex(x + r * 1.5, y + h / 2);
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  static createSolarPanelTexture() {
    return this._getOrCreate('solar_panel', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#0a1d3a';
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 2;
      const grid = 32;
      for (let x = 0; x <= 512; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }
      for (let y = 0; y <= 512; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#ffb700';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(256, 0);
      ctx.lineTo(256, 512);
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  static createGoldFoilTexture() {
    return this._getOrCreate('gold_foil', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#d4af37';
      ctx.fillRect(0, 0, 256, 256);

      for (let i = 0; i < 200; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const r = Math.random() * 12 + 4;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 240, 160, 0.4)' : 'rgba(80, 50, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  static createEngineHeatTexture() {
    return this._getOrCreate('engine_heat', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#555d68');
      grad.addColorStop(0.3, '#885533');
      grad.addColorStop(0.6, '#662288');
      grad.addColorStop(0.85, '#2244aa');
      grad.addColorStop(1.0, '#11151c');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    });
  }

  static createQuantumLatticeTexture() {
    return this._getOrCreate('quantum_lattice', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#081426';
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      const step = 64;
      for (let x = 0; x <= 512; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }
      for (let y = 0; y <= 512; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#00f0ff';
      for (let y = 0; y <= 512; y += step) {
        for (let x = 0; x <= 512; x += step) {
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  static createJupiterTexture() {
    return this._getOrCreate('jupiter', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0.0, '#c89d7c');
      grad.addColorStop(0.15, '#e3d2b4');
      grad.addColorStop(0.3, '#a56c42');
      grad.addColorStop(0.45, '#dcb98a');
      grad.addColorStop(0.6, '#964b28');
      grad.addColorStop(0.75, '#cba483');
      grad.addColorStop(1.0, '#78462a');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      ctx.fillStyle = '#b83218';
      ctx.beginPath();
      ctx.ellipse(650, 320, 90, 50, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d86248';
      ctx.beginPath();
      ctx.ellipse(650, 320, 60, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      return new THREE.CanvasTexture(canvas);
    });
  }

  static createSaturnRingTexture() {
    return this._getOrCreate('saturn_ring', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 512, 0);
      grad.addColorStop(0.0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.2, 'rgba(210, 180, 140, 0.8)');
      grad.addColorStop(0.55, 'rgba(240, 220, 180, 0.9)');
      grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.1)');
      grad.addColorStop(0.72, 'rgba(190, 160, 120, 0.75)');
      grad.addColorStop(1.0, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 64);

      return new THREE.CanvasTexture(canvas);
    });
  }

  static createMoonTexture() {
    return this._getOrCreate('moon', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#888888';
      ctx.fillRect(0, 0, 512, 256);

      for (let i = 0; i < 300; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 256;
        const r = Math.random() * 15 + 2;
        ctx.fillStyle = Math.random() > 0.4 ? 'rgba(40,40,40,0.5)' : 'rgba(200,200,200,0.4)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      return new THREE.CanvasTexture(canvas);
    });
  }
}
