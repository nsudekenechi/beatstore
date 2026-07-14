interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export default function Skeleton({
  width,
  height,
  borderRadius,
  className = "",
}: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden bg-[#E0E0E0] ${className}`}
      style={{ width, height, borderRadius }}
    >
      <div className="absolute inset-0 animate-shimmer bg-linear-to-r from-[#E0E0E0] via-[#F5F5F5] to-[#E0E0E0]" />
    </div>
  );
}