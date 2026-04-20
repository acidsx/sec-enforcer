import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "SEC <no-reply@sx-finance.com>";

export async function sendUrgentEmail(params: {
  to: string;
  title: string;
  body: string;
  url?: string;
}): Promise<boolean> {
  if (!resend) return false;
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `🔴 ${params.title}`,
      html: urgentTemplate(params),
    });
    return true;
  } catch (err) {
    console.error("[email] urgent error:", err);
    return false;
  }
}

export async function sendDigestEmail(params: {
  to: string;
  notifications: Array<{ title: string; body: string | null; priority: string }>;
}): Promise<boolean> {
  if (!resend || params.notifications.length === 0) return false;
  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `📋 Resumen diario SEC · ${params.notifications.length} actualizaciones`,
      html: digestTemplate(params.notifications),
    });
    return true;
  } catch (err) {
    console.error("[email] digest error:", err);
    return false;
  }
}

function urgentTemplate(p: { title: string; body: string; url?: string }): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F1EA;font-family:-apple-system,'Segoe UI',sans-serif;color:#1F1D1A">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden">
<tr><td style="background:#D85A30;padding:16px 24px;color:#fff;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-weight:500">Urgente</td></tr>
<tr><td style="padding:32px 24px 24px">
<h1 style="margin:0;font-size:22px;font-weight:500;line-height:1.2">${escapeHtml(p.title)}</h1>
<p style="margin:12px 0 0;color:#5C574F;line-height:1.5">${escapeHtml(p.body)}</p>
${p.url ? `<a href="${p.url}" style="display:inline-block;margin-top:24px;background:#1F1D1A;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:500">Abrir en SEC →</a>` : ""}
</td></tr>
<tr><td style="padding:20px 24px;border-top:1px solid #EAE4D9;color:#8A8478;font-size:13px">
<a href="https://sec.sx-finance.com/ajustes" style="color:#8A8478">Administrar notificaciones</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

function digestTemplate(
  notifications: Array<{ title: string; body: string | null; priority: string }>
): string {
  const rows = notifications
    .map(
      (n) => `
<tr><td style="padding:16px 0;border-bottom:1px solid #EAE4D9">
<div style="font-weight:500;margin-bottom:4px;color:#1F1D1A">${escapeHtml(n.title)}</div>
${n.body ? `<div style="color:#5C574F;font-size:13px;line-height:1.5">${escapeHtml(n.body)}</div>` : ""}
</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F5F1EA;font-family:-apple-system,'Segoe UI',sans-serif;color:#1F1D1A">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden">
<tr><td style="padding:32px 24px 16px">
<p style="margin:0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8A8478">Resumen diario</p>
<h1 style="margin:8px 0 0;font-size:22px;font-weight:500">Tu SEC hoy</h1>
</td></tr>
<tr><td style="padding:0 24px 16px">
<table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
</td></tr>
<tr><td style="padding:16px 24px">
<a href="https://sec.sx-finance.com/planificar" style="display:inline-block;background:#1F1D1A;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:500">Ver planificar →</a>
</td></tr>
<tr><td style="padding:20px 24px;border-top:1px solid #EAE4D9;color:#8A8478;font-size:13px">
<a href="https://sec.sx-finance.com/ajustes" style="color:#8A8478">Administrar notificaciones</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
