'use client';

import { createClient } from "@/src/lib/supabase/client";
import { useState, useEffect } from "react";
import Link from "next/link";
import './admin-campaigns.css';

interface Campaign {
  id: string;
  nombre: string;
  tipo: string;
  componente: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  status: string;
  created_at: string;
  locacion: {
    nombre: string;
    direccion: string;
    entidad: {
      nombre: string;
    };
  };
}

type TabType = 'active' | 'history';

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('campana')
        .select(`
          id,
          nombre,
          tipo,
          componente,
          descripcion,
          fecha_inicio,
          fecha_fin,
          status,
          created_at,
          locacion (
            nombre,
            direccion,
            entidad (
              nombre
            )
          )
        `)
        .order('fecha_inicio', { ascending: false });

        console.log({data})

      if (error) {
        console.error('Error fetching campaigns:', error);
        return;
      }

      setCampaigns(data as unknown as Campaign[] || []);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCampaigns = () => {
    const now = new Date();
    
    let filtered = campaigns.filter(campaign => {
      const endDate = new Date(campaign.fecha_fin);
      
      if (activeTab === 'active') {
        // Active: future campaigns or currently running
        return endDate >= now && campaign.status === 'active';
      } else {
        // History: past campaigns or inactive
        return endDate < now || campaign.status !== 'active';
      }
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => {
        const locacion = Array.isArray(c.locacion) && c.locacion.length > 0 ? c.locacion[0] : null;
        const entidad = locacion?.entidad?.[0];
        
        return (
          c.nombre?.toLowerCase().includes(query) ||
          c.tipo?.toLowerCase().includes(query) ||
          c.componente?.toLowerCase().includes(query) ||
          locacion?.nombre?.toLowerCase().includes(query) ||
          entidad?.nombre?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  };

  const filteredCampaigns = getFilteredCampaigns();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-GT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (fechaInicio: string) => {
    return new Date(fechaInicio) > new Date();
  };

  const isOngoing = (fechaInicio: string, fechaFin: string) => {
    const now = new Date();
    return new Date(fechaInicio) <= now && new Date(fechaFin) >= now;
  };

  return (
    <div className="admin-campaigns-container">
      <div className="campaigns-header">
        <div className="header-content">
          <h1>Gestión de Campañas</h1>
        </div>
        <Link href="/admin/campaigns/create">
          <button className="btn-red">+ Nueva campaña</button>
        </Link>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >

            Activas
            <span className="tab-count">
              {campaigns.filter(c => {
                const endDate = new Date(c.fecha_fin);
                return endDate >= new Date() && c.status === 'active';
              }).length}
            </span>
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >

            Historial
            <span className="tab-count">
              {campaigns.filter(c => {
                const endDate = new Date(c.fecha_fin);
                return endDate < new Date() || c.status !== 'active';
              }).length}
            </span>
          </button>
        </div>

        <div className="search-section">
          <input
            type="search"
            placeholder="Buscar campañas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Cargando campañas...</div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="empty-state">

          <h3>No hay campañas {activeTab === 'active' ? 'activas' : 'en el historial'}</h3>
          <p>
            {searchQuery
              ? 'Intenta con otros términos de búsqueda'
              : activeTab === 'active'
              ? 'Crea tu primera campaña para comenzar'
              : 'Las campañas finalizadas aparecerán aquí'}
          </p>
          {!searchQuery && activeTab === 'active' && (
            <Link href="/admin/campaigns/create">
              <button className="btn-red">Crear primera campaña</button>
            </Link>
          )}
        </div>
      ) : (
        <div className="campaigns-grid">
          {filteredCampaigns.map((campaign) => {
            const locacion = campaign.locacion
              ? campaign.locacion
              : null;
            const entidad = locacion?.entidad ? locacion?.entidad : null;
            const upcoming = isUpcoming(campaign.fecha_inicio);
            const ongoing = isOngoing(campaign.fecha_inicio, campaign.fecha_fin);

            return (
              <div key={campaign.id} className="campaign-card">
                <div className="campaign-header">
                  <div className="campaign-status-badges">
                    {ongoing && (
                      <span className="status-badge ongoing">En curso</span>
                    )}
                    {upcoming && !ongoing && (
                      <span className="status-badge upcoming">Próxima</span>
                    )}
                    {campaign.status !== 'active' && (
                      <span className="status-badge inactive">Inactiva</span>
                    )}
                  </div>
                  <span className="campaign-type">{campaign.tipo}</span>
                </div>

                <h3 className="campaign-name">{campaign.nombre}</h3>

                <div className="campaign-info">
                  <div className="info-row">

                    <div className="info-content">
                      <div className="info-primary">{locacion?.entidad.nombre + ' - ' + locacion?.nombre || 'Ubicación no especificada'}</div>
                      {entidad && (
                        <div className="info-secondary">{locacion?.direccion}</div>
                      )}
                    </div>
                  </div>

                  <div className="info-row">

                    <div className="info-content">
                      <div className="info-primary">
                        {formatDate(campaign.fecha_inicio)}
                      </div>
                      <div className="info-secondary">
                        {formatTime(campaign.fecha_inicio)} - {formatTime(campaign.fecha_fin)}
                      </div>
                    </div>
                  </div>

                  <div className="info-row">
                    <div className="info-content">
                      <span className="pill">{campaign.componente}</span>
                    </div>
                  </div>
                </div>

                <div className="campaign-actions">
                  {activeTab === 'active' ? (
                    <>
                      <Link href={`/admin/campaigns/${campaign.id}/participants`}>
                        <button className="btn-ghost-small">
                          Ver participantes
                        </button>
                      </Link>
                      <Link href={`/admin/campaigns/${campaign.id}/edit`}>
                        <button className="btn-primary-small">
                          Editar
                        </button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href={`/admin/campaigns/${campaign.id}/participants`}>
                        <button className="btn-ghost-small">
                          Participantes
                        </button>
                      </Link>
                      <Link href={`/admin/campaigns/${campaign.id}`}>
                        <button className="btn-ghost-small">
                          Ver detalles
                        </button>
                      </Link>
                    </>
                  )}
                </div>

                <div className="campaign-meta">
                  Creada el {formatDate(campaign.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="results-count">
        Mostrando {filteredCampaigns.length} de {campaigns.length} campañas
      </div>
    </div>
  );
}