type Three = any;

const MARKET_CATEGORIES = [
  "FRESH PRODUCE", "VEGETABLES", "FRESH SEAFOOD", "MEAT & POULTRY",
  "FRUITS", "DRY GOODS", "GROCERY", "LOCAL SPECIALTIES"
];

function standardMaterial(THREE: Three, color: string, roughness = 0.78, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addBox(
  THREE: Three, parent: Three, size: [number, number, number],
  position: [number, number, number], material: Three, cast = true
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addBeam(
  THREE: Three, parent: Three,
  start: [number, number, number], end: [number, number, number],
  width: number, height: number, material: Three
) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, direction.length(), height),
    material
  );
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeLabelTexture(THREE: Three, title: string, subtitle?: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#173c31";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#c59d57";
  ctx.fillRect(0, 0, canvas.width, 6);
  ctx.fillRect(0, canvas.height - 6, canvas.width, 6);
  ctx.fillStyle = "#f4eee0";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 39px Arial, sans-serif";
  ctx.fillText(title, canvas.width / 2, subtitle ? 56 : 65);
  if (subtitle) {
    ctx.fillStyle = "#c8d5c9";
    ctx.font = "500 14px Arial, sans-serif";
    ctx.fillText(subtitle, canvas.width / 2, 94);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addFrontMarketSign(THREE: Three, parent: Three, materials: Three) {
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(8.8, 1.08),
    new THREE.MeshStandardMaterial({
      map: materials.mainSign,
      roughness: 0.68,
      metalness: 0.04,
      side: THREE.DoubleSide
    })
  );
  board.position.set(0, 5.1, 11.18);
  board.castShadow = true;
  parent.add(board);

  const frame = addBox(THREE, parent, [9.05, 1.28, 0.12], [0, 5.1, 11.07], materials.darkMetal);
  frame.position.z = 11.07;
  frame.renderOrder = 1;
  board.renderOrder = 2;
}

function addRoofCompletion(THREE: Three, parent: Three, materials: Three) {
  // The supplied OBJ contains one sloping roof plane. This mirrors the observed
  // gable slope to make a complete roof form; it is a visualization completion.
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    -30.5, 8.5, -3.25,
     30.5, 8.5, -3.25,
    -30.5, 6.0, 10.75,
     30.5, 6.0, 10.75
  ]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 2, 1, 2, 3, 1]);
  geometry.computeVertexNormals();
  const roof = new THREE.Mesh(geometry, materials.roof);
  roof.castShadow = true;
  roof.receiveShadow = true;
  parent.add(roof);

  const steel = materials.darkMetal;
  // Repeat the visible source truss rhythm along the existing column grid.
  const trussXs = [-27, -21, -15, -9, -3, 3, 9, 15, 21];
  trussXs.forEach((x) => {
    addBeam(THREE, parent, [x, 5.9, -17.25], [x, 5.9, 10.75], 0.16, 0.16, steel);
    addBeam(THREE, parent, [x, 5.95, -17.25], [x, 8.45, -3.25], 0.15, 0.18, steel);
    addBeam(THREE, parent, [x, 8.45, -3.25], [x, 5.95, 10.75], 0.15, 0.18, steel);
    addBeam(THREE, parent, [x, 5.98, -3.25], [x, 8.34, -3.25], 0.12, 0.12, steel);
    addBeam(THREE, parent, [x, 6.0, -10.25], [x, 7.2, -3.25], 0.10, 0.10, steel);
    addBeam(THREE, parent, [x, 7.2, -3.25], [x, 6.0, 3.75], 0.10, 0.10, steel);
  });

  addBeam(THREE, parent, [-30, 6.0, 10.75], [30, 6.0, 10.75], 0.22, 0.22, steel);
  addBeam(THREE, parent, [-30, 8.45, -3.25], [30, 8.45, -3.25], 0.22, 0.22, steel);
  addBeam(THREE, parent, [-30, 6.0, -17.25], [30, 6.0, -17.25], 0.22, 0.22, steel);

  // Fine raised seams make the sheet-metal roof read as corrugated at a distance.
  const ribMaterial = new THREE.MeshStandardMaterial({
    color: "#788187", roughness: 0.58, metalness: 0.58
  });
  const ribCount = 82;
  const ribs = new THREE.InstancedMesh(
    new THREE.BoxGeometry(61, 0.035, 0.045),
    ribMaterial,
    ribCount
  );
  const ribTransform = new THREE.Object3D();
  let ribIndex = 0;
  for (let i = 1; i < 42; i += 1) {
    const t = i / 42;
    const zBack = -3.25 - 14 * t;
    const yBack = 8.5 - 2.5 * t;
    const zFront = -3.25 + 14 * t;
    const yFront = 8.5 - 2.5 * t;
    [[yBack + 0.025, zBack], [yFront + 0.025, zFront]].forEach(([y, z]) => {
      ribTransform.position.set(0, y, z);
      ribTransform.updateMatrix();
      ribs.setMatrixAt(ribIndex, ribTransform.matrix);
      ribIndex += 1;
    });
  }
  ribs.instanceMatrix.needsUpdate = true;
  ribs.receiveShadow = true;
  parent.add(ribs);
}

function addCrate(THREE: Three, parent: Three, x: number, y: number, z: number, material: Three) {
  // Compact open-top display bin represented as one low-poly crate shell.
  addBox(THREE, parent, [0.72, 0.22, 0.48], [x, y + 0.11, z], material, false);
}

function addStall(
  THREE: Three,
  parent: Three,
  x: number,
  z: number,
  side: number,
  index: number,
  category: string,
  materials: Three,
  fruitTransforms: Record<string, Array<{ p: [number, number, number]; s: [number, number, number] }>>
) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  parent.add(group);

  const facing = -side;
  const backZ = side * 1.08;
  const counterMaterial = index % 3 === 0 ? materials.greenPaint : materials.warmPaint;

  addBox(THREE, group, [3.8, 1.28, 2.2], [0, 0.72, 0], counterMaterial);
  addBox(THREE, group, [3.92, 0.12, 2.28], [0, 1.42, 0], materials.counterTop);
  addBox(THREE, group, [3.8, 0.06, 0.12], [0, 1.52, facing * 1.03], materials.trim);
  addBox(THREE, group, [3.8, 1.25, 0.13], [0, 2.05, backZ], materials.partition);

  // Stall uprights and a restrained fascia, matching the scale of the source module.
  [-1.82, 1.82].forEach((px) => {
    addBox(THREE, group, [0.09, 2.2, 0.09], [px, 2.55, backZ], materials.darkMetal);
    addBox(THREE, group, [0.12, 0.12, 2.35], [px, 1.52, backZ * 0.45], materials.darkMetal);
  });
  addBox(THREE, group, [3.8, 0.17, 0.14], [0, 3.48, backZ], materials.darkMetal);

  const labelTexture = makeLabelTexture(THREE, category, "CAINTA MARKET · VISUALIZATION");
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(3.55, 0.56),
    new THREE.MeshStandardMaterial({ map: labelTexture, roughness: 0.7, side: THREE.DoubleSide })
  );
  label.position.set(0, 3.5, backZ + (facing * 0.09));
  if (facing < 0) label.rotation.y = Math.PI;
  group.add(label);

  // Four produce crates on the customer-facing half of the counter.
  const displayZ = facing * 0.56;
  const crateXs = [-1.23, -0.41, 0.41, 1.23];
  const crateType = index % 4;
  const crateMat = crateType === 0 ? materials.crateGreen : crateType === 1 ? materials.crateRed : materials.crateBlue;
  crateXs.forEach((cx, crateIndex) => {
    const crateZ = displayZ + (crateIndex % 2 === 0 ? -side * 0.05 : side * 0.05);
    addCrate(THREE, group, cx, 1.62, crateZ, crateMat);
    const productClass = category.includes("SEAFOOD")
      ? "seafood"
      : category.includes("MEAT")
        ? "meat"
        : category.includes("DRY") || category.includes("GROCERY")
          ? "dry"
          : "";
    const type = productClass || ["red", "orange", "green", "yellow", "leafy"][((index + crateIndex) % 5)];
    const positions = fruitTransforms[type] || (fruitTransforms[type] = []);
    for (let j = 0; j < 9; j += 1) {
      const col = j % 3;
      const row = Math.floor(j / 3);
      const jitterX = ((j * 17 + index * 13) % 7 - 3) * 0.018;
      const jitterZ = ((j * 11 + index * 5) % 7 - 3) * 0.018;
      const px = x + cx + (col - 1) * 0.19 + jitterX;
      const pz = z + crateZ + (row - 1) * 0.12 + jitterZ;
      const py = 1.91 + ((j + crateIndex) % 3) * 0.045;
      const scale: [number, number, number] = type === "leafy"
        ? [0.12, 0.13, 0.16]
        : type === "seafood"
          ? [0.22, 0.075, 0.095]
          : type === "meat"
            ? [0.16, 0.105, 0.145]
            : type === "dry"
              ? [0.13, 0.17, 0.11]
              : [0.115 + (j % 2) * 0.012, 0.12, 0.115 + (j % 3) * 0.008];
      positions.push({ p: [px, py, pz], s: scale });
    }
  });

  // Stack two empty storage crates beneath the customer side of the counter.
  addBox(THREE, group, [0.54, 0.42, 0.54], [-1.35, 0.25, facing * 0.8], materials.crateBlue);
  addBox(THREE, group, [0.54, 0.42, 0.54], [1.35, 0.25, facing * 0.8], materials.crateGreen);
}

function addInstancedProduce(THREE: Three, parent: Three, transforms: Record<string, Array<{ p: [number, number, number]; s: [number, number, number] }>>, materials: Three) {
  const geometry = new THREE.SphereGeometry(0.5, 12, 10);
  const palette: Record<string, Three> = {
    red: materials.produceRed,
    orange: materials.produceOrange,
    green: materials.produceGreen,
    yellow: materials.produceYellow,
    leafy: materials.produceLeafy,
    seafood: materials.produceSeafood,
    meat: materials.produceMeat,
    dry: materials.produceDryGoods
  };
  Object.entries(transforms).forEach(([type, entries]) => {
    const mesh = new THREE.InstancedMesh(geometry, palette[type], entries.length);
    const dummy = new THREE.Object3D();
    entries.forEach((entry, i) => {
      dummy.position.set(entry.p[0], entry.p[1], entry.p[2]);
      dummy.scale.set(entry.s[0], entry.s[1], entry.s[2]);
      dummy.rotation.set((i % 5) * 0.12, (i % 7) * 0.18, (i % 3) * 0.1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    parent.add(mesh);
  });
}

function addPerson(THREE: Three, parent: Three, x: number, z: number, yaw: number, colors: { shirt: string; pants: string; skin: string; hair: string }) {
  const person = new THREE.Group();
  person.position.set(x, 0, z);
  person.rotation.y = yaw;
  parent.add(person);

  const shirt = standardMaterial(THREE, colors.shirt, 0.86);
  const pants = standardMaterial(THREE, colors.pants, 0.9);
  const skin = standardMaterial(THREE, colors.skin, 0.82);
  const hair = standardMaterial(THREE, colors.hair, 0.95);
  const shoe = standardMaterial(THREE, "#343532", 0.95);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.23, 0.48, 4, 8), shirt);
  torso.position.y = 1.05;
  torso.castShadow = true;
  person.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 12), skin);
  head.position.set(0, 1.56, 0.015);
  head.castShadow = true;
  person.add(head);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.53), hair);
  hairCap.position.set(0, 1.59, 0.005);
  person.add(hairCap);

  const makeLimb = (start: [number, number, number], end: [number, number, number], radius: number, material: Three) => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(b, a);
    const limb = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.82, radius, direction.length(), 8), material);
    limb.position.copy(a).add(b).multiplyScalar(0.5);
    limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    limb.castShadow = true;
    person.add(limb);
  };

  makeLimb([-0.12, 0.78, 0], [-0.14, 0.28, 0.02], 0.085, pants);
  makeLimb([0.12, 0.78, 0], [0.15, 0.28, 0.06], 0.085, pants);
  makeLimb([-0.14, 1.25, 0], [-0.28, 0.93, 0.12], 0.065, shirt);
  makeLimb([-0.28, 0.93, 0.12], [-0.23, 0.72, 0.22], 0.05, skin);
  makeLimb([0.14, 1.25, 0], [0.29, 0.98, 0.05], 0.065, shirt);
  makeLimb([0.29, 0.98, 0.05], [0.34, 0.78, 0.16], 0.05, skin);
  [-0.14, 0.15].forEach((lx) => {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.29), shoe);
    foot.position.set(lx, 0.09, 0.075);
    foot.castShadow = true;
    person.add(foot);
  });
}

function addInteriorLights(THREE: Three, parent: Three, materials: Three) {
  for (let x = -24; x <= 24; x += 6) {
    for (const z of [-8.2, 0, 8.2]) {
      const fixture = addBox(THREE, parent, [2.0, 0.07, 0.24], [x, 6.25, z], materials.lightFixture, false);
      fixture.material = materials.lightFixture;
      if (z === 0 && x % 12 === 0) {
        const light = new THREE.PointLight(0xffe2b5, 0.58, 13, 2);
        light.position.set(x, 6.05, z);
        parent.add(light);
      }
    }
  }
}

function addSiteContext(THREE: Three, parent: Three, materials: Three) {
  // Neutral paved forecourt and road context, deliberately not a surveyed site plan.
  addBox(THREE, parent, [110, 0.28, 100], [0, -0.27, 0], materials.siteGround, false);
  addBox(THREE, parent, [92, 0.14, 6.5], [0, -0.13, 20.7], materials.sidewalk, false);
  addBox(THREE, parent, [100, 0.16, 11], [0, -0.17, 29.6], materials.asphalt, false);
  addBox(THREE, parent, [100, 0.18, 0.24], [0, -0.045, 24.1], materials.curb, false);
  for (let x = -42; x <= 42; x += 12) {
    addBox(THREE, parent, [4.5, 0.018, 0.16], [x, -0.075, 29.4], materials.roadMarking, false);
  }

  // A small amount of pavement scoring helps the forecourt read at human scale.
  for (let x = -27; x <= 27; x += 3) {
    addBox(THREE, parent, [0.018, 0.006, 5.5], [x, -0.17, 20.6], materials.pavementJoint, false);
  }
}

export function buildMarketEnvironment(THREE: Three, scene: Three) {
  const group = new THREE.Group();
  group.name = "Illustrative Cainta Market environment";
  scene.add(group);

  const materials = {
    darkMetal: standardMaterial(THREE, "#39464a", 0.58, 0.62),
    roof: new THREE.MeshStandardMaterial({ color: "#657078", roughness: 0.64, metalness: 0.62, side: THREE.DoubleSide }),
    greenPaint: standardMaterial(THREE, "#315b4b", 0.78),
    warmPaint: standardMaterial(THREE, "#8b765d", 0.84),
    counterTop: standardMaterial(THREE, "#a8aaa5", 0.46, 0.28),
    trim: standardMaterial(THREE, "#d0c7b4", 0.78),
    partition: standardMaterial(THREE, "#dad6ca", 0.88),
    crateGreen: standardMaterial(THREE, "#2f644e", 0.88),
    crateRed: standardMaterial(THREE, "#a44236", 0.88),
    crateBlue: standardMaterial(THREE, "#3e626c", 0.84),
    produceRed: standardMaterial(THREE, "#b84935", 0.78),
    produceOrange: standardMaterial(THREE, "#e58b2e", 0.72),
    produceGreen: standardMaterial(THREE, "#648849", 0.86),
    produceYellow: standardMaterial(THREE, "#d6b64f", 0.82),
    produceLeafy: standardMaterial(THREE, "#4b7444", 0.94),
    produceSeafood: standardMaterial(THREE, "#a8b8ba", 0.42, 0.12),
    produceMeat: standardMaterial(THREE, "#aa5e54", 0.78),
    produceDryGoods: standardMaterial(THREE, "#c0a06a", 0.9),
    lightFixture: new THREE.MeshStandardMaterial({ color: "#f8eed9", emissive: "#ffdda1", emissiveIntensity: 1.0, roughness: 0.4 }),
    siteGround: standardMaterial(THREE, "#aaa99f", 0.96),
    sidewalk: standardMaterial(THREE, "#c2bfb5", 0.92),
    asphalt: standardMaterial(THREE, "#454b4d", 0.98),
    curb: standardMaterial(THREE, "#d0c7b8", 0.88),
    roadMarking: standardMaterial(THREE, "#e9e4d2", 0.78),
    pavementJoint: standardMaterial(THREE, "#888b84", 0.98),
    mainSign: makeLabelTexture(THREE, "CAINTA MARKET", "PUBLIC MARKET")
  };
  addSiteContext(THREE, group, materials);
  addRoofCompletion(THREE, group, materials);
  addFrontMarketSign(THREE, group, materials);

  const fruitTransforms: Record<string, Array<{ p: [number, number, number]; s: [number, number, number] }>> = {};
  const xPositions = [-24, -18, -12, -6, 0, 6, 12, 18, 24];
  let stallIndex = 0;
  xPositions.forEach((x) => {
    if (x !== 24) {
      addStall(THREE, group, x, -9.5, -1, stallIndex, MARKET_CATEGORIES[stallIndex % MARKET_CATEGORIES.length], materials, fruitTransforms);
    }
    stallIndex += 1;
    addStall(THREE, group, x, 9.5, 1, stallIndex, MARKET_CATEGORIES[stallIndex % MARKET_CATEGORIES.length], materials, fruitTransforms);
    stallIndex += 1;
  });
  addInstancedProduce(THREE, group, fruitTransforms, materials);

  addInteriorLights(THREE, group, materials);

  // Human-scale silhouettes are illustrative scene dressing, not site documentation.
  addPerson(THREE, group, -13, 1.5, Math.PI / 2, { shirt: "#bf6b43", pants: "#393f40", skin: "#a96f51", hair: "#28211d" });
  addPerson(THREE, group, -5, -2.0, -Math.PI / 2, { shirt: "#426b78", pants: "#45413a", skin: "#bd8968", hair: "#29221e" });
  addPerson(THREE, group, 5, 2.0, Math.PI / 2, { shirt: "#d0b36e", pants: "#343e45", skin: "#966447", hair: "#30241f" });
  addPerson(THREE, group, 14, -1.2, -Math.PI / 2, { shirt: "#6b8760", pants: "#534943", skin: "#b27f61", hair: "#28211d" });
  addPerson(THREE, group, 20, 0.8, Math.PI / 2, { shirt: "#9b5b5b", pants: "#3e4542", skin: "#ac7959", hair: "#28211d" });

  return {
    group,
    dispose() {
      group.traverse((node: Three) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          const list = Array.isArray(node.material) ? node.material : [node.material];
          list.forEach((material: Three) => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        }
      });
      scene.remove(group);
    }
  };
}
