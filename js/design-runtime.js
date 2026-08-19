(()=>{
const SUPA='https://plvjkqmmlkmsxlufotic.supabase.co';
const KEY='sb_publishable_x-_JzpcD7uAybNZ6-XLRvQ_L6dBb71V';
const html=document.documentElement;
if(!document.querySelector('link[data-eph-design-css]')){
  const l=document.createElement('link');l.rel='stylesheet';l.href='css/design-system.css?v=6.0';l.dataset.ephDesignCss='1';document.head.appendChild(l);
}
const defaults={preset:'playful_pastel',typography:'friendly_modern',nav_style:'floating_pill',card_style:'color_pop',density:'balanced',hero_layout:'split',motion:'gentle',service_color_mode:'multi',show_service_meta:true};
const palettes={
 playful_pastel:{primary:'#3fb8b0',deep:'#176e70',accent:'#f15f9a',ink:'#173c42'},
 aqua_wellness:{primary:'#2f9e9a',deep:'#176a68',accent:'#df6c9f',ink:'#183f43'},
 soft_lavender:{primary:'#7d72c8',deep:'#51488e',accent:'#d66e9d',ink:'#332f50'},
 sunshine_bloom:{primary:'#2faaa0',deep:'#196f69',accent:'#e9508d',ink:'#413a32'},
 sage_sand:{primary:'#789b7d',deep:'#4e7155',accent:'#c47668',ink:'#2e4235'},
 midnight_luxe:{primary:'#315f70',deep:'#163a47',accent:'#c86b8e',ink:'#142f38'}
};
let services=[];
function apply(d){
 d={...defaults,...(d||{})};
 html.dataset.ephTheme=d.preset;html.dataset.ephFont=d.typography;html.dataset.ephNav=d.nav_style==='floating_pill'?'pill':d.nav_style;
 html.dataset.ephCards=d.card_style==='color_pop'?'soft':d.card_style;html.dataset.ephDensity=d.density;html.dataset.ephHero=d.hero_layout;
 html.dataset.ephMotion=d.motion;html.dataset.ephServiceColors=d.service_color_mode;
 const p=palettes[d.preset]||palettes.playful_pastel;
 html.style.setProperty('--eph-primary',p.primary);html.style.setProperty('--eph-primary-deep',p.deep);html.style.setProperty('--eph-accent',p.accent);html.style.setProperty('--eph-ink',p.ink);
 html.style.setProperty('--teal',p.primary);html.style.setProperty('--teal-dark',p.deep);html.style.setProperty('--berry',p.accent);html.style.setProperty('--ink',p.ink);
 window.__EPH_DESIGN=d;
 setTimeout(()=>decorateServices(d),0);setTimeout(()=>decorateServices(d),450);setTimeout(()=>decorateServices(d),1300);setTimeout(enhanceMobileNav,700);
}
function labelMode(m){return m==='clinic'?'In-clinic':m==='online'?'Online':'Clinic + online'}
function decorateServices(d=window.__EPH_DESIGN||defaults){
 const root=document.querySelector('[data-services]');
 if(root){
   [...root.querySelectorAll('.service-card')].forEach((card,i)=>{
     const s=services[i];if(!s)return;
     card.dataset.serviceSlug=s.slug||'';card.style.setProperty('--service-order',String(i+1));
     let meta=card.querySelector('.session-meta');
     if(d.show_service_meta!==false){
       if(!meta){meta=document.createElement('div');meta.className='session-meta';const h=card.querySelector('h3');h?.insertAdjacentElement('afterend',meta)}
       if(meta)meta.innerHTML=`<span>${Number(s.duration_minutes||30)} min</span><span>${labelMode(s.mode)}</span>`;
     }else meta?.remove();
   });
   if(!root.dataset.ephObserve){
     root.dataset.ephObserve='1';
     new MutationObserver(()=>decorateServices(window.__EPH_DESIGN||defaults)).observe(root,{childList:true,subtree:true});
   }
 }
 const anchor={'speech-therapy':'speech','occupational-therapy':'ot','behavioural-support':'behavior','early-intervention':'early','special-education':'special','sensory-integration':'sensory','auditory-verbal-therapy':'avt','adult-communication':'adult'};
 services.forEach(s=>{
   const id=anchor[s.slug]||s.slug,box=document.getElementById(id);if(!box)return;
   if(d.show_service_meta===false){box.querySelector('.session-meta')?.remove();return}
   let meta=box.querySelector('.session-meta');if(!meta){meta=document.createElement('div');meta.className='session-meta';box.querySelector('h2,h3')?.insertAdjacentElement('afterend',meta)}
   if(meta)meta.innerHTML=`<span>${Number(s.duration_minutes||30)} min session</span><span>${labelMode(s.mode)}</span>`;
 });
}
function enhanceMobileNav(){
 const nav=document.querySelector('.nav');if(!nav)return;
 if(!nav.querySelector('.nav-special-book')){
   const book=document.querySelector('.header-actions .btn-primary');if(book){const a=book.cloneNode(true);a.className='nav-special nav-special-book';nav.appendChild(a)}
 }
 if(!nav.querySelector('.nav-special-portal')){
   const portal=document.querySelector('.portal-access');if(portal){const a=portal.cloneNode(true);a.className='nav-special nav-special-portal';nav.appendChild(a)}
 }
}
apply(defaults);
fetch(`${SUPA}/rest/v1/rpc/get_public_site_bundle`,{method:'POST',cache:'no-store',headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'content-type':'application/json'},body:'{}'})
.then(r=>{if(!r.ok)throw new Error('Design feed '+r.status);return r.json()})
.then(bundle=>{services=Array.isArray(bundle.services)?bundle.services:[];apply(bundle.settings?.design_system||defaults);html.dataset.ephDesignRuntime='v6'})
.catch(e=>{console.warn('Ephphatha design fallback active:',e);apply(defaults)});
})();