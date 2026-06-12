import { useState, useMemo } from 'react'
import {
  generatePrograms, oppReasons, TODAY, TODAY_DT,
  GEO_DIST, SRC_DIST, SRC_CARDS, TREND_DATA, ALERTS, NEXT_STEPS, SOURCES,
} from './data.js'

// ── Design tokens ──────────────────────────────────────────
const C = {
  bg: '#060608', surface: '#0c0c0f', border: 'rgba(255,255,255,0.06)',
  borderFaint: 'rgba(255,255,255,0.04)', text: '#ffffff', muted: '#71717a',
  faint: '#3f3f46', vfaint: '#27272a', accent: '#7c3aed', accentLight: '#a78bfa',
  green: '#22c55e', amber: '#f59e0b', red: '#ef4444',
}

// ── Helpers ───────────────────────────────────────────────
const addDays = (base, n) => {
  const d = new Date(base); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10);
}
const WEEK_AGO = addDays(TODAY, -7);

const statusColor = (s) => ({
  New:       { bg:'rgba(139,92,246,.14)', c:'#a78bfa', b:'rgba(139,92,246,.22)' },
  'To Verify':{ bg:'rgba(245,158,11,.11)', c:'#f59e0b', b:'rgba(245,158,11,.18)' },
  Verified:  { bg:'rgba(34,197,94,.09)',  c:'#22c55e', b:'rgba(34,197,94,.18)'  },
  Rejected:  { bg:'rgba(239,68,68,.09)',  c:'#ef4444', b:'rgba(239,68,68,.18)'  },
})[s] || { bg:'rgba(139,92,246,.14)', c:'#a78bfa', b:'rgba(139,92,246,.22)' }

const riskColor  = (v) => v >= 65 ? C.red   : v >= 38 ? C.amber : C.green
const oppColor   = (v) => v >= 68 ? C.green : v >= 52 ? C.amber : C.muted
const relColor   = (v) => v >= 90 ? C.green : v >= 78 ? C.amber : C.red

// ── Shared components ──────────────────────────────────────
function Badge({ status }) {
  const sc = statusColor(status)
  return (
    <span style={{
      fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:20,
      background: sc.bg, color: sc.c, border:`1px solid ${sc.b}`,
      letterSpacing:'.04em', whiteSpace:'nowrap',
    }}>{status.toUpperCase()}</span>
  )
}

function SecLabel({ children, style }) {
  return (
    <div style={{
      fontSize:10, fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase',
      color: C.faint, marginBottom:20, display:'flex', alignItems:'center', gap:10, ...style,
    }}>
      {children}
      <div style={{ flex:1, height:1, background: C.borderFaint }} />
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.surface, border:`1px solid ${C.border}`, borderRadius:14,
      padding:'22px 24px', ...style,
    }}>{children}</div>
  )
}

// ── Bar chart row ──────────────────────────────────────────
function BarRow({ label, value, max, color = C.accent }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:11 }}>
      <div style={{ fontSize:12, color: C.muted, width:90, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{label}</div>
      <div style={{ flex:1, height:4, background: C.borderFaint, borderRadius:2 }}>
        <div style={{ height:4, width:`${Math.round(value/max*100)}%`, background: color, borderRadius:2 }} />
      </div>
      <div style={{ fontSize:12, color:'#a1a1aa', fontWeight:600, width:18, textAlign:'right' }}>{value}</div>
    </div>
  )
}

// ── Sparkline ──────────────────────────────────────────────
function Sparkline({ data }) {
  const max = Math.max(...data.map(d => d.count))
  const total = data.reduce((a,d) => a+d.count, 0)
  const avg7  = (data.slice(-7).reduce((a,d) => a+d.count,0)/7).toFixed(1)
  const avg7p = (data.slice(-14,-7).reduce((a,d) => a+d.count,0)/7).toFixed(1)
  const delta = (avg7 - avg7p).toFixed(1)
  const dc    = delta >= 0 ? C.green : C.red
  return (
    <Card>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color: C.faint, marginBottom:6 }}>New Launches · Last 30 Days</div>
      <div style={{ fontSize:30, fontWeight:800, color: C.text, letterSpacing:-1, marginBottom:4 }}>{total}</div>
      <div style={{ fontSize:12, color: C.muted, marginBottom:18 }}>
        7-day avg: <span style={{ color:'#a1a1aa' }}>{avg7}/day</span>&nbsp;
        <span style={{ color: dc }}>{delta >= 0 ? '+' : ''}{delta} vs prior week</span>
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:64, borderBottom:`1px solid ${C.borderFaint}` }}>
        {data.map((d,i) => (
          <div key={i} title={`${d.date}: ${d.count}`} style={{
            flex:1, background:`linear-gradient(180deg,rgba(124,58,237,0.65),rgba(124,58,237,0.15))`,
            height: `${Math.round(d.count/max*56)+4}px`, borderRadius:'2px 2px 0 0', minWidth:5,
          }} />
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
        <span style={{ fontSize:10, color:'#2e2e35' }}>May 13</span>
        <span style={{ fontSize:10, color:'#2e2e35' }}>Jun 12</span>
      </div>
    </Card>
  )
}

// ── Opportunity card ───────────────────────────────────────
function OppCard({ row }) {
  const { reasons, riskReasons } = oppReasons(row)
  const urgency = row.Priority === 'High' ? 'Review onboarding within 24h' : 'Schedule review this week'
  const urgencyC = row.Priority === 'High' ? C.red : C.amber
  const geos = (row.GEO || '').split(',').slice(0,3).map(g => g.trim())
  const ov = row.Opp, rv = row.Risk
  return (
    <Card style={{ padding:'26px 30px', marginBottom:12, display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1.6fr', gap:28, alignItems:'start' }}>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <span style={{ fontSize:16, fontWeight:700, color: C.text }}>{row.Name}</span>
          <Badge status={row.Status} />
        </div>
        <div style={{ fontSize:12, color: C.faint, marginBottom:10 }}>{row.Source} · Detected {row['Date Detected']}</div>
        <div style={{ marginBottom:10 }}>
          {geos.map(g => <span key={g} style={{ fontSize:11, padding:'3px 8px', borderRadius:5, background:'rgba(255,255,255,0.04)', color: C.muted, marginRight:5 }}>{g}</span>)}
        </div>
        <div style={{ fontSize:12, color: C.muted }}>{row.Commission} · {row.License}</div>
      </div>
      <div>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color: C.faint, marginBottom:8 }}>Opportunity</div>
        <div style={{ fontSize:36, fontWeight:800, color: oppColor(ov), letterSpacing:-1, marginBottom:2 }}>{ov}</div>
        <div style={{ fontSize:10, color: C.faint, marginBottom:10 }}>/ 100</div>
        <div style={{ fontSize:10, fontWeight:600, color: C.faint, marginBottom:5, textTransform:'uppercase', letterSpacing:'.08em' }}>Based on:</div>
        {reasons.map((r,i) => (
          <div key={i} style={{ fontSize:11, color: C.muted, marginBottom:3, display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ color: C.green, fontSize:9 }}>✓</span>{r}
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color: C.faint, marginBottom:8 }}>Risk</div>
        <div style={{ fontSize:36, fontWeight:800, color: riskColor(rv), letterSpacing:-1, marginBottom:2 }}>{rv}</div>
        <div style={{ fontSize:10, color: C.faint, marginBottom:10 }}>/ 100</div>
        <div style={{ fontSize:10, fontWeight:600, color: C.faint, marginBottom:5, textTransform:'uppercase', letterSpacing:'.08em' }}>Based on:</div>
        {riskReasons.map((r,i) => (
          <div key={i} style={{ fontSize:11, color: C.muted, marginBottom:3, display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ color: C.faint, fontSize:9 }}>·</span>{r}
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color: C.faint, marginBottom:8 }}>Notes</div>
        <div style={{ fontSize:12, color: C.muted, lineHeight:1.6, marginBottom:14 }}>{row.Notes}</div>
        <div style={{ fontSize:12, fontWeight:600, color: urgencyC, background:'rgba(255,255,255,0.02)', borderRadius:6, padding:'8px 12px', borderLeft:`2px solid ${urgencyC}` }}>
          → {urgency}
        </div>
      </div>
    </Card>
  )
}

// ── Alert card ─────────────────────────────────────────────
function AlertCard({ a }) {
  return (
    <div style={{ background: a.bg, border:`1px solid ${a.border}`, borderTop:`2px solid ${a.top}`, borderRadius:14, padding:22 }}>
      <div style={{ marginBottom:14 }}>
        <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:4, background: a.bg, color: a.ac, border:`1px solid ${a.border}`, letterSpacing:'.08em' }}>{a.label}</span>
      </div>
      <div style={{ fontSize:14, fontWeight:700, color: C.text, marginBottom:5 }}>{a.title}</div>
      <div style={{ fontSize:12, color: C.muted, marginBottom:16 }}>{a.prog} · {a.src}</div>
      {[['Signal',a.signal],['Evidence',a.evidence],['Impact',a.impact]].map(([lbl,txt]) => (
        <div key={lbl} style={{ marginBottom:10 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color: C.faint, marginBottom:4 }}>{lbl}</div>
          <div style={{ fontSize:12, color:'#a1a1aa', lineHeight:1.6 }}>{txt}</div>
        </div>
      ))}
      <div style={{ borderTop:`1px solid ${C.borderFaint}`, paddingTop:12, fontSize:12, fontWeight:600, color: a.rec_c }}>→ {a.rec}</div>
    </div>
  )
}

// ── Database table ─────────────────────────────────────────
function DatabaseTab({ programs }) {
  const [search, setSearch]   = useState('')
  const [statusF, setStatusF] = useState('All')
  const [prioF,   setPrioF]   = useState('All')
  const [srcF,    setSrcF]    = useState('All')
  const [geoF,    setGeoF]    = useState('All')
  const [page,    setPage]    = useState(0)
  const RPP = 20

  const filtered = useMemo(() => {
    return programs.filter(r => {
      if (search && !r.Name.toLowerCase().includes(search.toLowerCase())) return false
      if (statusF !== 'All' && r.Status !== statusF) return false
      if (prioF   !== 'All' && r.Priority !== prioF) return false
      if (srcF    !== 'All' && r.Source !== srcF) return false
      if (geoF    !== 'All' && !r.GEO.includes(geoF)) return false
      return true
    }).sort((a,b) => b['Date Detected'].localeCompare(a['Date Detected']))
  }, [programs, search, statusF, prioF, srcF, geoF])

  const totalPages = Math.max(1, Math.ceil(filtered.length / RPP))
  const safePage   = Math.min(page, totalPages - 1)
  const pageRows   = filtered.slice(safePage * RPP, (safePage + 1) * RPP)

  const allGeos = useMemo(() => {
    const s = new Set()
    programs.forEach(r => r.GEO.split(',').forEach(g => s.add(g.trim())))
    return ['All', ...Array.from(s).sort()]
  }, [programs])

  const exportCsv = () => {
    const cols = ['Name','Date Detected','Source','GEO','License','Commission','Status','Priority','Opp','Risk','Notes']
    const rows = [cols.join(','), ...filtered.map(r => cols.map(c => `"${r[c] ?? ''}"`).join(','))]
    const blob = new Blob([rows.join('\n')], { type:'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `programs_${TODAY}.csv`; a.click()
  }

  const sel = { background: C.surface, border:`1px solid ${C.border}`, borderRadius:8, color: C.text, padding:'8px 12px', fontSize:13, outline:'none', cursor:'pointer' }
  const thS = { padding:'11px 16px', textAlign:'left', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'#2e2e35', whiteSpace:'nowrap', background:'#0d0d11' }
  const tdS = { padding:'13px 16px', fontSize:13, borderBottom:`1px solid ${C.borderFaint}` }

  return (
    <div>
      <SecLabel style={{ marginTop:8 }}>Affiliate Programs Database</SecLabel>

      {/* Filters */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:16 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search program…"
          style={{ ...sel, padding:'9px 14px' }} />
        {[
          [statusF, setStatusF, ['All','New','To Verify','Verified','Rejected']],
          [prioF,   setPrioF,   ['All','High','Medium','Low']],
          [srcF,    setSrcF,    ['All', ...SOURCES]],
          [geoF,    setGeoF,    allGeos],
        ].map(([val, set, opts], i) => (
          <select key={i} value={val} onChange={e => { set(e.target.value); setPage(0) }} style={sel}>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <span style={{ fontSize:13, color: C.faint }}>
          Showing <strong style={{ color:'#71717a' }}>{filtered.length}</strong> of <strong style={{ color:'#71717a' }}>{programs.length}</strong>
          &nbsp;·&nbsp; Page {safePage+1}/{totalPages}
        </span>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={exportCsv} style={{ ...sel, cursor:'pointer', fontSize:12, padding:'6px 14px' }}>⬇ Export CSV</button>
          <button disabled={safePage === 0} onClick={() => setPage(p => p-1)} style={{ ...sel, cursor:'pointer', opacity: safePage===0?.4:1 }}>◀</button>
          <button disabled={safePage >= totalPages-1} onClick={() => setPage(p => p+1)} style={{ ...sel, cursor:'pointer', opacity: safePage>=totalPages-1?.4:1 }}>▶</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX:'auto', borderRadius:12, border:`1px solid ${C.border}` }}>
        <table style={{ background: C.surface }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {['Program','Detected','Source','GEO','License','Commission','Status','Opp','Risk'].map(h => (
                <th key={h} style={thS}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={r.id} style={{ background: i%2===1 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                <td style={{ ...tdS, color: C.text, fontWeight:500 }}>{r.Name}</td>
                <td style={{ ...tdS, color: C.muted, whiteSpace:'nowrap' }}>{r['Date Detected']}</td>
                <td style={{ ...tdS, color: C.muted }}>{r.Source}</td>
                <td style={{ ...tdS, color: C.muted }}>{r.GEO}</td>
                <td style={{ ...tdS, color: C.muted }}>{r.License}</td>
                <td style={{ ...tdS, color: C.muted }}>{r.Commission}</td>
                <td style={tdS}><Badge status={r.Status} /></td>
                <td style={{ ...tdS, fontWeight:700, color: oppColor(r.Opp) }}>{r.Opp}</td>
                <td style={{ ...tdS, fontWeight:700, color: riskColor(r.Risk) }}>{r.Risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Intelligence Brief tab ─────────────────────────────────
function IntelligenceTab({ programs, metrics }) {
  const { total, newWk, opps, critRisk, toVer, unkLic } = metrics
  const topOps = useMemo(() => [...programs].filter(r => r.Opp >= 60).sort((a,b) => b.Opp - a.Opp).slice(0,3), [programs])

  return (
    <div>
      {/* Hero */}
      <div style={{ padding:'44px 0 36px' }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.2em', textTransform:'uppercase', color:'#4b21a0', marginBottom:14 }}>
          EXECUTIVE INTELLIGENCE BRIEF · {new Date(TODAY).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).toUpperCase()}
        </div>
        <div style={{ fontSize:40, fontWeight:800, letterSpacing:-1.5, lineHeight:1.15, color: C.text, marginBottom:8 }}>
          This week in the<br />
          <span style={{ background:'linear-gradient(90deg,#a78bfa,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            iGaming affiliate ecosystem
          </span>
        </div>
        <div style={{ fontSize:15, color: C.muted, marginTop:12 }}>
          {newWk} new programs detected across {SRC_CARDS.length} monitored sources
        </div>
      </div>

      {/* Hero metrics grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:1, background: C.borderFaint, borderRadius:14, overflow:'hidden', marginBottom:44 }}>
        {[
          { label:'New Programs',        val:`+${newWk}`, color: C.text,        sub:'detected this week'    },
          { label:'High Priority',       val: opps,       color: C.accentLight, sub:'programs worth review' },
          { label:'Risk Signals',        val: critRisk,   color: C.red,         sub:'flagged this week'     },
          { label:'Require Verification',val: toVer,      color: C.amber,       sub:'license or terms'      },
          { label:'Total Tracked',       val: total,      color: C.text,        sub:'programs in database'  },
        ].map(({ label, val, color, sub }) => (
          <div key={label} style={{ background: C.surface, padding:'26px 22px' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color: C.faint, marginBottom:10 }}>{label}</div>
            <div style={{ fontSize:42, fontWeight:800, color, letterSpacing:-2, lineHeight:1 }}>{val}</div>
            <div style={{ fontSize:12, color: C.muted, marginTop:6 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Executive Recommendation */}
      <div style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.07),rgba(109,40,217,0.03))', border:'1px solid rgba(124,58,237,0.16)', borderRadius:16, padding:'28px 36px', marginBottom:36 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'#6d28d9', marginBottom:14 }}>◈ EXECUTIVE RECOMMENDATION · THIS WEEK</div>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:40, alignItems:'start' }}>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color: C.text, marginBottom:18, letterSpacing:'-.2px' }}>3 operational actions required this week</div>
            {[
              { num:'01', numBg:'rgba(139,92,246,0.12)', numC: C.accentLight,
                title:`Review ${opps} high-potential affiliate programs`,
                desc:'Strong GEO fit, competitive commission model, and credible source verification. Early contact recommended before market saturation.' },
              { num:'02', numBg:'rgba(245,158,11,0.1)',   numC: C.amber,
                title:`Verify ${toVer} programs with incomplete license or terms data`,
                desc:`${unkLic} have unknown license status. Missing affiliate contact or unclear commission structure. Compliance risk if onboarded without verification.` },
              { num:'03', numBg:'rgba(239,68,68,0.1)',    numC: C.red,
                title:`Exclude ${critRisk} high-risk programs from outreach`,
                desc:'Reputation concerns or unresolved payment complaints flagged via Affiliate Guard Dog and AffiliateFix. Do not engage until resolved.' },
            ].map(({ num, numBg, numC, title, desc }) => (
              <div key={num} style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:14 }}>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:4, background: numBg, color: numC, minWidth:32, textAlign:'center', flexShrink:0 }}>{num}</span>
                <div style={{ fontSize:13, color:'#a1a1aa', lineHeight:1.6 }}>
                  <strong style={{ color: C.text }}>{title}</strong><br />{desc}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderLeft:`1px solid ${C.borderFaint}`, paddingLeft:32 }}>
            {[
              { label:'High Priority Programs', val: opps,     color: C.accentLight, sub:'identified for review'     },
              { label:'Require Verification',   val: toVer,    color: C.amber,       sub:'license or terms incomplete'},
              { label:'High Risk Programs',     val: critRisk, color: C.red,         sub:'excluded from outreach'    },
            ].map(({ label, val, color, sub }, i) => (
              <div key={label} style={{ marginBottom: i < 2 ? 22 : 0 }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color: C.faint, marginBottom:8 }}>{label}</div>
                <div style={{ fontSize:28, fontWeight:800, color, letterSpacing:-1 }}>{val}</div>
                <div style={{ fontSize:12, color: C.muted, marginTop:2 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Opportunities */}
      <SecLabel>Highest Value Opportunities</SecLabel>
      {topOps.map(row => <OppCard key={row.id} row={row} />)}

      {/* Alerts */}
      <div style={{ marginTop:36 }} />
      <SecLabel>Intelligence Alerts</SecLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {ALERTS.map((a,i) => <AlertCard key={i} a={a} />)}
      </div>

      {/* Market Intelligence */}
      <div style={{ marginTop:48 }} />
      <SecLabel>Market Intelligence</SecLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        <Card>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color: C.faint, marginBottom:18 }}>New Programs by GEO · This Week</div>
          {GEO_DIST.map(({ geo, count }) => <BarRow key={geo} label={geo} value={count} max={GEO_DIST[0].count} color={C.accent} />)}
        </Card>
        <Card>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color: C.faint, marginBottom:18 }}>Programs by Source · This Week</div>
          {SRC_DIST.map(({ src, count }) => <BarRow key={src} label={src} value={count} max={SRC_DIST[0].count} color={C.green} />)}
        </Card>
        <Sparkline data={TREND_DATA} />
      </div>

      {/* Monitoring Engine */}
      <div style={{ marginTop:48 }} />
      <SecLabel>Monitoring Engine Status</SecLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:16 }}>
        {SRC_CARDS.map(s => (
          <Card key={s.name} style={{ padding:'16px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:600, color: C.text }}>{s.name}</div>
              <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:3, background:'rgba(34,197,94,0.08)', color: C.green, border:'1px solid rgba(34,197,94,0.15)' }}>ACTIVE</span>
            </div>
            <div style={{ fontSize:10, color: C.faint, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>{s.type}</div>
            <div style={{ fontSize:20, fontWeight:700, color: C.text, marginBottom:2 }}>{s.found}</div>
            <div style={{ fontSize:11, color: C.faint, marginBottom:10 }}>found this week</div>
            <div style={{ height:2, background: C.borderFaint, borderRadius:1 }}>
              <div style={{ height:2, width:`${s.reliability}%`, background: relColor(s.reliability), borderRadius:1, opacity:.6 }} />
            </div>
            <div style={{ fontSize:11, color: C.faint, marginTop:5 }}>Reliability <span style={{ color: relColor(s.reliability) }}>{s.reliability}%</span></div>
          </Card>
        ))}
      </div>

      {/* Engine status bar */}
      <Card style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:0, padding:'20px 28px' }}>
        {[
          { label:'Status',         val:'Automated',      valC: C.green,       dot:true  },
          { label:'Last Scan',      val:'Today 09:00',    valC: C.text,        dot:false },
          { label:'Sources',        val:`${SRC_CARDS.length}/${SRC_CARDS.length} active`, valC: C.text, dot:false },
          { label:'New Findings',   val:`${newWk} programs`, valC: C.accentLight, dot:false },
          { label:'Next Scan',      val:'Tomorrow 09:00', valC: C.muted,       dot:false },
        ].map(({ label, val, valC, dot }, i) => (
          <div key={label} style={{ paddingLeft: i?20:0, paddingRight: i<4?20:0, borderLeft: i ? `1px solid ${C.borderFaint}` : 'none' }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color: C.faint, marginBottom:6 }}>{label}</div>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              {dot && <span style={{ width:6, height:6, borderRadius:'50%', background: C.green, boxShadow:`0 0 6px ${C.green}`, display:'inline-block' }} />}
              <span style={{ fontSize:13, fontWeight:600, color: valC }}>{val}</span>
            </div>
          </div>
        ))}
      </Card>

      {/* Next Steps */}
      <div style={{ marginTop:48 }} />
      <SecLabel>Next Steps — Connecting Real Sources</SecLabel>
      <Card style={{ padding:'28px 32px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:40, alignItems:'start' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color: C.faint, marginBottom:6 }}>MVP Prototype · Built in 48 hours · Budget &lt;$200</div>
            <div style={{ fontSize:16, fontWeight:600, color: C.text, marginBottom:12, letterSpacing:'-.2px' }}>
              This platform validates the monitoring logic.<br />
              <span style={{ color: C.accentLight }}>Next step: connect live data sources.</span>
            </div>
            <div style={{ fontSize:13, color: C.muted, lineHeight:1.7 }}>
              The current version uses a structured mock database to demonstrate the intelligence workflow — detection, scoring, alerting, and reporting. All logic is production-ready. Connecting real sources requires scraping setup and scheduled automation, estimated 2–3 days of engineering work.
            </div>
          </div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color: C.faint, marginBottom:14 }}>Integration Roadmap</div>
            {NEXT_STEPS.map((s,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background: C.accent, display:'inline-block', flexShrink:0 }} />
                <span style={{ fontSize:13, color:'#a1a1aa' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

// ── CEO Digest tab ─────────────────────────────────────────
function DigestTab({ programs, metrics }) {
  const { total, newWk, opps, critRisk, toVer, unkLic } = metrics
  const nwdf   = useMemo(() => programs.filter(r => r['Date Detected'] >= WEEK_AGO), [programs])
  const top5   = useMemo(() => [...nwdf].sort((a,b) => b.Opp - a.Opp).slice(0,5), [nwdf])
  const risk5  = useMemo(() => [...programs].filter(r => r.Risk >= 65).sort((a,b) => b.Risk - a.Risk).slice(0,5), [programs])
  const verWk  = nwdf.filter(r => r.Status === 'Verified').length
  const qualReview = Math.min(opps, 5)
  const highRiskN  = Math.min(critRisk, 2)

  const exportCsv = (rows, fname) => {
    const cols = ['Name','Source','GEO','Commission','License','Status','Opp','Risk']
    const data = [cols.join(','), ...rows.map(r => cols.map(c => `"${r[c]??''}"`).join(','))]
    const blob = new Blob([data.join('\n')], { type:'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${fname}_${TODAY}.csv`; a.click()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ padding:'36px 0 28px' }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.2em', textTransform:'uppercase', color:'#4b21a0', marginBottom:12 }}>CONFIDENTIAL · EXECUTIVE REPORT</div>
        <div style={{ fontSize:34, fontWeight:800, letterSpacing:-1, color: C.text, marginBottom:8 }}>Weekly CEO Digest</div>
        <div style={{ fontSize:14, color: C.faint }}>
          {new Date(addDays(TODAY,-6)).toLocaleDateString('en-GB',{day:'numeric',month:'short'})} — {new Date(TODAY).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
          &nbsp;·&nbsp; Prepared automatically by Affiliate Intelligence Platform
        </div>
      </div>

      {/* Savings bar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.12)', borderRadius:14, overflow:'hidden', marginBottom:32 }}>
        {[['~11h','Research saved'],[String(total),'Programs tracked'],[String(newWk),'New this week'],[String(highRiskN),'Risks flagged']].map(([val,lbl]) => (
          <div key={lbl} style={{ background:'#060608', padding:'22px 26px' }}>
            <div style={{ fontSize:30, fontWeight:800, color: C.green, letterSpacing:-1 }}>{val}</div>
            <div style={{ fontSize:10, color: C.faint, textTransform:'uppercase', letterSpacing:'.1em', marginTop:4 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Narrative */}
      <Card style={{ marginBottom:28 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color: C.faint, marginBottom:14 }}>Weekly Overview</div>
        <div style={{ fontSize:15, color:'#a1a1aa', lineHeight:1.8, maxWidth:760 }}>
          This week the monitoring engine identified <strong style={{ color: C.text }}>{newWk} new affiliate programs</strong> across <strong style={{ color: C.text }}>{SRC_CARDS.length} monitored sources</strong> including AffPapa, GPWA, SBC News, and EGR Global.{' '}
          <strong style={{ color: C.accentLight }}>{qualReview} programs</strong> match our priority criteria and should be reviewed by the Affiliate Manager.{' '}
          <strong style={{ color: C.red }}>{highRiskN} programs</strong> were flagged as high-risk due to incomplete licensing or negative reputation signals.
        </div>
      </Card>

      {/* Two columns */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:24 }}>
        <div>
          <SecLabel>Top Opportunities This Week</SecLabel>
          {top5.map((row,rank) => {
            const { reasons } = oppReasons(row)
            const occ = oppColor(row.Opp), rcc = riskColor(row.Risk)
            return (
              <Card key={row.id} style={{ padding:'18px 22px', marginBottom:10, display:'grid', gridTemplateColumns:'1.8fr .8fr .8fr', gap:18, alignItems:'start' }}>
                <div>
                  <div style={{ fontSize:10, color: C.faint, marginBottom:5 }}>#{rank+1}</div>
                  <div style={{ fontSize:14, fontWeight:700, color: C.text, marginBottom:4 }}>{row.Name}</div>
                  <div style={{ fontSize:12, color: C.muted, marginBottom:6 }}>{row.Source} · {row.GEO}</div>
                  <div style={{ fontSize:12, color: C.muted }}>{row.Commission} · {row.License}</div>
                  <div style={{ marginTop:8 }}>
                    {reasons.slice(0,2).map((r,i) => (
                      <div key={i} style={{ fontSize:11, color: C.muted, marginBottom:2 }}><span style={{ color: C.green }}>✓</span> {r}</div>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:10, color: C.faint, marginBottom:5, textTransform:'uppercase', letterSpacing:'.1em' }}>Opportunity</div>
                  <div style={{ fontSize:28, fontWeight:800, color: occ }}>{row.Opp}</div>
                  <div style={{ fontSize:10, color: C.faint }}>/ 100</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:10, color: C.faint, marginBottom:5, textTransform:'uppercase', letterSpacing:'.1em' }}>Risk</div>
                  <div style={{ fontSize:28, fontWeight:800, color: rcc }}>{row.Risk}</div>
                  <div style={{ fontSize:10, color: C.faint }}>/ 100</div>
                </div>
              </Card>
            )
          })}
          <button onClick={() => exportCsv(top5,'opportunities')} style={{ marginTop:8, background:'rgba(255,255,255,0.03)', border:`1px solid ${C.border}`, borderRadius:8, color: C.muted, padding:'8px 16px', fontSize:12, cursor:'pointer' }}>⬇ Export Top Opportunities CSV</button>
        </div>

        <div>
          <SecLabel>Risk Flags</SecLabel>
          {risk5.map(row => (
            <Card key={row.id} style={{ borderLeft:'2px solid #ef4444', borderRadius:10, padding:'14px 16px', marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:600, color: C.text, marginBottom:4 }}>{row.Name}</div>
              <div style={{ fontSize:12, color: C.muted, marginBottom:5 }}>{row.Notes}</div>
              <div style={{ fontSize:12, fontWeight:700, color: riskColor(row.Risk) }}>Risk: {row.Risk}/100</div>
            </Card>
          ))}
          <button onClick={() => exportCsv(risk5,'risks')} style={{ marginTop:8, background:'rgba(255,255,255,0.03)', border:`1px solid ${C.border}`, borderRadius:8, color: C.muted, padding:'8px 16px', fontSize:12, cursor:'pointer' }}>⬇ Export Risk Flags CSV</button>

          <div style={{ marginTop:28 }} />
          <SecLabel>Recommended Actions</SecLabel>
          {[
            [C.accentLight, `Review ${qualReview} qualified opportunities with Affiliate Manager`],
            [C.amber,       `Verify ${toVer} programs with incomplete license or terms`],
            [C.red,         `Exclude ${highRiskN} high-risk programs from outreach shortlist`],
            [C.green,       'Prepare shortlist for CEO review by Friday EOD'],
            [C.green,       'Schedule next intelligence review Monday 09:00'],
          ].map(([c,txt],i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${C.border}`, borderLeft:`2px solid ${c}`, borderRadius:8, padding:'11px 14px', marginBottom:7, fontSize:13, color:'#a1a1aa' }}>→ {txt}</div>
          ))}
        </div>
      </div>

      {/* Business Impact */}
      <div style={{ marginTop:36 }} />
      <SecLabel>This Week at a Glance</SecLabel>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
        {[
          ['High Priority Programs', String(opps),    C.accentLight],
          ['Requiring Verification', String(toVer),   C.amber      ],
          ['High Risk — Excluded',   String(highRiskN),C.red        ],
          ['Verified in Database',   String(verWk),   C.green      ],
          ['Next Review',            'Monday 09:00',  C.muted      ],
        ].map(([label,val,color]) => (
          <Card key={label} style={{ padding:'20px 18px' }}>
            <div style={{ fontSize:24, fontWeight:800, color, letterSpacing:'-.5px', marginBottom:6 }}>{val}</div>
            <div style={{ fontSize:11, color: C.faint, lineHeight:1.4 }}>{label}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Root App ───────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState(0)
  const programs = useMemo(() => generatePrograms(280), [])

  const metrics = useMemo(() => {
    const newWk    = programs.filter(r => r['Date Detected'] >= WEEK_AGO).length
    const toVer    = programs.filter(r => r.Status === 'To Verify').length
    const critRisk = programs.filter(r => r.Risk >= 65).length
    const opps     = programs.filter(r => r.Opp >= 65 && ['New','To Verify','Verified'].includes(r.Status)).length
    const unkLic   = programs.filter(r => r.License === 'Unknown').length
    return { total: programs.length, newWk, toVer, critRisk, opps, unkLic }
  }, [programs])

  const tabs = ['◈  Intelligence Brief', '◈  Program Database', '◈  CEO Weekly Digest']

  return (
    <div style={{ background: C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1480, margin:'0 auto', padding:'0 40px' }}>

        {/* Nav */}
        <div style={{ padding:'16px 0', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${C.borderFaint}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:13, fontWeight:700, color: C.accent, letterSpacing:'.12em' }}>◈</span>
            <span style={{ fontSize:13, fontWeight:600, color: C.text }}>Affiliate Intelligence Platform</span>
            <div style={{ height:12, width:1, background:'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize:12, color: C.faint }}>iGaming Ecosystem Monitor</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <span style={{ fontSize:12, color: C.faint }}>Last scan: <span style={{ color:'#52525b' }}>Today 09:00</span></span>
            <span style={{ fontSize:12, color: C.faint }}>Next: <span style={{ color:'#52525b' }}>Tomorrow 09:00</span></span>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:20, padding:'5px 12px', fontSize:11, fontWeight:700, color: C.green }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background: C.green, boxShadow:`0 0 6px ${C.green}`, display:'inline-block' }} />
              LIVE
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ marginTop:24, marginBottom:0 }}>
          <div style={{ background: C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:4, display:'inline-flex', gap:2 }}>
            {tabs.map((t,i) => (
              <button key={i} onClick={() => setTab(i)} style={{
                background: tab===i ? 'rgba(139,92,246,0.1)' : 'transparent',
                color: tab===i ? C.accentLight : C.faint,
                border: tab===i ? '1px solid rgba(139,92,246,0.18)' : '1px solid transparent',
                borderRadius:7, fontSize:13, fontWeight:500, padding:'8px 20px', cursor:'pointer', transition:'all .2s',
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ paddingTop:36 }}>
          {tab === 0 && <IntelligenceTab programs={programs} metrics={metrics} />}
          {tab === 1 && <DatabaseTab programs={programs} />}
          {tab === 2 && <DigestTab programs={programs} metrics={metrics} />}
        </div>

        {/* Footer */}
        <div style={{ marginTop:60, paddingTop:18, borderTop:`1px solid ${C.borderFaint}`, display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:32 }}>
          <span style={{ fontSize:11, color:'#1e1e24' }}>© 2026 Affiliate Intelligence Platform · Internal use only</span>
          <div style={{ display:'flex', gap:8 }}>
            {['MVP v1.0','Built in 48h','Budget <$200','Production Prototype'].map(b => (
              <span key={b} style={{ fontSize:10, color:'#2e2e35', background:'rgba(255,255,255,0.02)', border:`1px solid ${C.borderFaint}`, padding:'4px 10px', borderRadius:4 }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
