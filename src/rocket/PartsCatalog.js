import * as THREE from 'three';
import { TextureGenerator } from '../graphics/TextureGenerator.js';

export const PartsCatalog = {
  // === CORE PROPELLANT TANKS (Slot: tank) ===
  tank_small: {
    id: 'tank_small',
    slot: 'tank',
    name: 'Kerolox Standard Tank S1',
    type: 'tank',
    tier: 1,
    mass: 3.0,
    fuelCapacity: 50,
    cost: 8000,
    radius: 0.9,
    height: 3.5,
    colorHex: '#abb6c5',
    desc: 'Aluminum-lithium alloy core tank.',
    createMesh: () => createTankMesh(0.9, 3.5, '#abb6c5')
  },
  tank_medium: {
    id: 'tank_medium',
    slot: 'tank',
    name: 'Hydrolox Heavy Tank M2',
    type: 'tank',
    tier: 2,
    mass: 8.0,
    fuelCapacity: 120,
    cost: 25000,
    radius: 1.3,
    height: 5.5,
    colorHex: '#2b303a',
    isCarbon: true,
    desc: 'Cryogenic liquid hydrogen/oxygen tank with carbon fiber wrap.',
    createMesh: () => createTankMesh(1.3, 5.5, '#2b303a', true)
  },
  tank_large: {
    id: 'tank_large',
    name: 'Super Heavy Core Tank L3',
    slot: 'tank',
    type: 'tank',
    tier: 3,
    mass: 18.0,
    fuelCapacity: 260,
    cost: 75000,
    radius: 1.8,
    height: 8.0,
    colorHex: '#e0e6ed',
    desc: '9-meter stainless steel super-heavy orbital core tank.',
    createMesh: () => createTankMesh(1.8, 8.0, '#e0e6ed')
  },
  tank_quantum: {
    id: 'tank_quantum',
    name: 'Quantum Propellant Core Q4',
    slot: 'tank',
    type: 'tank',
    tier: 4,
    mass: 25.0,
    fuelCapacity: 450,
    cost: 300000,
    radius: 2.2,
    height: 10.0,
    isCarbon: true,
    isQuantum: true,
    desc: 'Zero-point energy storage core with cyan glowing quantum lattice.',
    createMesh: () => createQuantumTankMesh(2.2, 10.0)
  },
  tank_antimatter: {
    id: 'tank_antimatter',
    name: 'Antimatter Containment Matrix A5',
    slot: 'tank',
    type: 'tank',
    tier: 5,
    mass: 32.0,
    fuelCapacity: 750,
    cost: 750000,
    radius: 2.5,
    height: 11.5,
    isCarbon: true,
    isAntimatter: true,
    desc: 'Magnetic containment matrix with glowing neon purple antimatter coils.',
    createMesh: () => createAntimatterTankMesh(2.5, 11.5)
  },

  // === ROCKET PROPULSION ENGINES (Slot: engine) ===
  engine_merlin: {
    id: 'engine_merlin',
    slot: 'engine',
    name: 'Merlin-1D Rocket Engine',
    type: 'engine',
    tier: 1,
    mass: 1.8,
    thrust: 1100,
    isp: 320,
    exhaustMode: 0, // Kerolox
    cost: 18000,
    radius: 0.9,
    height: 2.0,
    nozzleCount: 1,
    colorHex: '#4a525d',
    desc: 'High TWR RP-1/LOX engine with turbopump exhaust.',
    createMesh: () => createEngineMesh(0.9, 2.0, '#4a525d', 1)
  },
  engine_raptor: {
    id: 'engine_raptor',
    slot: 'engine',
    name: 'Raptor Vacuum Engine Cluster',
    type: 'engine',
    tier: 2,
    mass: 4.5,
    thrust: 3200,
    isp: 395,
    exhaustMode: 1, // Hydrolox/Methalox
    cost: 65000,
    radius: 1.3,
    height: 2.8,
    nozzleCount: 3,
    colorHex: '#1e2228',
    desc: 'Full-flow staged combustion 3-nozzle vacuum cluster.',
    createMesh: () => createEngineMesh(1.3, 2.8, '#1e2228', 3)
  },
  engine_fusion: {
    id: 'engine_fusion',
    slot: 'engine',
    name: 'Helion D-He3 Fusion Drive',
    type: 'engine',
    tier: 3,
    mass: 8.0,
    thrust: 7500,
    isp: 4800,
    exhaustMode: 2, // Fusion
    cost: 350000,
    radius: 1.8,
    height: 3.6,
    nozzleCount: 4,
    isFusion: true,
    colorHex: '#0d1520',
    desc: 'Magnetic D-He3 fusion engine delivering hyper-velocity plasma exhaust.',
    createMesh: () => createEngineMesh(1.8, 3.6, '#0d1520', 4, true)
  },
  engine_antimatter: {
    id: 'engine_antimatter',
    slot: 'engine',
    name: 'Antimatter Annihilation Engine',
    type: 'engine',
    tier: 4,
    mass: 12.0,
    thrust: 18000,
    isp: 16500,
    exhaustMode: 3, // Antimatter
    cost: 950000,
    radius: 2.2,
    height: 4.5,
    nozzleCount: 4,
    isAntimatter: true,
    desc: 'Gamma-ray ignited positron engine with purple containment rings.',
    createMesh: () => createAntimatterEngineMesh(2.2, 4.5)
  },
  engine_warp_singularity: {
    id: 'engine_warp_singularity',
    slot: 'engine',
    name: 'Warp Core Singularity Drive',
    type: 'engine',
    tier: 5,
    mass: 16.0,
    thrust: 40000,
    isp: 65000,
    exhaustMode: 4, // FTL Warp Singularity
    cost: 1500000,
    radius: 2.5,
    height: 5.5,
    nozzleCount: 1,
    isWarp: true,
    desc: 'FTL Warp drive merged with micro-black hole singularity for interstellar velocity.',
    createMesh: () => createWarpSingularityEngineMesh(2.5, 5.5)
  },

  // === AUXILIARY HARDWARE & BOOSTERS (Slot: addon) ===
  booster_side_srb: {
    id: 'booster_side_srb',
    slot: 'addon',
    addonType: 'sideBoosters',
    name: 'Twin Solid Strapon Boosters',
    type: 'booster',
    mass: 6.0,
    thrust: 2200,
    fuelCapacity: 80,
    cost: 35000,
    desc: 'Attaches twin solid rocket boosters to the sides of the rocket.',
    createMesh: () => new THREE.Group()
  },
  booster_grid_fins: {
    id: 'booster_grid_fins',
    slot: 'addon',
    addonType: 'gridFins',
    name: 'Titanium Grid Fins & RCS Quads',
    type: 'booster',
    mass: 0.8,
    thrust: 0,
    cost: 20000,
    desc: 'Equips upper stage with 4x titanium grid fins and RCS attitude control quads.',
    createMesh: () => new THREE.Group()
  },
  booster_quantum_wings: {
    id: 'booster_quantum_wings',
    slot: 'addon',
    addonType: 'plasmaWings',
    name: 'Plasma Shield Wings & Solar Array',
    type: 'booster',
    mass: 1.5,
    thrust: 800,
    cost: 150000,
    desc: 'Equips core hull with gold-foil solar wings and magnetosphere plasma shield rings.',
    createMesh: () => new THREE.Group()
  }
};

// 3D Geometry Generators
export function createCommandNoseCap(radius, height = 2.2) {
  const group = new THREE.Group();
  group.name = 'commandNoseCap';

  // Aerodynamic Cone Shell
  const noseGeom = new THREE.CylinderGeometry(0.1, radius, height, 32);
  const noseMat = new THREE.MeshStandardMaterial({
    color: 0xebf8ff,
    metalness: 0.8,
    roughness: 0.25,
    map: TextureGenerator.createTitaniumTexture()
  });
  const nose = new THREE.Mesh(noseGeom, noseMat);
  nose.position.y = height / 2;
  nose.castShadow = true;
  group.add(nose);

  // Ceramic Hex Heat Shield Tip
  const tipGeom = new THREE.ConeGeometry(0.25, 0.6, 32);
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0x1a202c,
    roughness: 0.9,
    map: TextureGenerator.createHexHeatShieldTexture()
  });
  const tip = new THREE.Mesh(tipGeom, tipMat);
  tip.position.y = height + 0.3;
  tip.name = 'heatShield';
  group.add(tip);

  // Visor Glass Window
  const visorGeom = new THREE.BoxGeometry(radius * 0.7, 0.25, radius * 0.4);
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x00d0ff,
    emissiveIntensity: 0.8,
    metalness: 0.9
  });
  const visor = new THREE.Mesh(visorGeom, visorMat);
  visor.position.set(0, height * 0.4, radius * 0.4);
  group.add(visor);

  // Pitot Probe
  const probeGeom = new THREE.CylinderGeometry(0.02, 0.05, 0.5, 12);
  const probeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9 });
  const probe = new THREE.Mesh(probeGeom, probeMat);
  probe.position.y = height + 0.65;
  group.add(probe);

  // RCS Thruster Quads
  addRCSQuads(group, radius * 0.85, height * 0.3);

  return group;
}

export function createTankMesh(radius, height, colorHex, isCarbon = false) {
  const group = new THREE.Group();

  const geom = new THREE.CylinderGeometry(radius, radius, height, 32);
  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.8,
    roughness: 0.3,
    map: isCarbon ? TextureGenerator.createCarbonFiberTexture() : TextureGenerator.createTitaniumTexture()
  });
  const tank = new THREE.Mesh(geom, mat);
  tank.castShadow = true;
  tank.name = 'tankBody';
  group.add(tank);

  // Umbilical Conduit Pipe
  const pipeGeom = new THREE.CylinderGeometry(0.06, 0.06, height * 0.95, 16);
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9 });
  const pipe1 = new THREE.Mesh(pipeGeom, pipeMat);
  pipe1.position.set(radius * 1.02, 0, 0);
  group.add(pipe1);

  // Mounting Flanges
  const flangeGeom = new THREE.TorusGeometry(radius * 1.01, 0.03, 8, 32);
  const flangeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
  
  const fTop = new THREE.Mesh(flangeGeom, flangeMat);
  fTop.rotation.x = Math.PI / 2;
  fTop.position.y = height / 2;
  group.add(fTop);

  const fBot = fTop.clone();
  fBot.position.y = -height / 2;
  group.add(fBot);

  return group;
}

export function createQuantumTankMesh(radius, height) {
  const group = createTankMesh(radius, height, '#0c1a2e', true);

  const latticeGeom = new THREE.CylinderGeometry(radius * 1.02, radius * 1.02, height * 0.85, 32, 1, true);
  const latticeMat = new THREE.MeshBasicMaterial({
    map: TextureGenerator.createQuantumLatticeTexture(),
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide
  });
  const lattice = new THREE.Mesh(latticeGeom, latticeMat);
  lattice.name = 'quantumLattice';
  group.add(lattice);

  addGlowingRings(group, radius, height * 0.4, 0x00f0ff, 0x00d0ff, 3);
  return group;
}

export function createAntimatterTankMesh(radius, height) {
  const group = createTankMesh(radius, height, '#110c1c', true);
  addGlowingRings(group, radius, height, 0xe000ff, 0xaa00ff, 4);
  return group;
}

export function createEngineMesh(radius, height, hexColor, nozzleCount = 1, isFusion = false) {
  const group = new THREE.Group();

  const mountGeom = new THREE.CylinderGeometry(radius, radius * 0.9, 0.4, 32);
  const mountMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
  const mount = new THREE.Mesh(mountGeom, mountMat);
  mount.position.y = height / 2 - 0.2;
  group.add(mount);

  const nozzleGeom = new THREE.CylinderGeometry(radius * 0.25, radius * 0.5, height * 0.8, 32, 1, true);
  const nozzleMat = new THREE.MeshStandardMaterial({
    color: hexColor,
    metalness: 0.95,
    roughness: 0.15,
    map: TextureGenerator.createEngineHeatTexture(),
    side: THREE.DoubleSide
  });

  const offsets = getNozzleOffsets(nozzleCount, radius * 0.4);
  offsets.forEach((off) => {
    const nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
    nozzle.position.set(off.x, -height * 0.2, off.z);
    nozzle.castShadow = true;
    nozzle.name = 'engineBell';
    group.add(nozzle);
  });

  if (isFusion) {
    const ringGeom = new THREE.TorusGeometry(radius * 0.55, 0.05, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00b0ff,
      emissiveIntensity: 2.0
    });
    offsets.forEach((off) => {
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(off.x, -height * 0.35, off.z);
      ring.name = 'fusionRing';
      group.add(ring);
    });
  }

  return group;
}

export function createAntimatterEngineMesh(radius, height) {
  const group = createEngineMesh(radius, height, '#20052b', 4, true);
  addGlowingRings(group, radius * 0.75, -height * 0.1, 0xf000ff, 0xd000ff, 2);
  return group;
}

export function createWarpSingularityEngineMesh(radius, height) {
  const group = createEngineMesh(radius, height, '#050a14', 1, false);

  const warpRingGeom = new THREE.TorusGeometry(radius * 1.3, 0.15, 16, 32);
  const warpRingMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00d0ff,
    emissiveIntensity: 2.5,
    metalness: 0.9
  });
  const warpRing = new THREE.Mesh(warpRingGeom, warpRingMat);
  warpRing.rotation.x = Math.PI / 2;
  warpRing.position.y = height * 0.2;
  group.add(warpRing);

  const diskGeom = new THREE.RingGeometry(radius * 0.3, radius * 1.0, 32);
  const diskMat = new THREE.MeshBasicMaterial({
    color: 0x7000ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95
  });
  const disk = new THREE.Mesh(diskGeom, diskMat);
  disk.rotation.x = Math.PI / 2;
  disk.position.y = -height * 0.3;
  group.add(disk);

  return group;
}

export function createSideBoostersAddon(radius, height) {
  const group = new THREE.Group();
  group.name = 'sideBoostersAddon';

  [-1, 1].forEach((dir) => {
    const bGroup = new THREE.Group();

    const bodyGeom = new THREE.CylinderGeometry(radius * 0.5, radius * 0.5, height * 0.8, 32);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    bGroup.add(body);

    const noseGeom = new THREE.ConeGeometry(radius * 0.5, height * 0.2, 32);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xc53030, metalness: 0.9 });
    const nose = new THREE.Mesh(noseGeom, noseMat);
    nose.position.y = height * 0.5;
    bGroup.add(nose);

    const nozzleGeom = new THREE.CylinderGeometry(radius * 0.15, radius * 0.35, height * 0.15, 32, 1, true);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, side: THREE.DoubleSide });
    const nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
    nozzle.position.y = -height * 0.475;
    bGroup.add(nozzle);

    const strutGeom = new THREE.BoxGeometry(radius * 0.7, 0.15, 0.15);
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
    const strut = new THREE.Mesh(strutGeom, strutMat);
    strut.position.x = -dir * radius * 0.35;
    bGroup.add(strut);

    bGroup.position.x = dir * (radius * 1.5);
    group.add(bGroup);
  });

  return group;
}

export function createGridFinsAddon(radius, yPos) {
  const group = new THREE.Group();
  group.name = 'gridFinsAddon';

  const finGeom = new THREE.BoxGeometry(0.04, 0.8, 0.6);
  const finMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.1 });

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI / 2);
    const fin = new THREE.Mesh(finGeom, finMat);
    fin.position.set(Math.cos(angle) * (radius * 1.2), yPos, Math.sin(angle) * (radius * 1.2));
    fin.rotation.y = -angle;
    group.add(fin);
  }

  return group;
}

export function createPlasmaWingsAddon(radius, yPos) {
  const group = new THREE.Group();
  group.name = 'plasmaWingsAddon';

  const wingGeom = new THREE.BoxGeometry(radius * 4.2, 0.06, 1.8);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x0a1d3a,
    metalness: 0.8,
    roughness: 0.2,
    map: TextureGenerator.createSolarPanelTexture()
  });
  const wings = new THREE.Mesh(wingGeom, wingMat);
  wings.position.y = yPos;
  group.add(wings);

  const coilGeom = new THREE.TorusGeometry(radius * 1.1, 0.1, 16, 32);
  const coilMat = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    emissive: 0x00cc66,
    emissiveIntensity: 2.0
  });
  const coil = new THREE.Mesh(coilGeom, coilMat);
  coil.rotation.x = Math.PI / 2;
  coil.position.y = yPos;
  group.add(coil);

  return group;
}

function addRCSQuads(group, radius, yPos) {
  const count = 4;
  const boxGeom = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 });

  for (let i = 0; i < count; i++) {
    const angle = (i * Math.PI * 2) / count;
    const rcs = new THREE.Mesh(boxGeom, boxMat);
    rcs.position.set(Math.cos(angle) * radius, yPos, Math.sin(angle) * radius);
    group.add(rcs);
  }
}

function addGlowingRings(group, radius, yPos, colorHex, emissiveHex, count = 1) {
  const ringGeom = new THREE.TorusGeometry(radius * 1.05, 0.08, 12, 32);
  const ringMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: emissiveHex,
    emissiveIntensity: 2.5,
    metalness: 0.9
  });

  for (let i = 0; i < count; i++) {
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    const yOffset = count > 1 ? ((i / (count - 1)) - 0.5) * yPos * 0.8 : yPos;
    ring.position.y = yOffset;
    ring.name = 'containmentRing';
    group.add(ring);
  }
}

function getNozzleOffsets(count, radius) {
  if (count === 1) return [{ x: 0, z: 0 }];
  if (count === 3) {
    return [
      { x: 0, z: radius },
      { x: radius * Math.cos(Math.PI / 6), z: -radius * Math.sin(Math.PI / 6) },
      { x: -radius * Math.cos(Math.PI / 6), z: -radius * Math.sin(Math.PI / 6) }
    ];
  }
  return [
    { x: radius, z: radius },
    { x: -radius, z: radius },
    { x: radius, z: -radius },
    { x: -radius, z: -radius }
  ];
}
