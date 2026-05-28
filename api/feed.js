function parseRSS(xml) {
  var months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  var channel = xml.match(/<channel>([\s\S]*?)<\/channel>/i);
  if (!channel) return [];

  var items = [];
  var regex = /<item>([\s\S]*?)<\/item>/gi;
  var match;
  while ((match = regex.exec(channel[1])) !== null) {
    var item = match[1];
    var img = '';
    var imgMatch = item.match(/<img[^>]+src=["]([^"]+)["]/i);
    if (imgMatch) img = imgMatch[1];

    var title = (item.match(/<title><!\[CDATA\[([^\]]*)\]\]><\/title>/i) || ['',''])[1] ||
                (item.match(/<title>([^<]*)<\/title>/i) || ['',''])[1];

    var descMatch = item.match(/<description><!\[CDATA\[([^\]]*)\]\]><\/description>/i);
    if (!descMatch) descMatch = item.match(/<description>([^<]*)<\/description>/i);
    var desc = descMatch ? descMatch[1].replace(/\s+/g,' ').trim().slice(0, 160) : '';

    var tag = (item.match(/<category>([^<]*)<\/category>/i) || ['','Obscura'])[1];
    var pubDate = (item.match(/<pubDate>([^<]*)<\/pubDate>/i) || ['',''])[1];
    var link = (item.match(/<link>([^<]*)<\/link>/i) || ['',''])[1];

    var d = pubDate ? new Date(pubDate) : null;
    var meta = d ? months[d.getMonth()] + ' ' + d.getFullYear() + ' · Leia na Obscura →' : 'Leia na Obscura →';

    items.push({ link: link, title: title, desc: desc, img: img, tag: tag, meta: meta });
  }
  return items.slice(0, 3);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=1800');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var response = await fetch('https://www.aobscura.com.br/feed');
    var xml = await response.text();
    var items = parseRSS(xml);

    if (!items.length) throw new Error('No items parsed');

    var isWidget = req.query.bg || req.query.text || req.query.accent || req.query.card || req.query.border || req.query.muted || req.query.title;

    if (isWidget) {
      var bg = req.query.bg || '#0d1318';
      var text = req.query.text || '#e0e0e0';
      var accent = req.query.accent || '#f44336';
      var card = req.query.card || '#1c2126';
      var border = req.query.border || '#252b2f';
      var muted = req.query.muted || '#9ea1a3';
      var title = req.query.title || '';

      var cardsHtml = items.map(function(item) {
        return '<a href="' + item.link + '" target="_blank" style="display:block;text-decoration:none;background:' + card + ';border:1px solid ' + border + ';border-radius:12px;overflow:hidden;transition:transform 0.2s;margin-bottom:16px">' +
          (item.img ? '<img src="' + item.img + '" style="width:100%;height:180px;object-fit:cover;display:block;border-bottom:1px solid ' + border + '" onerror="this.style.display=\'none\'">' : '') +
          '<div style="padding:20px">' +
          '<div style="font-size:0.75rem;font-weight:600;color:' + accent + ';text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">' + item.tag + '</div>' +
          '<div style="font-size:1.05rem;font-weight:700;color:' + text + ';line-height:1.35;margin-bottom:8px">' + item.title + '</div>' +
          (item.desc ? '<div style="font-size:0.88rem;color:' + muted + ';line-height:1.6;margin-bottom:8px">' + item.desc + '…</div>' : '') +
          '<div style="font-size:0.8rem;color:' + accent + ';font-weight:600">' + item.meta + '</div>' +
          '</div></a>';
      }).join('');

      var html = '<div style="font-family:system-ui,sans-serif;background:' + bg + ';padding:20px;border-radius:12px;max-width:600px;margin:0 auto">' +
        (title ? '<h2 style="color:' + text + ';font-size:1.3rem;margin:0 0 20px;text-align:center">' + title + '</h2>' : '') +
        cardsHtml +
        '<p style="text-align:center;font-size:0.75rem;color:' + muted + ';margin:12px 0 0"><a href="https://www.aobscura.com.br" target="_blank" style="color:' + accent + '">Obscura</a> — a maior newsletter de fotografia do Brasil</p>' +
        '</div>';

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(html);
      return;
    }

    res.json({ ok: true, items: items });
  } catch (err) {
    res.status(502).send('<p>Erro ao carregar feed</p>');
  }
}
