import { useLayoutEffect, useRef, useState } from "react";
import { Mail, Music2, Camera, X } from "lucide-react";
import { WhatsAppIcon } from "./whatsapp-icon";
import { FacebookIcon } from "./facebook-icon";
import { contacts, digitalChannels } from "@/lib/content";
import { compactNavigationQuery } from "@/lib/navigation";

export function ChannelsPopover({
  id,
  title,
  kind = "contact",
  placement = "below",
  contactMode,
}: {
  id: string;
  title: string;
  kind?: "contact" | "social";
  placement?: "below" | "above" | "right";
  contactMode?: "whatsapp" | "phone";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    const element = panel.current;
    if (!open || !element) return;
    const source = opener.current ?? document.querySelector<HTMLElement>(`[popovertarget="${id}"]`);
    const trigger =
      source?.closest("#site-navigation") && matchMedia(compactNavigationQuery).matches
        ? document.querySelector<HTMLElement>(".mobile-menu-toggle")
        : source;
    if (!trigger) return;
    const position = () => {
      const viewport = window.visualViewport;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const offsetY = viewport?.offsetTop ?? 0;
      const offsetX = viewport?.offsetLeft ?? 0;
      const anchor = trigger.getBoundingClientRect();
      element.style.maxWidth = `${Math.max(0, width - 24)}px`;
      element.style.maxHeight = `${Math.max(0, height - 24)}px`;
      // Untransformed dimensions avoid position drift during the entrance animation.
      const panelWidth = element.offsetWidth;
      const panelHeight = element.offsetHeight;
      const rightFits = placement === "right" && anchor.right + 16 + panelWidth <= width - 12;
      const left = rightFits
        ? anchor.right + 16
        : Math.min(
            Math.max(anchor.left + anchor.width / 2 - panelWidth / 2, 12),
            width - panelWidth - 12,
          );
      const below = anchor.bottom + 12;
      const above = anchor.top - panelHeight - 12;
      const preferredTop = rightFits
        ? anchor.top - 20
        : placement === "above" && above >= 12
          ? above
          : below + panelHeight <= height - 12
            ? below
            : above;
      const top = Math.max(12, Math.min(preferredTop, height - panelHeight - 12));
      element.dataset["side"] = rightFits ? "right" : "vertical";
      element.style.left = `${left + offsetX}px`;
      element.style.top = `${top + offsetY}px`;
    };
    position();
    // Scroll and resize can fire several times per frame; each position() forces layout, so one per frame.
    let frame = 0;
    const schedule = () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          position();
        });
    };
    // ResizeObserver already runs once per frame before paint; deferring it would show one misplaced frame.
    const observer = new ResizeObserver(position);
    observer.observe(element);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule);
    const close = element.querySelector<HTMLButtonElement>(".popover-close");
    close?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        element.hidePopover();
        trigger.focus({ preventScroll: true });
      }
    };
    element.addEventListener("keydown", escape);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      element.removeEventListener("keydown", escape);
    };
  }, [id, open, placement, contactMode]);

  const people = (
    <div className="whatsapp-people">
      {contacts.map((person) => (
        <a
          href={
            contactMode === "phone"
              ? `tel:+${new URL(person.href).pathname.replace(/\D/g, "")}`
              : person.href
          }
          target={contactMode === "phone" ? undefined : "_blank"}
          rel={contactMode === "phone" ? undefined : "noopener noreferrer"}
          key={person.name}
          className="person-link"
          aria-label={`${contactMode === "phone" ? "Ligar para" : "WhatsApp de"} ${person.name}${person.role ? `, ${person.role}` : ""}`}
        >
          <strong>
            {person.name}
            {person.role && (
              <>
                {" "}
                — <span>{person.role}</span>
              </>
            )}
          </strong>
        </a>
      ))}
    </div>
  );
  return (
    <div
      ref={panel}
      id={id}
      popover="auto"
      role="dialog"
      aria-labelledby={`${id}-title`}
      className="channel-panel"
      data-placement={placement}
      data-open={open || undefined}
      onToggle={(event) => {
        if (event.newState === "open") {
          const source = (event.nativeEvent as Event & { source?: Element }).source;
          opener.current =
            source instanceof HTMLElement
              ? source
              : document.activeElement instanceof HTMLElement &&
                  document.activeElement.getAttribute("popovertarget") === id
                ? document.activeElement
                : null;
        } else setExpanded(false);
        setOpen(event.newState === "open");
      }}
    >
      <div className="channel-heading">
        <h2 id={`${id}-title`}>{title}</h2>
        <button
          className="btn btn-icon popover-close"
          type="button"
          popoverTarget={id}
          popoverTargetAction="hide"
          aria-label={`Fechar ${title.toLowerCase()}`}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {kind === "contact" ? (
        contactMode ? (
          people
        ) : (
          <>
            <button
              type="button"
              className="channel-row whatsapp-toggle"
              aria-expanded={expanded}
              aria-controls={`${id}-people`}
              onClick={() => setExpanded(!expanded)}
            >
              <WhatsAppIcon />
              <span>
                <strong>WhatsApp</strong>
              </span>
            </button>
            <div
              id={`${id}-people`}
              className="whatsapp-collapse"
              data-expanded={expanded}
              inert={!expanded}
              aria-hidden={!expanded}
            >
              <div>{people}</div>
            </div>
            <a className="channel-row" href={`mailto:${digitalChannels.email}`}>
              <Mail size={20} aria-hidden="true" />
              <span>
                <strong>E-mail</strong>
              </span>
            </a>
          </>
        )
      ) : (
        <>
          <a
            className="channel-row"
            href={digitalChannels.instagram.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Camera size={20} aria-hidden="true" />
            <span>
              <strong>Instagram</strong>
            </span>
          </a>
          <a
            className="channel-row"
            href={digitalChannels.tiktok.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Music2 size={20} aria-hidden="true" />
            <span>
              <strong>TikTok</strong>
            </span>
          </a>
          <a
            className="channel-row"
            href={digitalChannels.facebook.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FacebookIcon size={20} />
            <span>
              <strong>Facebook</strong>
            </span>
          </a>
        </>
      )}
    </div>
  );
}
