(()=>{
  const loadScript=(src,id)=>new Promise((resolve,reject)=>{
    if(document.getElementById(id))return resolve();
    const s=document.createElement('script');s.src=src;s.id=id;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Could not load '+src));document.body.appendChild(s);
  });
  const waitFor=(test,timeout=9000)=>new Promise((resolve,reject)=>{
    const start=Date.now();const tick=()=>{if(test())return resolve();if(Date.now()-start>timeout)return reject(new Error('Ephphatha Supabase admin runtime did not initialize.'));setTimeout(tick,40)};tick();
  });
  (async()=>{
    try{
      await loadScript('js/app.js','eph-app-runtime');
      await waitFor(()=>window.ephSupabase);
      if(document.body.dataset.app==='admin'){
        await waitFor(()=>document.documentElement.dataset.ephAdminReady==='1');
        await loadScript('js/admin-cms.js','eph-admin-cms-runtime');
        await loadScript('js/design-studio.js?v=6.0','eph-design-studio-runtime');
      }
    }catch(err){
      const target=document.querySelector('#admin-message')||document.querySelector('#therapist-message');
      if(target)target.innerHTML='<div class="notice">'+String(err.message||err)+'</div>';else console.error(err);
    }
  })();
})();