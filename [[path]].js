const COOKIE = 'eph_session';
const ADMIN_ROLES = new Set(['admin','super_admin']);
const STAFF_ROLES = new Set(['therapist','reception','admin','super_admin']);

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
});

function safeError(message='Something went wrong', status=400){ return json({ok:false,error:message},status); }
function normalizeEmail(v=''){ return String(v).trim().toLowerCase(); }
function getCookie(request,name){
  const raw=request.headers.get('cookie')||'';
  for(const part of raw.split(';')){ const [k,...rest]=part.trim().split('='); if(k===name) return decodeURIComponent(rest.join('=')); }
  return null;
}
function b64url(bytes){ return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function fromB64url(s){ s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='='; return Uint8Array.from(atob(s),c=>c.charCodeAt(0)); }
async function sha256(text){ const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)); return b64url(new Uint8Array(d)); }
async function hashPassword(password,saltB64){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:fromB64url(saltB64),iterations:100000,hash:'SHA-256'},key,256);
  return b64url(new Uint8Array(bits));
}
function timingSafeEqual(a,b){ if(a.length!==b.length)return false; let x=0; for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i); return x===0; }
function randomToken(n=32){ const a=new Uint8Array(n); crypto.getRandomValues(a); return b64url(a); }
function sessionCookie(token,maxAge=604800){ return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`; }
function clearCookie(){ return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`; }
function minutes(t){ const [h,m]=String(t).split(':').map(Number); return h*60+m; }
function hhmm(n){ return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`; }
function validDate(s){ return /^\d{4}-\d{2}-\d{2}$/.test(String(s||'')); }
function indiaDate(){ return new Date(Date.now()+330*60000).toISOString().slice(0,10); }
function originOkay(request){ const o=request.headers.get('origin'); return !o || o===new URL(request.url).origin; }
async function body(request){ try{return await request.json();}catch{return null;} }

async function getUser(env,request){
  if(!env.DB) return null;
  const token=getCookie(request,COOKIE); if(!token)return null;
  const tokenHash=await sha256(token);
  return env.DB.prepare(`SELECT u.id,u.email,u.name,u.phone,u.role,u.active FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1`).bind(tokenHash,new Date().toISOString()).first();
}
function requireUser(user){ if(!user) return safeError('Please sign in first.',401); return null; }
function requireAdmin(user){ if(!user || !ADMIN_ROLES.has(user.role)) return safeError('Administrator access required.',403); return null; }
function requireStaff(user){ if(!user || !STAFF_ROLES.has(user.role)) return safeError('Staff access required.',403); return null; }

async function settingsMap(env){
  const rows=(await env.DB.prepare('SELECT key,value FROM settings').all()).results||[];
  return Object.fromEntries(rows.map(r=>[r.key,r.value]));
}
async function setSetting(env,key,value){
  await env.DB.prepare(`INSERT INTO settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP`).bind(key,String(value)).run();
}

async function calculateSlots(env,{serviceId,date,therapistId=null}){
  if(!validDate(date)) return [];
  const today=indiaDate(); if(date<today)return [];
  const service=await env.DB.prepare('SELECT id,duration_minutes,mode FROM services WHERE id=? AND active=1').bind(serviceId).first();
  if(!service)return [];
  const closed=await env.DB.prepare('SELECT id,reason FROM center_closures WHERE date=?').bind(date).first();
  if(closed)return [];
  const wd=new Date(`${date}T00:00:00Z`).getUTCDay();
  const settings=await settingsMap(env);
  const horizon=Math.max(1,Math.min(365,Number(settings.booking_horizon_days||60)));
  const maxDate=new Date(Date.now()+(330*60000)+(horizon*86400000)).toISOString().slice(0,10); if(date>maxDate)return [];
  let centerHours={};try{centerHours=JSON.parse(settings.business_hours||'{}')}catch{}; const centerWindow=centerHours[String(wd)]??centerHours[wd]; if(!centerWindow)return [];
  let sql=`SELECT DISTINCT t.id,t.name FROM therapists t JOIN therapist_services ts ON ts.therapist_id=t.id WHERE t.active=1 AND ts.service_id=?`;
  const args=[serviceId];
  if(therapistId){ sql+=' AND t.id=?'; args.push(therapistId); }
  const therapists=(await env.DB.prepare(sql).bind(...args).all()).results||[];
  const interval=Math.max(5,Math.min(60,Number(settings.slot_interval_minutes||15)));
  const lead=Math.max(0,Math.min(1440,Number(settings.booking_lead_minutes||60)));
  const indiaNow=new Date(Date.now()+330*60000); const nowMinutes=indiaNow.getUTCHours()*60+indiaNow.getUTCMinutes();
  const out=[];
  for(const t of therapists){
    const windows=(await env.DB.prepare('SELECT start_time,end_time FROM availability WHERE therapist_id=? AND weekday=? AND active=1 ORDER BY start_time').bind(t.id,wd).all()).results||[];
    if(!windows.length)continue;
    const blocks=(await env.DB.prepare('SELECT start_time,end_time FROM blocked_times WHERE therapist_id=? AND date=?').bind(t.id,date).all()).results||[];
    const appts=(await env.DB.prepare(`SELECT start_time,end_time FROM appointments WHERE therapist_id=? AND appointment_date=? AND status IN ('pending','confirmed')`).bind(t.id,date).all()).results||[];
    const occupied=[...blocks,...appts].map(x=>[minutes(x.start_time),minutes(x.end_time)]);
    for(const w of windows){
      const ws=Math.max(minutes(w.start_time),minutes(centerWindow[0])), we=Math.min(minutes(w.end_time),minutes(centerWindow[1])), dur=Number(service.duration_minutes||45); if(ws>=we)continue;
      for(let s=ws;s+dur<=we;s+=interval){
        const e=s+dur;
        if(date===today && s<nowMinutes+lead)continue;
        if(occupied.some(([a,b])=>s<b && e>a))continue;
        out.push({start:hhmm(s),end:hhmm(e),therapist_id:t.id,therapist_name:t.name,duration_minutes:dur});
      }
    }
  }
  const unique=Array.from(new Map(out.map(x=>[`${x.therapist_id}-${x.start}`,x])).values());
  return unique.sort((a,b)=>a.start.localeCompare(b.start)||a.therapist_name.localeCompare(b.therapist_name));
}

async function route(context){
  const {request,env}=context;
  if(!env.DB) return safeError('Ephphatha V2 database is not connected yet. Add a Cloudflare D1 binding named DB and run schema.sql.',503);
  const method=request.method.toUpperCase();
  const path=Array.isArray(context.params.path)?context.params.path:(context.params.path?[context.params.path]:[]);
  const p=path.join('/');
  const user=await getUser(env,request);

  if(method!=='GET' && method!=='HEAD' && !originOkay(request)) return safeError('Invalid request origin.',403);

  // Health & public data
  if(method==='GET' && (p===''||p==='health')) return json({ok:true,service:'Ephphatha Therapy Center API',database:true,time:new Date().toISOString()});
  if(method==='GET' && p==='public/settings'){
    const s=await settingsMap(env);
    const keys=['clinic_name','phone_primary','phone_secondary','email','address','primary_color','accent_color','ink_color','card_radius','hero_style','announcement_enabled','announcement_text','business_hours','show_gallery','show_testimonials','show_programs'];
    return json({ok:true,settings:Object.fromEntries(keys.map(k=>[k,s[k]??'']))});
  }
  if(method==='GET' && p==='public/services'){
    const rows=(await env.DB.prepare('SELECT id,slug,title,summary,duration_minutes,mode FROM services WHERE active=1 ORDER BY sort_order,title').all()).results||[];
    return json({ok:true,services:rows});
  }
  if(method==='GET' && p==='public/therapists'){
    const url=new URL(request.url), sid=url.searchParams.get('service_id');
    let rows;
    if(sid){ rows=(await env.DB.prepare(`SELECT DISTINCT t.id,t.name,t.title,t.qualifications,t.bio,t.photo_url FROM therapists t JOIN therapist_services ts ON ts.therapist_id=t.id WHERE t.active=1 AND ts.service_id=? ORDER BY t.name`).bind(sid).all()).results||[]; }
    else { rows=(await env.DB.prepare('SELECT id,name,title,qualifications,bio,photo_url FROM therapists WHERE active=1 ORDER BY name').all()).results||[]; }
    return json({ok:true,therapists:rows});
  }
  if(method==='GET' && p==='public/content'){
    const type=new URL(request.url).searchParams.get('type');
    const allowed=new Set(['announcement','testimonial','gallery','faq','program']);
    if(type && !allowed.has(type))return safeError('Invalid content type.');
    const rows=type?(await env.DB.prepare('SELECT id,type,title,body,image_url,meta_json,sort_order FROM content_items WHERE active=1 AND type=? ORDER BY sort_order,id DESC').bind(type).all()).results||[]:(await env.DB.prepare('SELECT id,type,title,body,image_url,meta_json,sort_order FROM content_items WHERE active=1 ORDER BY type,sort_order,id DESC').all()).results||[];
    return json({ok:true,items:rows});
  }
  if(method==='GET' && p==='public/slots'){
    const u=new URL(request.url); const serviceId=Number(u.searchParams.get('service_id')); const date=u.searchParams.get('date'); const therapistId=u.searchParams.get('therapist_id')?Number(u.searchParams.get('therapist_id')):null;
    if(!serviceId||!validDate(date))return safeError('Choose a service and valid date.');
    return json({ok:true,slots:await calculateSlots(env,{serviceId,date,therapistId})});
  }

  // Authentication
  if(method==='POST' && p==='auth/signup'){
    const d=await body(request); if(!d)return safeError('Invalid form data.');
    const email=normalizeEmail(d.email), name=String(d.name||'').trim(), password=String(d.password||'');
    if(!email.includes('@')||name.length<2||password.length<8)return safeError('Enter a valid name/email and a password of at least 8 characters.');
    const existing=await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first(); if(existing)return safeError('An account already exists for this email.',409);
    const adminEmails=String(env.ADMIN_EMAILS||'ephphathatherapycenter@gmail.com').split(',').map(normalizeEmail);
    let role=adminEmails.includes(email)?'super_admin':'parent';
    const therapist=await env.DB.prepare('SELECT id FROM therapists WHERE lower(email)=? AND active=1').bind(email).first(); if(therapist && role==='parent')role='therapist';
    const salt=b64url(crypto.getRandomValues(new Uint8Array(16))); const passwordHash=await hashPassword(password,salt);
    const r=await env.DB.prepare('INSERT INTO users(email,password_hash,password_salt,name,phone,role) VALUES(?,?,?,?,?,?)').bind(email,passwordHash,salt,name,String(d.phone||''),role).run();
    const uid=r.meta.last_row_id;
    if(role==='therapist' && therapist) await env.DB.prepare('UPDATE therapists SET user_id=? WHERE id=?').bind(uid,therapist.id).run();
    const token=randomToken(); await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(await sha256(token),uid,new Date(Date.now()+604800000).toISOString()).run();
    return json({ok:true,user:{id:uid,email,name,role}},201,{'set-cookie':sessionCookie(token)});
  }
  if(method==='POST' && p==='auth/login'){
    const d=await body(request); if(!d)return safeError('Invalid form data.');
    const email=normalizeEmail(d.email), password=String(d.password||'');
    const u=await env.DB.prepare('SELECT id,email,name,phone,role,active,password_hash,password_salt FROM users WHERE email=?').bind(email).first();
    if(!u||!u.active)return safeError('Incorrect email or password.',401);
    const candidate=await hashPassword(password,u.password_salt); if(!timingSafeEqual(candidate,u.password_hash))return safeError('Incorrect email or password.',401);
    await env.DB.prepare('DELETE FROM sessions WHERE expires_at<=?').bind(new Date().toISOString()).run();
    const token=randomToken(); await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(await sha256(token),u.id,new Date(Date.now()+604800000).toISOString()).run();
    return json({ok:true,user:{id:u.id,email:u.email,name:u.name,phone:u.phone,role:u.role}},200,{'set-cookie':sessionCookie(token)});
  }
  if(method==='POST' && p==='auth/logout'){
    const token=getCookie(request,COOKIE); if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(token)).run();
    return json({ok:true},200,{'set-cookie':clearCookie()});
  }
  if(method==='GET' && p==='auth/me') return user?json({ok:true,user}):safeError('Not signed in.',401);

  // Parent/patient area
  if(p==='patients'){
    const deny=requireUser(user); if(deny)return deny;
    if(method==='GET'){
      const rows=(await env.DB.prepare('SELECT id,name,date_of_birth,age_text,relationship,notes,active FROM patients WHERE user_id=? AND active=1 ORDER BY name').bind(user.id).all()).results||[];
      return json({ok:true,patients:rows});
    }
    if(method==='POST'){
      const d=await body(request); const name=String(d?.name||'').trim(); if(name.length<2)return safeError('Patient name is required.');
      const r=await env.DB.prepare('INSERT INTO patients(user_id,name,date_of_birth,age_text,relationship,notes) VALUES(?,?,?,?,?,?)').bind(user.id,name,d.date_of_birth||null,d.age_text||null,d.relationship||null,d.notes||null).run();
      return json({ok:true,id:r.meta.last_row_id},201);
    }
  }

  if(p==='appointments'){
    const deny=requireUser(user); if(deny)return deny;
    if(method==='GET'){
      let q=`SELECT a.id,a.appointment_date,a.start_time,a.end_time,a.mode,a.status,a.notes,p.name patient_name,s.title service_title,t.name therapist_name FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN services s ON s.id=a.service_id JOIN therapists t ON t.id=a.therapist_id`;
      let rows;
      if(ADMIN_ROLES.has(user.role)||user.role==='reception') rows=(await env.DB.prepare(q+' ORDER BY a.appointment_date DESC,a.start_time DESC').all()).results||[];
      else if(user.role==='therapist'){
        const tp=await env.DB.prepare('SELECT id FROM therapists WHERE user_id=?').bind(user.id).first(); rows=tp?(await env.DB.prepare(q+' WHERE a.therapist_id=? ORDER BY a.appointment_date DESC,a.start_time DESC').bind(tp.id).all()).results||[]:[];
      } else rows=(await env.DB.prepare(q+' WHERE a.user_id=? ORDER BY a.appointment_date DESC,a.start_time DESC').bind(user.id).all()).results||[];
      return json({ok:true,appointments:rows});
    }
    if(method==='POST'){
      const d=await body(request); const patientId=Number(d?.patient_id),serviceId=Number(d?.service_id),therapistId=Number(d?.therapist_id),date=d?.date,start=d?.start;
      if(!patientId||!serviceId||!therapistId||!validDate(date)||!/^\d{2}:\d{2}$/.test(String(start||'')))return safeError('Complete all booking fields.');
      if(!ADMIN_ROLES.has(user.role)&&user.role!=='reception'){
        const own=await env.DB.prepare('SELECT id FROM patients WHERE id=? AND user_id=? AND active=1').bind(patientId,user.id).first(); if(!own)return safeError('Patient profile not found.',403);
      }
      const svc=await env.DB.prepare('SELECT mode FROM services WHERE id=? AND active=1').bind(serviceId).first(); if(!svc)return safeError('Service not found.',404); const requestedMode=d.mode==='online'?'online':'clinic'; if((svc.mode==='clinic'&&requestedMode==='online')||(svc.mode==='online'&&requestedMode==='clinic'))return safeError('That service is not offered in the selected mode.');
      const slots=await calculateSlots(env,{serviceId,date,therapistId}); const slot=slots.find(x=>x.start===start&&x.therapist_id===therapistId); if(!slot)return safeError('That slot is no longer available.',409);
      const owner=ADMIN_ROLES.has(user.role)||user.role==='reception' ? (await env.DB.prepare('SELECT user_id FROM patients WHERE id=?').bind(patientId).first())?.user_id : user.id;
      let r; try{r=await env.DB.prepare(`INSERT INTO appointments(user_id,patient_id,service_id,therapist_id,appointment_date,start_time,end_time,mode,status,notes) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(owner,patientId,serviceId,therapistId,date,slot.start,slot.end,requestedMode,'pending',d.notes||null).run();}catch{return safeError('That slot was just booked by someone else. Please choose another time.',409);}
      return json({ok:true,id:r.meta.last_row_id,status:'pending'},201);
    }
  }

  if(method==='POST' && /^appointments\/\d+\/cancel$/.test(p)){
    const deny=requireUser(user); if(deny)return deny; const id=Number(p.split('/')[1]);
    const a=await env.DB.prepare('SELECT user_id FROM appointments WHERE id=?').bind(id).first(); if(!a)return safeError('Appointment not found.',404);
    if(a.user_id!==user.id&&!STAFF_ROLES.has(user.role))return safeError('Not allowed.',403);
    await env.DB.prepare(`UPDATE appointments SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('pending','confirmed')`).bind(id).run(); return json({ok:true});
  }

  if(method==='POST' && /^appointments\/\d+\/reschedule$/.test(p)){
    const deny=requireUser(user); if(deny)return deny; const id=Number(p.split('/')[1]); const d=await body(request);
    const a=await env.DB.prepare('SELECT * FROM appointments WHERE id=?').bind(id).first(); if(!a)return safeError('Appointment not found.',404);
    if(a.user_id!==user.id&&!STAFF_ROLES.has(user.role))return safeError('Not allowed.',403);
    const slots=await calculateSlots(env,{serviceId:a.service_id,date:d?.date,therapistId:a.therapist_id}); const slot=slots.find(x=>x.start===d?.start); if(!slot)return safeError('That new slot is not available.',409);
    await env.DB.prepare(`UPDATE appointments SET appointment_date=?,start_time=?,end_time=?,status='pending',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(d.date,slot.start,slot.end,id).run(); return json({ok:true});
  }

  // Therapist area
  if(p==='therapist/availability'){
    const deny=requireStaff(user); if(deny)return deny;
    let therapistId;
    if(user.role==='therapist') therapistId=(await env.DB.prepare('SELECT id FROM therapists WHERE user_id=?').bind(user.id).first())?.id;
    else therapistId=Number(new URL(request.url).searchParams.get('therapist_id'));
    if(!therapistId)return safeError('Therapist profile is not linked.',404);
    if(method==='GET'){
      const rows=(await env.DB.prepare('SELECT id,weekday,start_time,end_time,active FROM availability WHERE therapist_id=? ORDER BY weekday,start_time').bind(therapistId).all()).results||[];
      const blocks=(await env.DB.prepare(`SELECT id,date,start_time,end_time,reason FROM blocked_times WHERE therapist_id=? AND date>=? ORDER BY date,start_time`).bind(therapistId,indiaDate()).all()).results||[];
      return json({ok:true,availability:rows,blocks});
    }
    if(method==='POST'){
      const d=await body(request);
      if(d?.action==='block'){
        if(!validDate(d.date))return safeError('Valid date required.');
        const r=await env.DB.prepare('INSERT INTO blocked_times(therapist_id,date,start_time,end_time,reason) VALUES(?,?,?,?,?)').bind(therapistId,d.date,d.start_time,d.end_time,d.reason||'Unavailable').run(); return json({ok:true,id:r.meta.last_row_id},201);
      }
      const weekday=Number(d?.weekday); if(weekday<0||weekday>6||!d.start_time||!d.end_time)return safeError('Choose weekday and times.');
      const r=await env.DB.prepare('INSERT INTO availability(therapist_id,weekday,start_time,end_time) VALUES(?,?,?,?)').bind(therapistId,weekday,d.start_time,d.end_time).run(); return json({ok:true,id:r.meta.last_row_id},201);
    }
  }

  if(method==='GET' && p==='therapist/schedule'){
    const deny=requireStaff(user); if(deny)return deny;
    let therapistId=user.role==='therapist'?(await env.DB.prepare('SELECT id FROM therapists WHERE user_id=?').bind(user.id).first())?.id:Number(new URL(request.url).searchParams.get('therapist_id'));
    if(!therapistId)return safeError('Therapist profile is not linked.',404);
    const rows=(await env.DB.prepare(`SELECT a.id,a.appointment_date,a.start_time,a.end_time,a.mode,a.status,p.name patient_name,s.title service_title FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN services s ON s.id=a.service_id WHERE a.therapist_id=? AND a.appointment_date>=? AND a.status!='cancelled' ORDER BY a.appointment_date,a.start_time`).bind(therapistId,indiaDate()).all()).results||[];
    return json({ok:true,appointments:rows});
  }

  if(method==='POST' && p==='therapist/appointment-status'){
    const deny=requireStaff(user); if(deny)return deny; const d=await body(request); const allowed=new Set(['confirmed','completed','no_show']); if(!allowed.has(d?.status))return safeError('Invalid therapist status.');
    if(user.role==='therapist'){
      const tp=await env.DB.prepare('SELECT id FROM therapists WHERE user_id=?').bind(user.id).first(); if(!tp)return safeError('Therapist profile is not linked.',404);
      const own=await env.DB.prepare('SELECT id FROM appointments WHERE id=? AND therapist_id=?').bind(Number(d.id),tp.id).first(); if(!own)return safeError('Appointment not found.',404);
    }
    await env.DB.prepare('UPDATE appointments SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(d.status,Number(d.id)).run(); return json({ok:true});
  }

  // Admin dashboard and management
  if(method==='GET' && p==='admin/dashboard'){
    const deny=requireAdmin(user); if(deny)return deny;
    const [today,upcoming,parents,therapists,pending]=await Promise.all([
      env.DB.prepare(`SELECT count(*) c FROM appointments WHERE appointment_date=? AND status!='cancelled'`).bind(indiaDate()).first(),
      env.DB.prepare(`SELECT count(*) c FROM appointments WHERE appointment_date>=? AND status IN ('pending','confirmed')`).bind(indiaDate()).first(),
      env.DB.prepare(`SELECT count(*) c FROM users WHERE role='parent' AND active=1`).first(),
      env.DB.prepare(`SELECT count(*) c FROM therapists WHERE active=1`).first(),
      env.DB.prepare(`SELECT count(*) c FROM appointments WHERE status='pending'`).first()
    ]);
    return json({ok:true,stats:{today:today.c,upcoming:upcoming.c,parents:parents.c,therapists:therapists.c,pending:pending.c}});
  }

  if(method==='GET' && p==='admin/families'){
    const deny=requireAdmin(user); if(deny)return deny;
    const rows=(await env.DB.prepare(`SELECT p.id,p.name patient_name,p.date_of_birth,p.relationship,p.notes,u.id user_id,u.name parent_name,u.email parent_email,u.phone parent_phone,(SELECT count(*) FROM appointments a WHERE a.patient_id=p.id) appointment_count FROM patients p JOIN users u ON u.id=p.user_id WHERE p.active=1 ORDER BY p.name`).all()).results||[];
    return json({ok:true,families:rows});
  }

  if(p==='admin/services'){
    const deny=requireAdmin(user); if(deny)return deny;
    if(method==='GET')return json({ok:true,services:(await env.DB.prepare('SELECT * FROM services ORDER BY sort_order,title').all()).results||[]});
    if(method==='POST'){
      const d=await body(request); if(!d?.title)return safeError('Service title is required.');
      if(d.id){ await env.DB.prepare('UPDATE services SET title=?,summary=?,duration_minutes=?,mode=?,active=?,sort_order=? WHERE id=?').bind(d.title,d.summary||'',Number(d.duration_minutes||45),['clinic','online','both'].includes(d.mode)?d.mode:'both',d.active===false?0:1,Number(d.sort_order||0),Number(d.id)).run(); return json({ok:true}); }
      const slug=String(d.slug||d.title).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      const r=await env.DB.prepare('INSERT INTO services(slug,title,summary,duration_minutes,mode,active,sort_order) VALUES(?,?,?,?,?,?,?)').bind(slug,d.title,d.summary||'',Number(d.duration_minutes||45),['clinic','online','both'].includes(d.mode)?d.mode:'both',1,Number(d.sort_order||0)).run(); return json({ok:true,id:r.meta.last_row_id},201);
    }
  }

  if(p==='admin/therapists'){
    const deny=requireAdmin(user); if(deny)return deny;
    if(method==='GET'){
      const rows=(await env.DB.prepare(`SELECT t.*,group_concat(ts.service_id) service_ids FROM therapists t LEFT JOIN therapist_services ts ON ts.therapist_id=t.id GROUP BY t.id ORDER BY t.name`).all()).results||[]; return json({ok:true,therapists:rows});
    }
    if(method==='POST'){
      const d=await body(request); if(!d?.name)return safeError('Therapist name is required.');
      let id=Number(d.id||0);
      if(id) await env.DB.prepare('UPDATE therapists SET name=?,title=?,qualifications=?,bio=?,email=?,phone=?,photo_url=?,active=? WHERE id=?').bind(d.name,d.title||'',d.qualifications||'',d.bio||'',normalizeEmail(d.email||''),d.phone||'',d.photo_url||'',d.active===false?0:1,id).run();
      else { const r=await env.DB.prepare('INSERT INTO therapists(name,title,qualifications,bio,email,phone,photo_url) VALUES(?,?,?,?,?,?,?)').bind(d.name,d.title||'',d.qualifications||'',d.bio||'',normalizeEmail(d.email||''),d.phone||'',d.photo_url||'').run(); id=r.meta.last_row_id; }
      if(Array.isArray(d.service_ids)){ await env.DB.prepare('DELETE FROM therapist_services WHERE therapist_id=?').bind(id).run(); for(const sid of d.service_ids){ await env.DB.prepare('INSERT OR IGNORE INTO therapist_services(therapist_id,service_id) VALUES(?,?)').bind(id,Number(sid)).run(); } }
      return json({ok:true,id});
    }
  }

  if(p==='admin/closures'){
    const deny=requireAdmin(user); if(deny)return deny;
    if(method==='GET'){
      const rows=(await env.DB.prepare('SELECT id,date,reason FROM center_closures WHERE date>=? ORDER BY date').bind(indiaDate()).all()).results||[]; return json({ok:true,closures:rows});
    }
    if(method==='POST'){
      const d=await body(request); if(d?.action==='delete'){await env.DB.prepare('DELETE FROM center_closures WHERE id=?').bind(Number(d.id)).run();return json({ok:true});}
      if(!validDate(d?.date))return safeError('Choose a valid closure date.');
      await env.DB.prepare(`INSERT INTO center_closures(date,reason) VALUES(?,?) ON CONFLICT(date) DO UPDATE SET reason=excluded.reason`).bind(d.date,d.reason||'Center closed').run(); return json({ok:true});
    }
  }

  if(p==='admin/settings'){
    const deny=requireAdmin(user); if(deny)return deny;
    if(method==='GET')return json({ok:true,settings:await settingsMap(env)});
    if(method==='POST'){
      const d=await body(request); if(!d||typeof d.settings!=='object')return safeError('Settings object required.');
      const allowed=new Set(['clinic_name','phone_primary','phone_secondary','email','address','primary_color','accent_color','ink_color','card_radius','hero_style','announcement_enabled','announcement_text','slot_interval_minutes','booking_lead_minutes','booking_horizon_days','business_hours','show_gallery','show_testimonials','show_programs']);
      for(const [k,v] of Object.entries(d.settings)){ if(allowed.has(k))await setSetting(env,k,typeof v==='string'?v:JSON.stringify(v)); }
      return json({ok:true});
    }
  }

  if(p==='admin/appointments'){
    const deny=requireAdmin(user); if(deny)return deny;
    if(method==='GET'){
      const rows=(await env.DB.prepare(`SELECT a.id,a.appointment_date,a.start_time,a.end_time,a.mode,a.status,a.notes,p.name patient_name,u.name parent_name,u.phone parent_phone,s.title service_title,t.name therapist_name FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN users u ON u.id=a.user_id JOIN services s ON s.id=a.service_id JOIN therapists t ON t.id=a.therapist_id ORDER BY a.appointment_date DESC,a.start_time DESC LIMIT 300`).all()).results||[]; return json({ok:true,appointments:rows});
    }
    if(method==='POST'){
      const d=await body(request); const allowed=new Set(['pending','confirmed','completed','cancelled','no_show']); if(!allowed.has(d?.status))return safeError('Invalid status.');
      await env.DB.prepare('UPDATE appointments SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(d.status,Number(d.id)).run(); return json({ok:true});
    }
  }

  if(p==='admin/content'){
    const deny=requireAdmin(user); if(deny)return deny;
    if(method==='GET'){
      const type=new URL(request.url).searchParams.get('type'); const rows=type?(await env.DB.prepare('SELECT * FROM content_items WHERE type=? ORDER BY sort_order,id DESC').bind(type).all()).results||[]:(await env.DB.prepare('SELECT * FROM content_items ORDER BY type,sort_order,id DESC').all()).results||[]; return json({ok:true,items:rows});
    }
    if(method==='POST'){
      const d=await body(request); const types=new Set(['announcement','testimonial','gallery','faq','program']); if(!types.has(d?.type))return safeError('Invalid content type.');
      if(d.id){await env.DB.prepare('UPDATE content_items SET title=?,body=?,image_url=?,meta_json=?,active=?,sort_order=? WHERE id=?').bind(d.title||'',d.body||'',d.image_url||'',d.meta_json||'',d.active===false?0:1,Number(d.sort_order||0),Number(d.id)).run();return json({ok:true});}
      const r=await env.DB.prepare('INSERT INTO content_items(type,title,body,image_url,meta_json,active,sort_order) VALUES(?,?,?,?,?,?,?)').bind(d.type,d.title||'',d.body||'',d.image_url||'',d.meta_json||'',1,Number(d.sort_order||0)).run(); return json({ok:true,id:r.meta.last_row_id},201);
    }
  }

  return safeError('API route not found.',404);
}

export async function onRequest(context){
  try{return await route(context);}catch(err){console.error(err);return safeError('The server could not complete this request.',500);}
}
