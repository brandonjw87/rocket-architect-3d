import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class PostProcessingManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.composer = new EffectComposer(this.renderer);
    
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Mobile & High-DPI Optimization: Render bloom at half-resolution for 60+ FPS performance
    const bloomW = Math.min(1024, Math.floor(window.innerWidth * 0.5));
    const bloomH = Math.min(1024, Math.floor(window.innerHeight * 0.5));
    const resolution = new THREE.Vector2(bloomW, bloomH);
    
    this.bloomPass = new UnrealBloomPass(resolution, 1.2, 0.4, 0.85);
    this.bloomPass.threshold = 0.6;
    this.bloomPass.strength = 1.2;
    this.bloomPass.radius = 0.5;
    this.composer.addPass(this.bloomPass);
  }

  setSize(width, height) {
    this.composer.setSize(width, height);
    const bloomW = Math.min(1024, Math.floor(width * 0.5));
    const bloomH = Math.min(1024, Math.floor(height * 0.5));
    this.bloomPass.resolution.set(bloomW, bloomH);
  }

  resize(width, height) {
    this.setSize(width, height);
  }

  render() {
    this.composer.render();
  }
}

export class PostProcessingPipeline extends PostProcessingManager {}
