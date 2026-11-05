import { createFileRoute, Link } from "@tanstack/react-router";
import ShieldPreview from "@/components/shield-preview";
import previewCss from "../preview-escudo.css?url";

export const Route = createFileRoute("/preview/escudo")({
  head: () => ({
    meta: [
      { title: "Escudo ZURY — estudo isolado" },
      {
        name: "description",
        content: "Prévia isolada da arte original do escudo ZURY com movimento sutil.",
      },
      { property: "og:title", content: "Escudo ZURY — estudo isolado" },
      {
        property: "og:description",
        content: "Prévia isolada da arte original do escudo ZURY com movimento sutil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: previewCss }],
  }),
  component: ShieldPage,
});

function ShieldPage() {
  return (
    <main className="preview-page" data-shield-scroll-root>
      <Link className="preview-back" to="/">
        Voltar para ZURY
      </Link>
      <div className="preview-heading">
        <p>Prévia da imagem original</p>
        <h1>Escudo ZURY</h1>
        <span>Arte preservada · movimento sutil</span>
      </div>
      <ShieldPreview />
      <p className="preview-note">
        Imagem original animada, sem reconstrução 3D. Prévia isolada aguardando aprovação visual,
        sem integração à Hero.
      </p>
    </main>
  );
}
