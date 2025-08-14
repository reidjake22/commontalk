// File: src/components/ui/Tile.tsx
// =============================================
import { forwardRef } from "react";

/**
 * Card/Tile primitive to keep elevation, radii, borders and hover effects consistent.
 */
export const Tile = forwardRef<HTMLDivElement, {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  hover?: boolean;
  children: React.ReactNode;
}>(function Tile({ as = "article", className = "", hover = true, children }, ref) {
  const Comp: any = as;
  const base = "relative h-full bg-white border border-gray-200 flex flex-col";
  const motion = hover ? "motion-safe:transition-all motion-safe:duration-200 hover:shadow-lg hover:-translate-y-0.5" : "";
  return (
    <Comp ref={ref} className={`${base} ${motion} ${className}`}>
      {children}
    </Comp>
  );
});