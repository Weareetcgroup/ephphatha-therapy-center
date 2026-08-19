(()=>{
const sb=window.ephSupabase;if(!sb)return;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const presets={
 playful_pastel:{name:'Playful Pastel',desc:'Warm, colorful and polished for children, families and adults.',colors:['#3fb8b0','#f15f9a','#ffc857','#8f82d5'],theme:{primary:'#3fb8b0',accent:'#f15f9a',ink:'#173c42',radius:'28px',hero_style:'split'}},
 aqua_wellness:{name:'Aqua Wellness',desc:'Calm, clinical and reassuring with soft healthcare tones.',colors:['#2f9e9a','#df6c9f','#7dd7dc','#a8dfd1'],theme:{primary:'#2f9e9a',accent:'#df6c9f',ink:'#183f43',radius:'26px',hero_style:'split'}},
 soft_lavender:{name:'Soft Lavender',desc:'Sensory-friendly, peaceful and softly expressive.',colors:['#7d72c8','#d66e9d','#f1c56f','#a9ddd0'],theme:{primary:'#7d72c8',accent:'#d66e9d',ink:'#332f50',radius:'30px',hero_style:'soft'}},
 sunshine_bloom:{name:'Sunshine Bloom',desc:'Bright, optimistic and energetic without looking childish.',colors:['#2faaa0','#e9508d','#f5b93f','#f48669'],theme:{primary:'#2faaa0',accent:'#e9508d',ink:'#413a32',radius:'28px',hero_style:'split'}},
 sage_sand:{name:'Sage & Sand',desc:'Natural, mature and comfortable for adult and family audiences.',colors:['#789b7d','#c47668','#d4ad67','#a9c4a9'],theme:{primary:'#789b7d',accent:'#c47668',ink:'#2e4235',radius:'24px',hero_style:'minimal'}},
 midnight_luxe:{name:'Midnight Luxe',desc:'Premium editorial mood for a sophisticated center identity.',colors:['#315f70','#c86b8e','#d4af67','#79b7ac'],theme:{primary:'#315f70',accent:'#c86b8e',ink:'#142f38',radius:'24px',hero_style:'minimal'}}
};
const defaults={preset:'playful_pastel',typography:'friendly_modern',nav_style:'floating_pill',card_style:'color_pop',density:'balanced',hero_layout:'split',motion:'gentle',service_color_mode:'multi',show_service_meta:true};
function notice(t,good=true){const el=$('#admin-message');if(el){el.innerHTML=`<div class="notice ${good?'good':''}">${t}</div>`;el.scrollIntoView({behavior:'smooth',block:'nearest'})}}
function installStyle(){if($('#eph-design-studio-style'))return;const s=document.createElement('style');s.id='eph-design-studio-style';s.textContent=`
.design-preset-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:18px 0 24px}
.design-preset{border:2px solid #e0ebea;background:#fff;border-radius:20px;padding:16px;text-align:left;cursor:pointer;transition:.2s}
.design-preset:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(25,70,75,.08)}.design-preset.selected{border-color:#17494e;box-shadow:0 0 0 3px rgba(63,184,176,.12)}
.design-preset-swatches{display:flex;gap:5px;margin-bottom:12px}.design-preset-swatches i{display:block;height:11px;flex:1;border-radius:999px}
.design-preset strong{display:block;margin-bottom:5px}.design-preset small{display:block;color:#657a7d;line-height:1.45}
.design-preview{border-radius:26px;padding:26px;background:linear-gradient(135deg,#f2fbfa,#fff7fa);border:1px solid #dcebea;margin-bottom:20px}
.design-preview-bar{display:flex;gap:7px;margin-bottom:18px}.design-preview-bar i{height:8px;border-radius:999px;flex:1}.design-preview h3{margin:0 0 8px}.design-preview p{margin:0}
@media(max-width:900px){.design-preset-grid{grid-template-columns:1fr 1fr}}@media(max-width:600px){.design-preset-grid{grid-template-columns:1fr}}
`;document.head.appendChild(s)}
function install(){
 installStyle();const nav=$('.side-nav'),app=$('.app-content');if(!nav||!app)return null;
 let btn=nav.querySelector('[data-view="design"]');if(!btn){btn=document.createElement('button');btn.dataset.view='design';btn.textContent='Design Studio';const w=nav.querySelector('[data-view="website"]');nav.insertBefore(btn,w||nav.querySelector('a'))}
 let sec=$('[data-view-panel="design"]');if(!sec){sec=document.createElement('section');sec.className='view';sec.dataset.viewPanel='design';sec.innerHTML=`
 <div class="page-head"><div><h2>Design Studio</h2><p>Change the entire visual personality of the public website without touching code.</p></div><a class="btn btn-secondary" href="index.html" target="_blank">Open live preview ↗</a></div>
 <div class="panel"><h3>Choose a complete design mood</h3><p class="muted">These presets change colors, visual tone and the overall feel. You can then fine-tune layout choices below.</p><div class="design-preset-grid" id="design-preset-grid"></div>
 <div class="design-preview" id="design-preview"></div>
 <form id="design-studio-form" class="form-grid"><input type="hidden" name="preset">
 <div class="field"><label>Typography</label><select name="typography"><option value="friendly_modern">Friendly modern</option><option value="soft_round">Soft & rounded</option><option value="clean_clinical">Clean clinical</option><option value="editorial_soft">Editorial soft</option></select></div>
 <div class="field"><label>Navigation style</label><select name="nav_style"><option value="floating_pill">Floating pill</option><option value="clean">Clean minimal</option><option value="underline">Editorial underline</option></select></div>
 <div class="field"><label>Card style</label><select name="card_style"><option value="color_pop">Color-pop cards</option><option value="rounded">Extra rounded / cozy</option><option value="minimal">Minimal cards</option></select></div>
 <div class="field"><label>Page spacing</label><select name="density"><option value="balanced">Balanced</option><option value="airy">Airy / premium</option><option value="compact">Compact</option></select></div>
 <div class="field"><label>Home hero layout</label><select name="hero_layout"><option value="split">Text + visual split</option><option value="centered">Centered showcase</option><option value="compact">Compact</option></select></div>
 <div class="field"><label>Animation</label><select name="motion"><option value="gentle">Gentle</option><option value="none">None / sensory calm</option></select></div>
 <div class="field"><label>Service card colors</label><select name="service_color_mode"><option value="multi">Different colors by service</option><option value="single">One brand color</option></select></div>
 <div class="field"><label>Show session duration + mode</label><select name="show_service_meta"><option value="1">Yes</option><option value="0">No</option></select></div>
 <div class="field full"><button class="btn btn-primary">Save & publish design</button></div></form></div>`;
 app.appendChild(sec)}
 btn.onclick=()=>{$$('[data-view]').forEach(x=>x.classList.toggle('active',x===btn));$$('[data-view-panel]').forEach(x=>x.classList.toggle('active',x===sec));$('#admin-title').textContent='Design Studio';$('#app-side')?.classList.remove('open')};
 return sec
}
let current={...defaults};
function renderPresets(){const grid=$('#design-preset-grid');if(!grid)return;grid.innerHTML=Object.entries(presets).map(([id,p])=>`<button type="button" class="design-preset ${current.preset===id?'selected':''}" data-design-preset="${id}"><span class="design-preset-swatches">${p.colors.map(c=>`<i style="background:${c}"></i>`).join('')}</span><strong>${p.name}</strong><small>${p.desc}</small></button>`).join('');$$('[data-design-preset]').forEach(b=>b.onclick=()=>{current.preset=b.dataset.designPreset;$('#design-studio-form').elements.preset.value=current.preset;renderPresets();renderPreview()})}
function renderPreview(){const p=presets[current.preset]||presets.playful_pastel,box=$('#design-preview');if(!box)return;box.style.background=`linear-gradient(135deg,${p.colors[0]}18,${p.colors[2]}20,${p.colors[1]}12)`;box.innerHTML=`<div class="design-preview-bar">${p.colors.map(c=>`<i style="background:${c}"></i>`).join('')}</div><h3>${p.name}</h3><p>${p.desc} Services can still use their own colorful accents while the whole site remains coordinated.</p>`}
async function load(){
 const r=await sb.from('settings').select('value').eq('key','design_system').maybeSingle();if(r.error)throw r.error;current={...defaults,...(r.data?.value||{})};
 const f=$('#design-studio-form');Object.entries(current).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=typeof v==='boolean'?(v?'1':'0'):v});renderPresets();renderPreview()
}
async function save(e){
 e.preventDefault();const f=e.target;current={preset:f.elements.preset.value||current.preset,typography:f.elements.typography.value,nav_style:f.elements.nav_style.value,card_style:f.elements.card_style.value,density:f.elements.density.value,hero_layout:f.elements.hero_layout.value,motion:f.elements.motion.value,service_color_mode:f.elements.service_color_mode.value,show_service_meta:f.elements.show_service_meta.value==='1'};
 const p=presets[current.preset]||presets.playful_pastel;
 const rows=[{key:'design_system',value:current},{key:'theme',value:p.theme}];
 const r=await sb.from('settings').upsert(rows,{onConflict:'key'});if(r.error)return notice(r.error.message,false);renderPresets();renderPreview();notice('Design published. Open or refresh the public website to see the new look.',true)
}
(async()=>{try{if(!install())return;await load();$('#design-studio-form').onsubmit=save;document.documentElement.dataset.ephDesignStudio='v6'}catch(e){notice('Design Studio could not initialize: '+e.message,false)}})();
})();