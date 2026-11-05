import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { createSiteEntrance } from "@/lib/site-motion.mjs";

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Mount the original page choreography. This module is loaded only by a mounted SiteMotion. */
export function mountPageMotion(root: HTMLElement): () => void {
  const media = gsap.matchMedia();
  const splits = new Set<SplitText>();
  const completed = new WeakSet<Element>();
  let disposed = false;
  let refreshFrame = 0;
  let observer: ResizeObserver | undefined;
  let width = -1;
  let height = -1;

  const refresh = () => {
    if (disposed || refreshFrame || document.hidden) return;
    refreshFrame = requestAnimationFrame(() => {
      refreshFrame = 0;
      if (disposed) return;
      try {
        ScrollTrigger.refresh();
      } catch (error) {
        destroy();
        console.error("Unable to refresh ZURY page motion; content remains readable.", error);
      }
    });
  };
  const resume = () => {
    if (!document.hidden) refresh();
  };
  const destroy = () => {
    disposed = true;
    cancelAnimationFrame(refreshFrame);
    observer?.disconnect();
    window.removeEventListener("pageshow", resume);
    document.removeEventListener("visibilitychange", resume);
    document.fonts.removeEventListener("loadingdone", refresh);
    media.revert();
    splits.forEach((split) => split.revert());
    splits.clear();
  };

  try {
    media.add(
      // Preserve section choreography; the hero controls below honor the current reduced-motion request.
      "all",
      (context) => {
        const reducedSections = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const staticSection = (element: Element) =>
          reducedSections && !!element.closest("#como-funciona, #companhias, #beneficios");
        const ownSplits: SplitText[] = [];
        const split = (target: HTMLElement, options: Parameters<typeof SplitText.create>[1]) => {
          const instance = SplitText.create(target, options);
          splits.add(instance);
          ownSplits.push(instance);
        };
        const finish = (target: Element) => () => {
          completed.add(target);
        };
        // The fixed navbar must stay flush with the viewport even during initial entrance.
        const chrome = Array.from(root.querySelectorAll<HTMLElement>(".hero-actions")).filter(
          (target) => !completed.has(target),
        );
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
          createSiteEntrance(gsap, chrome, {
            delay: 0.55,
            from: { x: 0, scale: 1 },
            to: {
              stagger: 0.08,
              clearProps: "transform,opacity",
              onComplete: () => chrome.forEach((target) => completed.add(target)),
            },
          });
        root.querySelectorAll<HTMLElement>("[data-split]").forEach((heading) => {
          if (completed.has(heading) || staticSection(heading)) return;
          split(heading, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            linesClass: "heading-line",
            onSplit: (self) => {
              // A line box with tight leading can otherwise clip Ã/É/Ç inside SplitText masks.
              for (const mask of self.masks) {
                if (mask instanceof HTMLElement) {
                  mask.style.overflowClipMargin = "0.22em";
                  if (completed.has(heading)) mask.style.overflow = "visible";
                }
              }
              if (completed.has(heading)) return;
              return gsap.from(self.lines, {
                yPercent: 130,
                duration: 1.15,
                ease: "expo.out",
                stagger: 0.09,
                onComplete: () => {
                  finish(heading)();
                  gsap.set(self.masks, { overflow: "visible" });
                },
                scrollTrigger: { trigger: heading, start: "top 88%", once: true },
              });
            },
          });
        });
        root.querySelectorAll<HTMLElement>("[data-scrub-words]").forEach((text) => {
          split(text, {
            type: "words",
            autoSplit: true,
            onSplit: (self) =>
              gsap.fromTo(
                self.words,
                { opacity: 0.16 },
                {
                  opacity: 1,
                  ease: "none",
                  stagger: 0.1,
                  scrollTrigger: {
                    trigger: text,
                    start: "top 82%",
                    end: "bottom 52%",
                    scrub: true,
                  },
                },
              ),
          });
        });
        root.querySelectorAll<HTMLElement>("[data-fill]").forEach((title) => {
          gsap.fromTo(
            title,
            { "--fill": "100%" },
            {
              "--fill": "0%",
              ease: "none",
              scrollTrigger: { trigger: title, start: "top 85%", end: "top 40%", scrub: true },
            },
          );
        });
        // Capture tweens created by later batch callbacks in the same scoped GSAP context.
        const reveal = (batch: Element[], vars: gsap.TweenVars) => {
          context.add(() => {
            gsap.to(batch, {
              ...vars,
              onComplete: () => batch.forEach((target) => completed.add(target)),
            });
          });
        };
        const pending = (selector: string) =>
          Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
            (target) => !completed.has(target) && !staticSection(target),
          );
        const blurs = pending('[data-reveal="blur"]');
        gsap.set(blurs, { opacity: 0, y: -8, filter: "blur(4px)" });
        ScrollTrigger.batch(blurs, {
          start: "top 95%",
          once: true,
          onEnter: (batch) =>
            reveal(batch, {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.8,
              ease: "power2.out",
              stagger: 0.1,
              clearProps: "opacity,transform,filter",
            }),
        });
        const wipes = pending('[data-reveal="wipe"]');
        gsap.set(wipes, { clipPath: "inset(100% 0% 0% 0%)", y: 32 });
        ScrollTrigger.batch(wipes, {
          start: "top 90%",
          once: true,
          onEnter: (batch) =>
            reveal(batch, {
              clipPath: "inset(0% 0% 0% 0%)",
              y: 0,
              duration: 1.05,
              ease: "expo.out",
              stagger: 0.08,
              clearProps: "clipPath,transform",
            }),
        });
        const deals = pending('[data-reveal="deal"]');
        gsap.set(deals, { opacity: 0, y: 70, rotate: -7 });
        ScrollTrigger.batch(deals, {
          start: "top 85%",
          once: true,
          onEnter: (batch) =>
            reveal(batch, {
              opacity: 1,
              y: 0,
              rotate: 0,
              duration: 1.2,
              ease: "expo.out",
              stagger: 0.14,
              clearProps: "opacity,transform",
            }),
        });
        pending(
          '[data-reveal]:not([data-reveal="wipe"]):not([data-reveal="deal"]):not([data-reveal="blur"])',
        ).forEach((item) => {
          createSiteEntrance(gsap, item, {
            delay: 0,
            from: { x: 0, y: 24, scale: 1 },
            to: {
              duration: 0.9,
              onComplete: finish(item),
              scrollTrigger: { trigger: item, start: "top 90%", once: true },
            },
          });
        });
        refresh();
        return () => {
          ownSplits.forEach((instance) => {
            instance.revert();
            splits.delete(instance);
          });
        };
      },
      root,
    );

    // No refresh per image load: images sit in sized boxes, so a load never moves a trigger, while each refresh
    // scrolled to 0 and back and killed the touch fling ~11 times per page on phones. A load that does change the
    // page height still refreshes through the ResizeObserver below.
    window.addEventListener("pageshow", resume);
    document.addEventListener("visibilitychange", resume);
    document.fonts.addEventListener("loadingdone", refresh);
    void document.fonts.ready.then(refresh).catch((error: unknown) => {
      if (!disposed) console.error("Unable to refresh ZURY motion after font loading.", error);
    });
    observer = new ResizeObserver((entries) => {
      const size = entries[0]?.contentRect;
      if (!size || (Math.abs(size.width - width) < 0.5 && Math.abs(size.height - height) < 0.5))
        return;
      width = size.width;
      height = size.height;
      refresh();
    });
    observer.observe(root);
    return destroy;
  } catch (error) {
    // Revert every partial setup before propagating to the route's reporting boundary.
    destroy();
    throw error;
  }
}
