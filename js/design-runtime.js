(()=>{
'use strict';
const SUPA='https://plvjkqmmlkmsxlufotic.supabase.co';
const KEY='sb_publishable_x-_JzpcD7uAybNZ6-XLRvQ_L6dBb71V';
const html=document.documentElement;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const LIB=window.EPH_DESIGN_LIBRARY||{};
const defaults=LIB.defaultDesign||{preset:'sunshine_bloom',typography:'friendly_modern',nav_style:'floating_pill',card_style:'color_pop',density:'balanced',hero_layout:'split',motion:'gentle',service_color_mode:'multi',show_service_meta:true,button_style:'gradient',section_style:'soft_waves',image_style:'soft_round',header_style:'floating',page_width:'wide',heading_accent:'smart_color',background_texture:'soft_glow',border_style:'soft',shadow_style:'soft',corner_style:'rounded',color_mode:'preset',custom_colors:{}};
const fallbackTheme={id:'sunshine_bloom',colors:{primary:'#2faaa0',deep:'#196f69',accent:'#e9508d',secondary:'#f5b93f',ink:'#413a32',background:'#fffdf7',soft:'#fff8e8'}};
let services=[],teamSettings={},showTeam=true,brandMedia={},therapists=[];
if(!document.querySelector('link[data-eph-design-css]')){
 const l=document.createElement('link');l.rel='stylesheet';l.href='css/design-system.css?v=7.0';l.dataset.ephDesignCss='1';document.head.appendChild(l);
}
function normalize(d){return {...defaults,...(d||{}),custom_colors:{...(defaults.custom_colors||{}),...((d||{}).custom_colors||{})}};}
function getTheme(id){return LIB.themeMap?.[id]||fallbackTheme;}
function effectiveColors(d){
 const base={...getTheme(d.preset).colors};
 if(d.color_mode==='custom'){
  const c=d.custom_colors||{};
  ['primary','deep','accent','secondary','ink','background','soft'].forEach(k=>{if(c[k])base[k]=c[k];});
 }
 return base;
}
function setVar(name,value){if(value)html.style.setProperty(name,value);}
function applyDesign(raw){
 const d=normalize(raw),c=effectiveColors(d);
 html.dataset.ephTheme=d.preset||'sunshine_bloom';
 html.dataset.ephFont=d.typography;
 html.dataset.ephNav=d.nav_style;
 html.dataset.ephCards=d.card_style;
 html.dataset.ephDensity=d.density;
 html.dataset.ephHero=d.hero_layout;
 html.dataset.ephMotion=d.motion;
 html.dataset.ephServiceColors=d.service_color_mode;
 html.dataset.ephButton=d.button_style;
 html.dataset.ephSections=d.section_style;
 html.dataset.ephImages=d.image_style;
 html.dataset.ephHeader=d.header_style;
 html.dataset.ephWidth=d.page_width;
 html.dataset.ephHeading=d.heading_accent;
 html.dataset.ephTexture=d.background_texture;
 html.dataset.ephBorder=d.border_style;
 html.dataset.ephShadow=d.shadow_style;
 html.dataset.ephCorners=d.corner_style;
 setVar('--eph-primary',c.primary);setVar('--eph-primary-deep',c.deep);
 setVar('--eph-accent',c.accent);setVar('--eph-secondary',c.secondary);
 setVar('--eph-coral',c.accent);setVar('--eph-lavender',c.secondary);setVar('--eph-mint',c.primary);
 setVar('--eph-ink',c.ink);setVar('--eph-bg',c.background);setVar('--eph-soft',c.soft);
 setVar('--eph-line',`color-mix(in srgb, ${c.primary} 18%, #dfeae8)`);
 setVar('--teal',c.primary);setVar('--teal-dark',c.deep);setVar('--berry',c.accent);setVar('--ink',c.ink);
 window.__EPH_DESIGN=d;window.__EPH_COLORS=c;
 try{localStorage.setItem('eph_design_system_v7',JSON.stringify(d));localStorage.setItem('eph_design_version','7');}catch{}
}
function modeLabel(m){return m==='clinic'?'In-clinic':m==='online'?'Online':'Clinic + online';}
function addServiceMeta(){
 const d=window.__EPH_DESIGN||defaults;
 $$('[data-services] .service-card').forEach((card,i)=>{
  const s=services[i];if(!s)return;
  card.dataset.serviceSlug=s.slug||'';
  let meta=card.querySelector('.session-meta');
  if(d.show_service_meta===false){meta?.remove();return;}
  const wanted=`${Number(s.duration_minutes||30)} min|${modeLabel(s.mode)}`;
  if(!meta){meta=document.createElement('div');meta.className='session-meta';card.querySelector('h3')?.insertAdjacentElement('afterend',meta);}
  if(meta&&meta.dataset.value!==wanted){meta.dataset.value=wanted;meta.innerHTML=`<span>${Number(s.duration_minutes||30)} min</span><span>${modeLabel(s.mode)}</span>`;}
 });
 const anchor={'speech-therapy':'speech','occupational-therapy':'ot','behavioural-support':'behavior','early-intervention':'early','special-education':'special','sensory-integration':'sensory','auditory-verbal-therapy':'avt','adult-communication':'adult'};
 services.forEach(s=>{
  const box=document.getElementById(anchor[s.slug]||s.slug);if(!box)return;
  let meta=box.querySelector('.session-meta');
  if(d.show_service_meta===false){meta?.remove();return;}
  const wanted=`${Number(s.duration_minutes||30)} min session|${modeLabel(s.mode)}`;
  if(!meta){meta=document.createElement('div');meta.className='session-meta';box.querySelector('h2,h3')?.insertAdjacentElement('afterend',meta);}
  if(meta&&meta.dataset.value!==wanted){meta.dataset.value=wanted;meta.innerHTML=`<span>${Number(s.duration_minutes||30)} min session</span><span>${modeLabel(s.mode)}</span>`;}
 });
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function accentHeading(el,mode='smart_color',count=2){
 if(!el)return;
 const raw=(el.textContent||'').trim();if(!raw)return;
 if(el.dataset.ephAccentSource===raw&&el.dataset.ephAccentMode===mode)return;
 el.dataset.ephAccentSource=raw;el.dataset.ephAccentMode=mode;
 el.classList.remove('eph-heading-underline','eph-heading-gradient','eph-heading-highlight');
 if(mode==='none'){el.textContent=raw;return;}
 if(mode==='underline'){el.textContent=raw;el.classList.add('eph-heading-underline');return;}
 if(mode==='gradient'){el.textContent=raw;el.classList.add('eph-heading-gradient');return;}
 if(mode==='highlight'){el.textContent=raw;el.classList.add('eph-heading-highlight');return;}
 const words=raw.split(/\s+/);if(words.length<2){el.textContent=raw;return;}
 if(mode==='first_word'){
  el.innerHTML=`<span class="eph-accent-text">${escapeHtml(words[0])}</span>${words.length>1?' '+escapeHtml(words.slice(1).join(' ')):''}`;return;
 }
 const n=mode==='last_words'?Math.min(2,words.length-1):Math.min(count,Math.max(1,words.length-1));
 el.innerHTML=`${escapeHtml(words.slice(0,-n).join(' '))} <span class="eph-accent-text">${escapeHtml(words.slice(-n).join(' '))}</span>`;
}
function colorizeHeadings(){
 const mode=(window.__EPH_DESIGN||defaults).heading_accent||'smart_color';
 accentHeading($('.hero h1'),mode,2);
 $$('.section-head h2').forEach((h,i)=>accentHeading(h,mode,i%2?1:2));
 $$('.page-hero h1').forEach(h=>accentHeading(h,mode,2));
 const q=$('.story-quote');
 if(q){
  const raw=(q.textContent||'').trim();
  if(q.dataset.ephQuoteSource!==raw){
   q.dataset.ephQuoteSource=raw;
   const m=raw.match(/^([“"]?Ephphatha!?\s*Be Opened!?[”"]?)(.*)$/i);
   if(m)q.innerHTML=`<span class="eph-quote-accent">${escapeHtml(m[1])}</span>${escapeHtml(m[2])}`;
  }
 }
}
function applyTeam(){
 const sec=$('.v2-team-section');if(!sec)return;
 sec.style.display=showTeam===false?'none':'';
 if(showTeam===false)return;
 const eyebrow=sec.querySelector('.eyebrow'),heading=sec.querySelector('.section-head h2');
 if(eyebrow&&teamSettings.kicker)eyebrow.textContent=teamSettings.kicker;
 if(heading&&teamSettings.heading)heading.textContent=teamSettings.heading;
 let intro=sec.querySelector('.eph-team-intro');
 if(teamSettings.intro){
  if(!intro){intro=document.createElement('p');intro.className='lead eph-team-intro';heading?.insertAdjacentElement('afterend',intro);}
  intro.textContent=teamSettings.intro;
 }else intro?.remove();
 sec.querySelectorAll('.v2-team-card').forEach((card,i)=>card.style.setProperty('--team-accent',`var(--eph-team-${(i%4)+1})`));
}
function applyFounderPortrait(){
 const holder=$('.founder-monogram');if(!holder)return;
 const diana=therapists.find(t=>/diana\s+nixon/i.test(String(t.full_name||'')));
 const url=brandMedia.founder_image_url||diana?.photo_url||'';
 if(!url){if(holder.classList.contains('has-photo')){holder.classList.remove('has-photo');holder.textContent='DN';}return;}
 if(holder.dataset.photoUrl===url)return;
 holder.dataset.photoUrl=url;holder.classList.add('has-photo');holder.innerHTML='';
 const img=document.createElement('img');img.className='founder-photo';img.src=url;img.alt='Diana Nixon, Founder and Clinical Lead';
 img.onload=()=>holder.classList.add('photo-loaded');
 img.onerror=()=>{holder.classList.remove('has-photo','photo-loaded');holder.removeAttribute('data-photo-url');holder.textContent='DN';};
 holder.appendChild(img);
}
function enhanceNav(){
 const nav=$('.nav');if(!nav)return;
 if(!nav.querySelector('.nav-special-book')){
  const book=$('.header-actions .btn-primary');if(book){const a=book.cloneNode(true);a.className='nav-special nav-special-book';nav.appendChild(a);}
 }
 if(!nav.querySelector('.nav-special-portal')){
  const portal=$('.portal-access');if(portal){const a=portal.cloneNode(true);a.className='nav-special nav-special-portal';nav.appendChild(a);}
 }
}
function stabilizeLayout(){
 const story=$('.story-card');if(story){story.style.removeProperty('height');story.style.removeProperty('max-height');}
 $('.story-mini')?.setAttribute('data-eph-flow','1');
}
function decorate(){addServiceMeta();colorizeHeadings();applyTeam();applyFounderPortrait();enhanceNav();stabilizeLayout();html.dataset.ephDesignDecorated='1';}
let initial=defaults;
try{if(localStorage.getItem('eph_design_version')==='7'){const x=JSON.parse(localStorage.getItem('eph_design_system_v7')||'null');if(x)initial=x;}}catch{}
applyDesign(initial);
const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'content-type':'application/json'};
fetch(`${SUPA}/rest/v1/rpc/get_public_site_bundle`,{method:'POST',headers:H,body:'{}',cache:'no-store'})
.then(r=>{if(!r.ok)throw new Error(`Design feed ${r.status}`);return r.json();})
.then(bundle=>{
 services=Array.isArray(bundle?.services)?bundle.services:[];
 therapists=Array.isArray(bundle?.therapists)?bundle.therapists:[];
 const settings=bundle?.settings||{};
 teamSettings=settings.team_content||{};
 showTeam=settings.show_team!==false;
 brandMedia=settings.brand_media||{};
 applyDesign(settings.design_system||initial);
 [80,400,950,1800].forEach(ms=>setTimeout(decorate,ms));
 html.dataset.ephDesignRuntime='v7-stable';
})
.catch(err=>{
 console.warn('Ephphatha design fallback active:',err);
 [120,700,1600].forEach(ms=>setTimeout(decorate,ms));
 html.dataset.ephDesignRuntime='v7-fallback';
});
})();