import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY no configurada; correo no enviado:", subject, "->", to);
    return { skipped: true };
  }
  return resend.emails.send({
    from: process.env.EMAIL_FROM || "GestionaPro <no-reply@tudominio.com>",
    to,
    subject,
    html,
  });
}
