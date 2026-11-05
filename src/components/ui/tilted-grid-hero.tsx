import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import "./tilted-grid-hero.css";

/* ── the curved row (adapted Tilted Grid Hero) ───────────────────
 * One row of images streams from right to left around the inside of a cylinder. The centre faces the viewer
 * flat, the ends bend toward the viewer and fade into the page.
 *
 * A CSS box can't bend, so every tile is cut into SLICES vertical strips, each a flat facet of the cylinder
 * showing its share of the image. The strips sit still inside their tile, each turned its own few degrees round
 * the cylinder's axis, and the tile (preserve-3d) is what moves: one rotateY about that same axis carries the
 * whole tile along the arc. Only a tile's delay differs, and that sets where on the arc it sits. The band is
 * transform-only on the compositor; the fade is a static mask over it.
 *
 * JS sizes the loop, pauses it outside the viewport, and hands a tile its next image each time it wraps,
 * out of sight.
 * ─────────────────────────────────────────────────────────────── */

/** Strips per tile: enough that each is a few degrees of arc and never reads as a facet. */
const SLICES = 16;
/** Camera distance from the screen, as a multiple of the cylinder's radius; just past the axis so the ends swell. */
const CAMERA = 1.6;
/** A tile is never wider than this share of the band, so a phone still shows its neighbours. */
const MAX_WIDTH = 55;
/**
 * Furthest angle, in degrees, any strip of a visible tile may reach. A strip turned to arccos(1 − CAMERA) ≈ 127°
 * crosses the camera plane and projects to infinity, then mirrored: flickering lines and tiles drawn over each
 * other; well before that it is already magnified into streaks (~9× at 115°). At 100° the edge strips stay under
 * ~4×. A visible tile's outer edge sits at `bend` plus a full tile width, so its height is capped to keep that
 * edge below this angle.
 */
const SAFE_EDGE = 100;

/** Cylinder radius, as a share of the band's width, that puts the frame's edge `bend` radians round the arc. */
function arc(bend: number) {
  return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend));
}

/** Largest tile height, as a share of the band's width, whose strips all stay inside SAFE_EDGE. */
function safeHeight(bend: number, aspect: number) {
  return (((SAFE_EDGE * Math.PI) / 180 - bend) / aspect) * arc(bend);
}

/** Loop geometry on the cylinder; angles in degrees. */
type Layout = { columns: number; sweep: number; unit: number; limit: number };

/**
 * Lays the loop on the cylinder. Angles in degrees: `unit` is the arc one tile-height spans, `limit` how far round
 * a tile's centre can go before the whole tile is off-screen, and `sweep` where the loop's ends sit. The loop
 * reaches past `limit`, so a tile only wraps out of sight, and is a whole number of tiles so the gap never stretches.
 */
function measure(
  width: number,
  height: number,
  tile: number,
  aspect: number,
  gap: number,
  bend: number,
): Layout {
  const h = Math.min(
    (tile / 100) * height,
    ((MAX_WIDTH / 100) * width) / aspect,
    safeHeight(bend, aspect) * width,
  );
  const radius = width * arc(bend);
  if (!(h > 0) || !(radius > 0)) return { columns: 2, sweep: 0, unit: 0, limit: 0 };
  const deg = (rad: number) => (rad * 180) / Math.PI;
  const unit = deg(h / radius);
  const pitch = (aspect + gap / 100) * unit;
  const limit = deg(bend) + (aspect * unit) / 2;
  // Capped so a band squeezed to a sliver can't mount thousands of tiles.
  const columns = Math.min(60, Math.max(2, Math.ceil((2 * limit) / pitch)));
  const round = (n: number) => +n.toFixed(4);
  const sweep = round((columns * pitch) / 2);
  return { columns, sweep, unit: round(unit), limit: round(Math.min(sweep, limit)) };
}

export type TiltedGridImage = { src: string; alt?: string };

export type TiltedGridHeroProps = {
  /** Images run along the row in order; a tile takes its next image each time it wraps off-screen. */
  images: readonly TiltedGridImage[];
  /** Seconds for the row to advance by one tile. @default 4 */
  speed?: number;
  /** Tile height, as a percentage of the band's height. @default 26 */
  tileHeight?: number;
  /** Tile width divided by tile height. @default 16 / 9 */
  aspectRatio?: number;
  /** Space between tiles, as a percentage of a tile's height. @default 6 */
  gap?: number;
  /** Vertical centre of the row, as a percentage of the band's height. @default 56 */
  axis?: number;
  /** How far the row has bent round by the frame's edge, in degrees (5–85). @default 80 */
  curve?: number;
  /** Width of the fade at each end, as a percentage of the band's width. @default 12 */
  fade?: number;
  /** Content rendered above the band. */
  children?: ReactNode;
};

export function TiltedGridHero({
  images,
  speed = 4,
  tileHeight = 26,
  aspectRatio = 16 / 9,
  gap = 6,
  axis = 56,
  curve = 80,
  fade = 12,
  children,
  className = "",
  style,
  ...props
}: ComponentProps<"div"> & TiltedGridHeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const orbit = `tgh-o-${id}`;
  const tile = `tgh-t-${id}`;
  const bend = (Math.min(85, Math.max(5, curve)) * Math.PI) / 180;
  // Null until the observer has measured the band; it stays hidden until then, so a wrong-size first paint never shows.
  const [layout, setLayout] = useState<Layout | null>(null);
  // The image each tile shows; it only changes when the tile wraps, out of sight.
  const [shown, setShown] = useState<Record<number, number>>({});

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let visible = false;
    const updatePlayback = () => {
      element.dataset["motionPaused"] = String(!visible || document.hidden);
    };
    // Wakes half a viewport ahead: the paused band also skips rendering (tilted-grid-hero.css), so it must be laid
    // out, rasterized and decoded before it scrolls in.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        visible = entry.isIntersecting;
        updatePlayback();
      },
      { rootMargin: "50% 0px" },
    );
    observer.observe(element);
    document.addEventListener("visibilitychange", updatePlayback);
    updatePlayback();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updatePlayback);
      element.dataset["motionPaused"] = "true";
    };
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const next = measure(width, height, tileHeight, aspectRatio, gap, bend);
      setLayout((previous) =>
        previous?.columns === next.columns &&
        previous.sweep === next.sweep &&
        previous.unit === next.unit
          ? previous
          : next,
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [tileHeight, aspectRatio, gap, bend]);

  // Fetch every image up front: a tile picks up its next one just before it comes back into view.
  useEffect(() => {
    for (const { src } of images) new window.Image().src = src;
  }, [images]);

  const { columns, sweep, unit, limit } =
    layout ?? measure(1200, 560, tileHeight, aspectRatio, gap, bend);
  // Every length is a multiple of the tile's height, which follows the band's height until MAX_WIDTH or SAFE_EDGE caps it.
  const u = (n: number) =>
    `calc(${+n.toFixed(4)} * min(${tileHeight}cqh, ${+(MAX_WIDTH / aspectRatio).toFixed(4)}cqw, ${+(safeHeight(bend, aspectRatio) * 100).toFixed(4)}cqw))`;
  const r = 100 * arc(bend);
  const radius = `${+r.toFixed(3)}cqw`;
  // Out to the axis, round it, back in: a box sits on the cylinder at the angle rotateY gives it.
  const turn = (deg: number) =>
    `translateZ(${radius}) rotateY(${+deg.toFixed(4)}deg) translateZ(-${radius})`;
  // Beyond `limit` a tile is wholly off-screen, so it is hidden there, including where the loop wraps.
  const hide = +(((sweep - limit) / (2 * sweep || 1)) * 100).toFixed(4);
  const css = `@keyframes ${orbit}{from{transform:${turn(-sweep)}}to{transform:${turn(sweep)}}0%,${hide}%,${100 - hide}%,100%{visibility:hidden}${hide + 0.001}%,${100 - hide - 0.001}%{visibility:visible}}`;
  const share = aspectRatio / SLICES;
  const duration = columns * speed;
  const mask = `linear-gradient(90deg,transparent,#000 ${fade}%,#000 ${100 - fade}%,transparent)`;

  return (
    <div
      ref={ref}
      className={`tilted-grid ${className}`}
      {...props}
      data-motion-paused="true"
      style={{ containerType: "size", ...style }}
    >
      <style>{css}</style>
      <div
        aria-hidden="true"
        className="tilted-grid-band"
        style={{
          opacity: layout ? 1 : 0,
          perspective: `${+(r * CAMERA).toFixed(3)}cqw`,
          perspectiveOrigin: `50% ${axis}%`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        {Array.from({ length: columns }, (_, t) => {
          // Tile `columns - 1` starts nearest the exit and tile 0 furthest back: tiles numbered in the order they come on.
          const first = columns - 1 - t;
          const image = images[(shown[t] ?? first) % Math.max(images.length, 1)];
          // Keyed by the loop geometry: when a resize changes it, every tile remounts at once, so all animations share
          // one start time. Kept tiles would run on their old clock beside new ones: gaps and tiles drawn over each other.
          return (
            <div
              key={`${columns}:${sweep}:${t}`}
              className={`${tile} tilted-grid-tile`}
              style={{
                left: `calc(50% - ${u(aspectRatio / 2)})`,
                top: `calc(${axis}% - ${u(0.5)})`,
                width: u(aspectRatio),
                height: u(1),
                animationName: orbit,
                animationDuration: `${duration}s`,
                animationTimingFunction: "linear",
                animationDelay: `${-t * speed}s`,
                animationIterationCount: "infinite",
              }}
              onAnimationIteration={(event) => {
                // elapsedTime counts whole loops, missed events included.
                const lap = Math.round(event.elapsedTime / duration);
                setShown((previous) => {
                  const next = lap * columns + first;
                  return previous[t] === next ? previous : { ...previous, [t]: next };
                });
              }}
            >
              {Array.from({ length: SLICES }, (_, k) => (
                <div
                  key={k}
                  className="tilted-grid-slice"
                  data-edge={k === 0 ? "start" : k === SLICES - 1 ? "end" : undefined}
                  style={{
                    left: u((aspectRatio - share) / 2),
                    width: k === SLICES - 1 ? u(share) : `calc(${u(share)} + 1px)`,
                    height: u(1),
                    transform: turn((aspectRatio / 2 - (k + 0.5) * share) * unit),
                  }}
                >
                  {image && (
                    <img
                      src={image.src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="tilted-grid-image"
                      style={{ left: u(-k * share), width: u(aspectRatio), height: u(1) }}
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {children}
    </div>
  );
}
