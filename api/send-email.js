// Função de servidor (Vercel) que envia e-mails via Resend.
// A chave secreta fica na variável de ambiente RESEND_API_KEY (configurada na Vercel),
// nunca no código do site. Formato CommonJS para máxima compatibilidade.

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    if (req.body && typeof req.body === "string") { try { return resolve(JSON.parse(req.body)); } catch (e) { return resolve({}); } }
    let data = "";
    req.on("data", (c) => { data += c; });
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch (e) { resolve({}); } });
    req.on("error", () => resolve({}));
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.RESEND_FROM || "Jewdemy <contato@jewdemy.com>";
  if (!KEY) return res.status(500).json({ error: "RESEND_API_KEY nao configurada na Vercel" });

  try {
    const body = await readBody(req);
    const to = body.to, subject = body.subject, html = body.html, text = body.text, replyTo = body.replyTo;
    if (!to || (!html && !text)) return res.status(400).json({ error: "Campos obrigatorios: to e (html ou text)" });

    const payload = { from: FROM, to: Array.isArray(to) ? to : [to], subject: subject || "(sem assunto)" };
    if (html) payload.html = html;
    if (text) payload.text = text;
    if (replyTo) payload.reply_to = replyTo;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + KEY, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json({ error: (data && data.message) || "Falha ao enviar", details: data });
    return res.status(200).json({ ok: true, id: data && data.id });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
