(function(){
  const cfg = window.EPH_CONFIG || {};
  const c = cfg.contact || {};
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));

  // Contact placeholders
  $$('[data-phone-primary]').forEach(el=>{el.textContent=c.phonePrimary; if(el.tagName==='A')el.href='tel:+'+c.phonePrimaryDigits;});
  $$('[data-phone-secondary]').forEach(el=>{el.textContent=c.phoneSecondary; if(el.tagName==='A')el.href='tel:+'+c.phoneSecondaryDigits;});
  $$('[data-email]').forEach(el=>{el.textContent=c.email; if(el.tagName==='A')el.href='mailto:'+c.email;});
  $$('[data-address]').forEach(el=>el.textContent=c.address);
  $$('[data-locality]').forEach(el=>el.textContent=c.locality);
  $$('[data-whatsapp]').forEach(el=>{el.href=`https://wa.me/${c.whatsappDigits}?text=${encodeURIComponent('Hello Ephphatha Therapy Center, I would like to enquire about an appointment.')}`;});
  $$('[data-directions]').forEach(el=>{el.href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.mapQuery)}`;});
  $$('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

  // Render service cards
  const servicesRoot = $('[data-services]');
  if(servicesRoot && cfg.services){
    servicesRoot.innerHTML = cfg.services.map(s=>`<a class="service-card" href="${s.href}"><img src="${s.icon}" alt="" aria-hidden="true"><h3>${s.title}</h3><p>${s.summary}</p><span class="more">Explore service →</span></a>`).join('');
  }

  // Render FAQs
  const faqRoot = $('[data-faqs]');
  if(faqRoot && cfg.faqs){
    faqRoot.innerHTML = cfg.faqs.map((x,i)=>`<div class="faq-item${i===0?' open':''}"><button class="faq-q" type="button"><span>${x.q}</span><span>${i===0?'−':'+'}</span></button><div class="faq-a">${x.a}</div></div>`).join('');
  }
  $$('.faq-q').forEach(btn=>btn.addEventListener('click',()=>{
    const item=btn.closest('.faq-item');
    item.classList.toggle('open');
    btn.lastElementChild.textContent=item.classList.contains('open')?'−':'+';
  }));

  // Mobile nav
  const menuBtn=$('.menu-btn'), nav=$('.nav');
  if(menuBtn&&nav){menuBtn.addEventListener('click',()=>nav.classList.toggle('open'));}

  // Appointment form -> WhatsApp. No server/backend required.
  const form=$('#appointment-form');
  if(form){
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const d=new FormData(form);
      const lines=[
        'Hello Ephphatha Therapy Center, I would like to request an appointment.',
        '',
        `Name: ${d.get('name')||'-'}`,
        `Phone: ${d.get('phone')||'-'}`,
        `Age: ${d.get('age')||'-'}`,
        `Service / concern: ${d.get('service')||'-'}`,
        `Mode: ${d.get('mode')||'-'}`,
        `Preferred time: ${d.get('time')||'-'}`,
        `Message: ${d.get('message')||'-'}`
      ];
      window.open(`https://wa.me/${c.whatsappDigits}?text=${encodeURIComponent(lines.join('\n'))}`,'_blank','noopener');
    });
  }

  // Active nav link
  const current=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  $$('.nav a').forEach(a=>{const href=(a.getAttribute('href')||'').split('#')[0].toLowerCase();if(href===current)a.classList.add('active');});
})();
