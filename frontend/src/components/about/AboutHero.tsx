import React from "react";
import { spacing } from "@/utils/spacing";

interface AboutHeroProps {
  title?: string;
  description?: string;
  paragraphs?: string[];
  stats?: Array<{ value: string; label: string }>;
  /** When false, hides the count stats row (15+, 500+, …). Default true. */
  showStats?: boolean;
  image?: string;
}

const AboutHero: React.FC<AboutHeroProps> = ({
  title = "Building Excellence Through Innovation and Integrity",
  description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  paragraphs,
  stats = [
    { value: "15+", label: "YEARS OF EXCELLENCE" },
    { value: "500+", label: "SATISFIED CLIENTS" },
    { value: "1200+", label: "PROJECTS COMPLETED" },
  ],
  showStats = true,
  image,
}) => {
  const bodyParagraphs = paragraphs?.length ? paragraphs : [description, description, description];
  return (
    <section className={spacing.section.gap}>
      <div className="max-w-[1232px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              {title}
            </h1>
            
            <div className="space-y-4 text-gray-700 text-sm sm:text-base">
              {bodyParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* Statistics */}
            {showStats && stats.length > 0 && (
              <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1" style={{ color: "var(--theme-primary, #8B5E3C)" }}>
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Image */}
          <div className="relative">
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
              {image ? (
                <img
                  src={image}
                  alt="About Us"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm">Upload image in Admin → Assets → Banners → About Us</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
