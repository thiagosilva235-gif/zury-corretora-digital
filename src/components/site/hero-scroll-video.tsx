import { useEffect, useRef, useState } from "react";
import poster from "@/assets/hero-shield-poster.jpg.asset.json";
import { Velaris } from "@/components/ui/velaris";

/** Trecho final da rolagem em que o texto do hero aparece (0–1 do percurso). */
const REVEAL_START = 0.72;
const REVEAL_END = 0.95;
/** Trecho em que o Velaris cobre o vídeo, um pouco antes do texto. Em BLUR_END o vídeo já está oculto. */
const BLUR_START = 0.6;
const BLUR_END = 0.88;
/**
 * Cadência de public/hero/hero-shield-*-v2.mp4 (111 quadros, todos keyframe, 24 fps). O seek mira o centro de
 * um quadro e só sai quando o quadro muda: nenhuma decodificação é gasta num quadro que já está na tela.
 */
const VIDEO_FPS = 24;
/**
 * Celular recebe 720p (1,8 MB) e desktop 1080p (3,1 MB), ambos só com keyframes: o seek decodifica um quadro.
 * A mesma consulta escolhe o <source> no HTML e o arquivo que a sonda de Range baixa.
 */
const DESKTOP_QUERY = "(min-width: 768px)";
const VIDEO_DESKTOP = "/hero/hero-shield-1080-v2.mp4";
const VIDEO_MOBILE = "/hero/hero-shield-720-v2.mp4";
/** Fração do caminho até o alvo andada a cada quadro de 60 Hz: transforma degraus da roda em deslize. */
const LERP = 0.18;
/** Abaixo disso o playhead já chegou: o laço para e a página fica sem trabalho ocioso. */
const SETTLE = 0.0004;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const band = (value: number, start: number, end: number) =>
  clamp01((value - start) / (end - start));

/** Vídeo de fundo do hero amarrado ao scroll (cada quadro é keyframe); o texto surge perto do fim. */
export function HeroScrollVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  // O Velaris só anima enquanto aparece: com opacidade 0 o laço WebGL forçaria um quadro a cada vsync.
  const [ambientLive, setAmbientLive] = useState(false);
  // No SSR e antes de consultar a preferência, só o pôster: não iniciar um download desnecessário.
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = ref.current;
    const wrap = el?.closest<HTMLElement>(".hero-scroll");
    if (!el || !wrap) return;
    el.classList.remove("is-ready");
    if (reducedMotion !== false) {
      el.pause();
      // Removing the sources alone does not release a previously selected media resource.
      el.removeAttribute("src");
      el.load();
      wrap.style.setProperty("--hero-blur", "0");
      return;
    }
    // iOS só pinta quadros de um vídeo silenciado e "destravado" por play().
    el.muted = true;
    el.defaultMuted = true;
    let disposed = false;
    let frames = 0;
    let wrapTop = 0;
    let range = 0;
    let target = 0;
    let current = -1;
    let shownFrame = -1;
    let shownReveal = "";
    let shownBlur = "";
    let shownLive = false;
    let revealed = false;
    let raf = 0;
    let lastTime = 0;
    let primed = false;
    /** Um seek ficou para trás por falta de quadro decodificado: `canplay` o retoma. */
    let pending = false;
    /** O hero saiu da tela: na volta o quadro é refeito (o navegador pode ter descartado o vídeo). */
    let away = false;
    let blobUrl = "";

    /** Geometria lida só em resize: o scroll usa scrollY e não força layout a cada evento. */
    const measure = () => {
      wrapTop = wrap.getBoundingClientRect().top + window.scrollY;
      // Use the actual sticky height (100svh), not the changing mobile toolbar viewport.
      range = wrap.offsetHeight - (el.parentElement?.offsetHeight ?? window.innerHeight);
    };
    const progress = () => (range > 0 ? clamp01((window.scrollY - wrapTop) / range) : 1);

    const paint = (p: number) => {
      const reveal = band(p, REVEAL_START, REVEAL_END).toFixed(3);
      const blur = band(p, BLUR_START, BLUR_END).toFixed(3);
      if (reveal !== shownReveal) {
        shownReveal = reveal;
        wrap.style.setProperty("--hero-reveal", reveal);
        const next = Number(reveal) > 0.5;
        if (next !== revealed) {
          revealed = next;
          wrap.classList.toggle("is-revealed", next);
        }
      }
      if (blur !== shownBlur) {
        shownBlur = blur;
        wrap.style.setProperty("--hero-blur", blur);
        const live = Number(blur) > 0;
        if (live !== shownLive) {
          shownLive = live;
          setAmbientLive(live);
        }
      }
    };

    /**
     * Um seek por vez: enquanto o decodificador resolve o anterior, o alvo só é guardado.
     * Sem quadro decodificado (readyState < 2) não há seek: no iOS, buscar antes do play() some
     * com o pôster e deixa a tela preta. O alvo fica pendente até os dados voltarem.
     * O arquivo termina no quadro aprovado (~4,58 s); a rolagem maior desacelera sem reduzir os 24 fps.
     */
    const seek = (progress: number) => {
      const p = clamp01(progress);
      if (disposed || !frames || el.seeking || el.error) return;
      if (el.readyState < 2) {
        pending = true;
        return;
      }
      pending = false;
      const frame = Math.round(p * (frames - 1));
      if (frame === shownFrame) return;
      shownFrame = frame;
      el.currentTime = Math.min((frame + 0.5) / VIDEO_FPS, el.duration - 0.001);
    };

    const tick = (now: number) => {
      raf = 0;
      if (current < 0) {
        current = target;
      } else {
        const elapsed = lastTime ? Math.min(now - lastTime, 100) : 1000 / 60;
        current += (target - current) * (1 - Math.pow(1 - LERP, elapsed / (1000 / 60)));
        if (Math.abs(target - current) < SETTLE) current = target;
      }
      lastTime = now;
      paint(current);
      seek(current);
      if (current !== target) raf = requestAnimationFrame(tick);
      else lastTime = 0;
    };
    const schedule = () => {
      if (!raf && !disposed && !document.hidden && !away) raf = requestAnimationFrame(tick);
    };
    /** O quadro na tela deixou de ser confiável (dados novos, play/pause): busca o alvo de novo. */
    const resync = () => {
      shownFrame = -1;
      seek(current < 0 ? target : current);
      schedule();
    };

    const onScroll = () => {
      const next = progress();
      // Depois do hero o alvo fica preso em 1: o restante da página rola sem acordar o laço.
      if (next === target && current === target) return;
      target = next;
      schedule();
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    /** O seek terminou: se o alvo andou enquanto isso, o quadro mais recente sai agora. */
    const onSeeked = () => {
      if (disposed) return;
      if (el.readyState >= 2 && !el.error) el.classList.add("is-ready");
      if (current < 0) return;
      if (Math.round(clamp01(current) * (frames - 1)) !== shownFrame) {
        seek(current);
        schedule();
      }
    };
    /** Os dados voltaram (rede, decodificador religado): o seek que ficou pendente sai agora. */
    const onCanPlay = () => {
      if (pending) resync();
    };

    // Mesmo destravamento do original: play() no primeiro gesto, pausa e volta ao quadro do scroll.
    const prime = () => {
      if (primed) return;
      primed = true;
      el.play()
        .then(() => {
          if (disposed) return;
          el.pause();
          removeGestures();
          resync();
        })
        .catch(() => {
          if (disposed) return;
          // Modo de pouca energia etc.: tenta de novo no próximo toque.
          primed = false;
        });
    };
    const addGestures = () => {
      window.addEventListener("touchstart", prime, { passive: true });
      window.addEventListener("pointerdown", prime);
    };
    const removeGestures = () => {
      window.removeEventListener("touchstart", prime);
      window.removeEventListener("pointerdown", prime);
    };

    /**
     * Volta do hero à tela, da aba ao primeiro plano ou da página ao bfcache. Celulares descartam
     * o decodificador (e até os dados) de um vídeo pausado fora da vista; sem nada que o acorde,
     * o seek desiste em readyState < 2 e o hero fica preto ou congelado.
     */
    const revive = () => {
      if (disposed || document.hidden) return;
      measure();
      target = progress();
      current = target;
      lastTime = 0;
      if (
        el.error ||
        el.networkState === el.NETWORK_EMPTY ||
        el.networkState === el.NETWORK_NO_SOURCE
      ) {
        // A mídia caiu (erro de rede, descarte): recarrega; loadedmetadata/loadeddata refazem o quadro.
        el.classList.remove("is-ready");
        el.load();
      } else if (el.readyState >= 2 || el.seeking) {
        // Ainda há quadro: busca o atual de novo para repintar o que o decodificador soltou.
        resync();
        return;
      }
      // Sem dados decodificados: o iOS só volta a decodificar depois de um novo play().
      el.classList.remove("is-ready");
      primed = false;
      addGestures();
      prime();
      resync();
    };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
        lastTime = 0;
        el.pause();
      } else if (!away) revive();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      measure();
      target = progress();
      revive();
    };
    const viewObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          away = true;
          cancelAnimationFrame(raf);
          raf = 0;
          lastTime = 0;
        } else if (away) {
          away = false;
          revive();
        }
      }
    });

    const onMeta = () => {
      if (!Number.isFinite(el.duration) || el.duration <= 0) return;
      frames = Math.max(1, Math.round(el.duration * VIDEO_FPS));
      resync();
    };
    const onLoadedData = () => {
      // Reveal only after the scroll frame has decoded, including a restored mid-page position.
      resync();
    };
    const onError = () => {
      el.classList.remove("is-ready");
      el.pause();
      shownFrame = -1;
      pending = true;
    };
    measure();
    target = progress();
    if (el.readyState >= 1) onMeta();
    if (el.readyState >= 2) onLoadedData();
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("loadeddata", onLoadedData);
    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("seeked", onSeeked);
    el.addEventListener("error", onError);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // Mede de novo quando a altura do wrapper muda (CSS tardio, troca de fonte, rotação).
    const sizeObserver = new ResizeObserver(onResize);
    sizeObserver.observe(wrap);
    if (el.parentElement) sizeObserver.observe(el.parentElement);
    viewObserver.observe(wrap);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    addGestures();
    window.addEventListener("scroll", prime, { passive: true, once: true });
    schedule();

    // Servidores sem requisições parciais (Range) — a prévia local do Wrangler, o Node puro de uma VPS —
    // não deixam o navegador buscar quadros por partes, e o seek pode travar no primeiro quadro. Nesses
    // casos o arquivo, que já veio inteiro nesta resposta, vira Blob e o seek passa a ser local.
    // CDNs (Lovable, Vercel, Netlify, Cloudflare) respondem 206 e nada muda. "no-store" é obrigatório:
    // com o vídeo já em cache, o próprio navegador responderia 206 e esconderia o servidor.
    const rangeProbe = new AbortController();
    const videoUrl = matchMedia(DESKTOP_QUERY).matches ? VIDEO_DESKTOP : VIDEO_MOBILE;
    void fetch(videoUrl, {
      headers: { Range: "bytes=0-0" },
      cache: "no-store",
      signal: rangeProbe.signal,
    })
      .then(async (response) => {
        if (response.status !== 200) {
          rangeProbe.abort();
          return;
        }
        const blob = await response.blob();
        if (disposed) return;
        blobUrl = URL.createObjectURL(blob);
        el.classList.remove("is-ready");
        el.src = blobUrl;
        // Fonte nova: o destravamento por gesto (iOS) vale de novo para ela.
        primed = false;
        addGestures();
      })
      .catch(() => {});
    return () => {
      disposed = true;
      rangeProbe.abort();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      cancelAnimationFrame(raf);
      el.pause();
      el.classList.remove("is-ready");
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("loadeddata", onLoadedData);
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("seeked", onSeeked);
      el.removeEventListener("error", onError);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      sizeObserver.disconnect();
      viewObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      removeGestures();
      window.removeEventListener("scroll", prime);
    };
  }, [reducedMotion]);

  return (
    <div className="hero-video-layer" aria-hidden="true">
      <div className="hero-video-sticky" style={{ backgroundImage: `url("${poster.url}")` }}>
        <video
          ref={ref}
          className="hero-video"
          poster={poster.url}
          muted
          playsInline
          preload={reducedMotion === false ? "auto" : "none"}
          aria-hidden="true"
          tabIndex={-1}
        >
          {reducedMotion === false && (
            <source src={VIDEO_DESKTOP} type="video/mp4" media={DESKTOP_QUERY} />
          )}
          {reducedMotion === false && <source src={VIDEO_MOBILE} type="video/mp4" />}
        </video>
        <div className="hero-velaris" aria-hidden="true">
          {reducedMotion === false && (
            <Velaris
              focusX={0.5}
              focusY={0.5}
              bg="#08090b"
              colors={["#262d32", "#56606a", "#121518", "#a3adb3"]}
              speed={0.9}
              grain={0.35}
              paused={!ambientLive}
            />
          )}
        </div>
        <div className="hero-video-blur" aria-hidden="true" />
      </div>
    </div>
  );
}
