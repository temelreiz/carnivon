import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.ACCESS_REQUEST_FROM || "Carnivon <no-reply@carnivon.io>";
const to = process.env.ACCESS_REQUEST_TO || "investors@carnivon.io";

const resend = apiKey ? new Resend(apiKey) : null;

export type AccessRequestPayload = {
  name: string;
  email: string;
  entity?: string | null;
  ticket: string;
  jurisdiction: string;
  notes?: string | null;
  ip: string;
  userAgent?: string | null;
};

export async function sendAccessRequestNotification(p: AccessRequestPayload) {
  if (!resend) {
    console.log("[email:no-resend-key]", { to, subject: subjectFor(p) });
    return;
  }

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: p.email,
    subject: subjectFor(p),
    text: textBody(p),
    html: htmlBody(p),
  });

  if (error) {
    console.error("[email:send-failed]", error);
  }
}

function subjectFor(p: AccessRequestPayload) {
  return `Access request — ${p.name} (${p.ticket}, ${p.jurisdiction})`;
}

function textBody(p: AccessRequestPayload) {
  return [
    `Name: ${p.name}`,
    `Email: ${p.email}`,
    p.entity ? `Entity: ${p.entity}` : null,
    `Ticket: ${p.ticket}`,
    `Jurisdiction: ${p.jurisdiction}`,
    p.notes ? `\nNotes:\n${p.notes}` : null,
    `\n---`,
    `IP: ${p.ip}`,
    p.userAgent ? `User-Agent: ${p.userAgent}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function htmlBody(p: AccessRequestPayload) {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td style="padding:4px 0">${escape(v)}</td></tr>`;
  return `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;color:#111">
      <h2 style="margin:0 0 12px">New access request</h2>
      <table style="border-collapse:collapse">
        ${row("Name", p.name)}
        ${row("Email", p.email)}
        ${p.entity ? row("Entity", p.entity) : ""}
        ${row("Ticket", p.ticket)}
        ${row("Jurisdiction", p.jurisdiction)}
      </table>
      ${p.notes ? `<h3 style="margin:16px 0 4px">Notes</h3><pre style="white-space:pre-wrap;margin:0;font-family:inherit">${escape(p.notes)}</pre>` : ""}
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
      <div style="color:#999;font-size:12px">IP ${escape(p.ip)}${p.userAgent ? ` · ${escape(p.userAgent)}` : ""}</div>
    </div>
  `;
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
