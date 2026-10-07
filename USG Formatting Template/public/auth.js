/* Netlify Identity sign-in for the USG Formatter. Degrades gracefully if the widget fails to load. */
(function(){
  var pending = null; // callback to run after a successful login (e.g. a blocked template save)
  var currentUser = null;

  function widget(){ return window.netlifyIdentity || null; }

  function render(){
    var box = document.getElementById('auth-box');
    if(!box) return;
    if(!widget()){ box.innerHTML = '<span class="settings-row-main"><span class="settings-row-label">Sign-in unavailable</span><span class="settings-row-desc">Could not reach the sign-in service.</span></span>'; return; }
    if(currentUser){
      var email = currentUser.email || '';
      var name = (currentUser.user_metadata && currentUser.user_metadata.full_name) || '';
      var primary = name || email || 'Signed in';
      var secondary = name ? email : 'Templates sync to this account';
      box.innerHTML = '<span class="settings-row-main"><span class="auth-email" title="'+esc(primary)+'">'+esc(primary)+'</span><span class="settings-row-desc" title="'+esc(secondary)+'">'+esc(secondary)+'</span></span>' +
        '<a href="#" class="auth-link" data-auth-logout>Sign out</a>';
      box.querySelector('[data-auth-logout]').addEventListener('click', function(e){ e.preventDefault(); widget().logout(); });
    } else {
      box.innerHTML = '<span class="settings-row-main"><span class="settings-row-label">Not signed in</span><span class="settings-row-desc">Sign in to save templates to your account.</span></span>' +
        '<button type="button" class="btn ghost auth-btn" data-auth-login>Sign in</button>';
      box.querySelector('[data-auth-login]').addEventListener('click', function(){ widget().open(); });
    }
  }

  function emit(type){ try { window.dispatchEvent(new CustomEvent('usg-auth', { detail: { type: type, user: currentUser } })); } catch(e){} }

  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  function init(){
    var w = widget();
    if(!w){ render(); return; }
    w.on('init', function(user){ currentUser = user || null; render(); emit('init'); });
    w.on('login', function(user){
      currentUser = user || null;
      render();
      w.close();
      emit('login');
      if(pending){ var fn = pending; pending = null; setTimeout(fn, 0); }
    });
    w.on('logout', function(){ currentUser = null; pending = null; render(); emit('logout'); });
    try { currentUser = w.currentUser() || null; } catch(e){}
    render();
  }

  /** Returns the signed-in Netlify Identity user, or null. */
  window.getCurrentUser = function(){
    try { var w = widget(); if(w && w.currentUser) return w.currentUser() || null; } catch(e){}
    return currentUser;
  };

  /**
   * Runs fn immediately if signed in; otherwise opens the sign-in window and runs fn after login.
   * If the widget never loaded, fn runs unguarded so the site keeps working.
   */
  window.requireAuth = function(fn){
    var w = widget();
    if(!w){ fn(); return; }
    if(window.getCurrentUser()){ fn(); return; }
    pending = fn;
    w.open('login');
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
