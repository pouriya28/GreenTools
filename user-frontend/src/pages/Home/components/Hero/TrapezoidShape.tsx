// src/pages/Home/components/Hero/TrapezoidShape.tsx
interface TrapezoidShapeProps {
  title: string;
  summary: string;
  active?: boolean;
  index: number;
}

export function TrapezoidShape({
  title,
  summary,
  active = false,
  index,
}: TrapezoidShapeProps) {
  const POLYGON_CLIP = "polygon(8% 0%, 100% 0%, 100% 80%, 92% 100%, 0% 100%, 0% 20%)";
  const SVG_POINTS = "8,0 100,0 100,80 92,100 0,100 0,20";

  return (
    <div className={`shape-${index} relative group select-none`}>
      <svg
        className="absolute -inset-[1px] w-[calc(100%+2px)] h-[calc(100%+2px)] pointer-events-none z-20 overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`laser-grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
            <stop offset="50%" stopColor="#4ade80" stopOpacity="1" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>

        <polygon
          points={SVG_POINTS}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="0.55"
          className="opacity-65"
        />

        <polygon
          points={SVG_POINTS}
          fill="none"
          stroke={`url(#laser-grad-${index})`}
          strokeWidth="1.25"
          strokeDasharray="20 170"
          className="animate-[laser_3.5s_linear_infinite]"
          style={{ filter: "drop-shadow(0 0 6px #22c55e) drop-shadow(0 0 12px #22c55e)" }}
        />
      </svg>

      <div
        className={`
          relative 
          aspect-[16/9]
          bg-surface/90 backdrop-blur-2xl
          flex flex-col justify-center items-center 
          transition-all duration-500 z-10
          ${
            active
              ? "w-[420px] lg:w-[520px] xl:w-[600px] p-8 lg:p-10 opacity-100 scale-100 shadow-2xl" // سایز جدید کارت بزرگ
              : "w-[280px] lg:w-[350px] xl:w-[400px] p-6 lg:p-7 opacity-60 scale-95 hover:opacity-90" // سایز جدید کارت‌های کوچک
          }
        `}
        style={{ clipPath: POLYGON_CLIP }}
      >
        <div className="text-center space-y-2 lg:space-y-3 max-w-[85%]">
          <h3 
            className={`text-primary font-black tracking-wider neon-text ${
              active ? "text-2xl lg:text-3xl xl:text-4xl" : "text-lg lg:text-xl"
            }`}
          >
            {title}
          </h3>
          <p 
            className={`text-text-secondary leading-relaxed line-clamp-3 font-medium ${
              active ? "text-base lg:text-lg" : "text-xs lg:text-sm"
            }`}
          >
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}