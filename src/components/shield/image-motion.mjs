import { shieldMotion } from "./motion-config.mjs";

export const imageShieldMotion = Object.freeze({
  entrance: {
    duration: shieldMotion.entrance.duration,
    ease: shieldMotion.entrance.ease,
    x: 28,
    y: 38,
    yaw: -9,
    pitch: 4,
    roll: -4,
    scale: 0.94,
  },
  float: { x: 16, amplitude: 28, pitch: 1.1, yaw: 4, roll: 1.3, period: 10, ease: "sine.inOut" },
  pointer: { x: 8, y: 6, reflectionX: 100, reflectionY: 45, opacity: 0.28 },
  light: { x: 18, y: 10, roll: 3, pointerX: 12, pointerY: 8 },
  scroll: { y: 42, yaw: 3, scrub: 0.8 },
  tilt: { yaw: 3, pitch: 2, duration: 0.7, ease: "power3.out" },
});

/** One responsive intensity controls all decorative axes, never the artwork's proportions. */
export function imageShieldProfile({ compact = false, reducedMotion = false } = {}) {
  const intensity = reducedMotion ? 0 : compact ? 0.4 : 1;
  return {
    floatX: imageShieldMotion.float.x * intensity,
    floatY: imageShieldMotion.float.amplitude * intensity,
    pitch: imageShieldMotion.float.pitch * intensity,
    yaw: imageShieldMotion.float.yaw * intensity,
    roll: imageShieldMotion.float.roll * intensity,
    lightX: imageShieldMotion.light.x * intensity,
    lightY: imageShieldMotion.light.y * intensity,
    lightRoll: imageShieldMotion.light.roll * intensity,
    scrollY: imageShieldMotion.scroll.y * intensity,
    scrollYaw: imageShieldMotion.scroll.yaw * intensity,
  };
}

/** Phase-offset axes trace an ellipse; matching seam velocities prevent a pendulum-like stop. */
export function createImageShieldOrbit(gsap, artwork, light, profile) {
  const quarter = imageShieldMotion.float.period / 4;
  const orbit = gsap.timeline({ paused: true, repeat: -1 });
  orbit.fromTo(
    artwork,
    { x: -profile.floatX, rotationY: -profile.yaw, rotationZ: -profile.roll },
    {
      x: profile.floatX,
      rotationY: profile.yaw,
      rotationZ: profile.roll,
      duration: quarter * 2,
      repeat: 1,
      yoyo: true,
      ease: imageShieldMotion.float.ease,
    },
    0,
  );
  orbit.fromTo(
    artwork,
    { y: 0, rotationX: 0 },
    { y: -profile.floatY, rotationX: profile.pitch, duration: quarter, ease: "sine.out" },
    0,
  );
  orbit.to(
    artwork,
    { y: profile.floatY, rotationX: -profile.pitch, duration: quarter * 2, ease: "sine.inOut" },
    quarter,
  );
  orbit.to(artwork, { y: 0, rotationX: 0, duration: quarter, ease: "sine.in" }, quarter * 3);
  // This is a separate studio wash BEHIND the PNG, never a highlight painted over its face.
  orbit.fromTo(
    light,
    { x: -profile.lightX, y: profile.lightY, rotation: -profile.lightRoll, opacity: 0.55 },
    {
      x: profile.lightX,
      y: -profile.lightY,
      rotation: profile.lightRoll,
      opacity: 1,
      duration: quarter * 2,
      repeat: 1,
      yoyo: true,
      ease: imageShieldMotion.float.ease,
    },
    0,
  );
  return orbit;
}

export function resetImageShieldTilt(rotateX, rotateY, immediate = false) {
  rotateX(0);
  rotateY(0);
  // Finish synchronously when hidden; do not leave a 700 ms return tween running.
  if (immediate) {
    rotateX.tween.progress(1).pause();
    rotateY.tween.progress(1).pause();
  }
}

/** Coordinates are local to the untransformed stage, avoiding feedback during tilt. */
export function imageShieldTilt(
  x,
  y,
  width,
  height,
  { pointerType = "mouse", reducedMotion = false, enabled = true } = {},
) {
  const neutral = { rotationX: 0, rotationY: 0 };
  if (
    !enabled ||
    reducedMotion ||
    pointerType !== "mouse" ||
    ![x, y, width, height].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0
  )
    return neutral;
  const clamp = (value) => Math.max(-1, Math.min(1, value));
  const horizontal = clamp((x / width) * 2 - 1),
    vertical = clamp((y / height) * 2 - 1);
  return {
    rotationX: vertical === 0 ? 0 : -vertical * imageShieldMotion.tilt.pitch,
    rotationY: horizontal * imageShieldMotion.tilt.yaw,
  };
}

/** Cursor lighting is a restrained visual overlay, not physical relighting of a 3D model. */
export function imageShieldInteraction(x, y, width, height, options = {}) {
  const neutral = {
    rotationX: 0,
    rotationY: 0,
    x: 0,
    y: 0,
    reflectionX: 0,
    reflectionY: 0,
    reflectionOpacity: 0,
  };
  if (
    options.enabled === false ||
    options.reducedMotion ||
    (options.pointerType && options.pointerType !== "mouse") ||
    ![x, y, width, height].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0
  )
    return neutral;
  if (x <= 0 || y <= 0 || x >= width || y >= height) return neutral;
  const pose = imageShieldTilt(x, y, width, height, options);
  const horizontal = pose.rotationY / imageShieldMotion.tilt.yaw;
  const vertical = pose.rotationX === 0 ? 0 : -pose.rotationX / imageShieldMotion.tilt.pitch;
  const edge = Math.min(x / width, 1 - x / width, y / height, 1 - y / height);
  const progress = Math.min(1, edge / 0.15);
  const influence = progress * progress * (3 - 2 * progress);
  return {
    rotationX: pose.rotationX * influence,
    rotationY: pose.rotationY * influence,
    x: horizontal * imageShieldMotion.pointer.x * influence,
    y: vertical * imageShieldMotion.pointer.y * influence,
    reflectionX: horizontal * imageShieldMotion.pointer.reflectionX,
    reflectionY: vertical * imageShieldMotion.pointer.reflectionY,
    reflectionOpacity: imageShieldMotion.pointer.opacity * influence,
  };
}
