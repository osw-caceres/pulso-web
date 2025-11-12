'use client';

import { createClient } from "@/src/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import './location-form.css';

interface Entidad {
  id: string;
  nombre: string;
}

export default function CreateLocationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [loadingEntidades, setLoadingEntidades] = useState(true);

  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    latitud: '',
    longitud: '',
    mapLink: '',
    idEntidad: '',
  });

  // Fetch entities for dropdown
  useEffect(() => {
    fetchEntidades();
  }, []);

  const fetchEntidades = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('entidad')
        .select('id, nombre')
        .eq('status', 'activa')
        .order('nombre');

      if (error) {
        console.error('Error fetching entities:', error);
        return;
      }

      setEntidades(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoadingEntidades(false);
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
      setError('El nombre de la ubicación es obligatorio');
      return false;
    }

    if (!formData.direccion.trim()) {
      setError('La dirección es obligatoria');
      return false;
    }

    if (!formData.idEntidad) {
      setError('Debes seleccionar una entidad');
      return false;
    }

    // Validate coordinates if provided
    if (formData.latitud) {
      const lat = parseFloat(formData.latitud);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        setError('La latitud debe estar entre -90 y 90');
        return false;
      }
    }

    if (formData.longitud) {
      const lng = parseFloat(formData.longitud);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        setError('La longitud debe estar entre -180 y 180');
        return false;
      }
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

      const { error: insertError } = await supabase
        .from('locacion')
        .insert({
          nombre: formData.nombre.trim(),
          direccion: formData.direccion.trim(),
          latitud: formData.latitud ? parseFloat(formData.latitud) : null,
          longitud: formData.longitud ? parseFloat(formData.longitud) : null,
          map_link: formData.mapLink.trim() || null,
          id_entidad: formData.idEntidad,
          status: 'active',
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        setError('Error al crear la ubicación. Por favor intenta de nuevo.');
        return;
      }

      // Success - redirect back to locations list
      router.push('/admin/locations');
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="location-form-container">
      <div className="form-header">
        <Link href="/admin/locations" className="back-link">
          ← Volver a ubicaciones
        </Link>
        <h1>Crear nueva ubicación</h1>
        <p className="subtitle">
          Agrega una nueva ubicación donde se realizarán campañas de donación
        </p>
      </div>

      <div className="form-card">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Entity Selection */}
          <div className="form-section">
            <h2 className="section-title">Entidad responsable</h2>
            
            <div className="field">
              <label htmlFor="idEntidad">
                Organización / Entidad <span className="required">*</span>
              </label>
              <select
                id="idEntidad"
                name="idEntidad"
                value={formData.idEntidad}
                onChange={handleChange}
                disabled={loading || loadingEntidades}
                required
              >
                <option value="">Selecciona una entidad...</option>
                {entidades.map(entidad => (
                  <option key={entidad.id} value={entidad.id}>
                    {entidad.nombre}
                  </option>
                ))}
              </select>
              <p className="field-hint">
                Organización o institución que administra esta ubicación
              </p>
            </div>
          </div>

          {/* Location Details */}
          <div className="form-section">
            <h2 className="section-title">Información de la ubicación</h2>

            <div className="field">
              <label htmlFor="nombre">
                Nombre de la ubicación <span className="required">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Campus Central USAC"
                disabled={loading}
                required
              />
              <p className="field-hint">
                Nombre descriptivo del lugar donde se realizarán las donaciones
              </p>
            </div>

            <div className="field">
              <label htmlFor="direccion">
                Dirección completa <span className="required">*</span>
              </label>
              <textarea
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Ej: Ciudad Universitaria, Zona 12, Guatemala"
                rows={3}
                disabled={loading}
                required
              />
              <p className="field-hint">
                Dirección completa para que los donantes puedan ubicar el lugar
              </p>
            </div>
          </div>

          {/* Map & Coordinates */}
          <div className="form-section">
            <h2 className="section-title">Ubicación en el mapa (opcional)</h2>

            <div className="field-row">
              <div className="field">
                <label htmlFor="latitud">Latitud</label>
                <input
                  type="number"
                  id="latitud"
                  name="latitud"
                  value={formData.latitud}
                  onChange={handleChange}
                  placeholder="14.5907"
                  step="any"
                  min="-90"
                  max="90"
                  disabled={loading}
                />
              </div>

              <div className="field">
                <label htmlFor="longitud">Longitud</label>
                <input
                  type="number"
                  id="longitud"
                  name="longitud"
                  value={formData.longitud}
                  onChange={handleChange}
                  placeholder="-90.5554"
                  step="any"
                  min="-180"
                  max="180"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="mapLink">Enlace de Google Maps</label>
              <input
                type="url"
                id="mapLink"
                name="mapLink"
                value={formData.mapLink}
                onChange={handleChange}
                placeholder="https://maps.google.com/..."
                disabled={loading}
              />
              <p className="field-hint">
                URL del mapa para que los usuarios puedan obtener direcciones
              </p>
            </div>

            <div className="info-box">
              <strong>💡 Tip:</strong> Para obtener las coordenadas y el enlace del mapa:
              <ol>
                <li>Abre Google Maps y busca la ubicación</li>
                <li>Haz clic derecho en el lugar exacto</li>
                <li>Copia las coordenadas que aparecen arriba</li>
                <li>Haz clic en "Compartir" → "Copiar enlace"</li>
              </ol>
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <Link href="/admin/locations">
              <button type="button" className="btn-ghost" disabled={loading}>
                Cancelar
              </button>
            </Link>
            <button type="submit" className="btn-red" disabled={loading}>
              {loading ? 'Creando ubicación...' : 'Crear ubicación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}