/** One entrance clock for artwork, page chrome, typography and scroll reveals. */
export const entranceMotion = Object.freeze({
  duration: 1.2,
  ease: "power3.out",
  delay: 0.08,
  x: 28,
  y: 38,
  scale: 0.94,
});
/** @param {any} gsap @param {any} target @param {{paused?:boolean,delay?:number,from?:Record<string,unknown>,to?:Record<string,unknown>}} options */
export function createSiteEntrance(
  gsap,
  target,
  { paused = false, delay = entranceMotion.delay, from = {}, to = {} } = {},
) {
  return gsap.fromTo(
    target,
    { opacity: 0, x: entranceMotion.x, y: entranceMotion.y, scale: entranceMotion.scale, ...from },
    {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      duration: entranceMotion.duration,
      ease: entranceMotion.ease,
      delay,
      paused,
      ...to,
    },
  );
}
