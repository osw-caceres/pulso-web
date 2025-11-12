'use client';

import { createClient } from "@/src/lib/supabase/client";
import { useState, useEffect } from "react";
import Link from "next/link";
import './locations.css';

interface Locacion {
  id: string;
  nombre: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  map_link: string | null;
  status: string;
  created_at: string;
  entidad: {
    nombre: string;
  }[] | null;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Locacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('locacion')
        .select(`
          id,
          nombre,
          direccion,
          latitud,
          longitud,
          map_link,
          status,
          created_at,
          entidad (
            nombre
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching locations:', error);
        return;
      }

      setLocations(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = locations.filter(loc => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const entidad = Array.isArray(loc.entidad) && loc.entidad.length > 0 ? loc.entidad[0] : null;
    
    return (
      loc.nombre?.toLowerCase().includes(query) ||
      loc.direccion?.toLowerCase().includes(query) ||
      entidad?.nombre?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="locations-container">
      <div className="locations-header">
        <div className="header-content">
          <h1>Ubicaciones</h1>
        </div>
        <Link href="/admin/locations/create">
          <button className="btn-red">+ Nueva ubicación</button>
        </Link>
      </div>

      <div className="search-section">
        <input
          type="search"
          placeholder="Buscar por nombre, dirección o entidad..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading-state">Cargando ubicaciones...</div>
      ) : filteredLocations.length === 0 ? (
        <div className="empty-state">
          <h3>No se encontraron ubicaciones</h3>
          <p>
            {searchQuery ? 
              'Intenta con otros términos de búsqueda' : 
              'Comienza agregando tu primera ubicación'
            }
          </p>
          {!searchQuery && (
            <Link href="/admin/locations/create">
              <button className="btn-red">Crear primera ubicación</button>
            </Link>
          )}
        </div>
      ) : (
        <div className="locations-grid">
          {filteredLocations.map((location) => {
            const entidad = Array.isArray(location.entidad) && location.entidad.length > 0 ? location.entidad[0] : null;
            
            return (
              <div key={location.id} className="location-card">
                <div className="location-header">
                  <div className="location-icon"></div>
                  <div className="location-status">
                    <span className={`status-badge ${location.status === 'active' ? 'active' : 'inactive'}`}>
                      {location.status === 'active' ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>

                <h3 className="location-name">{location.nombre}</h3>
                
                {entidad && (
                  <div className="location-entity">
                    <span className="entity-label">Entidad:</span>
                    <span className="entity-name">{entidad.nombre}</span>
                  </div>
                )}

                <div className="location-address">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {location.direccion}
                </div>

                {(location.latitud && location.longitud) && (
                  <div className="location-coords">
                    🗺️ {location.latitud.toFixed(4)}, {location.longitud.toFixed(4)}
                  </div>
                )}

                <div className="location-actions">
                  {location.map_link && (
                    <a 
                      href={location.map_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-ghost-small"
                    >
                      Ver mapa
                    </a>
                  )}
                  <Link href={`/admin/locations/${location.id}/edit`}>
                    <button className="btn-ghost-small">Editar</button>
                  </Link>
                </div>

                <div className="location-meta">
                  Creada el {new Date(location.created_at).toLocaleDateString('es-GT', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="results-count">
        Mostrando {filteredLocations.length} de {locations.length} ubicaciones
      </div>
    </div>
  );
}