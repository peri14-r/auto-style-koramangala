'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight,Plus,MapPin,Phone,MessageCircle,ArrowRight} from 'lucide-react';
import type {ComponentType} from 'react';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {finishes,type Finish} from '@/lib/automotive';
type SceneProps={mode:'hero'|'studio';finish?:Finish;angle?:string};
function CarScene(props:SceneProps){
 const [Scene,setScene]=useState<ComponentType<SceneProps>|null>(null);
 useEffect(()=>{let active=true;import('@/components/car-scene').then(module=>{if(active)setScene(()=>module.default)}).catch(()=>{});return()=>{active=false}},[]);
 if(Scene)return <Scene {...props}/>;
 return <div className={`car-scene ${props.mode}-scene fallback`} role="img" aria-label="Illustrative automotive studio preview"><picture className="scene-poster"><source media="(max-width:700px)" srcSet={`/images/${props.mode}-mobile.webp`}/><img src={`/images/${props.mode}-desktop.webp`} alt="" width="1440" height="760"/></picture></div>;
}
const services=['Exterior styling','Lighting upgrades','Audio & infotainment','Interior accessories'];
const maps='https://maps.app.goo.gl/vfyh5b5weHkkD34L6';
export default function Home(){
 const [finish,setFinish]=useState<Finish>('black');
 const [angle,setAngle]=useState('auto');
 const [service,setService]=useState('Exterior styling');
 const [vehicle,setVehicle]=useState('');
 const [notes,setNotes]=useState('');
 const [opened,setOpened]=useState(false);
 const message=`Hi Auto Style, I would like to discuss an upgrade.\nVehicle: ${vehicle.trim()||'I will share my car model'}\nInterested in: ${service}\nStyle inspiration: ${finishes[finish].label}\n${notes.trim()?`My idea: ${notes.trim()}\n`:''}Please share compatible options, availability and a complete quote.`;
 const whatsapp=`https://wa.me/919845004858?text=${encodeURIComponent(message)}`;
 useEffect(()=>{
  const root=document.querySelector<HTMLElement>('#autostyle');
  const boot=()=>{const sc=(window as unknown as {ScrollCraft?:{mount:(r:HTMLElement)=>unknown}}).ScrollCraft;if(sc&&root&&!root.dataset.mounted){sc.mount(root);root.dataset.mounted='true';}};
  let script=document.querySelector<HTMLScriptElement>('script[data-scrollcraft]');
  if(!script){script=document.createElement('script');script.src='/scrollcraft/scrollcraft.js';script.dataset.scrollcraft='true';document.body.appendChild(script);}
  script.addEventListener('load',boot);boot();
  const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('seen')}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>reveal.observe(el));
  return()=>{script?.removeEventListener('load',boot);reveal.disconnect();};
 },[]);
 return <main id="autostyle">
 <a href="#enquiry" className="skip">Skip to enquiry</a>
 <header className="site-header"><a className="brand" href="#top" aria-label="Auto Style home">a<span>s</span><i>+</i></a><nav aria-label="Primary"><a href="#studio">The studio</a><a href="#upgrades">Upgrades</a><a href="#visit">Find us</a></nav><a className="nav-cta" href="#enquiry">PLAN MY UPGRADE <ArrowUpRight size={17}/></a></header>
 <section className="hero" id="top" data-sc-act="flow">
  <div className="hero-intro"><p>CAR ACCESSORIES & CUSTOMISATION</p><p>KORAMANGALA, BENGALURU <span className="mini-cross">+</span></p></div>
  <h1 className="hero-word" data-sc-parallax="-0.1">AUTO STYLE</h1>
  <div className="hero-orbit" aria-hidden="true"/>
  <div className="hero-scene hero-photograph ready" data-sc-parallax="0.055"><img src="/images/thar-photoreal.webp" alt="Photorealistic black Mahindra Thar" width="1536" height="1024" fetchPriority="high"/></div>
  <div className="hero-side"><span>FORM.</span><span>FEEL.</span><span>PERSONALITY.</span></div>
  <div className="hero-base"><div><h2>Anything but<br/><em>ordinary.</em></h2><p>For the love of your drive.</p></div><a className="circle-link" href="#studio"><span>EXPLORE<br/>YOUR STYLE</span><ArrowUpRight size={28}/></a><p className="hero-note">Your everyday car.<br/>Your own point of view.<br/><span>Photorealistic concept image</span></p></div>
 </section>
 <section className="manifesto" data-sc-act="flow"><div className="manifesto-top"><span>A DIFFERENT KIND OF DRIVE</span><Plus size={24}/></div><p className="manifesto-copy reveal"><span className="sentence"><span>Some cars get you there.</span></span><span className="sentence"><span><em>Yours should feel</em> like you.</span></span></p><div className="manifesto-bottom"><span className="red-dash"/><p>The sound. The finish. The small details you notice every day.<br/>Explore a more personal drive with Auto Style Koramangala.</p></div></section>
 <section className="studio" id="studio" data-sc-act="pin" data-sc-span="2.4">
  <div className="studio-stage" data-sc-stage>
   <div className="studio-heading"><p>THE STYLE STUDIO</p><h2>Make it<br/><em>your kind.</em></h2><p className="studio-description">Explore a look.<br/>We’ll talk about your car.</p></div>
   <div className="studio-backtype" aria-hidden="true">YOUR SPEC.</div>
   <CarScene mode="studio" finish={finish} angle={angle}/>
   <div className="studio-meta"><span>COLOUR & FORM STUDY</span><span>ILLUSTRATIVE VEHICLE</span></div>
   <div className="studio-controls">
    <div className="finish-control"><span className="control-label">FINISH INSPIRATION</span><RadioGroup aria-label="Choose finish inspiration" value={finish} onValueChange={v=>{setFinish(v as Finish);setOpened(false)}} className="swatches">{(Object.keys(finishes) as Finish[]).map(key=><label key={key} className={`swatch ${finish===key?'selected':''}`}><RadioGroupItem value={key} className="colour-radio" style={{background:finishes[key].color}} aria-label={finishes[key].label}/><span>{finishes[key].label}</span></label>)}</RadioGroup></div>
    <div className="view-control"><span className="control-label">TAKE A CLOSER LOOK</span><div className="view-buttons" aria-label="Car camera view">{[['auto','Journey'],['front','Front'],['side','Side'],['rear','Rear']].map(([key,label])=><button key={key} type="button" onClick={()=>setAngle(key)} aria-pressed={angle===key}>{label}</button>)}</div></div>
    <a className="save-look" href="#enquiry">BUILD MY BRIEF <ArrowUpRight size={23}/></a>
   </div>
  </div>
 </section>
 <section className="details-section" id="upgrades" data-sc-act="flow">
  <div className="detail-heading reveal"><p>IT’S ALL IN<br/>THE <em>DETAILS.</em></p><div><span>LESS OFF-THE-SHELF.<br/>MORE YOU.</span><p>Start with one change.<br/>Find the options that fit your car.</p></div></div>
  <article className="detail-spread exterior"><figure className="detail-photo reveal"><img src="/images/wheel.webp" alt="Illustrative close-up of a graphite fender, brushed alloy wheel and red brake caliper" width="1448" height="1086" loading="lazy"/><figcaption>EXTERIOR STUDY / CONCEPT IMAGE</figcaption></figure><div className="detail-copy reveal"><span className="detail-tag">THE FIRST IMPRESSION</span><h3>Presence.<br/>From every<br/><em>angle.</em></h3><p>Accessories that change the way you see your car. Explore exterior styling and lighting ideas, then discuss fitment and installation with the store.</p><div className="service-lines"><button onClick={()=>{setService('Exterior styling');document.querySelector('#enquiry')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}}>Exterior styling <ArrowUpRight size={18}/></button><button onClick={()=>{setService('Lighting upgrades');document.querySelector('#enquiry')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}}>Lighting upgrades <ArrowUpRight size={18}/></button></div></div></article>
  <article className="detail-spread interior"><div className="detail-copy reveal"><span className="detail-tag">YOUR SPACE, RECONSIDERED</span><h3>Feel it.<br/>Every time<br/><em>you get in.</em></h3><p>Your favourite track. A cabin that feels right. Discover audio, infotainment and interior accessory options for the way you actually drive.</p><div className="service-lines"><button onClick={()=>{setService('Audio & infotainment');document.querySelector('#enquiry')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}}>Audio & infotainment <ArrowUpRight size={18}/></button><button onClick={()=>{setService('Interior accessories');document.querySelector('#enquiry')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}}>Interior accessories <ArrowUpRight size={18}/></button></div></div><figure className="detail-photo reveal"><img src="/images/cockpit.webp" alt="Illustrative black leather cockpit with red stitching and brushed silver details" width="1448" height="1086" loading="lazy"/><figcaption>INTERIOR STUDY / CONCEPT IMAGE</figcaption></figure></article>
 </section>
 <section className="enquiry" id="enquiry" data-sc-act="flow"><div className="enquiry-title"><span>GOOD IDEAS START WITH A CONVERSATION.</span><h2>LET’S MAKE<br/>IT <em>YOURS.</em></h2><p>No guesswork. Tell us your car and the idea.<br/>Ask for compatible options and a complete quote.</p><div className="enquiry-process"><span>YOUR IDEA</span><ArrowRight size={16}/><span>THE OPTIONS</span><ArrowRight size={16}/><span>YOUR VISIT</span></div></div>
 <noscript><p className="no-script">Enable JavaScript for the interactive brief, or <a href="https://wa.me/919845004858">contact Auto Style on WhatsApp</a>.</p></noscript><form method="post" action="#enquiry" className="brief-card" onSubmit={e=>{e.preventDefault();if(!vehicle.trim())return;window.open(whatsapp,'_blank','noopener,noreferrer');setOpened(true)}}>
  <div className="brief-head"><span>YOUR UPGRADE BRIEF</span><Plus size={24}/></div>
  <label className="field-label" htmlFor="vehicle">What do you drive?</label><Input id="vehicle" name="vehicle" value={vehicle} onChange={e=>{setVehicle(e.target.value);setOpened(false)}} required maxLength={100} placeholder="e.g. Hyundai i20, 2022" autoComplete="off"/>
  <label className="field-label" id="interest-label">What do you have in mind?</label><RadioGroup aria-labelledby="interest-label" value={service} onValueChange={v=>{setService(String(v));setOpened(false)}} className="interest-options">{services.map(s=><label className={service===s?'interest selected':'interest'} key={s}><RadioGroupItem value={s}/><span>{s}</span></label>)}</RadioGroup>
  <label className="field-label" htmlFor="notes">Any details? <span>(optional)</span></label><Textarea id="notes" name="notes" value={notes} onChange={e=>{setNotes(e.target.value);setOpened(false)}} maxLength={800} placeholder="Your idea, a preferred product, or a question…"/>
  <div className="chosen-finish"><span><i style={{background:finishes[finish].color}}/> {finishes[finish].label}</span><a href="#studio">Change inspiration</a></div>
  <button className="submit" type="submit">PLAN MY UPGRADE <MessageCircle size={21}/></button><p className="form-note" role="status">{opened?'Your WhatsApp draft is ready. Review it and tap Send in WhatsApp.':'Opens a WhatsApp draft. Nothing is sent automatically.'}</p>{opened&&<a className="retry-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer">Open WhatsApp draft again <ArrowUpRight size={14}/></a>}
 </form></section>
 <footer id="visit"><div className="footer-top"><a className="footer-logo" href="#top">AUTO STYLE<span>MADE PERSONAL.</span></a><div><p>COME BY. SAY HELLO.</p><a href={maps} target="_blank" rel="noopener noreferrer"><MapPin size={17}/>Koramangala, Bengaluru <ArrowUpRight size={17}/></a><a href="tel:+919845004858"><Phone size={17}/>+91 98450 04858</a><span className="hours-note">Confirm store hours before visiting.</span></div><a className="footer-contact" href={whatsapp} target="_blank" rel="noopener noreferrer">LET’S TALK <ArrowUpRight size={28}/></a></div><div className="footer-bottom"><span>CONCEPT BY PEKIFLOW</span><p>Illustrative vehicles and photography. Services and contact details await owner confirmation.<br/>3D model: <a href="https://sketchfab.com/3d-models/thar-4x4-66ee970b18014c98a1750064b65657b0" target="_blank" rel="noopener noreferrer">THAR 4X4 by MB_Mahesh (CC BY 4.0; finish and presentation adapted)</a>. No brand affiliation.</p><span>BENGALURU, INDIA</span></div></footer>
 <a href="#enquiry" className="mobile-plan">PLAN MY UPGRADE <ArrowUpRight size={20}/></a>
 </main>;
}






