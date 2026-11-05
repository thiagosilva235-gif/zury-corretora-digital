import { useState } from "react";
import { ImageShield } from "./shield/image-shield";

export default function ShieldPreview() {
  const [animated, setAnimated] = useState(true);
  return (
    <div className="shield-preview">
      <figure className="shield-image-study">
        <ImageShield animated={animated} />
        <figcaption>
          Imagem original · {animated ? "movimento suave" : "visualização estática"}
        </figcaption>
      </figure>
      <div className="shield-view-controls" role="group" aria-label="Movimento da imagem do escudo">
        <button type="button" aria-pressed={animated} onClick={() => setAnimated(true)}>
          Movimento
        </button>
        <button type="button" aria-pressed={!animated} onClick={() => setAnimated(false)}>
          Imagem estática
        </button>
      </div>
    </div>
  );
}
