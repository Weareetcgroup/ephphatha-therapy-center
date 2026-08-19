(()=>{
const SUPABASE_URL='https://plvjkqmmlkmsxlufotic.supabase.co';
const SUPABASE_KEY='sb_publishable_x-_JzpcD7uAybNZ6-XLRvQ_L6dBb71V';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const msg=(el,text,type='')=>{if(el)el.innerHTML=text?`<div class="notice ${type==='good'?'good':''}">${esc(text)}</div>`:'';};
const formObj=form=>Object.fromEntries(new FormData(form).entries());
const statusBadge=s=>`<span class="badge ${esc(s)}">${esc(String(s).replace('_',' '))}</span>`;
const fmtDate=d=>{try{return new Intl.DateTimeFormat('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'}).format(new Date(d+'T00:00:00'))}catch{return d}};
let profile=null, services=[], therapists=[];

async function getSession(){return (await sb.auth.getSession()).data.session;}
async function getProfile(){
  const {data:{user}}=await sb.auth.getUser(); if(!user)return null;
  const {data,error}=await sb.from('profiles').select('*').eq('id',user.id).single(); if(error)throw error; return data;
}
async function signOut(){await sb.auth.signOut();location.replace('portal.html');}

function showRecovery(){
  const card=$('.auth-card'); if(!card||$('#recovery-box'))return;
  const box=document.createElement('div');box.id='recovery-box';box.className='notice good';
  box.innerHTML='<strong>Choose a new password</strong><div class="field" style="margin-top:10px"><input id="new-password" type="password" minlength="8" placeholder="New password"></div><button id="save-new-password" class="btn btn-primary" style="margin-top:10px">Save new password</button>';
  card.appendChild(box);
  $('#save-new-password').onclick=async()=>{
    const p=$('#new-password').value;if(p.length<8)return msg($('#auth-message'),'Password must be at least 8 characters.');
    const {error}=await sb.auth.updateUser({password:p});if(error)return msg($('#auth-message'),error.message);
    msg($('#auth-message'),'Password changed successfully.','good');history.replaceState({},'',location.pathname);
  };
}

async function init(){
  const authView=$('#auth-view'),portalView=$('#portal-view'),authMessage=$('#auth-message');
  $('#api-notice').innerHTML='<div class="notice good">Secure portal powered by Supabase Auth.</div>';

  const hash=new URLSearchParams(location.hash.replace(/^#/,''));
  if(hash.get('error_description'))msg(authMessage,decodeURIComponent(hash.get('error_description')));
  if(new URLSearchParams(location.search).get('confirmed')==='1')msg(authMessage,'Email confirmed successfully. You can continue to your account.','good');

  $$('[data-auth-tab]').forEach(b=>b.onclick=()=>{
    $$('[data-auth-tab]').forEach(x=>x.classList.toggle('active',x===b));
    $$('.auth-form').forEach(f=>f.classList.toggle('active',f.id.startsWith(b.dataset.authTab)));
  });

  if(!$('#forgot-password')){
    const btn=document.createElement('button');btn.id='forgot-password';btn.type='button';btn.className='btn btn-secondary';btn.style='width:100%;margin-top:10px';btn.textContent='Forgot password?';
    $('#login-form').appendChild(btn);
    btn.onclick=async()=>{
      const email=$('#login-form [name="email"]').value.trim().toLowerCase();
      if(!email)return msg(authMessage,'Enter your email address first.');
      const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/portal?recovery=1`});
      if(error)return msg(authMessage,error.message);msg(authMessage,'Password reset email sent.','good');
    };
  }

  $('#signup-form').onsubmit=async e=>{
    e.preventDefault();msg(authMessage,'');const d=formObj(e.target);
    const {data,error}=await sb.auth.signUp({
      email:String(d.email||'').trim().toLowerCase(),
      password:String(d.password||''),
      options:{
        data:{full_name:String(d.name||'').trim(),phone:String(d.phone||'').trim()},
        emailRedirectTo:`${location.origin}/portal?confirmed=1`
      }
    });
    if(error)return msg(authMessage,error.message);
    if(!data.session){msg(authMessage,'Account created. Check your email and confirm your address, then sign in.','good');e.target.reset();return;}
    location.replace('portal.html');
  };

  $('#login-form').onsubmit=async e=>{
    e.preventDefault();msg(authMessage,'');const d=formObj(e.target);
    const {error}=await sb.auth.signInWithPassword({email:String(d.email||'').trim().toLowerCase(),password:String(d.password||'')});
    if(error)return msg(authMessage,error.message);location.replace('portal.html');
  };

  sb.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')setTimeout(showRecovery,0);});

  const session=await getSession();
  if(new URLSearchParams(location.search).get('recovery')==='1'&&session)showRecovery();
  if(!session)return;

  try{profile=await getProfile();}catch(err){return msg(authMessage,err.message);}
  authView.classList.add('hidden');portalView.classList.remove('hidden');
  $('#portal-user').textContent=`${profile.full_name||profile.email} · ${profile.role}`;
  $('#logout-btn').onclick=signOut;
  if(['admin','super_admin'].includes(profile.role)){const l=$('#staff-link');l.classList.remove('hidden');l.href='admin.html';l.textContent='Admin dashboard';}
  else if(profile.role==='therapist'){const l=$('#staff-link');l.classList.remove('hidden');l.href='therapist.html';l.textContent='Therapist portal';}

  $('#toggle-patient-form').onclick=()=>$('#patient-form-wrap').classList.toggle('hidden');
  $('#patient-form').onsubmit=savePatient;
  $('#refresh-appts').onclick=loadAppointments;
  $('#book-service').onchange=async()=>{await populateTherapists();await loadSlots();};
  $('#book-therapist').onchange=loadSlots;$('#book-date').onchange=loadSlots;$('#booking-form').onsubmit=bookAppointment;
  const today=new Date();today.setMinutes(today.getMinutes()-today.getTimezoneOffset());$('#book-date').min=today.toISOString().slice(0,10);
  await Promise.all([loadPatients(),loadServices(),loadAppointments()]);
}

async function loadPatients(){
  const {data,error}=await sb.from('patients').select('id,full_name,date_of_birth,relationship,notes').eq('active',true).order('full_name');
  if(error)return msg($('#portal-message'),error.message);
  const rows=data||[];
  $('#patients-list').innerHTML=rows.length?rows.map(p=>`<div class="patient-card"><strong>${esc(p.full_name)}</strong><div class="muted">${esc(p.relationship||'Client')}${p.date_of_birth?' · DOB '+esc(p.date_of_birth):''}</div></div>`).join(''):'<div class="empty">Add a child or client profile before booking.</div>';
  $('#book-patient').innerHTML='<option value="">Choose profile</option>'+rows.map(p=>`<option value="${p.id}">${esc(p.full_name)}</option>`).join('');
}
async function savePatient(e){
  e.preventDefault();const d=formObj(e.target),{data:{user}}=await sb.auth.getUser();
  const {error}=await sb.from('patients').insert({owner_user_id:user.id,full_name:String(d.name||'').trim(),date_of_birth:d.date_of_birth||null,relationship:d.relationship||null,notes:d.notes||null});
  if(error)return msg($('#portal-message'),error.message);e.target.reset();$('#patient-form-wrap').classList.add('hidden');await loadPatients();msg($('#portal-message'),'Profile saved.','good');
}
async function loadServices(){
  const {data,error}=await sb.from('services').select('id,title,duration_minutes,mode').eq('active',true).order('sort_order');
  if(error)return msg($('#portal-message'),error.message);services=data||[];
  $('#book-service').innerHTML='<option value="">Choose service</option>'+services.map(s=>`<option value="${s.id}">${esc(s.title)} · ${s.duration_minutes} min</option>`).join('');
}
async function populateTherapists(){
  const sid=Number($('#book-service').value);$('#book-therapist').innerHTML='<option value="">Any available therapist</option>';if(!sid)return;
  const {data,error}=await sb.from('therapist_services').select('therapist_id,therapists(id,full_name,title)').eq('service_id',sid);if(error)return;
  therapists=(data||[]).map(x=>x.therapists).filter(Boolean);
  $('#book-therapist').innerHTML+=therapists.map(t=>`<option value="${t.id}">${esc(t.full_name)}${t.title?' · '+esc(t.title):''}</option>`).join('');
}
async function loadSlots(){
  const sid=Number($('#book-service').value),date=$('#book-date').value,tid=$('#book-therapist').value?Number($('#book-therapist').value):null;
  $('#book-start').value='';const grid=$('#slot-grid');if(!sid||!date){grid.innerHTML='';return;}grid.innerHTML='<span class="spinner"></span>';
  const {data,error}=await sb.rpc('get_available_slots',{p_service_id:sid,p_date:date,p_therapist_id:tid});
  if(error){grid.innerHTML='';return msg($('#portal-message'),error.message);}
  const slots=data||[];$('#slot-help').textContent=slots.length?'Choose one available time.':'No open slots are currently configured for this date.';
  grid.innerHTML=slots.map(s=>`<button type="button" class="slot" data-start="${String(s.start_time).slice(0,5)}" data-therapist="${s.therapist_id}">${esc(String(s.start_time).slice(0,5))}<small>${esc(s.therapist_name)} · ${s.duration_minutes} min</small></button>`).join('');
  $$('.slot',grid).forEach(b=>b.onclick=()=>{$$('.slot',grid).forEach(x=>x.classList.remove('selected'));b.classList.add('selected');$('#book-start').value=b.dataset.start;$('#book-therapist').value=b.dataset.therapist;});
}
async function bookAppointment(e){
  e.preventDefault();const d=formObj(e.target);if(!d.start)return msg($('#portal-message'),'Please choose an available slot.');if(!d.therapist_id)return msg($('#portal-message'),'Choose an available slot.');
  const {error}=await sb.rpc('book_appointment',{p_patient_id:Number(d.patient_id),p_service_id:Number(d.service_id),p_therapist_id:Number(d.therapist_id),p_date:d.date,p_start:d.start,p_mode:d.mode||'clinic',p_notes:d.notes||null});
  if(error)return msg($('#portal-message'),error.message);msg($('#portal-message'),'Appointment requested. Ephphatha can now review and confirm it.','good');$('#book-start').value='';await Promise.all([loadSlots(),loadAppointments()]);
}
async function loadAppointments(){
  const {data,error}=await sb.from('appointments').select('id,appointment_date,start_time,end_time,mode,status,patients(full_name),services(title),therapists(full_name)').order('appointment_date',{ascending:false}).order('start_time',{ascending:false});
  if(error)return msg($('#portal-message'),error.message);const rows=data||[];
  $('#appointments-list').innerHTML=rows.length?rows.map(a=>`<div class="appt-card"><div class="toolbar"><strong>${esc(a.services?.title||'Session')}</strong>${statusBadge(a.status)}<span class="right muted">${fmtDate(a.appointment_date)}</span></div><div style="margin-top:8px">${esc(String(a.start_time).slice(0,5))}–${esc(String(a.end_time).slice(0,5))} · ${esc(a.therapists?.full_name||'Therapist')} · ${esc(a.mode)}</div><div class="muted">For ${esc(a.patients?.full_name||'Client')}</div>${['pending','confirmed'].includes(a.status)?`<div class="toolbar" style="margin-top:10px"><button class="btn btn-danger btn-sm" data-cancel="${a.id}">Cancel appointment</button></div>`:''}</div>`).join(''):'<div class="empty">No appointments yet.</div>';
  $$('[data-cancel]').forEach(b=>b.onclick=async()=>{if(!confirm('Cancel this appointment?'))return;const r=await sb.rpc('cancel_my_appointment',{p_appointment_id:Number(b.dataset.cancel)});if(r.error)return msg($('#portal-message'),r.error.message);loadAppointments();});
}
init().catch(err=>msg($('#auth-message'),err.message));
})();