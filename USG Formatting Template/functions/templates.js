// Netlify Function: per-account template storage (Netlify Identity + Netlify Blobs).
// GET  /.netlify/functions/templates  -> { templates: { bill:[], resolution:[], amendment:[] } }
// PUT  /.netlify/functions/templates  body { templates: {...} } -> { ok:true, templates }
const { connectLambda, getStore } = require('@netlify/blobs');

const KINDS = ['bill', 'resolution', 'amendment'];
const MAX_PER_KIND = 200;
const MAX_BODY = 1024 * 1024; // 1 MB

function res(status, body) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
}
function sanitize(data) {
  const out = {};
  KINDS.forEach(k => {
    const arr = data && Array.isArray(data[k]) ? data[k] : [];
    out[k] = arr.filter(t => t && typeof t === 'object' && typeof t.id === 'string' && typeof t.label === 'string').slice(0, MAX_PER_KIND);
  });
  return out;
}

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if (!user || !user.sub) return res(401, { error: 'Sign in required' });

  connectLambda(event);
  const store = getStore('usg-templates');
  const key = 'user/' + user.sub;

  if (event.httpMethod === 'GET') {
    const data = await store.get(key, { type: 'json' });
    return res(200, { templates: sanitize(data) });
  }
  if (event.httpMethod === 'PUT') {
    if ((event.body || '').length > MAX_BODY) return res(413, { error: 'Too large' });
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch (e) { return res(400, { error: 'Bad JSON' }); }
    const clean = sanitize(body.templates || body);
    await store.setJSON(key, { ...clean, updated: new Date().toISOString() });
    return res(200, { ok: true, templates: clean });
  }
  return res(405, { error: 'Method not allowed' });
};
