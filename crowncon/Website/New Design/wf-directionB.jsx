/* ============================================================
   wf-directionB.jsx — "Full-bleed Cinematic"
   Transparent overlay nav · full-viewport hero · image cards · airy
   ============================================================ */
function HeroB(){
  return (
    <div style={{ position:'relative' }}>
      <Nav variant="overlay" />
      <div style={{ position:'relative', minHeight:'min(86vh,800px)' }}>
        <Ph img="deck" label="Full-bleed hero photograph" sub="finished home / aerial site" style={{ position:'absolute', inset:0, height:'100%', borderRadius:0 }}/>
        {/* readability scrim */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(22,34,46,.84) 0%, rgba(22,34,46,.22) 48%, rgba(22,34,46,.55) 100%)' }}/>
        <div className="sec-marker" style={{ color:'#e7d9bd' }}><span className="num">01</span><span>HERO — full-bleed</span></div>
        <div className="container" style={{ position:'relative', minHeight:'min(86vh,800px)', display:'flex', flexDirection:'column', justifyContent:'flex-end', paddingBottom:54, paddingTop:120 }}>
          <div style={{ maxWidth:760 }}>
            <div className="row"><Stars/><span style={{ color:'#f0e9da', fontFamily:'var(--sans)', fontSize:13, marginLeft:8 }}>5-Star Rated Builder · SE Bayside Melbourne</span></div>
            <h1 className="head mt16" style={{ color:'#fff', fontSize:'clamp(40px,6.2vw,78px)', maxWidth:900 }}>Your forever home, built the way it should be.</h1>
            <p className="mt20" style={{ color:'#e7e1d6', fontFamily:'var(--sans)', fontSize:'clamp(16px,1.6vw,20px)', maxWidth:600, lineHeight:1.6 }}>Boutique custom builder for SE Bayside families. We're alongside you from the first sketch to the day you move in.</p>
            <div className="row mt28">
              <Btn kind="primary" arrow>Book a Free Chat</Btn>
              <a href="#" className="btn btn--ghost" style={{ color:'#fff', borderColor:'rgba(255,255,255,.6)' }}>View Our Work</a>
            </div>
          </div>
          {/* floating stats card */}
          <div style={{ marginTop:38, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0, background:'rgba(248,245,240,.10)', border:'1.5px solid rgba(255,255,255,.22)', borderRadius:10, backdropFilter:'blur(4px)', overflow:'hidden', maxWidth:680 }}>
            {STATS.map((s,i) => (
              <div key={i} style={{ padding:'18px 20px', borderLeft:i?'1px solid rgba(255,255,255,.18)':'none' }}>
                <div className="head" style={{ color:'#fff', fontSize:26, lineHeight:1 }}>{s.n}</div>
                <div style={{ color:'#cfc9bd', fontFamily:'var(--sans)', fontSize:11.5, marginTop:6 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:680px){div[style*="repeat(4,1fr)"][style*="backdrop"]{grid-template-columns:repeat(2,1fr)!important}}`}</style>
    </div>
  );
}

function DirectionB(){
  return (
    <div className="d-airy">
      <HeroB/>

      {/* 02 TRUST STRIP — minimal */}
      <TrustBar tone="light" />

      {/* 03 SPECIALISATIONS — full-height image cards */}
      <Section n="03" label="SPECIALISATIONS — image cards" bg="warm">
        <div className="container center" style={{ maxWidth:620, margin:'0 auto 46px' }}>
          <Tag>What We Build</Tag>
          <h2 className="head mt16" style={{ fontSize:'clamp(30px,3.6vw,46px)' }}>Three ways to your forever home</h2>
        </div>
        <SpecCards/>
      </Section>

      {/* 04 PROCESS */}
      <Section n="04" label="PROCESS" bg="navy"><ProcessBlock cols={5}/></Section>

      {/* 05 ABOUT TEASER — Tim, full-bleed */}
      <div style={{ position:'relative' }}>
        <div className="sec-marker"><span className="num">05</span><span>ABOUT — Tim</span></div>
        <AboutTeaser variant="bleed"/>
      </div>

      {/* 06 VALUE PILLARS */}
      <Section n="06" label="VALUE PILLARS" bg="warm"><PillarsBlock/></Section>

      {/* 07 REVIEWS — feature quote */}
      <Section n="07" label="REVIEWS — feature" bg="off"><ReviewsBlock variant="feature"/></Section>

      {/* 08 GALLERY — edge to edge */}
      <Section n="08" label="GALLERY" bg="warm" style={{ paddingBottom:0 }}>
        <div className="container center" style={{ marginBottom:38 }}>
          <Tag>Our Work</Tag>
          <h2 className="head mt16" style={{ fontSize:'clamp(28px,3.4vw,42px)' }}>Every home tells a story</h2>
        </div>
        <GalleryStrip variant="bleed"/>
      </Section>

      {/* 09 CTA */}
      <Section n="09" label="CTA" bg="navy"><CtaBlock/></Section>

      {/* 10 PARTNERS */}
      <Section n="10" label="PARTNERS" bg="warm" style={{ paddingTop:54, paddingBottom:54 }}><PartnersBlock/></Section>

      <Footer/>
    </div>
  );
}
window.DirectionB = DirectionB;
