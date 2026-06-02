interface EmbedPlayerProps {
  embedUrl: string;
  title: string;
  mountId: string;
}

/** Iframe directo al servidor (sin sandbox ni proxy — evita "Sandboxed embed not allowed"). */
export function EmbedPlayer({ embedUrl, title, mountId }: EmbedPlayerProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-cinematic">
      <iframe
        key={mountId}
        src={embedUrl}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
