import type { ComponentType } from "react";

interface ErrorViewProps {
  title: string;
  description?: string;
  icon?: ComponentType;
  retry?: () => void;
}

export function ErrorView({ title, description, icon: Icon, retry }: ErrorViewProps) {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center gap-4 text-center p-8">
      {Icon && <span className="text-5xl text-muted"><Icon /></span>}
      <h2 className="text-lg font-bold text-text">{title}</h2>
      {description && <p className="text-sm text-text-secondary max-w-sm">{description}</p>}
      {retry && (
        <button
          onClick={retry}
          className="px-5 py-2 rounded-full bg-primary text-white text-sm font-bold hover:scale-105 transition"
        >
          تلاش مجدد
        </button>
      )}
    </div>
  );
}