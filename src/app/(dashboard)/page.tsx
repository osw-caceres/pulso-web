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
  let nextDonationDate = "No disponible";
  if (userInfo?.next_date) {
    const date = new Date(userInfo.next_date);
    nextDonationDate = date.toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // TODO: Fetch user's next registered campaign from database
  const nextCampaign = {
    name: "Jornada solidaria USAC",
    date: "Viernes 04 Oct 2025",
    time: "09:00–15:00",
    location: "Ciudad Universitaria, Guatemala",
    donationType: "Sangre total",
    status: "Inscrita"
  };

  return (
    <div className="container">
      <section>
        <h1>¡Bienvenido, {userName}!</h1>
      </section>

      {/* Próxima fecha */}
      <section className="card">
        <h2 className="section-title">Próxima fecha disponible para donar</h2>
        <div className="next-donation">🩸 Podrás donar nuevamente a partir del:</div>
        <div className="highlight">{nextDonationDate}</div>
        <Link href="/campaigns">
          <button className="btn">Ver campañas activas</button>
        </Link>
      </section>

      {/* Campaña más cercana */}
      <section className="card">
        <h2 className="section-title">Tu próxima campaña inscrita</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>{nextCampaign.name}</strong>
          <span className="badge">{nextCampaign.status}</span>
        </div>
        <div>📅 {nextCampaign.date} · {nextCampaign.time}</div>
        <div>📍 {nextCampaign.location}</div>
        <div>Tipo de donación: <span className="pill">{nextCampaign.donationType}</span></div>
        <button className="btn">Ver detalles</button>
      </section>
    </div>
  );
}
