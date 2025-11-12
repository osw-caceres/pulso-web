'use client';

import { createClient } from "@/src/lib/supabase/client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import './participants.css';

interface Campaign {
  id: string;
  nombre: string;
  tipo: string;
  componente: string;
  fecha_inicio: string;
  fecha_fin: string;
  status: string;
  locacion: {
    nombre: string;
    direccion: string;
  }[] | null;
}

interface Participant {
  id: number;
  status: string | null;
  fecha_validacion: string | null;
  created_at: string;
  validation_code: string | null;
  user_info: {
    id: string;
    name: string;
    last_name: string;
    email: string;
    blood_type: string | null;
    phone: string | null;
  } | null;
}

export default function ParticipantsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
       const routeParams = useParams<{ id: string | string[] }>();
      const id = Array.isArray(routeParams.id) ? routeParams.id[0] : routeParams.id; 
      
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [notFound, setNotFound] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [validationCode, setValidationCode] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campana')
        .select(`
          id,
          nombre,
          tipo,
          componente,
          fecha_inicio,
          fecha_fin,
          status,
          locacion (
            nombre,
            direccion
          )
        `)
        .eq('id', id)
        .single();

      if (campaignError || !campaignData) {
        console.error('Error fetching campaign:', campaignError);
        setNotFound(true);
        return;
      }

      setCampaign(campaignData);

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('registro')
        .select(`
          id,
          status,
          fecha_validacion,
          created_at,
          validation_code,
          user_info (
            id,
            name,
            last_name,
            email,
            blood_type,
            phone
          )
        `)
        .eq('id_campana', id)
        .order('created_at', { ascending: false });

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return;
      }

      setParticipants(participantsData as unknown as Participant[] || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (registroId: number) => {
    try {
      setValidating(registroId);
      const supabase = createClient();

      const { error } = await supabase
        .from('registro')
        .update({
          status: 'validated',
          fecha_validacion: new Date().toISOString(),
        })
        .eq('id', registroId);

      if (error) {
        console.error('Error validating:', error);
        alert('Error al validar la asistencia');
        return;
      }

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('Ocurrió un error inesperado');
    } finally {
      setValidating(null);
    }
  };

  const openValidationModal = (participant: Participant) => {
    setSelectedParticipant(participant);
    setValidationCode('');
    setModalError(null);
    setShowModal(true);
  };

  const closeValidationModal = () => {
    setShowModal(false);
    setSelectedParticipant(null);
    setValidationCode('');
    setModalError(null);
  };

  const handleModalValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedParticipant || !validationCode.trim()) {
      setModalError('Por favor ingresa el código de validación');
      return;
    }

    try {
      setValidating(selectedParticipant.id);
      setModalError(null);
      const supabase = createClient();

      const user = selectedParticipant.user_info;
      if (!user) {
        setModalError('Error: información de usuario no disponible');
        return;
      }

      // Verify code matches with user_id, campaign_id, and validation_code
      const { data: registro, error: fetchError } = await supabase
        .from('registro')
        .select('id, status, validation_code')
        .eq('id_usuario', user.id)
        .eq('id_campana', id)
        .eq('validation_code', validationCode.trim().toUpperCase())
        .single();

      if (fetchError || !registro) {
        setModalError('Código incorrecto. Verifica e intenta nuevamente.');
        setValidating(null);
        return;
      }

      // Check if already validated
      if (registro.status === 'validated') {
        setModalError('Esta participación ya fue validada anteriormente');
        setValidating(null);
        return;
      }

      // Update registration status
      const { error: updateError } = await supabase
        .from('registro')
        .update({
          status: 'validated',
          fecha_validacion: new Date().toISOString(),
        })
        .eq('id', registro.id);

      if (updateError) {
        console.error('Update error:', updateError);
        setModalError('Error al validar. Por favor intenta de nuevo.');
        setValidating(null);
        return;
      }

      const today = new Date();
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + 56)

      const { error: userError } = await supabase
      .from('user_info')
      .update({
        next_date: nextDate.toISOString()
      })
      .eq('id', user.id)

     await supabase.functions.invoke('points-validator', {
        body: { points: 10, id: user.id },
    })
      // Success - close modal and refresh data
      closeValidationModal();
      await fetchData();
      alert(`✅ Participación validada exitosamente para ${user.name} ${user.last_name}`);
    } catch (error) {
      console.error('Unexpected error:', error);
      setModalError('Ocurrió un error inesperado');
    } finally {
      setValidating(null);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 8);
    setValidationCode(value);
    setModalError(null);
  };

  const isCampaignActive = () => {
    if (!campaign) return false;
    const now = new Date();
    const endDate = new Date(campaign.fecha_fin);
    return endDate >= now && campaign.status === 'active';
  };

  const getFilteredParticipants = () => {
    let filtered = participants;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => {
        if (filterStatus === 'validated') {
          return p.status === 'validated';
        } else if (filterStatus === 'pending') {
          return p.status !== 'validated' && p.status !== 'cancelled';
        } else if (filterStatus === 'cancelled') {
          return p.status === 'cancelled';
        }
        return true;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const user = p.user_info;
        if (!user) return false;
        
        return (
          user.name?.toLowerCase().includes(query) ||
          user.last_name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.blood_type?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  };

  const filteredParticipants = getFilteredParticipants();

  const getStatusCounts = () => {
    return {
      all: participants.length,
      validated: participants.filter(p => p.status === 'validated').length,
      pending: participants.filter(p => p.status !== 'validated' && p.status !== 'cancelled').length,
      cancelled: participants.filter(p => p.status === 'cancelled').length,
    };
  };

  const statusCounts = getStatusCounts();
  const campaignActive = isCampaignActive();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="participants-container">
        <div className="loading-state">Cargando participantes...</div>
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="participants-container">
        <div className="error-state">
          <h2>Campaña no encontrada</h2>
          <p>La campaña que buscas no existe o fue eliminada.</p>
          <Link href="/admin/campaigns">
            <button className="btn-red">Volver a campañas</button>
          </Link>
        </div>
      </div>
    );
  }

  const locacion = Array.isArray(campaign.locacion) && campaign.locacion.length > 0 
    ? campaign.locacion[0] 
    : null;

  return (
    <div className="participants-container">
      <div className="participants-header">
        <Link href="/admin/campaigns" className="back-link">
          ← Volver a campañas
        </Link>
        
        <div className="campaign-summary">
          <div className="summary-main">
            <h1>{campaign.nombre}</h1>
            <div className="summary-badges">
              <span className={`campaign-status ${campaignActive ? 'active' : 'completed'}`}>
                {campaignActive ? '🔴 Activa' : '✓ Finalizada'}
              </span>
              <span className="campaign-type-badge">{campaign.tipo}</span>
            </div>
          </div>
          
          <div className="summary-details">
            <div className="detail-item">
              <span className="detail-icon">📍</span>
              <span>{locacion?.nombre || 'Sin ubicación'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-icon">📅</span>
              <span>{formatDate(campaign.fecha_inicio)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-icon">🩸</span>
              <span>{campaign.componente}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="participants-controls">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-number">{statusCounts.all}</div>
            <div className="stat-label">Total inscritos</div>
          </div>
          <div className="stat-card validated">
            <div className="stat-number">{statusCounts.validated}</div>
            <div className="stat-label">Validados</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{statusCounts.pending}</div>
            <div className="stat-label">Pendientes</div>
          </div>
          {statusCounts.cancelled > 0 && (
            <div className="stat-card cancelled">
              <div className="stat-number">{statusCounts.cancelled}</div>
              <div className="stat-label">Cancelados</div>
            </div>
          )}
        </div>

        <div className="filters-row">
          <input
            type="search"
            placeholder="Buscar por nombre, email o tipo de sangre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos ({statusCounts.all})</option>
            <option value="validated">Validados ({statusCounts.validated})</option>
            <option value="pending">Pendientes ({statusCounts.pending})</option>
            {statusCounts.cancelled > 0 && (
              <option value="cancelled">Cancelados ({statusCounts.cancelled})</option>
            )}
          </select>
        </div>
      </div>

      {filteredParticipants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No hay participantes</h3>
          <p>
            {searchQuery || filterStatus !== 'all'
              ? 'No se encontraron participantes con esos criterios'
              : 'Aún no hay personas inscritas en esta campaña'}
          </p>
        </div>
      ) : (
        <div className="participants-table-container">
          <table className="participants-table">
            <thead>
              <tr>
                <th>Participante</th>
                <th>Tipo de sangre</th>
                <th>Contacto</th>
                <th>Fecha de registro</th>
                <th>Estado</th>
                {campaignActive && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.map((participant) => {
                const user = participant.user_info;
                if (!user) return null;

                const isValidated = participant.status === 'validated';
                const isCancelled = participant.status === 'cancelled';

                return (
                  <tr key={participant.id}>
                    <td>
                      <div className="participant-name">
                        <div className="name-primary">
                          {user.name} {user.last_name}
                        </div>
                        <div className="name-secondary">{user.email}</div>
                      </div>
                    </td>
                    <td>
                      {user.blood_type ? (
                        <span className="blood-type-badge">{user.blood_type}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {user.phone || <span className="text-muted">Sin teléfono</span>}
                    </td>
                    <td className="text-muted">
                      {formatDate(participant.created_at)}
                    </td>
                    <td>
                      {isValidated ? (
                        <div className="status-cell">
                          <span className="status-badge validated">✓ Validado</span>
                          {participant.fecha_validacion && (
                            <span className="validation-date">
                              {formatDate(participant.fecha_validacion)}
                            </span>
                          )}
                        </div>
                      ) : isCancelled ? (
                        <span className="status-badge cancelled">✕ Cancelado</span>
                      ) : (
                        <span className="status-badge pending">Pendiente</span>
                      )}
                    </td>
                    {campaignActive && (
                      <td>
                        {!isValidated && !isCancelled ? (
                          <button
                            className="btn-validate"
                            onClick={() => openValidationModal(participant)}
                            disabled={validating === participant.id}
                          >
                            ✓ Validar
                          </button>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="results-count">
        Mostrando {filteredParticipants.length} de {participants.length} participantes
      </div>

      {/* Validation Modal */}
      {showModal && selectedParticipant && (
        <div className="modal-overlay" onClick={closeValidationModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Validar participación</h2>
              <button className="modal-close" onClick={closeValidationModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="participant-info">
                <div className="info-label">Participante:</div>
                <div className="info-value">
                  {selectedParticipant.user_info?.name} {selectedParticipant.user_info?.last_name}
                </div>
                <div className="info-secondary">
                  {selectedParticipant.user_info?.email}
                </div>
              </div>

              <form onSubmit={handleModalValidation}>
                <div className="modal-field">
                  <label htmlFor="modal-code">Código de validación</label>
                  <input
                    id="modal-code"
                    type="text"
                    value={validationCode}
                    onChange={handleCodeChange}
                    placeholder="EJ. X9A7Q2L1"
                    maxLength={4}
                    autoFocus
                    autoComplete="off"
                    disabled={validating === selectedParticipant.id}
                  />
                  <p className="modal-hint">
                    Ingresa el código de 4 caracteres del participante
                  </p>
                </div>

                {modalError && (
                  <div className="modal-error">
                    {modalError}
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={closeValidationModal}
                    disabled={validating === selectedParticipant.id}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-validate"
                    disabled={validating === selectedParticipant.id || !validationCode.trim()}
                  >
                    {validating === selectedParticipant.id ? 'Validando...' : '✓ Validar participación'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}