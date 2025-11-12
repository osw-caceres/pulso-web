'use client';

import { createClient } from "@/src/lib/supabase/client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import '../../create/campaign-form.css';

interface Locacion {
  id: string;
  nombre: string;
  direccion: string;
  entidad: {
    nombre: string;
  }[] | null;
}

interface Campaign {
  id: string;
  nombre: string;
  tipo: string;
  componente: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  status: string;
  id_locacion: string;
}

const CAMPAIGN_TYPES = [
  { value: 'Jornada', label: 'Jornada - Evento especial de donación' },
  { value: 'Emergencia', label: 'Emergencia - Colecta urgente' },
  { value: 'Regular', label: 'Regular - Donación habitual' },
];

const DONATION_COMPONENTS = [
  { value: 'Sangre total', label: 'Sangre total' },
  { value: 'Plaquetas', label: 'Plaquetas' },
  { value: 'Plasma', label: 'Plasma' },
  { value: 'Glóbulos rojos', label: 'Glóbulos rojos' },
];

export default function EditCampaignPage({ params }: { params: { id: string } }) {
  const router = useRouter();
     const routeParams = useParams<{ id: string | string[] }>();
    const id = Array.isArray(routeParams.id) ? routeParams.id[0] : routeParams.id; 
    
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locaciones, setLocaciones] = useState<Locacion[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: '',
    componente: '',
    descripcion: '',
    fechaInicio: '',
    horaInicio: '',
    fechaFin: '',
    horaFin: '',
    idLocacion: '',
    status: 'active',
  });

  useEffect(() => {
    fetchData(id);
  }, [id]);

  const fetchData = async (campId: string) => {
    try {
      setLoadingData(true);
      const supabase = createClient();

      // Fetch campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campana')
        .select('*')
        .eq('id', campId)
        .single();

      if (campaignError || !campaign) {
        console.error('Error fetching campaign:', campaignError);
        setNotFound(true);
        return;
      }

      // Parse dates
      const fechaInicio = new Date(campaign.fecha_inicio);
      const fechaFin = new Date(campaign.fecha_fin);

      // Format dates for input fields
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const formatTime = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      setFormData({
        nombre: campaign.nombre || '',
        tipo: campaign.tipo || '',
        componente: campaign.componente || '',
        descripcion: campaign.descripcion || '',
        fechaInicio: formatDate(fechaInicio),
        horaInicio: formatTime(fechaInicio),
        fechaFin: formatDate(fechaFin),
        horaFin: formatTime(fechaFin),
        idLocacion: campaign.id_locacion || '',
        status: campaign.status || 'active',
      });

      // Fetch locations
      const { data: locacionesData, error: locacionesError } = await supabase
        .from('locacion')
        .select(`
          id,
          nombre,
          direccion,
          entidad (
            nombre
          )
        `)
        .eq('status', 'active')
        .order('nombre');

      if (locacionesError) {
        console.error('Error fetching locations:', locacionesError);
        return;
      }

      setLocaciones(locacionesData || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      setNotFound(true);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre de la campaña es obligatorio');
      return false;
    }

    if (!formData.tipo) {
      setError('Debes seleccionar un tipo de campaña');
      return false;
    }

    if (!formData.componente) {
      setError('Debes seleccionar un tipo de donación');
      return false;
    }

    if (!formData.idLocacion) {
      setError('Debes seleccionar una ubicación');
      return false;
    }

    if (!formData.fechaInicio || !formData.horaInicio) {
      setError('La fecha y hora de inicio son obligatorias');
      return false;
    }

    if (!formData.fechaFin || !formData.horaFin) {
      setError('La fecha y hora de fin son obligatorias');
      return false;
    }

    const inicio = new Date(`${formData.fechaInicio}T${formData.horaInicio}`);
    const fin = new Date(`${formData.fechaFin}T${formData.horaFin}`);

    if (fin <= inicio) {
      setError('La fecha/hora de fin debe ser posterior a la de inicio');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const fechaInicio = new Date(`${formData.fechaInicio}T${formData.horaInicio}`).toISOString();
      const fechaFin = new Date(`${formData.fechaFin}T${formData.horaFin}`).toISOString();

      const { error: updateError } = await supabase
        .from('campana')
        .update({
          nombre: formData.nombre.trim(),
          tipo: formData.tipo,
          componente: formData.componente,
          descripcion: formData.descripcion.trim() || null,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          id_locacion: formData.idLocacion,
          status: formData.status,
        })
        .eq('id', id);

      if (updateError) {
        console.error('Update error:', updateError);
        setError('Error al actualizar la campaña. Por favor intenta de nuevo.');
        return;
      }

      router.push('/admin/campaigns');
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta campaña? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from('campana')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        setError('Error al eliminar la campaña. Puede tener registros asociados.');
        return;
      }

      router.push('/admin/campaigns');
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('¿Deseas cancelar esta campaña? Esto la marcará como inactiva.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('campana')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (updateError) {
        console.error('Cancel error:', updateError);
        setError('Error al cancelar la campaña.');
        return;
      }

      router.push('/admin/campaigns');
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="campaign-form-container">
        <div className="loading-state" style={{ textAlign: 'center', padding: '60px' }}>
          Cargando campaña...
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="campaign-form-container">
        <div className="error-state" style={{ textAlign: 'center', padding: '60px' }}>
          <h2>Campaña no encontrada</h2>
          <p>La campaña que buscas no existe o fue eliminada.</p>
          <Link href="/admin/campaigns">
            <button className="btn-red">Volver a campañas</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-form-container">
      <div className="form-header">
        <Link href="/admin/campaigns" className="back-link">
          ← Volver a campañas
        </Link>
        <h1>Editar campaña</h1>
        <p className="subtitle">
          Actualiza la información de esta campaña
        </p>
      </div>

      <div className="form-card">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2 className="section-title">Información básica</h2>

            <div className="field">
              <label htmlFor="nombre">
                Nombre de la campaña <span className="required">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Jornada Solidaria USAC 2025"
                disabled={loading}
                required
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="tipo">
                  Tipo de campaña <span className="required">*</span>
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  disabled={loading}
                  required
                >
                  <option value="">Selecciona un tipo...</option>
                  {CAMPAIGN_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="componente">
                  Tipo de donación <span className="required">*</span>
                </label>
                <select
                  id="componente"
                  name="componente"
                  value={formData.componente}
                  onChange={handleChange}
                  disabled={loading}
                  required
                >
                  <option value="">Selecciona un componente...</option>
                  {DONATION_COMPONENTS.map(comp => (
                    <option key={comp.value} value={comp.value}>
                      {comp.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="descripcion">
                Descripción (opcional)
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describe los detalles de esta campaña..."
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="field">
              <label htmlFor="status">Estado</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="active">Activa</option>
                <option value="cancelled">Cancelada</option>
                <option value="completed">Completada</option>
              </select>
              <p className="field-hint">
                Las campañas inactivas no aparecerán en la búsqueda pública
              </p>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Ubicación</h2>

            <div className="field">
              <label htmlFor="idLocacion">
                Lugar donde se realizará <span className="required">*</span>
              </label>
              <select
                id="idLocacion"
                name="idLocacion"
                value={formData.idLocacion}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="">Selecciona una ubicación...</option>
                {locaciones.map(loc => {
                  const entidad = Array.isArray(loc.entidad) && loc.entidad.length > 0 ? loc.entidad[0] : null;
                  return (
                    <option key={loc.id} value={loc.id}>
                      {loc.nombre} {entidad ? `- ${entidad.nombre}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Fecha y horario</h2>

            <div className="field-group">
              <h3 className="field-group-title">Inicio</h3>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="fechaInicio">
                    Fecha <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="fechaInicio"
                    name="fechaInicio"
                    value={formData.fechaInicio}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="horaInicio">
                    Hora <span className="required">*</span>
                  </label>
                  <input
                    type="time"
                    id="horaInicio"
                    name="horaInicio"
                    value={formData.horaInicio}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="field-group">
              <h3 className="field-group-title">Fin</h3>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="fechaFin">
                    Fecha <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="fechaFin"
                    name="fechaFin"
                    value={formData.fechaFin}
                    onChange={handleChange}
                    min={formData.fechaInicio}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="horaFin">
                    Hora <span className="required">*</span>
                  </label>
                  <input
                    type="time"
                    id="horaFin"
                    name="horaFin"
                    value={formData.horaFin}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                className="btn-danger" 
                onClick={handleDelete}
                disabled={loading}
              >
                Eliminar
              </button>
              {formData.status === 'active' && (
                <button 
                  type="button" 
                  className="btn-warning" 
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar campaña
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href="/admin/campaigns">
                <button type="button" className="btn-ghost" disabled={loading}>
                  Volver
                </button>
              </Link>
              <button type="submit" className="btn-red" disabled={loading}>
                {loading ? 'Guardando cambios...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}