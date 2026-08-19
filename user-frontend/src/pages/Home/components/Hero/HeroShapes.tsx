// src/pages/Home/components/Hero/HeroShapes.tsx
import { forwardRef } from "react";
import { TrapezoidShape } from "./TrapezoidShape";
import type { HomeSection } from "../../data/homeContent";

interface HeroShapesProps {
  sections: HomeSection[];
  activeIndex: number;
}

const SHAPE_POSITIONS = [
  // کارت اصلی (بزرگ)
  { top: "15%", left: "45%", zIndex: 30 }, 
  
  // کارت دوم (کوچک): پایین راست
  { top: "55%", left: "75%", zIndex: 25 }, 
  
  // کارت سوم (کوچک): پایین چپ
  { top: "70%", left: "24%", zIndex: 10 }, 
];

export const HeroShapes = forwardRef<HTMLDivElement, HeroShapesProps>(
  ({ sections, activeIndex }, ref) => {
    const getSection = (offset: number) => {
      const index = (activeIndex + offset) % sections.length;
      return sections[index];
    };

    return (
      <div className="hidden md:flex relative w-full h-[750px] lg:h-[900px] items-center justify-center">
        {/* کانتینر چرخشی بزرگ‌تر برای جا دادن کارت‌های بزرگ‌تر */}
        <div
          ref={ref}
          className="relative w-[650px] lg:w-[800px] xl:w-[900px] h-[700px] lg:h-[850px]"
        >
          {/* --- دایره‌های نئونی بزرگ‌تر تو در تو --- */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
            {/* دایره بیرونی */}
            <div className="absolute w-[500px] h-[500px] lg:w-[620px] lg:h-[620px] rounded-full border border-[#22c55e]/30 shadow-[0_0_60px_rgba(34,197,94,0.18)] animate-[spin_15s_linear_infinite] border-dashed" />
            
            {/* دایره میانی */}
            <div className="absolute w-[360px] h-[360px] lg:w-[450px] lg:h-[450px] rounded-full border-2 border-[#22c55e]/50 shadow-[0_0_45px_rgba(34,197,94,0.35)] animate-[spin_10s_linear_infinite_reverse] border-dotted" />
            
            {/* دایره داخلی */}
            <div className="absolute w-[220px] h-[220px] lg:w-[280px] lg:h-[280px] rounded-full border-2 border-[#4ade80] shadow-[0_0_35px_rgba(74,222,128,0.55)] opacity-80" />
            
            {/* هاله نوری مرکزی */}
            <div className="absolute w-[160px] h-[160px] rounded-full bg-[#4ade80]/20 blur-3xl" />
          </div>
          {/* --------------------------------------------------- */}

          {SHAPE_POSITIONS.map((pos, i) => {
            const section = getSection(i);
            const isActive = i === 0;

            return (
              <div
                key={`${section.id}-${i}`}
                className="absolute transition-all duration-500"
                style={{
                  top: pos.top,
                  left: pos.left,
                  transform: "translate(-50%, -50%)",
                  zIndex: pos.zIndex,
                }}
              >
                <div className="shape-wrapper origin-center w-full h-full">
                  <TrapezoidShape
                    index={i}
                    title={section.title}
                    summary={section.summary}
                    active={isActive}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

HeroShapes.displayName = "HeroShapes";