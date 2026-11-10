import { createElement, useEffect, useRef, useState } from "react";
import { ArrowDown, Expand, RotateCcw, ZoomIn, ZoomOut, Box } from "lucide-react";

type ModelViewerElement = HTMLElement & {
  cameraOrbit?: string;
  fieldOfView?: string;
  zoom?: (amount: number) => void;
  resetTurntableRotation?: () => void;
};

export default function MarketExperience() {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);

  useEffect(() => {
    let active = true;
    import("@google/model-viewer")
      .then(() => {
        if (active && viewerRef.current?.hasAttribute("loaded")) setModelReady(true);
      })
      .catch(() => active && setModelFailed(true));
    return () => { active = false; };
  }, []);

  const setView = (orbit: string) => {
    if (viewerRef.current) viewerRef.current.cameraOrbit = orbit;
  };

  const fullscreen = async () => {
    const element = viewerRef.current;
    if (!element) return;
    try {
      if (!document.fullscreenElement) await element.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      // Fullscreen is optional; viewer controls remain available.
    }
  };

  return (
    <section className="market-experience" id="explore-3d">
      <div className="experience-copy">
        <span className="experience-kicker">INTERACTIVE MARKET MODEL</span>
        <h2>Explore the market<br /><em>from every angle.</em></h2>
        <p>Move around the architectural model, inspect the overall layout, and discover the market experience. Touch, mouse, and keyboard controls are supported.</p>
        <div className="experience-status"><span className={modelReady ? "status-dot ready" : "status-dot"} />{modelReady ? "3D model loaded" : modelFailed ? "3D viewer unavailable" : "Preparing 3D viewer"}</div>
        <a className="experience-link" href="#marketplace">Explore the marketplace <ArrowDown size={15} /></a>
      </div>
      <div className="experience-stage">
        <div className="stage-topline"><span><Box size={15}/> CAINTA MARKET · 3D VIEW</span><span>CONCEPT MODEL</span></div>
        <div className="model-frame">
          {createElement("model-viewer" as any, {
            ref: viewerRef,
            src: "/models/cainta-market-web.glb",
            alt: "Interactive 3D model of Cainta Market",
            "camera-controls": true,
            "touch-action": "pan-y",
            "interaction-prompt": "auto",
            "shadow-intensity": "0.8",
            exposure: "1",
            "environment-image": "neutral",
            "camera-orbit": "35deg 68deg auto",
            "min-camera-orbit": "auto 10deg 2m",
            "max-camera-orbit": "auto 120deg 120m",
            loading: "lazy",
            onLoad: () => setModelReady(true),
            onError: () => setModelFailed(true),
          })}          {(!modelReady || modelFailed) && (
            <div className="model-placeholder">
              <div className="placeholder-icon"><Box size={27}/></div>
              <b>{modelFailed ? "3D model file not found" : "Your market model is ready to be connected"}</b>
              <p>Place the approved, web-optimized GLB at <code>public/models/cainta-market-web.glb</code>. The current architectural dimensions remain subject to verification.</p>
              <span>3D preview will appear here once the model asset is added.</span>
            </div>
          )}
        </div>
        <div className="model-toolbar" aria-label="3D model controls">
          <button onClick={() => setView("0deg 70deg auto")} aria-label="Front view">Front</button>
          <button onClick={() => setView("90deg 70deg auto")} aria-label="Side view">Side</button>
          <button onClick={() => setView("180deg 70deg auto")} aria-label="Rear view">Rear</button>
          <button onClick={() => setView("35deg 68deg auto")} aria-label="Isometric view">Isometric</button>
          <span className="toolbar-spacer"/>
          <button onClick={() => viewerRef.current?.resetTurntableRotation?.()} aria-label="Reset view"><RotateCcw size={16}/></button>
          <button onClick={fullscreen} aria-label="Fullscreen"><Expand size={16}/></button>
        </div>
        <p className="model-hint"><ZoomIn size={13}/> Drag to orbit · Pinch or scroll to zoom · Two-finger drag to pan <ZoomOut size={13}/></p>
      </div>
    </section>
  );
}
