/** Owner-supplied logo supplies both the accessible image and its unmodified silhouette for the silver mask. */
export function OfficialLogo({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={`official-logo ${className}`}>
      <img
        src="/brand/zury-assinatura-enviada.png"
        alt="ZURY CORRETORA"
        width={1046}
        height={324}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
    </span>
  );
}
