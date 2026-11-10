import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Box, Building2, RotateCcw } from "lucide-react";

type ViewKey = "exterior" | "entrance" | "interior" | "rear" | "top";
type ViewDefinition = { label: string; position: [number, number, number]; target: [number, number, number] };

const VIEWS: Record<ViewKey, ViewDefinition> = {
  exterior: { label: "Exterior", position: [0, 18, 42], target: [0, 3, 0] },
  entrance: { label: "Main entrance", position: [0, 10, 32], target: [0, 3, 0] },
  interior: { label: "Interior", position: [0, 5.2, 1.5], target: [0, 3.2, -8] },
  rear: { label: "Rear", position: [0, 16, -42], target: [0, 3, 0] },
  top: { label: "Roof / top", position: [0, 62, 0.01], target: [0, 0, 0] },
};

export default function MarketExperience({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneApi = useRef<{ setView: (view: ViewKey) => void; dispose: () => void } | null>(null);
  const [activeView, setActiveView] = useState<ViewKey>("exterior");
  const [status, setStatus] = useState("LOADING ORIGINAL MODEL");
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    let renderer: any;
    let resizeObserver: ResizeObserver | undefined;

    const boot = async () => {
      try {
        const loadRemoteModule = new Function("url", "return import(url)") as (url: string) => Promise<any>;
        const THREE = await loadRemoteModule("https://cdn.jsdelivr.net/npm/three@0.170.0/+esm");
        const { OBJLoader } = await loadRemoteModule("https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/OBJLoader.js/+esm");
        if (disposed || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#dfe3d9");
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 500);
        const webgl = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        renderer = webgl;
        webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
        webgl.outputColorSpace = THREE.SRGBColorSpace;
        webgl.toneMapping = THREE.ACESFilmicToneMapping;
        webgl.toneMappingExposure = 1.15;

        scene.add(new THREE.HemisphereLight(0xffffff, 0x657267, 2.1));
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
        keyLight.position.set(-24, 42, 28);
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0xffffff, 1.1);
        fillLight.position.set(26, 18, -25);
        scene.add(fillLight);

        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(180, 120),
          new THREE.MeshStandardMaterial({ color: "#c7cec2", roughness: 0.92 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.22;
        scene.add(ground);

        const loader = new OBJLoader();
        const model = await loader.loadAsync("/models/cainta-market-source.obj");
        if (disposed) return;

        model.traverse((node: any) => {
          if (!node.isMesh) return;
          if (node.geometry && !node.geometry.attributes.normal) node.geometry.computeVertexNormals();
          const old = node.material;
          if (old && old.color) {
            old.roughness = 0.78;
            old.metalness = 0.08;
            old.side = THREE.DoubleSide;
            old.vertexColors = true;
          } else {
            node.material = new THREE.MeshStandardMaterial({ color: "#d0c9b8", roughness: 0.8, side: THREE.DoubleSide });
          }
          node.castShadow = true;
          node.receiveShadow = true;
        });

        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.rotation.x = -Math.PI / 2;
        scene.add(model);

        const render = () => {
          const width = Math.max(1, canvas.clientWidth);
          const height = Math.max(1, canvas.clientHeight);
          webgl.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          webgl.render(scene, camera);
        };

        const setView = (view: ViewKey) => {
          const preset = VIEWS[view];
          camera.position.set(...preset.position);
          camera.lookAt(...preset.target);
          render();
        };

        sceneApi.current = { setView, dispose: () => webgl.dispose() };
        setView("exterior");
        resizeObserver = new ResizeObserver(render);
        resizeObserver.observe(canvas);
        setStatus("ORIGINAL OBJ MODEL LOADED");
      } catch (cause) {
        if (disposed) return;
        const message = cause instanceof Error ? cause.message : "Unable to load the original OBJ model.";
        setError(message);
        setStatus("MODEL COULD NOT BE DISPLAYED");
      }
    };

    boot();
    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      sceneApi.current?.dispose();
      sceneApi.current = null;
      renderer?.dispose?.();
    };
  }, []);

  const chooseView = (view: ViewKey) => {
    setActiveView(view);
    sceneApi.current?.setView(view);
  };

  return (
    <div className="experience-page">
      <header className="experience-header">
        <a className="experience-brand" href="/" onClick={(event) => { event.preventDefault(); onBack(); }}>
          <span className="experience-brand-mark">E</span>
          <span><b>EMD CAINTA</b><small>ARCHITECTURAL EXPERIENCE</small></span>
        </a>
        <div className="experience-header-label"><span /> DIGITAL MARKET EXPLORATION</div>
        <button className="experience-back" type="button" onClick={onBack}>
          <ArrowLeft size={16} /> <span>Back to main page</span>
        </button>
      </header>

      <main className="experience-layout experience-layout-viewer">
        <section className="experience-intro">
          <span className="experience-kicker">DIGITAL ARCHITECTURAL MODEL</span>
          <h1>Explore the market.<br /><em>One view at a time.</em></h1>
          <p className="experience-description">
            Select a viewpoint to see the supplied architectural model from the outside,
            entrance, interior, rear, or above. The model itself is fixed: no orbit, drag,
            or free-zoom controls.
          </p>
          <div className="experience-guide">
            <div><span>01</span><p><b>Choose a view</b><small>Tap one of the view tabs below the model.</small></p></div>
            <div><span>02</span><p><b>Inspect the space</b><small>The camera changes to the selected viewpoint.</small></p></div>
            <div><span>03</span><p><b>Return anytime</b><small>Switch views or go back to the main page.</small></p></div>
          </div>
          <div className="experience-disclaimer">
            <span className="experience-status-dot is-ready" />
            <div><b>{status}</b><small>Source: supplied OBJ file. Existing geometry is shown without claiming as-built accuracy.</small></div>
          </div>
        </section>

        <section className="experience-workspace" aria-label="Cainta Market architectural model views">
          <div className="workspace-heading">
            <div><span>EMD CAINTA MARKET</span><b>{VIEWS[activeView].label}</b></div>
            <span className="workspace-index">MODEL VIEW / {String(Object.keys(VIEWS).indexOf(activeView) + 1).padStart(2, "0")}</span>
          </div>
          <div className="experience-stage experience-stage-static">
            <canvas ref={canvasRef} aria-label="Rendered view of the supplied Cainta Market architectural OBJ model" />
            {error && <div className="experience-load-error"><Box size={24} /><b>Could not load the model</b><small>{error}</small></div>}
            {!error && status === "LOADING ORIGINAL MODEL" && <div className="experience-loading">Loading architectural model…</div>}
          </div>
          <div className="experience-view-tabs" role="group" aria-label="Select architectural viewpoint">
            {(Object.keys(VIEWS) as ViewKey[]).map((view) => (
              <button key={view} type="button" className={activeView === view ? "is-active" : ""} onClick={() => chooseView(view)}>
                {view === "interior" ? <Building2 size={15} /> : view === "top" ? <Box size={15} /> : null}
                {VIEWS[view].label}
              </button>
            ))}
            <button type="button" className="view-reset" onClick={() => chooseView("exterior")}><RotateCcw size={14} /> Reset</button>
          </div>
          <div className="experience-workspace-foot">
            <span>FIXED CAMERA PRESETS · TAP TO CHANGE VIEW</span>
            <span>NO FREE ORBIT / NO ZOOM</span>
          </div>
        </section>
      </main>

      <footer className="experience-footer">
        <span>EMD CAINTA MARKET & TRADING CENTER</span>
        <span>CONCEPT VISUALIZATION · NOT A CONSTRUCTION DOCUMENT</span>
      </footer>
    </div>
  );
}
