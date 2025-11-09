'use client';

import { createClient } from "@/src/lib/supabase/client";
import { useState, useEffect } from "react";
import './history.css';

interface Registration {
  id: number;
  created_at: string;
  status: string;
  fecha_validacion: string | null;
  campaña: Campaign[];
}

interface Campaign {
  tipo: string;
  componente: string;
  fecha_inicio: string;
  locacion: Location[];
}

interface Location {
  nombre: string;
  direccion: string;
}

export default function HistoryPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [registrations, filter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('registro')
        .select(`
          id,
          created_at,
          status,
          fecha_validacion,
          campana (
            tipo,
            componente,
            fecha_inicio,
            locacion (
              nombre,
              direccion
            )
          )
        `)
        .eq('id_usuario', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
        return;
      }

      setRegistrations(data as unknown as Registration[] || []);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...registrations];

    if (filter === 'completada') {
      filtered = filtered.filter(r => r.status === 'completada');
    } else if (filter === 'inscrita') {
      filtered = filtered.filter(r => r.status === 'inscrita' || r.status === 'confirmada');
    }

    setFilteredRegistrations(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; class: string } } = {
      'completada': { label: 'Validada', class: 'badge-validated' },
      'confirmada': { label: 'Confirmada', class: 'badge-confirmed' },
      'inscrita': { label: 'Pendiente', class: 'badge-pending' },
      'cancelada': { label: 'Cancelada', class: 'badge-cancelled' }
    };

    const statusInfo = statusMap[status] || { label: status, class: 'badge' };
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  // Pagination
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredRegistrations.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="history-container">
      <section className="history-header">
        <h1>Historial de campañas participadas</h1>
        <p className="subtitle">
          Consulta las campañas en las que has participado y su estado de validación.
        </p>
      </section>

      <section className="card">
        {/* Filters */}
        <div className="filters">
          <label htmlFor="filter">Filtrar por estado:</label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="completada">Validadas</option>
            <option value="inscrita">Pendientes</option>
          </select>
          <button className="btn-ghost" onClick={applyFilter}>
            Aplicar
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="loading-state">Cargando historial...</div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="empty-state">
            <p>No tienes campañas registradas aún.</p>
            <a href="/campaigns">
              <button className="btn-red">Buscar campañas</button>
            </a>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Campaña</th>
                    <th>Lugar</th>
                    <th>Tipo de donación</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((registration) => {
                    const campaign = registration.campaña?.[0];
                    const location = campaign?.locacion?.[0];
                    
                    const displayDate = registration.fecha_validacion 
                      ? formatDate(registration.fecha_validacion)
                      : formatDate(registration.created_at);

                    return (
                      <tr key={registration.id}>
                        <td>{displayDate}</td>
                        <td>{location?.nombre || 'Campaña de donación'}</td>
                        <td>{location?.direccion || 'N/A'}</td>
                        <td>
                          <span className="pill">
                            {campaign?.componente || campaign?.tipo || 'Sangre total'}
                          </span>
                        </td>
                        <td>{getStatusBadge(registration.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  « Anterior
                </button>
                
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        className={`page-btn ${currentPage === pageNumber ? 'active' : ''}`}
                        onClick={() => goToPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return <span key={pageNumber} className="page-ellipsis">...</span>;
                  }
                  return null;
                })}

                <button
                  className="page-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Siguiente »
                </button>
              </div>
            )}

            {/* Results info */}
            <div className="results-info">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredRegistrations.length)} de {filteredRegistrations.length} registros
            </div>
          </>
        )}
      </section>
    </div>
  );
}