(function(){
  const cfg = window.EPH_CONFIG || {};
  const c = cfg.contact || {};
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  if(!document.querySelector('link[data-v2-public]')){const l=document.createElement('link');l.rel='stylesheet';l.href='css/v2-public.css';l.dataset.v2Public='1';document.head.appendChild(l);}

  $$('[data-phone-primary]').forEach(el=>{el.textContent=c.phonePrimary; if(el.tagName==='A')el.href='tel:+'+c.phonePrimaryDigits;});
  $$('[data-phone-secondary]').forEach(el=>{el.textContent=c.phoneSecondary; if(el.tagName==='A')el.href='tel:+'+c.phoneSecondaryDigits;});
  $$('[data-email]').forEach(el=>{el.textContent=c.email; if(el.tagName==='A')el.href='mailto:'+c.email;});
  $$('[data-address]').forEach(el=>el.textContent=c.address);
  $$('[data-locality]').forEach(el=>el.textContent=c.locality);
  $$('[data-whatsapp]').forEach(el=>{el.href=`https://wa.me/${c.whatsappDigits}?text=${encodeURIComponent('Hello Ephphatha Therapy Center, I would like to enquire about an appointment.')}`;});
  $$('[data-directions]').forEach(el=>{el.href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.mapQuery)}`;});
  $$('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

  const servicesRoot = $('[data-services]');
  if(servicesRoot && cfg.services){servicesRoot.innerHTML = cfg.services.map(s=>`<a class="service-card" href="${s.href}"><img src="${s.icon}" alt="" aria-hidden="true"><h3>${s.title}</h3><p>${s.summary}</p><span class="more">Explore service →</span></a>`).join('');}
  const faqRoot = $('[data-faqs]');
  if(faqRoot && cfg.faqs){faqRoot.innerHTML = cfg.faqs.map((x,i)=>`<div class="faq-item${i===0?' open':''}"><button class="faq-q" type="button"><span>${x.q}</span><span>${i===0?'−':'+'}</span></button><div class="faq-a">${x.a}</div></div>`).join('');}
  $$('.faq-q').forEach(btn=>btn.addEventListener('click',()=>{const item=btn.closest('.faq-item');item.classList.toggle('open');btn.lastElementChild.textContent=item.classList.contains('open')?'−':'+';}));

  const menuBtn=$('.menu-btn'), nav=$('.nav'); if(menuBtn&&nav){menuBtn.addEventListener('click',()=>nav.classList.toggle('open'));}
  const form=$('#appointment-form'); if(form){form.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(form);const lines=['Hello Ephphatha Therapy Center, I would like to request an appointment.','',`Name: ${d.get('name')||'-'}`,`Phone: ${d.get('phone')||'-'}`,`Age: ${d.get('age')||'-'}`,`Service / concern: ${d.get('service')||'-'}`,`Mode: ${d.get('mode')||'-'}`,`Preferred time: ${d.get('time')||'-'}`,`Message: ${d.get('message')||'-'}`];window.open(`https://wa.me/${c.whatsappDigits}?text=${encodeURIComponent(lines.join('\n'))}`,'_blank','noopener');});}
  const current=(location.pathname.split('/').pop()||'index.html').toLowerCase(); $$('.nav a').forEach(a=>{const href=(a.getAttribute('href')||'').split('#')[0].toLowerCase();if(href===current)a.classList.add('active');});

  // Portal access is injected across every public page, so existing pages do not need manual header edits.
  $$('.header-actions').forEach(actions=>{if(!actions.querySelector('.portal-access')){const a=document.createElement('a');a.className='btn btn-secondary portal-access';a.href='portal.html';a.textContent='Sign in';actions.insertBefore(a,actions.firstChild);}});

  function renderHours(hours){
    $$('[data-hours]').forEach(root=>{root.innerHTML='';const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];days.forEach((name,i)=>{const v=hours?.[i]??hours?.[String(i)];const row=document.createElement('div');row.className='hours-row';row.innerHTML=`<strong>${name}</strong><span>${v?`${esc(v[0])} – ${esc(v[1])}`:'Closed'}</span>`;root.appendChild(row);});});
  }
  renderHours(cfg.hours||{});

  // Contact page enhancement: show verified public business hours and offer live slot booking.
  if(location.pathname.endsWith('contact.html') || location.pathname.endsWith('/contact')){
    const card=$('.contact-card');
    if(card && !card.querySelector('[data-hours]')){
      const box=document.createElement('div');box.className='public-hours-box';box.innerHTML='<div class="eyebrow">Clinic hours</div><div data-hours></div><a class="btn btn-primary" href="portal.html#book" style="margin-top:16px">Check live appointment slots →</a>';
      card.appendChild(box);
      renderHours(cfg.hours||{});
    }
  }

  // Pull public design/business settings from the admin-managed Cloudflare D1 database when V2 is connected.
  const remoteSettingsPromise=fetch('/api/public/settings',{credentials:'same-origin'}).then(r=>r.ok?r.json():null).then(d=>{
    if(!d?.settings)return {};const s=d.settings;window.EPH_REMOTE_SETTINGS=s;
    if(s.primary_color)document.documentElement.style.setProperty('--teal',s.primary_color);
    if(s.accent_color)document.documentElement.style.setProperty('--berry',s.accent_color);
    if(s.ink_color)document.documentElement.style.setProperty('--ink',s.ink_color);
    if(s.card_radius)document.documentElement.style.setProperty('--radius',`${Number(s.card_radius)||28}px`);
    if(s.hero_style)document.body.dataset.heroStyle=s.hero_style;
    if(s.announcement_enabled==='1'&&s.announcement_text){const bar=document.createElement('div');bar.className='site-announcement';bar.textContent=s.announcement_text;document.body.prepend(bar);}
    if(s.business_hours){try{renderHours(JSON.parse(s.business_hours))}catch{}}
    if(s.show_testimonials==='0'){const t=$('.testimonials');if(t)t.closest('section')?.classList.add('v2-hidden');}
    return s;
  }).catch(()=>({}));

  // Admin-managed public data: services, team, programs, gallery and testimonials.
  const isHome=location.pathname==='/'||location.pathname.endsWith('/index.html')||location.pathname.endsWith('index.html');
  if(isHome){
    const iconMap={speech:'assets/speech.svg',occupational:'assets/ot.svg',behaviour:'assets/behavior.svg','early-intervention':'assets/early.svg','special-education':'assets/special-ed.svg','sensory-integration':'assets/sensory.svg',avt:'assets/avt.svg','adult-communication':'assets/adult.svg'};
    const anchorMap={speech:'speech',occupational:'ot',behaviour:'behavior','early-intervention':'early','special-education':'special','sensory-integration':'sensory',avt:'avt','adult-communication':'adult'};
    fetch('/api/public/services').then(r=>r.ok?r.json():null).then(d=>{if(!d?.services?.length||!servicesRoot)return;servicesRoot.innerHTML=d.services.map(x=>`<a class="service-card" href="services.html#${anchorMap[x.slug]||x.slug}"><img src="${iconMap[x.slug]||'assets/speech.svg'}" alt="" aria-hidden="true"><h3>${esc(x.title)}</h3><p>${esc(x.summary||'')}</p><span class="more">${x.duration_minutes} min · Explore service →</span></a>`).join('')}).catch(()=>{});
    Promise.all([
      remoteSettingsPromise,
      fetch('/api/public/therapists').then(r=>r.ok?r.json():null),
      fetch('/api/public/content').then(r=>r.ok?r.json():null)
    ]).then(([rs,td,cd])=>{
      const therapists=td?.therapists||[],items=cd?.items||[];
      const faqSection=$('[data-faqs]')?.closest('section');
      if(therapists.length && faqSection){const sec=document.createElement('section');sec.className='section section-soft v2-team-section';sec.innerHTML=`<div class="container"><div class="section-head"><div><div class="eyebrow">Our team</div><h2>Meet the people behind the care.</h2><p class="lead">Professional profiles are managed directly by Ephphatha.</p></div></div><div class="v2-team-grid">${therapists.map(t=>`<article class="v2-team-card">${t.photo_url?`<img src="${esc(t.photo_url)}" alt="${esc(t.name)}">`:`<div class="v2-monogram">${esc((t.name||'E')[0])}</div>`}<h3>${esc(t.name)}</h3><strong>${esc(t.title||'Therapist')}</strong>${t.qualifications?`<p>${esc(t.qualifications)}</p>`:''}${t.bio?`<p>${esc(t.bio)}</p>`:''}</article>`).join('')}</div></div>`;faqSection.parentNode.insertBefore(sec,faqSection)}
      const programs=items.filter(x=>x.type==='program'),gallery=items.filter(x=>x.type==='gallery'),testimonials=items.filter(x=>x.type==='testimonial');
      if(programs.length && faqSection && rs.show_programs!=='0'){const sec=document.createElement('section');sec.className='section v2-programs-section';sec.innerHTML=`<div class="container"><div class="section-head"><div><div class="eyebrow">Programs</div><h2>Focused support for real-life goals.</h2></div></div><div class="v2-content-grid">${programs.map(x=>`<article class="v2-content-card"><h3>${esc(x.title||'Program')}</h3><p>${esc(x.body||'')}</p></article>`).join('')}</div></div>`;faqSection.parentNode.insertBefore(sec,faqSection)}
      if(gallery.length && faqSection && rs.show_gallery!=='0'){const usable=gallery.filter(x=>x.image_url);if(usable.length){const sec=document.createElement('section');sec.className='section section-soft v2-gallery-section';sec.innerHTML=`<div class="container"><div class="section-head"><div><div class="eyebrow">Inside Ephphatha</div><h2>Our center & activities.</h2></div></div><div class="v2-gallery-grid">${usable.map(x=>`<figure><img src="${esc(x.image_url)}" alt="${esc(x.title||'Ephphatha Therapy Center')}" loading="lazy"><figcaption><strong>${esc(x.title||'')}</strong><span>${esc(x.body||'')}</span></figcaption></figure>`).join('')}</div></div>`;faqSection.parentNode.insertBefore(sec,faqSection)}}
      if(testimonials.length && $('.testimonials') && rs.show_testimonials!=='0'){$('.testimonials').innerHTML=testimonials.slice(0,6).map(x=>`<div class="quote"><div class="stars">★★★★★</div><blockquote>${esc(x.body||'')}</blockquote><small>${esc(x.title||'Family feedback')}</small></div>`).join('')}
    }).catch(()=>{});
  }
})();
