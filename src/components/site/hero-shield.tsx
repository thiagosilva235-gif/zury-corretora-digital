import { ImageShield } from "@/components/shield/image-shield";
import "./hero-shield.css";

/** The approved original image; perspective and background light never repaint its artwork. */
export function HeroShield() {
  return (
    <div className="hero-shield">
      <div className="hero-shield-pose">
        <ImageShield scrollMotion />
      </div>
    </div>
  );
}
