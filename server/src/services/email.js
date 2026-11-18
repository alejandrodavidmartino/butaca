// Envío de correos con Brevo (plan gratuito: 300 correos/día) usando su API HTTP.
// Usamos la API (HTTPS) y no SMTP porque muchos alojamientos gratuitos bloquean los puertos de correo.
// Docs: https://developers.brevo.com/reference/sendtransacemail
//
// Si no hay BREVO_API_KEY (por ejemplo en local), el correo NO se envía: se muestra en la consola.

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

export const emailEnabled = () => Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);

export async function sendEmail({ to, toName, subject, html, text }) {
  if (!emailEnabled()) {
    console.log(`\n📧 [correo NO enviado: falta BREVO_API_KEY o EMAIL_FROM]\n   Para: ${to}\n   Asunto: ${subject}\n   ${text}\n`);
    return { simulated: true };
  }

  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY.trim(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: process.env.EMAIL_FROM.trim(), name: process.env.EMAIL_FROM_NAME || 'Butaca' },
      to: [{ email: to, name: toName || to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Brevo ${res.status}:`, body.slice(0, 300));
    throw new Error(`No se pudo enviar el correo (Brevo ${res.status})`);
  }
  return res.json();
}

// URL del frontend para los enlaces de los correos
export const appUrl = () =>
  (process.env.APP_URL || (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0]).trim().replace(/\/$/, '');

// Plantilla HTML del correo de confirmación (estilos en línea: los clientes de correo ignoran el CSS externo)
export function verificationEmail({ name, link }) {
  const first = String(name || '').split(' ')[0] || 'cinéfilo';
  const subject = '🎬 Confirma tu correo en Butaca';
  const text = `¡Hola, ${first}! Confirma tu correo para activar todo Butaca (grupos y Ratatús): ${link}  — El enlace caduca en 24 horas. Si no te has registrado en Butaca, ignora este correo.`;
  const html = `<!doctype html>
<html lang="es"><body style="margin:0;background:#0f0d12;font-family:Arial,Helvetica,sans-serif;color:#e4e4e7">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0d12;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1b1720;border-radius:18px;border:1px solid #2e2836">
        <tr><td style="padding:28px 28px 8px;text-align:center">
          <div style="font-size:30px;font-weight:bold;letter-spacing:2px;color:#ffffff">🪑 BUTACA</div>
        </td></tr>
        <tr><td style="padding:8px 28px;text-align:center">
          <div style="font-size:56px;line-height:1">🐀🍿</div>
          <h1 style="margin:16px 0 8px;font-size:24px;color:#ffffff">¡Hola, ${escapeHtml(first)}!</h1>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.5;color:#a1a1aa">
            Psst… soy <strong style="color:#ffffff">Ratatús</strong>. Antes de dejarte crear grupos y pedirme recomendaciones,
            necesito comprobar que este correo es tuyo.
          </p>
          <a href="${link}" style="display:inline-block;background:#c81e3a;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 28px;border-radius:10px">
            Confirmar mi correo
          </a>
          <p style="margin:20px 0 0;font-size:13px;color:#71717a">El enlace caduca en 24 horas.</p>
        </td></tr>
        <tr><td style="padding:20px 28px 28px">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#71717a;border-top:1px solid #2e2836;padding-top:16px">
            Si el botón no funciona, copia este enlace en tu navegador:<br>
            <a href="${link}" style="color:#e0607a;word-break:break-all">${link}</a><br><br>
            Si no te has registrado en Butaca, ignora este correo.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  return { subject, html, text };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
