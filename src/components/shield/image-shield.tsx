import { useEffect, useId, useRef } from "react";
import {
  createImageShieldOrbit,
  imageShieldMotion as config,
  imageShieldProfile,
  imageShieldInteraction,
  resetImageShieldTilt,
} from "./image-motion.mjs";
import "./image-shield.css";
import { createSiteEntrance, entranceMotion } from "@/lib/site-motion.mjs";

/** Original raster artwork with a separate, silhouette-masked cursor reflection; no image edits. */
export function ImageShield({
  animated = true,
  entranceDelay = entranceMotion.delay,
  scrollMotion = false,
}: {
  animated?: boolean;
  entranceDelay?: number;
  scrollMotion?: boolean;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const entry = useRef<HTMLDivElement>(null);
  const floating = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const light = useRef<HTMLDivElement>(null);
  const lightPointer = useRef<HTMLDivElement>(null);
  const reflection = useRef<SVGRectElement>(null);
  const reflectionId = useId();

  useEffect(() => {
    const root = stage.current;
    if (!root) return undefined;
    root.dataset["motion"] = "static";
    if (!animated) {
      root.dataset["motion"] = "static";
      return undefined;
    }
    let disposed = false;
    let cleanupMotion = () => {};
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia();
        cleanupMotion = () => media.revert();
        media.add(
          {
            motion: "(prefers-reduced-motion: no-preference)",
            reduce: "(prefers-reduced-motion: reduce)",
            compact: "(max-width: 767px)",
          },
          (context) => {
            if (!context.conditions?.["motion"]) {
              root.dataset["motion"] = "static";
              return undefined;
            }
            const profile = imageShieldProfile({ compact: !!context.conditions["compact"] });
            const entrance = createSiteEntrance(gsap, entry.current, {
              paused: true,
              delay: entranceDelay,
            });
            const drift = createImageShieldOrbit(gsap, floating.current, light.current, profile);
            const hero = root.closest(".hero");
            if (scrollMotion && hero) {
              gsap.fromTo(
                scroll.current,
                { y: 0, rotationY: 0 },
                {
                  y: -profile.scrollY,
                  rotationY: profile.scrollYaw,
                  ease: "none",
                  scrollTrigger: {
                    trigger: hero,
                    start: "top top",
                    end: "bottom top",
                    scrub: config.scroll.scrub,
                    invalidateOnRefresh: true,
                  },
                },
              );
            }
            const rotateX = gsap.quickTo(tilt.current, "rotationX", {
              duration: config.tilt.duration,
              ease: config.tilt.ease,
            });
            const rotateY = gsap.quickTo(tilt.current, "rotationY", {
              duration: config.tilt.duration,
              ease: config.tilt.ease,
            });
            const lightX = gsap.quickTo(lightPointer.current, "x", {
              duration: config.tilt.duration,
              ease: config.tilt.ease,
            });
            const lightY = gsap.quickTo(lightPointer.current, "y", {
              duration: config.tilt.duration,
              ease: config.tilt.ease,
            });
            const positionX = gsap.quickTo(tilt.current, "x", {
              duration: config.tilt.duration,
              ease: config.tilt.ease,
            });
            const positionY = gsap.quickTo(tilt.current, "y", {
              duration: config.tilt.duration,
              ease: config.tilt.ease,
            });
            const reflectionX = gsap.quickTo(reflection.current, "x", {
              duration: config.tilt.duration,
              ease: config.tilt.ease,
              force3D: false,
            });
            const reflectionY = gsap.quickTo(reflection.current, "y", {
              duration: config.tilt.duration,
              ease: config.tilt.ease,
              force3D: false,
            });
            const reflectionOpacity = gsap.quickTo(reflection.current, "opacity", {
              duration: 0.18,
              ease: config.tilt.ease,
            });
            const mouse = matchMedia("(hover: hover) and (pointer: fine)");
            const pointerSurface = hero ?? root;
            let bounds = root.getBoundingClientRect();
            let boundsStale = false;
            const measure = () => {
              bounds = root.getBoundingClientRect();
              boundsStale = false;
            };
            let visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
            const reset = (immediate = false) => {
              resetImageShieldTilt(rotateX, rotateY, immediate);
              resetImageShieldTilt(lightX, lightY, immediate);
              resetImageShieldTilt(positionX, positionY, immediate);
              resetImageShieldTilt(reflectionX, reflectionY, immediate);
              reflectionOpacity(0);
              if (immediate) reflectionOpacity.tween.progress(1).pause();
            };
            const leave = () => reset(!visible || document.hidden || !mouse.matches);
            const sync = () => {
              const active = visible && !document.hidden;
              root.dataset["motion"] = active ? "active" : "paused";
              // Do not wake a finished entrance when the floating orbit resumes.
              if (entrance.progress() < 1) entrance.paused(!active);
              drift.paused(!active);
              if (!active) reset(true);
            };
            const observer = new IntersectionObserver(
              ([item]) => {
                visible = !!item && item.isIntersecting && item.intersectionRatio > 0.04;
                sync();
              },
              { threshold: [0, 0.04] },
            );
            observer.observe(root);
            sync();
            const resize = new ResizeObserver(measure);
            resize.observe(root);
            const invalidateBounds = () => {
              boundsStale = true;
              reset(!visible || document.hidden);
            };
            const move = (event: PointerEvent) => {
              if (!mouse.matches || !visible || document.hidden) return;
              if (boundsStale) measure();
              const rect = bounds;
              const pose = imageShieldInteraction(
                event.clientX - rect.left,
                event.clientY - rect.top,
                rect.width,
                rect.height,
                { pointerType: event.pointerType },
              );
              rotateX(pose.rotationX);
              rotateY(pose.rotationY);
              positionX(pose.x);
              positionY(pose.y);
              reflectionX(pose.reflectionX);
              reflectionY(pose.reflectionY);
              reflectionOpacity(pose.reflectionOpacity);
              lightX((pose.rotationY / config.tilt.yaw) * config.light.pointerX);
              lightY((-pose.rotationX / config.tilt.pitch) * config.light.pointerY);
            };
            pointerSurface.addEventListener("pointermove", move as EventListener, {
              passive: true,
            });
            pointerSurface.addEventListener("pointerenter", measure);
            pointerSurface.addEventListener("pointerleave", leave);
            window.addEventListener("blur", leave);
            window.addEventListener("scroll", invalidateBounds, { passive: true });
            window.addEventListener("resize", invalidateBounds, { passive: true });
            mouse.addEventListener("change", leave);
            document.addEventListener("visibilitychange", sync);
            return () => {
              observer.disconnect();
              resize.disconnect();
              pointerSurface.removeEventListener("pointermove", move as EventListener);
              pointerSurface.removeEventListener("pointerleave", leave);
              pointerSurface.removeEventListener("pointerenter", measure);
              window.removeEventListener("blur", leave);
              window.removeEventListener("scroll", invalidateBounds);
              window.removeEventListener("resize", invalidateBounds);
              mouse.removeEventListener("change", leave);
              document.removeEventListener("visibilitychange", sync);
              root.dataset["motion"] = "static";
            };
          },
          root,
        );
      })
      .catch((error: unknown) => {
        cleanupMotion();
        root.dataset["motion"] = "static";
        console.error("Unable to initialize ImageShield motion", error);
      });
    return () => {
      disposed = true;
      cleanupMotion();
    };
  }, [animated, entranceDelay, scrollMotion]);

  return (
    <div ref={stage} className="image-shield" data-motion="paused" data-renderer="original-image">
      <div className="image-shield-light" aria-hidden="true">
        <div ref={light} className="image-shield-light-drift">
          <div ref={lightPointer} className="image-shield-light-pointer" />
        </div>
      </div>
      <div ref={scroll} className="image-shield-scroll">
        <div ref={entry} className="image-shield-entry">
          <div ref={floating} className="image-shield-float">
            <div ref={tilt} className="image-shield-tilt">
              <div className="image-shield-art">
                <img
                  src="/shield/references/geometry.png"
                  alt="Escudo original da ZURY, monograma Z em metal grafite escovado com bordas prateadas"
                  width={1254}
                  height={1254}
                  sizes="(max-width: 767px) 90vw, 620px"
                  loading="eager"
                  fetchPriority="high"
                  draggable={false}
                />
                <svg
                  className="image-shield-reflection"
                  viewBox="0 0 600 600"
                  aria-hidden="true"
                  focusable="false"
                >
                  <defs>
                    <mask
                      id={`${reflectionId}-mask`}
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width="600"
                      height="600"
                      style={{ maskType: "alpha" }}
                    >
                      <image href="/shield/references/geometry.png" width="600" height="600" />
                    </mask>
                    <linearGradient
                      id={`${reflectionId}-light`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2=".4"
                      gradientUnits="objectBoundingBox"
                    >
                      <stop offset=".36" stopColor="#f0f3f5" stopOpacity="0" />
                      <stop offset=".5" stopColor="#f0f3f5" stopOpacity=".32" />
                      <stop offset=".64" stopColor="#f0f3f5" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <g mask={`url(#${reflectionId}-mask)`}>
                    <rect
                      ref={reflection}
                      className="image-shield-reflection-sweep"
                      x="-150"
                      y="-150"
                      width="900"
                      height="900"
                      fill={`url(#${reflectionId}-light)`}
                    />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
