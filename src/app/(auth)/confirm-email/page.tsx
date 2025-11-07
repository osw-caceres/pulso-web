'use client';

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<main style={{padding: 24, textAlign: "center"}}>Cargando…</main>}>
      <ConfirmEmailContent />
    </Suspense>
  );
}

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <main
      className="card"
      role="main"
      aria-labelledby="confirm-title"
      style={{
        width: "100%",
        maxWidth: "500px",
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0,0,0,.08)",
        padding: "32px 28px",
        margin: "auto",
        textAlign: "center",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "80px",
          height: "80px",
          margin: "0 auto 20px",
          background: "rgba(229, 57, 53, 0.1)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#E53935"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      </div>

      {/* Brand */}
      <div
        className="logo"
        aria-label="Pulso"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          justifyContent: "center",
          marginBottom: "20px",
          userSelect: "none",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden="true">
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
            fontSize: "24px",
          }}
        >
          Pulso
        </div>
      </div>

      <h1
        id="confirm-title"
        style={{
          fontWeight: 700,
          margin: "0 0 12px",
          fontSize: "24px",
          color: "#2F3A3C",
        }}
      >
        ¡Revisa tu correo!
      </h1>

      <p
        style={{
          fontSize: "16px",
          color: "#6B7476",
          lineHeight: "1.6",
          marginBottom: "24px",
        }}
      >
        Hemos enviado un correo de confirmación a:
      </p>

      {email && (
        <div
          style={{
            background: "#FAF7F2",
            border: "1px solid #E6E6E6",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "24px",
            fontWeight: 600,
            color: "#2F3A3C",
            wordBreak: "break-all",
          }}
        >
          {email}
        </div>
      )}

      <div
        style={{
          background: "rgba(229, 57, 53, 0.05)",
          border: "1px solid rgba(229, 57, 53, 0.2)",
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "24px",
          textAlign: "left",
        }}
      >
        <p
          style={{
            fontSize: "14px",
            color: "#2F3A3C",
            margin: "0 0 8px",
            fontWeight: 600,
          }}
        >
          📧 Pasos a seguir:
        </p>
        <ol
          style={{
            fontSize: "14px",
            color: "#6B7476",
            lineHeight: "1.6",
            margin: "0",
            paddingLeft: "20px",
          }}
        >
          <li>Abre tu bandeja de entrada</li>
          <li>Busca el correo de Pulso</li>
          <li>Haz clic en el enlace de confirmación</li>
          <li>Inicia sesión y completa tu perfil</li>
        </ol>
      </div>

      <p
        style={{
          fontSize: "14px",
          color: "#6B7476",
          marginBottom: "20px",
        }}
      >
        Si no ves el correo, revisa tu carpeta de spam o correo no deseado.
      </p>

      <Link
        href="/login"
        style={{
          display: "inline-block",
          width: "100%",
          padding: "12px 14px",
          borderRadius: "10px",
          border: "none",
          color: "#fff",
          background: "#E53935",
          fontWeight: 700,
          textDecoration: "none",
          boxShadow: "0 6px 18px rgba(229,57,53,.25)",
          fontSize: "16px",
          transition: "all 0.2s ease",
        }}
      >
        Ir a iniciar sesión
      </Link>

      <div
        style={{
          marginTop: "20px",
          paddingTop: "20px",
          borderTop: "1px solid #E6E6E6",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            color: "#6B7476",
            margin: 0,
          }}
        >
          ¿Necesitas ayuda?{" "}
          <a
            href="mailto:soporte@pulso.com"
            style={{
              color: "#E53935",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Contáctanos
          </a>
        </p>
      </div>
    </main>
  );
}
