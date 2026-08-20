(()=>{
'use strict';
const sb=window.ephSupabase;if(!sb)return;
const LIB=window.EPH_DESIGN_LIBRARY||{};
const themes=LIB.themes||[];
const themeMap=LIB.themeMap||{};
const optionMap=LIB.options||{};
const defaults=LIB.defaultDesign||{};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let current={...defaults},savedDefault={...defaults};
const featured=['sunshine_bloom','soft_lavender','modern_hospital','wildlife_wonder','under_the_sea','midnight_luxe','spring_blossom','christmas_cheer'];
function msg(t,good=true){const el=$('#admin-message');if(el){el.innerHTML=`<div class="notice ${good?'good':''}">${String(t||'')}</div>`;el.scrollIntoView({behavior:'smooth',block:'nearest'});}}
function optionsHtml(key){return (optionMap[key]||[]).map(o=>`<option value="${o.id}">${o.label}</option>`).join('');}
function themeOptions(category='all'){
 const cats=category==='all'?(LIB.categories||[]):[category];
 return cats.map(cat=>`<optgroup label="${cat}">${themes.filter(t=>t.category===cat).map(t=>`<option value="${t.id}">${t.name}${t.id==='sunshine_bloom'?' — Recommended':''}</option>`).join('')}</optgroup>`).join('');
}
function themeColors(id){return themeMap[id]?.colors||themeMap.sunshine_bloom?.colors||{primary:'#2faaa0',deep:'#196f69',accent:'#e9508d',secondary:'#f5b93f',ink:'#413a32',background:'#fffdf7',soft:'#fff8e8'};}
function effectiveColors(d=current){
 const c={...themeColors(d.preset)};
 if(d.color_mode==='custom')Object.entries(d.custom_colors||{}).forEach(([k,v])=>{if(v)c[k]=v;});
 return c;
}
function installCss(){
 if($('#eph-design-admin-css'))return;
 const s=document.createElement('style');s.id='eph-design-admin-css';s.textContent=`
.design-library-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:14px 0 20px}.design-featured-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0 22px}.design-preset{border:2px solid #e0ebea;background:#fff;border-radius:18px;padding:14px;text-align:left;cursor:pointer;transition:.18s}.design-preset:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(25,70,75,.08)}.design-preset.selected{border-color:#17494e;box-shadow:0 0 0 3px rgba(63,184,176,.12)}.design-preset-swatches{display:flex;gap:4px;margin-bottom:10px}.design-preset-swatches i{display:block;height:9px;flex:1;border-radius:999px}.design-preset strong{display:block;margin-bottom:4px}.design-preset small{display:block;color:#657a7d;line-height:1.35;font-size:.76rem}.design-preview{border-radius:24px;padding:24px;border:1px solid #dcebea;margin:18px 0}.design-preview-bar{display:flex;gap:6px;margin-bottom:16px}.design-preview-bar i{height:9px;border-radius:999px;flex:1}.design-preview h3{margin:0 0 7px}.design-preview p{margin:0}.design-note{padding:13px 15px;border-radius:14px;background:#f3fbfa;border:1px solid #dcebea;color:#506b70;margin-bottom:18px}.design-default-badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 10px;background:#fff5ca;color:#695816;font-size:.78rem;font-weight:800}.design-color-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.design-color-grid .field input[type=color]{height:48px;padding:4px}.design-advanced{margin-top:20px}.design-section-title{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:28px 0 8px}.theme-library-grid{display:grid;grid-template-columns:1fr 2fr;gap:12px}.magic-note{font-size:.79rem;color:#657a7d;margin-top:8px}@media(max-width:1050px){.design-featured-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:760px){.design-featured-grid,.design-color-grid,.theme-library-grid{grid-template-columns:1fr}}
`;document.head.appendChild(s);
}
function hideLegacyTheme(){
 const p=$('#theme-form')?.closest('.panel');if(p){p.style.display='none';p.dataset.replacedByDesignStudio='1';}
 const old=$('#content-settings-form')?.closest('.panel');if(old&&$('#cms-visibility-form'))old.style.display='none';
}
function install(){
 installCss();hideLegacyTheme();
 const nav=$('.side-nav'),app=$('.app-content');if(!nav||!app)return;
 let b=nav.querySelector('[data-view="design"]');if(!b){b=document.createElement('button');b.dataset.view='design';b.textContent='Design Studio';const w=nav.querySelector('[data-view="website"]');nav.insertBefore(b,w||nav.querySelector('a'));}
 let sec=$('[data-view-panel="design"]');
 if(!sec){sec=document.createElement('section');sec.className='view';sec.dataset.viewPanel='design';sec.innerHTML=`
 <div class="page-head"><div><h2>Design Studio</h2><p>Choose a complete mood or build your own visual style. Content, bookings and patient data are unaffected.</p></div><a class="btn btn-secondary" href="index.html" target="_blank">Open live preview ↗</a></div>
 <div class="panel">
  <div class="design-note"><strong>Recommended default:</strong> Sunshine Bloom. You can experiment freely, save a new default later, or reset back to your saved default at any time.</div>
  <div class="design-library-toolbar">
   <button class="btn btn-primary" type="button" id="design-save-top">Save & publish</button>
   <button class="btn btn-secondary" type="button" id="design-magic">✨ Magic Mix</button>
   <button class="btn btn-secondary" type="button" id="design-reset-default">Reset to default</button>
   <button class="btn btn-secondary" type="button" id="design-make-default">Make current design default</button>
   <span class="design-default-badge" id="design-default-badge">Default: Sunshine Bloom</span>
  </div>

  <div class="design-section-title"><div><h3>Featured moods</h3><p class="muted">Quick starting points. The full library below contains 50 themes.</p></div></div>
  <div class="design-featured-grid" id="design-featured-grid"></div>

  <div class="design-section-title"><div><h3>Theme library</h3><p class="muted">Choose clinical, kids, wildlife, nature, luxury or seasonal themes by name.</p></div></div>
  <div class="theme-library-grid">
   <div class="field"><label>Theme category</label><select id="design-category"><option value="all">All 50 themes</option>${(LIB.categories||[]).map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>
   <div class="field"><label>Theme name</label><select id="design-theme-select">${themeOptions()}</select></div>
  </div>
  <div class="design-preview" id="design-preview"></div>

  <div class="design-section-title"><div><h3>Color laboratory</h3><p class="muted">Use the named theme palette or override individual colors manually.</p></div><button class="btn btn-secondary btn-sm" type="button" id="design-theme-colors">Restore theme colors</button></div>
  <div class="field" style="max-width:360px;margin-bottom:12px"><label>Color mode</label><select id="design-color-mode"><option value="preset">Use theme colors</option><option value="custom">Custom color pickers</option></select></div>
  <div class="design-color-grid" id="design-color-grid">
   <div class="field"><label>Primary</label><input type="color" data-color="primary"></div>
   <div class="field"><label>Deep primary</label><input type="color" data-color="deep"></div>
   <div class="field"><label>Accent</label><input type="color" data-color="accent"></div>
   <div class="field"><label>Secondary</label><input type="color" data-color="secondary"></div>
   <div class="field"><label>Text / ink</label><input type="color" data-color="ink"></div>
   <div class="field"><label>Page background</label><input type="color" data-color="background"></div>
   <div class="field"><label>Soft section background</label><input type="color" data-color="soft"></div>
  </div>

  <div class="design-section-title"><div><h3>Layout & personality</h3><p class="muted">Fine-tune how the same theme behaves across the site.</p></div></div>
  <form id="design-studio-form" class="form-grid">
   <input type="hidden" name="preset">
   <div class="field"><label>Typography</label><select name="typography">${optionsHtml('typography')}</select></div>
   <div class="field"><label>Navigation</label><select name="nav_style">${optionsHtml('nav_style')}</select></div>
   <div class="field"><label>Cards</label><select name="card_style">${optionsHtml('card_style')}</select></div>
   <div class="field"><label>Spacing</label><select name="density">${optionsHtml('density')}</select></div>
   <div class="field"><label>Home hero</label><select name="hero_layout">${optionsHtml('hero_layout')}</select></div>
   <div class="field"><label>Motion</label><select name="motion">${optionsHtml('motion')}</select></div>
   <div class="field"><label>Service colors</label><select name="service_color_mode">${optionsHtml('service_color_mode')}</select></div>
   <div class="field"><label>Buttons</label><select name="button_style">${optionsHtml('button_style')}</select></div>
   <div class="field"><label>Section treatment</label><select name="section_style">${optionsHtml('section_style')}</select></div>
   <div class="field"><label>Image treatment</label><select name="image_style">${optionsHtml('image_style')}</select></div>
   <div class="field"><label>Header style</label><select name="header_style">${optionsHtml('header_style')}</select></div>
   <div class="field"><label>Page width</label><select name="page_width">${optionsHtml('page_width')}</select></div>
   <div class="field"><label>Heading accent</label><select name="heading_accent">${optionsHtml('heading_accent')}</select></div>
   <div class="field"><label>Background texture</label><select name="background_texture">${optionsHtml('background_texture')}</select></div>
   <div class="field"><label>Border style</label><select name="border_style">${optionsHtml('border_style')}</select></div>
   <div class="field"><label>Shadow style</label><select name="shadow_style">${optionsHtml('shadow_style')}</select></div>
   <div class="field"><label>Corner style</label><select name="corner_style">${optionsHtml('corner_style')}</select></div>
   <div class="field"><label>Show session duration + mode</label><select name="show_service_meta"><option value="1">Yes</option><option value="0">No</option></select></div>
   <div class="field full"><button class="btn btn-primary">Save & publish design</button><div class="magic-note">Tip: Magic Mix creates a safe random combination without changing your website content.</div></div>
  </form>
 </div>`;
 app.appendChild(sec);}
 b.onclick=()=>{$$('[data-view]').forEach(x=>x.classList.toggle('active',x===b));$$('[data-view-panel]').forEach(x=>x.classList.toggle('active',x===sec));$('#admin-title').textContent='Design Studio';$('#app-side')?.classList.remove('open');};
}
function syncForm(){
 const f=$('#design-studio-form');if(!f)return;
 f.elements.preset.value=current.preset||'sunshine_bloom';
 Object.entries(current).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=typeof v==='boolean'?(v?'1':'0'):v;});
 const ts=$('#design-theme-select'),cat=$('#design-category');
 if(ts&&!Array.from(ts.options).some(o=>o.value===(current.preset||'sunshine_bloom'))){if(cat)cat.value='all';ts.innerHTML=themeOptions();}
 if(ts)ts.value=current.preset||'sunshine_bloom';
 $('#design-color-mode').value=current.color_mode||'preset';
 const c=effectiveColors(current);$$('[data-color]').forEach(x=>x.value=c[x.dataset.color]||'#ffffff');
}
function renderFeatured(){
 const root=$('#design-featured-grid');if(!root)return;
 root.innerHTML=featured.map(id=>themeMap[id]).filter(Boolean).map(t=>`<button type="button" class="design-preset ${current.preset===t.id?'selected':''}" data-preset="${t.id}"><span class="design-preset-swatches">${['primary','accent','secondary','soft'].map(k=>`<i style="background:${t.colors[k]}"></i>`).join('')}</span><strong>${t.name}${t.id==='sunshine_bloom'?' ★':''}</strong><small>${t.description}</small></button>`).join('');
 $$('[data-preset]',root).forEach(x=>x.onclick=()=>chooseTheme(x.dataset.preset));
}
function renderPreview(){
 const t=themeMap[current.preset]||themeMap.sunshine_bloom,c=effectiveColors(current),box=$('#design-preview');if(!box)return;
 box.style.background=`linear-gradient(135deg,${c.primary}18,${c.secondary}24,${c.accent}14)`;
 box.innerHTML=`<div class="design-preview-bar">${['primary','accent','secondary','soft'].map(k=>`<i style="background:${c[k]}"></i>`).join('')}</div><h3>${t?.name||'Custom design'}${current.color_mode==='custom'?' + custom colors':''}</h3><p>${t?.description||''}</p>`;
}
function renderDefaultBadge(){
 const t=themeMap[savedDefault.preset]||themeMap.sunshine_bloom;$('#design-default-badge').textContent=`Default: ${t?.name||'Sunshine Bloom'}`;
}
function chooseTheme(id){
 if(!themeMap[id])return;
 current={...current,preset:id,color_mode:'preset',custom_colors:{}};
 syncForm();renderFeatured();renderPreview();
}
function readForm(){
 const f=$('#design-studio-form');
 const keys=['typography','nav_style','card_style','density','hero_layout','motion','service_color_mode','button_style','section_style','image_style','header_style','page_width','heading_accent','background_texture','border_style','shadow_style','corner_style'];
 keys.forEach(k=>current[k]=f.elements[k].value);
 current.show_service_meta=f.elements.show_service_meta.value==='1';
 current.preset=f.elements.preset.value||current.preset||'sunshine_bloom';
 current.color_mode=$('#design-color-mode').value;
 if(current.color_mode==='custom'){
  current.custom_colors={};$$('[data-color]').forEach(x=>current.custom_colors[x.dataset.color]=x.value);
 }else current.custom_colors={};
 return current;
}
function legacyTheme(d){
 const c=effectiveColors(d);
 const radius=d.corner_style==='square'?'8px':d.corner_style==='pill'?'40px':d.corner_style==='soft'?'18px':'28px';
 return {primary:c.primary,accent:c.accent,ink:c.ink,radius,hero_style:d.hero_layout};
}
async function persistDesign(d){
 const r=await sb.from('settings').upsert([{key:'design_system',value:d},{key:'theme',value:legacyTheme(d)}],{onConflict:'key'});if(r.error)throw r.error;
 try{localStorage.setItem('eph_design_system_v7',JSON.stringify(d));localStorage.setItem('eph_design_version','7');}catch{}
}
async function save(){
 try{readForm();await persistDesign(current);renderFeatured();renderPreview();msg('Design published. Refresh the public website to see it.',true);}catch(e){msg(e.message,false);}
}
async function resetDefault(){
 try{
  current={...defaults,...savedDefault,custom_colors:{...(savedDefault.custom_colors||{})}};
  await persistDesign(current);syncForm();renderFeatured();renderPreview();msg('Website reset to your saved default design.',true);
 }catch(e){msg(e.message,false);}
}
async function makeDefault(){
 try{
  readForm();
  if(!confirm('Make the current design your new default? You can still change it later.'))return;
  await persistDesign(current);
  const r=await sb.from('settings').upsert({key:'design_default',value:current},{onConflict:'key'});if(r.error)throw r.error;
  savedDefault={...current,custom_colors:{...(current.custom_colors||{})}};renderDefaultBadge();renderFeatured();renderPreview();msg('Current design is published and is now the saved default.',true);
 }catch(e){msg(e.message,false);}
}
function magicMix(){
 const pool=themes.filter(t=>!['Seasonal & Festive'].includes(t.category)||Math.random()>.35);
 const t=pool[Math.floor(Math.random()*pool.length)]||themeMap.sunshine_bloom;
 const pick=(k,preferred)=>{const a=optionMap[k]||[];const ids=a.map(x=>x.id);return preferred&&ids.includes(preferred)&&Math.random()>.35?preferred:ids[Math.floor(Math.random()*ids.length)];};
 current={...current,preset:t.id,color_mode:'preset',custom_colors:{},
  typography:pick('typography','friendly_modern'),
  nav_style:pick('nav_style','floating_pill'),
  card_style:pick('card_style','color_pop'),
  density:pick('density','balanced'),
  hero_layout:pick('hero_layout','split'),
  motion:pick('motion','gentle'),
  service_color_mode:pick('service_color_mode','multi'),
  button_style:pick('button_style','gradient'),
  section_style:pick('section_style','soft_waves'),
  image_style:pick('image_style','soft_round'),
  header_style:pick('header_style','floating'),
  page_width:pick('page_width','wide'),
  heading_accent:pick('heading_accent','smart_color'),
  background_texture:pick('background_texture','soft_glow'),
  border_style:pick('border_style','soft'),
  shadow_style:pick('shadow_style','soft'),
  corner_style:pick('corner_style','rounded')
 };
 syncForm();renderFeatured();renderPreview();msg('Magic Mix created a new combination. Review it, then Save & publish if you like it.',true);
}
async function load(){
 const r=await sb.from('settings').select('key,value').in('key',['design_system','design_default']);if(r.error)throw r.error;
 const map=Object.fromEntries((r.data||[]).map(x=>[x.key,x.value]));
 current={...defaults,...(map.design_system||{}),custom_colors:{...((map.design_system||{}).custom_colors||{})}};
 savedDefault={...defaults,...(map.design_default||map.design_system||{}),custom_colors:{...((map.design_default||map.design_system||{}).custom_colors||{})}};
 syncForm();renderFeatured();renderPreview();renderDefaultBadge();
}
function bind(){
 $('#design-studio-form').onsubmit=e=>{e.preventDefault();save();};
 $('#design-save-top').onclick=save;
 $('#design-magic').onclick=magicMix;
 $('#design-reset-default').onclick=resetDefault;
 $('#design-make-default').onclick=makeDefault;
 $('#design-theme-colors').onclick=()=>{current.color_mode='preset';current.custom_colors={};$('#design-color-mode').value='preset';syncForm();renderPreview();};
 $('#design-category').onchange=e=>{const sel=$('#design-theme-select');sel.innerHTML=themeOptions(e.target.value);if([...sel.options].some(o=>o.value===current.preset))sel.value=current.preset;};
 $('#design-theme-select').onchange=e=>chooseTheme(e.target.value);
 $('#design-color-mode').onchange=e=>{current.color_mode=e.target.value;if(e.target.value==='preset')current.custom_colors={};syncForm();renderPreview();};
 $$('[data-color]').forEach(x=>x.oninput=()=>{current.color_mode='custom';$('#design-color-mode').value='custom';current.custom_colors=current.custom_colors||{};current.custom_colors[x.dataset.color]=x.value;renderPreview();});
}
(async()=>{try{install();bind();await load();document.documentElement.dataset.ephDesignStudio='v7';}catch(e){msg('Design Studio could not initialize: '+e.message,false);}})();
})();