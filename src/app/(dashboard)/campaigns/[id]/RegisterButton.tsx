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

      // Generate unique validation code
      const generateValidationCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar characters
        let code = '';
        for (let i = 0; i < 4; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      const validationCode = generateValidationCode();

      // Insert registration with validation code
      const { error: insertError } = await supabase
        .from('registro')
        .insert({
          id_usuario: userId,
          id_campana: campaignId,
          status: 'inscrita',
          validation_code: validationCode,
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