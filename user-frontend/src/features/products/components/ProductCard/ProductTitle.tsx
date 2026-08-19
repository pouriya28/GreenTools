interface ProductTitleProps {
  name: string;
}

export function ProductTitle({ name }: ProductTitleProps) {
  return (
    <h3 className="text-text font-bold text-base leading-relaxed line-clamp-2 min-h-[3rem]">
      {name}
    </h3>
  );
}