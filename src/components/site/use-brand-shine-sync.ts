import { useEffect, type RefObject } from "react";

/** One document-timeline epoch: preserve the logo's cycle and join it after the headline entrance. */
export function useBrandShineSync(headerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = headerRef.current?.closest<HTMLElement>(".zury-site");
    if (!root) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let frame = 0;
    let epoch: number | undefined;
    let firstSweep: number | undefined;
    const animations = (element: Element, name: string) =>
      element
        .getAnimations({ subtree: true })
        .filter(
          (animation): animation is CSSAnimation =>
            "animationName" in animation && animation.animationName === name,
        );
    const sync = () => {
      frame = 0;
      if (disposed || document.hidden) return;
      if (preference.matches) {
        root.dataset["heroEntered"] = "true";
        delete root.dataset["shineReady"];
        return;
      }
      const logos = Array.from(root.querySelectorAll(".site-header .brand-shine-light")).flatMap(
        (element) => animations(element, "brand-shine"),
      );
      const now = document.timeline.currentTime;
      if (typeof now !== "number") return;
      epoch ??= typeof logos[0]?.startTime === "number" ? logos[0].startTime : now;
      const duration =
        Number(logos[0]?.effect?.getTiming().duration) ||
        parseFloat(getComputedStyle(root).getPropertyValue("--brand-shine-duration")) * 1000;
      if (!Number.isFinite(duration) || duration <= 0) return;
      const lastLine = root.querySelector(".hero-line:last-child");
      const entry = lastLine
        ?.getAnimations()
        .find(
          (animation) =>
            "animationName" in animation && animation.animationName === "hero-line-entry",
        );
      const end =
        entry && typeof entry.startTime === "number"
          ? entry.startTime + Number(entry.effect?.getComputedTiming().endTime ?? 0)
          : now;
      // Never restart the logo to accommodate the text. Wait for its next complete sweep.
      firstSweep ??=
        epoch + Math.max(1, Math.ceil((Math.max(end, now) - epoch) / duration)) * duration;
      for (const animation of logos) animation.startTime = epoch;
      const text = root.querySelector(".hero-text-shine");
      if (text) {
        for (const animation of animations(text, "brand-text-shine"))
          animation.startTime = firstSweep;
        root.dataset["shineReady"] = "true";
      }
      if (entry?.playState === "finished") root.dataset["heroEntered"] = "true";
    };
    const schedule = () => {
      if (!frame && !disposed) frame = requestAnimationFrame(sync);
    };
    const entered = (event: AnimationEvent) => {
      if (
        event.animationName === "hero-line-entry" &&
        event.target === root.querySelector(".hero-line:last-child")
      ) {
        root.dataset["heroEntered"] = "true";
      }
    };
    schedule();
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("pageshow", schedule);
    document.addEventListener("visibilitychange", schedule);
    preference.addEventListener("change", schedule);
    root.addEventListener("animationend", entered);
    void document.fonts.ready.then(schedule);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
      document.removeEventListener("visibilitychange", schedule);
      preference.removeEventListener("change", schedule);
      root.removeEventListener("animationend", entered);
      delete root.dataset["shineReady"];
      delete root.dataset["heroEntered"];
    };
  }, [headerRef]);
}
