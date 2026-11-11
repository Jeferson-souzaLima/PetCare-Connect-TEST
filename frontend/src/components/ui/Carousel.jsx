import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/*
 * Carrossel de banners da home do lojista (arquivos em public/banners/ban_loj*.jpg).
 * A home do cliente usa o HeroCarousel, em components/home.
 */
const BANNERS = [
  {
    id: 1,
    image: "/banners/ban_loj1.jpg",
    alt: "Novidades para lojistas",
  },
  {
    id: 2,
    image: "/banners/ban_loj2.jpg",
    alt: "Recursos do PetCare Connect para lojistas",
  },
  {
    id: 3,
    image: "/banners/ban_loj3.jpg",
    alt: "Novidades da plataforma",
  },
  {
    id: 4,
    image: "/banners/ban_loj4.jpg",
    alt: "PetCare Connect para lojistas",
  },
];

const AUTO_PLAY_TIME = 4000;
const MIN_SWIPE_DISTANCE = 50;

export function Carousel() {
  const banners = BANNERS;

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) =>
      prev === 0 ? banners.length - 1 : prev - 1
    );
  }, [banners.length]);

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      nextSlide();
    }, AUTO_PLAY_TIME);

    return () => clearInterval(interval);
  }, [paused, nextSlide]);

  function handleTouchStart(e) {
    setPaused(true);
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }

  function handleTouchMove(e) {
    setTouchEnd(e.targetTouches[0].clientX);
  }

  function handleTouchEnd() {
    if (touchStart === null || touchEnd === null) {
      setPaused(false);
      return;
    }

    const distance = touchStart - touchEnd;

    if (distance > MIN_SWIPE_DISTANCE) {
      nextSlide();
    }

    if (distance < -MIN_SWIPE_DISTANCE) {
      prevSlide();
    }

    setPaused(false);
    setTouchStart(null);
    setTouchEnd(null);
  }

  return (
    <section className="mt-6 px-4">
      <div
        className="
          relative
          mx-auto
          max-w-7xl
          overflow-hidden
          rounded-3xl
          shadow-xl
          group
        "
        style={{ touchAction: "pan-y" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides */}

        <div
          className="
            flex
            transition-transform
            duration-500
            ease-in-out
          "
          style={{
            transform: `translateX(-${current * 100}%)`,
          }}
        >
          {banners.map((banner) => (
            <img
              key={banner.id}
              src={banner.image}
              alt={banner.alt}
              draggable={false}
              className="
                w-full
                flex-shrink-0
                object-cover
                aspect-[16/6]

                select-none
                pointer-events-none

                transition-transform
                duration-200
                active:scale-[0.99]
              "
            />
          ))}
        </div>

        {/* Botão anterior */}

        <button
          onClick={prevSlide}
          aria-label="Banner anterior"
          className="
            hidden
            md:flex

            absolute
            left-4
            top-1/2
            -translate-y-1/2

            items-center
            justify-center

            w-11
            h-11

            rounded-full
            bg-white/90
            shadow-lg

            opacity-0
            group-hover:opacity-100

            transition-all
            duration-300

            hover:scale-110
            hover:bg-white
          "
        >
          <ChevronLeft className="w-6 h-6 text-[#0E5617]" />
        </button>

        {/* Próximo */}

        <button
          onClick={nextSlide}
          aria-label="Próximo banner"
          className="
            hidden
            md:flex

            absolute
            right-4
            top-1/2
            -translate-y-1/2

            items-center
            justify-center

            w-11
            h-11

            rounded-full
            bg-white/90
            shadow-lg

            opacity-0
            group-hover:opacity-100

            transition-all
            duration-300

            hover:scale-110
            hover:bg-white
          "
        >
          <ChevronRight className="w-6 h-6 text-[#0E5617]" />
        </button>

        {/* Indicadores */}

        <div
          className="
            absolute
            bottom-4
            left-1/2
            -translate-x-1/2

            flex
            items-center
            gap-2
          "
        >
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              onClick={() => setCurrent(index)}
              aria-label={`Ir para banner ${index + 1}`}
              className={`
                rounded-full
                transition-all
                duration-300

                ${
                  current === index
                    ? "w-8 h-2 bg-white"
                    : "w-2 h-2 bg-white/60 hover:bg-white"
                }
              `}
            />
          ))}
        </div>
      </div>
    </section>
  );
}