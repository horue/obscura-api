export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  try {
    const params = new URLSearchParams();
    params.append('email', email);
    params.append('source', 'subscribe_page');

    const response = await fetch('https://www.aobscura.com.br/api/v1/free?nojs=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const text = await response.text();
    res.status(response.ok ? 200 : 502).json({ ok: response.ok, status: response.status, body: text.slice(0,500) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
