// Função de servidor (Vercel) que envia e-mails via Resend.
// A chave secreta fica na variável de ambiente RESEND_API_KEY (configurada na Vercel),
// nunca no código do site. O site chama esta função; ela fala com o Resend.

export default async function handler(req, res) {
// CORS básico (permite o site chamar esta função)
res.setHeader(“Access-Control-Allow-Origin”, “*”);
res.setHeader(“Access-Control-Allow-Methods”, “POST, OPTIONS”);
res.setHeader(“Access-Control-Allow-Headers”, “Content-Type”);
if (req.method === “OPTIONS”) return res.status(200).end();
if (req.method !== “POST”) return res.status(405).json({ error: “Method not allowed” });

const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM || “Jewdemy [contato@jewdemy.com](mailto:contato@jewdemy.com)”;
if (!KEY) return res.status(500).json({ error: “RESEND_API_KEY não configurada” });

try {
// aceita corpo como objeto ou string JSON
const body = typeof req.body === “string” ? JSON.parse(req.body || “{}”) : (req.body || {});
let { to, subject, html, text, replyTo } = body;

```
if (!to || (!html && !text)) {
  return res.status(400).json({ error: "Campos obrigatórios: to e (html ou text)" });
}
// 'to' pode ser string ou lista
const toList = Array.isArray(to) ? to : [to];

const payload = {
  from: FROM,
  to: toList,
  subject: subject || "(sem assunto)",
};
if (html) payload.html = html;
if (text) payload.text = text;
if (replyTo) payload.reply_to = replyTo;

const r = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const data = await r.json().catch(() => ({}));
if (!r.ok) return res.status(r.status).json({ error: data.message || "Falha ao enviar", details: data });
return res.status(200).json({ ok: true, id: data.id });
```

} catch (e) {
return res.status(500).json({ error: String(e && e.message || e) });
}
}