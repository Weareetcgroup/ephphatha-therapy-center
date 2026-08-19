(function(){
const cfg=window.EPH_CONFIG||{},c=cfg.contact||{},$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const SUPA='https://plvjkqmmlkmsxlufotic.supabase.co';
const KEY='sb_publishable_x-_JzpcD7uAybNZ6-XLRvQ_L6dBb71V';
const H={apikey:KEY,Authorization:`Bearer ${KEY}`};
async function rest(path){const r=await fetch(`${SUPA}/rest/v1/${path}`,{headers:H});if(!r.ok)throw new Error(await r.text());return r.json();}

if(!document.querySelector('link[data-v2-public]')){const l=document.createElement('link');l.rel='stylesheet';l.href='css/v2-public.css';l.dataset.v2Public='1';document.head.appendChild(l);}
$$('[data-phone-primary]').forEach(el=>{el.textContent=c.phonePrimary;if(el.tagName==='A')el.href='tel:+'+c.phonePrimaryDigits;});
$$('[data-phone-secondary]').forEach(el=>{el.textContent=c.phoneSecondary;if(el.tagName==='A')el.href='tel:+'+c.phoneSecondaryDigits;});
$$('[data-email]').forEach(el=>{el.textContent=c.email;if(el.tagName==='A')el.href='mailto:'+c.email;});
$$('[data-address]').forEach(el=>el.textContent=c.address);$$('[data-locality]').forEach(el=>el.textContent=c.locality);
$$('[data-whatsapp]').forEach(el=>el.href=`https://wa.me/${c.whatsappDigits}?text=${encodeURIComponent('Hello Ephphatha Therapy Center, I would like to enquire about an appointment.')}`);
$$('[data-directions]').forEach(el=>el.href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.mapQuery)}`);
$$('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

const servicesRoot=$('[data-services]');if(servicesRoot&&cfg.services)servicesRoot.innerHTML=cfg.services.map(s=>`<a class="service-card" href="${s.href}"><img src="${s.icon}" alt="" aria-hidden="true"><h3>${s.title}</h3><p>${s.summary}</p><span class="more">Explore service →</span></a>`).join('');
const faqRoot=$('[data-faqs]');if(faqRoot&&cfg.faqs)faqRoot.innerHTML=cfg.faqs.map((x,i)=>`<div class="faq-item${i===0?' open':''}"><button class="faq-q" type="button"><span>${x.q}</span><span>${i===0?'−':'+'}</span></button><div class="faq-a">${x.a}</div></div>`).join('');
$$('.faq-q').forEach(btn=>btn.addEventListener('click',()=>{const item=btn.closest('.faq-item');item.classList.toggle('open');btn.lastElementChild.textContent=item.classList.contains('open')?'−':'+';}));
const menuBtn=$('.menu-btn'),nav=$('.nav');if(menuBtn&&nav)menuBtn.addEventListener('click',()=>nav.classList.toggle('open'));
const form=$('#appointment-form');if(form)form.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(form);const lines=['Hello Ephphatha Therapy Center, I would like to request an appointment.','',`Name: ${d.get('name')||'-'}`,`Phone: ${d.get('phone')||'-'}`,`Age: ${d.get('age')||'-'}`,`Service / concern: ${d.get('service')||'-'}`,`Mode: ${d.get('mode')||'-'}`,`Preferred time: ${d.get('time')||'-'}`,`Message: ${d.get('message')||'-'}`];window.open(`https://wa.me/${c.whatsappDigits}?text=${encodeURIComponent(lines.join('\n'))}`,'_blank','noopener');});
const current=(location.pathname.split('/').pop()||'index.html').toLowerCase();$$('.nav a').forEach(a=>{const href=(a.getAttribute('href')||'').split('#')[0].toLowerCase();if(href===current)a.classList.add('active');});
$$('.header-actions').forEach(actions=>{if(!actions.querySelector('.portal-access')){const a=document.createElement('a');a.className='btn btn-secondary portal-access';a.href='portal.html';a.textContent='Sign in';actions.insertBefore(a,actions.firstChild);}});

function renderHours(hours){$$('[data-hours]').forEach(root=>{root.innerHTML='';const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];days.forEach((name,i)=>{const v=hours?.[i]??hours?.[String(i)];const row=document.createElement('div');row.className='hours-row';row.innerHTML=`<strong>${name}</strong><span>${v?`${esc(v[0])} – ${esc(v[1])}`:'Closed'}</span>`;root.appendChild(row);});});}
renderHours(cfg.hours||{});
if(location.pathname.endsWith('contact.html')||location.pathname.endsWith('/contact')){const card=$('.contact-card');if(card&&!card.querySelector('[data-hours]')){const box=document.createElement('div');box.className='public-hours-box';box.innerHTML='<div class="eyebrow">Clinic hours</div><div data-hours></div><a class="btn btn-primary" href="portal.html#book" style="margin-top:16px">Check live appointment slots →</a>';card.appendChild(box);renderHours(cfg.hours||{});}}

Promise.all([
  rest('settings?select=key,value'),
  rest('services?select=id,slug,title,summary,duration_minutes,mode&active=eq.true&order=sort_order.asc,title.asc'),
  rest('therapists?select=id,full_name,title,qualifications,bio,photo_url&active=eq.true&order=full_name.asc'),
  rest('content_items?select=id,type,title,body,image_url,meta,sort_order&active=eq.true&order=type.asc,sort_order.asc')
]).then(([settingRows,serviceRows,therapistRows,items])=>{
  const s=Object.fromEntries(settingRows.map(x=>[x.key,x.value]));
  const theme=s.theme||{},ann=s.announcement||{};
  if(theme.primary)document.documentElement.style.setProperty('--teal',theme.primary);
  if(theme.accent)document.documentElement.style.setProperty('--berry',theme.accent);
  if(theme.ink)document.documentElement.style.setProperty('--ink',theme.ink);
  if(theme.radius)document.documentElement.style.setProperty('--radius',theme.radius);
  if(theme.hero_style)document.body.dataset.heroStyle=theme.hero_style;
  if(ann.enabled&&ann.text){const bar=document.createElement('div');bar.className='site-announcement';bar.textContent=ann.text;document.body.prepend(bar);}
  if(s.business_hours)renderHours(s.business_hours);
  if(s.phone_primary)$$('[data-phone-primary]').forEach(el=>{el.textContent=s.phone_primary;if(el.tagName==='A')el.href='tel:'+String(s.phone_primary).replace(/[^\d+]/g,'');});
  if(s.phone_secondary)$$('[data-phone-secondary]').forEach(el=>{el.textContent=s.phone_secondary;if(el.tagName==='A')el.href='tel:'+String(s.phone_secondary).replace(/[^\d+]/g,'');});
  if(s.email)$$('[data-email]').forEach(el=>{el.textContent=s.email;if(el.tagName==='A')el.href='mailto:'+s.email;});

  const isHome=location.pathname==='/'||location.pathname.endsWith('/index.html')||location.pathname.endsWith('index.html');
  if(!isHome)return;
  const iconMap={'speech-therapy':'assets/speech.svg','occupational-therapy':'assets/ot.svg','behavioural-support':'assets/behavior.svg','early-intervention':'assets/early.svg','special-education':'assets/special-ed.svg','sensory-integration':'assets/sensory.svg','auditory-verbal-therapy':'assets/avt.svg','adult-communication':'assets/adult.svg'};
  const anchorMap={'speech-therapy':'speech','occupational-therapy':'ot','behavioural-support':'behavior','early-intervention':'early','special-education':'special','sensory-integration':'sensory','auditory-verbal-therapy':'avt','adult-communication':'adult'};
  if(servicesRoot&&serviceRows.length)servicesRoot.innerHTML=serviceRows.map(x=>`<a class="service-card" href="services.html#${anchorMap[x.slug]||x.slug}"><img src="${iconMap[x.slug]||'assets/speech.svg'}" alt="" aria-hidden="true"><h3>${esc(x.title)}</h3><p>${esc(x.summary||'')}</p><span class="more">${x.duration_minutes} min · Explore service →</span></a>`).join('');

  const faqSection=$('[data-faqs]')?.closest('section');
  if(therapistRows.length&&faqSection){const sec=document.createElement('section');sec.className='section section-soft v2-team-section';sec.innerHTML=`<div class="container"><div class="section-head"><div><div class="eyebrow">Our team</div><h2>Meet the people behind the care.</h2></div></div><div class="v2-team-grid">${therapistRows.map(t=>`<article class="v2-team-card">${t.photo_url?`<img src="${esc(t.photo_url)}" alt="${esc(t.full_name)}">`:`<div class="v2-monogram">${esc((t.full_name||'E')[0])}</div>`}<h3>${esc(t.full_name)}</h3><strong>${esc(t.title||'Therapist')}</strong>${t.qualifications?`<p>${esc(t.qualifications)}</p>`:''}${t.bio?`<p>${esc(t.bio)}</p>`:''}</article>`).join('')}</div></div>`;faqSection.parentNode.insertBefore(sec,faqSection);}
  const programs=items.filter(x=>x.type==='program'),gallery=items.filter(x=>x.type==='gallery'),testimonials=items.filter(x=>x.type==='testimonial'),faqs=items.filter(x=>x.type==='faq');
  if(programs.length&&faqSection&&s.show_programs!==false){const sec=document.createElement('section');sec.className='section v2-programs-section';sec.innerHTML=`<div class="container"><div class="section-head"><div><div class="eyebrow">Programs</div><h2>Focused support for real-life goals.</h2></div></div><div class="v2-content-grid">${programs.map(x=>`<article class="v2-content-card"><h3>${esc(x.title||'Program')}</h3><p>${esc(x.body||'')}</p></article>`).join('')}</div></div>`;faqSection.parentNode.insertBefore(sec,faqSection);}
  if(gallery.length&&faqSection&&s.show_gallery!==false){const usable=gallery.filter(x=>x.image_url);if(usable.length){const sec=document.createElement('section');sec.className='section section-soft v2-gallery-section';sec.innerHTML=`<div class="container"><div class="section-head"><div><div class="eyebrow">Inside Ephphatha</div><h2>Our center & activities.</h2></div></div><div class="v2-gallery-grid">${usable.map(x=>`<figure><img src="${esc(x.image_url)}" alt="${esc(x.title||'Ephphatha Therapy Center')}" loading="lazy"><figcaption><strong>${esc(x.title||'')}</strong><span>${esc(x.body||'')}</span></figcaption></figure>`).join('')}</div></div>`;faqSection.parentNode.insertBefore(sec,faqSection);}}
  if(testimonials.length&&$('.testimonials')&&s.show_testimonials!==false)$('.testimonials').innerHTML=testimonials.slice(0,6).map(x=>`<div class="quote"><div class="stars">★★★★★</div><blockquote>${esc(x.body||'')}</blockquote><small>${esc(x.title||'Family feedback')}</small></div>`).join('');
  if(faqs.length&&faqRoot){faqRoot.innerHTML=faqs.map((x,i)=>`<div class="faq-item${i===0?' open':''}"><button class="faq-q" type="button"><span>${esc(x.title)}</span><span>${i===0?'−':'+'}</span></button><div class="faq-a">${esc(x.body)}</div></div>`).join('');$$('.faq-q',faqRoot).forEach(btn=>btn.addEventListener('click',()=>{const item=btn.closest('.faq-item');item.classList.toggle('open');btn.lastElementChild.textContent=item.classList.contains('open')?'−':'+';}));}
}).catch(err=>console.warn('Ephphatha dynamic content unavailable:',err));
})();