import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { urlBanner } from "@/utils/home";
import { INTERVALO_SLIDES_MS, SLIDES_HOME } from "./slidesHome";

const CONTROLE =
  "flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700 focus-visible:ring-offset-2";
const DISTANCIA_MINIMA_SWIPE = 40;

function SlideHtml({ slide, fotoFalhou, aoFalharImagem }) {
  // A foto só aparece do tablet para cima: no celular o texto e os dois botões ocupam a largura toda.
  const foto = Boolean(slide.imagem) && !fotoFalhou ? urlBanner(slide.imagem.desktop) : null;

  return (
    <div className="relative flex h-full items-center overflow-hidden bg-gradient-to-br from-pc-verde-900 to-pc-verde-700 px-4 pb-8 pt-4 sm:px-8 md:py-4">
      {foto && (
        <img
          src={foto}
          alt={slide.imagem.alt ?? ""}
          loading="lazy"
          decoding="async"
          onError={aoFalharImagem}
          className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover object-left [mask-image:linear-gradient(to_right,transparent,#000_35%)] md:block"
        />
      )}

      <div className={`relative z-10 max-w-xl ${foto ? "md:max-w-[62%]" : ""}`}>
        <span className="inline-block rounded-pc-pill bg-pc-lima/20 px-3 py-1 text-xs font-semibold text-pc-lima">{slide.chip}</span>
        <h2 className="mt-2 text-lg font-bold leading-tight text-white min-[360px]:text-xl sm:text-2xl lg:text-3xl xl:text-xl min-[1440px]:text-3xl">
          {slide.titulo} <span className="text-pc-lima">{slide.destaque}</span>
        </h2>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-white/90 min-[360px]:text-sm">{slide.texto}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {slide.acoes.map((acao) => (
            <Link
              key={acao.rotulo}
              to={acao.destino}
              className={`inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-pc-pill px-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60 sm:px-5 ${
                acao.principal ? "bg-pc-lima text-pc-verde-900" : "bg-white text-pc-verde-900"
              }`}
            >
              {acao.rotulo}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Banner da home. Acessível: botão de pausa, pontos com rótulo, setas (a partir de
 * 768 px), teclado (← →), deslizar com o dedo, pausa com mouse ou foco e sem troca
 * automática quando o sistema pede menos movimento. Todos os slides têm a mesma
 * altura (244 px no celular, 260 px de 640 a 767 px e proporção 1440:525 a partir de 768 px), para o conteúdo abaixo
 * não pular a cada troca. Slides de imagem só aparecem quando a imagem existe no R2
 * (VITE_MEDIA_URL definida e sem erro).
 */
export function HeroCarousel() {
  const menosMovimento = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [falhas, setFalhas] = useState(() => new Set());
  const [atual, setAtual] = useState(0);
  const [pausadoPeloUsuario, setPausadoPeloUsuario] = useState(false);
  const [pausaTemporaria, setPausaTemporaria] = useState(false);

  const registrarFalha = useCallback((id) => {
    setFalhas((anteriores) => new Set(anteriores).add(id));
  }, []);

  const slides = useMemo(
    () =>
      SLIDES_HOME.filter((slide) => {
        if (slide.tipo === "html") return true;
        return !falhas.has(slide.id) && Boolean(urlBanner(slide.arquivo.mobile));
      }),
    [falhas]
  );

  const total = slides.length;
  const indice = total ? atual % total : 0;
  const varios = total > 1;
  const passando = varios && !menosMovimento && !pausadoPeloUsuario && !pausaTemporaria;

  const irPara = useCallback((novo) => setAtual(((novo % total) + total) % total), [total]);

  useEffect(() => {
    if (!passando) return undefined;
    const id = setInterval(() => setAtual((a) => (a + 1) % total), INTERVALO_SLIDES_MS);
    return () => clearInterval(id);
  }, [passando, total]);

  const toqueInicio = useRef(null);
  function aoTocar(evento) {
    toqueInicio.current = evento.touches[0]?.clientX ?? null;
  }
  function aoSoltar(evento) {
    const inicio = toqueInicio.current;
    toqueInicio.current = null;
    if (!varios || inicio === null) return;
    const distancia = inicio - (evento.changedTouches[0]?.clientX ?? inicio);
    if (Math.abs(distancia) >= DISTANCIA_MINIMA_SWIPE) irPara(indice + (distancia > 0 ? 1 : -1));
  }

  function aoTeclar(evento) {
    if (!varios) return;
    if (evento.key === "ArrowRight") irPara(indice + 1);
    if (evento.key === "ArrowLeft") irPara(indice - 1);
  }

  const slide = slides[indice];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Destaques do PetCare Connect"
      className="relative overflow-hidden rounded-pc-card bg-white shadow-pc-card"
      onPointerEnter={(e) => e.pointerType === "mouse" && setPausaTemporaria(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setPausaTemporaria(false)}
      onFocus={() => setPausaTemporaria(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPausaTemporaria(false);
      }}
      onKeyDown={aoTeclar}
    >
      <div
        role="group"
        aria-roledescription="slide"
        aria-label={`${indice + 1} de ${total}`}
        aria-live={passando ? "off" : "polite"}
        className="h-[244px] sm:h-[260px] md:h-auto md:aspect-[1440/525]"
        style={{ touchAction: "pan-y" }}
        onTouchStart={aoTocar}
        onTouchEnd={aoSoltar}
      >
        {slide?.tipo === "html" ? (
          <SlideHtml slide={slide} fotoFalhou={falhas.has(`${slide.id}-foto`)} aoFalharImagem={() => registrarFalha(`${slide.id}-foto`)} />
        ) : (
          slide && (
            <picture>
              <source media="(min-width: 640px)" srcSet={urlBanner(slide.arquivo.desktop)} />
              <img
                src={urlBanner(slide.arquivo.mobile)}
                alt={slide.alt}
                draggable={false}
                className="block h-full w-full select-none object-cover"
                onError={() => registrarFalha(slide.id)}
              />
            </picture>
          )
        )}
      </div>

      {varios && (
        <div className="absolute inset-x-0 bottom-1.5 z-20 flex justify-center md:static md:px-2 md:py-1">
          <div className="flex items-center gap-0.5 rounded-full bg-black/25 px-1.5 backdrop-blur-sm md:gap-1 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <button type="button" onClick={() => irPara(indice - 1)} aria-label="Slide anterior" className={`${CONTROLE} hidden text-pc-verde-700 hover:bg-pc-fundo md:flex`}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          {slides.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => irPara(i)}
              aria-label={`Slide ${i + 1} de ${total}`}
              aria-current={i === indice ? "true" : undefined}
              className="flex h-6 min-w-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:h-11 md:focus-visible:ring-pc-verde-700"
            >
              <span
                className={`block h-2 rounded-full md:h-2.5 ${
                  i === indice ? "w-4 bg-pc-lima md:w-5 md:bg-pc-verde-700" : "w-2 bg-white/80 md:w-2.5 md:bg-pc-texto-suave/40"
                }`}
              />
            </button>
          ))}
          <button type="button" onClick={() => irPara(indice + 1)} aria-label="Próximo slide" className={`${CONTROLE} hidden text-pc-verde-700 hover:bg-pc-fundo md:flex`}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
          {!menosMovimento && (
            <button
              type="button"
              onClick={() => setPausadoPeloUsuario((p) => !p)}
              aria-pressed={pausadoPeloUsuario}
              aria-label={pausadoPeloUsuario ? "Continuar a troca automática" : "Pausar a troca automática"}
              className="flex h-6 w-6 items-center justify-center rounded-full text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:h-11 md:w-11 md:text-pc-verde-700 md:hover:bg-pc-fundo md:focus-visible:ring-pc-verde-700 md:focus-visible:ring-offset-2"
            >
              {pausadoPeloUsuario ? <Play size={14} aria-hidden="true" className="md:h-[18px] md:w-[18px]" /> : <Pause size={14} aria-hidden="true" className="md:h-[18px] md:w-[18px]" />}
            </button>
          )}
          </div>
        </div>
      )}
    </section>
  );
}
