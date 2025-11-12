'use client';

import { createClient } from "@/src/lib/supabase/client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import '../../create/location-form.css';

interface Entidad {
  id: string;
  nombre: string;
}

interface Locacion {
  id: string;
  nombre: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  map_link: string | null;
  status: string;
  id_entidad: string;
}

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
   const routeParams = useParams<{ id: string | string[] }>();
  const id = Array.isArray(routeParams.id) ? routeParams.id[0] : routeParams.id; 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    latitud: '',
    longitud: '',
    mapLink: '',
    idEntidad: '',
    status: 'active',
  });

  // Fetch location data and entities
  useEffect(() => {
    fetchData(id);
  }, [id]);

  const fetchData = async (locId: string) => {
    try {
      setLoadingData(true);
      const supabase = createClient();

      // Fetch location
      const { data: location, error: locationError } = await supabase
        .from('locacion')
        .select('*')
        .eq('id', locId)
        .single();

      if (locationError || !location) {
        console.error('Error fetching location:', locationError);
        setNotFound(true);
        return;
      }

      // Set form data
      setFormData({
        nombre: location.nombre || '',
        direccion: location.direccion || '',
        latitud: location.latitud ? location.latitud.toString() : '',
        longitud: location.longitud ? location.longitud.toString() : '',
        mapLink: location.map_link || '',
        idEntidad: location.id_entidad || '',
        status: location.status || 'active',
      });

      // Fetch entities
      const { data: entidadesData, error: entidadesError } = await supabase
        .from('entidad')
        .select('id, nombre')
        .eq('status', 'activa')
        .order('nombre');

      if (entidadesError) {
        console.error('Error fetching entities:', entidadesError);
        return;
      }

      setEntidades(entidadesData || []);
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

      const { error: updateError } = await supabase
        .from('locacion')
        .update({
          nombre: formData.nombre.trim(),
          direccion: formData.direccion.trim(),
          latitud: formData.latitud ? parseFloat(formData.latitud) : null,
          longitud: formData.longitud ? parseFloat(formData.longitud) : null,
          map_link: formData.mapLink.trim() || null,
          id_entidad: formData.idEntidad,
          status: formData.status,
        })
        .eq('id', id);

      if (updateError) {
        console.error('Update error:', updateError);
        setError('Error al actualizar la ubicación. Por favor intenta de nuevo.');
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

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta ubicación? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from('locacion')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        setError('Error al eliminar la ubicación. Puede estar en uso por campañas.');
        return;
      }

      // Success - redirect to list
      router.push('/admin/locations');
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="location-form-container">
        <div className="loading-state" style={{ textAlign: 'center', padding: '60px' }}>
          Cargando ubicación...
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="location-form-container">
        <div className="error-state" style={{ textAlign: 'center', padding: '60px' }}>
          <h2>Ubicación no encontrada</h2>
          <p>La ubicación que buscas no existe o fue eliminada.</p>
          <Link href="/admin/locations">
            <button className="btn-red">Volver a ubicaciones</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="location-form-container">
      <div className="form-header">
        <Link href="/admin/locations" className="back-link">
          ← Volver a ubicaciones
        </Link>
        <h1>Editar ubicación</h1>
        <p className="subtitle">
          Actualiza la información de esta ubicación
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
                disabled={loading}
                required
              >
                <option value="">Selecciona una entidad...</option>
                {entidades.map(entidad => (
                  <option key={entidad.id} value={entidad.id}>
                    {entidad.nombre}
                  </option>
                ))}
              </select>
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
                <option value="inactive">Inactiva</option>
              </select>
              <p className="field-hint">
                Las ubicaciones inactivas no aparecerán en la búsqueda de campañas
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
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-danger" 
              onClick={handleDelete}
              disabled={loading}
            >
              Eliminar ubicación
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
              <Link href="/admin/locations">
                <button type="button" className="btn-ghost" disabled={loading}>
                  Cancelar
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