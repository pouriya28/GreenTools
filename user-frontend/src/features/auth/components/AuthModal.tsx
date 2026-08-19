import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { OtpLoginForm } from "./OtpLoginForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-surface/95 backdrop-blur-2xl border border-primary/20 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 animate-[scaleUp_0.2s_ease-out]">
        <button
          onClick={onClose}
          type="button"
          className="absolute left-4 top-4 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
        >
          <FiX className="text-lg" />
        </button>
        <div className="mt-2">
          {/* onSuccess باعث بسته شدن خودکار مودال بعد از verify موفق می‌شه */}
          <OtpLoginForm onSuccess={onClose} />
        </div>
      </div>
    </div>,
    document.body
  );
}