const VER='multishop-v12';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VER).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
async function tellUpdate(){
  const l=await self.clients.matchAll({type:'window'});
  l.forEach(c=>c.postMessage({type:'update'}));
}
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    // TEZ: saved copy foran dikhao, peeche se naya la kar save karo (agle refresh par naya)
    e.respondWith((async()=>{
      const c=await caches.open(VER);
      const old=await c.match(req)||(req.mode==='navigate'?await c.match('./index.html'):null);
      const upd=fetch(req,{cache:'no-cache'}).then(async res=>{
        if(res.ok){
          if(old){try{const a=await old.clone().text(),b=await res.clone().text();if(a!==b)tellUpdate()}catch(_){}}
          c.put(req,res.clone());
        }
        return res;
      }).catch(()=>null);
      if(old){e.waitUntil(upd);return old}
      return (await upd)||Response.error();
    })());
  }else if(url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/')){
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{
      if(res.ok){const copy=res.clone();caches.open(VER).then(c=>c.put(req,copy))}
      return res;
    })));
  }
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{
    for(const c of l){if('focus' in c)return c.focus()}
    return self.clients.openWindow('./');
  }));
});
