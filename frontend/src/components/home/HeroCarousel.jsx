import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { urlBanner } from "@/utils/home";
import { INTERVALO_SLIDES_MS, SLIDES_HOME } from "./slidesHome";

function SlideHtml({ slide, fotoFalhou, aoFalharImagem, comControles }) {
  const usarFoto = Boolean(slide.imagem) && !fotoFalhou;
  const fotoMobile = usarFoto && urlBanner(slide.imagem.mobile);
  const fotoDesktop = usarFoto && urlBanner(slide.imagem.desktop);

  return (
    <div className={`relative flex h-full min-h-[220px] items-center overflow-hidden bg-gradient-to-br from-pc-verde-900 to-pc-verde-700 px-4 py-5 sm:px-8 md:min-h-[300px] md:py-6 ${comControles ? "pb-16 md:pb-16" : ""}`}>
      {fotoMobile && fotoDesktop && (
        <picture className="pointer-events-none absolute inset-y-0 right-0 w-1/2">
          <source media="(min-width: 768px)" srcSet={fotoDesktop} />
          <img
            src={fotoMobile}
            alt={slide.imagem.alt ?? ""}
            className="h-full w-full object-cover object-left"
            onError={aoFalharImagem}
          />
        </picture>
      )}

      <div className={`relative z-10 ${fotoMobile && fotoDesktop ? "max-w-[62%] md:max-w-[55%]" : "max-w-xl"}`}>
        <span className="inline-block rounded-pc-pill bg-pc-lima/20 px-3 py-1 text-xs font-semibold text-pc-lima">
          {slide.chip}
        </span>
        <h2 className="mt-2 text-xl font-bold leading-tight text-white sm:text-2xl md:text-4xl">
          {slide.titulo} <span className="text-pc-lima">{slide.destaque}</span>
        </h2>
        <p className="mt-2 text-sm text-white/90 md:text-base">{slide.texto}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {slide.acoes.map((acao) => (
            <Link
              key={acao.rotulo}
              to={acao.destino}
              className={`inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-pc-pill px-2 text-sm font-semibold sm:px-5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60 ${
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
 * Banner da home. Acessível: botão de pausa, setas e pontos com rótulo,
 * teclado (← →), pausa com mouse ou foco e sem troca automática quando o
 * sistema pede menos movimento. Slides de imagem só a partir de 768 px e
 * só quando a imagem existe no R2 (VITE_MEDIA_URL definida e sem erro).
 */
export function HeroCarousel() {
  const telaMedia = useMediaQuery("(min-width: 768px)");
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
        return telaMedia && !falhas.has(slide.id) && Boolean(urlBanner(slide.arquivo));
      }),
    [telaMedia, falhas]
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
      className="relative overflow-hidden rounded-pc-card shadow-pc-card"
      onMouseEnter={() => setPausaTemporaria(true)}
      onMouseLeave={() => setPausaTemporaria(false)}
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
      >
        {slide?.tipo === "html" ? (
          <SlideHtml
            slide={slide}
            fotoFalhou={falhas.has(`${slide.id}-foto`)}
            comControles={varios}
            aoFalharImagem={() => registrarFalha(`${slide.id}-foto`)}
          />
        ) : (
          slide && (
            <img
              src={urlBanner(slide.arquivo)}
              alt={slide.alt}
              className="block aspect-[1440/525] w-full object-cover"
              onError={() => registrarFalha(slide.id)}
            />
          )
        )}
      </div>

      {varios && (
        <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => irPara(indice - 1)}
            aria-label="Slide anterior"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          {slides.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => irPara(i)}
              aria-label={`Slide ${i + 1} de ${total}`}
              aria-current={i === indice ? "true" : undefined}
              className="flex h-11 w-6 items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima"
            >
              <span className={`block h-2.5 rounded-full ${i === indice ? "w-5 bg-pc-lima" : "w-2.5 bg-white/80"}`} />
            </button>
          ))}
          <button
            type="button"
            onClick={() => irPara(indice + 1)}
            aria-label="Próximo slide"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
          {!menosMovimento && (
            <button
              type="button"
              onClick={() => setPausadoPeloUsuario((p) => !p)}
              aria-pressed={pausadoPeloUsuario}
              aria-label={pausadoPeloUsuario ? "Continuar a troca automática" : "Pausar a troca automática"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima"
            >
              {pausadoPeloUsuario ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
