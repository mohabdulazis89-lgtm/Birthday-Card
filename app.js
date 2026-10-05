(() => {
  'use strict';
  const $ = q => document.querySelector(q);
  const $$ = q => [...document.querySelectorAll(q)];
  const THEMES = ['violet','rose','sunset','ocean','emerald','midnight','peach','champagne'];
  const FONTS = ['classic','modern','soft'];
  const EFFECTS = ['confetti','hearts','stars','none'];
  const MUSICS = ['birthday','dreamy','none'];
  const INTROS = ['envelope','gift','direct'];
  const DRAFT_KEY = 'birthday-link-studio-v2-draft';

  const defaults = {
    recipient:'Citra', sender:'Azis', title:'Selamat Ulang Tahun!',
    message:'Semoga hari istimewamu dipenuhi kebahagiaan, tawa, dan semua hal baik yang kamu harapkan. Semoga setiap langkahmu ke depan semakin indah. ✨',
    date:'', photo:'', emoji:'🎂', theme:'violet', font:'classic', effect:'confetti', music:'birthday', intro:'envelope'
  };
  const templates = {
    warm:{title:'Selamat Ulang Tahun! 🎂',message:'Semoga hari istimewamu dipenuhi kebahagiaan, tawa, dan semua hal baik yang kamu harapkan. Semoga setiap langkahmu ke depan semakin indah. ✨'},
    romantic:{title:'Untuk Kamu di Hari Istimewamu 💖',message:'Selamat ulang tahun untuk seseorang yang membuat banyak hari terasa lebih indah. Semoga senyummu selalu punya alasan untuk kembali, dan semoga aku masih boleh menjadi salah satu alasannya. 💕'},
    fun:{title:'Level Baru Terbuka! 🥳',message:'Happy birthday! Semoga level barumu penuh kejutan seru, rezeki lancar, hati bahagia, makanan enak, dan drama seminimal mungkin. Hari ini wajib senang! 🎉'},
    elegant:{title:'A Beautiful New Chapter ✨',message:'Semoga bertambahnya usia membawa ketenangan, keberanian, dan banyak momen yang layak dikenang. Untuk semua yang telah kamu lalui dan semua yang masih menantimu—selamat bertumbuh.'},
    prayer:{title:'Doa Terbaik di Hari Ulang Tahun 🤍',message:'Semoga umur yang bertambah membawa keberkahan, kesehatan, ketenangan hati, rezeki yang baik, serta langkah yang selalu dimudahkan. Semoga segala harapan baikmu menemukan jalan untuk menjadi nyata. Aamiin.'}
  };
  const state = {...defaults};
  let installPrompt = null;
  let audioCtx = null;
  let activeAudioNodes = [];

  const els = {
    builder:$('#builderView'), viewer:$('#viewerView'), form:$('#cardForm'),
    recipient:$('#recipientInput'), sender:$('#senderInput'), title:$('#titleInput'), message:$('#messageInput'), date:$('#dateInput'), photo:$('#photoInput'),
    font:$('#fontSelect'), effect:$('#effectSelect'), music:$('#musicSelect'), intro:$('#introSelect'), autosave:$('#autosaveInput'), count:$('#messageCount'),
    preview:$('#cardPreview'), pRecipient:$('#previewRecipient'), pSender:$('#previewSender'), pTitle:$('#previewTitle'), pMessage:$('#previewMessage'), pEmoji:$('#previewEmoji'), pDate:$('#previewDate'), pPhoto:$('#previewPhoto'),
    sharePanel:$('#sharePanel'), shareUrl:$('#shareUrl'), whatsapp:$('#whatsappBtn'), shareRecipient:$('#shareRecipient'), urlHealth:$('#urlHealth'), hostingWarning:$('#hostingWarning'),
    viewerCard:$('#viewerCard'), vRecipient:$('#viewerRecipient'), vSender:$('#viewerSender'), vTitle:$('#viewerTitle'), vMessage:$('#viewerMessage'), vEmoji:$('#viewerEmoji'), vDate:$('#viewerDate'), vPhoto:$('#viewerPhoto'),
    introStage:$('#introStage'), introEnvelope:$('#introEnvelope'), introGift:$('#introGift'), introRecipient:$('#introRecipient'), viewerStage:$('#viewerCardStage'),
    photoStatus:$('#photoStatus'), photoRemove:$('#photoRemoveBtn'), fx:$('#fxLayer'), toast:$('#toast'), canvas:$('#exportCanvas'), installBtn:$('#installBtn')
  };

  const safeText = (v, fb='') => (v ?? '').toString().trim() || fb;
  function formatDate(dateStr){
    if(!dateStr) return '';
    const d = new Date(`${dateStr}T00:00:00`);
    if(Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(d);
  }
  function cleanState(data){
    return {
      recipient:safeText(data.recipient ?? data.r,defaults.recipient).slice(0,40), sender:safeText(data.sender ?? data.s,defaults.sender).slice(0,40),
      title:safeText(data.title ?? data.t,defaults.title).slice(0,80), message:safeText(data.message ?? data.m,defaults.message).slice(0,650),
      date:safeText(data.date ?? data.d,'').slice(0,10), photo:(data.photo ?? data.p ?? '').toString().slice(0,90000), emoji:safeText(data.emoji ?? data.e,defaults.emoji).slice(0,8),
      theme:THEMES.includes(data.theme ?? data.th)?(data.theme ?? data.th):defaults.theme,
      font:FONTS.includes(data.font ?? data.f)?(data.font ?? data.f):defaults.font,
      effect:EFFECTS.includes(data.effect ?? data.fx)?(data.effect ?? data.fx):defaults.effect,
      music:MUSICS.includes(data.music ?? data.mu)?(data.music ?? data.mu):defaults.music,
      intro:INTROS.includes(data.intro ?? data.i)?(data.intro ?? data.i):defaults.intro
    };
  }
  function syncFromForm(){
    Object.assign(state,cleanState({recipient:els.recipient.value,sender:els.sender.value,title:els.title.value,message:els.message.value,date:els.date.value,photo:state.photo,emoji:state.emoji,theme:state.theme,font:els.font.value,effect:els.effect.value,music:els.music.value,intro:els.intro.value}));
    updatePreview();
    if(els.autosave.checked) saveDraft(false);
  }
  function setImage(img, data){
    if(data){img.src=data;img.classList.remove('hidden')}else{img.removeAttribute('src');img.classList.add('hidden')}
  }
  function updatePreview(){
    els.pRecipient.textContent=state.recipient; els.pSender.textContent=state.sender; els.pTitle.textContent=state.title; els.pMessage.textContent=state.message; els.pEmoji.textContent=state.emoji; els.count.textContent=els.message.value.length;
    els.preview.className=`birthday-card theme-${state.theme} font-${state.font}`; setImage(els.pPhoto,state.photo);
    const fd=formatDate(state.date); els.pDate.textContent=fd; els.pDate.classList.toggle('hidden',!fd);
    els.photoStatus.textContent=state.photo?'Foto siap dipakai':'Belum ada foto'; els.photoRemove.classList.toggle('hidden',!state.photo);
  }
  function applyStateToForm(data){
    Object.assign(state,cleanState(data));
    els.recipient.value=state.recipient;els.sender.value=state.sender;els.title.value=state.title;els.message.value=state.message;els.date.value=state.date;els.font.value=state.font;els.effect.value=state.effect;els.music.value=state.music;els.intro.value=state.intro;
    $$('.emoji-chip').forEach(b=>b.classList.toggle('active',b.dataset.emoji===state.emoji));
    $$('.theme-chip').forEach(b=>b.classList.toggle('active',b.dataset.theme===state.theme)); updatePreview();
  }
  function encodePayload(data){
    const bytes=new TextEncoder().encode(JSON.stringify(data)); let binary='';
    for(const b of bytes) binary+=String.fromCharCode(b);
    return btoa(binary).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
  }
  function decodePayload(encoded){
    try{encoded=encoded.replaceAll('-','+').replaceAll('_','/');while(encoded.length%4)encoded+='=';const bin=atob(encoded);const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return JSON.parse(new TextDecoder().decode(bytes))}catch{return null}
  }
  function payload(){
    return {v:2,r:state.recipient,s:state.sender,t:state.title,m:state.message,d:state.date,p:state.photo,e:state.emoji,th:state.theme,f:state.font,fx:state.effect,mu:state.music,i:state.intro};
  }
  function buildShareUrl(){
    syncFromForm(); const base=location.href.split('#')[0]; return `${base}#card=${encodePayload(payload())}`;
  }
  function generateLink(){
    const url=buildShareUrl(); els.shareUrl.value=url; els.shareRecipient.textContent=state.recipient;
    const text=`🎂 Ada kartu ulang tahun untuk ${state.recipient}!\n\nBuka kartunya di sini: ${url}`; els.whatsapp.href=`https://wa.me/?text=${encodeURIComponent(text)}`;
    const len=url.length; els.urlHealth.className='url-health '+(len<8000?'good':len<32000?'warn':'bad'); els.urlHealth.textContent=len<8000?'Link ringan':len<32000?'Link cukup panjang':'Link sangat panjang';
    els.hostingWarning.classList.toggle('hidden',location.protocol!=='file:' && !['localhost','127.0.0.1'].includes(location.hostname));
    els.sharePanel.classList.remove('hidden');els.sharePanel.scrollIntoView({behavior:'smooth',block:'center'});runEffect(state.effect,50);showToast('Link kartu berhasil dibuat ✨');
  }
  async function compressPhoto(file){
    if(!file?.type?.startsWith('image/')) throw new Error('Pilih file gambar.');
    if(file.size>12*1024*1024) throw new Error('Ukuran foto terlalu besar. Maksimal 12 MB.');
    const src=await fileToDataUrl(file); const img=await loadImage(src); const max=260; const scale=Math.min(1,max/Math.max(img.width,img.height)); const w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
    const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);
    let q=.68, data=c.toDataURL('image/jpeg',q); while(data.length>52000 && q>.35){q-=.08;data=c.toDataURL('image/jpeg',q)} return data;
  }
  const fileToDataUrl=file=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});
  const loadImage=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src});
  async function handlePhoto(){
    try{const file=els.photo.files[0];if(!file)return;els.photoStatus.textContent='Mengompres foto…';state.photo=await compressPhoto(file);updatePreview();if(els.autosave.checked)saveDraft(false);showToast('Foto berhasil ditambahkan 📷')}catch(e){showToast(e.message||'Foto gagal diproses')}finally{els.photo.value=''}
  }
  function removePhoto(){state.photo='';updatePreview();if(els.autosave.checked)saveDraft(false);showToast('Foto dihapus')}
  function saveDraft(notify=true){try{localStorage.setItem(DRAFT_KEY,JSON.stringify({...state,autosave:els.autosave.checked}));if(notify)showToast('Draft tersimpan di perangkat ini 💾')}catch{if(notify)showToast('Draft tidak dapat disimpan')}}
  function restoreDraft(){
    try{const raw=localStorage.getItem(DRAFT_KEY);if(!raw)return false;const d=JSON.parse(raw);applyStateToForm(d);els.autosave.checked=d.autosave!==false;showToast('Draft sebelumnya dipulihkan');return true}catch{return false}
  }
  function clearDraft(){try{localStorage.removeItem(DRAFT_KEY)}catch{}}
  function resetForm(){clearDraft();applyStateToForm(defaults);els.autosave.checked=true;els.sharePanel.classList.add('hidden');showToast('Form dikembalikan ke awal')}
  function showToast(msg){els.toast.textContent=msg;els.toast.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>els.toast.classList.remove('show'),2300)}
  function runEffect(type=state.effect,count=70){
    if(type==='none')return; const colors=['#f472b6','#c4b5fd','#fde68a','#67e8f9','#86efac','#ffffff'];
    for(let i=0;i<count;i++){
      const p=document.createElement('i');p.className=`fx-piece ${type==='confetti'?'confetti':type==='hearts'?'heart':'star'}`;p.style.left=`${Math.random()*100}%`;p.style.setProperty('--drift',`${(Math.random()-.5)*260}px`);p.style.setProperty('--spin',`${360+Math.random()*900}deg`);p.style.animationDuration=`${2.8+Math.random()*2.2}s`;p.style.animationDelay=`${Math.random()*.55}s`;
      if(type==='confetti')p.style.background=colors[Math.floor(Math.random()*colors.length)];else{p.textContent=type==='hearts'?(Math.random()>.5?'♥':'♡'):(Math.random()>.5?'✦':'✧');p.style.color=colors[Math.floor(Math.random()*colors.length)]}
      els.fx.appendChild(p);setTimeout(()=>p.remove(),5900);
    }
  }
  function stopMusic(){activeAudioNodes.forEach(n=>{try{n.stop()}catch{}});activeAudioNodes=[]}
  function playMusic(type=state.music){
    stopMusic();if(type==='none')return;
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return showToast('Audio tidak didukung browser ini');audioCtx ||= new AC();if(audioCtx.state==='suspended')audioCtx.resume();
    const birthday=[392,392,440,392,523.25,493.88,392,392,440,392,587.33,523.25,392,392,783.99,659.25,523.25,493.88,440,698.46,698.46,659.25,523.25,587.33,523.25];
    const dreamy=[261.63,329.63,392,523.25,392,329.63,293.66,349.23,440,587.33,440,349.23,329.63,392,493.88,659.25,493.88,392];
    const notes=type==='dreamy'?dreamy:birthday;let t=audioCtx.currentTime+.02;notes.forEach((freq,i)=>{const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type=type==='dreamy'?'triangle':'sine';osc.frequency.value=freq;const dur=type==='dreamy'?.36:(i%6===5?.68:.23);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(type==='dreamy'?.055:.1,t+.02);gain.gain.exponentialRampToValueAtTime(.0001,t+dur);osc.connect(gain).connect(audioCtx.destination);osc.start(t);osc.stop(t+dur+.03);activeAudioNodes.push(osc);t+=dur});showToast(type==='dreamy'?'♫ Dreamy melody':'♫ Birthday chime')
  }
  function renderViewer(data,fromPreview=false){
    Object.assign(state,cleanState(data));els.vRecipient.textContent=state.recipient;els.vSender.textContent=state.sender;els.vTitle.textContent=state.title;els.vMessage.textContent=state.message;els.vEmoji.textContent=state.emoji;els.viewerCard.className=`birthday-card large-card theme-${state.theme} font-${state.font}`;setImage(els.vPhoto,state.photo);
    const fd=formatDate(state.date);els.vDate.textContent=fd;els.vDate.classList.toggle('hidden',!fd);els.introRecipient.textContent=state.recipient;
    els.builder.classList.add('hidden');els.viewer.classList.remove('hidden');els.viewerStage.classList.add('hidden');els.introStage.classList.remove('hidden');els.introEnvelope.classList.remove('open');els.introGift.classList.remove('open');
    els.introEnvelope.classList.toggle('hidden',state.intro!=='envelope');els.introGift.classList.toggle('hidden',state.intro!=='gift');
    $('#introTitle').textContent=state.intro==='gift'?'Ada hadiah kecil untukmu…':'Seseorang mengirimkan sesuatu untukmu…';
    if(state.intro==='direct'){els.introStage.classList.add('hidden');els.viewerStage.classList.remove('hidden');setTimeout(()=>runEffect(state.effect,80),200)}
    document.title=`🎂 Untuk ${state.recipient} — Birthday Link`;
    if(fromPreview) history.replaceState(null,'',location.pathname+location.search);
  }
  function openCard(){
    if(state.intro==='envelope')els.introEnvelope.classList.add('open');if(state.intro==='gift')els.introGift.classList.add('open');
    setTimeout(()=>{els.introStage.classList.add('hidden');els.viewerStage.classList.remove('hidden');runEffect(state.effect,100);playMusic(state.music)},state.intro==='direct'?0:650)
  }
  function parseHash(){const m=location.hash.match(/^#card=(.+)$/);if(!m)return false;const d=decodePayload(m[1]);if(!d)return false;renderViewer(d);return true}
  async function copyLink(){const v=els.shareUrl.value||buildShareUrl();try{await navigator.clipboard.writeText(v);showToast('Link sudah disalin 📋')}catch{els.shareUrl.value=v;els.shareUrl.select();document.execCommand('copy');showToast('Link sudah disalin 📋')}}
  async function nativeShare(received=false){const url=received?location.href:(els.shareUrl.value||buildShareUrl());const title=`Kartu ulang tahun untuk ${state.recipient}`;if(navigator.share){try{await navigator.share({title,text:`Ada kartu ulang tahun untuk ${state.recipient} 🎂`,url})}catch(e){if(e.name!=='AbortError')copyLink()}}else copyLink()}
  function wrapCanvasText(ctx,text,maxWidth){const words=text.split(/\s+/);const lines=[];let line='';for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}if(line)lines.push(line);return lines}
  async function downloadCard(){
    syncFromForm();const c=els.canvas,ctx=c.getContext('2d'),grad=ctx.createLinearGradient(0,0,c.width,c.height);const pairs={violet:['#6d28d9','#be185d'],rose:['#9f1239','#fb7185'],sunset:['#c2410c','#f59e0b'],ocean:['#075985','#0891b2'],emerald:['#065f46','#10b981'],midnight:['#111827','#312e81'],peach:['#ea580c','#e11d48'],champagne:['#5c4424','#d8bd72']};const [a,b]=pairs[state.theme];grad.addColorStop(0,a);grad.addColorStop(1,b);ctx.fillStyle=grad;ctx.fillRect(0,0,c.width,c.height);ctx.textAlign='center';ctx.fillStyle='#fff';
    ctx.globalAlpha=.1;ctx.beginPath();ctx.arc(920,150,300,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(70,1240,250,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    let y=155;if(state.photo){try{const img=await loadImage(state.photo);ctx.save();ctx.beginPath();ctx.arc(540,220,115,0,Math.PI*2);ctx.clip();const r=Math.max(230/img.width,230/img.height),w=img.width*r,h=img.height*r;ctx.drawImage(img,540-w/2,220-h/2,w,h);ctx.restore();ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=8;ctx.beginPath();ctx.arc(540,220,115,0,Math.PI*2);ctx.stroke();y=380}catch{}}
    ctx.font='68px sans-serif';ctx.fillText(state.emoji,540,y);y+=78;ctx.font='700 21px sans-serif';ctx.globalAlpha=.75;ctx.fillText('UNTUK',540,y);ctx.globalAlpha=1;y+=60;ctx.font=state.font==='classic'?'bold 92px Georgia':'bold 84px sans-serif';ctx.fillText(state.recipient,540,y);y+=state.date?58:70;if(state.date){ctx.font='700 24px sans-serif';ctx.globalAlpha=.82;ctx.fillText(formatDate(state.date),540,y);ctx.globalAlpha=1;y+=70}ctx.font='800 37px sans-serif';ctx.fillText(state.title,540,y);y+=65;ctx.font='30px sans-serif';ctx.globalAlpha=.92;const lines=wrapCanvasText(ctx,state.message,820).slice(0,9);for(const line of lines){ctx.fillText(line,540,y);y+=45}ctx.globalAlpha=.72;ctx.font='24px sans-serif';ctx.fillText('Dengan doa terbaik,',540,1165);ctx.globalAlpha=1;ctx.font='bold 39px Georgia';ctx.fillText(state.sender,540,1215);
    c.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`kartu-ulang-tahun-${state.recipient.toLowerCase().replace(/[^a-z0-9]+/gi,'-')||'birthday'}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);showToast('Kartu PNG berhasil dibuat 🖼')},'image/png')
  }
  function applyTemplate(){const t=templates[$('#templateSelect').value]||templates.warm;els.title.value=t.title;els.message.value=t.message;syncFromForm();showToast('Template ucapan diterapkan')}

  [els.recipient,els.sender,els.title,els.message,els.date,els.font,els.effect,els.music,els.intro].forEach(el=>el.addEventListener('input',syncFromForm));
  $$('.emoji-chip').forEach(btn=>btn.addEventListener('click',()=>{state.emoji=btn.dataset.emoji;$$('.emoji-chip').forEach(b=>b.classList.toggle('active',b===btn));updatePreview();if(els.autosave.checked)saveDraft(false)}));
  $$('.theme-chip').forEach(btn=>btn.addEventListener('click',()=>{state.theme=btn.dataset.theme;$$('.theme-chip').forEach(b=>b.classList.toggle('active',b===btn));updatePreview();if(els.autosave.checked)saveDraft(false)}));
  $('#photoPickBtn').addEventListener('click',()=>els.photo.click());els.photo.addEventListener('change',handlePhoto);els.photoRemove.addEventListener('click',removePhoto);
  $('#applyTemplateBtn').addEventListener('click',applyTemplate);$('#saveDraftBtn').addEventListener('click',()=>{syncFromForm();saveDraft(true)});$('#resetBtn').addEventListener('click',resetForm);$('#generateBtn').addEventListener('click',generateLink);$('#downloadBtn').addEventListener('click',downloadCard);
  $('#copyBtn').addEventListener('click',copyLink);$('#nativeShareBtn').addEventListener('click',()=>nativeShare(false));$('#openLinkBtn').addEventListener('click',()=>window.open(els.shareUrl.value||buildShareUrl(),'_blank'));$('#previewBtn').addEventListener('click',()=>{syncFromForm();renderViewer(payload(),true)});
  $('#openCardBtn').addEventListener('click',openCard);$('#celebrateBtn').addEventListener('click',()=>{runEffect(state.effect,110);playMusic(state.music)});$('#viewerMusicBtn').addEventListener('click',()=>playMusic(state.music));$('#shareReceivedBtn').addEventListener('click',()=>nativeShare(true));$('#makeOwnBtn').addEventListener('click',()=>{stopMusic();location.href=location.href.split('#')[0]});
  els.autosave.addEventListener('change',()=>{if(els.autosave.checked){syncFromForm();saveDraft(false)}else clearDraft()});
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#card='))parseHash()});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;els.installBtn.classList.remove('hidden')});
  els.installBtn.addEventListener('click',async()=>{if(!installPrompt)return showToast('Gunakan menu browser → Install/Add to Home Screen');installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;els.installBtn.classList.add('hidden')});
  window.addEventListener('appinstalled',()=>showToast('Birthday Link berhasil di-install 🎉'));
  if('serviceWorker' in navigator && location.protocol!=='file:') window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

  updatePreview(); if(!parseHash()) restoreDraft();
})();
