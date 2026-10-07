'use strict';
const $=id=>document.getElementById(id);
let tracks=[],db=null,ctx=null,buffer=null,selected=null,playing=false,offset=0,revision=0,hidden=true;
let hostUnlocked=false;
const revealed=new Set();const urls=new Map();let toastTimer;
// Native media playback uses the phone's media audio route, including in silent mode.
const player=new Audio();player.preload='auto';player.setAttribute('playsinline','');player.volume=Number($('volume').value);
function playbackSession(){try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch{}}
function toast(message){$('toast').textContent=message;$('toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.display='none',4500)}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function time(n){n=Math.max(0,Math.floor(n||0));return `${Math.floor(n/60).toString().padStart(2,'0')}:${(n%60).toString().padStart(2,'0')}`}
function title(t){return !hostUnlocked||(hidden&&!revealed.has(t.id))?`Son ${tracks.indexOf(t)+1}`:t.label}
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('a-loreille',1);req.onupgradeneeded=()=>req.result.createObjectStore('tracks',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error('Fermez les autres onglets du blind test.'))})}
function records(){return new Promise((resolve,reject)=>{const tx=db.transaction('tracks');const r=tx.objectStore('tracks').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function save(t){return new Promise((resolve,reject)=>{if(!db){reject(new Error('Stockage local indisponible'));return}const tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').put(t);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
function render(){
 $('settings').hidden=!hostUnlocked;$('presenterControl').hidden=!hostUnlocked;
 $('host').textContent=hostUnlocked?'🔒 Verrouiller':'🔒 Mode animateur';
 $('readyCount').textContent=`${tracks.filter(t=>t.file||t.blob).length} / ${tracks.length} sons prêts`;
 $('tracks').innerHTML=tracks.map((t,i)=>{const ready=!!(t.file||t.blob),active=selected?.id===t.id;return `<article class="card ${!ready?'unavailable':''} ${active?'active':''}" data-id="${escapeHTML(t.id)}"><div class="card-top"><span class="number">${String(i+1).padStart(2,'0')}</span><span class="chip">${active&&playing?'En boucle':ready?'Prêt':'À importer'}</span></div><button class="play" data-play="${escapeHTML(t.id)}" ${!ready?'disabled':''} aria-label="${active&&playing?'Mettre en pause':'Lire'} le son ${i+1}">${active&&playing?'Ⅱ':'▶'}</button><h2 class="card-title">${escapeHTML(title(t))}</h2>${hostUnlocked&&hidden?`<button class="reveal" data-reveal="${escapeHTML(t.id)}">${revealed.has(t.id)?'Masquer':'Révéler la réponse'}</button>`:''}</article>`}).join('');
 $('nowTitle').textContent=selected?title(selected):'À vous de jouer';$('nowStatus').textContent=selected?(playing?'Lecture en boucle':'En pause'):'Choisissez un son';$('pause').disabled=!selected||!buffer;$('restart').disabled=!selected||!buffer;$('seek').disabled=!selected||!buffer;$('pause').textContent=playing?'Ⅱ':'▶';$('pause').setAttribute('aria-label',playing?'Mettre en pause':'Reprendre');
}
function audio(){if(!ctx)ctx=new (window.AudioContext||window.webkitAudioContext)();return Promise.resolve(ctx)}
function stopSource(){player.pause();playing=false}
function bounds(t,b=buffer){const duration=b?.duration||t.duration||0;return [Math.max(0,Math.min(Number(t.start)||0,Math.max(0,duration-.02))),Math.min(Number(t.end)||duration,duration)]}
function position(){if(!selected||!buffer)return 0;const [a,b]=bounds(selected);return Math.max(0,Math.min(player.currentTime-a,b-a))}
function begin(){const [a,b]=bounds(selected);if(b<=a)throw new Error('L’extrait est trop court.');playbackSession();player.currentTime=a+Math.min(offset,Math.max(0,b-a-.01));player.loop=a===0&&b>=buffer.duration-.02;const token=revision;return player.play().then(()=>{if(token!==revision)return;playing=true;render()})}
function loopExcerpt(){if(!playing||!selected||!buffer)return;const [a,b]=bounds(selected);if(player.currentTime>=b||player.ended){player.currentTime=a;if(player.paused)player.play().catch(e=>{playing=false;render();toast('Touchez Lecture pour reprendre le son.')})}}
player.addEventListener('timeupdate',loopExcerpt);player.addEventListener('ended',loopExcerpt);
setInterval(loopExcerpt,50);
async function play(t){
 if(selected?.id===t.id&&buffer){if(playing){offset=position();stopSource();render()}else{try{await begin()}catch(e){toast('Lecture impossible : '+e.message)}}return}
 const token=++revision;stopSource();selected=t;buffer=null;offset=0;render();$('nowStatus').textContent='Chargement…';
 try{
  playbackSession();
  // Call play during the tap, before any asynchronous loading: required by iOS.
  player.onloadedmetadata=()=>{if(token!==revision)return;buffer={duration:player.duration};t.duration=player.duration;const [a,b]=bounds(t);player.currentTime=a;player.loop=a===0&&b>=player.duration-.02;render()};
  if(t.blob){if(!urls.has(t.blob))urls.set(t.blob,URL.createObjectURL(t.blob));player.src=urls.get(t.blob)}else player.src=urls.get(t.file)||t.file;
  await player.play();if(token!==revision)return;
  buffer={duration:player.duration};t.duration=player.duration;playing=true;render();
 }catch(e){if(token!==revision)return;stopSource();selected=null;buffer=null;render();toast('Impossible de lire ce son : '+e.message);console.error(e)}
}

function stop(){++revision;stopSource();selected=null;buffer=null;offset=0;render();$('elapsed').textContent='00:00';$('length').textContent='00:00';$('seek').value='0';$('seek').style.setProperty('--played','0%')}
$('tracks').addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;const t=tracks.find(t=>t.id===(button.dataset.play||button.dataset.reveal));if(button.dataset.play)play(t);else if(t&&hostUnlocked){revealed.has(t.id)?revealed.delete(t.id):revealed.add(t.id);render()}});
$('presenter').onchange=()=>{if(!hostUnlocked){$('presenter').checked=true;return}hidden=$('presenter').checked;revealed.clear();render()};$('pause').onclick=()=>selected&&play(selected);$('stop').onclick=stop;$('volume').oninput=()=>{player.volume=Number($('volume').value)};
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,button,summary')||$('editor').open)return;if(e.code==='Space'){e.preventDefault();if(selected)play(selected)}if(e.key==='Escape')stop()});
let seeking=false;
function updateTimeline(){
 const slider=$('seek');
 if(!selected||!buffer){$('elapsed').textContent='00:00';$('length').textContent='00:00';slider.value=0;slider.style.setProperty('--played','0%');slider.setAttribute('aria-valuetext','Aucun son sélectionné');return}
 const [a,b]=bounds(selected),span=b-a,pos=position();
 slider.max=span;$('elapsed').textContent=time(pos);$('length').textContent=time(span);
 if(!seeking){slider.value=pos;slider.style.setProperty('--played',`${100*pos/span}%`)}
 slider.setAttribute('aria-valuetext',`${time(pos)} sur ${time(span)}`);
}
function seekTo(seconds,restartPlayback=false){
 if(!selected||!buffer)return;
 const [a,b]=bounds(selected),resume=playing||restartPlayback;
 stopSource();offset=Math.max(0,Math.min(Number(seconds)||0,Math.max(0,b-a-.01)));
 player.currentTime=a+offset;if(resume)begin().catch(e=>{playing=false;render();toast('Lecture impossible : '+e.message)});else render();updateTimeline();
}
$('seek').addEventListener('pointerdown',()=>{seeking=true});
window.addEventListener('pointerup',()=>{seeking=false;updateTimeline()});
window.addEventListener('pointercancel',()=>{seeking=false;updateTimeline()});
$('seek').addEventListener('input',()=>{const value=Number($('seek').value);$('seek').style.setProperty('--played',`${100*value/Number($('seek').max)}%`);seekTo(value)});
$('seek').addEventListener('change',()=>{seeking=false;updateTimeline()});
$('restart').onclick=()=>seekTo(0,true);
function tick(){updateTimeline();requestAnimationFrame(tick)}
function renderEditor(){
 $('editorTracks').innerHTML=tracks.map((t,i)=>`<section class="edit-row" data-id="${escapeHTML(t.id)}"><label class="edit-label"><span class="number">${String(i+1).padStart(2,'0')}</span><input type="text" value="${escapeHTML(t.label)}" aria-label="Réponse du son ${i+1}" maxlength="160" data-label></label><span class="file-info">${escapeHTML(t.filename||((t.file||'').split('/').pop())||'Aucun enregistrement')} ${t.duration?'· '+time(t.duration):''}</span><label class="secondary upload">${t.file||t.blob?'Remplacer':'Importer'}<input type="file" accept="audio/*,.ogg,.mp3,.wav,.m4a,.aac,.flac,.webm" aria-label="Importer le son ${i+1}"></label><div class="clip"><label>Début (secondes)<input type="number" min="0" step="0.01" value="${t.start}" data-start></label><label>Fin (secondes)<input type="number" min="0.1" step="0.01" value="${t.end}" data-end></label><button class="secondary" data-save>Enregistrer</button><button class="secondary" data-preview ${!t.file&&!t.blob?'disabled':''}>Écouter l’extrait</button></div></section>`).join('');
}
$('settings').onclick=()=>{if(!hostUnlocked)return;stop();renderEditor();$('editor').showModal()};$('editor').addEventListener('close',stop);
$('editorTracks').addEventListener('change',async e=>{
 if(!hostUnlocked||e.target.type!=='file')return;const input=e.target,f=input.files[0];if(!f)return;const row=input.closest('[data-id]'),t=tracks.find(t=>t.id===row.dataset.id);input.disabled=true;
 try{if(f.size>150*1024*1024)throw new Error('Le fichier doit faire moins de 150 Mo.');await audio();const decoded=await ctx.decodeAudioData(await f.arrayBuffer());if(decoded.duration<.05)throw new Error('Enregistrement trop court.');const next={...t,blob:f,file:null,filename:f.name,duration:decoded.duration,start:0,end:Math.min(15,decoded.duration)};await save(next);stop();Object.assign(t,next);renderEditor();render();toast('Enregistrement conservé sur cet appareil.');if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{})}
 catch(e){toast('Import non enregistré : '+e.message);input.disabled=false;input.value=''}
});
$('editorTracks').addEventListener('click',async e=>{
 if(!hostUnlocked)return;const row=e.target.closest('[data-id]');if(!row)return;const t=tracks.find(t=>t.id===row.dataset.id);
 if(e.target.matches('[data-save]')){const start=Number(row.querySelector('[data-start]').value),end=Number(row.querySelector('[data-end]').value),label=row.querySelector('[data-label]').value.trim();if(!label||!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end-start<.05){toast('Saisissez une réponse et une fin supérieure au début (au moins 0,05 s).');return}
 try{let duration=t.duration;if(t.file||t.blob){await audio();const bytes=t.blob?await t.blob.arrayBuffer():await fetch(t.file).then(r=>{if(!r.ok)throw new Error('Fichier introuvable');return r.arrayBuffer()});duration=(await ctx.decodeAudioData(bytes)).duration;if(end>duration+.01)throw new Error(`La fin doit être inférieure à ${duration.toFixed(2)} secondes.`)}const next={...t,label,start,end,duration};await save(next);if(selected?.id===t.id)stop();Object.assign(t,next);render();toast('Réponse et extrait enregistrés.')}catch(e){toast('Réglages non enregistrés : '+e.message)}}
 if(e.target.matches('[data-preview]')){const start=Number(row.querySelector('[data-start]').value),end=Number(row.querySelector('[data-end]').value);if(start!==t.start||end!==t.end){toast('Enregistrez les nouveaux réglages avant de les écouter.');return}play(t)}
});
$('add').onclick=async()=>{if(!hostUnlocked)return;const t={id:crypto.randomUUID(),label:`Son ${tracks.length+1}`,file:null,start:0,end:15};try{await save(t);tracks.push(t);render();renderEditor();$('editorTracks').lastElementChild.scrollIntoView({block:'nearest'});toast('Nouvel emplacement ajouté.')}catch(e){toast('Ajout impossible : '+e.message)}};
$('host').onclick=()=>{
 if(hostUnlocked){hostUnlocked=false;hidden=true;revealed.clear();$('presenter').checked=true;$('editor').close();render();toast('Réponses et réglages verrouillés.');return}
 $('hostForm').reset();$('hostError').textContent='';$('hostDialog').showModal();$('hostCode').focus();
};
$('hostCancel').onclick=()=>$('hostDialog').close();
$('hostForm').onsubmit=e=>{e.preventDefault();if($('hostCode').value!=='6216'){$('hostError').textContent='Code incorrect.';$('hostCode').select();return}hostUnlocked=true;$('hostDialog').close();$('hostForm').reset();render();toast('Mode animateur déverrouillé.');};
async function init(){try{tracks=await fetch('tracks.json').then(r=>{if(!r.ok)throw new Error('Chargement impossible');return r.json()});try{db=await openDB();const stored=await records();tracks=tracks.map(t=>{const s=stored.find(s=>s.id===t.id);return s?{...s,file:s.blob?null:t.file}:t});tracks.push(...stored.filter(s=>!tracks.some(t=>t.id===s.id)));$('storageNote').textContent='Les imports restent dans ce navigateur. Ils ne sont pas transférés à un autre appareil. Effacer les données du navigateur les supprime.'}catch(e){$('storageNote').textContent='Le stockage local est indisponible. Les imports et les réglages ne pourront pas être sauvegardés.';toast('Le navigateur ne permet pas la sauvegarde locale.')}// Prepare local media URLs before enabling playback. This also avoids browser
 // media range caches trying to use the network after an offline reload.
 await Promise.all(tracks.filter(t=>t.file).map(async t=>{try{const r=await fetch(t.file);if(!r.ok)throw new Error('Fichier introuvable');urls.set(t.file,URL.createObjectURL(await r.blob()))}catch(e){console.warn('Préchargement audio indisponible',t.file,e)}}));
 render();tick();
 fetch('sources.json').then(r=>r.json()).then(list=>{$('sources').innerHTML=list.map(s=>`<p><strong>${escapeHTML(s.label)}</strong><br>${escapeHTML(s.credit)}${s.url?` · <a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">Source</a>`:''}</p>`).join('')}).catch(()=>{});
 if('serviceWorker' in navigator&&window.isSecureContext){try{const reg=await navigator.serviceWorker.register('sw.js');const check=async()=>{const cache=await caches.open('a-loreille-v15');const ready=!!(await cache.match('offline-ready'));$('offline').textContent=ready?'Prêt hors ligne':'Préparation du hors-ligne…'};navigator.serviceWorker.addEventListener('message',e=>{if(e.data==='OFFLINE_READY')check()});await navigator.serviceWorker.ready;await check();reg.addEventListener('updatefound',()=>{reg.installing?.addEventListener('statechange',check)})}catch(e){$('offline').textContent='Hors-ligne indisponible';console.error(e)}}else $('offline').textContent='Hors-ligne : HTTPS requis';
 }catch(e){$('offline').textContent='Erreur de chargement';toast('Lancez le site avec le serveur local fourni.');console.error(e)}}
init();
