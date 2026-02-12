import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import carousel1 from "@/assets/carousel-1.jpg";
import carousel2 from "@/assets/carousel-2.jpg";
import carousel3 from "@/assets/carousel-3.jpg";

const slides = [
  {
    image: carousel1,
    tag: "Breaking News",
    title: "Historic Landing: Probe Touches Down on Europa",
    subtitle: "NASA confirms successful contact with the icy moon's surface.",
  },
  {
    image: carousel2,
    tag: "Technology",
    title: "Global Summit Announces New AI Regulations",
    subtitle: "Leaders from 50 nations agree on safety protocols for 2026.",
  },
  {
    image: carousel3,
    tag: "Environment",
    title: "Ocean Cleanup Project Reaches Milestone",
    subtitle: "Over 100 tons of plastic removed from the Pacific patch this month.",
  },
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative mx-auto w-full max-w-[1200px] overflow-hidden rounded-xl shadow-lg md:my-5">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="relative min-w-full">
            <img
              src={slide.image}
              alt={slide.title}
              className="h-[300px] w-full object-cover md:h-[500px]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 md:p-10">
              <span className="mb-2 inline-block rounded bg-accent px-2.5 py-1 text-xs font-bold uppercase text-accent-foreground">
                {slide.tag}
              </span>
              <h1 className="mb-2 font-serif text-2xl leading-tight text-primary-foreground md:text-4xl">
                {slide.title}
              </h1>
              <p className="text-sm text-primary-foreground/80 md:text-base">{slide.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-card/60 p-2 text-foreground backdrop-blur transition hover:bg-card/80"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-card/60 p-2 text-foreground backdrop-blur transition hover:bg-card/80"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current ? "w-6 bg-accent" : "w-2 bg-primary-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
