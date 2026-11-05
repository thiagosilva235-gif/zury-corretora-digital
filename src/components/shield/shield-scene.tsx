import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createShieldModel } from "./geometry";
import { createShieldMaterials, createStudioEnvironment, createStudioLights } from "./materials";
import { shieldMotion as config } from "./motion-config.mjs";

gsap.registerPlugin(ScrollTrigger);
export type ShieldView = "motion" | "front" | "quarter" | "profile";
type Props = {
  stage: RefObject<HTMLDivElement | null>;
  active: boolean;
  view: ShieldView;
  onReady: () => void;
  onFailure: () => void;
  exporterRef?: RefObject<(() => void) | null> | undefined;
};

function Studio({ stage, active, view, onReady, onFailure, exporterRef }: Props) {
  const root = useRef<THREE.Group>(null);
  const entrance = useRef<THREE.Group>(null);
  const float = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const object = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const target = useRef({ x: 0, y: 0 });
  const get = useThree((s) => s.get),
    invalidate = useThree((s) => s.invalidate),
    size = useThree((s) => s.size);

  useEffect(() => {
    const group = object.current;
    if (!group) return undefined;
    const { scene, gl, camera } = get();
    const geometries = createShieldModel(),
      materials = createShieldMaterials();
    for (const part of ["back", "rim", "face", "crown"] as const) {
      group.add(
        new THREE.Mesh(
          geometries[part],
          part === "back"
            ? materials.back
            : part === "rim"
              ? [materials.rim, materials.back]
              : [materials[part], materials.edge],
        ),
      );
    }
    const source = createStudioEnvironment(),
      pmrem = new THREE.PMREMGenerator(gl);
    const environment = pmrem.fromEquirectangular(source),
      previous = scene.environment;
    scene.environment = environment.texture;
    const lights = createStudioLights();
    scene.add(lights);
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    if (exporterRef)
      exporterRef.current = () => {
        gl.render(scene, camera);
        gl.domElement.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob),
            link = document.createElement("a");
          link.href = url;
          link.download = "zury-shield-poster.png";
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, "image/png");
      };
    invalidate();
    onReady();
    return () => {
      if (exporterRef) exporterRef.current = null;
      gl.domElement.removeEventListener("webglcontextlost", lost);
      group.clear();
      scene.environment = previous;
      scene.remove(lights);
      lights.clear();
      Object.values(geometries).forEach((g) => g.dispose());
      for (const material of [
        materials.face,
        materials.crown,
        materials.rim,
        materials.edge,
        materials.back,
      ])
        material.dispose();
      materials.grain.dispose();
      source.dispose();
      environment.dispose();
      pmrem.dispose();
    };
  }, [get, invalidate, onReady, onFailure, exporterRef]);

  useEffect(() => {
    const { camera } = get();
    if (camera instanceof THREE.OrthographicCamera) {
      // The source is already a projected view. Avoid adding perspective distortion to the frontal comparison.
      camera.zoom = Math.min(size.width, size.height) / (1254 / 320);
      camera.updateProjectionMatrix();
      invalidate();
    }
  }, [get, size, invalidate]);

  useEffect(() => {
    const a = entrance.current,
      r = root.current,
      f = float.current,
      t = tilt.current,
      el = stage.current;
    if (!a || !r || !f || !t || !el) return undefined;
    target.current = { x: 0, y: 0 };
    a.position.set(0, 0, 0);
    a.rotation.set(0, 0, 0);
    r.position.set(0, 0, 0);
    r.rotation.set(0, 0, 0);
    f.position.set(0, 0, 0);
    t.rotation.set(0, 0, 0);
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      if (view !== "motion") {
        a.rotation.y = view === "front" ? 0 : view === "quarter" ? -0.65 : -1.28;
        invalidate();
        return;
      }
      a.rotation.set(config.pose.pitch, config.pose.yaw, 0);
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          a.position,
          { y: config.entrance.y },
          {
            y: 0,
            duration: config.entrance.duration,
            ease: config.entrance.ease,
            onUpdate: invalidate,
          },
        );
        gsap.fromTo(
          a.rotation,
          { x: config.entrance.pitch, y: config.entrance.yaw },
          {
            x: config.pose.pitch,
            y: config.pose.yaw,
            duration: config.entrance.duration,
            ease: config.entrance.ease,
            onUpdate: invalidate,
          },
        );
        const hero = el.closest("#inicio") ?? el.closest("[data-shield-scroll-root]");
        if (hero) {
          gsap.to(r.position, {
            y: config.scroll.y,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: config.scroll.scrub,
              refreshPriority: 1,
            },
            onUpdate: invalidate,
          });
          gsap.to(r.rotation, {
            x: config.scroll.pitch,
            y: config.scroll.yaw,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: config.scroll.scrub,
              refreshPriority: 1,
            },
            onUpdate: invalidate,
          });
        }
      });
    }, el);
    const move = (event: PointerEvent) => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (event.pointerType === "touch" && event.buttons === 0) return;
      const bounds = el.getBoundingClientRect(),
        factor = event.pointerType === "touch" ? config.tilt.touchFactor : 1;
      target.current = {
        x:
          THREE.MathUtils.clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1) *
          config.tilt.pitch *
          factor,
        y:
          THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1) *
          config.tilt.yaw *
          factor,
      };
      invalidate();
    };
    const reset = () => {
      target.current = { x: 0, y: 0 };
      invalidate();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", reset);
    el.addEventListener("pointerup", reset);
    el.addEventListener("pointercancel", reset);
    invalidate();
    return () => {
      media.revert();
      context.revert();
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", reset);
      el.removeEventListener("pointerup", reset);
      el.removeEventListener("pointercancel", reset);
    };
  }, [stage, view, invalidate]);

  useEffect(() => {
    invalidate();
  }, [active, view, invalidate]);
  useFrame((state, delta) => {
    if (view !== "motion" || !active) return;
    const dt = Math.min(delta, 0.05);
    elapsed.current += dt;
    if (float.current)
      float.current.position.y =
        Math.sin((elapsed.current * Math.PI * 2) / config.float.period) * config.float.amplitude;
    if (tilt.current) {
      tilt.current.rotation.x = THREE.MathUtils.damp(
        tilt.current.rotation.x,
        target.current.x,
        config.tilt.damping,
        dt,
      );
      tilt.current.rotation.y = THREE.MathUtils.damp(
        tilt.current.rotation.y,
        target.current.y,
        config.tilt.damping,
        dt,
      );
    }
    state.scene.environmentRotation.y =
      Math.sin((elapsed.current * Math.PI * 2) / config.light.period) * config.light.amplitude;
    invalidate();
  });
  return (
    <group ref={root}>
      <group ref={entrance}>
        <group ref={float}>
          <group ref={tilt}>
            <group ref={object} dispose={null} />
          </group>
        </group>
      </group>
    </group>
  );
}

export default function ShieldScene(props: Props) {
  return (
    <Canvas
      orthographic
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 8], near: 0.1, far: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.95;
      }}
      fallback={null}
    >
      <Studio {...props} />
    </Canvas>
  );
}
