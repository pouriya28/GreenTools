// src/components/layout/Header/Logo.tsx
export function Logo() {
  return (
    <div className="flex items-center gap-2 cursor-pointer group">
      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/40 flex items-center justify-center text-primary font-black shadow-[0_0_15px_rgba(34,197,94,0.3)] group-hover:scale-105 transition-all">
        GT
      </div>
      <div className="flex flex-col">
        <span className="text-white font-black tracking-wider text-base">
          Green<span className="text-primary neon-text">Tools</span>
        </span>
        <span className="text-[10px] text-text-secondary hidden sm:inline-block">
          فروشگاه تخصصی ابزار
        </span>
      </div>
    </div>
  );
}