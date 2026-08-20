(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const cfg=window.EPH_CONFIG||{};
const contact=cfg.contact||{};
const phoneDigits=String(contact.phonePrimaryDigits||contact.phonePrimary||'919791192699').replace(/\D/g,'');
const whatsappDigits=String(contact.whatsappDigits||phoneDigits).replace(/\D/g,'');
const phoneDisplay=contact.phonePrimary||'+91 97911 92699';

const BREAK_DESKTOP=1100;
const BREAK_PHONE=700;

function loadCss(){
  if(document.querySelector('link[data-eph-responsive-css]')) return;
  const l=document.createElement('link');
  l.rel='stylesheet';
  l.href='css/responsive.css?v=7.3';
  l.dataset.ephResponsiveCss='1';
  document.head.appendChild(l);
}

function canonicalHref(a){
  try{
    const u=new URL(a.getAttribute('href')||'',location.href);
    return (u.pathname.split('/').pop()||'index.html')+(u.hash||'');
  }catch{return a.getAttribute('href')||''}
}

function cleanPrimaryNav(){
  const nav=$('.nav');
  if(!nav)return;
  // Remove links injected by older design/responsive runtimes.
  $$('.nav-special,.eph-device-nav-action',nav).forEach(x=>x.remove());

  // Keep one copy of each real page link only.
  const seen=new Set();
  [...nav.querySelectorAll('a')].forEach(a=>{
    const key=canonicalHref(a).split('#')[0].toLowerCase();
    if(!key)return;
    if(seen.has(key)) a.remove();
    else seen.add(key);
  });
}

function ensureHeaderActions(){
  const actions=$('.header-actions');
  if(!actions)return;

  let call=actions.querySelector('[data-phone-primary]');
  if(!call){
    call=document.createElement('a');
    call.className='btn btn-secondary eph-header-call';
    call.dataset.phonePrimary='';
    actions.prepend(call);
  }
  call.href=`tel:+${phoneDigits}`;
  call.textContent=`Call ${phoneDisplay}`;

  let portal=actions.querySelector('.portal-access');
  if(!portal){
    portal=document.createElement('a');
    portal.className='btn btn-secondary portal-access';
    portal.href='portal.html';
    portal.textContent='Sign in';
    const book=actions.querySelector('.btn-primary');
    actions.insertBefore(portal,book||null);
  }

  let menu=actions.querySelector('.menu-btn');
  if(!menu){
    menu=document.createElement('button');
    menu.type='button';
    menu.className='menu-btn';
    menu.setAttribute('aria-label','Open menu');
    menu.textContent='☰';
    actions.appendChild(menu);
  }
  menu.setAttribute('aria-controls','eph-device-menu');
  menu.setAttribute('aria-expanded','false');
}

function currentPageLinks(){
  cleanPrimaryNav();
  const nav=$('.nav');
  if(!nav)return [];
  return [...nav.querySelectorAll('a')].filter(a=>{
    const style=getComputedStyle(a);
    return style.display!=='none' && !a.classList.contains('nav-special') && !a.classList.contains('eph-device-nav-action');
  }).map(a=>({
    href:a.getAttribute('href')||'#',
    text:(a.textContent||'').trim(),
    active:a.classList.contains('active')
  }));
}

function ensureDrawer(){
  let wrap=$('#eph-device-menu');
  if(wrap)return wrap;

  wrap=document.createElement('div');
  wrap.id='eph-device-menu';
  wrap.className='eph-device-menu';
  wrap.setAttribute('aria-hidden','true');
  wrap.innerHTML=`
    <button class="eph-menu-backdrop" type="button" aria-label="Close menu"></button>
    <aside class="eph-menu-panel" role="dialog" aria-modal="true" aria-label="Ephphatha navigation">
      <div class="eph-menu-head">
        <div>
          <strong>EPHPHATHA</strong>
          <small>Therapy Center</small>
        </div>
        <button class="eph-menu-close" type="button" aria-label="Close menu">×</button>
      </div>
      <nav class="eph-menu-links" aria-label="Site navigation"></nav>
      <div class="eph-menu-actions">
        <a class="eph-menu-call" href="tel:+${phoneDigits}">☎ Call ${phoneDisplay}</a>
        <a class="eph-menu-wa" href="https://wa.me/${whatsappDigits}?text=${encodeURIComponent('Hello Ephphatha Therapy Center, I would like to enquire about an appointment.')}" target="_blank" rel="noopener">WhatsApp</a>
        <a class="eph-menu-signin" href="portal.html">Sign in</a>
        <a class="eph-menu-book" href="contact.html#appointment">Book appointment</a>
      </div>
    </aside>`;
  document.body.appendChild(wrap);

  wrap.querySelector('.eph-menu-backdrop').onclick=closeDrawer;
  wrap.querySelector('.eph-menu-close').onclick=closeDrawer;
  return wrap;
}

function buildDrawerLinks(){
  const wrap=ensureDrawer();
  const box=wrap.querySelector('.eph-menu-links');
  const links=currentPageLinks();
  box.innerHTML=links.map(x=>`<a href="${x.href}" class="${x.active?'active':''}">${x.text}</a>`).join('');
  box.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeDrawer));
}

function openDrawer(){
  buildDrawerLinks();
  const wrap=ensureDrawer();
  wrap.classList.add('open');
  wrap.setAttribute('aria-hidden','false');
  document.body.classList.add('eph-menu-open');
  $('.menu-btn')?.setAttribute('aria-expanded','true');
}
function closeDrawer(){
  const wrap=$('#eph-device-menu');
  if(!wrap)return;
  wrap.classList.remove('open');
  wrap.setAttribute('aria-hidden','true');
  document.body.classList.remove('eph-menu-open');
  $('.menu-btn')?.setAttribute('aria-expanded','false');
}
function bindMenu(){
  const btn=$('.menu-btn');
  if(!btn||btn.dataset.ephBound==='1')return;
  // Replace any earlier onclick from site.js.
  btn.onclick=null;
  btn.dataset.ephBound='1';
  btn.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    const open=$('#eph-device-menu')?.classList.contains('open');
    open?closeDrawer():openDrawer();
  });
}

function ensureDock(){
  let dock=$('.eph-mobile-dock');
  if(dock)return dock;
  dock=document.createElement('nav');
  dock.className='eph-mobile-dock';
  dock.setAttribute('aria-label','Quick actions');
  dock.innerHTML=`
    <a class="dock-call" href="tel:+${phoneDigits}"><span>☎</span><span>Call</span></a>
    <a class="dock-whatsapp" href="https://wa.me/${whatsappDigits}?text=${encodeURIComponent('Hello Ephphatha Therapy Center, I would like to enquire about an appointment.')}" target="_blank" rel="noopener"><span>●</span><span>WhatsApp</span></a>
    <a class="dock-signin" href="portal.html"><span>♙</span><span>Sign in</span></a>
    <a class="dock-book" href="contact.html#appointment"><span>＋</span><span>Book</span></a>`;
  document.body.appendChild(dock);
  return dock;
}

function sync(){
  cleanPrimaryNav();
  ensureHeaderActions();
  ensureDrawer();
  ensureDock();
  bindMenu();

  const w=window.innerWidth;
  if(w>=BREAK_DESKTOP) closeDrawer();

  document.documentElement.dataset.ephDevice=
    w>=BREAK_DESKTOP?'desktop':w>=BREAK_PHONE?'tablet':'phone';
  document.documentElement.dataset.ephResponsive='v7.3';
}

function init(){
  loadCss();
  sync();
  // Older design runtime decorates after async CMS work. Clean once after each known pass.
  [120,500,1100,2100,3200].forEach(ms=>setTimeout(sync,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();

let resizeTimer;
window.addEventListener('resize',()=>{
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(sync,120);
},{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();});
})();