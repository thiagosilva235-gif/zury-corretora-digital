import { createFileRoute } from "@tanstack/react-router";
import DigitalCard from "../digital-card";

export const Route = createFileRoute("/cartao")({
  head: () => ({
    meta: [
      { title: "Cartão digital | ZURY CORRETORA" },
      { name: "description", content: "Cotações, contatos e canais oficiais da ZURY CORRETORA." },
      { property: "og:title", content: "Cartão digital | ZURY CORRETORA" },
      {
        property: "og:description",
        content: "Converse com a ZURY: cotações, contatos e canais oficiais em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#090b0d" },
    ],
  }),
  component: DigitalCard,
});
