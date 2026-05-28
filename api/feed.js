const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function extractImg(html) {
  var m = (html || '').match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : '';
}

function parseRSS(xml) {
  var items = [];
  var channel = xml.match(/<channel>([\s\S]*?)<\/channel>/i);
  if (!channel) return items;

  var regex = /<item>([\s\S]*?)<\/item>/gi;
  var match;
  while ((match = regex.exec(channel[1])) !== null) {
    var item = match[1];
    items.push({
      link: (item.match(/<link>([^<]*)<\/link>/i) || ['',''])[1],
      title: (item.match(/<title><!\[CDATA\[([^\]]*)\]\]><\/title>/i) || ['',''])[1] || (item.match(/<title>([^<]*)<\/title>/i) || ['',''])[1],
      desc: ((item.match(/<description><!\[CDATA\[([^\]]*)\]\]><\/description>/i) || ['',''])[1] || (item.match(/<description>([^<]*)<\/description>/i) || ['',''])[1] || '').replace(/\s+/g,' ').trim().slice(0, 160),
      img: '',
      tag: (item.match(/<category>([^<]*)<\/category>/i) || ['','Obscura'])[1],
      pubDate: (item.match(/<pubDate>([^<]*)<\/pubDate>/i) || ['',''])[1],
    });
    items[items.length-1].img = extractImg(item);
  }
  return items.slice(0, 3).map(function(item) {
    var d = item.pubDate ? new Date(item.pubDate) : null;
    var meta = d ? months[d.getMonth()] + ' ' + d.getFullYear() + ' · ' : '';
    item.meta = meta + 'Leia na Obscura →';
    return item;
  });
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

    res.json({ ok: true, items: items });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
}
