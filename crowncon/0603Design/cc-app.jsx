/* ============================================================
   cc-app.jsx — root, tweaks, bootstrap
   ============================================================ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "texture": true,
  "motion": true,
  "accent": ["#b8a87a", "#8a7c58"],
  "density": "comfortable"
}/*EDITMODE-END*/;

const ACCENTS = [
  ["#b8a87a", "#8a7c58"], // brass (default)
  ["#cfc5ac", "#7a7158"], // sand gold
  ["#a89668", "#7c6e44"], // antique gold
  ["#9a9382", "#6c665a"], // warm taupe
];

function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // root flags
  const rootCls = [
    t.texture ? '' : 'no-texture',
    t.motion ? '' : 'no-motion',
  ].filter(Boolean).join(' ');

  // density -> section padding scale + gutter
  const dens = {
    compact:      { sec:'clamp(54px,6.5vw,92px)' },
    comfortable:  { sec:'clamp(72px,9vw,128px)' },
    spacious:     { sec:'clamp(92px,11vw,160px)' },
  }[t.density] || {};

  const accent = Array.isArray(t.accent) ? t.accent : ACCENTS[0];

  return (
    <div className={'wrap '+rootCls}
         style={{ '--accent':accent[0], '--accent-ink':accent[1], '--gold':accent[0], '--gold-ink':accent[1] }}>
      <style>{`.section{ padding-top:${dens.sec||'clamp(72px,9vw,128px)'}; padding-bottom:${dens.sec||'clamp(72px,9vw,128px)'}; }`}</style>

      <Nav/>
      <main>
        <Hero/>
        <TrustBar/>
        <Specs/>
        <Process/>
        <About/>
        <Pillars/>
        <Reviews/>
        <Gallery/>
        <Cta/>
        <Partners/>
      </main>
      <Footer/>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Atmosphere"/>
        <TweakToggle label="Paper texture" value={t.texture} onChange={(v)=>setTweak('texture', v)}/>
        <TweakToggle label="Motion & reveals" value={t.motion} onChange={(v)=>setTweak('motion', v)}/>

        <TweakSection label="Palette"/>
        <TweakColor label="Gold accent" value={t.accent} options={ACCENTS}
                    onChange={(v)=>setTweak('accent', v)}/>

        <TweakSection label="Layout"/>
        <TweakRadio label="Density" value={t.density}
                    options={['compact','comfortable','spacious']}
                    onChange={(v)=>setTweak('density', v)}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
