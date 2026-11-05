export const shieldMotion = Object.freeze({
  entrance: {
    duration: 3.2,
    ease: "power3.out",
    cssEase: "cubic-bezier(.23,1,.32,1)",
    posterFade: 0.7,
    y: -0.22,
    yaw: -0.3,
    pitch: 0.09,
  },
  pose: { yaw: -0.1, pitch: 0.025 },
  float: { amplitude: 0.012, period: 9 },
  tilt: { yaw: 0.1, pitch: 0.065, touchFactor: 0.4, damping: 5.5 },
  scroll: { y: 0.16, yaw: 0.09, pitch: -0.045, scrub: 0.7 },
  light: { amplitude: 0.018, period: 22 },
});
