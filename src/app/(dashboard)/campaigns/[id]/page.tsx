import { createClient } from '@/src/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { RegisterButton } from './RegisterButton';
import './campaign-detail.css';

interface Entidad {
  nombre: string;
  imagen: string;
}

interface Locacion {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  map_link: string;
  entidad: Entidad | null;
}

interface Campaign {
  id: string;
  tipo: string;
  componente: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  status: string;
  locacion: Locacion | null;
}

/** Build a static map image URL (Geoapify). NOTE: lon,lat order in params. */
function mapTilerStaticUrl(
  lat: number,
  lng: number,
  width = 300,
  height = 200,
  zoom = 13,
  styleId: string = 'streets-v2', // try 'outdoor-v2', 'hybrid', etc.
) {
  const key = process.env.NEXT_PUBLIC_MAPBOX_KEY;
  const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ff0000(${lng},${lat})/${lng},${lat},${zoom},0/${width}x${height}?access_token=${key}`
  console.log(url)
  return url;
}

export default async function CampaignDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Next.js 15: params is a Promise in server components
  const { id } = await params;

  // Fetch campaign details
  const { data: campaign, error } = await supabase
    .from('campana')
    .select(`
      id,
      tipo,
      componente,
      descripcion,
      fecha_inicio,
      fecha_fin,
      status,
      locacion (
        nombre,
        direccion,
        latitud,
        longitud,
        map_link,
        entidad (
          nombre,
          imagen
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !campaign) {
    redirect('/campaigns');
  }

  const typedCampaign = campaign as unknown as Campaign;
  const locacion = typedCampaign.locacion || null;
  const entidad = locacion?.entidad || null;

  const { data: existingRegistration } = await supabase
    .from('registro')
    .select('id, status')
    .eq('id_usuario', user.id)
    .eq('id_campana', typedCampaign.id)
    .maybeSingle();

  // Check if user is eligible to donate (next_date)
  const { data: userInfo } = await supabase
    .from('user_info')
    .select('next_date, blood_type')
    .eq('id', user.id)
    .single();

  const isEligible =
    !userInfo?.next_date ||
    new Date(userInfo.next_date) <= new Date(typedCampaign.fecha_inicio);

  // Format dates
  const startDate = new Date(typedCampaign.fecha_inicio);
  const endDate = new Date(typedCampaign.fecha_fin);

  const formattedDate = startDate.toLocaleDateString('es-GT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = `${startDate.toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${endDate.toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const hasCoords =
    locacion?.latitud != null &&
    locacion?.longitud != null &&
    !Number.isNaN(locacion.latitud) &&
    !Number.isNaN(locacion.longitud);

  // Link when clicking the image
  const mapHref =
    locacion?.map_link && locacion.map_link.trim().length > 0
      ? locacion.map_link
      : hasCoords
      ? `https://www.openstreetmap.org/?mlat=${locacion!.latitud}&mlon=${locacion!.longitud}#map=17/${locacion!.latitud}/${locacion!.longitud}`
      : '#';

  // Static map image src (only if API key present and we have coordinates)
  const staticMapSrc =
    hasCoords && (process.env.NEXT_PUBLIC_MAPBOX_KEY)
      ? mapTilerStaticUrl(locacion!.latitud, locacion!.longitud, 960, 380, 16)
      : null;

  return (
    <div className="campaign-detail-container">
      <Link href="/campaigns" className="back-link">
        ← Volver a campañas
      </Link>

      <div className="campaign-detail">
        {/* Header */}
        <div className="campaign-header">
          {entidad?.imagen && (
            <img
              src={entidad.imagen}
              alt={entidad.nombre || 'Entidad'}
              className="entity-logo"
            />
          )}
          <div className="header-text">
            <h1>{locacion?.nombre || 'Campaña de donación'}</h1>
            {entidad?.nombre && <p className="entity-name">{entidad.nombre}</p>}
          </div>
        </div>

        {/* Main info card */}
        <div className="info-card">
          {/* === Map block (static image + click-through) === */}
          <div className="info-section full-width" style={{ marginBottom: 12 }}>
            <h2>Mapa</h2>
            {hasCoords ? (
              staticMapSrc ? (
                <a
                  href={mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block' }}
                >
                  <img
                    src={staticMapSrc}
                    alt={`Ubicación: ${locacion?.nombre ?? 'Punto'}`}
                    width={960}
                    height={380}
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: 12,
                      display: 'block',
                    }}
                  />
                </a>
              ) : (
                // Fallback if no Geoapify key: show a simple link button
                <a
                  href={mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  Ver en el mapa →
                </a>
              )
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 160,
                  borderRadius: 12,
                  background: '#f2f2f2',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#6B7476',
                  fontSize: 14,
                }}
              >
                Mapa no disponible
              </div>
            )}
          </div>

          <div className="info-section">
            <h2>Fecha y hora</h2>
            <p className="info-value">{formattedDate}</p>
            <p className="info-secondary">{formattedTime}</p>
          </div>

          <div className="info-section">
            <h2>Ubicación</h2>
            <p className="info-value">
              {locacion?.direccion || 'Ubicación por confirmar'}
            </p>
            {locacion?.map_link && (
              <a
                href={locacion.map_link}
                target="_blank"
                rel="noopener noreferrer"
                className="map-link"
              >
                Ver en el mapa →
              </a>
            )}
          </div>

          <div className="info-section">
            <h2>Tipo de donación</h2>
            <span className="pill-large">
              {typedCampaign.componente || typedCampaign.tipo || 'Sangre total'}
            </span>
          </div>

          {typedCampaign.descripcion && (
            <div className="info-section full-width">
              <h2>📋 Descripción</h2>
              <p className="description">{typedCampaign.descripcion}</p>
            </div>
          )}
        </div>

        {/* Eligibility check */}
        {!isEligible && userInfo?.next_date && (
          <div className="warning-card">
            <h3>⚠️ No puedes donar en esta fecha</h3>
            <p>
              Podrás volver a donar a partir del{' '}
              <strong>
                {new Date(userInfo.next_date).toLocaleDateString('es-GT', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
            </p>
          </div>
        )}

        {/* Registration status or button */}
        {existingRegistration ? (
          <div className="registration-status">
            <div className="status-badge">✓ Ya estás inscrito</div>
            <p className="status-text">
              Estado: <strong>{existingRegistration.status}</strong>
            </p>
          </div>
        ) : isEligible ? (
          <RegisterButton campaignId={typedCampaign.id} userId={user.id} />
        ) : (
          <button className="btn-disabled" disabled>
            No elegible para esta fecha
          </button>
        )}

        {/* Requirements */}
        <div className="requirements-card">
          <h2>Requisitos para donar</h2>
          <ul>
            <li>✓ Tener entre 18 y 65 años</li>
            <li>✓ Pesar más de 50 kg</li>
            <li>✓ Estar en buen estado de salud</li>
            <li>✓ No haber donado en los últimos 56 días</li>
            <li>✓ Haber dormido al menos 6 horas</li>
            <li>✓ Haber desayunado (evitar grasas)</li>
            <li>✓ Traer documento de identificacion</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
