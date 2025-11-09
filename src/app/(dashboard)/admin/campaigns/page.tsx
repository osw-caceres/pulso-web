import { createClient } from '@/src/lib/supabase/server';
import Link from 'next/link';
import './admin-campaigns.css';

export default async function AdminCampaignsPage() {
  const supabase = await createClient();

  // Fetch all campaigns (not just active ones)
  const { data: campaigns } = await supabase
    .from('campaña')
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
        entidad (
          nombre
        )
      )
    `)
    .order('fecha_inicio', { ascending: false });

  return (
    <div className="admin-campaigns-container">
      <div className="admin-header">
        <div>
          <h1>Campañas activas</h1>
          <p className="subtitle">Administra todas las campañas de donación</p>
        </div>
        <Link href="/admin/campaigns/create">
          <button className="btn">+ Crear nueva campaña</button>
        </Link>
      </div>

      <section className="card">
        {campaigns && campaigns.length > 0 ? (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Campaña</th>
                  <th>Ubicación</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => {
                  const locacion = campaign.locacion as any;
                  const locacionData = Array.isArray(locacion) && locacion.length > 0 ? locacion[0] : locacion;
                  const entidad = locacionData?.entidad as any;
                  const entidadData = Array.isArray(entidad) && entidad.length > 0 ? entidad[0] : entidad;

                  const dateStart = new Date(campaign.fecha_inicio).toLocaleDateString('es-GT', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });

                  const statusClass = campaign.status === 'active' ? 'active' : campaign.status === 'completed' ? 'completed' : 'cancelled';

                  return (
                    <tr key={campaign.id}>
                      <td>{dateStart}</td>
                      <td>
                        <div className="campaign-name">{locacionData?.nombre || 'Campaña'}</div>
                        {entidadData?.nombre && (
                          <div className="entity-name">{entidadData.nombre}</div>
                        )}
                      </td>
                      <td>{locacionData?.direccion || 'N/A'}</td>
                      <td>
                        <span className="pill">
                          {campaign.componente || campaign.tipo}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${statusClass}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link href={`/admin/campaigns/${campaign.id}/edit`}>
                            <button className="btn-ghost btn-small">Editar</button>
                          </Link>
                          <Link href={`/admin/campaigns/${campaign.id}/registrations`}>
                            <button className="btn-ghost btn-small">Ver registros</button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No hay campañas registradas.</p>
            <Link href="/admin/campaigns/create">
              <button className="btn">Crear primera campaña</button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
