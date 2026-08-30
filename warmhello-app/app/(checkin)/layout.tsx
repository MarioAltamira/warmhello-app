const PREVIEW_TOKEN = "demo-token";

export default function CheckInLayout({ children }: { children: React.ReactNode }) {
  const safeGuard = `
(function(){
  try {
    var origin = window.location.origin;
    function isCheckinPath(path){ return (path || '').indexOf('/checkin/') === 0 || (path || '').indexOf('/s/') === 0 || (path || '') === '/' || (path || '').indexOf('/api/') === 0; }
    function parseUrl(next){
      try { return new URL(String(next), origin); } catch(e){ return null; }
    }
    function isBlocked(next){
      if (!next) return false;
      var u = parseUrl(next);
      if (!u) return false;
      if (u.origin !== origin) return false;
      return !isCheckinPath(u.pathname);
    }
    window.addEventListener('beforeunload', function(e){
      // Gives iOS a hook to pause unload navigation; no text prompt shown.
      try { e.preventDefault(); } catch(_){}
    }, { capture: true });
    window.addEventListener('click', function(e){
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || !a.href) return;
      if (a.target && a.target !== '_self') return;
      var u = parseUrl(a.getAttribute('href'));
      if (!u) return;
      if (u.origin !== origin) return;
      if (isBlocked(u.pathname + u.search + u.hash)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (typeof console !== 'undefined' && console.warn) console.warn('[checkin] blocked anchor navigation to ' + a.href + ' while on SMS check-in.');
        return false;
      }
    }, { capture: true, passive: false });
    var hPush = window.history.pushState;
    var hRepl = window.history.replaceState;
    try {
      window.history.pushState = function(a,b,c){
        if (c != null && isBlocked(c)) {
          if (typeof console !== 'undefined' && console.warn) console.warn('[checkin] blocked history.pushState to ' + String(c) + ' while on SMS check-in.');
          return null;
        }
        return hPush.call(this, a, b, c);
      };
    } catch(_) {}
    try {
      window.history.replaceState = function(a,b,c){
        if (c != null && isBlocked(c)) {
          if (typeof console !== 'undefined' && console.warn) console.warn('[checkin] blocked history.replaceState to ' + String(c) + ' while on SMS check-in.');
          return null;
        }
        return hRepl.call(this, a, b, c);
      };
    } catch(_) {}
    try { document.body.style.paddingTop = '0px'; } catch(_){}
    try { document.documentElement.style.scrollPaddingTop = '0px'; } catch(_){}
  } catch (e) {
    if (typeof console !== 'undefined' && console.warn) console.warn('[checkin] guard init skipped:', e);
  }
})();
`;

  return (
    <>
      {children}
      <script dangerouslySetInnerHTML={{ __html: safeGuard }} />
    </>
  );
}

export { PREVIEW_TOKEN };
