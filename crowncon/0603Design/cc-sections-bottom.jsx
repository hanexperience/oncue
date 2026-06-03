/* ============================================================
   cc-sections-bottom.jsx — About, Pillars, Reviews, Gallery, CTA, Partners, Footer
   ============================================================ */

/* ---------------- ABOUT (Tim) ---------------- */
function About(){
  return (
    <section className="about">
      <div className="about-media reveal-img">
        <Ph img="living"/>
        <div className="about-cap"><span className="gd"/>Tim Swindon · On-site, every build</div>
      </div>
      <div className="about-panel">
        <Reveal><Eyebrow>Meet Tim</Eyebrow></Reveal>
        <div className="qmark" aria-hidden="true">“</div>
        <Reveal as="p" className="quote" delay={80}>
          I started Crowncon because I believed families deserved better than what volume
          builders were delivering. That belief hasn't changed.
        </Reveal>
        <Reveal className="about-sign" delay={160}>
          <span className="nm">Tim Swindon</span>
          <span className="rl">Director &amp; Builder</span>
        </Reveal>
        <Reveal as="p" className="body" delay={220} style={{ marginTop:24, maxWidth:'46ch' }}>
          A small, deliberately sized team. You'll never be handed off to a project manager
          you've never met — Tim answers the phone, and your home gets the attention it deserves.
        </Reveal>
        <Reveal delay={280} style={{ marginTop:30 }}>
          <TLink>Read Tim's Story</TLink>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- VALUE PILLARS ---------------- */
function Pillars(){
  return (
    <section className="section section--paper2">
      <div className="container">
        <div className="sec-head center">
          <Reveal><Eyebrow>Why Crowncon</Eyebrow></Reveal>
          <Reveal as="h2" className="h2" delay={80} style={{ marginTop:18 }}>
            Built on five things we <em>never compromise</em>
          </Reveal>
        </div>
        <Reveal>
          <div className="pillars">
            {PILLARS.map((p,i)=>(
              <div className="pillar" key={i} style={{ '--d':(i*70)+'ms' }}>
                <div className="pill-ic"><Icon name={p.ic}/></div>
                <h3 className="h3">{p.t}</h3>
                <p>{p.d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- REVIEWS ---------------- */
function Reviews(){
  return (
    <section className="section section--paper" id="reviews">
      <div className="container">
        <div className="sec-head">
          <div>
            <Reveal><Eyebrow>Reviews</Eyebrow></Reveal>
            <Reveal as="h2" className="h2" delay={80} style={{ marginTop:18 }}>
              Families who'd<br/><em>build with us again</em>
            </Reveal>
          </div>
          <Reveal delay={140} style={{ alignSelf:'end' }}>
            <div className="rev-summary">
              <span className="rev-score">5.0</span>
              <div>
                <GStars n={5}/>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
                  <GoogleLogo size={17}/>
                  <span style={{ fontFamily:'var(--sans)', fontSize:13, color:'var(--ink-soft)' }}>Based on 60+ Google reviews</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="reviews">
          {REVIEWS.map((r,i)=>(
            <Reveal key={i} delay={i*120}>
              <div className="review">
                <div className="rq" aria-hidden="true">“</div>
                <p>{r.q}</p>
                <div className="review-who">
                  <div className="review-av">{r.name.charAt(0)}</div>
                  <div style={{ flex:1 }}>
                    <div className="nm">{r.name}</div>
                    <div className="dt">{r.date}</div>
                  </div>
                  <GoogleLogo size={18}/>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="" delay={120} style={{ textAlign:'center', marginTop:46 }}>
          <a href="#" className="btn btn--ghost"><GoogleLogo size={16}/>&nbsp;&nbsp;Read all reviews on Google</a>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- GALLERY ---------------- */
function Gallery(){
  return (
    <section className="section section--paper2" id="work">
      <div className="container container--wide">
        <div className="sec-head">
          <div>
            <Reveal><Eyebrow>Our Work</Eyebrow></Reveal>
            <Reveal as="h2" className="h2" delay={80} style={{ marginTop:18 }}>
              Every home<br/><em>tells a story</em>
            </Reveal>
          </div>
          <Reveal delay={160} style={{ alignSelf:'end', justifySelf:'start' }}>
            <TLink>View All Projects</TLink>
          </Reveal>
        </div>

        <Reveal>
          <div className="gallery">
            {GALLERY.map((g,i)=>(
              <a key={i} className={'gcell zoomer '+g.cls} href="#">
                <Ph img={g.img}/>
                <div className="scrim"/>
                <span className="gcap">{g.cap}</span>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
function Cta(){
  return (
    <section className="section section--ink">
      <div className="container">
        <div className="cta">
          <Reveal><Eyebrow>Let's Begin</Eyebrow></Reveal>
          <Reveal as="h2" className="h2" delay={80} style={{ marginTop:20 }}>
            Ready to <em>build?</em>
          </Reveal>
          <Reveal as="p" className="lead" delay={160} style={{ marginTop:18 }}>
            Every great home starts with a conversation. Book a free 30-minute chat with Tim
            and let's talk about what's possible on your block.
          </Reveal>
          <Reveal className="cta-row" delay={240}>
            <Btn kind="spark" arrow>Book a Free Chat</Btn>
            <a href={'tel:'+PHONE.replace(/\s/g,'')} className="btn btn--on-dark">
              <Icon name="phone" style={{width:16,height:16}}/>&nbsp;{PHONE}
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- PARTNERS ---------------- */
function Partners(){
  return (
    <section className="section section--paper" style={{ paddingTop:'clamp(48px,6vw,72px)', paddingBottom:'clamp(48px,6vw,72px)' }}>
      <div className="container">
        <Reveal style={{ textAlign:'center', marginBottom:30 }}>
          <Eyebrow plain>Premium inclusions, as standard</Eyebrow>
        </Reveal>
        <Reveal>
          <div className="partners">
            {PARTNERS.map((p,i)=><span className="partner" key={i}>{p}</span>)}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */
function Footer(){
  const cols = [
    { h:null, brand:true },
    { h:'Explore', items:['About','Our Process','Designs','Projects','Reviews','Blog'] },
    { h:'Services', items:['Knockdown Rebuild','New Home Build','Development','Considered Series'] },
    { h:'Contact', items:[PHONE,'enquire@crowncon.com.au','11/6 Malibu Cct, Carrum Downs','Mon–Fri, 8am–4pm'] },
  ];
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {cols.map((c,i)=>(
            <div key={i}>
              {c.brand ? (
                <>
                  <div className="f-brand">Crown<span className="crown">Con</span></div>
                  <p className="f-blurb">Boutique custom builder for SE Bayside Melbourne families. Concept to keys, one team.</p>
                </>
              ) : (
                <>
                  <h4>{c.h}</h4>
                  <ul>{c.items.map((it,j)=><li key={j}><a href="#">{it}</a></li>)}</ul>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="footer-base">
          Registered Domestic Builder Unlimited DB-U 67572 · ACN 622 720 030 · © 2026 Crowncon Homes · Privacy · Terms
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { About, Pillars, Reviews, Gallery, Cta, Partners, Footer });
