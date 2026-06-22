import { useState } from "react";

type Props = {
  src: string;
  alt?: string;
  className?: string;
};

/**
 * Image that degrades gracefully: if the photo fails to load we keep a
 * tasteful warm gradient so the layout never breaks.
 */
export function SmartImage({ src, alt = "", className = "" }: Props) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`relative overflow-hidden bg-[linear-gradient(135deg,#dbba95_0%,#d0bce1_100%)] ${className}`}
    >
      {!failed && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
