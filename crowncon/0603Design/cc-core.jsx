/* ============================================================
   cc-core.jsx — data, icons, primitives, motion hooks
   ============================================================ */
const { useState, useEffect, useRef, createContext, useContext } = React;

/* ---------------- imagery (real photos auto-swap in) ---------------- */
const IMAGES = {
  deck:    { src:'assets/exterior-deck.webp',   tone:'warm',  label:'Exterior',  sub:'Finished home & deck' },
  chairs:  { src:'assets/exterior-chairs.webp', tone:'warm',  label:'Outdoor',   sub:'Alfresco living' },
  windows: { src:'assets/exteriorhome.webp',    tone:'cool',  label:'Facade',    sub:'Street presence' },
  kitchen: { src:'assets/interior-kitchen.webp',tone:'stone', label:'Interior',  sub:'Kitchen & joinery' },
  stone:   { src:'assets/interior-stone.webp',  tone:'stone', label:'Detail',    sub:'Stone & finishes' },
  living:  { src:'assets/interior-living.jpg',  tone:'deep',  label:'Tim',       sub:'On-site, every build' },
};

/* ---------------- content ---------------- */
const NAV = ['About','Process','Designs','Projects','Reviews','Contact'];
const PHONE = '03 8737 9416';

const STATS = [
  { n:'60', suffix:'+', l:'Homes Built' },
  { n:'9',  suffix:'+', l:'Years Building' },
  { n:'5.0', suffix:'★', l:'Google Rated', spark:true },
  { n:'100', suffix:'%', l:'Fixed Price' },
];

const SPECS = [
  { tag:'Knockdown Rebuild', img:'deck',
    body:"Love your location but not your home? We demolish and rebuild on your existing block — guided from council approvals to your new keys." },
  { tag:'New Home Build', img:'chairs',
    body:"Building on a fresh block is one of life's great opportunities. We design and construct a home that's genuinely, unmistakably yours." },
  { tag:'Development', img:'windows',
    body:"Maximise the potential of your land. We deliver multi-unit and townhouse developments with the same care as a single forever home." },
];

const PROCESS = [
  { n:'01', t:'Consultation', d:'We meet, listen, and understand your vision, block, and budget. No obligation.' },
  { n:'02', t:'Design',       d:'We align your design to a real, deliverable budget before you commit.' },
  { n:'03', t:'Contract',     d:'Clear scope, fixed price, defined programme. You know exactly what you get.' },
  { n:'04', t:'Construction', d:'Tim on-site. Regular updates. Premium materials. Real accountability.' },
  { n:'05', t:'Handover',     d:"Your home, delivered. We don't disappear after the keys." },
];

const PILLARS = [
  { ic:'pin',    t:'Local Knowledge',     d:'Nine years building across SE Bayside. We know the land, councils, and community.' },
  { ic:'user',   t:'Personal Process',    d:"You're not a number. Tim is involved from first consult to handover." },
  { ic:'budget', t:'Budget Clarity',      d:'We engage early so your budget is set before you commit. No surprises.' },
  { ic:'clock',  t:'On-Time Delivery',    d:'A tight programme and accountable contractors. Tasman: 360m² in 7 months.' },
  { ic:'award',  t:'Premium Partners',    d:'Caesarstone, Fisher & Paykel, James Hardie, Smeg — inclusions without compromise.' },
];

const REVIEWS = [
  { q:'Tim answered the phone every single time. After hearing horror stories from friends, that alone was worth it — and the home is everything we hoped for.',
    name:'Sarah H.', date:'3 weeks ago', rating:5 },
  { q:'We knew our budget before we were committed to anything. No surprises, no awkward conversations halfway through. Just honesty from day one.',
    name:'Marcus B.', date:'2 months ago', rating:5 },
  { q:'A small team that genuinely cared. You feel it in the details. We never felt handed off or like just another job on a list.',
    name:'James C.', date:'4 months ago', rating:5 },
];

const PARTNERS = ['Caesarstone','Fisher & Paykel','James Hardie','Smeg','Velux'];

const GALLERY = [
  { img:'kitchen', cls:'g-a', cap:'Kitchen & Joinery' },
  { img:'deck',    cls:'g-b', cap:'Exterior & Deck' },
  { img:'stone',   cls:'g-c', cap:'Stone Detailing' },
  { img:'chairs',  cls:'g-d', cap:'Alfresco Living' },
];

/* ---------------- icons ---------------- */
function Icon({ name, ...p }){
  const s = { fill:'none', stroke:'currentColor', strokeWidth:1.5, strokeLinecap:'round', strokeLinejoin:'round' };
  const paths = {
    pin:    <><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.4"/></>,
    user:   <><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></>,
    budget: <><circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.3 9.2c0-1.1 1.2-1.9 2.7-1.9s2.7.8 2.7 1.9-1.2 1.6-2.7 1.9-2.7.8-2.7 1.9 1.2 1.9 2.7 1.9 2.7-.8 2.7-1.9"/></>,
    clock:  <><circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/></>,
    award:  <><circle cx="12" cy="9" r="5"/><path d="M9 13.5 7.5 21l4.5-2.6L16.5 21 15 13.5"/></>,
    phone:  <><path d="M5 4h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 4 6a2 2 0 0 1 1-2z"/></>,
    camera: <><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.2"/></>,
    arrow:  <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  };
  return <svg viewBox="0 0 24 24" style={s} {...p}>{paths[name]||null}</svg>;
}

/* ---------------- graceful image placeholder ---------------- */
function Ph({ img, className='', frame=false, zoom=false, style={} }){
  const data = IMAGES[img] || {};
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={'ph'+(zoom?' zoomer':'')+(frame?' framed':'')+(className?' '+className:'')} data-tone={data.tone||'warm'} style={style}>
      {!loaded && (
        <div className="ph-fill">
          <Icon name="camera" className="pl-cam"/>
          <span className="pl-label">{data.label||''}</span>
          {data.sub && <span className="pl-sub">{data.sub}</span>}
        </div>
      )}
      <img src={data.src} alt={data.sub||''} className={loaded?'is-loaded':''}
           onLoad={()=>setLoaded(true)} onError={(e)=>{ e.currentTarget.style.display='none'; }}/>
    </div>
  );
}

/* ---------------- small UI ---------------- */
function Btn({ kind='primary', children, arrow=false, href='#', style={} }){
  return (
    <a className={'btn btn--'+kind} href={href} style={style}>
      {children}{arrow && <Icon name="arrow" className="arr" style={{ width:16, height:16 }}/>}
    </a>
  );
}
function TLink({ children, href='#' }){
  return <a className="tlink" href={href}>{children}<Icon name="arrow" className="arr" style={{ width:15, height:15 }}/></a>;
}
function Eyebrow({ children, plain=false }){
  return <span className={'eyebrow'+(plain?' eyebrow--plain':'')}>{children}</span>;
}
function GoogleLogo({ size=18 }){
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
function GStars({ n=5 }){
  return <span className="gstars">{Array.from({length:n}).map((_,i)=><span key={i}>★</span>)}</span>;
}

/* ---------------- motion: scroll reveal ---------------- */
function Reveal({ children, as='div', delay=0, className='', style={}, ...rest }){
  const ref = useRef(null);
  useEffect(()=>{
    const el = ref.current; if(!el) return;
    if(!('IntersectionObserver' in window)){ el.classList.add('in'); return; }
    const io = new IntersectionObserver((ents)=>{
      ents.forEach(e=>{ if(e.isIntersecting){ el.classList.add('in'); io.unobserve(el); } });
    }, { threshold:0.14, rootMargin:'0px 0px -8% 0px' });
    io.observe(el);
    return ()=>io.disconnect();
  },[]);
  const Tag = as;
  return <Tag ref={ref} className={'reveal '+className} style={{ ...style, '--d':delay+'ms' }} {...rest}>{children}</Tag>;
}

/* ---------------- motion: count-up ---------------- */
function useCountUp(target, { duration=1500 }={}){
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(()=>{
    const el = ref.current; if(!el) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const noMotion = document.documentElement.classList.contains('no-motion');
    if(reduce || noMotion){ setVal(target); return; }
    const io = new IntersectionObserver((ents)=>{
      ents.forEach(e=>{
        if(e.isIntersecting && !done.current){
          done.current = true;
          const start = performance.now();
          const tick = (now)=>{
            const p = Math.min(1,(now-start)/duration);
            const eased = 1-Math.pow(1-p,3);
            setVal(target*eased);
            if(p<1) requestAnimationFrame(tick);
            else setVal(target);
          };
          requestAnimationFrame(tick);
          io.unobserve(el);
        }
      });
    },{ threshold:0.4 });
    io.observe(el);
    return ()=>io.disconnect();
  },[target]);
  return [val, ref];
}

/* ---------------- expose ---------------- */
Object.assign(window, {
  IMAGES, NAV, PHONE, STATS, SPECS, PROCESS, PILLARS, REVIEWS, PARTNERS, GALLERY,
  Icon, Ph, Btn, TLink, Eyebrow, GoogleLogo, GStars, Reveal, useCountUp,
});
