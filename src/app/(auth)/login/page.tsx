'use client';

import { createClient } from "@/src/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [data, setData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      const { data: userData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (userData.user) {
        // Redirect to dashboard after successful login
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      setError('Ocurrió un error inesperado. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
  };

  return (
    <main
      className="card"
      role="main"
      aria-labelledby="login-title"
      style={{
        width: "100%",
        maxWidth: "420px",
        background: "#FFFFFF",
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
          marginBottom: "18px",
          userSelect: "none",
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 64 64"
          aria-hidden="true"
        >
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
          style={{ fontWeight: 700, letterSpacing: ".2px", fontSize: "28px" }}
        >
          Pulso
        </div>
      </div>

      <h1
        id="login-title"
        className="title"
        style={{
          textAlign: "center",
          fontWeight: 700,
          margin: "6px 0 18px",
          fontSize: "20px",
          color: "#2F3A3C",
        }}
      >
        Iniciar sesión
      </h1>

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

      {/* Login form */}
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
            autoComplete="current-password"
            placeholder="••••••••"
            value={data.password}
            onChange={handleChange}
            required
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

        <div
          className="options"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <Link
            href="/forgot-password"
            style={{
              color: "#E53935",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button
          type="submit"
          className="btn"
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
          {loading ? 'Cargando...' : 'Entrar'}
        </button>
      </form>

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

      <p
        id="login-help"
        className="signup"
        style={{ marginTop: "10px", textAlign: "center", fontSize: "14px" }}
      >
        ¿No tienes cuenta?{" "}
        <Link
          href="/register"
          style={{
            color: "#E53935",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Regístrate
        </Link>
      </p>
    </main>
  );
}
