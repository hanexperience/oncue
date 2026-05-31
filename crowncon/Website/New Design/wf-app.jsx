/* ============================================================
   wf-app.jsx — shell: direction tabs + Tweaks panel
   ============================================================ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "A",
  "photos": true,
  "accent": "#C4A882",
  "headingFont": "Editorial"
}/*EDITMODE-END*/;

const DIRECTIONS = [
  { id:'A', name:'Editorial Split',     note:'classic nav · warm' },
  { id:'B', name:'Full-bleed Cinematic', note:'overlay nav · airy' },
  { id:'C', name:'Restrained',          note:'minimal nav · structured' },
];

function Toolbar({ t, setTweak }){
  const pick = (id) => { setTweak('direction', id); window.scrollTo({ top:0 }); };
  return (
    <div style={{
      position:'sticky', top:0, zIndex:120,
      background:'rgba(244,240,233,.95)', backdropFilter:'blur(6px)',
      borderBottom:'2px dashed var(--ink-strong)'
    }}>
      <div style={{ maxWidth:1240, margin:'0 auto', padding:'9px 24px', display:'flex', alignItems:'center', gap:'10px 18px', flexWrap:'wrap' }}>
        <span style={{ fontFamily:'var(--hand)', fontSize:20, color:'var(--navy)', transform:'rotate(-1deg)', whiteSpace:'nowrap' }}>
          CrownCon <span style={{ color:'var(--accent-ink)' }}>·</span> homepage wireframes
        </span>

        <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginLeft:'auto' }}>
          {DIRECTIONS.map(d => {
            const on = t.direction === d.id;
            return (
              <button key={d.id} onClick={() => pick(d.id)} title={d.note} style={{
                cursor:'pointer', textAlign:'left', borderRadius:8, padding:'7px 12px',
                border: on ? '2px solid var(--accent)' : '2px dashed var(--ink)',
                background: on ? 'var(--accent)' : 'rgba(255,255,255,.5)',
                color: on ? '#241c08' : 'var(--navy)', transition:'all .15s',
                display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap',
              }}>
                <span style={{
                  fontFamily:'var(--head)', fontWeight:700, fontSize:14,
                  width:22, height:22, borderRadius:'50%', display:'grid', placeItems:'center',
                  background: on ? 'rgba(36,28,8,.15)' : 'var(--sand-light)', color: on ? '#241c08' : 'var(--accent-ink)',
                }}>{d.id}</span>
                <span style={{ fontFamily:'var(--sans)', fontWeight:700, fontSize:12.5 }}>{d.name}</span>
              </button>
            );
          })}
        </div>

        <span style={{ fontFamily:'var(--hand)', fontSize:14, color:'var(--ink-strong)', transform:'rotate(-1deg)', whiteSpace:'nowrap' }}>
          ⚙ Tweaks → photos · palette · type
        </span>
      </div>
    </div>
  );
}

function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const accentInk = t.accent === '#B8943C' ? '#7c5e1e' : '#7a6128';
  const headVar = t.headingFont === 'Clean' ? 'var(--sans)' : 'var(--serif)';
  const rootStyle = { '--accent': t.accent, '--accent-ink': accentInk, '--head': headVar };
  const Dir = { A:DirectionA, B:DirectionB, C:DirectionC }[t.direction] || DirectionA;

  return (
    <WFContext.Provider value={{ photos: t.photos }}>
      <div className="wf-root" style={rootStyle}>
        <Toolbar t={t} setTweak={setTweak} />
        <Dir/>

        <TweaksPanel title="Tweaks">
          <TweakSection label="Direction" />
          <TweakRadio label="Homepage" value={t.direction} options={['A','B','C']}
                      onChange={(v)=>{ setTweak('direction', v); window.scrollTo({top:0}); }} />

          <TweakSection label="Fidelity" />
          <TweakToggle label="Real photos" value={t.photos}
                       onChange={(v)=>setTweak('photos', v)} />

          <TweakSection label="Palette accent" />
          <TweakColor label="Accent" value={t.accent}
                      options={['#C4A882','#B8943C']}
                      onChange={(v)=>setTweak('accent', v)} />

          <TweakSection label="Headings" />
          <TweakRadio label="Type feel" value={t.headingFont}
                      options={['Editorial','Clean']}
                      onChange={(v)=>setTweak('headingFont', v)} />
        </TweaksPanel>
      </div>
    </WFContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
