(()=>{
'use strict';
const SUPA='https://plvjkqmmlkmsxlufotic.supabase.co';
const KEY='sb_publishable_x-_JzpcD7uAybNZ6-XLRvQ_L6dBb71V';
const html=document.documentElement;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const defaults={preset:'playful_pastel',typography:'friendly_modern',nav_style:'floating_pill',card_style:'color_pop',density:'balanced',hero_layout:'split',motion:'gentle',service_color_mode:'multi',show_service_meta:true};
const palettes={
 playful_pastel:{primary:'#3fb8b0',deep:'#176e70',accent:'#f15f9a',ink:'#173c42'},
 aqua_wellness:{primary:'#2f9e9a',deep:'#176a68',accent:'#df6c9f',ink:'#183f43'},
 soft_lavender:{primary:'#7d72c8',deep:'#51488e',accent:'#d66e9d',ink:'#332f50'},
 sunshine_bloom:{primary:'#2faaa0',deep:'#196f69',accent:'#e9508d',ink:'#413a32'},
 sage_sand:{primary:'#789b7d',deep:'#4e7155',accent:'#c47668',ink:'#2e4235'},
 midnight_luxe:{primary:'#315f70',deep:'#163a47',accent:'#c86b8e',ink:'#142f38'}
};
let services=[], teamSettings={}, showTeam=true;
if(!document.querySelector('link[data-eph-design-css]')){
  const l=document.createElement('link');l.rel='stylesheet';l.href='css/design-system.css?v=6.1';l.dataset.ephDesignCss='1';document.head.appendChild(l);
}
function normalize(d){return {...defaults,...(d||{})};}
function applyDesign(raw){
 const d=normalize(raw),p=palettes[d.preset]||palettes.playful_pastel;
 html.dataset.ephTheme=d.preset;
 html.dataset.ephFont=d.typography;
 html.dataset.ephNav=d.nav_style==='floating_pill'?'pill':d.nav_style;
 html.dataset.ephCards=d.card_style==='color_pop'?'soft':d.card_style;
 html.dataset.ephDensity=d.density;html.dataset.ephHero=d.hero_layout;
 html.dataset.ephMotion=d.motion;html.dataset.ephServiceColors=d.service_color_mode;
 html.style.setProperty('--eph-primary',p.primary);html.style.setProperty('--eph-primary-deep',p.deep);
 html.style.setProperty('--eph-accent',p.accent);html.style.setProperty('--eph-ink',p.ink);
 html.style.setProperty('--teal',p.primary);html.style.setProperty('--teal-dark',p.deep);
 html.style.setProperty('--berry',p.accent);html.style.setProperty('--ink',p.ink);
 window.__EPH_DESIGN=d;
 try{localStorage.setItem('eph_design_system',JSON.stringify(d));}catch{}
}
function modeLabel(m){return m==='clinic'?'In-clinic':m==='online'?'Online':'Clinic + online';}
function addServiceMeta(){
 const d=window.__EPH_DESIGN||defaults;
 const cards=$$('[data-services] .service-card');
 cards.forEach((card,i)=>{
   const s=services[i]; if(!s)return;
   card.dataset.serviceSlug=s.slug||'';
   let meta=card.querySelector('.session-meta');
   if(d.show_service_meta===false){meta?.remove();return;}
   const wanted=`${Number(s.duration_minutes||30)} min|${modeLabel(s.mode)}`;
   if(!meta){meta=document.createElement('div');meta.className='session-meta';card.querySelector('h3')?.insertAdjacentElement('afterend',meta);}
   if(meta && meta.dataset.value!==wanted){
     meta.dataset.value=wanted;
     meta.innerHTML=`<span>${Number(s.duration_minutes||30)} min</span><span>${modeLabel(s.mode)}</span>`;
   }
 });
 const anchor={'speech-therapy':'speech','occupational-therapy':'ot','behavioural-support':'behavior','early-intervention':'early','special-education':'special','sensory-integration':'sensory','auditory-verbal-therapy':'avt','adult-communication':'adult'};
 services.forEach(s=>{
   const box=document.getElementById(anchor[s.slug]||s.slug);if(!box)return;
   let meta=box.querySelector('.session-meta');
   if(d.show_service_meta===false){meta?.remove();return;}
   const wanted=`${Number(s.duration_minutes||30)} min session|${modeLabel(s.mode)}`;
   if(!meta){meta=document.createElement('div');meta.className='session-meta';box.querySelector('h2,h3')?.insertAdjacentElement('afterend',meta);}
   if(meta && meta.dataset.value!==wanted){
     meta.dataset.value=wanted;
     meta.innerHTML=`<span>${Number(s.duration_minutes||30)} min session</span><span>${modeLabel(s.mode)}</span>`;
   }
 });
}
function wrapLastWords(el,count=2){
 if(!el || el.querySelector('.eph-accent-text'))return;
 const raw=(el.textContent||'').trim(); if(!raw)return;
 const words=raw.split(/\s+/); if(words.length<3)return;
 const n=Math.min(count,Math.max(1,words.length-1));
 const a=words.slice(0,-n).join(' '), b=words.slice(-n).join(' ');
 el.innerHTML=`${escapeHtml(a)} <span class="eph-accent-text">${escapeHtml(b)}</span>`;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function colorizeHeadings(){
 wrapLastWords($('.hero h1'),2);
 $$('.section-head h2').forEach((h,i)=>wrapLastWords(h,i%2?1:2));
 $$('.page-hero h1').forEach(h=>wrapLastWords(h,2));
 const q=$('.story-quote');
 if(q&&!q.querySelector('.eph-quote-accent')){
   const raw=(q.textContent||'').trim();
   const m=raw.match(/^([“"]?Ephphatha!?\s*Be Opened!?[”"]?)(.*)$/i);
   if(m)q.innerHTML=`<span class="eph-quote-accent">${escapeHtml(m[1])}</span>${escapeHtml(m[2])}`;
 }
}
function applyTeam(){
 const sec=$('.v2-team-section'); if(!sec)return;
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
 const story=$('.story-card');
 if(story){story.style.removeProperty('height');story.style.removeProperty('max-height');}
 const mini=$('.story-mini'); if(mini)mini.setAttribute('data-eph-flow','1');
}
function decorate(){
 addServiceMeta();colorizeHeadings();applyTeam();enhanceNav();stabilizeLayout();
 html.dataset.ephDesignDecorated='1';
}
let initial=defaults;
try{const x=JSON.parse(localStorage.getItem('eph_design_system')||'null');if(x)initial=x;}catch{}
applyDesign(initial);
const H={apikey:KEY,Authorization:`Bearer ${KEY}`,'content-type':'application/json'};
fetch(`${SUPA}/rest/v1/rpc/get_public_site_bundle`,{method:'POST',headers:H,body:'{}',cache:'no-store'})
.then(r=>{if(!r.ok)throw new Error(`Design feed ${r.status}`);return r.json();})
.then(bundle=>{
 services=Array.isArray(bundle?.services)?bundle.services:[];
 const settings=bundle?.settings||{};
 teamSettings=settings.team_content||{};
 showTeam=settings.show_team!==false;
 applyDesign(settings.design_system||initial);
 // Finite decoration passes only. No MutationObserver: prevents self-triggering DOM loops.
 [80,450,1100,2200].forEach(ms=>setTimeout(decorate,ms));
 html.dataset.ephDesignRuntime='v6.1-stable';
})
.catch(err=>{
 console.warn('Ephphatha design fallback active:',err);
 [120,700,1800].forEach(ms=>setTimeout(decorate,ms));
 html.dataset.ephDesignRuntime='v6.1-fallback';
});
})();