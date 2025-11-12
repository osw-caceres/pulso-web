// app/components/StaticLocationImage.tsx
type Props = {
  lat: number;
  lng: number;
  href: string;           // adónde quieres enviar al usuario al hacer clic
  width?: number;         // px
  height?: number;        // px
  zoom?: number;          // 1–19 aprox
  alt?: string;
};

export default function StaticLocationImage({
  lat,
  lng,
  href,
  width = 640,
  height = 360,
  zoom = 15,
  alt = 'Ubicación',
}: Props) {
  const src = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lng},red-pushpin`;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        style={{ borderRadius: 12, display: 'block', width: '100%', height: 'auto' }}
      />
    </a>
  );
}
