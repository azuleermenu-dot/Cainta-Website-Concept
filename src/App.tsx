import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Box, Check, ChevronDown,
  Compass, Info, Layers, LocateFixed, Mail, Menu, Minus, Mouse,
  Navigation, Plus, Search, ShoppingBag, Store, Utensils, X,
  Flame, Shirt, Leaf, CarFront, Building2
} from "lucide-react";

type ViewMode = "3d" | "top" | "street";
type SectionId = "fresh" | "food" | "clothing" | "dry" | "general" | "entrance" | "parking";
type PanelId = "directory" | "about" | "news" | "contact" | null;

type Section = {
  id: SectionId;
  name: string;
  short: string;
  description: string;
  icon: typeof Store;
  position: [number, number, number];
};

const sections: Section[] = [
  { id: "dry", name: "Dry Goods", short: "Dry Goods Section", description: "A conceptual zone for pantry staples, packaged goods, household basics, and everyday essentials.", icon: ShoppingBag, position: [-7, 0, -3] },
  { id: "food", name: "Food Court", short: "Food Court", description: "A sample dining area with spaces for quick meals, refreshments, and shared tables.", icon: Utensils, position: [-5, 0, 5] },
  { id: "fresh", name: "Fresh Produce", short: "Fresh Produce Section", description: "A demonstration area for seasonal fruit, vegetables, and fresh market produce.", icon: Leaf, position: [5, 0, 5] },
  { id: "clothing", name: "Clothing", short: "Clothing Section", description: "A conceptual retail zone for everyday apparel, accessories, and clothing essentials.", icon: Shirt, position: [7, 0, -3] },
  { id: "general", name: "General Merchandise", short: "General Merchandise", description: "A flexible area for household items, useful services, and general retail examples.", icon: Store, position: [0, 0, -7] },
  { id: "entrance", name: "Main Entrance", short: "Entrance & Exit", description: "A clearly marked arrival point for the conceptual marketplace layout.", icon: Navigation, position: [0, 0, 9] },
  { id: "parking", name: "Parking Area", short: "Parking Area", description: "A sample parking and drop-off zone. No real capacity or access information is implied.", icon: CarFront, position: [12, 0, 9] },
];

const listings = [
  { name: "Harvest Corner", category: "Fresh Produce", section: "fresh", detail: "Seasonal fruit, vegetables, and fresh herbs." },
  { name: "The Daily Basket", category: "Dry Goods", section: "dry", detail: "Pantry staples and household essentials." },
  { name: "Corner Cup", category: "Food Court", section: "food", detail: "Coffee, chilled drinks, and light bites." },
  { name: "Thread & Form", category: "Clothing", section: "clothing", detail: "Everyday apparel and accessories." },
  { name: "Homeground Finds", category: "General Merchandise", section: "general", detail: "Kitchenware, storage, and home basics." },
  { name: "Market Table", category: "Food Court", section: "food", detail: "A fictional sample counter for prepared meals." },
  { name: "Green Basket", category: "Fresh Produce", section: "fresh", detail: "A fictional produce stall demonstration." },
  { name: "Everyday Supply", category: "Dry Goods", section: "dry", detail: "A demo listing for packaged goods." },
];

function makeMaterial(color: string, roughness = 0.82, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addBox(parent: THREE.Group, x: number, y: number, z: number, w: number, h: number, d: number, color: string, material?: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material ?? makeMaterial(color));
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createTree(parent: THREE.Group, x: number, z: number, scale = 1) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13 * scale, 0.19 * scale, 1.15 * scale, 7), makeMaterial("#584637"));
  trunk.position.set(x, 0.58 * scale, z);
  trunk.castShadow = true;
  parent.add(trunk);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.88 * scale, 9, 8), makeMaterial("#254d3c"));
  crown.position.set(x, 1.65 * scale, z);
  crown.castShadow = true;
  parent.add(crown);
  const crown2 = new THREE.Mesh(new THREE.SphereGeometry(0.58 * scale, 8, 7), makeMaterial("#356347"));
  crown2.position.set(x + 0.34 * scale, 1.85 * scale, z - 0.24 * scale);
  crown2.castShadow = true;
  parent.add(crown2);
}

function createMarket(parent: THREE.Group, activeRef: MutableRefObject<Map<SectionId, THREE.Vector3>>, markerMeshes: THREE.Object3D[]) {
  const market = new THREE.Group();
  parent.add(market);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(54, 42), makeMaterial("#26312f"));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  market.add(ground);

  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(28, 21), makeMaterial("#9a978a"));
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(0, 0.005, 0);
  plaza.receiveShadow = true;
  market.add(plaza);

  const road = makeMaterial("#30383a");
  addBox(market, 0, -0.02, 13, 42, 0.09, 5, "#30383a", road);
  addBox(market, 0, -0.02, -13, 42, 0.09, 4, "#30383a", road);
  addBox(market, -16, -0.02, 0, 4, 0.09, 28, "#30383a", road);
  addBox(market, 16, -0.02, 0, 4, 0.09, 28, "#30383a", road);

  const lineMat = new THREE.MeshBasicMaterial({ color: "#d7c99c" });
  for (let i = -18; i <= 18; i += 4) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.012, 0.12), lineMat);
    stripe.position.set(i, 0.04, 13);
    market.add(stripe);
  }
  for (let i = -14; i <= 14; i += 4) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 1.7), lineMat);
    stripe.position.set(-16, 0.04, i);
    market.add(stripe);
  }

  const concrete = makeMaterial("#b9b5a8");
  addBox(market, 0, 0.05, 0, 24, 0.35, 16, "#b9b5a8", concrete);

  const wallMat = makeMaterial("#a9a89d");
  const roofMat = makeMaterial("#444b50", 0.52, 0.26);
  const roofLight = makeMaterial("#78848a", 0.5, 0.22);
  const glass = new THREE.MeshStandardMaterial({ color: "#8ca6ab", roughness: 0.22, metalness: 0.15, transparent: true, opacity: 0.42 });
  const darkGlass = new THREE.MeshStandardMaterial({ color: "#21383d", roughness: 0.18, metalness: 0.22, emissive: "#182d32", emissiveIntensity: 0.3 });
  const warmGlass = new THREE.MeshStandardMaterial({ color: "#d3a76d", roughness: 0.25, emissive: "#b66d2d", emissiveIntensity: 0.34 });

  const wings = [
    { x: -7.3, z: -1.0, w: 8.9, d: 12.8, h: 4.7 },
    { x: 2.2, z: -1.1, w: 9.1, d: 12.8, h: 4.7 },
    { x: -2.5, z: 6.0, w: 18.4, d: 3.5, h: 4.0 },
  ];
  wings.forEach((wing, index) => {
    addBox(market, wing.x, 0.42, wing.z, wing.w, wing.h, wing.d, "#aaa99c", wallMat);
    addBox(market, wing.x, 0.42 + wing.h, wing.z, wing.w + 0.48, 0.3, wing.d + 0.48, "#444b50", roofMat);
    addBox(market, wing.x, 0.42 + wing.h + 0.18, wing.z, wing.w - 0.6, 0.08, 0.56, "#829198", roofLight);
    if (index < 2) {
      for (let i = 0; i < 7; i++) {
        const pane = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.75, 0.08), index === 0 ? glass : darkGlass);
        pane.position.set(wing.x - wing.w / 2 + 0.85 + i * 1.15, 2.35, wing.z + wing.d / 2 + 0.045);
        market.add(pane);
      }
    }
  });

  // Glass-fronted central hall and a warm entrance canopy.
  addBox(market, 0, 0.58, 7.15, 10.2, 3.45, 0.16, "#26393a", darkGlass);
  for (let i = 0; i < 11; i++) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.07, 3.5, 0.18), makeMaterial("#8e9995", 0.35, 0.45));
    mullion.position.set(-4.85 + i * 0.97, 2.25, 7.24);
    market.add(mullion);
  }
  addBox(market, 0, 4.0, 7.35, 11.2, 0.26, 1.8, "#b58a4f", makeMaterial("#b58a4f", 0.4, 0.45));
  for (let i = -4; i <= 4; i += 2) {
    const column = addBox(market, i, 0.4, 7.9, 0.18, 3.6, 0.18, "#d0c5ae");
    column.material = makeMaterial("#d0c5ae", 0.45, 0.12);
  }

  // Skylights and rooftop service structures add scale and architectural detail.
  for (let i = -8; i <= 8; i += 2.5) {
    const skylight = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.11, 3.4), new THREE.MeshStandardMaterial({ color: "#9daeb3", metalness: 0.28, roughness: 0.24, transparent: true, opacity: 0.72 }));
    skylight.position.set(i, 5.55, -1.2);
    market.add(skylight);
  }
  for (let i = 0; i < 6; i++) {
    addBox(market, -8.3 + i * 3.3, 5.0, -5.8, 1.0, 0.6, 0.9, "#53595b");
  }

  // A grid of small vendor counters makes the interior read as a real market.
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      const x = -9.6 + col * 2.7;
      const z = -3.6 + row * 2.8;
      addBox(market, x, 0.62, z, 1.65, 1.08, 1.2, "#806b52");
      addBox(market, x, 1.75, z, 1.75, 0.12, 1.28, "#c5a06b");
      addBox(market, x, 1.2, z + 0.67, 1.5, 0.48, 0.08, "#37463c");
    }
  }

  // Smaller structures around the central complex establish an urban context.
  const neighborhood: Array<[number, number, number, number, string]> = [
    [-22, -14, 6, 5, "#747b7c"], [-11, -19, 7, 6, "#8a8980"], [1, -20, 8, 7, "#777f80"],
    [13, -18, 7, 5, "#686f73"], [22, -11, 6, 6, "#8d8171"], [22, 2, 6, 4, "#717a79"],
    [21, 15, 7, 5, "#777d7a"], [-22, 15, 7, 4, "#867c70"], [-22, 1, 6, 6, "#707b7b"],
    [-14, 19, 7, 5, "#736d68"], [0, 20, 7, 4, "#747c78"], [12, 20, 6, 5, "#8b8275"],
  ];
  neighborhood.forEach(([x, z, w, h, color], i) => {
    addBox(market, x, 0, z, w, h, 5.2, color);
    addBox(market, x, h, z, w + 0.25, 0.24, 5.45, "#42494e", roofMat);
    for (let j = 0; j < 3; j++) {
      const window = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.9, 0.06), i % 3 === 0 ? warmGlass : darkGlass);
      window.position.set(x - w / 2 + 1.25 + j * 1.65, 1.7 + (i % 2) * 0.6, z + 2.63);
      market.add(window);
    }
  });

  const lampMat = new THREE.MeshStandardMaterial({ color: "#e1bd7a", emissive: "#e9a54b", emissiveIntensity: 1.7 });
  for (let i = -14; i <= 14; i += 7) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 3.2, 6), makeMaterial("#3d4642", 0.45, 0.4));
    pole.position.set(i, 1.6, 10.7);
    market.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 7), lampMat);
    bulb.position.set(i, 3.18, 10.7);
    market.add(bulb);
  }

  [
    [-13, -10, 1.0], [-13, 8, 1.1], [13, -10, 0.9], [14, 7, 1.2],
    [-19, -5, 0.9], [19, 5, 1.0], [-18, 10, 1.0], [18, -4, 0.85],
    [-7, 15, 0.8], [7, 15, 0.85], [-4, -17, 0.9], [9, -16, 0.9],
  ].forEach(([x, z, s]) => createTree(market, x, z, s));

  // A simple parking bay pattern with neutral, illustrative vehicle shapes.
  for (let i = 0; i < 5; i++) {
    const x = 9.5 + i * 1.35;
    const car = addBox(market, x, 0.16, 11.8, 0.9, 0.48, 1.75, i % 2 ? "#56636a" : "#9f8b70");
    car.material = makeMaterial(i % 2 ? "#56636a" : "#9f8b70", 0.4, 0.25);
    addBox(market, x, 0.63, 11.8, 0.68, 0.3, 0.9, "#293b40", makeMaterial("#293b40", 0.25, 0.18));
  }

  // Raised glowing markers are real scene objects and can be selected by raycasting.
  sections.forEach((section) => {
    const [x, , z] = section.position;
    activeRef.current.set(section.id, new THREE.Vector3(x, 0, z));
    const marker = new THREE.Group();
    marker.position.set(x, 0.35, z);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 7), new THREE.MeshBasicMaterial({ color: "#edbd61" }));
    stem.position.y = 0.55;
    marker.add(stem);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), new THREE.MeshStandardMaterial({ color: "#f5c46d", emissive: "#f3a63e", emissiveIntensity: 1.5, metalness: 0.3 }));
    orb.position.y = 1.16;
    marker.add(orb);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.035, 7, 28), new THREE.MeshBasicMaterial({ color: "#efbd67" }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.13;
    marker.add(ring);
    marker.userData.sectionId = section.id;
    markerMeshes.push(orb);
    market.add(marker);
  });

  return market;
}

function MarketScene({ mode, selected, onSelect, onReady }: { mode: ViewMode; selected: SectionId | null; onSelect: (id: SectionId) => void; onReady: (ready: boolean) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pointsRef = useRef<Map<SectionId, THREE.Vector3>>(new Map());
  const markerRefs = useRef<THREE.Object3D[]>([]);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer | null = null;
    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let controls: OrbitControls | null = null;
    let disposed = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#151d20");
    scene.fog = new THREE.Fog("#151d20", 32, 82);
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 140);
    camera.position.set(27, 24, 30);
    cameraRef.current = camera;

    try {
      renderer = new THREE.WebGLRenderer({ antialias: window.innerWidth > 720, alpha: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 720 ? 1.35 : 1.8));
      renderer.shadowMap.enabled = window.innerWidth > 720;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.domElement.className = "market-canvas";
      renderer.domElement.setAttribute("aria-label", "Interactive 3D conceptual marketplace. Drag to rotate and pinch to zoom.");
      host.appendChild(renderer.domElement);
    } catch {
      onReady(false);
      return () => { disposed = true; };
    }

    scene.add(new THREE.HemisphereLight("#d9e0e0", "#29352f", 2.1));
    const sun = new THREE.DirectionalLight("#ffe2b4", 3.0);
    sun.position.set(-16, 28, 16);
    sun.castShadow = window.innerWidth > 720;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    scene.add(sun);
    const fill = new THREE.DirectionalLight("#8ca2c8", 1.25);
    fill.position.set(18, 14, -20);
    scene.add(fill);

    const markerMeshes: THREE.Object3D[] = [];
    createMarket(scene, pointsRef, markerMeshes);
    markerRefs.current = markerMeshes;
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = true;
    controls.minDistance = 12;
    controls.maxDistance = 56;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.target.set(0, 1.0, 0);
    controlsRef.current = controls;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerUp = (event: PointerEvent) => {
      if (!renderer) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(markerMeshes, true);
      const marker = intersects.find((hit) => hit.object.parent?.userData.sectionId);
      const id = marker?.object.parent?.userData.sectionId as SectionId | undefined;
      if (id) selectRef.current(id);
    };
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const resize = () => {
      if (!renderer || !host) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed || !renderer) return;
      const elapsed = clock.getElapsedTime();
      markerRefs.current.forEach((marker, index) => {
        const parent = marker.parent;
        if (parent) {
          const orb = parent.children[1];
          if (orb) orb.position.y = 1.16 + Math.sin(elapsed * 2.2 + index * 0.8) * 0.08;
        }
      });
      controls?.update();
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };
    onReady(true);
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      renderer?.domElement.removeEventListener("pointerup", onPointerUp);
      controls?.dispose();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material.dispose();
        }
      });
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, [onReady]);

  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const presets: Record<ViewMode, { camera: THREE.Vector3; target: THREE.Vector3 }> = {
      "3d": { camera: new THREE.Vector3(27, 24, 30), target: new THREE.Vector3(0, 1, 0) },
      top: { camera: new THREE.Vector3(0, 45, 0.01), target: new THREE.Vector3(0, 0, 0) },
      street: { camera: new THREE.Vector3(0, 4.2, 19), target: new THREE.Vector3(0, 3.2, -3) },
    };
    const destination = presets[mode];
    const fromPosition = camera.position.clone();
    const fromTarget = controls.target.clone();
    const started = performance.now();
    const duration = 950;
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(fromPosition, destination.camera, eased);
      controls.target.lerpVectors(fromTarget, destination.target, eased);
      controls.update();
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  useEffect(() => {
    if (!selected) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const point = pointsRef.current.get(selected);
    if (!camera || !controls || !point) return;
    const direction = camera.position.clone().sub(controls.target).normalize();
    const destination = point.clone().add(new THREE.Vector3(direction.x * 10, 8, direction.z * 10));
    const fromPosition = camera.position.clone();
    const fromTarget = controls.target.clone();
    const target = point.clone().add(new THREE.Vector3(0, 1.6, 0));
    const started = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 850);
      const eased = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(fromPosition, destination, eased);
      controls.target.lerpVectors(fromTarget, target, eased);
      controls.update();
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selected]);

  return <div className="scene-host" ref={hostRef}><div className="scene-vignette" /><div className="scene-grain" /></div>;
}

function App() {
  const [mode, setMode] = useState<ViewMode>("3d");
  const [selected, setSelected] = useState<SectionId | null>(null);
  const [panel, setPanel] = useState<PanelId>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [tourRunning, setTourRunning] = useState(false);
  const [zoom, setZoom] = useState(0);
  const tourIndex = useRef(0);

  const activeSection = sections.find((section) => section.id === selected) ?? null;
  const filteredListings = useMemo(() => listings.filter((item) =>
    (category === "All" || item.category === category) &&
    (item.name + " " + item.category + " " + item.detail).toLowerCase().includes(query.toLowerCase())
  ), [category, query]);

  const closePanel = useCallback(() => setPanel(null), []);
  const onSceneReady = useCallback((ready: boolean) => setSceneReady(ready), []);

  useEffect(() => {
    if (!tourRunning) return;
    const timer = window.setInterval(() => {
      const next = sections[tourIndex.current % sections.length];
      setSelected(next.id);
      tourIndex.current += 1;
    }, 3300);
    return () => window.clearInterval(timer);
  }, [tourRunning]);

  useEffect(() => {
    if (!panel && !mobileMenu) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanel(null);
        setMobileMenu(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [panel, mobileMenu]);

  const startTour = () => {
    setPanel(null);
    setMode("3d");
    setTourRunning((running) => !running);
    if (!tourRunning) {
      tourIndex.current = 0;
      setSelected(sections[0].id);
    }
  };

  const selectSection = (id: SectionId) => {
    setSelected(id);
    setMode("3d");
    setTourRunning(false);
    setPanel(null);
  };

  const navAction = (id: PanelId) => {
    setPanel(id);
    setMobileMenu(false);
    setTourRunning(false);
  };

  return (
    <main className="experience-shell">
      <MarketScene mode={mode} selected={selected} onSelect={selectSection} onReady={onSceneReady} />

      <header className="topbar">
        <button className="brand-lockup" onClick={() => { setSelected(null); setMode("3d"); setPanel(null); }} aria-label="Reset marketplace view">
          <span className="brand-symbol"><span /><span /><span /></span>
          <span className="brand-wordmark"><strong>MARKETPLACE</strong><small>3D DEMO CONCEPT</small></span>
        </button>
        <span className="location-chip"><LocateFixed size={14} /> CONCEPT ENVIRONMENT</span>
        <nav className="desktop-links" aria-label="Main navigation">
          <button className={panel === null ? "selected" : ""} onClick={() => { setPanel(null); setMode("3d"); }}> <Box size={15} /> 3D Experience</button>
          <button className={panel === "directory" ? "selected" : ""} onClick={() => navAction("directory")}><Store size={15} /> Directory</button>
          <button className={panel === "about" ? "selected" : ""} onClick={() => navAction("about")}><Info size={15} /> About</button>
          <button className={panel === "news" ? "selected" : ""} onClick={() => navAction("news")}><Layers size={15} /> News</button>
          <button className={panel === "contact" ? "selected" : ""} onClick={() => navAction("contact")}><Mail size={15} /> Contact</button>
        </nav>
        <button className="explore-top" onClick={startTour}>{tourRunning ? "Stop Tour" : "Explore Marketplace"} <ArrowUpRight size={15} /></button>
        <button className="mobile-menu-button" aria-label="Open navigation" aria-expanded={mobileMenu} onClick={() => setMobileMenu((open) => !open)}>{mobileMenu ? <X size={20} /> : <Menu size={20} />}</button>
      </header>

      <AnimatePresence>
        {mobileMenu && <motion.nav className="mobile-nav-panel" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          <button onClick={() => { setPanel(null); setMobileMenu(false); setMode("3d"); }}>3D Experience <Box size={16} /></button>
          <button onClick={() => navAction("directory")}>Directory <Store size={16} /></button>
          <button onClick={() => navAction("about")}>About <Info size={16} /></button>
          <button onClick={() => navAction("news")}>News <Layers size={16} /></button>
          <button onClick={() => navAction("contact")}>Contact <Mail size={16} /></button>
        </motion.nav>}
      </AnimatePresence>

      <section className="hero-copy" aria-label="Marketplace introduction">
        <div className="eyebrow"><span /> DISCOVER · EXPLORE · EXPERIENCE</div>
        <h1>Explore the<br /><em>Marketplace</em></h1>
        <p>Discover a new way to explore a marketplace. Navigate its spaces, find demo stalls, and experience an interactive 3D concept.</p>
        <button className="tour-button" onClick={startTour}><span className="play-icon">{tourRunning ? "Ⅱ" : "▶"}</span>{tourRunning ? "Pause Virtual Tour" : "Start Virtual Tour"} <ArrowRight size={17} /></button>
        <div className="hero-caption"><span className="caption-line" />A FICTIONAL 3D MARKETPLACE DEMONSTRATION</div>
      </section>

      <div className="scene-status"><span className={sceneReady ? "status-dot ready" : "status-dot"} />{sceneReady ? "3D ENVIRONMENT READY" : "INITIALIZING 3D ENVIRONMENT"}</div>

      <aside className="overview-card">
        <div className="card-title"><b>Market Overview</b><span><Compass size={15} /> N</span></div>
        <button className="mini-map" style={{ transform: "scale(" + (1 + zoom * 0.045) + ")" }} aria-label="Select marketplace overview" onClick={() => { setMode("top"); setSelected(null); }}>
          <span className="map-road road-a" /><span className="map-road road-b" /><span className="map-building building-a" /><span className="map-building building-b" /><span className="map-building building-c" /><span className="map-glow" /><span className="map-pin" />
        </button>
        <div className="map-actions"><button onClick={() => setZoom((z) => Math.min(z + 1, 3))} aria-label="Zoom in"><Plus size={15} /></button><button onClick={() => setZoom((z) => Math.max(z - 1, -3))} aria-label="Zoom out"><Minus size={15} /></button></div>
        <span className="map-hint">TAP MAP FOR TOP VIEW</span>
      </aside>

      <div className="scene-labels" aria-label="Marketplace sections">
        {[
          { id: "dry" as const, cls: "label-dry", icon: ShoppingBag },
          { id: "food" as const, cls: "label-food", icon: Utensils },
          { id: "fresh" as const, cls: "label-fresh", icon: Flame },
          { id: "clothing" as const, cls: "label-clothing", icon: Shirt },
        ].map((marker) => {
          const section = sections.find((item) => item.id === marker.id)!;
          const Icon = marker.icon;
          return <button key={marker.id} className={"scene-label " + marker.cls + (selected === marker.id ? " active" : "")} onClick={() => selectSection(marker.id)}>
            <span className="label-icon"><Icon size={18} /></span><span>{section.short}</span>
          </button>;
        })}
      </div>

      <section className="market-info-card">
        <div className="market-thumb"><span className="thumb-roof" /><span className="thumb-glass" /><span className="thumb-light" /></div>
        <div className="info-main"><b>Marketplace Demo Concept <span className="verified-dot">DEMO</span></b><small>Interactive architectural visualization</small><div className="open-line"><span><i /> DEMO ENVIRONMENT</span><span>ILLUSTRATIVE ONLY</span></div><p><UsersIcon /> A sample marketplace experience for exploration and discovery.</p></div>
      </section>

      <div className="quick-actions">
        <button onClick={() => navAction("directory")}><Store size={18} /><span>Find Stalls</span></button>
        <button onClick={() => { setMode("street"); setSelected("entrance"); }}><Navigation size={18} /><span>Street View</span></button>
        <button onClick={() => navAction("about")}><Info size={18} /><span>Market Info</span></button>
      </div>

      <div className="view-controls">
        <span className="view-label">View Mode:</span>
        <button className={mode === "3d" ? "active" : ""} onClick={() => setMode("3d")}><Box size={18} /> 3D View</button>
        <button className={mode === "top" ? "active" : ""} onClick={() => { setMode("top"); setSelected(null); }}><Layers size={18} /> Top View</button>
        <button className={mode === "street" ? "active" : ""} onClick={() => { setMode("street"); setSelected(null); }}><Navigation size={18} /> Street View</button>
      </div>

      <div className="drag-guide"><div className="guide-arrows"><ArrowDownRight size={18} /><Mouse size={28} /><ArrowDownRight size={18} /></div><b>Drag to explore</b><span>Pinch or scroll to zoom</span></div>
      <div className="signature-mark"><span>Marketplace</span><small>3D DEMO CONCEPT</small></div>
      {activeSection && <motion.div className="selected-section-card" key={activeSection.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
        <button className="selection-close" onClick={() => setSelected(null)} aria-label="Close selected section"><X size={15} /></button>
        <span className="card-kicker">SELECTED MARKETPLACE ZONE</span><b>{activeSection.name}</b><p>{activeSection.description}</p><button className="small-link" onClick={() => navAction("directory")}>Browse demo stalls <ArrowRight size={14} /></button>
      </motion.div>}

      <AnimatePresence>
        {panel && <motion.div className="panel-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePanel}>
          <motion.aside className="content-panel" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 35, opacity: 0 }} transition={{ type: "spring", damping: 26, stiffness: 240 }} onClick={(event) => event.stopPropagation()}>
            <div className="panel-header"><div><span>3D MARKETPLACE EXPERIENCE</span><h2>{panel === "directory" ? "Marketplace Directory" : panel === "about" ? "About the Concept" : panel === "news" ? "Demo Updates" : "Contact"}</h2></div><button onClick={closePanel} aria-label="Close panel"><X size={20} /></button></div>
            {panel === "directory" && <div className="directory-panel">
              <p>Explore fictional stall examples and jump to their conceptual section in the 3D environment.</p>
              <div className="panel-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search demo stalls..." /></div>
              <div className="category-select"><label htmlFor="category-filter">Category</label><select id="category-filter" value={category} onChange={(event) => setCategory(event.target.value)}><option>All</option>{Array.from(new Set(listings.map((item) => item.category))).map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></div>
              <div className="listing-results">{filteredListings.map((item) => {
                const zone = sections.find((section) => section.id === item.section)!;
                return <button key={item.name} className="listing-row" onClick={() => selectSection(zone.id)}><span className="listing-icon"><Store size={17} /></span><span><b>{item.name}</b><small>{item.category} · Demo listing</small><em>{item.detail}</em></span><ArrowUpRight size={16} /></button>;
              })}{filteredListings.length === 0 && <p className="no-results">No demo stalls match that search.</p>}</div>
              <div className="panel-disclaimer">All stall names and details are fictional placeholders, not real vendors or confirmed locations.</div>
            </div>}
            {panel === "about" && <div className="static-panel-content"><div className="panel-feature-icon"><Building2 size={23} /></div><p className="panel-lead">A digital twin-inspired marketplace demo.</p><p>This independent concept explores how a marketplace could be presented through an interactive 3D environment, navigable zones, and a sample stall directory.</p><div className="stat-grid"><div><b>07</b><small>Concept zones</small></div><div><b>03</b><small>Camera modes</small></div><div><b>08</b><small>Demo listings</small></div></div><div className="panel-disclaimer">This is a fictional visualization. It does not represent the layout, ownership, identity, or facilities of any real marketplace.</div></div>}
            {panel === "news" && <div className="static-panel-content"><p className="panel-lead">A sample community noticeboard.</p>{["Marketplace exploration demo is ready","New concept zones added to the 3D map","Directory search and category filters are available"].map((item, index) => <article className="news-row" key={item}><span>{"DEMO UPDATE · " + String(index + 1).padStart(2, "0")}</span><b>{item}</b><p>Illustrative product update for this interactive website concept.</p></article>)}<div className="panel-disclaimer">These are fictional interface examples, not real announcements or events.</div></div>}
            {panel === "contact" && <div className="static-panel-content"><div className="panel-feature-icon"><Mail size={23} /></div><p className="panel-lead">This is a demonstration contact panel.</p><p>No real organization or contact channel is represented. Replace this panel only with verified contact details and an approved form endpoint before publishing.</p><button className="panel-primary" onClick={closePanel}>Understood <Check size={16} /></button></div>}
          </motion.aside>
        </motion.div>}
      </AnimatePresence>
      <div className="demo-disclaimer">FICTIONAL WEBSITE DEMONSTRATION · NOT AN OFFICIAL MARKETPLACE SITE</div>
    </main>
  );
}

function UsersIcon() {
  return <span className="people-symbol" aria-hidden="true">◉</span>;
}

export default App;
