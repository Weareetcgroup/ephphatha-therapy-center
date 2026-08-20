window.EPH_CONFIG = {
  brand:{name:"EPHPHATHA THERAPY CENTER",shortName:"Ephphatha",tagline:"Every voice. Every milestone. Every possibility.",established:"2020"},
  contact:{
    phonePrimary:"+91 97911 92699",phonePrimaryDigits:"919791192699",
    phoneSecondary:"+91 98401 19895",phoneSecondaryDigits:"919840119895",
    whatsappDigits:"919791192699",email:"ephphathatherapycenter@gmail.com",
    address:"Vishwas Apartment, B-Block, Soundariya Nagar, Gowrivakkam, Chennai, Tamil Nadu 600073",
    locality:"Gowrivakkam / Sembakkam, Chennai",
    mapUrl:"https://maps.app.goo.gl/pS8H2akJMwe726BQ8",mapQuery:"Ephphatha Therapy Center"
  },
  hours:{0:null,1:["09:30","20:00"],2:["09:30","20:00"],3:["09:30","20:00"],4:["09:30","20:00"],5:["09:30","20:00"],6:["09:30","12:30"]},
  services:[
    {title:"Speech & Language Therapy",icon:"assets/speech.svg",summary:"Individualized support for speech clarity, language development, fluency, social communication and functional communication.",href:"services.html#speech"},
    {title:"Occupational Therapy",icon:"assets/ot.svg",summary:"Support for sensory processing, fine-motor skills, play, self-care, attention and everyday independence.",href:"services.html#ot"},
    {title:"Behavioural Support",icon:"assets/behavior.svg",summary:"Structured, compassionate support focused on participation, routines, emotional regulation and meaningful daily skills.",href:"services.html#behavior"},
    {title:"Early Intervention",icon:"assets/early.svg",summary:"Development-focused care for young children, with family guidance and practical strategies that fit everyday routines.",href:"services.html#early"},
    {title:"Special Education",icon:"assets/special-ed.svg",summary:"Personalized learning support for foundational academics, school readiness, learning differences and functional education.",href:"services.html#special"},
    {title:"Sensory Integration",icon:"assets/sensory.svg",summary:"Play-based sensory-motor activities designed to support regulation, body awareness, coordination and participation.",href:"services.html#sensory"},
    {title:"Auditory-Verbal Therapy",icon:"assets/avt.svg",summary:"Listening and spoken-language support for appropriate candidates using hearing technology, with active family involvement.",href:"services.html#avt"},
    {title:"Adult Communication Support",icon:"assets/adult.svg",summary:"Assessment-led support for adults with speech, language, voice, fluency or acquired communication needs.",href:"services.html#adult"}
  ],
  faqs:[
    {q:"How do I know which therapy my child needs?",a:"You do not need to decide that before contacting us. Start by sharing your concern. A clinician can recommend an assessment or the most appropriate next step based on the child's needs."},
    {q:"Do you provide both in-clinic and online sessions?",a:"Ephphatha provides in-clinic services and can offer online consultation or selected therapy services where clinically suitable. Contact the center to confirm the best format for your needs."},
    {q:"How long is a therapy session?",a:"Session duration is configured by the center for each service. The current standard is 30 minutes unless a different duration is selected for that service or care plan."},
    {q:"Will parents receive guidance for home practice?",a:"Yes. Therapy works best when useful strategies carry into daily life, so home guidance and caregiver collaboration may be included as part of the plan."},
    {q:"Do you work only with children?",a:"No. Ephphatha supports children and also offers selected communication-related services for adults. Contact the center with the specific concern so the team can confirm suitability."}
  ]
};
(()=>{
 const load=(src,id)=>new Promise((resolve,reject)=>{
  if(document.getElementById(id))return resolve();
  const s=document.createElement('script');s.src=src;s.id=id;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Could not load '+src));document.head.appendChild(s);
 });
 (async()=>{
  try{
   await load('js/design-library.js?v=7.0','eph-design-library');
   await load('js/design-runtime.js?v=7.0','eph-design-runtime');
  }catch(e){console.warn('Ephphatha design layer could not load:',e);}
 })();
})();