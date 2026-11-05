import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import type { ShieldView } from "./shield-scene";
import { shieldMotion as config } from "./motion-config.mjs";
import "./shield.css";

const Scene = lazy(() => import("./shield-scene"));
const motionQuery = "(prefers-reduced-motion: reduce)";
const readMotion = () => matchMedia(motionQuery).matches;
// The server and first hydration render use the poster, never loading WebGL on the server.
const serverMotion = () => true;
function subscribeMotion(callback: () => void) {
  const query = matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const readHidden = () => document.hidden;
const serverHidden = () => true;
function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

class ShieldBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    this.props.onFailure();
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Poster() {
  return (
    <div className="shield-poster">
      <img
        src="/shield/poster.png"
        alt=""
        width={586}
        height={586}
        sizes="(max-width: 767px) 90vw, 45vw"
        loading="eager"
        fetchPriority="high"
      />
    </div>
  );
}
type Props = {
  view?: ShieldView;
  forceFallback?: boolean;
  exporterRef?: RefObject<(() => void) | null> | undefined;
};
function ShieldRenderer({
  stage,
  active,
  view,
  exporterRef,
  onFailure,
}: {
  stage: RefObject<HTMLDivElement | null>;
  active: boolean;
  view: ShieldView;
  exporterRef?: Props["exporterRef"];
  onFailure: () => void;
}) {
  const [ready, setReady] = useState(false);
  const loaded = useCallback(() => setReady(true), []);
  return (
    <div className="shield-renderer" data-ready={ready}>
      <Poster />
      <div className="shield-webgl">
        <ShieldBoundary onFailure={onFailure}>
          <Suspense fallback={null}>
            <Scene
              stage={stage}
              active={active}
              view={view}
              onReady={loaded}
              onFailure={onFailure}
              exporterRef={exporterRef}
            />
          </Suspense>
        </ShieldBoundary>
      </div>
    </div>
  );
}

export function Shield({ view = "motion", forceFallback = false, exporterRef }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false),
    [failed, setFailed] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeMotion, readMotion, serverMotion);
  const hidden = useSyncExternalStore(subscribeVisibility, readHidden, serverHidden);
  const fail = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry?.isIntersecting ?? false),
    );
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  const fallback = failed || forceFallback || reducedMotion;
  const style = {
    "--shield-entry-duration": `${config.entrance.duration}s`,
    "--shield-poster-fade": `${config.entrance.posterFade}s`,
    "--shield-entry-ease": config.entrance.cssEase,
  } as CSSProperties;
  return (
    <div
      ref={stage}
      className="zury-shield"
      style={style}
      data-fallback={fallback}
      data-motion={view === "motion" && visible && !hidden && !reducedMotion ? "active" : "paused"}
      role="img"
      aria-label="Escudo ZURY em metal grafite escovado, monograma Z recortado e bordas prateadas"
    >
      {fallback ? (
        <Poster />
      ) : (
        <ShieldRenderer
          stage={stage}
          active={visible && !hidden}
          view={view}
          exporterRef={exporterRef}
          onFailure={fail}
        />
      )}
    </div>
  );
}
