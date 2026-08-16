type BrandProps = {
  compact?: boolean;
  variant?: "light" | "dark";
  className?: string;
};

export function Brand({ compact = false, variant = "light", className = "" }: BrandProps) {
  const source = variant === "dark" ? "/brand/rifad-logo-dark.png" : "/brand/rifad-logo-light.png";
  return (
    <div className={`brand ${compact ? "brand--compact" : "brand--full"} ${className}`}>
      <img src={source} alt={compact ? "رمز رفاد" : "رفاد | RIFAD"} draggable="false" />
    </div>
  );
}
