/* ============================================================
   cc-sections-top.jsx — Nav, Hero, TrustBar, Specs, Process
   ============================================================ */

/* ---------------- NAV ---------------- */
function Nav(){
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(()=>{
    const onScroll = ()=> setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
    return ()=>window.removeEventListener('scroll', onScroll);
  },[]);
  const Burger = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      {open ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            : <><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></>}
    </svg>
  );
  return (
    <header className={'nav '+(solid?'nav--solid':'nav--top')}>
      <div className="container nav-inner">
        <a href="#top" className="logo">Crown<span className="crown">Con</span></a>
        <nav>
          <ul className="nav-links">
            {NAV.map(x => <li key={x}><a href="#">{x}</a></li>)}
          </ul>
        </nav>
        <div className="nav-right">
          <a href={'tel:'+PHONE.replace(/\s/g,'')} className="nav-phone"><Icon name="phone" style={{width:15,height:15}}/>{PHONE}</a>
          <Btn kind="spark" arrow>Book a Free Chat</Btn>
        </div>
        <button className="nav-burger" aria-label="Menu" onClick={()=>setOpen(!open)}><Burger/></button>
      </div>
      <div className={'nav-mobile'+(open?' open':'')}>
        <div className="container">
          {NAV.map(x => <a href="#" key={x} onClick={()=>setOpen(false)}>{x}</a>)}
          <div className="nav-mobile-cta"><Btn kind="spark" arrow>Book a Free Chat</Btn></div>
        </div>
      </div>
    </header>
  );
}

/* ---------------- HERO ---------------- */
function StatNum({ stat }){
  // parse numeric portion for count-up; keep decimals for 5.0
  const isDecimal = stat.n.includes('.');
  const target = parseFloat(stat.n);
  const [val, ref] = useCountUp(target, { duration:1600 });
  const shown = isDecimal ? val.toFixed(1) : Math.round(val).toString();
  return (
    <span ref={ref} className="n">
      {shown}<span className={stat.spark?'spark':''}>{stat.suffix}</span>
    </span>
  );
}

function Hero(){
  return (
    <section className="hero" id="top">
      <div className="hero-media">
        <Ph img="deck" frame={true}/>
        <div className="hero-scrim"/>
      </div>
      <div className="hero-frame"/>
      <div className="hero-side">Est. 2017 · SE Bayside Melbourne</div>

      <div className="hero-body">
        <div className="container">
          <Reveal className="" delay={80}><Eyebrow>Boutique Custom Home Builder</Eyebrow></Reveal>
          <Reveal as="h1" className="display" delay={180}>
            Custom homes built<br/>around the <em>lives you live.</em>
          </Reveal>
          <Reveal as="p" className="hero-lead" delay={320}>
            A boutique builder for SE Bayside families. Fixed price, premium inclusions —
            and one team alongside you from first sketch to the day you get the keys.
          </Reveal>
          <Reveal className="hero-cta" delay={440}>
            <Btn kind="spark" arrow>Book a Free Chat</Btn>
            <a href="#work" className="btn btn--on-dark">View Our Work</a>
          </Reveal>
        </div>
      </div>

      <a href="#build" className="hero-cue" aria-label="Scroll">
        <span className="tx">Scroll</span>
        <span className="ln"/>
      </a>

      <div className="hero-ribbon">
        <div className="container">
          {STATS.map((s,i)=>(
            <div className="rib" key={i}>
              <StatNum stat={s}/>
              <div className="l">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- TRUST BAR ---------------- */
function TrustBar(){
  const items = ['Registered Builder DB-U 67572','ACN 622 720 030','Est. 2017','Serving SE Bayside Melbourne'];
  return (
    <div className="trust">
      <div className="container">
        {items.map((x,i)=>(
          <span key={i}>{x}{i<items.length-1 && <span className="dot">✦</span>}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- SPECIALISATIONS ---------------- */
function Specs(){
  return (
    <section className="section section--paper" id="build">
      <div className="container">
        <div className="sec-head">
          <div>
            <Reveal><Eyebrow>What We Build</Eyebrow></Reveal>
            <Reveal as="h2" className="h2" delay={80} style={{ marginTop:18 }}>
              Three ways to your<br/><em>forever home</em>
            </Reveal>
          </div>
          <Reveal as="p" className="lead" delay={160}>
            Whatever your starting point, the same builder-led process applies — early budgets,
            fixed scope, and Tim across every detail.
          </Reveal>
        </div>

        <div className="specs">
          {SPECS.map((s,i)=>(
            <Reveal key={i} delay={i*120}>
              <a className="spec" href="#">
                <div className="spec-img zoomer">
                  <Ph img={s.img}/>
                  <div className="scrim"/>
                  <span className="spec-num">0{i+1}</span>
                </div>
                <div className="spec-body">
                  <h3 className="h3">{s.tag}</h3>
                  <p>{s.body}</p>
                  <span className="more">Learn More <Icon name="arrow" className="arr" style={{width:14,height:14}}/></span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- PROCESS (timeline) ---------------- */
function Process(){
  const ref = useRef(null);
  useEffect(()=>{
    const el = ref.current; if(!el) return;
    if(!('IntersectionObserver' in window)){ el.classList.add('in'); el.querySelectorAll('.tstep').forEach(s=>s.classList.add('lit')); return; }
    const io = new IntersectionObserver((ents)=>{
      ents.forEach(e=>{
        if(e.isIntersecting){
          el.classList.add('in');
          const steps = el.querySelectorAll('.tstep');
          steps.forEach((s,i)=> setTimeout(()=>s.classList.add('lit'), 300 + i*240));
          io.unobserve(el);
        }
      });
    },{ threshold:0.3 });
    io.observe(el);
    return ()=>io.disconnect();
  },[]);
  return (
    <section className="section section--ink">
      <div className="container">
        <div className="sec-head">
          <div>
            <Reveal><Eyebrow>Our Process</Eyebrow></Reveal>
            <Reveal as="h2" className="h2" delay={80} style={{ marginTop:18 }}>
              Concept to keys,<br/><em>one team</em>
            </Reveal>
          </div>
          <Reveal as="p" className="lead" delay={160}>
            Every Crowncon build follows the same demystified path — so you always know
            what's happening, and what's next.
          </Reveal>
        </div>

        <div className="timeline" ref={ref}>
          <div className="timeline-fill"/>
          {PROCESS.map((p,i)=>(
            <div className="tstep" key={i}>
              <div className="node"/>
              <div className="tnum">{p.n}</div>
              <h3 className="h3">{p.t}</h3>
              <p>{p.d}</p>
            </div>
          ))}
        </div>

        <Reveal style={{ marginTop:54 }} delay={120}>
          <Btn kind="spark" arrow>Book a Free Chat</Btn>
        </Reveal>
      </div>
    </section>
  );
}

Object.assign(window, { Nav, Hero, TrustBar, Specs, Process });
