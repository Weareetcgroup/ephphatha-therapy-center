(()=>{
'use strict';
const sb=window.ephSupabase;if(!sb)return;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BUCKET='website-media';
let media={},therapists=[];
function msg(t,good=true){const el=$('#admin-message');if(el){el.innerHTML=`<div class="notice ${good?'good':''}">${esc(t)}</div>`;el.scrollIntoView({behavior:'smooth',block:'nearest'});}}
function installCss(){if($('#eph-media-css'))return;const s=document.createElement('style');s.id='eph-media-css';s.textContent=`
.media-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.media-card{border:1px solid #dbe9e7;border-radius:20px;padding:18px;background:#fff}.media-preview{display:grid;place-items:center;min-height:170px;border-radius:16px;background:#f3f9f8;border:1px dashed #cfe1df;overflow:hidden;margin-bottom:14px}.media-preview img{max-width:100%;width:100%;height:210px;object-fit:cover}.media-preview.logo img{height:150px;object-fit:contain;padding:18px}.team-media-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}.team-media-card{border:1px solid #dbe9e7;border-radius:20px;padding:16px;background:#fff}.team-photo{width:100%;aspect-ratio:4/4.5;border-radius:16px;object-fit:cover;background:#f0f7f6;margin-bottom:12px}.team-photo-placeholder{display:grid;place-items:center;width:100%;aspect-ratio:4/4.5;border-radius:16px;background:linear-gradient(145deg,#e8f8f5,#fff3f7);font-size:4rem;font-weight:800;color:#319c99;margin-bottom:12px}.media-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.media-actions .btn{flex:0 0 auto}.media-help{font-size:.8rem;color:#6b7f82;line-height:1.5;margin-top:7px}@media(max-width:760px){.media-grid{grid-template-columns:1fr}}
`;document.head.appendChild(s);}
function install(){
 installCss();const nav=$('.side-nav'),app=$('.app-content');if(!nav||!app)return;
 let b=nav.querySelector('[data-view="media"]');if(!b){b=document.createElement('button');b.dataset.view='media';b.textContent='Brand & Team Media';const d=nav.querySelector('[data-view="design"]')||nav.querySelector('[data-view="website"]');nav.insertBefore(b,d?.nextSibling||nav.querySelector('a'));}
 let sec=$('[data-view-panel="media"]');if(!sec){sec=document.createElement('section');sec.className='view';sec.dataset.viewPanel='media';sec.innerHTML=`
 <div class="page-head"><div><h2>Brand & Team Media</h2><p>Upload the center logo, main website images and therapist profile photos. No GitHub editing required.</p></div><button class="btn btn-secondary" id="media-refresh">Refresh</button></div>
 <div class="panel" style="margin-bottom:20px"><h3>Center brand images</h3><p class="muted">Recommended: transparent PNG/WebP for logo; landscape JPG/WebP for hero images.</p><div class="media-grid" id="brand-media-grid"></div></div>
 <div class="panel" style="margin-bottom:20px"><h3>Team section</h3><form id="team-section-form" class="form-grid"><div class="field"><label>Show team on home page</label><select name="show_team"><option value="1">Yes</option><option value="0">No</option></select></div><div class="field"><label>Small label</label><input name="kicker" placeholder="Our team"></div><div class="field full"><label>Heading</label><input name="heading" placeholder="Meet the people behind the care."></div><div class="field full"><label>Introduction</label><textarea name="intro"></textarea></div><div class="field full"><button class="btn btn-primary">Save team section</button></div></form></div>
 <div class="panel"><div class="page-head" style="margin-bottom:14px"><div><h3>Therapist profile photos</h3><p>These photos appear below “Meet the people behind the care.” Diana Nixon’s therapist photo is also used as the About-page founder portrait when no separate Founder portrait is uploaded.</p></div><button class="btn btn-secondary" type="button" id="go-therapists">Edit therapist details</button></div><div class="team-media-grid" id="team-media-grid"></div></div>`;app.appendChild(sec);}
 b.onclick=()=>{$$('[data-view]').forEach(x=>x.classList.toggle('active',x===b));$$('[data-view-panel]').forEach(x=>x.classList.toggle('active',x===sec));$('#admin-title').textContent='Brand & Team Media';$('#app-side')?.classList.remove('open');};
 $('#go-therapists').onclick=()=>document.querySelector('[data-view="therapists"]')?.click();
 $('#media-refresh').onclick=loadAll;
}
async function getSettings(){
 const r=await sb.from('settings').select('key,value').in('key',['brand_media','team_content','show_team']);if(r.error)throw r.error;return Object.fromEntries((r.data||[]).map(x=>[x.key,x.value]));
}
function brandCards(){
 const root=$('#brand-media-grid');if(!root)return;
 const defs=[
  ['logo_url','Center logo','logo','Use transparent PNG/WebP when possible. The public header/footer logo updates from this.'],
  ['favicon_url','Browser icon / favicon','logo','Square image, ideally PNG.'],
  ['home_hero_url','Home hero image','image','Landscape therapy/center image shown in the main home hero.'],
  ['founder_image_url','Founder portrait — Diana Nixon','image','Square or portrait image used in the About page founder circle. If left blank, Diana’s therapist profile photo is used automatically.'],
  ['online_image_url','Online Therapy image','image','Image used on the Online Therapy page.']
 ];
 root.innerHTML=defs.map(([key,title,type,help])=>`<div class="media-card" data-brand-card="${key}"><h4>${title}</h4><div class="media-preview ${type==='logo'?'logo':''}">${media[key]?`<img src="${esc(media[key])}" alt="">`:'<span class="muted">No image selected</span>'}</div><input type="file" data-brand-file="${key}" accept="image/png,image/jpeg,image/webp,image/gif"><div class="media-actions"><button class="btn btn-primary btn-sm" type="button" data-brand-upload="${key}">Upload / replace</button>${media[key]&&String(media[key]).startsWith('http')?`<button class="btn btn-secondary btn-sm" type="button" data-brand-clear="${key}">Clear</button>`:''}</div><div class="media-help">${help}</div></div>`).join('');
 $$('[data-brand-upload]',root).forEach(b=>b.onclick=()=>uploadBrand(b.dataset.brandUpload));
 $$('[data-brand-clear]',root).forEach(b=>b.onclick=()=>clearBrand(b.dataset.brandClear));
}
function safeName(name){return String(name||'image').replace(/[^a-zA-Z0-9._-]/g,'-');}
async function uploadFile(file,folder){
 if(!file)throw new Error('Choose an image first.');
 if(file.size>8*1024*1024)throw new Error('Image must be 8 MB or smaller.');
 const path=`${folder}/${Date.now()}-${safeName(file.name)}`;
 const up=await sb.storage.from(BUCKET).upload(path,file,{upsert:false,cacheControl:'3600'});if(up.error)throw up.error;
 return {url:sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,path};
}
async function removeStored(url){
 const marker='/storage/v1/object/public/website-media/';if(!url||!String(url).includes(marker))return;
 const p=decodeURIComponent(String(url).split(marker)[1]||'');if(p)await sb.storage.from(BUCKET).remove([p]);
}
async function uploadBrand(key){
 try{
  const file=$(`[data-brand-file="${key}"]`)?.files?.[0],old=media[key];
  const result=await uploadFile(file,`branding/${key.replace('_url','')}`);
  media={...media,[key]:result.url};
  const r=await sb.from('settings').upsert({key:'brand_media',value:media},{onConflict:'key'});if(r.error)throw r.error;
  if(old&&old!==result.url)await removeStored(old);
  brandCards();msg('Brand image updated. Refresh the public website to see it.',true);
 }catch(e){msg(e.message,false);}
}
async function clearBrand(key){
 try{
  const old=media[key];media={...media,[key]:''};
  const r=await sb.from('settings').upsert({key:'brand_media',value:media},{onConflict:'key'});if(r.error)throw r.error;
  await removeStored(old);brandCards();msg('Brand image cleared.',true);
 }catch(e){msg(e.message,false);}
}
function renderTeam(){
 const root=$('#team-media-grid');if(!root)return;
 root.innerHTML=therapists.length?therapists.map(t=>`<article class="team-media-card" data-therapist="${t.id}">${t.photo_url?`<img class="team-photo" src="${esc(t.photo_url)}" alt="${esc(t.full_name)}">`:`<div class="team-photo-placeholder">${esc((t.full_name||'E')[0])}</div>`}<h4 style="margin:0 0 4px">${esc(t.full_name)}</h4><div class="muted" style="font-size:.84rem;margin-bottom:10px">${esc(t.title||'Therapist')} ${t.qualifications?'· '+esc(t.qualifications):''}</div><input type="file" data-therapist-file="${t.id}" accept="image/png,image/jpeg,image/webp"><div class="media-actions"><button class="btn btn-primary btn-sm" type="button" data-therapist-upload="${t.id}">Upload / replace photo</button>${t.photo_url?`<button class="btn btn-secondary btn-sm" type="button" data-therapist-remove="${t.id}">Remove photo</button>`:''}</div></article>`).join(''):'<div class="empty">No active therapist profiles yet.</div>';
 $$('[data-therapist-upload]',root).forEach(b=>b.onclick=()=>uploadTherapist(Number(b.dataset.therapistUpload)));
 $$('[data-therapist-remove]',root).forEach(b=>b.onclick=()=>removeTherapist(Number(b.dataset.therapistRemove)));
}
async function uploadTherapist(id){
 try{
  const t=therapists.find(x=>x.id===id);if(!t)throw new Error('Therapist not found.');
  const file=$(`[data-therapist-file="${id}"]`)?.files?.[0],old=t.photo_url;
  const result=await uploadFile(file,`therapists/${id}`);
  const r=await sb.from('therapists').update({photo_url:result.url}).eq('id',id);if(r.error)throw r.error;
  if(old&&old!==result.url)await removeStored(old);
  t.photo_url=result.url;renderTeam();msg(`${t.full_name} photo updated.`,true);
 }catch(e){msg(e.message,false);}
}
async function removeTherapist(id){
 try{
  const t=therapists.find(x=>x.id===id);if(!t)return;
  const old=t.photo_url,r=await sb.from('therapists').update({photo_url:null}).eq('id',id);if(r.error)throw r.error;
  await removeStored(old);t.photo_url=null;renderTeam();msg(`${t.full_name} photo removed.`,true);
 }catch(e){msg(e.message,false);}
}
async function loadAll(){
 try{
  const [settings,tr]=await Promise.all([getSettings(),sb.from('therapists').select('id,full_name,title,qualifications,photo_url,active').eq('active',true).order('full_name')]);
  if(tr.error)throw tr.error;media=settings.brand_media||{};therapists=tr.data||[];
  brandCards();renderTeam();
  const team=settings.team_content||{},f=$('#team-section-form');f.elements.show_team.value=settings.show_team===false?'0':'1';f.elements.kicker.value=team.kicker||'Our team';f.elements.heading.value=team.heading||'Meet the people behind the care.';f.elements.intro.value=team.intro||'Experienced professionals working with families through thoughtful, individualized care.';
 }catch(e){msg('Media manager could not load: '+e.message,false);}
}
async function saveTeam(e){
 e.preventDefault();const f=e.target,value={kicker:f.elements.kicker.value.trim(),heading:f.elements.heading.value.trim(),intro:f.elements.intro.value.trim()};
 const r=await sb.from('settings').upsert([{key:'team_content',value},{key:'show_team',value:f.elements.show_team.value==='1'}],{onConflict:'key'});if(r.error)return msg(r.error.message,false);msg('Team section saved. Refresh the public website to see it.',true);
}
(async()=>{install();$('#team-section-form').onsubmit=saveTeam;await loadAll();document.documentElement.dataset.ephMediaManager='v7';})();
})();