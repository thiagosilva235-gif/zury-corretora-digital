import { createFileRoute } from "@tanstack/react-router";
import Home from "../site-home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZURY CORRETORA | Seguros para sua vida e seus negócios" },
      {
        name: "description",
        content:
          "Conheça as soluções da ZURY CORRETORA para proteger sua família, seu patrimônio e sua empresa.",
      },
      { property: "og:title", content: "ZURY CORRETORA | Seguros para sua vida e seus negócios" },
      {
        property: "og:description",
        content:
          "Conheça as soluções da ZURY CORRETORA para proteger sua família, seu patrimônio e sua empresa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});
