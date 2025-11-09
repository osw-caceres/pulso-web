'use client';

import { createClient } from "@/src/lib/supabase/client";
import { useState, useEffect } from "react";
import Link from "next/link";
import './campaigns.css';

interface Entidad { 
  nombre: string; 
  imagen?: string; // 👈 agregado
}

interface Locacion {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  map_link?: string;
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

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBloodTypes, setSelectedBloodTypes] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistance, setSelectedDistance] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => { fetchCampaigns(); }, []);
  useEffect(() => { applyFilters(); }, [campaigns, searchQuery, selectedBloodTypes, selectedDate, selectedCity, selectedDistance, sortBy]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
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
            id,
            nombre,
            direccion,
            latitud,
            longitud,
            entidad (
              nombre,
              imagen
            )
          )
        `)
        .eq('status', 'active')
        .gte('fecha_inicio', new Date().toISOString())
        .order('fecha_inicio', { ascending: true });

      if (error) {
        console.error('Error fetching campaigns:', error);
        setCampaigns([]);
        return;
      }

      setCampaigns((data as unknown as Campaign[]) || []);
    } catch (e) {
      console.error('Unexpected error:', e);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...campaigns];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => {
        const l = c.locacion;
        const e = l?.entidad;
        return (
          l?.nombre?.toLowerCase().includes(q) ||
          l?.direccion?.toLowerCase().includes(q) ||
          e?.nombre?.toLowerCase().includes(q) ||
          c.tipo?.toLowerCase().includes(q) ||
          c.componente?.toLowerCase().includes(q)
        );
      });
    }

    if (selectedDate) {
      filtered = filtered.filter(c =>
        new Date(c.fecha_inicio).toISOString().split('T')[0] === selectedDate
      );
    }

    if (selectedCity.trim()) {
      const city = selectedCity.toLowerCase();
      filtered = filtered.filter(c => c.locacion?.direccion?.toLowerCase().includes(city));
    }

    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());
    }

    setFilteredCampaigns(filtered);
  };

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); applyFilters(); };
  const toggleBloodType = (t: string) => {
    const s = new Set(selectedBloodTypes);
    s.has(t) ? s.delete(t) : s.add(t);
    setSelectedBloodTypes(s);
  };
  const clearFilters = () => {
    setSearchQuery(''); setSelectedBloodTypes(new Set()); setSelectedDate('');
    setSelectedCity(''); setSelectedDistance(''); setSortBy('date');
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('es-GT', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

  const formatTime = (start: string, end: string) => {
    const a = new Date(start), b = new Date(end);
    return `${a.toLocaleTimeString('es-GT',{hour:'2-digit',minute:'2-digit'})}–${b.toLocaleTimeString('es-GT',{hour:'2-digit',minute:'2-digit'})}`;
  };

  return (
    <>
      <header className="campaigns-header">
        <div className="topbar">
          <form onSubmit={handleSearchSubmit} className="searchbar" role="search">
            <input
              type="search"
              placeholder="Buscar campañas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn" type="submit">Buscar</button>
          </form>

          <button className="btn-ghost" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}>
            {filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
          </button>
        </div>
      </header>

      <div className="campaigns-layout">
        {filtersOpen && (
          <aside className="filters">
            <h2>Filtros</h2>

            <div className="field">
              <label htmlFor="blood">Tipos requeridos</label>
              <div className="chips" role="group">
                {BLOOD_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`chip ${selectedBloodTypes.has(type) ? 'active' : ''}`}
                    onClick={() => toggleBloodType(type)}
                    aria-pressed={selectedBloodTypes.has(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="date">Fecha</label>
              <input id="date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="city">Ciudad</label>
              <input id="city" type="text" placeholder="Guatemala, Mixco, Quetzaltenango…" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="distance">Distancia (km)</label>
              <select id="distance" value={selectedDistance} onChange={(e) => setSelectedDistance(e.target.value)}>
                <option value="">Cualquiera</option>
                <option value="5">≤ 5 km</option>
                <option value="10">≤ 10 km</option>
                <option value="25">≤ 25 km</option>
                <option value="50">≤ 50 km</option>
              </select>
            </div>

            <div className="actions">
              <button className="btn" type="button" onClick={applyFilters}>Aplicar</button>
              <button className="btn-ghost" type="button" onClick={clearFilters}>Limpiar</button>
            </div>
          </aside>
        )}

        <section className="results">
          <div className="meta">
            <div className="count">
              {loading ? 'Cargando...' : `${filteredCampaigns.length} resultado${filteredCampaigns.length !== 1 ? 's' : ''}`}
            </div>
            <div className="sort">
              <label htmlFor="sort" className="sr-only">Ordenar por</label>
              <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="relevance">Relevancia</option>
                <option value="date">Fecha</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="empty">Cargando campañas...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="empty">No encontramos campañas con esos filtros.</div>
          ) : (
            <div className="cards">
              {filteredCampaigns.map((campaign) => {
                const l = campaign.locacion;
                const e = l?.entidad;

                return (
                  <article key={campaign.id} className="card">
                    {/* Imagen de la entidad */}
                    {e?.imagen ? (
                      <img
                        src={e.imagen}
                        alt={e.nombre || 'Entidad organizadora'}
                        style={{
                          width: '100%',
                          height: '220px',
                          objectFit: 'cover',
                          borderRadius: '12px 12px 0 0',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '220px',
                          background: '#f2f2f2',
                          borderRadius: '12px 12px 0 0',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#999',
                          fontSize: 14,
                        }}
                      >
                        Sin imagen
                      </div>
                    )}

                    <div className="head">
                      <h3>{l?.nombre || 'Campaña de donación'}</h3>
                      <span className="badge">
                        {formatDate(campaign.fecha_inicio)} · {formatTime(campaign.fecha_inicio, campaign.fecha_fin)}
                      </span>
                    </div>

                    <div className="row">
                      <span>{l?.direccion || 'Ubicación por confirmar'}</span>
                      {e?.nombre && (
                        <span style={{ color: '#6B7476', fontSize: 12, marginLeft: 8 }}>— {e.nombre}</span>
                      )}
                    </div>

                    {campaign.descripcion && (
                      <p style={{ margin: 0, color: '#6B7476', fontSize: '14px' }}>
                        {campaign.descripcion}
                      </p>
                    )}

                    <div className="need">
                      <span className="pill">{campaign.componente || campaign.tipo || 'Sangre total'}</span>
                    </div>

                    <div className="cta">
                      <Link href={`/campaigns/${campaign.id}`}><button className="btn" type="button">Inscribirse</button></Link>
                      <Link href={`/campaigns/${campaign.id}`}><button className="btn-outline" type="button">Ver detalles</button></Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
