import { createClient } from '@/src/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import './profile.css';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: userInfo } = await supabase
    .from('user_info')
    .select(`
      name,
      last_name,
      email,
      blood_type,
      next_date,
      puntos,
      nivel (
        nombre,
        puntaje_minimo,
        orden
      )
    `)
    .eq('id', authUser.id)
    .single();

    console.log({userInfo})

  // Count completed donations
  const { count: donationCount } = await supabase
    .from('registro')
    .select('*', { count: 'exact', head: true })
    .eq('id_usuario', authUser.id)
    .eq('status', 'validated');

  // Fetch recent donations
  const { data: recentDonations } = await supabase
    .from('registro')
    .select(`
      created_at,
      fecha_validacion,
      status,
      campana (
        tipo,
        componente,
        locacion (
          nombre,
          direccion
        )
      )
    `)
    .eq('id_usuario', authUser.id)
    .eq('status', 'validated')
    .order('fecha_validacion', { ascending: false })
    .limit(5);

  // User info
  const fullName = userInfo?.name && userInfo?.last_name 
    ? `${userInfo.name} ${userInfo.last_name}` 
    : userInfo?.name || 'Usuario';
  
  const initials = fullName
    .split(' ')
    .map((n: string) => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const points = userInfo?.puntos || 0;
  const donations = donationCount || 0;

  const nivelUsuario = userInfo?.nivel as any

  const {data: nivelData } = await supabase
  .from('nivel')
  .select(`
    puntaje_minimo,
    nombre
    `)
  .eq('orden', nivelUsuario.orden + 1 )
  .single()

  console.log({nivelData})

  // Level info
  const currentLevel = userInfo?.nivel as any;
  const levelNumber = currentLevel?.orden;
  const minPointsForCurrentLevel = currentLevel?.[0]?.puntaje_minimo || 0;
  
  // Next level calculation (assuming 1000 points between levels)

  const nextLevelPoints = nivelData?.puntaje_minimo
  const progressPercentage = Math.min((points * 100) / nextLevelPoints, 100);

  // Next donation date
  const nextDate = userInfo?.next_date 
    ? new Date(userInfo.next_date) 
    : null;
  
  const canDonate = !nextDate || nextDate <= new Date();
  
  const formattedNextDate = nextDate 
    ? nextDate.toLocaleDateString('es-GT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : 'No disponible';

  const nextDateShort = nextDate
    ? {
        month: nextDate.toLocaleDateString('es-GT', { month: 'short' }).toUpperCase(),
        day: nextDate.getDate()
      }
    : null;

  return (
    <div className="profile-container">
      <div className="profile-grid">
        {/* Left column: Profile info */}
        <section className="card profile-card">
          <div className="avatar">{initials}</div>
          <h1 className="profile-name">{fullName}</h1>
          <div className="meta">
            Tipo de sangre <strong>{userInfo?.blood_type || 'No especificado'}</strong>
          </div>

          {/* Edit button */}
          <div className="actions" style={{ marginTop: '4px' }}>
            <Link href="/profile/edit">
              <button className="btn">Modificar datos de perfil</button>
            </Link>
          </div>

          {/* KPIs */}
          <div className="kpis">
            <div className="kpi">
              <div className="label">Puntos</div>
              <div className="num">{points.toLocaleString('es-GT')}</div>
            </div>
            <div className="kpi">
              <div className="label">Nivel</div>
              <div className="num">{levelNumber}</div>
            </div>
            <div className="kpi">
              <div className="label">Donaciones</div>
              <div className="num">{donations}</div>
            </div>
          </div>

          {/* Level progress */}
          <div className="level">
            <div className="level-row">
              <strong>Progreso al nivel {levelNumber + 1}</strong>
              <span>
                {Math.round(progressPercentage)}% · {points} / {nextLevelPoints} pts
              </span>
            </div>
            <div className="bar">
              <i style={{ width: `${progressPercentage}%` }}></i>
            </div>
          </div>

          {/* Next donation */}
          <div className="next-donation card" style={{ padding: '12px' }}>
            <h2 className="next-title">Próxima donación</h2>
            
            {canDonate ? (
              <div className="can-donate">
                <p style={{ margin: 0, color: 'var(--pulso-red)', fontWeight: 700 }}>
                  ¡Ya puedes donar!
                </p>
                <div className="actions" style={{ marginTop: '12px' }}>
                  <Link href="/campaigns">
                    <button className="btn">Ver campañas</button>
                  </Link>
                </div>
              </div>
            ) : nextDateShort ? (
              <div className="cal">
                <div className="datebox">
                  <div style={{ fontSize: '12px', lineHeight: 1, color: '#b55' }}>
                    {nextDateShort.month}
                  </div>
                  <div style={{ fontSize: '26px', lineHeight: 1 }}>
                    {nextDateShort.day}
                  </div>
                </div>
                <div>
                  <div>
                    <strong>Disponible para donar desde:</strong> {formattedNextDate}
                  </div>
                  <p className="note">
                    Basado en tu última donación. Debes esperar 56 días entre donaciones.
                  </p>
                  <div className="actions">
                    <Link href="/campaigns">
                      <button className="btn-ghost">Ver campañas</button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <p className="note">Fecha no disponible</p>
            )}
          </div>
        </section>

        {/* Right column: Donation history */}
        <section className="card history-card">
          <h2 className="section-title">Donaciones recientes</h2>
          
          {recentDonations && recentDonations.length > 0 ? (
            <>
              <div className="table-container">
                <table className="donations-table" role="table">
                  <caption style={{ textAlign: 'left', padding: '8px 0', color: 'var(--muted)', captionSide: 'top' }}>
                    Registros de tus últimas jornadas y centros de donación.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Fecha</th>
                      <th scope="col">Centro</th>
                      <th scope="col">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDonations.map((donation, index) => {
                      const campaign = donation.campana as any;
                      const campaignData = Array.isArray(campaign) ? campaign[0] : campaign;
                      const locacion = campaignData?.locacion as any;
                      const locacionData = Array.isArray(locacion) && locacion.length > 0 ? locacion[0] : locacion;
                      
                      const date = donation.fecha_validacion 
                        ? new Date(donation.fecha_validacion).toLocaleDateString('es-GT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'N/A';

                      return (
                        <tr key={index}>
                          <td>{date}</td>
                          <td>{locacionData?.nombre || 'Centro de donación'}</td>
                          <td>
                            <span className="pill">
                              {campaignData?.componente || campaignData?.tipo || 'Sangre total'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <Link href="/history">
                  <button className="btn">Ver historial completo</button>
                </Link>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Aún no tienes donaciones completadas.</p>
              <Link href="/campaigns">
                <button className="btn">Buscar campañas</button>
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}