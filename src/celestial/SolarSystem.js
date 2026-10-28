import * as THREE from 'three';
import { TextureGenerator } from '../graphics/TextureGenerator.js';

// Module-level reusable objects to prevent garbage collection allocations in animate loop
const _tempColorLower = new THREE.Color();
const _tempColorUpper = new THREE.Color();
const _targetColor = new THREE.Color();

export class SolarSystem {
  constructor(scene) {
    this.scene = scene;
    this.planets = [];
    this.lastAssistTime = 0;
    this.assistCooldown = 10; // seconds

    this.celestialBodies = [
      { name: 'Mercury', alt: 50000000, radius: 1200, soi: 500000, boost: 1500, bounty: 10000, color: 0x888888 },
      { name: 'Venus', alt: 108000000, radius: 2400, soi: 1200000, boost: 3200, bounty: 25000, color: 0xe6e6fa },
      { name: 'Moon', alt: 384000000, radius: 800, soi: 800000, boost: 5000, bounty: 50000, color: 0xdddddd, texture: 'moon' },
      { name: 'Mars', alt: 228000000, radius: 1800, soi: 1000000, boost: 7500, bounty: 100000, color: 0xcc5533 },
      { name: 'Jupiter', alt: 778000000, radius: 6000, soi: 4000000, boost: 25000, bounty: 500000, color: 0xddaa77, texture: 'jupiter' },
      { name: 'Saturn', alt: 1427000000, radius: 5000, soi: 3500000, boost: 40000, bounty: 1000000, color: 0xeeddcc, texture: 'saturn' },
      { name: 'Uranus', alt: 2871000000, radius: 3500, soi: 2500000, boost: 60000, bounty: 2500000, color: 0x88ccff },
      { name: 'Neptune', alt: 4497000000, radius: 3400, soi: 2400000, boost: 85000, bounty: 5000000, color: 0x3333ff }
    ];

    this._createPlanets();
    this._createStarfield();

    this.atmosphereColors = [
      { alt: 0, hex: 0x3a80e2 },       // Daylight Azure
      { alt: 15000, hex: 0x1a2e5a },   // Stratosphere Deep Indigo
      { alt: 35000, hex: 0x140628 },   // Mesosphere Twilight Purple
      { alt: 70000, hex: 0x060814 },   // Thermosphere Cosmic Dark
      { alt: 120000, hex: 0x020308 }   // Deep Interstellar Void Black
    ];
    
    if (!this.scene.background) {
      this.scene.background = new THREE.Color(0x3a80e2);
    }
  }

  _createStarfield() {
    const count = 2500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const tempColor = new THREE.Color();
    const starHueOptions = [0xffffff, 0xbfd7ff, 0xffecd1, 0xd4f1f9, 0xffd1dc];

    for (let i = 0; i < count; i++) {
      const radius = 5000 + Math.random() * 145000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(radius * Math.cos(phi)) + 100;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      tempColor.setHex(starHueOptions[Math.floor(Math.random() * starHueOptions.length)]);
      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;

      sizes[i] = 1.2 + Math.random() * 2.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom Canvas Texture for smooth circular star particles (cached)
    const starTexture = TextureGenerator._getOrCreate('star_particle', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.4, 'rgba(255,255,255,0.8)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(8, 8, 8, 0, Math.PI * 2);
      ctx.fill();
      return new THREE.CanvasTexture(canvas);
    });

    this.starMaterial = new THREE.PointsMaterial({
      size: 3.5,
      vertexColors: true,
      map: starTexture,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.starfield = new THREE.Points(geometry, this.starMaterial);
    this.scene.add(this.starfield);
  }

  _createPlanets() {
    const scale = 1 / 100;
    
    this.celestialBodies.forEach((bodyData, index) => {
      const geometry = new THREE.SphereGeometry(bodyData.radius * scale, 32, 32);
      
      let material;
      if (bodyData.texture === 'moon') {
        const texture = TextureGenerator.createMoonTexture();
        material = new THREE.MeshStandardMaterial({ map: texture, color: bodyData.color, roughness: 0.9 });
      } else if (bodyData.texture === 'jupiter') {
        const texture = TextureGenerator.createJupiterTexture();
        material = new THREE.MeshStandardMaterial({ map: texture, color: bodyData.color, roughness: 0.6 });
      } else if (bodyData.texture === 'saturn') {
        material = new THREE.MeshStandardMaterial({ color: bodyData.color, roughness: 0.7 });
      } else {
        material = new THREE.MeshStandardMaterial({ color: bodyData.color, roughness: 0.8 });
      }
      
      const mesh = new THREE.Mesh(geometry, material);
      
      const offsetSignX = index % 2 === 0 ? 1 : -1;
      const offsetSignZ = (index % 3) === 0 ? 1 : -1;
      mesh.position.set(
        (bodyData.radius * 2) * offsetSignX, 
        bodyData.alt * scale, 
        (bodyData.radius * 1.5) * offsetSignZ
      );
      
      if (bodyData.name === 'Saturn') {
        const ringGeo = new THREE.RingGeometry((bodyData.radius + 1000) * scale, (bodyData.radius + 3500) * scale, 64);
        const ringMat = new THREE.MeshStandardMaterial({
          map: TextureGenerator.createSaturnRingTexture(),
          side: THREE.DoubleSide,
          transparent: true
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2 + 0.25;
        mesh.add(ring);
      }
      
      this.scene.add(mesh);
      
      this.planets.push({
        mesh: mesh,
        data: bodyData
      });
    });
  }

  checkGravityAssist(altitude, velocityY) {
    const now = performance.now() / 1000;
    if (now - this.lastAssistTime < this.assistCooldown) {
      return { boostAmount: 0, bounty: 0, planetName: '' };
    }

    for (let i = 0; i < this.planets.length; i++) {
      const p = this.planets[i].data;
      if (Math.abs(altitude - p.alt) <= p.soi) {
        this.lastAssistTime = now;
        return {
          boostAmount: p.boost,
          bounty: p.bounty,
          planetName: p.name,
          color: p.color
        };
      }
    }

    return { boostAmount: 0, bounty: 0, planetName: '' };
  }

  updateAtmosphere(altitude) {
    // 1. Sky color gradient lerp (Zero allocations via module-level color reuse)
    let lower = this.atmosphereColors[0];
    let upper = this.atmosphereColors[this.atmosphereColors.length - 1];

    for (let i = 0; i < this.atmosphereColors.length - 1; i++) {
      if (altitude >= this.atmosphereColors[i].alt && altitude < this.atmosphereColors[i + 1].alt) {
        lower = this.atmosphereColors[i];
        upper = this.atmosphereColors[i + 1];
        break;
      }
    }

    if (altitude >= upper.alt) {
      lower = upper;
    }

    let t = 0;
    if (upper.alt > lower.alt) {
      t = (altitude - lower.alt) / (upper.alt - lower.alt);
      t = Math.max(0, Math.min(1, t));
    }

    _tempColorLower.setHex(lower.hex);
    _tempColorUpper.setHex(upper.hex);
    _targetColor.copy(_tempColorLower).lerp(_tempColorUpper, t);
    
    if (this.scene.background && this.scene.background.isColor) {
      this.scene.background.copy(_targetColor);
    } else {
      this.scene.background = _targetColor;
    }

    if (this.scene.fog) {
      this.scene.fog.color.copy(_targetColor);
      this.scene.fog.density = Math.max(0, 0.00008 * Math.exp(-altitude / 12000));
    }

    // 2. Starfield opacity fade-in
    if (this.starMaterial) {
      const starFade = Math.max(0, Math.min(1, (altitude - 15000) / 65000));
      this.starMaterial.opacity = starFade;
    }

    // Follow rocket ascent so stars remain centered overhead
    if (this.starfield) {
      this.starfield.position.y = (altitude / 100) * 0.8;
    }
  }

  update(delta) {
    // Rotate planets
    for (let i = 0; i < this.planets.length; i++) {
      if (this.planets[i].mesh) {
        this.planets[i].mesh.rotation.y += 0.08 * delta;
      }
    }

    // Slow starfield rotation
    if (this.starfield) {
      this.starfield.rotation.y += 0.005 * delta;
    }
  }
}
