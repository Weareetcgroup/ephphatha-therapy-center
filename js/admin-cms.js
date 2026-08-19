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
const normalizeEmbedInput=v=>{const s=String(v||'').trim();if(!s)return '';const m=s.match(/<iframe[^>]+src=[\"']([^\"']+)[\"']/i);return (m?m[1]:s).replace(/&amp;/g,'&');};

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
    <div class="page-head" style="margin-bottom:10px"><div><h3>Public website data feed</h3><p>Admin changes publish directly from Supabase; no Cloudflare redeploy is required for normal content changes.</p></div><button type="button" class="btn btn-secondary btn-sm" id="cms-check-feed">Check now</button></div>
    <div id="cms-feed-status" class="notice">Checking public website data feed…</div>
  </div>
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
      <div class="field full"><label>Google Maps embed URL or iframe code (optional)</label><input name="map_embed_url" placeholder="Paste the Google Maps embed URL or full iframe code"><small class="muted">For an exact graphical map: Google Maps → Share → Embed a map → Copy HTML, then paste it here. If blank, the site safely shows the exact-location button instead.</small></div>
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

async function checkPublicFeed(){
  const el=$('#cms-feed-status');if(el)el.textContent='Checking public website data feed…';
  try{
    const {data,error}=await sb.rpc('get_public_site_bundle');if(error)throw error;
    const b=Array.isArray(data)?data[0]:data;
    const settings=b?.settings||{};
    if(!settings.home_content||!settings.center_profile)throw new Error('Bundle is missing required website settings.');
    const when=b?.generated_at?new Date(b.generated_at).toLocaleString('en-IN'):new Date().toLocaleString('en-IN');
    if(el){el.className='notice good';el.textContent='Connected. Admin content is available to the public website. Checked '+when+'.';}
    return true;
  }catch(e){if(el){el.className='notice';el.textContent='Public website data feed error: '+String(e.message||e);}return false;}
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
      map_url:String(d.map_url||'').trim(),map_embed_url:normalizeEmbedInput(d.map_embed_url),
      map_embed_query:String(d.map_embed_query||'').trim(),instagram_url:String(d.instagram_url||'').trim()
    };
    try{await putSetting('center_profile',value);notice('Center details and exact map location saved.',true);}catch(x){notice(x.message);}
  };
  $('#cms-navigation-form').onsubmit=async e=>{
    e.preventDefault();const d=fo(e.target);
    const value={home:d.home,services:d.services,about:d.about,online:d.online,contact:d.contact,book_cta:d.book_cta,portal:d.portal,show_home:d.show_home==='1',show_services:d.show_services==='1',show_about:d.show_about==='1',show_online:d.show_online==='1',show_contact:d.show_contact==='1'};
    try{await putSetting('navigation',value);notice('Navigation saved. It is live immediately on the public website.',true);checkPublicFeed();}catch(x){notice(x.message);}
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
    f.elements.id.value=s.id;f.elements.title.value=s.title;f.elements.duration_minutes.value=s.duration_minutes;f.elements.mode.value=s.mode;f.elements.summary.value=s.summary||'';
    f.elements.detail_intro.value=s.detail_intro||'';f.elements.detail_bullets.value=Array.isArray(s.detail_bullets)?s.detail_bullets.join('\n'):'';f.elements.cta_text.value=s.cta_text||'Ask about this service';f.elements.sort_order.value=s.sort_order||0;f.elements.active.value=s.active?'1':'0';
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
      f.reset();f.elements.duration_minutes.value=30;f.elements.active.value='1';f.elements.sort_order.value=0;f.elements.cta_text.value='Ask about this service';
      await reload();notice('Service saved. Future appointment slots use the saved duration.',true);
    }catch(x){notice(x.message);}
  };
}


function installVisibilityManager(){
  const website=$('[data-view-panel="website"]'); if(!website||$('#cms-visibility-form'))return;
  const old=$('#content-settings-form')?.closest('.panel'); if(old)old.style.display='none';
  const panel=document.createElement('div');panel.className='panel';panel.style.marginBottom='20px';
  panel.innerHTML=`<div class="page-head" style="margin-bottom:16px"><div><h3>Announcement & public sections</h3><p>Control what appears on the public site. Announcement text is required when enabled.</p></div></div>
  <form id="cms-visibility-form" class="form-grid">
    <div class="field full"><label>Announcement message</label><input name="announcement_text" placeholder="Welcome to Ephphatha Therapy Center."></div>
    <div class="field"><label>Show announcement</label><select name="announcement_enabled"><option value="0">No</option><option value="1">Yes</option></select></div>
    <div class="field"><label>Show gallery</label><select name="show_gallery"><option value="1">Yes</option><option value="0">No</option></select></div>
    <div class="field"><label>Show testimonials</label><select name="show_testimonials"><option value="1">Yes</option><option value="0">No</option></select></div>
    <div class="field"><label>Show programs</label><select name="show_programs"><option value="1">Yes</option><option value="0">No</option></select></div>
    <div class="field full"><button class="btn btn-primary">Save announcement & visibility</button></div>
  </form>`;
  const wrap=$('#eph-cms-panels'); if(wrap)wrap.insertBefore(panel,wrap.firstChild); else website.insertBefore(panel,website.firstChild?.nextSibling||null);
}

async function loadVisibilityManager(){
  const f=$('#cms-visibility-form');if(!f)return;
  const s=await getSettings(),ann=s.announcement||{};
  f.announcement_text.value=ann.text||'Welcome to Ephphatha Therapy Center.';
  f.announcement_enabled.value=ann.enabled?'1':'0';
  f.show_gallery.value=s.show_gallery===false?'0':'1';
  f.show_testimonials.value=s.show_testimonials===false?'0':'1';
  f.show_programs.value=s.show_programs===false?'0':'1';
  f.onsubmit=async e=>{
    e.preventDefault();const d=fo(f),enabled=d.announcement_enabled==='1',text=String(d.announcement_text||'').trim();
    if(enabled&&!text)return notice('Enter announcement text before turning the announcement on.');
    try{
      await putSetting('announcement',{enabled,text});
      await putSetting('show_gallery',d.show_gallery==='1');
      await putSetting('show_testimonials',d.show_testimonials==='1');
      await putSetting('show_programs',d.show_programs==='1');
      notice('Announcement and public section visibility saved. They are live immediately.',true);checkPublicFeed();
    }catch(x){notice(x.message);}
  };
}

function installGalleryManager(){
  const nav=$('.side-nav'),app=$('.app-content');if(!nav||!app)return;
  let btn=nav.querySelector('[data-view="gallery"]');
  if(!btn){
    btn=document.createElement('button');btn.dataset.view='gallery';btn.textContent='Gallery & Media';
    const contentBtn=nav.querySelector('[data-view="content"]');nav.insertBefore(btn,contentBtn||nav.querySelector('a'));
  }
  let sec=$('[data-view-panel="gallery"]');
  if(!sec){
    sec=document.createElement('section');sec.className='view';sec.dataset.viewPanel='gallery';
    sec.innerHTML=`<div class="page-head"><div><h2>Gallery & Media</h2><p>Upload center photos and control the public Gallery section.</p></div><button class="btn btn-secondary" id="gallery-refresh">Refresh</button></div>
    <div class="panel" style="margin-bottom:20px"><h3>Gallery section</h3><form id="gallery-settings-form" class="form-grid"><div class="field"><label>Section label</label><input name="kicker" value="Inside Ephphatha"></div><div class="field"><label>Section heading</label><input name="heading" value="Our center & activities."></div><div class="field"><label>Show on website</label><select name="show"><option value="1">Yes</option><option value="0">No</option></select></div><div class="field" style="align-self:end"><button class="btn btn-primary">Save gallery settings</button></div></form></div>
    <div class="grid-2"><div class="panel"><h3>Add / edit gallery image</h3><form id="gallery-item-form" class="form-grid"><input type="hidden" name="id"><input type="hidden" name="existing_image_url"><div class="field full"><label>Image</label><input name="image_file" type="file" accept="image/png,image/jpeg,image/webp,image/gif"><small class="muted">PNG/JPG/WebP/GIF, max 5 MB.</small></div><div class="field full"><label>Or image URL</label><input name="image_url" type="url" placeholder="https://..."></div><div class="field full"><label>Title</label><input name="title" placeholder="Therapy activity / center space"></div><div class="field full"><label>Caption</label><textarea name="body"></textarea></div><div class="field"><label>Display order</label><input name="sort_order" type="number" value="0"></div><div class="field"><label>Visible</label><select name="active"><option value="1">Yes</option><option value="0">No</option></select></div><div class="field full"><button class="btn btn-primary">Save gallery image</button></div></form></div><div class="panel"><h3>Gallery library</h3><div id="gallery-list" class="list"></div></div></div>`;
    app.appendChild(sec);
  }
  btn.onclick=()=>{
    $$('[data-view]').forEach(x=>x.classList.toggle('active',x===btn));
    $$('[data-view-panel]').forEach(x=>x.classList.toggle('active',x===sec));
    if($('#admin-title'))$('#admin-title').textContent='Gallery & Media';
    $('#app-side')?.classList.remove('open');
  };
}

async function initGalleryManager(){
  const form=$('#gallery-item-form'),settings=$('#gallery-settings-form'),list=$('#gallery-list');if(!form||!settings||!list)return;
  async function reload(){
    const [sr,gr]=await Promise.all([getSettings(),sb.from('content_items').select('*').eq('type','gallery').order('sort_order').order('id')]);
    if(gr.error)throw gr.error;
    const gc=sr.gallery_content||{};settings.kicker.value=gc.kicker||'Inside Ephphatha';settings.heading.value=gc.heading||'Our center & activities.';settings.show.value=sr.show_gallery===false?'0':'1';
    const rows=gr.data||[];
    list.innerHTML=rows.length?rows.map(x=>`<div class="patient-card" data-gallery-card="${x.id}">${x.image_url?`<img src="${esc(x.image_url)}" alt="" style="width:100%;max-width:240px;aspect-ratio:4/3;object-fit:cover;border-radius:14px;margin-bottom:10px">`:''}<strong>${esc(x.title||'Untitled image')}</strong><div class="muted">${esc(x.body||'')}</div><small>${x.active?'Visible':'Hidden'} · order ${Number(x.sort_order||0)}</small><div class="toolbar" style="margin-top:10px"><button type="button" class="btn btn-secondary btn-sm" data-gallery-edit="${x.id}">Edit</button><button type="button" class="btn btn-danger btn-sm" data-gallery-delete="${x.id}">Delete</button></div></div>`).join(''):'<div class="empty">No gallery images yet. Upload your first image on the left.</div>';
    list.querySelectorAll('[data-gallery-edit]').forEach(b=>b.onclick=()=>{const x=rows.find(r=>String(r.id)===b.dataset.galleryEdit);if(!x)return;form.elements.id.value=x.id;form.elements.existing_image_url.value=x.image_url||'';form.elements.image_url.value=x.image_url||'';form.elements.title.value=x.title||'';form.elements.body.value=x.body||'';form.elements.sort_order.value=x.sort_order||0;form.elements.active.value=x.active?'1':'0';form.scrollIntoView({behavior:'smooth'});});
    list.querySelectorAll('[data-gallery-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this gallery item?'))return;const x=rows.find(r=>String(r.id)===b.dataset.galleryDelete);const r=await sb.from('content_items').delete().eq('id',Number(b.dataset.galleryDelete));if(r.error)return notice(r.error.message);if(x?.image_url?.includes('/storage/v1/object/public/website-media/')){const p=x.image_url.split('/storage/v1/object/public/website-media/')[1];if(p)await sb.storage.from('website-media').remove([decodeURIComponent(p)]);}await reload();notice('Gallery item deleted.',true);});
  }
  settings.onsubmit=async e=>{e.preventDefault();const d=fo(settings);try{await putSetting('gallery_content',{kicker:String(d.kicker||'').trim()||'Inside Ephphatha',heading:String(d.heading||'').trim()||'Our center & activities.'});await putSetting('show_gallery',d.show==='1');notice('Gallery section settings saved. They are live immediately.',true);checkPublicFeed();}catch(x){notice(x.message);}};
  form.onsubmit=async e=>{
    e.preventDefault();const d=fo(form);let image=String(d.image_url||d.existing_image_url||'').trim();const file=form.elements.image_file.files?.[0];
    try{
      if(file){if(file.size>5*1024*1024)throw new Error('Image must be 5 MB or smaller.');const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');const path=`gallery/${Date.now()}-${safe}`;const up=await sb.storage.from('website-media').upload(path,file,{upsert:false});if(up.error)throw up.error;image=sb.storage.from('website-media').getPublicUrl(path).data.publicUrl;}
      if(!image)throw new Error('Choose an image file or enter an image URL.');
      const row={type:'gallery',title:String(d.title||'').trim(),body:String(d.body||'').trim(),image_url:image,sort_order:Number(d.sort_order||0),active:d.active==='1'};
      let r;if(d.id)r=await sb.from('content_items').update(row).eq('id',Number(d.id));else r=await sb.from('content_items').insert(row);if(r.error)throw r.error;
      form.reset();form.elements.sort_order.value=0;form.elements.active.value='1';form.elements.id.value='';form.elements.existing_image_url.value='';await reload();notice('Gallery image saved. It appears on the public home page immediately when Gallery is enabled.',true);checkPublicFeed();
    }catch(x){notice(x.message);}
  };
  $('#gallery-refresh').onclick=reload;await reload();
}

async function start(){
  try{
    installCmsPanels();
    installVisibilityManager();
    installGalleryManager();
    await Promise.all([loadCmsSettings(),enhanceServices(),loadVisibilityManager(),initGalleryManager(),checkPublicFeed()]);
    bindCmsForms();
    if($('#cms-check-feed'))$('#cms-check-feed').onclick=checkPublicFeed;
    document.documentElement.dataset.ephCms='v5.5';
  }catch(e){notice('Admin CMS could not initialize: '+e.message);}
}
start();
})();