const CACHE='a-loreille-v11';
const ASSETS=["./", "index.html", "style.css", "app.js", "tracks.json", "sources.json", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png", "audio/01_brame_cerf.mp3", "audio/02_clavier_plus_fort.mp3", "audio/03_apnee.mp3", "audio/04_thermomix_sans_intro.mp3", "audio/05_moteur_2cv.mp3", "audio/06_cuillere_fournie.mp3", "audio/07_pilates.mp3", "audio/08_tortue_fournie.mp3", "audio/09_festnoz_fourni.mp3", "audio/00_basket.mp3"];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(ASSETS);await cache.put('offline-ready',new Response('ready'));await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('a-loreille-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();for(const client of await self.clients.matchAll())client.postMessage('OFFLINE_READY');})()));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(event.request,{ignoreSearch:true});if(cached){
 const range=event.request.headers.get('range');
 if(range&&url.pathname.startsWith(new URL('audio/',self.location.href).pathname)){
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(match&&(match[1]||match[2])){
   const bytes=await cached.arrayBuffer(),length=bytes.byteLength;
   const start=match[1]?Number(match[1]):Math.max(0,length-Number(match[2]));
   const end=match[1]?(match[2]?Math.min(Number(match[2]),length-1):length-1):length-1;
   if(start>=length||start>end)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${length}`}});
   return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':cached.headers.get('Content-Type')||'audio/mpeg','Content-Range':`bytes ${start}-${end}/${length}`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});
  }
 }
 return cached;
}try{return await fetch(event.request)}catch(e){if(event.request.mode==='navigate')return await cache.match('index.html');throw e}})())});
