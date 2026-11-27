import Image from "next/image";

type BrandLogoProps = {
  alt?: string;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  alt = "PrimeHorizon Group Trading PLC",
  className,
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/images/primehorizon-logo.jpg"
      alt={alt}
      width={640}
      height={640}
      priority={priority}
      className={className}
    />
  );
}
