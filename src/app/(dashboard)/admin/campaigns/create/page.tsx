'use client';

import { createClient } from "@/src/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import './campaign-form.css';

interface Locacion {
  id: string;
  nombre: string;
  direccion: string;
  entidad: {
    nombre: string;
  }[] | null;
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
  { value: 'A+', label: 'A+'},
  { value: 'A-', label: 'A-'},
  { value: 'B+', label: 'B+'},
  { value: 'B-', label: 'B-'},
  { value: 'AB+', label: 'AB+'},
  { value: 'AB-', label: 'AB-'},
  { value: 'O+', label: 'O+'},
  { value: 'O-', label: 'O-'},
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locaciones, setLocaciones] = useState<Locacion[]>([]);
  const [loadingLocaciones, setLoadingLocaciones] = useState(true);

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
  });

  useEffect(() => {
    fetchLocaciones();
  }, []);

  const fetchLocaciones = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
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

      if (error) {
        console.error('Error fetching locations:', error);
        return;
      }

      setLocaciones(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoadingLocaciones(false);
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

    const now = new Date();
    if (inicio < now) {
      setError('La fecha de inicio debe ser en el futuro');
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

      const { error: insertError } = await supabase
        .from('campana')
        .insert({
          nombre: formData.nombre.trim(),
          tipo: formData.tipo,
          componente: formData.componente,
          descripcion: formData.descripcion.trim() || null,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          id_locacion: formData.idLocacion,
          status: 'active',
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        setError('Error al crear la campaña. Por favor intenta de nuevo.');
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

  return (
    <div className="campaign-form-container">
      <div className="form-header">
        <Link href="/admin/campaigns" className="back-link">
          ← Volver a campañas
        </Link>
        <h1>Crear nueva campaña</h1>
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
              <p className="field-hint">
                Nombre descriptivo que identifique esta campaña
              </p>
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
                disabled={loading || loadingLocaciones}
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
              <p className="field-hint">
                Si no encuentras la ubicación, <Link href="/admin/locations/create" target="_blank" style={{ color: 'var(--pulso-red)', fontWeight: 600 }}>créala primero aquí</Link>
              </p>
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
                    min={new Date().toISOString().split('T')[0]}
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
                    min={formData.fechaInicio || new Date().toISOString().split('T')[0]}
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

          <div className="form-actions">
            <Link href="/admin/campaigns">
              <button type="button" className="btn-ghost" disabled={loading}>
                Cancelar
              </button>
            </Link>
            <button type="submit" className="btn-red" disabled={loading}>
              {loading ? 'Creando campaña...' : 'Crear campaña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}