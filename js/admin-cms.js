(()=>{
const sb=window.ephSupabase;
if(!sb)return;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fo=f=>Object.fromEntries(new FormData(f).entries());
const notice=(text,good=false)=>{
  const el=$('#admin-message'); if(!el)return;
  el.innerHTML=text?`<div class="notice ${good?'good':''}">${esc(text)}</div>`:'';
  if(text)el.scrollIntoView({behavior:'smooth',block:'nearest'});
};
async function getSettings(){
  const r=await sb.from('settings').select('key,value');
  if(r.error)throw r.error;
  return Object.fromEntries((r.data||[]).map(x=>[x.key,x.value]));
}
async function putSetting(key,value){
  const r=await sb.from('settings').upsert({key,value},{onConflict:'key'});
  if(r.error)throw r.error;
}
const setForm=(form,vals)=>{
  if(!form)return;
  for(const [k,v] of Object.entries(vals)){
    const el=form.elements[k]; if(!el)continue;
    if(el.tagName==='SELECT' && typeof v==='boolean')el.value=v?'1':'0';
    else el.value=v??'';
  }
};
const listText=v=>Array.isArray(v)?v.join('\n'):'';
const pairText=v=>Array.isArray(v)?v.map(x=>`${x?.title||''} | ${x?.text||''}`).join('\n'):'';
const parseList=v=>String(v||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
const parsePairs=v=>String(v||'').split(/\r?\n/).map(line=>{const i=line.indexOf('|');return i<0?{title:line.trim(),text:''}:{title:line.slice(0,i).trim(),text:line.slice(i+1).trim()};}).filter(x=>x.title||x.text);

function installCmsPanels(){
  const website=$('[data-view-panel="website"]');
  if(!website)return;
  const old=$('#center-details-form')?.closest('.panel');
  if(old)old.remove();
  if($('#cms-center-form'))return;
  const wrap=document.createElement('div');
  wrap.id='eph-cms-panels';
  wrap.innerHTML=`
  <div class="panel" style="margin-bottom:20px">
    <div class="page-head" style="margin-bottom:16px"><div><h3>Center details & exact location</h3><p>Change the public business details without touching GitHub. The postal address and Google Maps pin are separate.</p></div></div>
    <form id="cms-center-form" class="form-grid">
      <div class="field"><label>Center name</label><input name="clinic_name" required></div>
      <div class="field"><label>Established year</label><input name="established_year"></div>
      <div class="field full"><label>Header subtitle</label><input name="brand_subtitle"></div>
      <div class="field full"><label>Tagline</label><input name="tagline"></div>
      <div class="field"><label>Primary phone</label><input name="phone_primary"></div>
      <div class="field"><label>Alternate phone</label><input name="phone_secondary"></div>
      <div class="field"><label>WhatsApp number</label><input name="whatsapp"></div>
      <div class="field"><label>Email</label><input name="email" type="email"></div>
      <div class="field full"><label>Displayed center address</label><textarea name="display_address"></textarea></div>
      <div class="field full"><label>Locality / area label</label><input name="locality"></div>
      <div class="field full"><label>Exact Google Maps location link</label><input name="map_url" type="url" placeholder="https://maps.app.goo.gl/..."><small class="muted">All “Directions” links use this exact pin, independently of the displayed address.</small></div>
      <div class="field full"><label>Google Maps embed URL (optional)</label><input name="map_embed_url" placeholder="Official Google Maps embed URL"><small class="muted">If blank, the Contact page shows a safe button to the exact pin instead of an incorrect embedded map.</small></div>
      <div class="field full"><label>Map fallback label</label><input name="map_embed_query"></div>
      <div class="field full"><label>Instagram URL</label><input name="instagram_url" type="url"></div>
      <div class="field full"><button class="btn btn-primary">Save center details</button></div>
    </form>
  </div>

  <div class="panel" style="margin-bottom:20px">
    <div class="page-head" style="margin-bottom:16px"><div><h3>Navigation & main buttons</h3><p>Rename menu labels and hide/show public pages.</p></div></div>
    <form id="cms-navigation-form" class="form-grid">
      <div class="field"><label>Home</label><input name="home"></div>
      <div class="field"><label>Services</label><input name="services"></div>
      <div class="field"><label>About</label><input name="about"></div>
      <div class="field"><label>Online Therapy</label><input name="online"></div>
      <div class="field"><label>Contact</label><input name="contact"></div>
      <div class="field"><label>Book button</label><input name="book_cta"></div>
      <div class="field"><label>Portal button</label><input name="portal"></div>
      <div class="field"><label>Show Home</label><select name="show_home"><option value="1">Yes</option><option value="0">No</option></select></div>
      <div class="field"><label>Show Services</label><select name="show_services"><option value="1">Yes</option><option value="0">No</option></select></div>
      <div class="field"><label>Show About</label><select name="show_about"><option value="1">Yes</option><option value="0">No</option></select></div>
      <div class="field"><label>Show Online Therapy</label><select name="show_online"><option value="1">Yes</option><option value="0">No</option></select></div>
      <div class="field"><label>Show Contact</label><select name="show_contact"><option value="1">Yes</option><option value="0">No</option></select></div>
      <div class="field full"><button class="btn btn-primary">Save navigation</button></div>
    </form>
  </div>

  <div class="panel" style="margin-bottom:20px">
    <div class="page-head" style="margin-bottom:16px"><div><h3>Page text editor</h3><p>Edit the main content on every public page. Services themselves are edited under Services; FAQs, testimonials, programs and gallery stay under Content.</p></div></div>
    <form id="cms-copy-form" class="form-grid">
      <div class="field full"><h4>Home page</h4></div>
      <div class="field full"><label>Hero kicker</label><input name="home_hero_kicker"></div>
      <div class="field full"><label>Hero heading</label><input name="home_hero_title"></div>
      <div class="field full"><label>Hero introduction</label><textarea name="home_hero_lead"></textarea></div>
      <div class="field full"><label>Services section heading</label><input name="home_services_heading"></div>
      <div class="field full"><label>Services introduction</label><textarea name="home_services_intro"></textarea></div>
      <div class="field full"><label>Why Ephphatha heading</label><input name="home_story_heading"></div>
      <div class="field full"><label>Why Ephphatha quote</label><textarea name="home_story_quote"></textarea></div>
      <div class="field full"><label>Story mini heading</label><input name="home_story_mini_heading"></div>
      <div class="field full"><label>Story mini text</label><textarea name="home_story_mini_text"></textarea></div>
      <div class="field full"><label>Approach heading</label><input name="home_approach_heading"></div>
      <div class="field full"><label>Approach text</label><textarea name="home_approach_intro"></textarea></div>
      <div class="field full"><label>Approach checklist</label><textarea name="home_approach_points" placeholder="One item per line"></textarea></div>
      <div class="field full"><label>How it works heading</label><input name="home_how_heading"></div>
      <div class="field full"><label>How it works text</label><textarea name="home_how_intro"></textarea></div>
      <div class="field full"><label>How-it-works steps</label><textarea name="home_how_steps" placeholder="Title | Description — one step per line"></textarea></div>
      <div class="field full"><label>Concern heading</label><input name="home_concern_heading"></div>
      <div class="field full"><label>Concern text</label><textarea name="home_concern_intro"></textarea></div>
      <div class="field full"><label>Concern tiles</label><textarea name="home_concerns" placeholder="One concern per line"></textarea></div>
      <div class="field full"><label>Trust heading</label><input name="home_trust_heading"></div>
      <div class="field full"><label>Trust text</label><textarea name="home_trust_intro"></textarea></div>
      <div class="field full"><label>FAQ heading</label><input name="home_faq_heading"></div>
      <div class="field full"><label>Bottom CTA heading</label><input name="home_cta_heading"></div>
      <div class="field full"><label>Bottom CTA text</label><textarea name="home_cta_text"></textarea></div>

      <div class="field full"><hr><h4>Services page</h4></div>
      <div class="field full"><label>Kicker</label><input name="services_kicker"></div>
      <div class="field full"><label>Heading</label><input name="services_hero_heading"></div>
      <div class="field full"><label>Introduction</label><textarea name="services_hero_intro"></textarea></div>
      <div class="field full"><label>Bottom CTA heading</label><input name="services_cta_heading"></div>
      <div class="field full"><label>Bottom CTA text</label><textarea name="services_cta_text"></textarea></div>

      <div class="field full"><hr><h4>About page</h4></div>
      <div class="field full"><label>Kicker</label><input name="about_kicker"></div>
      <div class="field full"><label>Main heading</label><input name="about_hero_heading"></div>
      <div class="field full"><label>Introduction</label><textarea name="about_hero_intro"></textarea></div>
      <div class="field"><label>Founder name</label><input name="about_founder_name"></div>
      <div class="field"><label>Founder title</label><input name="about_founder_title"></div>
      <div class="field full"><label>Main section heading</label><input name="about_section_heading"></div>
      <div class="field full"><label>Main section text</label><textarea name="about_section_intro"></textarea></div>
      <div class="field full"><label>Founder-care checklist</label><textarea name="about_care_points" placeholder="One item per line"></textarea></div>
      <div class="field full"><label>Values heading</label><input name="about_values_heading"></div>
      <div class="field full"><label>Values cards</label><textarea name="about_value_steps" placeholder="Title | Description — one card per line"></textarea></div>
      <div class="field full"><label>Location heading</label><input name="about_location_heading"></div>
      <div class="field full"><label>Location text</label><textarea name="about_location_intro"></textarea></div>

      <div class="field full"><hr><h4>Online Therapy page</h4></div>
      <div class="field full"><label>Kicker</label><input name="online_kicker"></div>
      <div class="field full"><label>Main heading</label><input name="online_hero_heading"></div>
      <div class="field full"><label>Introduction</label><textarea name="online_hero_intro"></textarea></div>
      <div class="field full"><label>Support section heading</label><input name="online_section_heading"></div>
      <div class="field full"><label>Online-support checklist</label><textarea name="online_support_points" placeholder="One item per line"></textarea></div>
      <div class="field full"><label>Clinical suitability notice</label><textarea name="online_notice"></textarea></div>
      <div class="field full"><label>Requirements heading</label><input name="online_requirements_heading"></div>
      <div class="field full"><label>Requirements cards</label><textarea name="online_requirement_steps" placeholder="Title | Description — one card per line"></textarea></div>
      <div class="field full"><label>Bottom CTA heading</label><input name="online_cta_heading"></div>
      <div class="field full"><label>Bottom CTA text</label><textarea name="online_cta_text"></textarea></div>

      <div class="field full"><hr><h4>Contact page</h4></div>
      <div class="field full"><label>Kicker</label><input name="contact_kicker"></div>
      <div class="field full"><label>Main heading</label><input name="contact_hero_heading"></div>
      <div class="field full"><label>Introduction</label><textarea name="contact_hero_intro"></textarea></div>
      <div class="field full"><label>Contact card heading</label><input name="contact_card_heading"></div>
      <div class="field full"><label>Contact card text</label><textarea name="contact_card_intro"></textarea></div>
      <div class="field full"><label>Appointment form heading</label><input name="contact_form_heading"></div>
      <div class="field full"><label>Appointment form text</label><textarea name="contact_form_intro"></textarea></div>

      <div class="field full"><hr><h4>Privacy page</h4></div>
      <div class="field full"><label>Kicker</label><input name="privacy_kicker"></div>
      <div class="field full"><label>Main heading</label><input name="privacy_hero_heading"></div>
      <div class="field full"><label>Introduction</label><textarea name="privacy_hero_intro"></textarea></div>
      <div class="field full"><label>Appointments heading</label><input name="privacy_appointment_heading"></div>
      <div class="field full"><label>Appointments text</label><textarea name="privacy_appointment_text"></textarea></div>
      <div class="field full"><label>Contact information heading</label><input name="privacy_contact_heading"></div>
      <div class="field full"><label>Contact information text</label><textarea name="privacy_contact_text"></textarea></div>
      <div class="field full"><label>Authentication / cookies heading</label><input name="privacy_cookies_heading"></div>
      <div class="field full"><label>Authentication / cookies text</label><textarea name="privacy_cookies_text"></textarea></div>
      <div class="field full"><label>Children / clinical information heading</label><input name="privacy_children_heading"></div>
      <div class="field full"><label>Children / clinical information text</label><textarea name="privacy_children_text"></textarea></div>
      <div class="field full"><label>External services heading</label><input name="privacy_external_heading"></div>
      <div class="field full"><label>External services text</label><textarea name="privacy_external_text"></textarea></div>
      <div class="field full"><button class="btn btn-primary">Save page content</button></div>
    </form>
  </div>

  <div class="panel" style="margin-bottom:20px">
    <div class="page-head" style="margin-bottom:16px"><div><h3>Footer, browser titles & major images</h3><p>Control footer copy, SEO/browser titles and key image URLs.</p></div></div>
    <form id="cms-brand-form" class="form-grid">
      <div class="field full"><label>Footer description</label><textarea name="footer_about"></textarea></div>
      <div class="field full"><label>Footer disclaimer</label><textarea name="footer_disclaimer"></textarea></div>
      <div class="field full"><label>Logo URL</label><input name="logo_url"></div>
      <div class="field full"><label>Favicon URL</label><input name="favicon_url"></div>
      <div class="field full"><label>Home hero image URL</label><input name="home_hero_url"></div>
      <div class="field full"><label>Online Therapy image URL</label><input name="online_image_url"></div>
      <div class="field full"><label>Home browser title</label><input name="seo_home_title"></div>
      <div class="field full"><label>Home search description</label><textarea name="seo_home_description"></textarea></div>
      <div class="field full"><label>Services browser title</label><input name="seo_services_title"></div>
      <div class="field full"><label>About browser title</label><input name="seo_about_title"></div>
      <div class="field full"><label>Online Therapy browser title</label><input name="seo_online_title"></div>
      <div class="field full"><label>Contact browser title</label><input name="seo_contact_title"></div>
      <div class="field full"><label>Privacy browser title</label><input name="seo_privacy_title"></div>
      <div class="field full"><button class="btn btn-primary">Save footer, SEO & images</button></div>
    </form>
  </div>`;
  const first=website.querySelector('.grid-2');
  const nodes=[...wrap.children];
  nodes.forEach(n=>first?website.insertBefore(n,first):website.appendChild(n));
}

async function loadCmsSettings(){
  const s=await getSettings();
  const center=s.center_profile||{};
  setForm($('#cms-center-form'),{
    clinic_name:center.clinic_name||'Ephphatha Therapy Center',
    established_year:center.established_year||'2020',
    brand_subtitle:center.brand_subtitle||'Speech • Occupational • Developmental Care',
    tagline:center.tagline||'Every voice. Every milestone. Every possibility.',
    phone_primary:center.phone_primary||'+91 97911 92699',
    phone_secondary:center.phone_secondary||'+91 98401 19895',
    whatsapp:center.whatsapp||'919791192699',
    email:center.email||'ephphathatherapycenter@gmail.com',
    display_address:center.display_address||'Vishwas Apartment, B-Block, Soundariya Nagar, Gowrivakkam, Chennai, Tamil Nadu 600073',
    locality:center.locality||'Gowrivakkam / Sembakkam, Chennai',
    map_url:center.map_url||'https://maps.app.goo.gl/pS8H2akJMwe726BQ8',
    map_embed_url:center.map_embed_url||'',
    map_embed_query:center.map_embed_query||'Ephphatha Therapy Center Chennai',
    instagram_url:center.instagram_url||'https://www.instagram.com/ephphathatherapycenter/'
  });
  const nav={home:'Home',services:'Services',about:'About',online:'Online Therapy',contact:'Contact',book_cta:'Book an appointment',portal:'Sign in',show_home:true,show_services:true,show_about:true,show_online:true,show_contact:true,...(s.navigation||{})};
  setForm($('#cms-navigation-form'),nav);

  const home=s.home_content||{},svc=s.services_content||{},about=s.about_content||{},online=s.online_content||{},contact=s.contact_content||{},privacy=s.privacy_content||{};
  setForm($('#cms-copy-form'),{
    home_hero_kicker:home.hero_kicker,home_hero_title:home.hero_title,home_hero_lead:home.hero_lead,
    home_services_heading:home.services_heading,home_services_intro:home.services_intro,
    home_story_heading:home.story_heading,home_story_quote:home.story_quote,home_story_mini_heading:home.story_mini_heading,home_story_mini_text:home.story_mini_text,
    home_approach_heading:home.approach_heading,home_approach_intro:home.approach_intro,home_approach_points:listText(home.approach_points),
    home_how_heading:home.how_heading,home_how_intro:home.how_intro,home_how_steps:pairText(home.how_steps),home_concern_heading:home.concern_heading,home_concern_intro:home.concern_intro,home_concerns:listText(home.concerns),
    home_trust_heading:home.trust_heading,home_trust_intro:home.trust_intro,home_faq_heading:home.faq_heading,home_cta_heading:home.cta_heading,home_cta_text:home.cta_text,
    services_kicker:svc.kicker,services_hero_heading:svc.hero_heading,services_hero_intro:svc.hero_intro,services_cta_heading:svc.cta_heading,services_cta_text:svc.cta_text,
    about_kicker:about.kicker,about_hero_heading:about.hero_heading,about_hero_intro:about.hero_intro,about_founder_name:about.founder_name,about_founder_title:about.founder_title,
    about_section_heading:about.section_heading,about_section_intro:about.section_intro,about_care_points:listText(about.care_points),about_values_heading:about.values_heading,about_value_steps:pairText(about.value_steps),about_location_heading:about.location_heading,about_location_intro:about.location_intro,
    online_kicker:online.kicker,online_hero_heading:online.hero_heading,online_hero_intro:online.hero_intro,online_section_heading:online.section_heading,online_support_points:listText(online.support_points),online_notice:online.notice,online_requirements_heading:online.requirements_heading,online_requirement_steps:pairText(online.requirement_steps),online_cta_heading:online.cta_heading,online_cta_text:online.cta_text,
    contact_kicker:contact.kicker,contact_hero_heading:contact.hero_heading,contact_hero_intro:contact.hero_intro,contact_card_heading:contact.contact_heading,contact_card_intro:contact.contact_intro,contact_form_heading:contact.form_heading,contact_form_intro:contact.form_intro,
    privacy_kicker:privacy.kicker,privacy_hero_heading:privacy.hero_heading,privacy_hero_intro:privacy.hero_intro,privacy_appointment_heading:privacy.appointment_heading,privacy_appointment_text:privacy.appointment_text,
    privacy_contact_heading:privacy.contact_heading,privacy_contact_text:privacy.contact_text,privacy_cookies_heading:privacy.cookies_heading,privacy_cookies_text:privacy.cookies_text,
    privacy_children_heading:privacy.children_heading,privacy_children_text:privacy.children_text,privacy_external_heading:privacy.external_heading,privacy_external_text:privacy.external_text
  });
  const footer=s.footer_content||{},media=s.brand_media||{},seo=s.seo_settings||{};
  setForm($('#cms-brand-form'),{
    footer_about:footer.about,footer_disclaimer:footer.disclaimer,
    logo_url:media.logo_url||'assets/logo.png',favicon_url:media.favicon_url||'assets/favicon.png',
    home_hero_url:media.home_hero_url||'assets/hero-therapy.svg',online_image_url:media.online_image_url||'assets/hero-therapy.svg',
    seo_home_title:seo.home_title,seo_home_description:seo.home_description,seo_services_title:seo.services_title,seo_about_title:seo.about_title,
    seo_online_title:seo.online_title,seo_contact_title:seo.contact_title,seo_privacy_title:seo.privacy_title||'Privacy | Ephphatha Therapy Center'
  });
}

function bindCmsForms(){
  $('#cms-center-form').onsubmit=async e=>{
    e.preventDefault();const d=fo(e.target);
    const value={
      clinic_name:String(d.clinic_name||'').trim(),established_year:String(d.established_year||'').trim(),
      brand_subtitle:String(d.brand_subtitle||'').trim(),tagline:String(d.tagline||'').trim(),
      phone_primary:String(d.phone_primary||'').trim(),phone_secondary:String(d.phone_secondary||'').trim(),
      whatsapp:String(d.whatsapp||'').replace(/\D/g,''),email:String(d.email||'').trim(),
      display_address:String(d.display_address||'').trim(),locality:String(d.locality||'').trim(),
      map_url:String(d.map_url||'').trim(),map_embed_url:String(d.map_embed_url||'').trim(),
      map_embed_query:String(d.map_embed_query||'').trim(),instagram_url:String(d.instagram_url||'').trim()
    };
    try{await putSetting('center_profile',value);notice('Center details and exact map location saved.',true);}catch(x){notice(x.message);}
  };
  $('#cms-navigation-form').onsubmit=async e=>{
    e.preventDefault();const d=fo(e.target);
    const value={home:d.home,services:d.services,about:d.about,online:d.online,contact:d.contact,book_cta:d.book_cta,portal:d.portal,show_home:d.show_home==='1',show_services:d.show_services==='1',show_about:d.show_about==='1',show_online:d.show_online==='1',show_contact:d.show_contact==='1'};
    try{await putSetting('navigation',value);notice('Navigation saved.',true);}catch(x){notice(x.message);}
  };
  $('#cms-copy-form').onsubmit=async e=>{
    e.preventDefault();const d=fo(e.target);
    const groups={
      home_content:{hero_kicker:d.home_hero_kicker,hero_title:d.home_hero_title,hero_lead:d.home_hero_lead,services_heading:d.home_services_heading,services_intro:d.home_services_intro,story_heading:d.home_story_heading,story_quote:d.home_story_quote,story_mini_heading:d.home_story_mini_heading,story_mini_text:d.home_story_mini_text,approach_heading:d.home_approach_heading,approach_intro:d.home_approach_intro,approach_points:parseList(d.home_approach_points),how_heading:d.home_how_heading,how_intro:d.home_how_intro,how_steps:parsePairs(d.home_how_steps),concern_heading:d.home_concern_heading,concern_intro:d.home_concern_intro,concerns:parseList(d.home_concerns),trust_heading:d.home_trust_heading,trust_intro:d.home_trust_intro,faq_heading:d.home_faq_heading,cta_heading:d.home_cta_heading,cta_text:d.home_cta_text},
      services_content:{kicker:d.services_kicker,hero_heading:d.services_hero_heading,hero_intro:d.services_hero_intro,cta_heading:d.services_cta_heading,cta_text:d.services_cta_text},
      about_content:{kicker:d.about_kicker,hero_heading:d.about_hero_heading,hero_intro:d.about_hero_intro,founder_name:d.about_founder_name,founder_title:d.about_founder_title,section_heading:d.about_section_heading,section_intro:d.about_section_intro,care_points:parseList(d.about_care_points),values_heading:d.about_values_heading,value_steps:parsePairs(d.about_value_steps),location_heading:d.about_location_heading,location_intro:d.about_location_intro},
      online_content:{kicker:d.online_kicker,hero_heading:d.online_hero_heading,hero_intro:d.online_hero_intro,section_heading:d.online_section_heading,support_points:parseList(d.online_support_points),notice:d.online_notice,requirements_heading:d.online_requirements_heading,requirement_steps:parsePairs(d.online_requirement_steps),cta_heading:d.online_cta_heading,cta_text:d.online_cta_text},
      contact_content:{kicker:d.contact_kicker,hero_heading:d.contact_hero_heading,hero_intro:d.contact_hero_intro,contact_heading:d.contact_card_heading,contact_intro:d.contact_card_intro,form_heading:d.contact_form_heading,form_intro:d.contact_form_intro},
      privacy_content:{kicker:d.privacy_kicker,hero_heading:d.privacy_hero_heading,hero_intro:d.privacy_hero_intro,appointment_heading:d.privacy_appointment_heading,appointment_text:d.privacy_appointment_text,contact_heading:d.privacy_contact_heading,contact_text:d.privacy_contact_text,cookies_heading:d.privacy_cookies_heading,cookies_text:d.privacy_cookies_text,children_heading:d.privacy_children_heading,children_text:d.privacy_children_text,external_heading:d.privacy_external_heading,external_text:d.privacy_external_text}
    };
    try{for(const [k,v] of Object.entries(groups))await putSetting(k,v);notice('Public page content saved.',true);}catch(x){notice(x.message);}
  };
  $('#cms-brand-form').onsubmit=async e=>{
    e.preventDefault();const d=fo(e.target);
    try{
      await putSetting('footer_content',{about:d.footer_about||'',disclaimer:d.footer_disclaimer||'',copyright_suffix:'All rights reserved.'});
      await putSetting('brand_media',{logo_url:d.logo_url||'assets/logo.png',favicon_url:d.favicon_url||'assets/favicon.png',home_hero_url:d.home_hero_url||'assets/hero-therapy.svg',online_image_url:d.online_image_url||'assets/hero-therapy.svg'});
      await putSetting('seo_settings',{home_title:d.seo_home_title||'',home_description:d.seo_home_description||'',services_title:d.seo_services_title||'',about_title:d.seo_about_title||'',online_title:d.seo_online_title||'',contact_title:d.seo_contact_title||'',privacy_title:d.seo_privacy_title||''});
      notice('Footer, browser titles and images saved.',true);
    }catch(x){notice(x.message);}
  };
}

async function enhanceServices(){
  const f=$('#service-form'); if(!f)return;
  const dur=f.querySelector('[name="duration_minutes"]');
  if(dur?.tagName==='SELECT'){
    const n=document.createElement('input');n.type='number';n.name='duration_minutes';n.min='15';n.max='240';n.step='1';n.value='30';n.required=true;dur.replaceWith(n);
  } else if(dur){dur.type='number';dur.min='15';dur.max='240';dur.step='1';}
  if(!f.querySelector('[name="detail_intro"]')){
    const box=document.createElement('div');box.className='field full';
    box.innerHTML=`<label>Detailed service description</label><textarea name="detail_intro"></textarea>
    <label style="margin-top:12px">Service points / areas supported</label><textarea name="detail_bullets" placeholder="One item per line"></textarea>
    <label style="margin-top:12px">Call-to-action text</label><input name="cta_text" value="Ask about this service">
    <div class="form-grid" style="margin-top:12px"><div class="field"><label>Display order</label><input name="sort_order" type="number" value="0"></div>
    <div class="field"><label>Visible / bookable</label><select name="active"><option value="1">Active</option><option value="0">Hidden</option></select></div></div>`;
    const summary=f.querySelector('[name="summary"]')?.closest('.field'); summary?summary.insertAdjacentElement('afterend',box):f.appendChild(box);
  }
  let cache=[];
  async function reload(){
    const r=await sb.from('services').select('*').order('sort_order').order('title');
    if(r.error)throw r.error;cache=r.data||[];
    const root=$('#services-list');
    root.innerHTML=cache.map(s=>`<button type="button" class="patient-card" data-cms-service="${s.id}" style="text-align:left"><strong>${esc(s.title)}</strong><div class="muted">${s.duration_minutes} min · ${esc(s.mode)} · ${s.active?'Active':'Hidden'}</div></button>`).join('');
  }
  await reload();
  $('#services-list').onclick=e=>{
    const b=e.target.closest('[data-cms-service]');if(!b)return;
    const s=cache.find(x=>String(x.id)===b.dataset.cmsService);if(!s)return;
    f.id.value=s.id;f.title.value=s.title;f.duration_minutes.value=s.duration_minutes;f.mode.value=s.mode;f.summary.value=s.summary||'';
    f.detail_intro.value=s.detail_intro||'';f.detail_bullets.value=Array.isArray(s.detail_bullets)?s.detail_bullets.join('\n'):'';f.cta_text.value=s.cta_text||'Ask about this service';f.sort_order.value=s.sort_order||0;f.active.value=s.active?'1':'0';
    f.scrollIntoView({behavior:'smooth'});
  };
  f.onsubmit=async e=>{
    e.preventDefault();const d=fo(f);
    const row={title:String(d.title||'').trim(),summary:d.summary||'',duration_minutes:Number(d.duration_minutes||30),mode:d.mode||'both',detail_intro:d.detail_intro||'',detail_bullets:String(d.detail_bullets||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),cta_text:d.cta_text||'Ask about this service',sort_order:Number(d.sort_order||0),active:d.active==='1'};
    try{
      let r;
      if(d.id)r=await sb.from('services').update(row).eq('id',Number(d.id));
      else {row.slug=row.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');r=await sb.from('services').insert(row);}
      if(r.error)throw r.error;
      f.reset();f.duration_minutes.value=30;f.active.value='1';f.sort_order.value=0;f.cta_text.value='Ask about this service';
      await reload();notice('Service saved. Future appointment slots use the saved duration.',true);
    }catch(x){notice(x.message);}
  };
}

async function start(){
  try{
    installCmsPanels();
    await Promise.all([loadCmsSettings(),enhanceServices()]);
    bindCmsForms();
    document.documentElement.dataset.ephCms='v5';
  }catch(e){notice('Admin CMS could not initialize: '+e.message);}
}
start();
})();