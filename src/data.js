// ── seed-based pseudo-random ──────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(42);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr]; const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
};

// ── Constants ─────────────────────────────────────────────
export const TODAY = '2026-06-12';
export const TODAY_DT = new Date('2026-06-12');

export const SOURCES = [
  'AffPapa','GPWA','Affiliate Guard Dog','AskGamblers','SBC News',
  'Gambling Insider','iGamingBusiness','CasinoBeats','EGR Global','AffiliateFix',
];

const NAMES = [
  'Bet365 Partners','888 Affiliates','LeoVegas Affiliates','Income Access Network',
  'Rizk Partners','Stake Affiliates','PlayAmo Partners','Fortune Affiliates',
  'Betsson Group Affiliates','22Bet Partners','Betwinner Affiliates','Coldbet Partners',
  'FoxSlots Partners','Rocketpot Affiliates','Bwin Affiliates','William Hill Partners',
  'Unibet Affiliates','PokerStars Affiliates','Betway Partners','Mr Green Affiliates',
  'Casumo Affiliates','Videoslots Partners','Fastpay Partners','N1 Partners',
  'Wildz Affiliates','Dunder Affiliates','Genesis Affiliates','Vera John Affiliates',
  'Guts Affiliates','Betsafe Partners','NordicBet Affiliates','SpinBet Affiliates',
  'MegaSlot Affiliates','LuckyNova Partners','GrandWin Affiliates','SilverPlay Partners',
  'Odds96 Partners','C24 Partners','Boomerang Partners','Partners1xbet',
  'Parimatch Partners','Mostbet Affiliates','Melbet Partners','PinUp Partners',
  '1win Affiliates','GGBet Partners','BC.Game Affiliates','BitStarz Partners',
  'FortuneJack Affiliates','BetFury Affiliates','CloudBet Partners','Rollbit Affiliates',
  'JackBit Partners','NineCasino Affiliates','Sportsbet.io Partners','Rabona Affiliates',
  'BetChain Partners','1xSlots Affiliates','Sportaza Affiliates','Haz Casino Partners',
  '20Bet Affiliates','Playfina Affiliates','Legzo Partners','Sol Casino Partners',
  'Cat Casino Partners','Gama Affiliates','JVSpin Affiliates','DrBet Partners',
  'Mystake Partners','Paripesa Affiliates','Betano Affiliates','Novibet Partners',
  'NetBet Partners','BetVictor Affiliates','Betfair Affiliates','Smarkets Partners',
  'Fortuna Partners','Tipsport Affiliates','Tipico Partners','Bettilt Affiliates',
  'Betcris Affiliates','Coolbet Partners','LiveScore Partners','Midnite Affiliates',
  'Rootz Affiliates','MrQ Partners','SpinGenie Affiliates','Jackpotjoy Partners',
  'Virgin Games Affiliates','Pinnacle Affiliates','1xBet Partners','Parimatch UA Partners',
  'Favbet Affiliates','Vbet Partners','BetMGM Affiliates','DraftKings Partners',
  'FanDuel Affiliates','Caesars Affiliates','PointsBet Partners','ESPN Bet Affiliates',
  'Betclic Partners','Winamax Affiliates','Better Collective Affiliates','Catena Media Partners',
  'Raketech Affiliates','CasinoGuru Partners','Push Gaming Affiliates','Evolution Partners',
  'Playtech Affiliates','Pragmatic Partners','NetEnt Affiliates','Red Tiger Affiliates',
  'BGaming Affiliates','Spinomenal Partners','Gamomat Partners','Wazdan Affiliates',
];

const GEOS = ['UK','EU','CA','AU','LATAM','Nordics','UA/CIS','DE','SE','IE'];
const LICS = ['MGA','UKGC','Curaçao','Gibraltar','Isle of Man','Unknown'];
const STATS = ['New','New','To Verify','To Verify','Verified','Verified','Verified','Verified','Rejected'];
const PRIS = ['High','High','Medium','Medium','Low'];
const COMS = ['RevShare 25-35%','RevShare 30-40%','RevShare 35-45%','CPA £50-100','CPA £80-150','Hybrid'];
const NOTES = [
  'Verified program. Stable payouts reported by community.',
  'New listing — terms under review by affiliate team.',
  'Delayed payment reports on Affiliate Guard Dog.',
  'Strong UK and Nordics traffic focus.',
  'Fast onboarding. License documentation complete.',
  'Mixed reviews on AffiliateFix. Monitor closely.',
  'High RevShare. Recently listed on AffPapa.',
  'Established network. Well-reviewed on GPWA.',
  'Recently launched. License application pending.',
  'Reputation confirmed via EGR Global listing.',
  'Rapid growth in LATAM. New program.',
  'License renewal pending. Temporary risk flag.',
  'Top performer in Nordics per iGamingBusiness.',
  'New management. Performance history unclear.',
  'Positive community signals on AffiliateFix.',
];

function calcRisk(row) {
  let s = 12;
  if (row.License === 'Unknown') s += 38;
  if (row.License === 'Curaçao') s += 10;
  if (row.Status === 'Rejected') s += 30;
  if (row.Status === 'To Verify') s += 15;
  const n = (row.Notes || '').toLowerCase();
  if (n.includes('delayed') || n.includes('unclear') || n.includes('pending')) s += 14;
  return Math.min(Math.max(s, 10), 88);
}

function calcOpp(row) {
  let s = 28;
  if (row.Priority === 'High') s += 22;
  if (row.Status === 'Verified') s += 18;
  const g = row.GEO || '';
  if (g.includes('UK') || g.includes('Nordics') || g.includes('CA')) s += 8;
  const c = row.Commission || '';
  if (c.includes('35-45') || c.includes('40')) s += 7;
  const n = (row.Notes || '').toLowerCase();
  if (n.includes('stable') || n.includes('confirmed') || n.includes('top performer')) s += 8;
  if (row.Status === 'New' && row.Priority === 'High') s += 5;
  if (['MGA','UKGC','Gibraltar'].includes(row.License)) s += 6;
  return Math.min(Math.max(s, 30), 86);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function generatePrograms(n = 280) {
  const base = [...NAMES];
  while (base.length < n) base.push(...NAMES);
  const names = base.slice(0, n);
  return names.map((name, i) => {
    const days = i < 6 ? 0 : i < 28 ? Math.floor(rng() * 7) + 1 : Math.floor(rng() * 77) + 8;
    const detected = addDays(TODAY, -days);
    let status = pick(STATS);
    if (days === 0) status = 'New';
    else if (days <= 7) status = rng() > 0.5 ? 'New' : 'To Verify';
    const geoCount = Math.floor(rng() * 3) + 1;
    const geo = pickN(GEOS, geoCount).join(', ');
    const row = {
      id: i,
      Name: name,
      'Date Detected': detected,
      Source: pick(SOURCES),
      GEO: geo,
      License: pick(LICS),
      Commission: pick(COMS),
      Status: status,
      Priority: pick(PRIS),
      Notes: pick(NOTES),
    };
    row.Risk = calcRisk(row);
    row.Opp = calcOpp(row);
    return row;
  });
}

export function oppReasons(row) {
  const reasons = [], riskReasons = [];
  if (['MGA','UKGC','Gibraltar'].includes(row.License)) reasons.push('Regulated license confirmed');
  if (row.GEO?.includes('UK') || row.GEO?.includes('Nordics')) reasons.push('Tier 1 GEO coverage');
  if (row.GEO?.includes('CA') || row.GEO?.includes('AU')) reasons.push('High-value market presence');
  if (row.Commission?.includes('35-45') || row.Commission?.includes('40')) reasons.push('Above-market revenue share');
  if (row.Status === 'New') reasons.push('New launch — first-mover advantage');
  if (['AffPapa','GPWA','EGR Global'].includes(row.Source)) reasons.push(`Listed on ${row.Source} — verified source`);
  const n = (row.Notes || '').toLowerCase();
  if (n.includes('stable') || n.includes('confirmed')) reasons.push('Positive reputation signals');
  if (n.includes('top performer')) reasons.push('Top performer in region');

  if (row.License === 'Unknown') riskReasons.push('License status unconfirmed');
  else if (row.License === 'Curaçao') riskReasons.push('Curaçao — lower regulatory standard');
  if (n.includes('delayed')) riskReasons.push('Delayed payment reports found');
  if (n.includes('pending')) riskReasons.push('License renewal in progress');
  if (n.includes('unclear')) riskReasons.push('Performance history unclear');
  if (!riskReasons.length) riskReasons.push('No major reputation warnings found');
  if (['MGA','UKGC'].includes(row.License)) riskReasons.push('License confirmed and active');
  if (n.includes('stable')) riskReasons.push('No payment complaints on record');

  return {
    reasons: reasons.slice(0, 4).length ? reasons.slice(0, 4) : ['Active program','Detected via monitored source'],
    riskReasons: riskReasons.slice(0, 3),
  };
}

export const GEO_DIST = [
  { geo: 'UK', count: 7 }, { geo: 'EU', count: 6 }, { geo: 'CA', count: 4 },
  { geo: 'AU', count: 3 }, { geo: 'LATAM', count: 3 }, { geo: 'Nordics', count: 2 }, { geo: 'UA/CIS', count: 2 },
];

export const SRC_DIST = [
  { src: 'AffPapa', count: 6 }, { src: 'GPWA', count: 5 }, { src: 'SBC News', count: 4 },
  { src: 'AskGamblers', count: 4 }, { src: 'Affiliate Guard Dog', count: 3 },
  { src: 'iGamingBusiness', count: 3 }, { src: 'CasinoBeats', count: 2 }, { src: 'EGR Global', count: 2 },
];

export const SRC_CARDS = [
  { name: 'AffPapa', type: 'Affiliate Directory', found: 6, reliability: 94, last: 'Today 09:00' },
  { name: 'GPWA', type: 'Affiliate Forum', found: 5, reliability: 89, last: 'Today 09:01' },
  { name: 'Affiliate Guard Dog', type: 'Watchdog Forum', found: 3, reliability: 92, last: 'Today 09:02' },
  { name: 'AskGamblers', type: 'Review Platform', found: 4, reliability: 87, last: 'Today 09:03' },
  { name: 'SBC News', type: 'Industry News', found: 4, reliability: 96, last: 'Today 09:04' },
  { name: 'Gambling Insider', type: 'Industry News', found: 3, reliability: 91, last: 'Today 09:05' },
  { name: 'iGamingBusiness', type: 'Industry News', found: 3, reliability: 90, last: 'Today 09:06' },
  { name: 'CasinoBeats', type: 'Industry News', found: 2, reliability: 85, last: 'Today 09:07' },
  { name: 'EGR Global', type: 'Industry Publication', found: 2, reliability: 93, last: 'Today 09:08' },
  { name: 'AffiliateFix', type: 'Affiliate Forum', found: 1, reliability: 78, last: 'Today 09:09' },
];

export const TREND_DATA = (() => {
  const rng2 = mulberry32(11);
  const base = [2,3,2,1,3,2,4,3,2,3,1,2,3,2,1,3,2,3,2,1,2,3,2,3,2,1,2,3,2,2];
  return base.map((v, i) => {
    const d = new Date('2026-06-12');
    d.setDate(d.getDate() - (29 - i));
    return { date: d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }), count: v };
  });
})();

export const ALERTS = [
  {
    type: 'new', label: 'NEW SIGNAL', ac: '#A78BFA',
    bg: 'rgba(139,92,246,0.05)', border: 'rgba(139,92,246,0.12)', top: 'rgba(139,92,246,0.35)',
    title: 'High-RevShare Program Detected',
    prog: 'SpinBet Affiliates', src: 'SBC News', geo: 'UK, EU', lic: 'Curaçao', comm: 'RevShare 35-45%',
    signal: 'New program listed on SBC News with above-market revenue share. No prior history in GPWA or AffPapa databases.',
    evidence: 'RevShare of 35–45% is above the 30% industry average for new launches. Curaçao license — lower regulatory standard than MGA/UKGC.',
    impact: 'Potential early-partnership opportunity. License risk is moderate and manageable with due diligence.',
    rec: 'Affiliate Manager to verify terms and request license documentation within 24h.',
    rec_c: '#A78BFA',
  },
  {
    type: 'verify', label: 'VERIFICATION REQUIRED', ac: '#F59E0B',
    bg: 'rgba(245,158,11,0.04)', border: 'rgba(245,158,11,0.12)', top: 'rgba(245,158,11,0.35)',
    title: 'License Status Unconfirmed',
    prog: 'LuckyNova Partners', src: 'AffiliateFix', geo: 'UA/CIS, EU', lic: 'Unknown', comm: 'CPA £80-150',
    signal: 'Program appeared on AffiliateFix community forum. License cannot be confirmed from MGA, UKGC, Gibraltar, or Curaçao public registers.',
    evidence: 'License field is empty in affiliate submission. No listing found on Affiliate Guard Dog verified directory.',
    impact: 'Engagement without license verification creates compliance risk and potential payment disputes.',
    rec: 'Do not onboard. Request official license documentation before any contact.',
    rec_c: '#F59E0B',
  },
  {
    type: 'risk', label: 'RISK FLAGGED', ac: '#EF4444',
    bg: 'rgba(239,68,68,0.04)', border: 'rgba(239,68,68,0.12)', top: 'rgba(239,68,68,0.35)',
    title: 'Reputation Risk — Payment Delays',
    prog: 'Fortune Affiliates', src: 'Affiliate Guard Dog', geo: 'UK, EU', lic: 'MGA', comm: 'RevShare 25-35%',
    signal: 'Multiple affiliate payment delay complaints filed on Affiliate Guard Dog over the past 90 days.',
    evidence: '6 verified complaints in Q2 2026. Pattern consistent with cashflow constraints. Community trust score declining.',
    impact: 'High onboarding risk. Programs with delayed payment history carry reputational and financial risk.',
    rec: 'Exclude from outreach shortlist. Revisit only after 6-month clean payment record is confirmed.',
    rec_c: '#EF4444',
  },
];

export const NEXT_STEPS = [
  'AffPapa API / structured scraping',
  'GPWA forum monitoring',
  'AffiliateFix thread detection',
  'SBC News RSS feed integration',
  'EGR Global new listing alerts',
  'Daily Cloudflare cron jobs',
  'Slack or email digest delivery',
];
