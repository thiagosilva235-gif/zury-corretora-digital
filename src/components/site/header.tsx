import { OfficialLogo } from "./official-logo";
import { useEffect, useId, useRef, useState } from "react";
import { navigation, type SiteNavigationItem } from "@/lib/content";
import { headerShouldHide } from "@/lib/header-visibility";
import { compactNavigationQuery } from "@/lib/navigation";
import { Menu, X } from "lucide-react";
import { QuoteTrigger } from "./quote-menu";
import { useBrandShineSync } from "./use-brand-shine-sync";
import "./header-desktop.css";
import "./quote-cta.css";
import "./brand-shine.css";

/** The reference's mirrored recess is a vector surface; the mark is the untouched brand asset. */
function DesktopNavbar({
  items,
  active,
}: {
  items: readonly SiteNavigationItem[];
  active: string;
}) {
  const id = useId();
  return (
    <nav className="header-desktop" aria-label="Navegação principal desktop">
      <div className="desktop-nav-side desktop-nav-left">
        {items
          // Only the commercial anchors sit beside the mark; every other link lives in the footer and compact menu.
          .filter((item) => item.href === "#indicacoes" || item.href === "#beneficios")
          .map((item) => (
            <a
              key={item.href}
              className="desktop-nav-link"
              href={item.href}
              aria-current={active === item.href ? "location" : undefined}
            >
              {item.label}
            </a>
          ))}
      </div>
      <a className="desktop-brand-link" href="#inicio" aria-label="ZURY CORRETORA — início">
        <svg
          className="desktop-brand-recess"
          viewBox="0 0 540 120"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0.12" y2="1">
              <stop offset="0" stopColor="#f7f7f6" />
              <stop offset="0.4" stopColor="#e4e4e3" />
              <stop offset="0.82" stopColor="#f5f5f4" />
              <stop offset="1" stopColor="#e8e8e7" />
            </linearGradient>
            <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#676767" stopOpacity="0.32" />
              <stop offset="0.72" stopColor="#818181" stopOpacity="0.16" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path d="M0 0C88 0 80 120 170 120H370C460 120 452 0 540 0Z" fill={`url(#${id}-metal)`} />
          <path
            d="M0 1C88 1 80 119 170 119H370C460 119 452 1 540 1"
            fill="none"
            stroke={`url(#${id}-edge)`}
            strokeWidth="5"
            opacity="0.18"
          />
          <path
            d="M0 1C88 1 80 119 170 119H370C460 119 452 1 540 1"
            fill="none"
            stroke={`url(#${id}-edge)`}
            strokeWidth="1.2"
          />
        </svg>
        <span className="desktop-brand-mark brand-shine">
          <img
            className="desktop-brand-logo"
            src="/brand/zury-assinatura-enviada.png"
            alt=""
            width={1046}
            height={324}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <span className="brand-shine-light" aria-hidden="true" />
        </span>
      </a>
      <div className="desktop-nav-side desktop-nav-right">
        <button
          className="desktop-nav-link desktop-social"
          type="button"
          popoverTarget="social-channels"
          aria-haspopup="dialog"
        >
          REDES SOCIAIS
        </button>
        <QuoteTrigger className="desktop-quote quote-graphite quote-graphite--glow" />
      </div>
    </nav>
  );
}

export function SiteHeader({ items = navigation }: { items?: readonly SiteNavigationItem[] }) {
  const header = useRef<HTMLElement>(null);
  const navbar = useRef<HTMLElement>(null);
  useBrandShineSync(header);
  const [active, setActive] = useState("");
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const query = matchMedia(compactNavigationQuery);
    const update = () => {
      if (!query.matches && navbar.current?.matches(":popover-open")) navbar.current.hidePopover();
      setCompact(query.matches);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const element = header.current;
    const navigationElement = navbar.current;
    if (!element || !navigationElement) return;
    const root = element.closest(".zury-site");
    let hidden = false;
    let previous = window.scrollY;
    // Read in the scroll event, which runs before the frame's animation callbacks write styles: reading scrollY
    // inside the rAF below forced a synchronous layout of the whole page on every scrolled frame.
    let latest = previous;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const current = latest;
      const interacting =
        element.contains(document.activeElement) ||
        navigationElement.matches(":popover-open") ||
        !!root?.querySelector('.channel-panel[data-placement="below"]:popover-open');
      const nextHidden = headerShouldHide(hidden, previous, current, interacting);
      previous = current;
      if (nextHidden !== hidden) {
        hidden = nextHidden;
        element.inert = hidden;
        element.dataset["hidden"] = String(hidden);
      }
      const scrolled = String(current > 24);
      if (element.dataset["scrolled"] !== scrolled) element.dataset["scrolled"] = scrolled;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    const onScroll = () => {
      latest = window.scrollY;
      schedule();
    };
    const popover = (event: Event) => {
      if (
        event.target === navigationElement ||
        (event.target instanceof HTMLElement && event.target.dataset["placement"] === "below")
      )
        schedule();
    };
    const passed = new Set<string>();
    const updateActive = () => {
      const id = passed.has("institucional")
        ? "institucional"
        : ["beneficios", "indicacoes", "sobre", "servicos"].find((candidate) =>
            passed.has(candidate),
          );
      setActive(id ? `#${id}` : "");
    };
    const observeSections = (ids: string[], cutoff: number) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.boundingClientRect.top <= window.innerHeight * cutoff + 0.5)
              passed.add(entry.target.id);
            else passed.delete(entry.target.id);
          });
          updateActive();
        },
        { rootMargin: `0px 0px -${window.innerHeight * (1 - cutoff)}px 0px` },
      );
      ids.forEach((id) => {
        const section = root?.querySelector<HTMLElement>(`#${id}`);
        if (section) observer.observe(section);
      });
      return observer;
    };
    let sections = observeSections(["beneficios", "indicacoes", "sobre", "servicos"], 0.45);
    // The footer may never reach the section cutoff before the document ends.
    let institutional = observeSections(["institucional"], 1);
    const resize = () => {
      latest = window.scrollY;
      sections.disconnect();
      institutional.disconnect();
      sections = observeSections(["beneficios", "indicacoes", "sobre", "servicos"], 0.45);
      institutional = observeSections(["institucional"], 1);
      schedule();
    };
    const resume = () => {
      hidden = false;
      element.inert = false;
      element.dataset["hidden"] = "false";
      previous = latest = window.scrollY;
      schedule();
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !hidden) return;
      hidden = false;
      element.inert = false;
      element.dataset["hidden"] = "false";
    };
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pageshow", resume);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("keydown", keyboard);
    document.addEventListener("toggle", popover, true);
    element.addEventListener("focusin", schedule);
    element.addEventListener("focusout", schedule);
    return () => {
      cancelAnimationFrame(frame);
      sections.disconnect();
      institutional.disconnect();
      element.inert = false;
      delete element.dataset["hidden"];
      delete element.dataset["scrolled"];
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", keyboard);
      document.removeEventListener("toggle", popover, true);
      element.removeEventListener("focusin", schedule);
      element.removeEventListener("focusout", schedule);
    };
  }, []);
  const closeMenu = () => {
    if (compact && navbar.current?.matches(":popover-open")) navbar.current.hidePopover();
  };

  return (
    <header ref={header} className="site-header">
      <DesktopNavbar items={items} active={active} />
      <div className="container header-bar header-mobile">
        <a href="#inicio" className="brand-link brand-shine">
          <OfficialLogo priority />
          <span className="brand-shine-light" aria-hidden="true" />
        </a>
        <nav
          ref={navbar}
          id="site-navigation"
          popover={compact ? "auto" : undefined}
          aria-label="Navegação principal"
          className="site-nav"
          onToggle={(event) => {
            const opened = event.newState === "open";
            setMenuOpen(opened);
            if (opened)
              event.currentTarget
                .querySelector<HTMLAnchorElement>("a")
                ?.focus({ preventScroll: true });
          }}
        >
          {items.map((item) => (
            <a
              className="nav-link"
              key={item.href}
              href={item.href}
              aria-current={active === item.href ? "location" : undefined}
              onClick={closeMenu}
            >
              {item.label}
            </a>
          ))}
          <a className="nav-link" href="/cartao" onClick={closeMenu}>
            CARTÃO DIGITAL
          </a>
          <button
            className="nav-link"
            type="button"
            popoverTarget="social-channels"
            aria-haspopup="dialog"
            onClick={closeMenu}
          >
            REDES SOCIAIS
          </button>
          <button
            className="nav-link nav-contact"
            type="button"
            popoverTarget="nav-contact-channels"
            aria-haspopup="dialog"
            onClick={closeMenu}
          >
            CONTATO
          </button>
        </nav>
        <div className="header-actions">
          <QuoteTrigger className="header-quote quote-graphite quote-graphite--glow" />
          <button
            type="button"
            className="btn btn-icon mobile-menu-toggle"
            popoverTarget="site-navigation"
            aria-controls="site-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Fechar navegação" : "Abrir navegação"}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}
