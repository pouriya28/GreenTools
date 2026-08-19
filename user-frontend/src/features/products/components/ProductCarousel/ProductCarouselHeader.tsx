import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

interface ProductCarouselHeaderProps {
  title: string;
  url?: string;
}

export function ProductCarouselHeader({ title, url }: ProductCarouselHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 px-2 md:px-0">
      <h2 className="text-xl md:text-2xl font-black text-text flex items-center gap-3">
        <span className="w-1.5 h-7 rounded-full bg-primary"></span>
        {title}
      </h2>
      
      {url && (
        <Link 
          to={url} 
          className="group flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors"
        >
          مشاهده همه
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}