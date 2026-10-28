import * as THREE from 'three';
import { RocketBuilder } from './rocket/RocketBuilder.js';
import { PartsCatalog } from './rocket/PartsCatalog.js';
import { FlightEngine } from './physics/FlightEngine.js';
import { SolarSystem } from './celestial/SolarSystem.js';
import { CareerSystem } from './game/CareerSystem.js';
import { SoundSynth } from './audio/SoundSynth.js';
import { PostProcessingManager } from './graphics/PostProcessing.js';
import { ExhaustShader } from './graphics/Shaders.js';

class RocketGame {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x3a80e2);
    this.scene.fog = new THREE.FogExp2(0x3a80e2, 0.00008);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50000000);
    this.camera.position.set(0, 5, 25);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Systems
    this.postProcessing = new PostProcessingManager(this.renderer, this.scene, this.camera);
    this.sound = new SoundSynth();
    this.career = new CareerSystem();
    this.builder = new RocketBuilder(this.scene);
    this.flight = new FlightEngine(this.scene);
    this.solarSystem = new SolarSystem(this.scene);

    // State
    this.cameraMode = 'chase';
    this.activeTab = 'tank';
    this.autopilotSingle = false;
    this.autopilotLoop = false;
    this.exhaustMesh = null;
    this.exhaustMaterial = null;
    this.isAdminUnlocked = false;

    // DOM Telemetry Cache for zero-layout-reflow performance
    this._lastTelemetry = { alt: -1, vel: -1, fuel: -1, density: -1, status: '' };
    this._telemetryTimer = 0;

    // Init
    this.initLights();
    this.initEnvironment();
    this.initDefaultRocket();
    this.initExhaustSystem();
    this.initUI();
    this.initAdminSystem();

    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.animate = this.animate.bind(this);
    this.animate();
  }

  initLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 2.2);
    dir.position.set(100, 200, 100);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 500;
    this.scene.add(dir);
  }

  initEnvironment() {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.9, roughness: 0.3 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.85 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xc53030, metalness: 0.7, roughness: 0.4 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xecc94b, metalness: 0.5, roughness: 0.4 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.9 });

    // Platform Base
    const platformGeom = new THREE.BoxGeometry(18, 2, 18);
    const platform = new THREE.Mesh(platformGeom, concreteMat);
    platform.position.y = -1;
    platform.receiveShadow = true;
    platform.castShadow = true;
    this.scene.add(platform);

    // Hazard Stripes
    const stripeGeom = new THREE.BoxGeometry(17.5, 0.05, 17.5);
    const stripe = new THREE.Mesh(stripeGeom, new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.7 }));
    stripe.position.y = 0.01;
    this.scene.add(stripe);

    // Flame Trench
    const trenchGeom = new THREE.BoxGeometry(4, 2, 22);
    const trench = new THREE.Mesh(trenchGeom, darkMat);
    trench.position.set(0, -2.5, 0);
    this.scene.add(trench);

    // Hold-down Clamps
    for (let angle = 0; angle < 4; angle++) {
      const theta = (angle * Math.PI / 2) + Math.PI / 4;
      const dist = 2.8;

      const postGeom = new THREE.BoxGeometry(0.6, 4, 0.6);
      const post = new THREE.Mesh(postGeom, steelMat);
      post.position.set(Math.cos(theta) * dist, 2, Math.sin(theta) * dist);
      post.castShadow = true;
      this.scene.add(post);

      const armGeom = new THREE.BoxGeometry(0.3, 0.3, 1.5);
      const arm = new THREE.Mesh(armGeom, yellowMat);
      arm.position.set(Math.cos(theta) * (dist - 0.8), 3.2, Math.sin(theta) * (dist - 0.8));
      arm.rotation.y = theta;
      arm.castShadow = true;
      this.scene.add(arm);

      const tipGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8);
      const tip = new THREE.Mesh(tipGeom, redMat);
      tip.position.set(Math.cos(theta) * (dist - 1.6), 3.2, Math.sin(theta) * (dist - 1.6));
      tip.rotation.z = Math.PI / 2;
      this.scene.add(tip);
    }

    // Service Tower
    const towerGeom = new THREE.BoxGeometry(2.5, 30, 2.5);
    const tower = new THREE.Mesh(towerGeom, steelMat);
    tower.position.set(-8, 15, 0);
    tower.castShadow = true;
    this.scene.add(tower);

    [6, 14, 22].forEach(h => {
      const platGeom = new THREE.BoxGeometry(5, 0.3, 3);
      const plat = new THREE.Mesh(platGeom, steelMat);
      plat.position.set(-6.5, h, 0);
      plat.castShadow = true;
      this.scene.add(plat);

      const railGeom = new THREE.BoxGeometry(5, 0.8, 0.1);
      const rail = new THREE.Mesh(railGeom, yellowMat);
      rail.position.set(-6.5, h + 0.5, 1.5);
      this.scene.add(rail);
    });

    const swingGeom = new THREE.BoxGeometry(4, 0.4, 0.4);
    const swingArm = new THREE.Mesh(swingGeom, redMat);
    swingArm.position.set(-5, 6, 0);
    swingArm.castShadow = true;
    this.scene.add(swingArm);

    const lightGeom = new THREE.SphereGeometry(0.3, 8, 8);
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff0000, emissiveIntensity: 2 });
    const warningLight = new THREE.Mesh(lightGeom, lightMat);
    warningLight.position.set(-8, 30.5, 0);
    this.scene.add(warningLight);

    // Ground Plane
    const groundGeom = new THREE.PlaneGeometry(4000, 4000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1e26, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  initDefaultRocket() {
    this.builder.loadAssembly(['tank_medium', 'engine_raptor', 'booster_side_srb']);
    this.builder.applyVisualUpgrades(this.career);
    this.updateVehicleStats();
    this.renderStagingList();
  }

  initExhaustSystem() {
    const exhaustGeom = new THREE.ConeGeometry(0.6, 5, 16, 1, true);
    exhaustGeom.translate(0, -2.5, 0);

    this.exhaustMaterial = new THREE.ShaderMaterial({
      vertexShader: ExhaustShader.vertexShader,
      fragmentShader: ExhaustShader.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(ExhaustShader.uniforms),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.exhaustMesh = new THREE.Mesh(exhaustGeom, this.exhaustMaterial);
    this.exhaustMesh.visible = false;
    this.exhaustMesh.userData = { isExhaust: true };
    this.builder.rocketGroup.add(this.exhaustMesh);
    this._positionExhaust();
  }

  _positionExhaust() {
    if (!this.exhaustMesh) return;
    this.exhaustMesh.position.set(0, -0.5, 0);
  }

  initUI() {
    this.renderPartsCatalog();
    this.renderStagingList();
    this.renderTechTree();
    this.updateCreditsUI();

    const drawer = document.getElementById('mobile-drawer-overlay');
    const btnOpenMenu = document.getElementById('btn-open-menu');
    const btnOpenBuild = document.getElementById('btn-open-build');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');

    // Drawer Open / Close
    const openDrawer = () => drawer.classList.remove('hidden');
    const closeDrawer = () => drawer.classList.add('hidden');

    if (btnOpenMenu) btnOpenMenu.addEventListener('click', openDrawer);
    if (btnOpenBuild) btnOpenBuild.addEventListener('click', openDrawer);
    if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeDrawer);

    // Drawer Tab Switching
    document.querySelectorAll('.drawer-tab').forEach(tab => {
      tab.addEventListener('click', e => {
        document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        const tabKey = e.target.dataset.drawerTab;
        document.querySelectorAll('.drawer-tab-content').forEach(c => c.classList.remove('active'));

        if (tabKey === 'tanks' || tabKey === 'engines' || tabKey === 'boosters') {
          document.getElementById('tab-content-parts').classList.add('active');
          this.activeTab = tabKey === 'tanks' ? 'tank' : (tabKey === 'engines' ? 'engine' : 'booster');
          this.renderPartsCatalog();
        } else if (tabKey === 'staging') {
          document.getElementById('tab-content-staging').classList.add('active');
          this.renderStagingList();
          this.updateVehicleStats();
        } else if (tabKey === 'tech') {
          document.getElementById('tab-content-tech').classList.add('active');
          this.renderTechTree();
        } else if (tabKey === 'camera') {
          document.getElementById('tab-content-camera').classList.add('active');
        }
      });
    });

    // Camera buttons inside drawer
    document.querySelectorAll('.cam-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.cameraMode = e.target.dataset.cam;
      });
    });


    // Autopilot Single Launch
    document.getElementById('btn-auto-single').addEventListener('click', () => {
      this.autopilotSingle = !this.autopilotSingle;
      if (this.autopilotSingle) {
        this.autopilotLoop = false;
        this.flight.setAutopilotMode('AUTOPILOT_SINGLE');
      } else {
        this.flight.setAutopilotMode('MANUAL');
      }
      document.getElementById('btn-auto-single').classList.toggle('pulse-glow-active', this.autopilotSingle);
      document.getElementById('btn-auto-loop').classList.remove('pulse-glow-active');
      if (this.autopilotSingle && this.flight.state !== 'FLIGHT') {
        closeDrawer();
        this.startLaunch();
      }
    });

    // Autopilot Loop (Infinite Loop Mode)
    document.getElementById('btn-auto-loop').addEventListener('click', () => {
      this.autopilotLoop = !this.autopilotLoop;
      if (this.autopilotLoop) {
        this.autopilotSingle = false;
        this.flight.setAutopilotMode('AUTOPILOT_LOOP');
      } else {
        this.flight.setAutopilotMode('MANUAL');
      }
      document.getElementById('btn-auto-loop').classList.toggle('pulse-glow-active', this.autopilotLoop);
      document.getElementById('btn-auto-single').classList.remove('pulse-glow-active');
      if (this.autopilotLoop && this.flight.state !== 'FLIGHT') {
        closeDrawer();
        this.startLaunch();
      }
    });

    // Launch Button (Closes drawer automatically!)
    document.getElementById('btn-launch').addEventListener('click', () => {
      closeDrawer();
      this.startLaunch();
    });

    // Reset Button
    document.getElementById('btn-reset').addEventListener('click', () => this.resetRocketAndCameraToPad());

    // Clear Assembly
    document.getElementById('btn-clear-rocket').addEventListener('click', () => {
      this.builder.clear();
      this.renderPartsCatalog();
      this.renderStagingList();
      this.updateVehicleStats();
      this._positionExhaust();
    });

    // Throttle Slider
    document.getElementById('slider-throttle').addEventListener('input', e => {
      const val = parseInt(e.target.value);
      document.getElementById('val-throttle').textContent = val;
      this.flight.setThrottle(val / 100);
    });

    // Sound toggle
    document.getElementById('btn-sound').addEventListener('click', () => {
      const muted = this.sound.toggleMute();
      document.getElementById('btn-sound').textContent = muted ? '🔊 OFF' : '🔊 ON';
    });
  }

  initAdminSystem() {
    const btnAdminTrigger = document.getElementById('btn-admin-access');
    const modalPasscode = document.getElementById('modal-admin-passcode');
    const modalCheats = document.getElementById('modal-admin-cheats');
    const inputPasscode = document.getElementById('input-admin-code');
    const btnSubmitPasscode = document.getElementById('btn-submit-passcode');
    const btnCancelPasscode = document.getElementById('btn-cancel-passcode');
    const btnCloseCheats = document.getElementById('btn-close-admin-cheats');
    const passcodeError = document.getElementById('admin-passcode-error');

    btnAdminTrigger.addEventListener('click', () => {
      if (this.isAdminUnlocked) {
        modalCheats.classList.remove('hidden');
      } else {
        inputPasscode.value = '';
        passcodeError.classList.add('hidden');
        modalPasscode.classList.remove('hidden');
        inputPasscode.focus();
      }
    });

    btnCancelPasscode.addEventListener('click', () => {
      modalPasscode.classList.add('hidden');
    });

    const verifyPasscode = () => {
      const code = inputPasscode.value.trim();
      if (code === '001429') {
        this.isAdminUnlocked = true;
        modalPasscode.classList.add('hidden');
        modalCheats.classList.remove('hidden');
        this.showAdminToast('🔓 Security Access Granted! Cheats Unlocked.');
      } else {
        passcodeError.classList.remove('hidden');
        inputPasscode.value = '';
        inputPasscode.focus();
      }
    };

    btnSubmitPasscode.addEventListener('click', verifyPasscode);
    inputPasscode.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') verifyPasscode();
    });

    btnCloseCheats.addEventListener('click', () => {
      modalCheats.classList.add('hidden');
    });

    document.querySelectorAll('.admin-warp-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        document.querySelectorAll('.admin-warp-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const warpVal = parseFloat(e.target.dataset.warp);
        this.flight.timeWarp = warpVal;
        this.showAdminToast(`🚀 Time Warp set to ${warpVal}x!`);
      });
    });

    document.getElementById('btn-cheat-bank-bonus').addEventListener('click', () => {
      const bonusData = this.career.triggerAdminBankBonus();
      this.updateCreditsUI();
      this.showAdminToast(`💰 Bank Bonus: +$${bonusData.creditBonus.toLocaleString()} Added!`);
    });

    document.getElementById('btn-cheat-add-cash').addEventListener('click', () => {
      this.career.addCredits(1000000);
      this.updateCreditsUI();
      this.showAdminToast('💵 +$1,000,000 Added to Account!');
    });

    document.getElementById('btn-cheat-unlock-tech').addEventListener('click', () => {
      this.career.unlockAllTech();
      this.builder.applyVisualUpgrades(this.career);
      this.renderTechTree();
      this.renderPartsCatalog();
      this.updateCreditsUI();
      this.showAdminToast('🔓 All R&D Tech Items Unlocked!');
    });

    document.getElementById('btn-cheat-max-fuel').addEventListener('click', () => {
      if (this.flight.activeStages) {
        this.flight.activeStages.forEach(s => {
          if (s.fuelCapacity > 0) s.currentFuel = s.fuelCapacity;
        });
      }
      this.showAdminToast('⛽ Propellant Refilled to 100%!');
    });
  }

  showAdminToast(msg) {
    const toast = document.getElementById('admin-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  startLaunch() {
    if (this.flight.state === 'FLIGHT') return;
    this.sound.initAudio();
    this.sound.playLaunchSound();

    const assembly = this.builder.getAssembly();
    this.flight.startLaunch(assembly, this.builder.rocketGroup);

    if (this.exhaustMesh) this.exhaustMesh.visible = true;
    this._positionExhaust();
  }

  resetRocketAndCameraToPad() {
    this.flight.resetToPad(this.builder.rocketGroup);
    this.sound.stopEngineSound();

    if (this.exhaustMesh) this.exhaustMesh.visible = false;
    this.updateTelemetryUI(0, 0, 100, 1.225, 'PAD', true);
    this.camera.position.set(0, 5, 25);

    if (this.autopilotLoop) {
      setTimeout(() => this.startLaunch(), 400);
    } else if (this.autopilotSingle) {
      this.autopilotSingle = false;
      this.flight.setAutopilotMode('MANUAL');
      document.getElementById('btn-auto-single').classList.remove('pulse-glow-active');
    }
  }

  renderPartsCatalog() {
    const grid = document.getElementById('parts-grid');
    grid.innerHTML = '';

    Object.values(PartsCatalog)
      .filter(p => p.type === this.activeTab)
      .forEach(part => {
        const isEquipped = this.builder.isEquipped(part.id);
        const card = document.createElement('div');
        card.className = `part-card ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="part-header-row">
            <span class="part-title">${part.name}</span>
            ${isEquipped ? '<span class="equipped-badge">EQUIPPED ✓</span>' : ''}
          </div>
          <p class="part-desc">${part.desc || ''}</p>
          <div class="part-cost">
            ${isEquipped ? 'ACTIVE UPGRADE' : `$${(part.cost || 0).toLocaleString()}`}
          </div>
        `;

        card.addEventListener('click', () => {
          if (isEquipped) {
            if (part.type === 'booster') {
              this.builder.unequipSlot('booster');
              this.builder.applyVisualUpgrades(this.career);
              this.renderPartsCatalog();
              this.renderStagingList();
              this.updateVehicleStats();
              this._positionExhaust();
            }
            return;
          }

          if (this.career.credits >= (part.cost || 0)) {
            this.career.spendCredits(part.cost || 0);
            this.builder.equipPart(part.id);
            this.builder.applyVisualUpgrades(this.career);
            this.renderPartsCatalog();
            this.renderStagingList();
            this.updateVehicleStats();
            this.updateCreditsUI();
            this._positionExhaust();
          }
        });

        grid.appendChild(card);
      });
  }

  renderStagingList() {
    const list = document.getElementById('staging-list');
    list.innerHTML = '';

    const tank = this.builder.getEquippedPart('tank');
    const engine = this.builder.getEquippedPart('engine');
    const booster = this.builder.getEquippedPart('booster');

    const stages = [
      { badge: 'S1', slotLabel: 'NOSE', slotKey: 'nose', name: 'Aerodynamic Command Cap', isEquipped: true, canRemove: false },
      { badge: 'S2', slotLabel: 'TANK', slotKey: 'tank', name: tank ? tank.name : 'None', isEquipped: !!tank, canRemove: !!tank },
      { badge: 'S3', slotLabel: 'ENGINE', slotKey: 'engine', name: engine ? engine.name : 'None', isEquipped: !!engine, canRemove: !!engine },
      { badge: 'S4', slotLabel: 'AUX', slotKey: 'booster', name: booster ? booster.name : 'None', isEquipped: !!booster, canRemove: !!booster }
    ];

    stages.forEach(stg => {
      const item = document.createElement('div');
      item.className = 'staging-item';
      item.innerHTML = `
        <div class="staging-info">
          <span class="staging-badge">${stg.badge}</span>
          <span class="staging-name">${stg.slotLabel}: ${stg.name}</span>
        </div>
        ${stg.canRemove ? `<button class="btn-remove" data-slot="${stg.slotKey}">&times;</button>` : ''}
      `;

      if (stg.canRemove) {
        item.querySelector('.btn-remove').addEventListener('click', (e) => {
          e.stopPropagation();
          this.builder.unequipSlot(stg.slotKey);
          this.renderPartsCatalog();
          this.renderStagingList();
          this.updateVehicleStats();
          this._positionExhaust();
        });
      }

      list.appendChild(item);
    });
  }

  renderTechTree() {
    const container = document.getElementById('tech-list');
    container.innerHTML = '';

    this.career.techTree.forEach(tech => {
      const isUnlocked = this.career.hasTech(tech.id);
      const card = document.createElement('div');
      card.className = `tech-card ${isUnlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <h3>${tech.name} ${isUnlocked ? '✓' : ''}</h3>
        <p>${tech.desc}</p>
        <p class="tech-cost">${isUnlocked ? 'UNLOCKED' : `$${tech.cost.toLocaleString()}`}</p>
      `;
      if (!isUnlocked) {
        card.addEventListener('click', () => {
          if (this.career.unlockTech(tech.id)) {
            this.builder.applyVisualUpgrades(this.career);
            this.renderTechTree();
            this.renderPartsCatalog();
            this.updateCreditsUI();
          }
        });
      }
      container.appendChild(card);
    });
  }

  updateVehicleStats() {
    const stats = this.builder.getStats();
    document.getElementById('stat-mass').textContent = stats.mass;
    document.getElementById('stat-thrust').textContent = stats.thrust;
    document.getElementById('stat-twr').textContent = stats.twr;
    document.getElementById('stat-deltav').textContent = stats.deltaV;
  }

  updateCreditsUI() {
    document.getElementById('val-credits').textContent = Math.floor(this.career.credits).toLocaleString();
  }

  updateTelemetryUI(alt, vel, fuel, density, status, force = false) {
    const altRounded = Math.floor(alt);
    const velRounded = parseFloat(vel.toFixed(1));
    const fuelRounded = Math.floor(fuel);

    if (force || this._lastTelemetry.alt !== altRounded) {
      document.getElementById('val-altitude').textContent = altRounded.toLocaleString();
      document.getElementById('val-max-alt').textContent = Math.floor(this.flight.maxAltitude).toLocaleString();
      this._lastTelemetry.alt = altRounded;
    }

    if (force || this._lastTelemetry.vel !== velRounded) {
      document.getElementById('val-velocity').textContent = velRounded.toFixed(1);
      this._lastTelemetry.vel = velRounded;
    }

    if (force || this._lastTelemetry.fuel !== fuelRounded) {
      document.getElementById('bar-fuel').style.width = `${Math.max(0, Math.min(100, fuelRounded))}%`;
      this._lastTelemetry.fuel = fuelRounded;
    }

    if (force || this._lastTelemetry.density !== density) {
      document.getElementById('val-density').textContent = density.toFixed(3);
      this._lastTelemetry.density = density;
    }

    if (force || this._lastTelemetry.status !== status) {
      document.getElementById('badge-status').textContent = status;
      this._lastTelemetry.status = status;
    }
  }

  updateCamera(delta = 0.016) {
    const rocketPos = this.builder.rocketGroup.position;
    const lerpFactor = 1 - Math.exp(-12 * delta);

    if (this.cameraMode === 'chase') {
      const targetY = rocketPos.y + 6;
      const targetZ = rocketPos.z + 28;
      this.camera.position.x += (rocketPos.x - this.camera.position.x) * lerpFactor;
      this.camera.position.y += (targetY - this.camera.position.y) * lerpFactor;
      this.camera.position.z += (targetZ - this.camera.position.z) * lerpFactor;
      this.camera.lookAt(rocketPos.x, rocketPos.y + 2, rocketPos.z);
    } else if (this.cameraMode === 'pad') {
      this.camera.position.x += (20 - this.camera.position.x) * lerpFactor;
      this.camera.position.y += (10 - this.camera.position.y) * lerpFactor;
      this.camera.position.z += (30 - this.camera.position.z) * lerpFactor;
      this.camera.lookAt(rocketPos.x, rocketPos.y, rocketPos.z);
    } else if (this.cameraMode === 'cockpit') {
      this.camera.position.set(rocketPos.x, rocketPos.y + 7.5, rocketPos.z);
      this.camera.lookAt(rocketPos.x, rocketPos.y + 100, rocketPos.z - 20);
    } else if (this.cameraMode === 'orbit') {
      const targetX = rocketPos.x + 80;
      const targetY = rocketPos.y + 40;
      const targetZ = rocketPos.z + 120;
      this.camera.position.x += (targetX - this.camera.position.x) * lerpFactor;
      this.camera.position.y += (targetY - this.camera.position.y) * lerpFactor;
      this.camera.position.z += (targetZ - this.camera.position.z) * lerpFactor;
      this.camera.lookAt(rocketPos.x, rocketPos.y, rocketPos.z);
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.flight.state === 'FLIGHT') {
      const res = this.flight.update(delta, this.builder.rocketGroup);

      this._telemetryTimer += delta;
      if (this._telemetryTimer > 0.05) {
        this.updateTelemetryUI(res.altitude, res.velocity, res.fuelPercent, res.airDensity, res.state);
        this._telemetryTimer = 0;
      }

      if (this.exhaustMesh) {
        const isFiring = (res.throttle > 0 && res.fuelPercent > 0);
        this.exhaustMesh.visible = isFiring;
        if (isFiring && this.exhaustMaterial) {
          this.exhaustMaterial.uniforms.uTime.value += delta * 5.0;
          this.exhaustMaterial.uniforms.uThrottle.value = res.throttle;
        }
      }

      const assist = this.solarSystem.checkGravityAssist(res.altitude, res.velocity);
      if (assist.boostAmount > 0) {
        this.flight.velocity.y += assist.boostAmount;
        this.career.recordGravityAssist(assist.bounty, assist.planetName);
        this.updateCreditsUI();
        this.sound.playAssistSound();
      }

      this.sound.updateEngineSound(res.throttle, res.fuelPercent);

      if (res.isPeakReached) {
        this.career.recordLaunch(this.flight.maxAltitude, this.flight.maxVelocity);
        this.updateCreditsUI();
        this.resetRocketAndCameraToPad();
      }
    }

    this.solarSystem.updateAtmosphere(this.flight.altitude);
    this.solarSystem.update(delta);
    this.updateCamera(delta);
    this.postProcessing.render();
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.postProcessing.resize(width, height);
  }
}

// Start Game
window.addEventListener('DOMContentLoaded', () => {
  new RocketGame();
});
