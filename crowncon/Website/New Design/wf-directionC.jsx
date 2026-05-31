/* ============================================================
   wf-directionC.jsx — "Restrained / Structured"
   Minimal nav · contained navy hero · icon-row services · dense
   ============================================================ */
function HeroC(){
  return (
    <Section n="01" label="HERO — restrained" bg="navy" style={{ paddingTop:54, paddingBottom:54 }}>
      <div className="container">
        <div className="split" style={{ gridTemplateColumns:'1.15fr 1fr', gap:54, alignItems:'center' }}>
          <div>
            <div className="row"><Stars/><span style={{ color:'#e7d9bd', fontFamily:'var(--sans)', fontSize:13, marginLeft:8 }}>5-Star Rated · Est. 2017</span></div>
            <h1 className="head mt16" style={{ color:'#fff', fontSize:'clamp(34px,4.6vw,56px)' }}>Your forever home, built the way it should be.</h1>
            <p className="mt16" style={{ color:'#cfc9bd', fontFamily:'var(--sans)', fontSize:17, lineHeight:1.6, maxWidth:520 }}>Boutique custom builder for SE Bayside Melbourne families — alongside you from first sketch to the day you move in.</p>
            <div className="row mt28">
              <Btn kind="primary" arrow>Book a Free Chat</Btn>
              <a href="#" className="btn btn--ghost" style={{ color:'#fff', borderColor:'rgba(255,255,255,.55)' }}>View Our Work</a>
            </div>
          </div>
          <div>
            <Ph img="deck" label="Supporting image" sub="restrained, not full-bleed" style={{ aspectRatio:'16/10', borderRadius:8 }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, marginTop:14, background:'rgba(255,255,255,.16)', border:'1px solid rgba(255,255,255,.18)', borderRadius:9, overflow:'hidden' }}>
              {STATS.map((s,i) => (
                <div key={i} style={{ padding:'16px 18px', background:'var(--navy)' }}>
                  <div className="head" style={{ color:'#fff', fontSize:24, lineHeight:1 }}>{s.n}</div>
                  <div style={{ color:'#b9b2a4', fontFamily:'var(--sans)', fontSize:11.5, marginTop:5 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function DirectionC(){
  return (
    <div className="d-dense">
      <Nav variant="minimal" />
      <HeroC/>

      {/* 02 TRUST BAR — prominent */}
      <TrustBar tone="light" />

      {/* 03 SPECIALISATIONS — icon rows */}
      <Section n="03" label="SPECIALISATIONS — structured" bg="warm"><SpecGrid/></Section>

      {/* 04 PROCESS */}
      <Section n="04" label="PROCESS" bg="navy"><ProcessBlock cols={5}/></Section>

      {/* 05 ABOUT — compact */}
      <Section n="05" label="ABOUT — Tim" bg="off"><AboutTeaser variant="compact"/></Section>

      {/* 06 VALUE PILLARS — compact */}
      <Section n="06" label="VALUE PILLARS" bg="warm"><PillarsBlock compact={true}/></Section>

      {/* 07 REVIEWS */}
      <Section n="07" label="REVIEWS" bg="off"><ReviewsBlock variant="cols"/></Section>

      {/* 08 GALLERY — compact grid */}
      <Section n="08" label="GALLERY" bg="warm">
        <div className="container" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28, gap:20, flexWrap:'wrap' }}>
          <div>
            <Tag>Our Work</Tag>
            <h2 className="head mt12" style={{ fontSize:'clamp(24px,3vw,34px)' }}>Recent projects</h2>
          </div>
          <a href="#" style={{ fontFamily:'var(--sans)', fontWeight:700, fontSize:13, color:'var(--accent-ink)', textDecoration:'none' }}>View All Projects →</a>
        </div>
        <GalleryStrip variant="strip"/>
      </Section>

      {/* 09 CTA */}
      <Section n="09" label="CTA" bg="navy" style={{ paddingTop:60, paddingBottom:60 }}><CtaBlock/></Section>

      {/* 10 PARTNERS */}
      <Section n="10" label="PARTNERS" bg="off" style={{ paddingTop:44, paddingBottom:44 }}><PartnersBlock/></Section>

      <Footer/>
    </div>
  );
}
window.DirectionC = DirectionC;
