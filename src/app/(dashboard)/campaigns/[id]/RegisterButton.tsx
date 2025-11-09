'use client';

import { createClient } from '@/src/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function RegisterButton({ 
  campaignId, 
  userId 
}: { 
  campaignId: string; 
  userId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Insert registration
      const { error: insertError } = await supabase
        .from('registro')
        .insert({
          id_usuario: userId,
          id_campana: campaignId,
          status: 'inscrita',
        });

      if (insertError) {
        console.error('Registration error:', insertError);
        setError('Error al inscribirse. Por favor intenta de nuevo.');
        return;
      }

      // Success - refresh page to show new status
      router.refresh();
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-section">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <button
        onClick={handleRegister}
        disabled={loading}
        className="btn-register"
      >
        {loading ? 'Inscribiendo...' : 'Inscribirse en esta campaña'}
      </button>
      <p className="register-note">
        Al inscribirte, confirmas que cumples con todos los requisitos para donar sangre.
      </p>
    </div>
  );
}