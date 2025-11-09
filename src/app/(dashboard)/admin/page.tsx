import Link from 'next/link';

export default function CreateCampaignPage() {
  return (
    <div className="admin-campaigns-container">
      <div className="admin-header">
        <div>
          <h1>Inicio Admin</h1>
          <p className="subtitle">Configura una nueva campaña de donación de sangre</p>
        </div>
      </div>

      <section className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: 'var(--muted)', marginBottom: '20px' }}>
          Formulario de creación de campañas próximamente...
        </p>
        <Link href="/admin/campaigns">
          <button className="btn">← Volver a campañas</button>
        </Link>
      </section>
    </div>
  );
}
