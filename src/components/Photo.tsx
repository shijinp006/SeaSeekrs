import Image from "next/image";

/** Image block that unmasks and settles from a zoom as it scrolls in (see data-img in MotionRoot). */
export default function Photo({
  src,
  alt,
  className = "",
  sizes = "(min-width: 768px) 50vw, 100vw",
  reveal = true,
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  reveal?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div {...(reveal ? { "data-img": "" } : {})} className={`group relative overflow-hidden bg-paper-2 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover transition-[filter] duration-700 group-hover:brightness-110"
      />
      {children}
    </div>
  );
}
