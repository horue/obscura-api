export default async function handler(req, res) {
  var query = '';
  var params = ['bg','text','accent','card','border','muted','title','layout','font'];
  for (var i = 0; i < params.length; i++) {
    if (req.query[params[i]]) {
      query += (query ? '&' : '') + params[i] + '=' + encodeURIComponent(req.query[params[i]]);
    }
  }

  try {
    var origin = 'https://' + req.headers.host;
    var response = await fetch(origin + '/api/feed' + (query ? '?' + query : ''));
    var html = await response.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.ok ? 200 : 502).send(html);
  } catch (err) {
    res.status(502).send('Erro ao carregar widget');
  }
}
