(async()=>{
async function ephLoadSupabase(){
  if(window.supabase?.createClient)return;
  await new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-eph-supabase]');
    if(existing){
      if(window.supabase?.createClient)return resolve();
      existing.addEventListener('load',resolve,{once:true});
      existing.addEventListener('error',()=>reject(new Error('Supabase library could not load.')),{once:true});
      return;
    }
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.async=true;
    s.dataset.ephSupabase='1';
    s.onload=resolve;
    s.onerror=()=>reject(new Error('Supabase library could not load.'));
    document.head.appendChild(s);
  });
}
try{await ephLoadSupabase();document.documentElement.dataset.ephStaffRuntime='supabase-v3-1';console.info('Ephphatha staff runtime: Supabase v3.1');}catch(e){
  const target=document.querySelector('#admin-message')||document.querySelector('#therapist-message');
  if(target)target.innerHTML='<div class="notice">'+String(e.message||e)+'</div>';
  return;
}

const SUPABASE_URL='https://plvjkqmmlkmsxlufotic.supabase.co';
const SUPABASE_KEY='sb_publishable_x-_JzpcD7uAybNZ6-XLRvQ_L6dBb71V';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);window.ephSupabase=sb;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const msg=(el,text,good=false)=>{if(el)el.innerHTML=text?`<div class="notice ${good?'good':''}">${esc(text)}</div>`:'';};
const fo=form=>Object.fromEntries(new FormData(form).entries());
const hh=t=>String(t||'').slice(0,5);
const fmt=d=>{try{return new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric'}).format(new Date(d+'T00:00:00'))}catch{return d}};
let profile=null, services=[], therapists=[];

async function requireRole(roles){
  const target=$('#admin-message')||$('#therapist-message');
  const {data:{session},error:sessionError}=await sb.auth.getSession();
  if(sessionError){msg(target,'Could not read your sign-in session: '+sessionError.message);return null;}
  if(!session){location.replace('portal.html');return null;}
  const {data,error}=await sb.rpc('get_current_profile');
  if(error){msg(target,'Your account is signed in, but the staff profile could not be validated: '+error.message);return null;}
  const p=Array.isArray(data)?data[0]:data;
  if(!p){msg(target,'Your sign-in exists, but no Ephphatha profile is linked to it.');return null;}
  if(!p.active){msg(target,'This Ephphatha account is inactive.');return null;}
  if(!roles.includes(p.role)){msg(target,`Access denied for role: ${p.role}. This page requires ${roles.join(' or ')} access.`);return null;}
  profile=p; return profile;
}
async function logout(){await sb.auth.signOut();location.replace('portal.html');}

function initNav(){
  $$('[data-view]').forEach(b=>b.onclick=()=>show(b.dataset.view));
  $$('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));
  function show(name){
    $$('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===name));
    $$('[data-view-panel]').forEach(x=>x.classList.toggle('active',x.dataset.viewPanel===name));
    const active=$(`[data-view="${name}"]`);
    if($('#admin-title'))$('#admin-title').textContent=active?active.textContent.trim():name;
    $('#app-side')?.classList.remove('open');
  }
}

async function initAdmin(){
  if(!await requireRole(['admin','super_admin']))return;
  initNav();
  $('#admin-name').textContent=profile.full_name||profile.email;
  $('#admin-role').textContent=profile.role;
  $('#admin-avatar').textContent=(profile.full_name||'E')[0].toUpperCase();
  $('#admin-logout').onclick=logout;
  $('#side-toggle').onclick=()=>$('#app-side').classList.toggle('open');

  // Inject Users & Access without requiring an HTML redesign.
  const nav=$('.side-nav');
  if(nav&&!nav.querySelector('[data-view="users"]')){
    const b=document.createElement('button'); b.dataset.view='users'; b.textContent='Users & Access';
    nav.insertBefore(b,nav.querySelector('a'));
    b.onclick=()=>{ $$('[data-view]').forEach(x=>x.classList.toggle('active',x===b)); $$('[data-view-panel]').forEach(x=>x.classList.toggle('active',x.dataset.viewPanel==='users')); $('#admin-title').textContent='Users & Access'; };
    const sec=document.createElement('section'); sec.className='view'; sec.dataset.viewPanel='users';
    sec.innerHTML='<div class="page-head"><div><h2>Users & Access</h2><p>Manage parent, therapist, reception and administrator roles.</p></div><button class="btn btn-secondary" id="refresh-users">Refresh</button></div><div class="panel"><div id="users-list"></div></div>';
    $('.app-content').appendChild(sec);
    $('#refresh-users').onclick=loadUsers;
  }

  // Make service duration fully editable. 30 minutes is the current default,
  // while each service can be changed independently when needed.
  const serviceForm=$('#service-form');
  if(serviceForm){
    const durationField=serviceForm.querySelector('[name="duration_minutes"]');
    if(durationField && durationField.tagName==='SELECT'){
      const input=document.createElement('input');
      input.type='number';
      input.name='duration_minutes';
      input.min='15';
      input.max='240';
      input.step='1';
      input.value='30';
      input.defaultValue='30';
      input.required=true;
      durationField.replaceWith(input);
      const hint=document.createElement('small');
      hint.className='muted';
      hint.textContent='Set the session length for this service. Default is 30 minutes; change it anytime (15–240 minutes). Future slots use the saved duration.';
      input.insertAdjacentElement('afterend',hint);
    }
  }

  // Add editable center/contact/about settings to the existing Website & Theme view.
  const websiteView=$('[data-view-panel="website"]');
  if(websiteView && !$('#center-details-form')){
    const centerPanel=document.createElement('div');
    centerPanel.className='panel';
    centerPanel.style.marginBottom='20px';
    centerPanel.innerHTML=`
      <div class="page-head" style="margin-bottom:16px">
        <div>
          <h3>Center details & website text</h3>
          <p>Change contact details, the exact Google Maps location and key About/Contact text without editing code.</p>
        </div>
      </div>
      <form id="center-details-form" class="form-grid">
        <div class="field"><label>Center name</label><input name="clinic_name" required></div>
        <div class="field"><label>Established year</label><input name="established_year" inputmode="numeric"></div>
        <div class="field full"><label>Tagline</label><input name="tagline"></div>

        <div class="field"><label>Primary phone</label><input name="phone_primary"></div>
        <div class="field"><label>Alternate phone</label><input name="phone_secondary"></div>
        <div class="field"><label>WhatsApp number</label><input name="whatsapp" placeholder="+91 ..."></div>
        <div class="field"><label>Email</label><input name="email" type="email"></div>

        <div class="field full"><label>Displayed center address</label><textarea name="address"></textarea></div>
        <div class="field full"><label>Exact Google Maps link</label><input name="map_url" type="url" placeholder="https://maps.app.goo.gl/..."><small class="muted">The Open directions buttons use this exact link.</small></div>
        <div class="field full"><label>Map embed search</label><input name="map_embed_query" placeholder="Ephphatha Therapy Center"><small class="muted">Used for the map shown on the Contact page.</small></div>
        <div class="field full"><label>Instagram URL</label><input name="instagram_url" type="url"></div>

        <div class="field full"><label>About page main heading</label><input name="about_hero_title"></div>
        <div class="field full"><label>About page introduction</label><textarea name="about_intro"></textarea></div>
        <div class="field"><label>Founder name</label><input name="founder_name"></div>
        <div class="field"><label>Founder title</label><input name="founder_title"></div>
        <div class="field full"><label>About section heading</label><input name="about_section_heading"></div>
        <div class="field full"><label>About section text</label><textarea name="about_section_body"></textarea></div>

        <div class="field full"><label>Contact page heading</label><input name="contact_hero_title"></div>
        <div class="field full"><label>Contact page introduction</label><textarea name="contact_intro"></textarea></div>

        <div class="field full"><button class="btn btn-primary">Save center details</button></div>
      </form>`;
    const firstPanel=websiteView.querySelector('.grid-2');
    if(firstPanel) websiteView.insertBefore(centerPanel, firstPanel);
    else websiteView.appendChild(centerPanel);
  }

  $('#refresh-dashboard').onclick=loadDashboard;
  $('#refresh-admin-appts').onclick=loadAppointments;
  $('#refresh-families').onclick=loadFamilies;
  $('#service-form').onsubmit=saveService;
  $('#therapist-form').onsubmit=saveTherapist;
  $('#availability-therapist').onchange=loadAvailability;
  $('#availability-form').onsubmit=saveAvailability;
  $('#block-form').onsubmit=saveBlock;
  $('#closure-form').onsubmit=saveClosure;
  $('#booking-rules-form').onsubmit=saveBookingRules;
  $('#theme-form').onsubmit=saveTheme;
  $('#content-settings-form').onsubmit=saveDisplay;
  $('#hours-form').onsubmit=saveHours;
  $('#content-item-form').onsubmit=saveContent;
  if($('#center-details-form')) $('#center-details-form').onsubmit=saveCenterDetails;
  $$('.theme-swatch').forEach(b=>b.onclick=()=>{
    const [p,a,i]=b.dataset.theme.split('|'),f=$('#theme-form');
    f.primary_color.value=p; f.accent_color.value=a; f.ink_color.value=i;
  });

  const cf=$('#content-item-form');
  if(cf&&!cf.querySelector('[name="image_file"]')){
    const d=document.createElement('div'); d.className='field full';
    d.innerHTML='<label>Upload image (optional)</label><input name="image_file" type="file" accept="image/png,image/jpeg,image/webp,image/gif"><small class="muted">PNG/JPG/WebP/GIF, max 5 MB.</small>';
    cf.querySelector('button').closest('.field').before(d);
  }

  await Promise.all([
    loadDashboard(),loadAppointments(),loadFamilies(),loadUsers(),
    loadServices(),loadTherapists(),loadSettings(),loadContent(),loadClosures()
  ]);
}

async function getCount(table,builder){
  let q=sb.from(table).select('id',{count:'exact',head:true});
  if(builder)q=builder(q);
  const {count,error}=await q;
  if(error)throw error;
  return count||0;
}

async function loadDashboard(){
  try{
    const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
    const [todayN,upcoming,pending,parents,thr]=await Promise.all([
      getCount('appointments',q=>q.eq('appointment_date',today).neq('status','cancelled')),
      getCount('appointments',q=>q.gte('appointment_date',today).in('status',['pending','confirmed'])),
      getCount('appointments',q=>q.eq('status','pending')),
      getCount('profiles',q=>q.eq('role','parent').eq('active',true)),
      getCount('therapists',q=>q.eq('active',true))
    ]);
    $('#metrics').innerHTML=[['Today',todayN],['Upcoming',upcoming],['Pending',pending],['Families',parents],['Therapists',thr]]
      .map(([k,v])=>`<div class="metric"><span>${k}</span><b>${v}</b></div>`).join('');
  }catch(e){msg($('#admin-message'),e.message);}
}

async function loadAppointments(){
  const {data,error}=await sb.from('appointments')
    .select('id,appointment_date,start_time,end_time,mode,status,owner_user_id,patients(full_name),services(title),therapists(full_name)')
    .order('appointment_date',{ascending:false}).order('start_time',{ascending:false}).limit(300);
  if(error)return msg($('#admin-message'),error.message);
  const ids=[...new Set((data||[]).map(x=>x.owner_user_id))];
  let people={};
  if(ids.length){
    const r=await sb.from('profiles').select('id,full_name,phone,email').in('id',ids);
    people=Object.fromEntries((r.data||[]).map(x=>[x.id,x]));
  }
  $('#admin-appts').innerHTML=(data||[]).length?`<div class="table-wrap"><table><thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Service</th><th>Therapist</th><th>Status</th><th>Action</th></tr></thead><tbody>${
    data.map(a=>`<tr><td>${fmt(a.appointment_date)}</td><td>${hh(a.start_time)}</td><td><strong>${esc(a.patients?.full_name||'')}</strong><br><small>${esc(people[a.owner_user_id]?.full_name||'')} ${esc(people[a.owner_user_id]?.phone||'')}</small></td><td>${esc(a.services?.title||'')}</td><td>${esc(a.therapists?.full_name||'')}</td><td><span class="badge ${esc(a.status)}">${esc(a.status)}</span></td><td><select data-status="${a.id}">${['pending','confirmed','completed','cancelled','no_show'].map(s=>`<option value="${s}" ${s===a.status?'selected':''}>${s.replace('_',' ')}</option>`).join('')}</select></td></tr>`).join('')
  }</tbody></table></div>`:'<div class="empty">No appointments yet.</div>';
  $$('[data-status]').forEach(s=>s.onchange=async()=>{
    const r=await sb.rpc('set_appointment_status',{p_appointment_id:Number(s.dataset.status),p_status:s.value});
    if(r.error)msg($('#admin-message'),r.error.message); else {msg($('#admin-message'),'Appointment updated.',true);loadDashboard();}
  });
}

async function loadFamilies(){
  const {data,error}=await sb.from('patients').select('id,full_name,date_of_birth,relationship,owner_user_id').eq('active',true).order('full_name');
  if(error)return msg($('#admin-message'),error.message);
  const ids=[...new Set((data||[]).map(x=>x.owner_user_id))];
  let people={};
  if(ids.length){
    const r=await sb.from('profiles').select('id,full_name,email,phone').in('id',ids);
    people=Object.fromEntries((r.data||[]).map(x=>[x.id,x]));
  }
  $('#families-list').innerHTML=(data||[]).length?`<div class="table-wrap"><table><thead><tr><th>Client</th><th>Parent / account</th><th>Contact</th><th>Relationship</th></tr></thead><tbody>${
    data.map(x=>`<tr><td><strong>${esc(x.full_name)}</strong>${x.date_of_birth?`<br><small>DOB ${esc(x.date_of_birth)}</small>`:''}</td><td>${esc(people[x.owner_user_id]?.full_name||'')}</td><td>${esc(people[x.owner_user_id]?.phone||'')}<br><small>${esc(people[x.owner_user_id]?.email||'')}</small></td><td>${esc(x.relationship||'')}</td></tr>`).join('')
  }</tbody></table></div>`:'<div class="empty">No family profiles yet.</div>';
}

async function loadUsers(){
  const root=$('#users-list'); if(!root)return;
  const {data,error}=await sb.from('profiles').select('id,email,full_name,phone,role,active,created_at').order('created_at',{ascending:false});
  if(error)return msg($('#admin-message'),error.message);
  root.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Name</th><th>Contact</th><th>Role</th><th>Active</th></tr></thead><tbody>${
    (data||[]).map(u=>`<tr><td><strong>${esc(u.full_name||'')}</strong>${u.id===profile.id?'<br><small>Your account</small>':''}</td><td>${esc(u.email||'')}<br><small>${esc(u.phone||'')}</small></td><td><select data-role="${u.id}" ${u.id===profile.id?'disabled':''}>${['parent','therapist','reception','admin','super_admin'].map(r=>`<option value="${r}" ${r===u.role?'selected':''}>${r.replace('_',' ')}</option>`).join('')}</select></td><td><select data-active="${u.id}" ${u.id===profile.id?'disabled':''}><option value="1" ${u.active?'selected':''}>Yes</option><option value="0" ${!u.active?'selected':''}>No</option></select></td></tr>`).join('')
  }</tbody></table></div>`;
  $$('[data-role]').forEach(sel=>sel.onchange=()=>saveUserAccess(sel.dataset.role,sel.value,$(`[data-active="${sel.dataset.role}"]`).value==='1'));
  $$('[data-active]').forEach(sel=>sel.onchange=()=>saveUserAccess(sel.dataset.active,$(`[data-role="${sel.dataset.active}"]`).value,sel.value==='1'));
}
async function saveUserAccess(id,role,active){
  const r=await sb.rpc('admin_set_user_role',{p_user_id:id,p_role:role,p_active:active});
  if(r.error)msg($('#admin-message'),r.error.message); else msg($('#admin-message'),'User access updated.',true);
}

async function loadServices(){
  const {data,error}=await sb.from('services').select('*').order('sort_order').order('title');
  if(error)return msg($('#admin-message'),error.message);
  services=data||[];
  $('#services-list').innerHTML=services.map(s=>`<button type="button" class="patient-card" data-edit-service="${s.id}" style="text-align:left"><strong>${esc(s.title)}</strong><div class="muted">${s.duration_minutes} min · ${esc(s.mode)} · ${s.active?'Active':'Hidden'}</div></button>`).join('');
  $('#therapist-service-checks').innerHTML=services.map(s=>`<label style="font-weight:600"><input type="checkbox" name="service_ids" value="${s.id}" style="width:auto"> ${esc(s.title)}</label>`).join('');
  $$('[data-edit-service]').forEach(b=>b.onclick=()=>{
    const s=services.find(x=>x.id==b.dataset.editService),f=$('#service-form');
    f.id.value=s.id; f.title.value=s.title; f.duration_minutes.value=s.duration_minutes; f.mode.value=s.mode; f.summary.value=s.summary||'';
    f.scrollIntoView({behavior:'smooth'});
  });
}
async function saveService(e){
  e.preventDefault(); const d=fo(e.target);
  const row={title:d.title.trim(),summary:d.summary||'',duration_minutes:Number(d.duration_minutes),mode:d.mode,active:true};
  let r;
  if(d.id)r=await sb.from('services').update(row).eq('id',Number(d.id));
  else {row.slug=d.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');r=await sb.from('services').insert(row);}
  if(r.error)return msg($('#admin-message'),r.error.message);
  e.target.reset();
  if(e.target.duration_minutes)e.target.duration_minutes.value=30;
  await loadServices();
  msg($('#admin-message'),'Service saved. Future appointment slots will use the saved session duration.',true);
}

async function loadTherapists(){
  const {data,error}=await sb.from('therapists').select('*').order('full_name');
  if(error)return msg($('#admin-message'),error.message);
  therapists=data||[];
  $('#therapists-list').innerHTML=therapists.length?therapists.map(t=>`<button type="button" class="patient-card" data-edit-therapist="${t.id}" style="text-align:left"><strong>${esc(t.full_name)}</strong><div class="muted">${esc(t.title||'Therapist')} · ${t.active?'Active':'Inactive'}</div><small>${esc(t.email||'')}</small></button>`).join(''):'<div class="empty">Add the first therapist to enable bookable slots.</div>';
  $('#availability-therapist').innerHTML='<option value="">Choose therapist</option>'+therapists.filter(t=>t.active).map(t=>`<option value="${t.id}">${esc(t.full_name)}</option>`).join('');
  $$('[data-edit-therapist]').forEach(b=>b.onclick=async()=>{
    const t=therapists.find(x=>x.id==b.dataset.editTherapist),f=$('#therapist-form');
    f.id.value=t.id;f.name.value=t.full_name;f.title.value=t.title||'';f.email.value=t.email||'';f.phone.value=t.phone||'';f.qualifications.value=t.qualifications||'';f.bio.value=t.bio||'';
    $$('input[name="service_ids"]',f).forEach(x=>x.checked=false);
    const r=await sb.from('therapist_services').select('service_id').eq('therapist_id',t.id);
    const set=new Set((r.data||[]).map(x=>String(x.service_id)));
    $$('input[name="service_ids"]',f).forEach(x=>x.checked=set.has(x.value));
    f.scrollIntoView({behavior:'smooth'});
  });
}
async function saveTherapist(e){
  e.preventDefault(); const f=e.target,d=fo(f);
  const row={full_name:d.name.trim(),title:d.title||'',email:(d.email||'').trim().toLowerCase(),phone:d.phone||'',qualifications:d.qualifications||'',bio:d.bio||'',active:true};
  let id,r;
  if(d.id){id=Number(d.id);r=await sb.from('therapists').update(row).eq('id',id);}
  else {r=await sb.from('therapists').insert(row).select('id').single();id=r.data?.id;}
  if(r.error)return msg($('#admin-message'),r.error.message);
  await sb.from('therapist_services').delete().eq('therapist_id',id);
  const sids=$$('input[name="service_ids"]:checked',f).map(x=>Number(x.value));
  if(sids.length){
    const rr=await sb.from('therapist_services').insert(sids.map(service_id=>({therapist_id:id,service_id})));
    if(rr.error)return msg($('#admin-message'),rr.error.message);
  }
  await sb.rpc('admin_link_therapist_account',{p_therapist_id:id});
  f.reset();await loadTherapists();msg($('#admin-message'),'Therapist saved.',true);
}

async function loadAvailability(){
  const id=Number($('#availability-therapist').value);
  if(!id){$('#availability-list').innerHTML='';$('#blocks-list').innerHTML='';return;}
  const [ar,br]=await Promise.all([
    sb.from('availability').select('*').eq('therapist_id',id).order('weekday').order('start_time'),
    sb.from('blocked_times').select('*').eq('therapist_id',id).gte('block_date',new Date().toISOString().slice(0,10)).order('block_date')
  ]);
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  $('#availability-list').innerHTML=(ar.data||[]).map(x=>`<div class="patient-card"><strong>${days[x.weekday]} ${hh(x.start_time)}–${hh(x.end_time)}</strong><button class="btn btn-danger btn-sm right" data-del-avail="${x.id}">Delete</button></div>`).join('')||'<div class="empty">No weekly availability yet.</div>';
  $('#blocks-list').innerHTML=(br.data||[]).map(x=>`<div class="patient-card"><strong>${fmt(x.block_date)}</strong><div class="muted">${esc(x.reason||'Blocked')} · ${x.all_day?'All day':hh(x.start_time)+'–'+hh(x.end_time)}</div><button class="btn btn-danger btn-sm" data-del-block="${x.id}">Delete</button></div>`).join('')||'<div class="empty">No upcoming blocked time.</div>';
  $$('[data-del-avail]').forEach(x=>x.onclick=async()=>{await sb.from('availability').delete().eq('id',Number(x.dataset.delAvail));loadAvailability();});
  $$('[data-del-block]').forEach(x=>x.onclick=async()=>{await sb.from('blocked_times').delete().eq('id',Number(x.dataset.delBlock));loadAvailability();});
}
async function saveAvailability(e){
  e.preventDefault();const id=Number($('#availability-therapist').value);if(!id)return msg($('#admin-message'),'Choose a therapist first.');
  const d=fo(e.target),r=await sb.from('availability').insert({therapist_id:id,weekday:Number(d.weekday),start_time:d.start_time,end_time:d.end_time});
  if(r.error)return msg($('#admin-message'),r.error.message);await loadAvailability();msg($('#admin-message'),'Availability added.',true);
}
async function saveBlock(e){
  e.preventDefault();const id=Number($('#availability-therapist').value);if(!id)return msg($('#admin-message'),'Choose a therapist first.');
  const d=fo(e.target),r=await sb.from('blocked_times').insert({therapist_id:id,block_date:d.date,start_time:d.start_time,end_time:d.end_time,reason:d.reason||'Unavailable',all_day:false});
  if(r.error)return msg($('#admin-message'),r.error.message);e.target.reset();await loadAvailability();msg($('#admin-message'),'Blocked time added.',true);
}

async function loadClosures(){
  const r=await sb.from('center_closures').select('*').gte('closure_date',new Date().toISOString().slice(0,10)).order('closure_date');
  $('#closures-list').innerHTML=(r.data||[]).map(x=>`<div class="patient-card"><strong>${fmt(x.closure_date)}</strong><div class="muted">${esc(x.reason)}</div><button class="btn btn-danger btn-sm" data-del-closure="${x.id}">Delete</button></div>`).join('')||'<div class="empty">No upcoming closures.</div>';
  $$('[data-del-closure]').forEach(x=>x.onclick=async()=>{await sb.from('center_closures').delete().eq('id',Number(x.dataset.delClosure));loadClosures();});
}
async function saveClosure(e){
  e.preventDefault();const d=fo(e.target),r=await sb.from('center_closures').upsert({closure_date:d.date,reason:d.reason||'Center closed'},{onConflict:'closure_date'});
  if(r.error)return msg($('#admin-message'),r.error.message);e.target.reset();loadClosures();msg($('#admin-message'),'Closure saved.',true);
}

async function getSettings(){
  const r=await sb.from('settings').select('key,value'); if(r.error)throw r.error;
  return Object.fromEntries((r.data||[]).map(x=>[x.key,x.value]));
}
async function putSetting(key,value){return sb.from('settings').upsert({key,value},{onConflict:'key'});}
async function loadSettings(){
  try{
    const s=await getSettings(),theme=s.theme||{},f=$('#theme-form');
    f.primary_color.value=theme.primary||'#15484d';f.accent_color.value=theme.accent||'#dd438c';f.ink_color.value=theme.ink||'#17383d';f.card_radius.value=parseInt(theme.radius)||18;f.hero_style.value=theme.hero_style||'split';
    const c=$('#content-settings-form'),ann=s.announcement||{};
    c.announcement_text.value=ann.text||'';c.announcement_enabled.value=ann.enabled?'1':'0';c.show_gallery.value=s.show_gallery===false?'0':'1';c.show_testimonials.value=s.show_testimonials===false?'0':'1';c.show_programs.value=s.show_programs===false?'0':'1';
    const b=$('#booking-rules-form');b.slot_interval_minutes.value=String(s.slot_interval_minutes||15);b.booking_lead_minutes.value=s.booking_lead_minutes||60;b.booking_horizon_days.value=s.booking_horizon_days||60;
    const center=$('#center-details-form');
    if(center){
      const values={
        clinic_name:s.clinic_name||'Ephphatha Therapy Center',
        established_year:s.established_year||'2020',
        tagline:s.tagline||'Every voice. Every milestone. Every possibility.',
        phone_primary:s.phone_primary||'+91 97911 92699',
        phone_secondary:s.phone_secondary||'+91 98401 19895',
        whatsapp:s.whatsapp||s.phone_primary||'+91 97911 92699',
        email:s.email||'ephphathatherapycenter@gmail.com',
        address:s.address||'Vishwas Apartment, B-Block, Soundariya Nagar, Gowrivakkam, Chennai, Tamil Nadu 600073',
        map_url:s.map_url||'https://maps.app.goo.gl/bZVv7D9i8jtyvMfr6',
        map_embed_query:s.map_embed_query||'Ephphatha Therapy Center',
        instagram_url:s.instagram_url||'https://www.instagram.com/ephphathatherapycenter/',
        about_hero_title:s.about_hero_title||'Care that listens before it plans.',
        about_intro:s.about_intro||'',
        founder_name:s.founder_name||'Diana Nixon',
        founder_title:s.founder_title||'Founder & Clinical Lead · Senior SLP & Audiologist',
        about_section_heading:s.about_section_heading||'A multidisciplinary center with communication at its heart.',
        about_section_body:s.about_section_body||'',
        contact_hero_title:s.contact_hero_title||'Start with a conversation.',
        contact_intro:s.contact_intro||''
      };
      for(const [k,v] of Object.entries(values)) if(center.elements[k]) center.elements[k].value=v;
    }
    const newServiceDuration=$('#service-form [name="duration_minutes"]');
    if(newServiceDuration && !$('#service-form [name="id"]').value) newServiceDuration.value=30;
    renderHours(s.business_hours||{});
  }catch(e){msg($('#admin-message'),e.message);}
}
async function saveCenterDetails(e){
  e.preventDefault();
  const d=fo(e.target);
  const keys=[
    'clinic_name','established_year','tagline',
    'phone_primary','phone_secondary','whatsapp','email',
    'address','map_url','map_embed_query','instagram_url',
    'about_hero_title','about_intro','founder_name','founder_title',
    'about_section_heading','about_section_body',
    'contact_hero_title','contact_intro'
  ];
  for(const key of keys){
    const value=String(d[key]||'').trim();
    const r=await putSetting(key,value);
    if(r.error)return msg($('#admin-message'),r.error.message);
  }
  msg($('#admin-message'),'Center details saved. Refresh the public website to see the changes.',true);
}
async function saveBookingRules(e){
  e.preventDefault();const d=fo(e.target);
  for(const [k,v] of Object.entries({slot_interval_minutes:Number(d.slot_interval_minutes),booking_lead_minutes:Number(d.booking_lead_minutes),booking_horizon_days:Number(d.booking_horizon_days)})){
    const r=await putSetting(k,v);if(r.error)return msg($('#admin-message'),r.error.message);
  }
  msg($('#admin-message'),'Booking rules saved.',true);
}
async function saveTheme(e){
  e.preventDefault();const d=fo(e.target),value={primary:d.primary_color,accent:d.accent_color,ink:d.ink_color,radius:`${Number(d.card_radius)}px`,hero_style:d.hero_style};
  const r=await putSetting('theme',value);if(r.error)return msg($('#admin-message'),r.error.message);msg($('#admin-message'),'Theme saved. Refresh the public site to see it.',true);
}
async function saveDisplay(e){
  e.preventDefault();const d=fo(e.target);
  const vals={announcement:{enabled:d.announcement_enabled==='1',text:d.announcement_text||''},show_gallery:d.show_gallery==='1',show_testimonials:d.show_testimonials==='1',show_programs:d.show_programs==='1'};
  for(const [k,v] of Object.entries(vals)){const r=await putSetting(k,v);if(r.error)return msg($('#admin-message'),r.error.message);}
  msg($('#admin-message'),'Display settings saved.',true);
}
function renderHours(hours){
  const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  $('#hours-grid').innerHTML=days.map((name,i)=>{
    const v=hours[String(i)]||[];
    return `<div class="form-grid" style="margin-bottom:8px"><div class="field"><label>${name}</label><select name="open_${i}"><option value="1" ${v.length?'selected':''}>Open</option><option value="0" ${!v.length?'selected':''}>Closed</option></select></div><div class="field"><label>Start</label><input type="time" name="start_${i}" value="${v[0]||'09:30'}"></div><div class="field"><label>End</label><input type="time" name="end_${i}" value="${v[1]||'20:00'}"></div></div>`;
  }).join('');
}
async function saveHours(e){
  e.preventDefault();const d=fo(e.target),hours={};
  for(let i=0;i<7;i++)if(d[`open_${i}`]==='1')hours[String(i)]=[d[`start_${i}`],d[`end_${i}`]];
  const r=await putSetting('business_hours',hours);if(r.error)return msg($('#admin-message'),r.error.message);msg($('#admin-message'),'Clinic hours saved.',true);
}

async function loadContent(){
  const r=await sb.from('content_items').select('*').order('type').order('sort_order');if(r.error)return msg($('#admin-message'),r.error.message);
  $('#content-list').innerHTML=(r.data||[]).map(x=>`<div class="patient-card"><strong>${esc(x.type)} · ${esc(x.title||'(untitled)')}</strong><div class="muted">${esc((x.body||'').slice(0,120))}</div>${x.image_url?`<small>Image attached</small><br>`:''}<button class="btn btn-danger btn-sm" data-del-content="${x.id}">Delete</button></div>`).join('')||'<div class="empty">No content yet.</div>';
  $$('[data-del-content]').forEach(x=>x.onclick=async()=>{await sb.from('content_items').delete().eq('id',Number(x.dataset.delContent));loadContent();});
}
async function saveContent(e){
  e.preventDefault();const d=fo(e.target);let image=d.image_url||null;
  const file=e.target.querySelector('[name="image_file"]')?.files?.[0];
  if(file){
    if(file.size>5*1024*1024)return msg($('#admin-message'),'Image must be 5 MB or smaller.');
    const path=`${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`;
    const up=await sb.storage.from('website-media').upload(path,file,{upsert:false});if(up.error)return msg($('#admin-message'),up.error.message);
    image=sb.storage.from('website-media').getPublicUrl(path).data.publicUrl;
  }
  const r=await sb.from('content_items').insert({type:d.type,title:d.title||'',body:d.body||'',image_url:image,sort_order:Number(d.sort_order||0),active:true});
  if(r.error)return msg($('#admin-message'),r.error.message);e.target.reset();loadContent();msg($('#admin-message'),'Content published.',true);
}

async function initTherapist(){
  if(!await requireRole(['therapist','admin','super_admin']))return;
  $('#therapist-user').textContent=`${profile.full_name||profile.email} · ${profile.role}`;
  $('#therapist-logout').onclick=logout;
  let q=sb.from('therapists').select('*').eq('active',true);
  if(profile.role==='therapist')q=q.eq('user_id',profile.id);
  const r=await q.limit(1).maybeSingle();
  if(r.error||!r.data){msg($('#therapist-message'),'No therapist profile is linked to this account yet. Ask an administrator to save a therapist profile using the same email address.');return;}
  const tid=r.data.id;
  $('#refresh-schedule').onclick=()=>loadTherapistSchedule(tid);
  $('#therapist-availability-form').onsubmit=e=>saveTherapistAvailability(e,tid);
  $('#therapist-block-form').onsubmit=e=>saveTherapistBlock(e,tid);
  await Promise.all([loadTherapistSchedule(tid),loadTherapistAvailability(tid)]);
}
async function loadTherapistSchedule(tid){
  const today=new Date().toISOString().slice(0,10);
  const r=await sb.from('appointments').select('id,appointment_date,start_time,end_time,status,mode,patients(full_name),services(title)').eq('therapist_id',tid).gte('appointment_date',today).in('status',['pending','confirmed']).order('appointment_date').order('start_time');
  if(r.error)return msg($('#therapist-message'),r.error.message);
  $('#therapist-schedule').innerHTML=(r.data||[]).map(a=>`<div class="appt-card"><strong>${fmt(a.appointment_date)} · ${hh(a.start_time)}</strong><div>${esc(a.patients?.full_name||'')} · ${esc(a.services?.title||'')} · ${esc(a.mode)}</div><div class="toolbar" style="margin-top:8px"><span class="badge ${a.status}">${a.status}</span><button class="btn btn-secondary btn-sm" data-appt="${a.id}" data-st="confirmed">Confirm</button><button class="btn btn-secondary btn-sm" data-appt="${a.id}" data-st="completed">Complete</button><button class="btn btn-secondary btn-sm" data-appt="${a.id}" data-st="no_show">No show</button></div></div>`).join('')||'<div class="empty">No upcoming sessions.</div>';
  $$('[data-appt]').forEach(b=>b.onclick=async()=>{const rr=await sb.rpc('set_appointment_status',{p_appointment_id:Number(b.dataset.appt),p_status:b.dataset.st});if(rr.error)msg($('#therapist-message'),rr.error.message);else loadTherapistSchedule(tid);});
}
async function loadTherapistAvailability(tid){
  const [ar,br]=await Promise.all([
    sb.from('availability').select('*').eq('therapist_id',tid).order('weekday').order('start_time'),
    sb.from('blocked_times').select('*').eq('therapist_id',tid).gte('block_date',new Date().toISOString().slice(0,10)).order('block_date')
  ]);
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  $('#therapist-availability-list').innerHTML=(ar.data||[]).map(x=>`<div class="patient-card"><strong>${days[x.weekday]} ${hh(x.start_time)}–${hh(x.end_time)}</strong><button class="btn btn-danger btn-sm right" data-del-ta="${x.id}">Delete</button></div>`).join('')+
    (br.data||[]).map(x=>`<div class="patient-card"><strong>Blocked ${fmt(x.block_date)}</strong><div class="muted">${esc(x.reason||'Unavailable')} · ${hh(x.start_time)}–${hh(x.end_time)}</div><button class="btn btn-danger btn-sm" data-del-tb="${x.id}">Delete</button></div>`).join('');
  $$('[data-del-ta]').forEach(x=>x.onclick=async()=>{await sb.from('availability').delete().eq('id',Number(x.dataset.delTa));loadTherapistAvailability(tid);});
  $$('[data-del-tb]').forEach(x=>x.onclick=async()=>{await sb.from('blocked_times').delete().eq('id',Number(x.dataset.delTb));loadTherapistAvailability(tid);});
}
async function saveTherapistAvailability(e,tid){
  e.preventDefault();const d=fo(e.target),r=await sb.from('availability').insert({therapist_id:tid,weekday:Number(d.weekday),start_time:d.start_time,end_time:d.end_time});
  if(r.error)return msg($('#therapist-message'),r.error.message);loadTherapistAvailability(tid);
}
async function saveTherapistBlock(e,tid){
  e.preventDefault();const d=fo(e.target),r=await sb.from('blocked_times').insert({therapist_id:tid,block_date:d.date,reason:d.reason||'Unavailable',start_time:d.start_time,end_time:d.end_time,all_day:false});
  if(r.error)return msg($('#therapist-message'),r.error.message);e.target.reset();loadTherapistAvailability(tid);
}

async function loadAdminCms(){
  if(document.querySelector('script[data-eph-admin-cms]'))return;
  await new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='js/admin-cms.js?v=5';
    s.async=true;
    s.dataset.ephAdminCms='1';
    s.onload=resolve;
    s.onerror=()=>reject(new Error('Admin CMS module could not load.'));
    document.body.appendChild(s);
  });
}
const app=document.body.dataset.app;
if(app==='admin')initAdmin().then(loadAdminCms).catch(e=>msg($('#admin-message'),e.message));
if(app==='therapist')initTherapist().catch(e=>msg($('#therapist-message'),e.message));

})();
