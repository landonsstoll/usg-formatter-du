/* Client for the per-account template store (Netlify Function + Blobs). Requires auth.js. */
window.TemplatesAPI = (function(){
  var ENDPOINT = '/.netlify/functions/templates';
  function available(){ return !!window.netlifyIdentity && location.protocol !== 'file:'; }
  async function token(){
    var u = window.getCurrentUser && window.getCurrentUser();
    if(!u || typeof u.jwt !== 'function') return null;
    return await u.jwt();
  }
  async function call(method, body){
    var t = await token();
    if(!t) throw new Error('Not signed in');
    var r = await fetch(ENDPOINT, {
      method: method,
      headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    if(!r.ok) throw new Error('Template store HTTP ' + r.status);
    return r.json();
  }
  return {
    available: available,
    load: function(){ return call('GET').then(function(d){ return d.templates; }); },
    save: function(templates){ return call('PUT', { templates: templates }); }
  };
})();
