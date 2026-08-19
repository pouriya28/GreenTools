import type { Product } from "../ProductCard/ProductTypes";

export interface ProductCarouselProps {
  title: string;
  url?: string;
  products: Product[];
}