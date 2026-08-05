import { Church } from "lucide-react";
import { useState } from "react";

export function ChurchThumbnail({ src, name, className = "h-11 w-11" }: { src?: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src?.trim() || failed) {
    return (
      <span className={`grid flex-none place-items-center rounded-2xl bg-amber-50 text-amber-800 ${className}`} aria-label={`Sem imagem de ${name}`}>
        <Church size={18} />
      </span>
    );
  }

  return <img src={src} alt={name} onError={() => setFailed(true)} className={`flex-none rounded-2xl object-cover ${className}`} />;
}
