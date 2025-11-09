import Link from 'next/link';
import { createClient } from '@/src/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  // Fetch user info from user_info table
  const { data: userInfo } = await supabase
    .from('user_info')
    .select('name, next_date')
    .eq('id', authUser!.id)
    .single();

  const userName = userInfo?.name || 'Usuario';
  
  // Format next donation date
  let nextDonationDate = "Realiza una donación";
  if (userInfo?.next_date) {
    const date = new Date(userInfo.next_date);
    nextDonationDate = date.toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Fetch user's next registered campaign
  const { data: registrations } = await supabase
    .from('registro')
    .select(`
      status,
      campana (
        tipo,
        componente,
        descripcion,
        fecha_inicio,
        fecha_fin,
        locacion (
          nombre,
          direccion
        )
      )
    `)
    .eq('id_usuario', authUser!.id)
    .gte('campana.fecha_inicio', new Date().toISOString())
    .order('fecha_inicio', { ascending: true, referencedTable:'campana' })
    .limit(1);

  console.log({registrations})

  // Format campaign data
  let nextCampaign = null;
  if (registrations && registrations.length > 0) {
    const registration = registrations[0];
    // Supabase returns joined data as arrays
    const campaignArray = registration.campana as any;
    
    if (campaignArray && Array.isArray(campaignArray) && campaignArray.length > 0) {
      const campaign = campaignArray[0];
      const locacionArray = campaign.locacion;
      const locacion = Array.isArray(locacionArray) && locacionArray.length > 0 ? locacionArray[0] : null;
      
      const fechaInicio = new Date(campaign.fecha_inicio);
      const fechaFin = new Date(campaign.fecha_fin);
      
      nextCampaign = {
        name: locacion?.nombre || 'Campaña de donación',
        date: fechaInicio.toLocaleDateString('es-GT', { 
          weekday: 'long', 
          day: '2-digit', 
          month: 'short',
          year: 'numeric'
        }),
        time: `${fechaInicio.toLocaleTimeString('es-GT', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}–${fechaFin.toLocaleTimeString('es-GT', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`,
        location: locacion?.direccion || 'Ubicación por confirmar',
        donationType: campaign.componente || campaign.tipo || 'Sangre total',
        status: registration.status || 'Inscrita'
      };
    } else if (campaignArray && !Array.isArray(campaignArray)) {
      // In case Supabase returns it as a single object
      const campaign = campaignArray;
      const locacionData = campaign.locacion;
      const locacion = Array.isArray(locacionData) && locacionData.length > 0 ? locacionData[0] : locacionData;
      
      const fechaInicio = new Date(campaign.fecha_inicio);
      const fechaFin = new Date(campaign.fecha_fin);
      
      nextCampaign = {
        name: locacion?.nombre || 'Campaña de donación',
        date: fechaInicio.toLocaleDateString('es-GT', { 
          weekday: 'long', 
          day: '2-digit', 
          month: 'short',
          year: 'numeric'
        }),
        time: `${fechaInicio.toLocaleTimeString('es-GT', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}–${fechaFin.toLocaleTimeString('es-GT', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`,
        location: locacion?.direccion || 'Ubicación por confirmar',
        donationType: campaign.componente || campaign.tipo || 'Sangre total',
        status: registration.status || 'Inscrita'
      };
    }
  }

  return (
    <div className="container">
      <section>
        <h1>¡Bienvenido, {userName}!</h1>
      </section>

      {/* Próxima fecha */}
      <section className="card">
        <h2 className="section-title">Próxima fecha disponible para donar</h2>
        <div className="next-donation">Podrás donar nuevamente a partir del:</div>
        <div className="highlight">{nextDonationDate}</div>
        <Link href="/campaigns">
          <button className="btn">Ver campañas activas</button>
        </Link>
      </section>

      {/* Campaña más cercana */}
      {nextCampaign ? (
        <section className="card">
          <h2 className="section-title">Tu próxima campaña inscrita</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{nextCampaign.name}</strong>
            <span className="badge">{nextCampaign.status}</span>
          </div>
          <div>{nextCampaign.date} · {nextCampaign.time}</div>
          <div>{nextCampaign.location}</div>
          <div>Tipo de donación: <span className="pill">{nextCampaign.donationType}</span></div>
          <button className="btn">Ver detalles</button>
        </section>
      ) : (
        <section className="card">
          <h2 className="section-title">No tienes campañas inscritas</h2>
          <p style={{ color: '#6B7476', marginBottom: '16px' }}>
            Busca campañas de donación cerca de ti y regístrate para ayudar a salvar vidas.
          </p>
          <Link href="/campaigns">
            <button className="btn">Buscar campañas</button>
          </Link>
        </section>
      )}
    </div>
  );
}