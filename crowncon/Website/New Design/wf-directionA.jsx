/* ============================================================
   wf-directionA.jsx — "Editorial Split"
   Classic nav · 50/50 hero · alternating service rows · balanced density
   ============================================================ */
function StatInline(){
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'18px 30px', marginTop:30 }}>
      {STATS.map((s,i) => (
        <div className="stat" key={i} style={{ display:'flex', alignItems:'center', gap:30 }}>
          <div>
            <div className="n" style={{ fontSize:30 }}>{s.n}</div>
            <div className="l">{s.l}</div>
          </div>
          {i<STATS.length-1 && <span style={{ width:1, height:34, background:'var(--sand-light)' }}/>}
        </div>
      ))}
    </div>
  );
}

function DirectionA(){
  return (
    <div className="d-balanced">
      <Nav variant="classic" />

      {/* 01 HERO — editorial split */}
      <Section n="01" label="HERO — editorial split" bg="warm" style={{ paddingTop:56 }}>
        <div className="container">
          <div className="split" style={{ gap:56 }}>
            <div>
              <div className="row"><Stars/><span className="rate-txt">5-Star Rated Builder</span></div>
              <h1 className="head mt16" style={{ fontSize:'clamp(36px,5vw,62px)' }}>Your forever home, built the way it should be.</h1>
              <p className="body mt20" style={{ fontSize:18, maxWidth:520 }}>Crowncon Homes — boutique custom builder for SE Bayside Melbourne families. We work alongside you from the first sketch to the day you move in.</p>
              <div className="row mt28">
                <Btn kind="primary" arrow>Book a Free Chat</Btn>
                <Btn kind="ghost">View Our Work</Btn>
              </div>
              <StatInline/>
            </div>
            <Ph img="deck" label="Hero — finished home" sub="cinematic exterior" style={{ aspectRatio:'4/4.6' }}/>
          </div>
        </div>
      </Section>

      {/* 02 TRUST BAR */}
      <TrustBar tone="navy" />

      {/* 03 SPECIALISATIONS — alternating rows */}
      <Section n="03" label="SPECIALISATIONS" bg="off"><SpecStacked/></Section>

      {/* 04 PROCESS */}
      <Section n="04" label="PROCESS" bg="navy"><ProcessBlock cols={5}/></Section>

      {/* 05 ABOUT TEASER — Tim */}
      <Section n="05" label="ABOUT TEASER — Tim" bg="warm"><AboutTeaser variant="split"/></Section>

      {/* 06 VALUE PILLARS */}
      <Section n="06" label="VALUE PILLARS" bg="off"><PillarsBlock/></Section>

      {/* 07 REVIEWS */}
      <Section n="07" label="REVIEWS" bg="warm"><ReviewsBlock variant="cols"/></Section>

      {/* 08 GALLERY STRIP */}
      <Section n="08" label="GALLERY STRIP" bg="sandlight"><GalleryStrip variant="strip"/></Section>

      {/* 09 CTA */}
      <Section n="09" label="CTA" bg="navy"><CtaBlock/></Section>

      {/* 10 PARTNERS */}
      <Section n="10" label="PARTNERS" bg="warm" style={{ paddingTop:48, paddingBottom:48 }}><PartnersBlock/></Section>

      {/* 11 FOOTER */}
      <Footer/>
    </div>
  );
}
window.DirectionA = DirectionA;
