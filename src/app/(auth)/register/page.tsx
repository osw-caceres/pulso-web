'use client';

import { createClient } from "@/src/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [data, setData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!data.email || !data.password || !data.confirmPassword) {
      setError('Por favor completa todos los campos');
      return false;
    }

    if (data.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    if (data.password !== data.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones');
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
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (authData.user) {
        // Redirect to complete profile page
        router.push('/register/complete-profile');
      }
    } catch (error) {
      console.error(error);
      setError('Ocurrió un error inesperado. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = data.password && data.confirmPassword && data.password === data.confirmPassword;
  const passwordsDontMatch = data.password && data.confirmPassword && data.password !== data.confirmPassword;

  return (
    <main
      className="card"
      role="main"
      aria-labelledby="signup-title"
      style={{
        width: "100%",
        maxWidth: "460px",
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0,0,0,.08)",
        padding: "28px",
        margin: "auto",
      }}
    >
      {/* Brand */}
      <div
        className="logo"
        aria-label="Pulso"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          justifyContent: "center",
          marginBottom: "12px",
          userSelect: "none",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 64 64" aria-hidden="true">
          <path
            d="M32 6c9.5 12.7 22 23.2 22 36 0 12-9.8 22-22 22S10 54 10 42C10 29.2 22.5 18.7 32 6Z"
            fill="#E53935"
          />
          <path
            d="M15 39h10.2c.8 0 1.6-.5 1.9-1.3l3.7-9.4 5.5 16.1c.3.8 1 1.3 1.8 1.3h9.9"
            stroke="#fff"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <div
          className="logo-name"
          style={{
            fontWeight: 700,
            letterSpacing: ".2px",
            fontSize: "28px",
          }}
        >
          Pulso
        </div>
      </div>

      <h1
        id="signup-title"
        className="title"
        style={{
          textAlign: "center",
          fontWeight: 700,
          margin: "6px 0 8px",
          fontSize: "22px",
          color: "#2F3A3C",
        }}
      >
        Crear cuenta
      </h1>

      <p style={{ 
        textAlign: "center", 
        fontSize: "14px", 
        color: "#6B7476",
        marginBottom: "18px" 
      }}>
        Paso 1 de 2: Información de acceso
      </p>

      {/* Error message */}
      {error && (
        <div
          style={{
            background: "#FEE",
            border: "1px solid #FCC",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
            color: "#C00",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* Registration form */}
      <form onSubmit={handleSubmit}>
        <div className="field" style={{ marginBottom: "16px" }}>
          <label
            htmlFor="email"
            style={{
              fontSize: "14px",
              color: "#6B7476",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            required
            value={data.email}
            onChange={handleChange}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "1px solid #D9D9D9",
              borderRadius: "10px",
              fontSize: "16px",
            }}
          />
        </div>

        <div className="field" style={{ marginBottom: "12px" }}>
          <label
            htmlFor="password"
            style={{
              fontSize: "14px",
              color: "#6B7476",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
            value={data.password}
            onChange={handleChange}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "1px solid #D9D9D9",
              borderRadius: "10px",
              fontSize: "16px",
            }}
          />
          <p
            style={{
              fontSize: "12px",
              color: "#6B7476",
              marginTop: "4px",
            }}
          >
            Usa mayúsculas, minúsculas y números.
          </p>
        </div>

        <div className="field" style={{ marginBottom: "16px" }}>
          <label
            htmlFor="confirmPassword"
            style={{
              fontSize: "14px",
              color: "#6B7476",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={data.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "1px solid #D9D9D9",
              borderRadius: "10px",
              fontSize: "16px",
            }}
          />
          {passwordsMatch && (
            <p style={{ fontSize: "13px", color: "#22c55e", marginTop: "4px" }}>
              ✓ Las contraseñas coinciden
            </p>
          )}
          {passwordsDontMatch && (
            <p style={{ fontSize: "13px", color: "#ef4444", marginTop: "4px" }}>
              ✗ Las contraseñas no coinciden
            </p>
          )}
        </div>

        {/* Terms */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            fontSize: "14px",
            marginBottom: "20px",
            cursor: "pointer",
          }}
        >
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            disabled={loading}
            style={{ marginTop: "3px", cursor: "pointer" }}
          />
          <span>
            Acepto los{" "}
            <a
              href="#"
              style={{
                color: "#E53935",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Términos y Condiciones
            </a>{" "}
            y la{" "}
            <a
              href="#"
              style={{
                color: "#E53935",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Política de Privacidad
            </a>
            .
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            display: "inline-block",
            width: "100%",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "none",
            color: "#fff",
            background: loading ? "#CCC" : "#E53935",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 6px 18px rgba(229,57,53,.25)",
            fontSize: "16px",
            transition: "all 0.2s ease",
          }}
        >
          {loading ? 'Creando cuenta...' : 'Continuar'}
        </button>
      </form>

      {/* Divider */}
      <div
        className="divider"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: "10px",
          margin: "20px 0",
          color: "#6B7476",
          fontSize: "14px",
        }}
      >
        <span style={{ height: "1px", background: "#ececec" }}></span>
        o
        <span style={{ height: "1px", background: "#ececec" }}></span>
      </div>

      {/* Link to login */}
      <p
        style={{
          textAlign: "center",
          fontSize: "14px",
          marginTop: "6px",
        }}
      >
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          style={{
            color: "#E53935",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
