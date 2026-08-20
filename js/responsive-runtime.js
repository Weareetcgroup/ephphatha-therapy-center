(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const cfg=window.EPH_CONFIG||{};
const contact=cfg.contact||{};
const phoneDigits=String(contact.phonePrimaryDigits||contact.phonePrimary||'919791192699').replace(/\D/g,'');
const whatsappDigits=String(contact.whatsappDigits||phoneDigits).replace(/\D/g,'');
const phoneDisplay=contact.phonePrimary||'+91 97911 92699';

function loadCss(){
  if(document.querySelector('link[data-eph-responsive-css]'))return;
  const l=document.createElement('link');
  l.rel='stylesheet';
  l.href='css/responsive.css?v=7.2';
  l.dataset.ephResponsiveCss='1';
  document.head.appendChild(l);
}
function navAction(cls,href,text){
  const a=document.createElement('a');
  a.className=`eph-device-nav-action ${cls}`;
  a.href=href;
  a.textContent=text;
  return a;
}
function ensureNavActions(){
  const nav=$('.nav');
  if(!nav)return;
  if(!nav.querySelector('.eph-device-nav-call')){
    nav.appendChild(navAction('eph-device-nav-call',`tel:+${phoneDigits}`,`Call ${phoneDisplay}`));
  }
  if(!nav.querySelector('.eph-device-nav-signin')){
    nav.appendChild(navAction('eph-device-nav-signin','portal.html','Sign in'));
  }
  if(!nav.querySelector('.eph-device-nav-book')){
    nav.appendChild(navAction('eph-device-nav-book','contact.html#appointment','Book appointment'));
  }
}
function ensureHeaderPortal(){
  const actions=$('.header-actions');
  if(!actions)return;
  let portal=actions.querySelector('.portal-access');
  if(!portal){
    portal=document.createElement('a');
    portal.className='btn btn-secondary portal-access';
    portal.href='portal.html';
    portal.textContent='Sign in';
    const book=actions.querySelector('.btn-primary');
    actions.insertBefore(portal,book||actions.querySelector('.menu-btn')||null);
  }
  const call=actions.querySelector('[data-phone-primary]');
  if(call){
    call.href=`tel:+${phoneDigits}`;
    call.textContent=phoneDisplay;
    call.setAttribute('aria-label',`Call Ephphatha Therapy Center at ${phoneDisplay}`);
  }
}
function ensureDock(){
  if($('.eph-mobile-dock'))return;
  const dock=document.createElement('nav');
  dock.className='eph-mobile-dock';
  dock.setAttribute('aria-label','Quick actions');
  dock.innerHTML=`
    <a class="dock-call" href="tel:+${phoneDigits}" aria-label="Call Ephphatha Therapy Center"><span>☎</span><span>Call</span></a>
    <a class="dock-whatsapp" href="https://wa.me/${whatsappDigits}?text=${encodeURIComponent('Hello Ephphatha Therapy Center, I would like to enquire about an appointment.')}" target="_blank" rel="noopener" aria-label="WhatsApp Ephphatha Therapy Center"><span>◉</span><span>WhatsApp</span></a>
    <a class="dock-signin" href="portal.html" aria-label="Sign in to Ephphatha portal"><span>♙</span><span>Sign in</span></a>
    <a class="dock-book" href="contact.html#appointment" aria-label="Book an appointment"><span>＋</span><span>Book</span></a>`;
  document.body.appendChild(dock);
}
function closeOldMenuState(){
  const nav=$('.nav');
  const menu=$('.menu-btn');
  if(!nav||!menu)return;
  menu.setAttribute('aria-expanded','false');
  if(window.matchMedia('(max-width:1180px)').matches){
    nav.classList.remove('open');
  }
}
function init(){
  loadCss();
  ensureHeaderPortal();
  ensureNavActions();
  ensureDock();
  closeOldMenuState();
  document.documentElement.dataset.ephResponsive='v7.2';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
[250,800,1600].forEach(ms=>setTimeout(init,ms));
window.addEventListener('resize',closeOldMenuState,{passive:true});
})();