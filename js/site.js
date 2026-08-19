(function(){
document.documentElement.dataset.ephPublicRuntime='v5.5';
const cfg=window.EPH_CONFIG||{},fallback=cfg.contact||{};
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const SUPA='https://plvjkqmmlkmsxlufotic.supabase.co';
const KEY='sb_publishable_x-_JzpcD7uAybNZ6-XLRvQ_L6dBb71V';
const H={apikey:KEY,'content-type':'application/json'};
async function getPublicBundle(){
  const r=await fetch(`${SUPA}/rest/v1/rpc/get_public_site_bundle`,{method:'POST',headers:H,body:'{}',cache:'no-store'});
  if(!r.ok)throw new Error(`Public site data request failed (${r.status}): ${await r.text()}`);
  return r.json();
}
const text=(el,val)=>{if(el&&val!==undefined&&val!==null)el.textContent=String(val);};
const setMeta=(name,val)=>{if(!val)return;let el=document.querySelector(`meta[name="${name}"]`);if(!el){el=document.createElement('meta');el.name=name;document.head.appendChild(el);}el.content=val;};

if(!document.querySelector('link[data-v2-public]')){const l=document.createElement('link');l.rel='stylesheet';l.href='css/v2-public.css';l.dataset.v2Public='1';document.head.appendChild(l);}

function applyFallback(){
  $$('[data-phone-primary]').forEach(el=>{el.textContent=fallback.phonePrimary||'';if(el.tagName==='A')el.href='tel:+'+(fallback.phonePrimaryDigits||'');});
  $$('[data-phone-secondary]').forEach(el=>{el.textContent=fallback.phoneSecondary||'';if(el.tagName==='A')el.href='tel:+'+(fallback.phoneSecondaryDigits||'');});
  $$('[data-email]').forEach(el=>{el.textContent=fallback.email||'';if(el.tagName==='A')el.href='mailto:'+(fallback.email||'');});
  $$('[data-address]').forEach(el=>el.textContent=fallback.address||'');
  $$('[data-locality]').forEach(el=>el.textContent=fallback.locality||'');
  const wa=fallback.whatsappDigits||fallback.phonePrimaryDigits||'';
  $$('[data-whatsapp]').forEach(el=>el.href=`https://wa.me/${wa}?text=${encodeURIComponent('Hello Ephphatha Therapy Center, I would like to enquire about an appointment.')}`);
  const map=fallback.mapUrl||'https://maps.app.goo.gl/pS8H2akJMwe726BQ8';
  $$('[data-directions]').forEach(el=>el.href=map);
}
applyFallback();
$$('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

// Never allow the hard-coded legacy Google iframe to display an old business listing.
// Replace it immediately with a safe exact-location card; Supabase can later replace
// this with an official embed URL if Admin explicitly provides one.
(function neutralizeLegacyMap(){
  const frame=$('.map-frame');
  if(!frame||frame.dataset.ephSafeMap==='1')return;
  const map=fallback.mapUrl||'https://maps.app.goo.gl/pS8H2akJMwe726BQ8';
  const box=document.createElement('div');
  box.className='map-frame eph-safe-map';
  box.dataset.ephSafeMap='1';
  box.style.cssText='min-height:280px;display:flex;align-items:center;justify-content:center;text-align:center;padding:32px;background:#f3fbfa;border:1px solid #d9e8e6;border-radius:20px';
  box.innerHTML=`<div><div style="font-size:2rem;margin-bottom:8px">⌖</div><h3 style="margin:0 0 8px">Exact Ephphatha Therapy Center location</h3><p data-address style="margin:0 0 18px">${esc(fallback.address||'')}</p><a class="btn btn-primary" data-directions href="${esc(map)}" target="_blank" rel="noopener">Open exact location in Google Maps →</a></div>`;
  frame.replaceWith(box);
  applyFallback();
})();

const servicesRoot=$('[data-services]');
if(servicesRoot&&cfg.services)servicesRoot.innerHTML=cfg.services.map(s=>`<a class="service-card" href="${s.href}"><img src="${s.icon}" alt="" aria-hidden="true"><h3>${esc(s.title)}</h3><p>${esc(s.summary)}</p><span class="more">Explore service →</span></a>`).join('');
const faqRoot=$('[data-faqs]');
if(faqRoot&&cfg.faqs)faqRoot.innerHTML=cfg.faqs.map((x,i)=>`<div class="faq-item${i===0?' open':''}"><button class="faq-q" type="button"><span>${esc(x.q)}</span><span>${i===0?'−':'+'}</span></button><div class="faq-a">${esc(x.a)}</div></div>`).join('');
function bindFaq(root=document){$$('.faq-q',root).forEach(btn=>btn.onclick=()=>{const item=btn.closest('.faq-item');item.classList.toggle('open');btn.lastElementChild.textContent=item.classList.contains('open')?'−':'+';});}
bindFaq();

const menuBtn=$('.menu-btn'),navEl=$('.nav');if(menuBtn&&navEl)menuBtn.onclick=()=>navEl.classList.toggle('open');
const current=(location.pathname.split('/').pop()||'index.html').toLowerCase();
$$('.nav a').forEach(a=>{const href=(a.getAttribute('href')||'').split('#')[0].toLowerCase();if(href===current)a.classList.add('active');});
$$('.header-actions').forEach(actions=>{if(!actions.querySelector('.portal-access')){const a=document.createElement('a');a.className='btn btn-secondary portal-access';a.href='portal.html';a.textContent='Sign in';actions.insertBefore(a,actions.firstChild);}});

function renderHours(hours){
  $$('[data-hours]').forEach(root=>{
    root.innerHTML='';const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    days.forEach((name,i)=>{const v=hours?.[i]??hours?.[String(i)];const row=document.createElement('div');row.className='hours-row';row.innerHTML=`<strong>${name}</strong><span>${v?`${esc(v[0])} – ${esc(v[1])}`:'Closed'}</span>`;root.appendChild(row);});
  });
}
renderHours(cfg.hours||{});

const path=(location.pathname||'/').toLowerCase();
const isHome=path==='/'||path.endsWith('/index.html');
const isServices=path.endsWith('/services')||path.endsWith('/services.html');
const isAbout=path.endsWith('/about')||path.endsWith('/about.html');
const isOnline=path.endsWith('/online-therapy')||path.endsWith('/online-therapy.html');
const isContact=path.endsWith('/contact')||path.endsWith('/contact.html');
const isPrivacy=path.endsWith('/privacy')||path.endsWith('/privacy.html');

if(isContact){
  const card=$('.contact-card');
  if(card&&!card.querySelector('[data-hours]')){
    const box=document.createElement('div');box.className='public-hours-box';
    box.innerHTML='<div class="eyebrow">Clinic hours</div><div data-hours></div><a class="btn btn-primary" href="portal.html#book" style="margin-top:16px">Check live appointment slots →</a>';
    card.appendChild(box);renderHours(cfg.hours||{});
  }
}

getPublicBundle().then(bundle=>{
  const s=bundle?.settings||{};
  document.documentElement.dataset.ephPublicData='connected';
  const serviceRows=Array.isArray(bundle?.services)?bundle.services:[];
  const therapistRows=Array.isArray(bundle?.therapists)?bundle.therapists:[];
  const items=Array.isArray(bundle?.content_items)?bundle.content_items:[];
  const center=s.center_profile||{},theme=s.theme||{},ann=s.announcement||{},navigation=s.navigation||{},media=s.brand_media||{},seo=s.seo_settings||{},footer=s.footer_content||{},galleryContent=s.gallery_content||{};

  if(theme.primary)document.documentElement.style.setProperty('--teal',theme.primary);
  if(theme.accent)document.documentElement.style.setProperty('--berry',theme.accent);
  if(theme.ink)document.documentElement.style.setProperty('--ink',theme.ink);
  if(theme.radius)document.documentElement.style.setProperty('--radius',theme.radius);
  if(theme.hero_style)document.body.dataset.heroStyle=theme.hero_style;
  if(ann.enabled){const bar=document.createElement('div');bar.className='site-announcement';bar.textContent=String(ann.text||'Welcome to Ephphatha Therapy Center.').trim()||'Welcome to Ephphatha Therapy Center.';document.body.prepend(bar);}
  if(s.business_hours)renderHours(s.business_hours);

  const clinic=center.clinic_name||'Ephphatha Therapy Center';
  $$('.brand-name').forEach(el=>el.textContent=clinic.toUpperCase());
  $$('.header .brand-sub').forEach(el=>text(el,center.brand_subtitle));
  $$('.footer .brand-sub').forEach(el=>text(el,center.tagline));
  $$('[data-phone-primary]').forEach(el=>{text(el,center.phone_primary);if(el.tagName==='A'&&center.phone_primary)el.href='tel:'+center.phone_primary.replace(/[^\d+]/g,'');});
  $$('[data-phone-secondary]').forEach(el=>{text(el,center.phone_secondary);if(el.tagName==='A'&&center.phone_secondary)el.href='tel:'+center.phone_secondary.replace(/[^\d+]/g,'');});
  $$('[data-email]').forEach(el=>{text(el,center.email);if(el.tagName==='A'&&center.email)el.href='mailto:'+center.email;});
  $$('[data-address]').forEach(el=>text(el,center.display_address));
  $$('[data-locality]').forEach(el=>text(el,center.locality));
  if(center.whatsapp){const d=String(center.whatsapp).replace(/\D/g,'');$$('[data-whatsapp]').forEach(el=>el.href=`https://wa.me/${d}?text=${encodeURIComponent('Hello '+clinic+', I would like to enquire about an appointment.')}`);}
  const mapUrl=center.map_url||'https://maps.app.goo.gl/pS8H2akJMwe726BQ8';
  $$('[data-directions]').forEach(el=>{el.href=mapUrl;el.rel='noopener';});
  if(center.instagram_url)$$('a[href*="instagram.com"]').forEach(el=>el.href=center.instagram_url);

  // Never display a potentially wrong Google place listing. Use an official embed URL only when Admin provides one.
  const mapFrame=$('.map-frame');
  if(mapFrame){
    const validEmbed=center.map_embed_url && /^https:\/\/www\.google\.[^/]+\/maps\/embed|^https:\/\/www\.google\.com\/maps\/embed/.test(center.map_embed_url);
    if(validEmbed){
      if(mapFrame.tagName==='IFRAME') mapFrame.src=center.map_embed_url;
      else{
        const iframe=document.createElement('iframe');
        iframe.className='map-frame';iframe.loading='lazy';iframe.referrerPolicy='no-referrer-when-downgrade';iframe.src=center.map_embed_url;iframe.title='Map showing Ephphatha Therapy Center';
        mapFrame.replaceWith(iframe);
      }
    }else{
      mapFrame.dataset.ephSafeMap='1';
      mapFrame.innerHTML=`<div><div style="font-size:2rem;margin-bottom:8px">⌖</div><h3 style="margin:0 0 8px">Exact Ephphatha Therapy Center location</h3><p data-address style="margin:0 0 18px">${esc(center.display_address||'')}</p><a class="btn btn-primary" data-directions href="${esc(mapUrl)}" target="_blank" rel="noopener">Open exact location in Google Maps →</a></div>`;
      mapFrame.style.cssText='min-height:280px;display:flex;align-items:center;justify-content:center;text-align:center;padding:32px;background:#f3fbfa;border:1px solid #d9e8e6;border-radius:20px';
    }
  }

  // Navigation labels and visibility.
  const navMap={
    'index.html':['home','show_home'],'services.html':['services','show_services'],'about.html':['about','show_about'],
    'online-therapy.html':['online','show_online'],'contact.html':['contact','show_contact']
  };
  $$('.nav a').forEach(a=>{
    const href=(a.getAttribute('href')||'').split('#')[0];
    const pair=navMap[href];if(!pair)return;
    if(navigation[pair[0]])a.textContent=navigation[pair[0]];
    if(navigation[pair[1]]===false)a.style.display='none';
  });
  $$('.header-actions a.btn-primary').forEach(a=>{if((a.getAttribute('href')||'').includes('contact')&&navigation.book_cta)a.textContent=navigation.book_cta;});
  $$('.portal-access').forEach(a=>text(a,navigation.portal||'Sign in'));

  // Brand media.
  if(media.logo_url)$$('.brand img,.app-brand img,.portal-brand img').forEach(img=>img.src=media.logo_url);
  if(media.favicon_url){const f=$('link[rel="icon"]');if(f)f.href=media.favicon_url;}
  if(isHome&&media.home_hero_url){const img=$('.hero-media img');if(img)img.src=media.home_hero_url;}
  if(isOnline&&media.online_image_url){const img=$('main .split img');if(img)img.src=media.online_image_url;}

  // Footer.
  if(footer.about)$$('.footer-grid > div:first-child p').forEach(el=>text(el,footer.about));
  if(footer.disclaimer){const last=$('.footer-bottom span:last-child');if(last)text(last,footer.disclaimer);}

  // SEO / browser title.
  if(isHome){text(document.querySelector('title'),seo.home_title);if(seo.home_title)document.title=seo.home_title;setMeta('description',seo.home_description);}
  if(isServices&&seo.services_title)document.title=seo.services_title;
  if(isAbout&&seo.about_title)document.title=seo.about_title;
  if(isOnline&&seo.online_title)document.title=seo.online_title;
  if(isContact&&seo.contact_title)document.title=seo.contact_title;
  if(isPrivacy&&seo.privacy_title)document.title=seo.privacy_title;

  const iconMap={'speech-therapy':'assets/speech.svg','occupational-therapy':'assets/ot.svg','behavioural-support':'assets/behavior.svg','early-intervention':'assets/early.svg','special-education':'assets/special-ed.svg','sensory-integration':'assets/sensory.svg','auditory-verbal-therapy':'assets/avt.svg','adult-communication':'assets/adult.svg'};
  const anchorMap={'speech-therapy':'speech','occupational-therapy':'ot','behavioural-support':'behavior','early-intervention':'early','special-education':'special','sensory-integration':'sensory','auditory-verbal-therapy':'avt','adult-communication':'adult'};

  if(isHome){
    const h=s.home_content||{},sections=$$('main > section');
    text($('.hero .kicker'),h.hero_kicker);text($('.hero h1'),h.hero_title);text($('.hero .lead'),h.hero_lead);
    text($('#services .section-head h2'),h.services_heading);text($('#services .section-head .lead'),h.services_intro);
    const approach=sections[2],how=sections[3],concern=sections[4],trust=sections[5],faqSec=sections[6],ctaSec=sections[7];
    text(approach?.querySelector('.story-card .eyebrow'),h.story_heading);text(approach?.querySelector('.story-quote'),h.story_quote);text(approach?.querySelector('.story-mini strong'),h.story_mini_heading);text(approach?.querySelector('.story-mini p'),h.story_mini_text);
    text(approach?.querySelector('div:last-child h2'),h.approach_heading);text(approach?.querySelector('div:last-child .lead'),h.approach_intro);
    const approachChecks=approach?.querySelector('div:last-child .checks');if(approachChecks&&Array.isArray(h.approach_points)&&h.approach_points.length)approachChecks.innerHTML=h.approach_points.map(x=>`<div class="check"><b>✓</b><div>${esc(x)}</div></div>`).join('');
    text(how?.querySelector('h2'),h.how_heading);text(how?.querySelector('.section-head p'),h.how_intro);
    const howPath=how?.querySelector('.path');if(howPath&&Array.isArray(h.how_steps)&&h.how_steps.length)howPath.innerHTML=h.how_steps.map(x=>`<div class="path-step"><h3>${esc(x.title||'')}</h3><p>${esc(x.text||'')}</p></div>`).join('');
    text(concern?.querySelector('h2'),h.concern_heading);text(concern?.querySelector('.lead'),h.concern_intro);
    const concernGrid=concern?.querySelector('.concern-grid');if(concernGrid&&Array.isArray(h.concerns)&&h.concerns.length)concernGrid.innerHTML=h.concerns.map(x=>`<div class="concern">${esc(x)}</div>`).join('');
    text(trust?.querySelector('h2'),h.trust_heading);text(trust?.querySelector('.lead'),h.trust_intro);
    text(faqSec?.querySelector('h2'),h.faq_heading);text(ctaSec?.querySelector('h2'),h.cta_heading);text(ctaSec?.querySelector('p'),h.cta_text);
    if(servicesRoot&&serviceRows.length)servicesRoot.innerHTML=serviceRows.map(x=>`<a class="service-card" href="services.html#${anchorMap[x.slug]||x.slug}"><img src="${iconMap[x.slug]||'assets/speech.svg'}" alt="" aria-hidden="true"><h3>${esc(x.title)}</h3><p>${esc(x.summary||'')}</p><span class="more">${x.duration_minutes} min · Explore service →</span></a>`).join('');
  }

  if(isServices){
    const c=s.services_content||{};
    text($('.page-hero .kicker'),c.kicker);text($('.page-hero h1'),c.hero_heading);text($('.page-hero .lead'),c.hero_intro);
    const grid=$('.service-detail-grid');
    if(grid&&serviceRows.length)grid.innerHTML=serviceRows.map(x=>`<article class="service-detail" id="${esc(anchorMap[x.slug]||x.slug)}"><img src="${iconMap[x.slug]||'assets/speech.svg'}" alt=""><h2>${esc(x.title)}</h2><p>${esc(x.detail_intro||x.summary||'')}</p>${Array.isArray(x.detail_bullets)&&x.detail_bullets.length?`<ul>${x.detail_bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}<p class="muted"><strong>${x.duration_minutes} minute session</strong> · ${esc(x.mode==='both'?'In-clinic + online where suitable':x.mode==='online'?'Online':'In-clinic')}</p><a class="btn-link" href="contact.html#appointment">${esc(x.cta_text||'Ask about this service')} →</a></article>`).join('');
    const cta=$$('main > section').at(-1);text(cta?.querySelector('h2'),c.cta_heading);text(cta?.querySelector('p'),c.cta_text);
  }

  if(isAbout){
    const c=s.about_content||{},sections=$$('main > section');
    text($('.page-hero .kicker'),c.kicker);text($('.page-hero h1'),c.hero_heading);text($('.page-hero .lead'),c.hero_intro);
    text($('.founder-badge strong'),c.founder_name);text($('.founder-badge p'),c.founder_title);
    const mon=$('.founder-monogram');if(mon&&c.founder_name){const ini=String(c.founder_name).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();if(ini)mon.textContent=ini;}
    const founderCopy=$('.founder > div:last-child');text(founderCopy?.querySelector('h2'),c.section_heading);text(founderCopy?.querySelector('.lead'),c.section_intro);
    const careChecks=founderCopy?.querySelector('.checks');if(careChecks&&Array.isArray(c.care_points)&&c.care_points.length)careChecks.innerHTML=c.care_points.map(x=>`<div class="check"><b>✓</b><div>${esc(x)}</div></div>`).join('');
    text(sections[2]?.querySelector('h2'),c.values_heading);
    const valuePath=sections[2]?.querySelector('.path');if(valuePath&&Array.isArray(c.value_steps)&&c.value_steps.length)valuePath.innerHTML=c.value_steps.map(x=>`<div class="path-step"><h3>${esc(x.title||'')}</h3><p>${esc(x.text||'')}</p></div>`).join('');
    text(sections[3]?.querySelector('h2'),c.location_heading);
    const locParas=sections[3]?.querySelectorAll('p');if(locParas?.[1])text(locParas[1],c.location_intro);
  }

  if(isOnline){
    const c=s.online_content||{},sections=$$('main > section');
    text($('.page-hero .kicker'),c.kicker);text($('.page-hero h1'),c.hero_heading);text($('.page-hero .lead'),c.hero_intro);
    text(sections[1]?.querySelector('h2'),c.section_heading);text(sections[1]?.querySelector('.notice'),c.notice);
    const onlineChecks=sections[1]?.querySelector('.checks');if(onlineChecks&&Array.isArray(c.support_points)&&c.support_points.length)onlineChecks.innerHTML=c.support_points.map(x=>`<div class="check"><b>✓</b><div>${esc(x)}</div></div>`).join('');
    text(sections[2]?.querySelector('h2'),c.requirements_heading);
    const reqPath=sections[2]?.querySelector('.path');if(reqPath&&Array.isArray(c.requirement_steps)&&c.requirement_steps.length)reqPath.innerHTML=c.requirement_steps.map(x=>`<div class="path-step"><h3>${esc(x.title||'')}</h3><p>${esc(x.text||'')}</p></div>`).join('');
    text(sections[3]?.querySelector('h2'),c.cta_heading);text(sections[3]?.querySelector('p'),c.cta_text);
  }

  if(isContact){
    const c=s.contact_content||{};
    text($('.page-hero .kicker'),c.kicker);text($('.page-hero h1'),c.hero_heading);text($('.page-hero .lead'),c.hero_intro);
    text($('.contact-card h2'),c.contact_heading);text($('.contact-card > p'),c.contact_intro);
    text($('.form-card h2'),c.form_heading);text($('.form-card > p'),c.form_intro);
  }

  if(isPrivacy){
    const c=s.privacy_content||{},privacy=$('.privacy');
    text($('.page-hero .kicker'),c.kicker);text($('.page-hero h1'),c.hero_heading);text($('.page-hero .lead'),c.hero_intro);
    if(privacy){
      const heads=$$('h2',privacy),paras=$$('p',privacy);
      text(heads[0],c.appointment_heading);text(paras[0],c.appointment_text);
      text(heads[1],c.contact_heading);text(paras[1],c.contact_text);
      text(heads[2],c.cookies_heading);text(paras[2],c.cookies_text);
      text(heads[3],c.children_heading);text(paras[3],c.children_text);
      text(heads[4],c.external_heading);text(paras[4],c.external_text);
      text(heads[5],'Contact');
      if(paras[5])paras[5].innerHTML=`Questions about privacy or website data can be sent to <a class="btn-link" href="mailto:${esc(center.email||'')}">${esc(center.email||'the center')}</a>.`;
    }
  }

  // Dynamic Home content blocks.
  if(isHome){
    const faqSection=$('[data-faqs]')?.closest('section');
    if(therapistRows.length&&faqSection&&!$('.v2-team-section')){
      const sec=document.createElement('section');sec.className='section section-soft v2-team-section';
      sec.innerHTML=`<div class="container"><div class="section-head"><div><div class="eyebrow">Our team</div><h2>Meet the people behind the care.</h2></div></div><div class="v2-team-grid">${therapistRows.map(t=>`<article class="v2-team-card">${t.photo_url?`<img src="${esc(t.photo_url)}" alt="${esc(t.full_name)}">`:`<div class="v2-monogram">${esc((t.full_name||'E')[0])}</div>`}<h3>${esc(t.full_name)}</h3><strong>${esc(t.title||'Therapist')}</strong>${t.qualifications?`<p>${esc(t.qualifications)}</p>`:''}${t.bio?`<p>${esc(t.bio)}</p>`:''}</article>`).join('')}</div></div>`;
      faqSection.parentNode.insertBefore(sec,faqSection);
    }
    const programs=items.filter(x=>x.type==='program'),gallery=items.filter(x=>x.type==='gallery'),testimonials=items.filter(x=>x.type==='testimonial'),faqs=items.filter(x=>x.type==='faq');
    if(programs.length&&faqSection&&s.show_programs!==false&&!$('.v2-programs-section')){const sec=document.createElement('section');sec.className='section v2-programs-section';sec.innerHTML=`<div class="container"><div class="section-head"><div><div class="eyebrow">Programs</div><h2>Focused support for real-life goals.</h2></div></div><div class="v2-content-grid">${programs.map(x=>`<article class="v2-content-card"><h3>${esc(x.title||'Program')}</h3><p>${esc(x.body||'')}</p></article>`).join('')}</div></div>`;faqSection.parentNode.insertBefore(sec,faqSection);}
    if(gallery.length&&faqSection&&s.show_gallery!==false&&!$('.v2-gallery-section')){const usable=gallery.filter(x=>x.image_url);if(usable.length){const sec=document.createElement('section');sec.className='section section-soft v2-gallery-section';sec.innerHTML=`<div class="container"><div class="section-head"><div><div class="eyebrow">${esc(galleryContent.kicker||'Inside Ephphatha')}</div><h2>${esc(galleryContent.heading||'Our center & activities.')}</h2></div></div><div class="v2-gallery-grid">${usable.map(x=>`<figure><img src="${esc(x.image_url)}" alt="${esc(x.title||clinic)}" loading="lazy"><figcaption><strong>${esc(x.title||'')}</strong><span>${esc(x.body||'')}</span></figcaption></figure>`).join('')}</div></div>`;faqSection.parentNode.insertBefore(sec,faqSection);}}
    if(testimonials.length&&$('.testimonials')&&s.show_testimonials!==false)$('.testimonials').innerHTML=testimonials.slice(0,6).map(x=>`<div class="quote"><div class="stars">★★★★★</div><blockquote>${esc(x.body||'')}</blockquote><small>${esc(x.title||'Family feedback')}</small></div>`).join('');
    if(faqs.length&&faqRoot){faqRoot.innerHTML=faqs.map((x,i)=>`<div class="faq-item${i===0?' open':''}"><button class="faq-q" type="button"><span>${esc(x.title)}</span><span>${i===0?'−':'+'}</span></button><div class="faq-a">${esc(x.body)}</div></div>`).join('');bindFaq(faqRoot);}
  }

  // Contact form always uses current Admin-controlled WhatsApp number.
  const form=$('#appointment-form');
  if(form)form.onsubmit=e=>{
    e.preventDefault();const d=new FormData(form);
    const lines=[`Hello ${clinic}, I would like to request an appointment.`,'',`Name: ${d.get('name')||'-'}`,`Phone: ${d.get('phone')||'-'}`,`Age: ${d.get('age')||'-'}`,`Service / concern: ${d.get('service')||'-'}`,`Mode: ${d.get('mode')||'-'}`,`Preferred time: ${d.get('time')||'-'}`,`Message: ${d.get('message')||'-'}`];
    const wa=String(center.whatsapp||center.phone_primary||'').replace(/\D/g,'');
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(lines.join('\n'))}`,'_blank','noopener');
  };
}).catch(err=>{console.error('Ephphatha public data feed unavailable:',err);document.documentElement.dataset.ephPublicData='error';});
})();