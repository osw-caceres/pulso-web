'use client';

import { createClient } from "@/src/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [data, setData] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    birthday: '',
    height: '',
    weight: '',
    bloodType: '',
    lastDonation: '',
  });

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // If no user, redirect to register
        router.push('/register');
        return;
      }

      setUserId(user.id);
      
      // Pre-fill email from auth
      if (user.email) {
        setData(prev => ({ ...prev, email: user.email! }));
      }

      // Check if profile already exists
      const { data: profile } = await supabase
        .from('user_info')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Profile already exists, redirect to dashboard
        router.push('/');
      }
    };

    checkUser();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!data.name || !data.lastName || !data.bloodType) {
      setError('Por favor completa los campos obligatorios');
      return false;
    }

    if (data.phone && !/^\d{8}$/.test(data.phone.replace(/\D/g, ''))) {
      setError('El teléfono debe tener 8 dígitos');
      return false;
    }

    if (data.birthday) {
      const birthDate = new Date(data.birthday);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 18 || age > 65) {
        setError('Debes tener entre 18 y 65 años para donar sangre');
        return false;
      }
    }

    if (data.weight && parseFloat(data.weight) < 50) {
      setError('El peso mínimo para donar es 50 kg');
      return false;
    }

    return true;
  };

  const calculateNextDate = (lastDonationDate: string) => {
    if (!lastDonationDate) return null;
    
    const lastDonation = new Date(lastDonationDate);
    const nextDate = new Date(lastDonation);
    nextDate.setDate(nextDate.getDate() + 56); // 8 weeks
    
    return nextDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !userId) return;

    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      
      // Calculate next donation date if last donation is provided
      const nextDate = data.lastDonation ? calculateNextDate(data.lastDonation) : null;
      
      // Insert user profile
      const { error: insertError } = await supabase
        .from('user_info')
        .update({
          id: userId,
          name: data.name,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone || null,
          birthday: data.birthday || null,
          height: data.height ? parseFloat(data.height) : null,
          weight: data.weight ? parseFloat(data.weight) : null,
          blood_type: data.bloodType,
          next_date: nextDate,
          role: 'user',
          status: 'active',
          is_complete: true, // Mark profile as complete
        })
        .eq('id', userId);

      if (insertError) {
        console.error('Insert error:', insertError);
        setError('Error al crear el perfil. Por favor intenta de nuevo.');
        return;
      }

      // Success - redirect to dashboard
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error(error);
      setError('Ocurrió un error inesperado. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="card"
      role="main"
      aria-labelledby="profile-title"
      style={{
        width: "100%",
        maxWidth: "600px",
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
        id="profile-title"
        className="title"
        style={{
          textAlign: "center",
          fontWeight: 700,
          margin: "6px 0 8px",
          fontSize: "22px",
          color: "#2F3A3C",
        }}
      >
        Completa tu perfil
      </h1>

      <p style={{ 
        textAlign: "center", 
        fontSize: "14px", 
        color: "#6B7476",
        marginBottom: "18px" 
      }}>
        Paso 2 de 2: Información personal
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

      <form onSubmit={handleSubmit}>
        {/* Name row */}
        <div
          style={{
            display: "grid",
            gap: "14px",
            gridTemplateColumns: "1fr 1fr",
            marginBottom: "16px",
          }}
        >
          <div>
            <label
              htmlFor="name"
              style={{
                fontSize: "14px",
                color: "#6B7476",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Nombre *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="given-name"
              placeholder="Juan"
              required
              value={data.name}
              onChange={handleChange}
              disabled={loading}
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              style={{
                fontSize: "14px",
                color: "#6B7476",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Apellido *
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Pérez"
              required
              value={data.lastName}
              onChange={handleChange}
              disabled={loading}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div style={{ marginBottom: "16px" }}>
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
            value={data.email}
            readOnly
            disabled
            style={{
              ...inputStyle,
              background: "#f5f5f5",
              cursor: "not-allowed",
            }}
          />
        </div>

        {/* Phone */}
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="phone"
            style={{
              fontSize: "14px",
              color: "#6B7476",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Teléfono (opcional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="5555-5555"
            value={data.phone}
            onChange={handleChange}
            disabled={loading}
            style={inputStyle}
          />
        </div>

        {/* Birthday and Blood Type */}
        <div
          style={{
            display: "grid",
            gap: "14px",
            gridTemplateColumns: "1fr 1fr",
            marginBottom: "16px",
          }}
        >
          <div>
            <label
              htmlFor="birthday"
              style={{
                fontSize: "14px",
                color: "#6B7476",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Fecha de nacimiento (opcional)
            </label>
            <input
              id="birthday"
              name="birthday"
              type="date"
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              value={data.birthday}
              onChange={handleChange}
              disabled={loading}
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor="bloodType"
              style={{
                fontSize: "14px",
                color: "#6B7476",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Tipo de sangre *
            </label>
            <select
              id="bloodType"
              name="bloodType"
              required
              value={data.bloodType}
              onChange={handleChange}
              disabled={loading}
              style={inputStyle}
            >
              <option value="">Selecciona…</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>
        </div>

        {/* Height and Weight */}
        <div
          style={{
            display: "grid",
            gap: "14px",
            gridTemplateColumns: "1fr 1fr",
            marginBottom: "16px",
          }}
        >
          <div>
            <label
              htmlFor="height"
              style={{
                fontSize: "14px",
                color: "#6B7476",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Altura (cm) (opcional)
            </label>
            <input
              id="height"
              name="height"
              type="number"
              step="0.1"
              min="100"
              max="250"
              placeholder="170"
              value={data.height}
              onChange={handleChange}
              disabled={loading}
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor="weight"
              style={{
                fontSize: "14px",
                color: "#6B7476",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Peso (kg) (opcional)
            </label>
            <input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              min="50"
              max="200"
              placeholder="70"
              value={data.weight}
              onChange={handleChange}
              disabled={loading}
              style={inputStyle}
            />
            <p
              style={{
                fontSize: "12px",
                color: "#6B7476",
                marginTop: "4px",
              }}
            >
              Peso mínimo requerido: 50 kg
            </p>
          </div>
        </div>

        {/* Last Donation */}
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="lastDonation"
            style={{
              fontSize: "14px",
              color: "#6B7476",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Última donación (opcional)
          </label>
          <input
            id="lastDonation"
            name="lastDonation"
            type="date"
            max={new Date().toISOString().split('T')[0]}
            value={data.lastDonation}
            onChange={handleChange}
            disabled={loading}
            style={inputStyle}
          />
          <p
            style={{
              fontSize: "12px",
              color: "#6B7476",
              marginTop: "4px",
            }}
          >
            Nos ayuda a calcular tu próxima fecha disponible para donar.
          </p>
        </div>

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
          {loading ? 'Guardando...' : 'Completar registro'}
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #D9D9D9",
  borderRadius: "10px",
  fontSize: "16px",
};