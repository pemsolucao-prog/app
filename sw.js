/* P&M — guarda o app no aparelho para abrir mesmo sem sinal.
   Página: tenta a internet primeiro (pega a versão nova) e cai na cópia guardada se não houver sinal.
   Bibliotecas e ícones: usa a cópia guardada. Os DADOS não passam por aqui (ficam no banco offline do Firebase). */
var CACHE = 'pm-app-v2';
var SHELL = ['./', './index.html', './firebase-app-compat.js', './firebase-auth-compat.js', './firebase-firestore-compat.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){ return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // Firebase, Google Maps etc. seguem direto
  if(req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname)){
    e.respondWith(fetch(req).then(function(res){
      var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put('./index.html', copy); });
      return res;
    }).catch(function(){ return caches.match('./index.html'); }));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){
    return hit || fetch(req).then(function(res){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); return res; });
  }));
});
