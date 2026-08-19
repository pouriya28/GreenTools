import { FaSearch, FaTimes } from "react-icons/fa";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_LEN = 100;

// امن: مقدار به‌صورت controlled value رندر میشه، JSX خودش escape می‌کنه - بدون dangerouslySetInnerHTML
export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="relative">
      <FaSearch className="absolute top-1/2 -translate-y-1/2 right-3 text-muted text-sm" />
      <input
        type="text"
        value={value}
        maxLength={MAX_LEN}
        onChange={(e) => onChange(e.target.value)}
        placeholder="جستجوی محصول..."
        className="w-full pr-9 pl-9 py-2.5 rounded-xl bg-background border border-border text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary transition"
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="پاک کردن جستجو"
          className="absolute top-1/2 -translate-y-1/2 left-3 text-muted hover:text-error transition">
          <FaTimes className="text-sm" />
        </button>
      )}
    </div>
  );
}