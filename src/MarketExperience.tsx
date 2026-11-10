import { createElement, useEffect, useRef, useState } from "react";
import { ArrowLeft, Box, Expand, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

type ModelViewerElement = HTMLElement & {
  cameraOrbit: string;
  fieldOfView: string;
  resetTurntableRotation?: () => void;
};

type MarketExperienceProps = {
  onBack: () => void;
};

export default function MarketExperience({ onBack }: MarketExperienceProps) {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let viewer: ModelViewerElement | null = null;

    const handleLoad = () => {
      if (!active) return;
      setModelReady(true);
      setModelFailed(false);
    };

    const handleError = () => {
      if (!active) return;
      setModelReady(false);
      setModelFailed(true);
    };

    import("@google/model-viewer")
      .then(() => {
        if (!active || !viewerRef.current) return;
        viewer = viewerRef.current;
        viewer.addEventListener("load", handleLoad);
        viewer.addEventListener("error", handleError);
        if (viewer.hasAttribute("loaded")) handleLoad();
      })
      .catch(handleError);

    return () => {
      active = false;
      viewer?.removeEventListener("load", handleLoad);
      viewer?.removeEventListener("error", handleError);
    };
  }, []);

  const setView = (orbit: string) => {
    if (viewerRef.current && modelReady) {
      viewerRef.current.cameraOrbit = orbit;
    }
  };

  const resetView = () => {
    if (!viewerRef.current || !modelReady) return;
    viewerRef.current.resetTurntableRotation?.();
    viewerRef.current.cameraOrbit = "35deg 68deg auto";
    viewerRef.current.fieldOfView = "30deg";
  };

  const toggleFullscreen = async () => {
    const element = stageRef.current;
    if (!element) return;
    try {
      if (!document.fullscreenElement) {
        await element.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen is optional; the standard viewer controls remain usable.
    }
  };

  const status = modelReady
    ? "APPROVED MODEL LOADED"
    : modelFailed
      ? "MODEL FILE UNAVAILABLE"
      : "MODEL ASSET NOT CONNECTED";

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

      <main className="experience-layout">
        <section className="experience-intro">
          <span className="experience-kicker">INTERACTIVE 3D EXPERIENCE / 01</span>
          <h1>Explore the market.<br /><em>See it differently.</em></h1>
          <p className="experience-description">
            Move around the architectural model and inspect the market from different viewpoints.
            Use the camera controls to explore the exterior and, once the coordinated model is
            connected, its interior spaces.
          </p>

          <div className="experience-guide">
            <div><span>01</span><p><b>Orbit</b><small>Drag to rotate around the model.</small></p></div>
            <div><span>02</span><p><b>Inspect</b><small>Zoom and pan to examine details.</small></p></div>
            <div><span>03</span><p><b>Navigate</b><small>Choose a preset camera viewpoint.</small></p></div>
          </div>

          <div className="experience-disclaimer">
            <span className={modelReady ? "experience-status-dot is-ready" : "experience-status-dot"} />
            <div><b>{status}</b><small>Model dimensions and geometry require source verification before publication.</small></div>
          </div>
        </section>

        <section className="experience-workspace" aria-label="Interactive market model viewer">
          <div className="workspace-heading">
            <div><span>EMD CAINTA MARKET</span><b>Architectural model viewer</b></div>
            <span className="workspace-index">VIEW 01 / EXTERIOR</span>
          </div>

          <div className="experience-stage" ref={stageRef}>
            {createElement("model-viewer" as any, {
              ref: viewerRef,
              src: "/models/cainta-market-web.glb",
              alt: "Interactive architectural model of EMD Cainta Market",
              "camera-controls": true,
              "touch-action": "pan-y",
              "interaction-prompt": "auto",
              "shadow-intensity": "0.85",
              exposure: "1",
              "environment-image": "neutral",
              "camera-orbit": "35deg 68deg auto",
              "field-of-view": "30deg",
              "min-camera-orbit": "auto 10deg 2m",
              "max-camera-orbit": "auto 120deg 120m",
              loading: "eager",
              reveal: "auto",
            })}
            {!modelReady && (
              <div className="experience-model-placeholder" aria-live="polite">
                <div className="experience-placeholder-grid" />
                <div className="experience-placeholder-content">
                  <div className="experience-placeholder-icon"><Box size={30} strokeWidth={1.35} /></div>
                  <span className="experience-placeholder-label">ARCHITECTURAL MODEL / GLB</span>
                  <h2>{modelFailed ? "Model file not found." : "The model asset is not connected yet."}</h2>
                  <p>
                    Connect the approved, web-optimized architectural model at
                    <code> public/models/cainta-market-web.glb</code>.
                    No substitute geometry has been invented for this view.
                  </p>
                  <span className="experience-placeholder-foot">3D VIEWER READY · MODEL ASSET PENDING</span>
                </div>
              </div>
            )}
          </div>

          <div className="experience-controlbar">
            <div className="experience-view-presets" aria-label="Camera viewpoints">
              <button type="button" disabled={!modelReady} onClick={() => setView("0deg 70deg auto")}>Front</button>
              <button type="button" disabled={!modelReady} onClick={() => setView("90deg 70deg auto")}>Side</button>
              <button type="button" disabled={!modelReady} onClick={() => setView("180deg 70deg auto")}>Rear</button>
              <button type="button" disabled={!modelReady} onClick={() => setView("35deg 68deg auto")}>Isometric</button>
            </div>
            <div className="experience-utility-controls">
              <button type="button" disabled={!modelReady} onClick={resetView} aria-label="Reset camera"><RotateCcw size={16} /></button>
              <button type="button" onClick={toggleFullscreen} aria-label="Toggle fullscreen"><Expand size={16} /></button>
            </div>
          </div>
          <div className="experience-workspace-foot">
            <span><ZoomIn size={13} /> Drag to orbit · Pinch or scroll to zoom · Two-finger drag to pan</span>
            <span><ZoomOut size={13} /> TOUCH + MOUSE READY</span>
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
