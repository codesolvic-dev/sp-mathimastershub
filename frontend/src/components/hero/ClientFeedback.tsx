import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { spacing } from "@/utils/spacing";

const feedbacks = [
  {
    title: "Urna cursus",
    name: "Esther Howard",
    role: "Customer",
    text: "Urna cursus eget nunc scelerisque viverra mauris in aliquam. Suspendisse.",
    img: "/client.jpeg",
  },
  {
    title: "Pulvinar etiam",
    name: "Eleanor Pena",
    role: "Customer",
    text: "Pulvinar etiam non quam lacus. Pellentesque dignissim enim sit amet.",
    img: "/client.jpeg",
  },
  {
    title: "Feugiat vivamus",
    name: "Annette Black",
    role: "Customer",
    text: "Feugiat vivamus at augue eget arcu dictum varius. At in tellus integer.",
    img: "/client.jpeg",
  },
  {
    title: "Lorem ipsum",
    name: "John Doe",
    role: "Customer",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    img: "/client.jpeg",
  },
  {
    title: "Phasellus non",
    name: "Jane Smith",
    role: "Customer",
    text: "Phasellus non purus eget sapien ullamcorper facilisis.",
    img: "/client.jpeg",
  },
];

const ClientFeedback: React.FC = () => {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const cards = carousel.querySelectorAll<HTMLDivElement>("[data-card]");
    if (cards.length === 0) return;

    const carouselRect = carousel.getBoundingClientRect();
    const carouselCenter = carouselRect.left + carouselRect.width / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(cardCenter - carouselCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);

    const overflow = carousel.scrollWidth > carousel.clientWidth + 2;
    setCanScrollLeft(overflow && carousel.scrollLeft > 4);
    setCanScrollRight(
      overflow && carousel.scrollLeft + carousel.clientWidth < carousel.scrollWidth - 4
    );
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const card = carousel.querySelector<HTMLElement>(`[data-card-index="${index}"]`);
    if (!card) return;

    const maxScroll = Math.max(0, carousel.scrollWidth - carousel.clientWidth);
    let targetLeft: number;

    if (index === 0) {
      targetLeft = 0;
    } else if (index === feedbacks.length - 1) {
      targetLeft = maxScroll;
    } else {
      targetLeft = card.offsetLeft - (carousel.clientWidth - card.clientWidth) / 2;
      targetLeft = Math.min(maxScroll, Math.max(0, targetLeft));
    }

    setActiveIndex(index);
    carousel.scrollTo({
      left: targetLeft,
      behavior: "smooth",
    });

    window.setTimeout(updateScrollState, 350);
  }, [updateScrollState]);

  const scroll = (direction: "left" | "right") => {
    const next =
      direction === "left"
        ? Math.max(0, activeIndex - 1)
        : Math.min(feedbacks.length - 1, activeIndex + 1);
    scrollToIndex(next);
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const timer = setTimeout(updateScrollState, 50);
    carousel.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      clearTimeout(timer);
      carousel.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const arrowBtnClass = (enabled: boolean) =>
    `shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-md transition-opacity pointer-events-auto z-40 ${
      enabled ? "hover:bg-gray-100" : "opacity-35 cursor-default"
    }`;

  return (
    <section className="relative overflow-hidden py-0 bg-gradient-to-r from-[#f9ede6] to-[#fef9f7]">
      <div className="pointer-events-none absolute top-8 right-6 w-40 h-40 rounded-full bg-[#f4cdbf] opacity-30 blur-[1px]" />
      <div className="pointer-events-none absolute left-6 bottom-6 w-36 h-36 rounded-full bg-[#f4cdbf] opacity-20 blur-[1px]" />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className={`text-center text-3xl italic text-gray-700 font-serif ${spacing.inner.gapTop} ${spacing.inner.gapBottom}`}>
          Client Feedback
        </h2>

        <div className={`flex items-center justify-center gap-2 ${spacing.inner.gapBottom}`}>
          {feedbacks.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollToIndex(index)}
              className="p-1.5 rounded-full pointer-events-auto z-40"
              aria-label={`Go to feedback ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex ? "w-8" : "w-2"
                }`}
                style={{
                  backgroundColor: "var(--theme-primary, #8B5E3C)",
                  opacity: index === activeIndex ? "1" : "0.3",
                }}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pb-4">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => canScrollLeft && scroll("left")}
            disabled={!canScrollLeft}
            className={arrowBtnClass(canScrollLeft)}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div
            ref={carouselRef}
            className="min-w-0 flex-1 flex gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 no-scrollbar"
            style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {feedbacks.map((item, i) => (
              <article
                data-card
                data-card-index={i}
                key={i}
                className="bg-white rounded-md shadow-md min-w-[280px] sm:min-w-[360px] md:min-w-[380px] flex-shrink-0 snap-center p-6 flex flex-col"
                role="group"
              >
                <div className="mb-4">
                  <span
                    className="text-3xl font-serif mr-2"
                    style={{ color: "var(--theme-primary)" }}
                  >
                    "
                  </span>
                  <h3 className="text-lg font-semibold text-gray-800 inline-block align-middle">
                    {item.title}
                  </h3>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-6">{item.text}</p>

                <div className="mt-auto bg-gray-50 border-t border-gray-100 pt-3 -mx-6 px-6 pb-3 flex items-center gap-3">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {item.name}{" "}
                      <span className="font-normal" style={{ color: "var(--theme-primary)" }}>
                        /
                      </span>{" "}
                      <span className="text-xs font-medium" style={{ color: "var(--theme-primary)" }}>
                        {item.role}
                      </span>
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => canScrollRight && scroll("right")}
            disabled={!canScrollRight}
            className={arrowBtnClass(canScrollRight)}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ClientFeedback;
