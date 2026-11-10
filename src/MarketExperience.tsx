import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Building2, Box, RotateCcw } from "lucide-react";
import { buildMarketEnvironment } from "./market/createMarketEnvironment";

type ViewKey =
  | "front" | "entrance" | "left" | "right" | "rear"
  | "interior" | "stalls" | "aisle" | "roof" | "aerial";

type ViewDefinition = {
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
};

const VIEWS: Record<ViewKey, ViewDefinition> = {
  front: { label: "Front exterior", position: [0, 17, 59], target: [0, 3.8, 0], fov: 42 },
  entrance: { label: "Main entrance", position: [0, 8, 32], target: [0, 3.4, 10], fov: 40 },
  left: { label: "Left exterior", position: [-54, 17, -1], target: [-2, 4, -2], fov: 43 },
  right: { label: "Right exterior", position: [54, 17, -1], target: [2, 4, -2], fov: 43 },
  rear: { label: "Rear exterior", position: [0, 16, -54], target: [0, 3.8, -5], fov: 43 },
  interior: { label: "Main market hall", position: [28, 4.1, 0], target: [-25, 3.4, 0], fov: 47 },
  stalls: { label: "Vendor stalls", position: [8, 3.0, 6.6], target: [8, 2.0, 9.3], fov: 39 },
  aisle: { label: "Central aisle", position: [0, 5.2, 23], target: [0, 3.0, -15], fov: 48 },
  roof: { label: "Roof structure", position: [0, 43, 23], target: [0, 2.0, -3], fov: 44 },
  aerial: { label: "Aerial overview", position: [0, 78, 41], target: [0, 0, -1], fov: 47 }
};

const VIEW_ORDER: ViewKey[] = [
  "front", "entrance", "left", "right", "rear",
  "interior", "stalls", "aisle", "roof", "aerial"
];

export default function MarketExperience({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneApi = useRef<{ setView: (view: ViewKey) => void; dispose: () => void } | null>(null);
  const animationRef = useRef<number | null>(null);
  const [activeView, setActiveView] = useState<ViewKey>("front");
  const [status, setStatus] = useState("PREPARING 3D ENVIRONMENT");
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    let renderer: any;
    let loadedModel: any;
    let environment: any;
    let resizeObserver: ResizeObserver | undefined;

    const boot = async () => {
      try {
        const loadRemoteModule = new Function("url", "return import(url)") as (url: string) => Promise<any>;
        const THREE = await loadRemoteModule("https://cdn.jsdelivr.net/npm/three@0.170.0/+esm");
        const { OBJLoader } = await loadRemoteModule("https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/OBJLoader.js/+esm");
        if (disposed || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#cbd5d1");
        scene.fog = new THREE.Fog("#cbd5d1", 95, 180);

        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 320);
        const webgl = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        });
        renderer = webgl;
        webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        webgl.outputColorSpace = THREE.SRGBColorSpace;
        webgl.toneMapping = THREE.ACESFilmicToneMapping;
        webgl.toneMappingExposure = 1.18;
        webgl.shadowMap.enabled = true;
        webgl.shadowMap.type = THREE.PCFSoftShadowMap;

        scene.add(new THREE.HemisphereLight(0xe9f1f0, 0x59645a, 1.65));
        scene.add(new THREE.AmbientLight(0xffffff, 0.38));

        const sun = new THREE.DirectionalLight(0xfff0d8, 3.0);
        sun.position.set(-32, 48, 38);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.camera.left = -75;
        sun.shadow.camera.right = 75;
        sun.shadow.camera.top = 75;
        sun.shadow.camera.bottom = -75;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 150;
        sun.shadow.bias = -0.00018;
        sun.shadow.normalBias = 0.035;
        scene.add(sun);

        const fill = new THREE.DirectionalLight(0xd5e2ed, 0.85);
        fill.position.set(35, 22, -35);
        scene.add(fill);

        const loader = new OBJLoader();
        const model = await loader.loadAsync("/models/cainta-market-source.obj");
        if (disposed) {
          model.traverse((node: any) => {
            node.geometry?.dispose?.();
            if (node.material) {
              const materials = Array.isArray(node.material) ? node.material : [node.material];
              materials.forEach((material: any) => material.dispose?.());
            }
          });
          return;
        }

        model.name = "Supplied Cainta Market OBJ";
        model.traverse((node: any) => {
          if (!node.isMesh) return;
          if (node.geometry && !node.geometry.attributes.normal) node.geometry.computeVertexNormals();
          const sourceMaterials = Array.isArray(node.material) ? node.material : [node.material];
          sourceMaterials.forEach((material: any) => {
            if (!material) return;
            material.roughness = 0.82;
            material.metalness = 0.08;
            material.side = THREE.DoubleSide;
            material.vertexColors = Boolean(node.geometry?.attributes?.color);
            material.needsUpdate = true;
          });
          node.castShadow = true;
          node.receiveShadow = true;
        });

        // Rotate first, then center only in plan. Keeping Y unchanged preserves the
        // source model's ground datum; the previous order incorrectly shifted it vertically.
        model.rotation.x = -Math.PI / 2;
        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        model.position.x -= center.x;
        model.position.z -= center.z;
        scene.add(model);
        loadedModel = model;

        environment = buildMarketEnvironment(THREE, scene);

        const draw = () => {
          if (!disposed) webgl.render(scene, camera);
        };

        const resize = () => {
          if (!canvasRef.current || disposed) return;
          const width = Math.max(1, canvas.clientWidth);
          const height = Math.max(1, canvas.clientHeight);
          webgl.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          draw();
        };

        const setView = (view: ViewKey) => {
          if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
          const preset = VIEWS[view];
          const fromPosition = camera.position.clone();
          const fromTarget = new THREE.Vector3();
          camera.getWorldDirection(fromTarget);
          fromTarget.multiplyScalar(20).add(camera.position);
          const fromFov = camera.fov;
          const toPosition = new THREE.Vector3(...preset.position);
          const toTarget = new THREE.Vector3(...preset.target);
          const start = performance.now();
          const duration = 920;

          const animate = (now: number) => {
            if (disposed) return;
            const raw = Math.min(1, (now - start) / duration);
            const eased = raw < 0.5
              ? 4 * raw * raw * raw
              : 1 - Math.pow(-2 * raw + 2, 3) / 2;
            camera.position.lerpVectors(fromPosition, toPosition, eased);
            const target = fromTarget.clone().lerp(toTarget, eased);
            camera.lookAt(target);
            camera.fov = fromFov + (preset.fov - fromFov) * eased;
            camera.updateProjectionMatrix();
            draw();
            if (raw < 1) animationRef.current = requestAnimationFrame(animate);
            else animationRef.current = null;
          };
          animationRef.current = requestAnimationFrame(animate);
        };

        sceneApi.current = {
          setView,
          dispose: () => {
            if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
            environment?.dispose?.();
            loadedModel?.traverse?.((node: any) => {
              node.geometry?.dispose?.();
              if (node.material) {
                const materials = Array.isArray(node.material) ? node.material : [node.material];
                materials.forEach((material: any) => {
                  if (material.map) material.map.dispose?.();
                  material.dispose?.();
                });
              }
            });
            webgl.dispose();
          }
        };

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
        resize();
        setView("front");
        setStatus("MODEL AND MARKET ENVIRONMENT LOADED");
      } catch (cause) {
        if (disposed) return;
        const message = cause instanceof Error ? cause.message : "The 3D environment could not be loaded.";
        setError(message);
        setStatus("3D ENVIRONMENT UNAVAILABLE");
      }
    };

    boot();
    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      sceneApi.current?.dispose();
      sceneApi.current = null;
      if (!sceneApi.current) renderer?.dispose?.();
    };
  }, []);

  const chooseView = (view: ViewKey) => {
    setActiveView(view);
    sceneApi.current?.setView(view);
  };

  return (
    <div className="experience-page experience-page-immersive">
      <header className="experience-header">
        <a className="experience-brand" href="/" onClick={(event) => { event.preventDefault(); onBack(); }}>
          <span className="experience-brand-mark">E</span>
          <span><b>CAINTA MARKET</b><small>IMMERSIVE 3D EXPERIENCE</small></span>
        </a>
        <div className="experience-header-label"><span /> ARCHITECTURAL EXPLORATION</div>
        <button className="experience-back" type="button" onClick={onBack}>
          <ArrowLeft size={16} /> <span>Back to main page</span>
        </button>
      </header>

      <main className="experience-layout experience-layout-viewer">
        <section className="experience-intro experience-intro-wide">
          <div>
            <span className="experience-kicker">CAINTA · RIZAL · PHILIPPINES</span>
            <h1>Explore the market.<br /><em>From every angle.</em></h1>
          </div>
          <p className="experience-description">
            Move through fixed architectural viewpoints of the market hall, vendor stalls,
            entrance and roof. Select a view below; the camera moves automatically and
            cannot be freely dragged, orbited or zoomed.
          </p>
        </section>

        <section className="experience-workspace experience-workspace-wide" aria-label="Cainta Market 3D architectural experience">
          <div className="workspace-heading">
            <div><span>CAINTA MARKET · DIGITAL MODEL</span><b>{VIEWS[activeView].label}</b></div>
            <span className="workspace-index">VIEW / {String(VIEW_ORDER.indexOf(activeView) + 1).padStart(2, "0")} OF 10</span>
          </div>

          <div className="experience-stage experience-stage-static experience-stage-immersive">
            <canvas ref={canvasRef} aria-label="Fixed-view 3D visualization of Cainta Market" />
            {error && (
              <div className="experience-load-error">
                <Box size={25} />
                <b>3D experience unavailable</b>
                <small>{error}</small>
              </div>
            )}
            {!error && status === "PREPARING 3D ENVIRONMENT" && (
              <div className="experience-loading">Preparing the market environment…</div>
            )}
            {!error && status === "MODEL AND MARKET ENVIRONMENT LOADED" && (
              <div className="experience-canvas-caption">ILLUSTRATIVE DIGITAL MODEL · NOT AN AS-BUILT SURVEY</div>
            )}
          </div>

          <div className="experience-view-tabs experience-view-tabs-wide" role="group" aria-label="Select fixed architectural viewpoint">
            {VIEW_ORDER.map((view, index) => (
              <button
                key={view}
                type="button"
                className={activeView === view ? "is-active" : ""}
                aria-pressed={activeView === view}
                onClick={() => chooseView(view)}
              >
                <span className="view-number">{String(index + 1).padStart(2, "0")}</span>
                <span>{VIEWS[view].label}</span>
              </button>
            ))}
            <button type="button" className="view-reset" onClick={() => chooseView("front")}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          <div className="experience-workspace-foot">
            <span><Building2 size={13} /> SOURCE ARCHITECTURE + ILLUSTRATIVE MARKET DRESSING</span>
            <span>FIXED CAMERA PRESETS · NO FREE ORBIT / PAN / ZOOM</span>
          </div>
          <div className="experience-disclaimer experience-disclaimer-wide">
            <span className="experience-status-dot is-ready" />
            <div>
              <b>{status}</b>
              <small>
                The supplied OBJ is the architectural base. The mirrored roof plane, repeated roof framing,
                stalls, produce, people and site context are visualization additions and are not verified
                as-built conditions.
              </small>
            </div>
          </div>
        </section>
      </main>

      <footer className="experience-footer">
        <span>CAINTA MARKET · ARCHITECTURAL VISUALIZATION</span>
        <span>CONCEPT EXPERIENCE · NOT A CONSTRUCTION DOCUMENT</span>
      </footer>
    </div>
  );
}
