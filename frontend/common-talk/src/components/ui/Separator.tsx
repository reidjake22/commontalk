// File: src/components/ui/Separator.tsx
// =============================================
export function Separator({ className = "" }: { className?: string }) {
  return <div className={`w-px h-4 bg-gray-300 ${className}`} />;
}
