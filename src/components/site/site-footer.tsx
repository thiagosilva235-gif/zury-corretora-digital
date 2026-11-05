import type { ComponentType, ReactNode } from "react";
import { Camera, Mail, Music2, Star } from "lucide-react";
import { OfficialLogo } from "./official-logo";
import { WhatsAppIcon } from "./whatsapp-icon";
import { FacebookIcon } from "./facebook-icon";
import {
  contacts,
  digitalChannels,
  googleReviewHref,
  heroSubtitle,
  institutionalLinks,
  navigation,
  registration,
} from "@/lib/content";
import "./site-footer.css";

type FooterLink = {
  title: ReactNode;
  href: string;
  icon?: ComponentType<{ size?: number }>;
  external?: boolean;
};
type FooterColumn = { label: string; id?: string; links: FooterLink[]; lead?: string };

/** Only supplied channels, read from content.ts. */
const columns: FooterColumn[] = [
  { label: "NAVEGAÇÃO", links: navigation.map((item) => ({ title: item.label, href: item.href })) },
  {
    label: "ATENDIMENTO",
    links: [
      ...contacts.map((contact) => ({
        title: (
          <>
            {contact.name}
            {contact.role && <small>{contact.role}</small>}
          </>
        ),
        href: contact.href,
        icon: WhatsAppIcon,
        external: true,
      })),
      { title: "E-mail", href: `mailto:${digitalChannels.email}`, icon: Mail },
    ],
  },
  {
    label: "INSTITUCIONAL",
    id: "institucional",
    lead: registration.company,
    links: [
      { title: `CNPJ: ${registration.cnpj}`, href: institutionalLinks.cnpj, external: true },
      { title: `SUSEP: ${registration.susep}`, href: institutionalLinks.susep, external: true },
    ],
  },
  {
    label: "REDES SOCIAIS",
    links: [
      { title: "Instagram", href: digitalChannels.instagram.href, icon: Camera, external: true },
      { title: "TikTok", href: digitalChannels.tiktok.href, icon: Music2, external: true },
      {
        title: "Facebook",
        href: digitalChannels.facebook.href,
        icon: FacebookIcon,
        external: true,
      },
      { title: "Nos avalie no Google", href: googleReviewHref, icon: Star, external: true },
    ],
  },
];

/**
 * Adapted Footer Section (21st.dev): rounded top panel spanning the section with a centre glow, brand column plus
 * four link columns (each entering with a short blur-in cascade, `data-reveal="blur"`, owned by SiteMotion), and a
 * bottom bar with the copyright and the motto.
 */
export function SiteFooter() {
  return (
    <footer id="contato" className="site-footer">
      <div className="footer-panel">
        <span className="footer-glow" aria-hidden="true" />
        <div className="footer-grid">
          <div className="footer-brand" data-reveal="blur">
            <OfficialLogo className="footer-logo" />
          </div>
          <div className="footer-columns">
            {columns.map((column) => (
              <div
                className="footer-column"
                data-reveal="blur"
                key={column.label}
                id={column.id}
                tabIndex={column.id ? -1 : undefined}
              >
                <h2>{column.label}</h2>
                <ul>
                  {column.lead && <li className="footer-lead">{column.lead}</li>}
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <a
                        className="footer-link"
                        href={link.href}
                        {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {link.icon && <link.icon size={15} />}
                        <span>{link.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <p className="copyright">© 2026 {registration.company}. Todos os direitos reservados.</p>
          <span className="footer-motto">{heroSubtitle.split("/").join(" · ")}</span>
        </div>
      </div>
    </footer>
  );
}
