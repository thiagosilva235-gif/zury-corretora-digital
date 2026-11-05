import { useEffect, useRef, useState } from "react";

/**
 * Position and navigation for a horizontal scroll-snap track whose direct children are the slides.
 * `current` is the slide nearest the track's start edge; `go`, `prev` and `next` scroll smoothly to a slide,
 * honouring the track's `scroll-padding-inline-start`. Layouts that never scroll (e.g. a desktop grid) simply
 * stay at slide 0.
 */
export function useSnapCarousel<T extends HTMLElement = HTMLDivElement>() {
  const track = useRef<T>(null);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const slides = element.children;
      const start = element.getBoundingClientRect().left;
      let nearest = 0;
      let distance = Infinity;
      for (let index = 0; index < slides.length; index++) {
        const offset = Math.abs(slides[index]!.getBoundingClientRect().left - start);
        if (offset < distance) {
          distance = offset;
          nearest = index;
        }
      }
      setCount(slides.length);
      // At the far end the last slide may never reach the start edge; treat "scrolled to the end" as last.
      const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 2;
      setCurrent(atEnd && element.scrollLeft > 0 ? slides.length - 1 : nearest);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    sync();
    element.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  const go = (index: number) => {
    const element = track.current;
    const slide = element?.children[index];
    if (!element || !(slide instanceof HTMLElement)) return;
    const padding = parseFloat(getComputedStyle(element).scrollPaddingInlineStart) || 0;
    const left =
      element.scrollLeft +
      slide.getBoundingClientRect().left -
      element.getBoundingClientRect().left -
      padding;
    element.scrollTo({
      left,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };
  const last = Math.max(0, count - 1);
  return {
    track,
    current,
    count,
    go,
    prev: () => go(Math.max(0, current - 1)),
    next: () => go(Math.min(last, current + 1)),
  };
}
