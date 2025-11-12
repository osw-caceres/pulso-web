'use client';

import { useState } from 'react';
import './help.css';

export default function HelpPage() {
  const [formData, setFormData] = useState({ email: '', asunto: '', mensaje: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitted(true);
    setSubmitting(false);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ email: '', asunto: '', mensaje: '' });
    }, 3000);
  };

  const handleReset = () => {
    setFormData({ email: '', asunto: '', mensaje: '' });
    setSubmitted(false);
  };

  return (
    <div className="help-container">
      <section className="help-header">
        <h1>Ayuda, dudas y preguntas frecuentes</h1>
      </section>

      <div className="help-grid">
        {/* FAQs Section */}
        <section className="card faqs-section" aria-label="Preguntas frecuentes">
          <h2 className="section-title">Preguntas frecuentes</h2>

          {/* Donación y elegibilidad */}
          <h3 className="subsection-title">Donación y elegibilidad</h3>
          <div className="faq-list" role="list">
            <details className="faq-item">
              <summary>¿Cada cuánto puedo donar sangre?</summary>
              <div className="answer">
                Para <strong>sangre total</strong>, generalmente cada <strong>56 días</strong>. 
                Para <strong>plaquetas</strong>, los intervalos pueden ser menores según evaluación médica.
              </div>
            </details>

            <details className="faq-item">
              <summary>¿Qué requisitos básicos debo cumplir?</summary>
              <div className="answer">
                Edad 18–65 años, peso ≥ 50 kg, buen estado de salud, sin fiebre o infecciones recientes. 
                Lleva tu DPI y descansa 6–8 horas antes.
              </div>
            </details>

            <details className="faq-item">
              <summary>¿Puedo donar si desayuné?</summary>
              <div className="answer">
                Sí, recomendamos un desayuno <strong>ligero y bajo en grasa</strong>. 
                Mantén hidratación adecuada.
              </div>
            </details>
          </div>

          {/* Inscripciones y reservas */}
          <h3 className="subsection-title">Inscripciones y reservas</h3>
          <div className="faq-list">
            <details className="faq-item">
              <summary>¿Cómo me inscribo a una campaña?</summary>
              <div className="answer">
                Desde <em>Buscar campañas</em>, selecciona una campaña y haz clic en <strong>Inscribirse</strong>. 
                Verás la confirmación en tu historial y recibirás un correo de confirmación.
              </div>
            </details>

            <details className="faq-item">
              <summary>¿Cómo sé cuántos cupos quedan?</summary>
              <div className="answer">
                En los detalles de la campaña verás el conteo de reservas y el estado del aforo cuando aplique.
              </div>
            </details>

            <details className="faq-item">
              <summary>¿Puedo cancelar o cambiar mi turno?</summary>
              <div className="answer">
                Sí, hasta 24 h antes del inicio. Busca la campaña en tu historial y contacta al organizador 
                si necesitas hacer cambios.
              </div>
            </details>
          </div>

          {/* Validación y comprobantes */}
          <h3 className="subsection-title">Validación y comprobantes</h3>
          <div className="faq-list">
            <details className="faq-item">
              <summary>¿Qué es el código de validación?</summary>
              <div className="answer">
                Es un código que confirma tu participación el día de la campaña. Lo ingresa el personal 
                del centro de donación para validar que completaste tu donación.
              </div>
            </details>

            <details className="faq-item">
              <summary>Mi estado dice "Inscrito" y no "Validado", ¿qué hago?</summary>
              <div className="answer">
                Pide al personal que valide tu participación. Una vez validada, tu donación aparecerá 
                como "Completada" en tu historial.
              </div>
            </details>
          </div>

          {/* Cuenta y perfil */}
          <h3 className="subsection-title">Cuenta y perfil</h3>
          <div className="faq-list">
            <details className="faq-item">
              <summary>¿Cómo actualizo mi tipo de sangre o datos personales?</summary>
              <div className="answer">
                Ve a <em>Perfil</em> → <strong>Modificar datos de perfil</strong>. 
                Algunos cambios pueden requerir verificación.
              </div>
            </details>

            <details className="faq-item">
              <summary>Olvidé mi contraseña</summary>
              <div className="answer">
                Usa <em>¿Olvidaste tu contraseña?</em> en la pantalla de inicio de sesión 
                para restablecerla vía correo electrónico.
              </div>
            </details>

            <details className="faq-item">
              <summary>¿Cómo funcionan los puntos y niveles?</summary>
              <div className="answer">
                Ganas puntos por cada donación completada. A medida que acumulas puntos, 
                subes de nivel. Consulta tu progreso en tu perfil.
              </div>
            </details>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="card sidebar-section" aria-label="Atajos y contacto">
          {/* Categories */}
          <h2 className="section-title">Categorías</h2>
          <div className="categories">
            <div className="category">
              <div className="cat-name">Donación</div>
              <small>Requisitos, tiempos</small>
            </div>
            <div className="category">
              <div className="cat-name">Inscripciones</div>
              <small>Reservas, cambios</small>
            </div>
            <div className="category">
              <div className="cat-name">Validación</div>
              <small>Códigos, estados</small>
            </div>
            <div className="category">
              <div className="cat-name">Perfil</div>
              <small>Datos personales</small>
            </div>
            <div className="category">
              <div className="cat-name">Campañas</div>
              <small>Detalles, aforo</small>
            </div>
            <div className="category">
              <div className="cat-name">Seguridad</div>
              <small>Privacidad</small>
            </div>
          </div>

          {/* Contact Form */}
          <h2 className="section-title" style={{ marginTop: '20px' }}>Enviar un mensaje</h2>
          {submitted ? (
            <div className="success-message">✓ Mensaje enviado. Te responderemos pronto.</div>
          ) : (
            <form className="support-form" onSubmit={handleSubmit}>
              <input
                type="email"
                name="email"
                placeholder="Tu correo"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={submitting}
              />
              <input
                type="text"
                name="asunto"
                placeholder="Asunto"
                value={formData.asunto}
                onChange={handleChange}
                required
                disabled={submitting}
              />
              <textarea
                name="mensaje"
                placeholder="Cuéntanos tu duda o problema…"
                value={formData.mensaje}
                onChange={handleChange}
                required
                disabled={submitting}
              />
              <div className="form-actions">
                <button className="btn" type="submit" disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Enviar'}
                </button>
                <button className="btn-ghost" type="button" onClick={handleReset} disabled={submitting}>
                  Limpiar
                </button>
              </div>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
