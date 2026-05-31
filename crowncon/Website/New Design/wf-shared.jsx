/* ============================================================
   wf-shared.jsx — low-fi primitives, data, shared content blocks
   ============================================================ */
const { createContext, useContext } = React;

/* ---------------- images ---------------- */
const IMAGES = {
  deck:    'assets/exterior-deck.webp',
  chairs:  'assets/exterior-chairs.webp',
  windows: 'assets/exteriorhome.webp',
  kitchen: 'assets/interior-kitchen.webp',
  stone:   'assets/interior-stone.webp',
  living:  'assets/interior-living.jpg',
};

/* ---------------- context ---------------- */
const WFContext = createContext({ photos: true });
const useWF = () => useContext(WFContext);

/* ---------------- content data ---------------- */
const NAV = ['Home','About','Our Process','Designs','Projects','Blog','Contact'];
const PHONE = '03 8737 9416';

const STATS = [
  { n:'60+',  l:'Homes Built' },
  { n:'9+',   l:'Years Experience' },
  { n:'SE',   l:'Bayside Specialists' },
  { n:'5★',   l:'Rated Builder' },
];

const SPECS = [
  { tag:'Knockdown Rebuild', img:'deck',
    body:"Love your location but not your home? We'll demolish and rebuild on your existing block — guided from council approvals to your new keys." },
  { tag:'New Home Build', img:'chairs',
    body:"Building on a fresh block is one of life's great opportunities. We'll help you design and construct a home that's genuinely yours." },
  { tag:'Development', img:'windows',
    body:"Maximise the potential of your land. We deliver multi-unit and townhouse developments with the same attention to detail." },
];

const PROCESS = [
  { n:'01', t:'Consultation', d:'We meet, listen, and understand your vision, block, and budget. No obligation.' },
  { n:'02', t:'Design',       d:'We align your design to a real, deliverable budget before you commit.' },
  { n:'03', t:'Contract',     d:'Clear scope, fixed price, defined programme. You know exactly what you get.' },
  { n:'04', t:'Construction', d:'Tim on-site. Regular updates. Premium materials. Real accountability.' },
  { n:'05', t:'Handover',     d:"Your home, delivered. We don't disappear after the keys." },
];

const PILLARS = [
  { ic:'pin',    t:'Local Knowledge',    d:"Nine years building across SE Bayside. We know the land, councils, and community." },
  { ic:'user',   t:'Personalised Process', d:"You're not a number. Tim is involved from first consult to handover." },
  { ic:'budget', t:'Budget Clarity',     d:'We engage early so your budget is set before you commit. No surprises.' },
  { ic:'clock',  t:'On-Time Delivery',   d:'A tight programme and accountable contractors. Tasman: 360m² in 7 months.' },
  { ic:'award',  t:'Premium Partners',   d:'Caesarstone, Fisher & Paykel, James Hardie, Smeg. Inclusions without compromise.' },
];

const REVIEWS = [
  { q:'Tim answered the phone every single time. After hearing horror stories from friends, that alone was worth it — and the home is everything we hoped for.',
    name:'The Hartleys', sub:'Seaford', type:'New Home Build' },
  { q:"We knew our budget before we were committed to anything. No surprises, no awkward conversations halfway through. Just honesty from day one.",
    name:'Marcus & Lena', sub:'Bonbeach', type:'Knockdown Rebuild' },
  { q:'A small team that genuinely cared. You feel it in the details. We never felt handed off or like just another job on a list.',
    name:'The Coopers', sub:'Frankston', type:'New Home Build' },
];

const PARTNERS = ['Caesarstone','Fisher & Paykel','James Hardie','Smeg','Velux','Reece'];

/* ---------------- icons ---------------- */
function Icon({ name, ...p }){
  const s = { fill:'none', stroke:'currentColor', strokeWidth:1.6, strokeLinecap:'round', strokeLinejoin:'round' };
  const paths = {
    pin:    <><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.4"/></>,
    user:   <><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></>,
    budget: <><circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.3 9.2c0-1.1 1.2-1.9 2.7-1.9s2.7.8 2.7 1.9-1.2 1.6-2.7 1.9-2.7.8-2.7 1.9 1.2 1.9 2.7 1.9 2.7-.8 2.7-1.9"/></>,
    clock:  <><circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/></>,
    award:  <><circle cx="12" cy="9" r="5"/><path d="M9 13.5 7.5 21l4.5-2.6L16.5 21 15 13.5"/></>,
    home:   <><path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.3 3 7.5 7 9 4-1.5 7-4.7 7-9V6z"/><path d="m9 11.5 2 2 4-4"/></>,
    chat:   <><path d="M4 5h16v11H8l-4 4z"/></>,
    phone:  <><path d="M5 4h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 4 6a2 2 0 0 1 1-2z"/></>,
    mail:   <><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    camera: <><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.2"/></>,
  };
  return <svg viewBox="0 0 24 24" style={s} {...p}>{paths[name]||null}</svg>;
}

/* ---------------- primitives ---------------- */
function Ph({ img, label, sub, className='', style={} }){
  const { photos } = useWF();
  return (
    <div className={'ph '+(photos?'':'ph--box ')+className} style={style}>
      {photos
        ? <img src={IMAGES[img]} alt={label||''} />
        : <div className="ph-label"><Icon name="camera"/><span>{label}</span>{sub && <span className="ic">{sub}</span>}</div>}
    </div>
  );
}

function Stars({ n=5 }){
  return <span className="stars">{'★'.repeat(n)}</span>;
}

function Btn({ kind='primary', children, arrow }){
  return <a className={'btn btn--'+kind} href="#">{children}{arrow && <span className="arr">→</span>}</a>;
}

function Tag({ children }){ return <span className="tag">{children}</span>; }

function Section({ n, label, bg='warm', className='', style={}, children }){
  return (
    <section className={`section section--${bg} ${className}`} style={style}>
      {n && <div className="sec-marker"><span className="num">{n}</span><span>{label}</span></div>}
      {children}
    </section>
  );
}

/* ---------------- nav ---------------- */
function Nav({ variant='classic' }){
  return (
    <div className={'nav nav--'+variant}>
      <div className="container nav-inner">
        <div className="logo">Crown<span className="crown">Con</span></div>
        <ul className="nav-links">{NAV.map(x => <li key={x}><a href="#">{x}</a></li>)}</ul>
        <div className="nav-right">
          <span className="nav-phone">{PHONE}</span>
          <Btn kind={variant==='overlay'?'primary':'primary'} arrow>Book a Free Chat</Btn>
        </div>
      </div>
    </div>
  );
}

/* ---------------- trust bar ---------------- */
function TrustBar({ tone='navy' }){
  const items = ['Registered Builder DB-U 67572','ACN 622 720 030','Est. 2017','Serving SE Bayside Melbourne'];
  if (tone === 'light') {
    return (
      <div style={{ background:'var(--off-white)', borderTop:'1.5px dashed var(--ink)', borderBottom:'1.5px dashed var(--ink)' }}>
        <div className="container" style={{ display:'flex', flexWrap:'wrap', gap:'10px 30px', justifyContent:'center', padding:'16px 40px', fontFamily:'var(--sans)', fontSize:13, fontWeight:600, color:'#6f675a', letterSpacing:'.02em' }}>
          {items.map((x,i) => <span key={i} style={{ display:'inline-flex', gap:18 }}>{x}{i<items.length-1 && <span style={{opacity:.4}}>·</span>}</span>)}
        </div>
      </div>
    );
  }
  return (
    <div style={{ background:'var(--navy)', color:'#cdd3da' }}>
      <div className="container" style={{ display:'flex', flexWrap:'wrap', gap:'10px 26px', justifyContent:'center', padding:'15px 40px', fontFamily:'var(--sans)', fontSize:12.5, fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase' }}>
        {items.map((x,i) => <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:26 }}>{x}{i<items.length-1 && <span style={{ color:'var(--sand)', opacity:.7 }}>|</span>}</span>)}
      </div>
    </div>
  );
}

/* ---------------- specialisation presentations ---------------- */
// A: alternating stacked rows
function SpecStacked(){
  return (
    <div className="container">
      <div className="center" style={{ maxWidth:560, margin:'0 auto 44px' }}>
        <Tag>What We Build</Tag>
        <h2 className="head mt16" style={{ fontSize:'clamp(28px,3.4vw,40px)' }}>Three ways to your forever home</h2>
      </div>
      <div className="grid" style={{ gap:36 }}>
        {SPECS.map((s,i) => (
          <div className="split" key={i} style={{ gap:40, direction:i%2?'rtl':'ltr' }}>
            <div style={{ direction:'ltr' }}><Ph img={s.img} label={s.tag} sub="project photo" style={{ aspectRatio:'16/10' }}/></div>
            <div style={{ direction:'ltr' }}>
              <span className="eyebrow">{'0'+(i+1)}</span>
              <h3 className="head mt8" style={{ fontSize:26 }}>{s.tag}</h3>
              <p className="body mt12 maxw560">{s.body}</p>
              <div className="mt20"><Btn kind="ghost" arrow>Learn More</Btn></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// B: 3 full-height image cards
function SpecCards(){
  return (
    <div className="container">
      <div className="grid" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
        {SPECS.map((s,i) => (
          <div key={i} style={{ position:'relative' }}>
            <Ph img={s.img} label={s.tag} sub="full-height card" style={{ aspectRatio:'3/4.4' }}/>
            <div style={{ position:'absolute', left:0, right:0, bottom:0, padding:'22px', background:'linear-gradient(to top, rgba(22,34,46,.85), rgba(22,34,46,0))', borderRadius:'0 0 7px 7px' }}>
              <h3 className="head" style={{ color:'#fff', fontSize:23 }}>{s.tag}</h3>
              <p style={{ color:'#e4ddd0', fontFamily:'var(--sans)', fontSize:13.5, lineHeight:1.5, margin:'8px 0 0' }}>{s.body}</p>
              <div style={{ marginTop:14, fontFamily:'var(--sans)', fontWeight:700, fontSize:13, color:'var(--sand)' }}>Learn More →</div>
            </div>
          </div>
        ))}
      </div>
      <style>{`@media(max-width:860px){.section .grid[style*="repeat(3"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}

// C: compact icon grid (information-rich, less imagery)
function SpecGrid(){
  const icons = ['home','shield','award'];
  return (
    <div className="container">
      <div className="split" style={{ gridTemplateColumns:'minmax(0,360px) 1fr', alignItems:'start', gap:48 }}>
        <div>
          <Tag>What We Build</Tag>
          <h2 className="head mt16" style={{ fontSize:'clamp(26px,3vw,36px)' }}>Three clear pathways</h2>
          <p className="body mt12">Whatever your starting point, the same builder-led process applies — early budgets, fixed scope, and Tim across every detail.</p>
        </div>
        <div className="grid" style={{ gridTemplateColumns:'1fr', gap:0 }}>
          {SPECS.map((s,i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'48px 1fr auto', gap:18, alignItems:'start', padding:'22px 0', borderTop:i?'1.5px dashed var(--ink)':'none' }}>
              <div className="icon-chip"><Icon name={icons[i]}/></div>
              <div>
                <h3 className="head" style={{ fontSize:20 }}>{s.tag}</h3>
                <p className="body mt8" style={{ fontSize:14 }}>{s.body}</p>
              </div>
              <a href="#" style={{ fontFamily:'var(--sans)', fontWeight:700, fontSize:13, color:'var(--accent-ink)', whiteSpace:'nowrap', textDecoration:'none', alignSelf:'center' }}>Learn More →</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- process ---------------- */
function ProcessBlock({ cols=5 }){
  return (
    <div className="container">
      <div className="split" style={{ gridTemplateColumns:'1fr 1fr', alignItems:'end', gap:30, marginBottom:40 }}>
        <div>
          <Tag>Our Process</Tag>
          <h2 className="head mt16" style={{ fontSize:'clamp(28px,3.4vw,42px)' }}>Concept to keys, one team</h2>
        </div>
        <p className="body" style={{ alignSelf:'end' }}>Every Crowncon build follows the same demystified path — so you always know what's happening, and what's next.</p>
      </div>
      <div className="grid" style={{ gridTemplateColumns:`repeat(${cols},1fr)` }}>
        {PROCESS.map((p,i) => (
          <div className="pstep" key={i}>
            <div className="pnum">{p.n}</div>
            <div className="pline"/>
            <h3 className="head" style={{ color:'#fff', fontSize:18 }}>{p.t}</h3>
            <p className="body mt8" style={{ fontSize:13.5 }}>{p.d}</p>
          </div>
        ))}
      </div>
      <div className="mt40"><Btn kind="primary" arrow>Book a Free Chat</Btn></div>
      <style>{`@media(max-width:860px){.pstep{margin-bottom:8px}.section--navy .grid{grid-template-columns:1fr 1fr!important}}`}</style>
    </div>
  );
}

/* ---------------- about teaser (Tim, warm/human) ---------------- */
function AboutTeaser({ variant='split' }){
  const quote = "I started Crowncon because I believed families deserved better than what volume builders were delivering. That belief hasn't changed.";
  if (variant === 'bleed') {
    return (
      <div className="split" style={{ gridTemplateColumns:'1fr 1fr', gap:0, alignItems:'stretch' }}>
        <Ph img="living" label="Tim on-site" sub="portrait / handover" style={{ minHeight:440, borderRadius:0 }}/>
        <div style={{ background:'var(--off-white)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'clamp(32px,5vw,72px)' }}>
          <Tag>Meet Tim</Tag>
          <p className="quote mt20" style={{ fontSize:'clamp(22px,2.4vw,30px)' }}>“{quote}”</p>
          <p className="mt20" style={{ fontFamily:'var(--sans)', fontWeight:700, color:'var(--navy)' }}>Tim Swindon <span style={{ fontWeight:400, color:'#8b8579' }}>— Director &amp; Builder</span></p>
          <div className="mt28"><Btn kind="ghost" arrow>Read Tim's Story</Btn></div>
        </div>
      </div>
    );
  }
  if (variant === 'compact') {
    return (
      <div className="container">
        <div className="split" style={{ gridTemplateColumns:'200px 1fr', gap:32, alignItems:'center' }}>
          <Ph img="living" label="Tim" sub="portrait" style={{ aspectRatio:'1/1', borderRadius:'50%' }}/>
          <div>
            <span className="eyebrow">Meet Tim · Director &amp; Builder</span>
            <p className="quote mt12" style={{ fontSize:'clamp(19px,2.1vw,25px)' }}>“{quote}”</p>
            <div className="row mt16">
              <span style={{ fontFamily:'var(--sans)', fontWeight:700, color:'var(--navy)' }}>Tim Swindon</span>
              <a href="#" style={{ fontFamily:'var(--sans)', fontWeight:700, fontSize:13, color:'var(--accent-ink)', textDecoration:'none' }}>Read his story →</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // split (default)
  return (
    <div className="container">
      <div className="split" style={{ gap:54 }}>
        <Ph img="living" label="Tim on-site" sub="portrait / handover moment" style={{ aspectRatio:'4/3.4' }}/>
        <div>
          <Tag>Meet Tim</Tag>
          <p className="quote mt20" style={{ fontSize:'clamp(22px,2.6vw,32px)' }}>“{quote}”</p>
          <p className="mt20" style={{ fontFamily:'var(--sans)', fontWeight:700, color:'var(--navy)' }}>Tim Swindon <span style={{ fontWeight:400, color:'#8b8579' }}>— Director &amp; Builder</span></p>
          <p className="body mt16 maxw560">A small, deliberately sized team. You'll never be handed off to a project manager you've never met — Tim answers the phone, and your home gets the attention it deserves.</p>
          <div className="mt28"><Btn kind="ghost" arrow>Read Tim's Story</Btn></div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- value pillars ---------------- */
function PillarsBlock({ compact=false }){
  return (
    <div className="container">
      <div className="center" style={{ maxWidth:560, margin:'0 auto 40px' }}>
        <Tag>Why Crowncon</Tag>
        <h2 className="head mt16" style={{ fontSize:'clamp(26px,3.2vw,38px)' }}>Built on five things we never compromise</h2>
      </div>
      <div className="grid" style={{ gridTemplateColumns:'repeat(5,1fr)' }}>
        {PILLARS.map((p,i) => (
          <div className={compact?'':'card'} key={i} style={ compact?{}:{ padding:'24px 20px' }}>
            <div className="icon-chip"><Icon name={p.ic}/></div>
            <h3 className="head mt16" style={{ fontSize:17 }}>{p.t}</h3>
            <p className="body mt8" style={{ fontSize:13 }}>{p.d}</p>
          </div>
        ))}
      </div>
      <style>{`@media(max-width:980px){.section .grid[style*="repeat(5"]{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:560px){.section .grid[style*="repeat(5"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

/* ---------------- reviews ---------------- */
function ReviewsBlock({ variant='cols' }){
  if (variant === 'feature') {
    const r = REVIEWS[0];
    return (
      <div className="container center" style={{ maxWidth:840, margin:'0 auto' }}>
        <Stars/><span className="rate-txt">5.0 · Google &amp; word of mouth</span>
        <p className="quote mt20" style={{ fontSize:'clamp(26px,3.6vw,40px)' }}>“{r.q}”</p>
        <p className="mt28" style={{ fontFamily:'var(--sans)', fontWeight:700, color:'var(--navy)' }}>{r.name}</p>
        <p className="muted" style={{ fontFamily:'var(--sans)', fontSize:13 }}>{r.sub} · {r.type}</p>
        <div className="row mt28" style={{ justifyContent:'center' }}>
          {REVIEWS.map((_,i)=><span key={i} style={{ width:9, height:9, borderRadius:'50%', background:i?'var(--sand-light)':'var(--accent)' }}/>)}
        </div>
      </div>
    );
  }
  return (
    <div className="container">
      <div className="center" style={{ marginBottom:40 }}>
        <Stars/><span className="rate-txt">Trusted by SE Bayside families</span>
        <h2 className="head mt12" style={{ fontSize:'clamp(26px,3.2vw,38px)' }}>In their words</h2>
      </div>
      <div className="grid" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
        {REVIEWS.map((r,i) => (
          <div className="card" key={i} style={{ padding:'28px 24px' }}>
            <Stars/>
            <p className="quote mt16" style={{ fontSize:19 }}>“{r.q}”</p>
            <p className="mt20" style={{ fontFamily:'var(--sans)', fontWeight:700, color:'var(--navy)', fontSize:14 }}>{r.name}</p>
            <p className="muted" style={{ fontFamily:'var(--sans)', fontSize:12.5 }}>{r.sub} · {r.type}</p>
          </div>
        ))}
      </div>
      <style>{`@media(max-width:860px){.section .grid[style*="repeat(3"]{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}

/* ---------------- gallery strip ---------------- */
function GalleryStrip({ variant='strip' }){
  const imgs = ['kitchen','stone','deck','chairs'];
  const labels = ['Interior','Detail','Exterior','Outdoor'];
  return (
    <div className={variant==='bleed'?'':'container'}>
      <div className="grid" style={{ gridTemplateColumns:'repeat(4,1fr)', gap: variant==='bleed'?4:'var(--stack-gap)' }}>
        {imgs.map((im,i) => <Ph key={i} img={im} label={labels[i]} sub="project" style={{ aspectRatio: variant==='bleed'?'3/4':'1/1', borderRadius: variant==='bleed'?0:7 }}/>)}
      </div>
      <div className="center mt28"><Btn kind="ghost" arrow>View All Projects</Btn></div>
      <style>{`@media(max-width:760px){.section .grid[style*="repeat(4"]{grid-template-columns:repeat(2,1fr)!important}}`}</style>
    </div>
  );
}

/* ---------------- CTA ---------------- */
function CtaBlock(){
  return (
    <div className="container center" style={{ maxWidth:720, margin:'0 auto' }}>
      <h2 className="head" style={{ color:'#fff', fontSize:'clamp(30px,4vw,50px)' }}>Ready to build?</h2>
      <p className="body mt16" style={{ fontSize:17 }}>Every great home starts with a conversation. Book a free 30-minute chat with Tim and let's talk about what's possible.</p>
      <div className="row mt28" style={{ justifyContent:'center' }}>
        <Btn kind="primary" arrow>Book a Free Chat</Btn>
        <a href="#" className="btn btn--ghost"><Icon name="phone" style={{ width:16, height:16 }}/>&nbsp;{PHONE}</a>
      </div>
    </div>
  );
}

/* ---------------- partners ---------------- */
function PartnersBlock(){
  return (
    <div className="container">
      <p className="center muted" style={{ fontFamily:'var(--sans)', fontSize:12, fontWeight:700, letterSpacing:'.16em', textTransform:'uppercase', marginBottom:24 }}>Premium inclusions, as standard</p>
      <div className="grid" style={{ gridTemplateColumns:'repeat(6,1fr)', gap:16 }}>
        {PARTNERS.map((p,i) => <div className="partner" key={i}>{p}</div>)}
      </div>
      <style>{`@media(max-width:760px){.section .grid[style*="repeat(6"]{grid-template-columns:repeat(3,1fr)!important}}`}</style>
    </div>
  );
}

/* ---------------- footer ---------------- */
function Footer(){
  const cols = [
    { h:'CrownCon Homes', items:['Boutique custom builder for SE Bayside Melbourne families.','Instagram','Facebook'] },
    { h:'Explore', items:['Home','About','Our Process','Designs','Projects','Blog'] },
    { h:'Services', items:['Knockdown Rebuild','New Home Build','Development','Considered Series'] },
    { h:'Contact', items:[PHONE,'enquire@crowncon.com.au','11/6 Malibu Cct, Carrum Downs','Mon–Fri, 8am–4pm'] },
  ];
  return (
    <footer className="footer">
      <div className="container">
        <div className="grid" style={{ gridTemplateColumns:'1.4fr 1fr 1fr 1.2fr', gap:40 }}>
          {cols.map((c,i) => (
            <div key={i}>
              <div className="head" style={{ fontSize:i===0?22:15, marginBottom:14 }}>{i===0?<>Crown<span style={{color:'var(--sand)'}}>Con</span></>:c.h}</div>
              <ul style={{ listStyle:'none', margin:0, padding:0, display:'grid', gap:9, fontFamily:'var(--sans)', fontSize:13.5 }}>
                {c.items.map((it,j) => <li key={j}><a href="#">{it}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="rule" style={{ margin:'34px 0 18px', borderColor:'rgba(255,255,255,.15)' }}/>
        <p style={{ fontFamily:'var(--sans)', fontSize:12, color:'#7d858e' }}>Registered Domestic Builder Unlimited DB-U 67572 · ACN 622 720 030 · © 2026 Crowncon Homes · Privacy · Terms</p>
      </div>
      <style>{`@media(max-width:860px){.footer .grid{grid-template-columns:1fr 1fr!important}}`}</style>
    </footer>
  );
}

/* ---------------- export ---------------- */
Object.assign(window, {
  WFContext, useWF, IMAGES, NAV, PHONE, STATS, SPECS, PROCESS, PILLARS, REVIEWS, PARTNERS,
  Icon, Ph, Stars, Btn, Tag, Section, Nav, TrustBar,
  SpecStacked, SpecCards, SpecGrid, ProcessBlock, AboutTeaser, PillarsBlock,
  ReviewsBlock, GalleryStrip, CtaBlock, PartnersBlock, Footer,
});
