'use client';

import { createClient } from "@/src/lib/supabase/client";
import { useState, useEffect } from "react";
import Link from "next/link";
import './validate.css';

interface Campaign {
  id: string;
  nombre: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  status: string;
}

export default function ValidatePage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [validationCode, setValidationCode] = useState('');
  const [result, setResult] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [params.id]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('campaña')
        .select('id, nombre, tipo, fecha_inicio, fecha_fin, status')
        .eq('id', params.id)
        .single();

      if (error || !data) {
        console.error('Error fetching campaign:', error);
        setNotFound(true);
        return;
      }

      setCampaign(data);
    } catch (error) {
      console.error('Unexpected error:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validationCode.trim()) {
      setResult({
        type: 'error',
        message: 'Por favor ingresa un código de validación'
      });
      return;
    }

    try {
      setValidating(true);
      setResult({ type: null, message: '' });
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setResult({
          type: 'error',
          message: 'Debes iniciar sesión para validar tu participación'
        });
        return;
      }

      // Find registration with matching code, user, and campaign
      const { data: registro, error: fetchError } = await supabase
        .from('registro')
        .select('id, status, validation_code')
        .eq('id_usuario', user.id)
        .eq('id_campana', params.id)
        .eq('validation_code', validationCode.trim().toUpperCase())
        .single();

      if (fetchError || !registro) {
        console.error('Fetch error:', fetchError);
        setResult({
          type: 'error',
          message: '❌ Código no válido. Verifica e intenta nuevamente.'
        });
        return;
      }

      // Check if already validated
      if (registro.status === 'validated') {
        setResult({
          type: 'error',
          message: 'Esta participación ya fue validada anteriormente'
        });
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
        setResult({
          type: 'error',
          message: 'Error al validar. Por favor intenta de nuevo.'
        });
        return;
      }

      // Success
      setResult({
        type: 'success',
        message: '✅ ¡Código válido! Tu participación ha sido confirmada exitosamente.'
      });
      setValidationCode('');

      // Redirect to profile after 3 seconds
      setTimeout(() => {
        window.location.href = '/profile';
      }, 3000);

    } catch (error) {
      console.error('Unexpected error:', error);
      setResult({
        type: 'error',
        message: 'Ocurrió un error inesperado. Por favor intenta de nuevo.'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase and limit to 8 characters
    const value = e.target.value.toUpperCase().slice(0, 8);
    setValidationCode(value);
  };

  if (loading) {
    return (
      <div className="validate-container">
        <div className="validate-card">
          <div className="loading-message">Cargando campaña...</div>
        </div>
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="validate-container">
        <div className="validate-card">
          <div className="error-state">
            <h1>Campaña no encontrada</h1>
            <p>La campaña que buscas no existe o fue eliminada.</p>
            <Link href="/campaigns">
              <button className="btn-ghost">Ver campañas</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="validate-container">
      <div className="validate-card">
        <div className="validate-header">
          <div className="icon-circle">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1>Validación de participación</h1>
          <p className="subtitle">
            Campaña: <strong>{campaign.nombre}</strong>
          </p>
        </div>

        <form onSubmit={handleValidate} className="validate-form">
          <div className="field">
            <label htmlFor="code">Código de validación</label>
            <input
              id="code"
              type="text"
              value={validationCode}
              onChange={handleCodeChange}
              placeholder="EJ. X9A7Q2L1"
              maxLength={8}
              disabled={validating}
              required
              autoComplete="off"
            />
            <p className="field-hint">
              Ingresa el código de 8 caracteres proporcionado por el personal
            </p>
          </div>

          <button type="submit" className="btn-red" disabled={validating}>
            {validating ? 'Validando...' : 'Validar participación'}
          </button>
        </form>

        {result.type && (
          <div className={`result-message ${result.type}`}>
            {result.message}
          </div>
        )}

        <div className="validate-actions">
          <Link href="/campaigns">
            <button className="btn-ghost">Ver otras campañas</button>
          </Link>
        </div>

        <div className="info-box">
          <strong>ℹ️ ¿Cómo obtener tu código?</strong>
          <ul>
            <li>El personal de la campaña te proporcionará un código único al finalizar tu donación</li>
            <li>Cada código solo puede usarse una vez</li>
            <li>Ingresa el código exactamente como te lo dieron</li>
          </ul>
        </div>
      </div>
    </div>
  );
}