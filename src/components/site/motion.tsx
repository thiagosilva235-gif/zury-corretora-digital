import { useEffect } from "react";
import "./site-motion.css";

/** Load the page-only animation runtime after mount; navigation stays native without it. */
export function SiteMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".zury-site");
    if (!root) return;
    const html = document.documentElement;
    const hadSmoothScroll = html.classList.contains("zury-native-scroll");
    let disposed = false;
    let restoreFrame = 0;
    let cleanupMotion: (() => void) | undefined;
    html.classList.add("zury-native-scroll");

    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
          : null;
      if (!link || link.target || link.hasAttribute("download")) return;
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      let id: string;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        // Malformed fragment links retain the browser's own navigation behavior.
        return;
      }
      const target = document.getElementById(id);
      if (!target || !root.contains(target)) return;
      target.focus({ preventScroll: true });
      if (event.detail === 0 || link.classList.contains("skip-link")) {
        // The default anchor action runs before this frame: keyboard navigation is immediate.
        html.classList.remove("zury-native-scroll");
        cancelAnimationFrame(restoreFrame);
        restoreFrame = requestAnimationFrame(() => {
          if (!disposed) html.classList.add("zury-native-scroll");
        });
      }
      // Do not preventDefault: the browser owns scrolling, hash history and interruption.
    };
    root.addEventListener("click", navigate);
    void import("./page-motion-runtime")
      .then(({ mountPageMotion }) => {
        if (!disposed) cleanupMotion = mountPageMotion(root);
      })
      .catch((error: unknown) => {
        console.error("Unable to initialize ZURY page motion; content remains readable.", error);
      });
    return () => {
      disposed = true;
      cancelAnimationFrame(restoreFrame);
      cleanupMotion?.();
      root.removeEventListener("click", navigate);
      html.classList.toggle("zury-native-scroll", hadSmoothScroll);
    };
  }, []);
  return null;
}
