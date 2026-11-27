/* 等式高低 · 共用效果：音效、金幣動畫、贏家公告、特殊牌提示、電腦角色
   單人版（single.html）與多人版（multi.html）都會載入這個檔案。 */
(function(){
"use strict";

/* ---------- 音效：用 Web Audio 即時合成，不需要音檔 ---------- */
const LS_MUTE = 'eqhilo.mute';
let muted = false;
try { muted = localStorage.getItem(LS_MUTE) === '1'; } catch (e) {}
let ctx = null;
function ac(){
  if (!ctx){
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try { ctx = new C(); } catch (e) { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
function tone({f = 440, f2 = null, t = 0.08, type = 'sine', v = 0.15, delay = 0, attack = 0.005}){
  const c = ac(); if (!c) return;
  const now = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, now);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, now + t);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(v, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + t);
  o.connect(g).connect(c.destination);
  o.start(now); o.stop(now + t + 0.02);
}
function noise({t = 0.06, v = 0.12, delay = 0, hp = 1500}){
  const c = ac(); if (!c) return;
  const now = c.currentTime + delay;
  const len = Math.max(1, Math.floor(c.sampleRate * t));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = c.createGain(); g.gain.value = v;
  s.connect(f).connect(g).connect(c.destination);
  s.start(now);
}
const SOUNDS = {
  tap:     () => tone({f:660, t:0.05, type:'triangle', v:0.07}),
  place:   () => { noise({t:0.035, v:0.1, hp:2600}); tone({f:320, f2:190, t:0.06, v:0.09}); },
  deal:    () => noise({t:0.07, v:0.08, hp:3200}),
  chip:    () => { tone({f:1900, t:0.035, type:'square', v:0.025}); tone({f:2500, t:0.045, type:'square', v:0.02, delay:0.045}); },
  coin:    () => { tone({f:1320, t:0.08, type:'triangle', v:0.06}); tone({f:1760, t:0.12, type:'triangle', v:0.05, delay:0.05}); },
  win:     () => [523, 659, 784, 1047].forEach((f, i) => tone({f, t:0.2, type:'triangle', v:0.08, delay:i * 0.09})),
  special: () => { tone({f:700, f2:1500, t:0.28, v:0.08}); tone({f:1500, t:0.22, type:'triangle', v:0.05, delay:0.12}); },
  reveal:  () => tone({f:440, f2:660, t:0.12, type:'triangle', v:0.06}),
  tick:    () => tone({f:1000, t:0.05, type:'square', v:0.035}),
};
function sound(name){ if (muted) return; try { SOUNDS[name] && SOUNDS[name](); } catch (e) {} }
function setMuted(m){ muted = !!m; try { localStorage.setItem(LS_MUTE, muted ? '1' : '0'); } catch (e) {} }

// 按鈕與放牌的音效（全站共用）
document.addEventListener('click', e => {
  const el = e.target.closest('button, a.btn');
  if (!el || el.disabled) return;
  ac();
  const act = el.dataset.act;
  if (act === 'mute') return;
  if (act === 'pn' || act === 'po' || act === 'slot' || act === 'sqrt') sound('place');
  else sound('tap');
}, true);

/* ---------- 視覺效果 ---------- */
const style = document.createElement('style');
style.textContent = `
.fx-coin{position:fixed;left:0;top:0;width:22px;height:22px;border-radius:50%;z-index:60;pointer-events:none;
  background:radial-gradient(circle at 35% 30%,#fff7cf,#f3cb52 42%,#a77818 78%);box-shadow:inset 0 0 0 2px #7a5512,0 2px 6px rgba(0,0,0,.5)}
.fx-banner{position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);z-index:55;pointer-events:none;
  background:rgba(9,20,17,.95);border:2px solid var(--brass,#d3ac55);border-radius:18px;padding:16px 28px;text-align:center;
  font-family:var(--f-display,serif);font-weight:900;font-size:clamp(20px,4.4vw,32px);color:var(--text,#ede6d3);
  box-shadow:0 0 0 6px rgba(211,172,85,.15),0 14px 44px rgba(0,0,0,.65);animation:fxIn .35s ease-out;max-width:calc(100vw - 32px)}
.fx-banner .fx-k{display:block;font-size:.5em;letter-spacing:.3em;color:var(--brass,#d3ac55);margin-bottom:2px}
.fx-banner .fx-line + .fx-line{margin-top:8px}
.fx-banner .fx-sub{display:block;font-family:var(--f-mono,monospace);font-size:.48em;font-weight:500;color:var(--muted,#9db3a8);margin-top:2px}
.fx-banner.out{opacity:0;transition:opacity .45s}
@keyframes fxIn{from{opacity:0;transform:translate(-50%,-38%) scale(.9)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
.fx-flash{position:fixed;z-index:58;pointer-events:none;transform:translate(-50%,-50%);text-align:center;
  font-family:var(--f-mono,monospace);font-weight:700;color:#22170a;background:var(--brass,#d3ac55);border-radius:14px;padding:4px 16px 6px;
  box-shadow:0 0 0 5px rgba(211,172,85,.3),0 10px 28px rgba(0,0,0,.55);animation:fxFlash 1.7s ease-out forwards}
.fx-flash b{display:block;font-size:46px;line-height:1.05}
.fx-flash small{display:block;font-family:var(--f-body,sans-serif);font-size:12px;font-weight:700;letter-spacing:.08em}
@keyframes fxFlash{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}14%{opacity:1;transform:translate(-50%,-50%) scale(1.18)}28%{transform:translate(-50%,-50%) scale(1)}78%{opacity:1}100%{opacity:0;transform:translate(-50%,-95%) scale(.92)}}
@media (prefers-reduced-motion: reduce){.fx-banner,.fx-flash{animation:none}}
`;
document.head.appendChild(style);

const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function center(el){ const r = el.getBoundingClientRect(); return {x:r.left + r.width / 2, y:r.top + r.height / 2}; }
function onScreen(el){ const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }

function coins(fromEl, toEl, n = 8){
  return new Promise(res => {
    if (!fromEl || !toEl || !document.body.animate){ sound('coin'); res(); return; }
    if (!fromEl.isConnected || !toEl.isConnected || !toEl.getBoundingClientRect().width || reduce() || !onScreen(toEl)){ sound('coin'); res(); return; }
    const a = center(fromEl), b = center(toEl);
    let done = 0;
    for (let i = 0; i < n; i++){
      const c = document.createElement('div');
      c.className = 'fx-coin';
      document.body.appendChild(c);
      const dx = b.x - a.x, dy = b.y - a.y;
      const lift = -50 - Math.random() * 70, jitter = (Math.random() - 0.5) * 50;
      const anim = c.animate([
        {transform:`translate(${a.x - 11}px,${a.y - 11}px) scale(.5)`, opacity:0},
        {transform:`translate(${a.x - 11 + dx * 0.5 + jitter}px,${a.y - 11 + dy * 0.5 + lift}px) scale(1.15)`, opacity:1, offset:0.5},
        {transform:`translate(${b.x - 11}px,${b.y - 11}px) scale(.8)`, opacity:0.95},
      ], {duration:780, delay:i * 70, easing:'cubic-bezier(.3,.7,.4,1)', fill:'both'});
      anim.onfinish = () => { c.remove(); if (i % 2 === 0) sound('coin'); if (++done === n) res(); };
    }
  });
}
// lines: [{k:'大方贏家', text:'阿華', sub:'19.5'}]
function banner(lines, ms = 2400){
  const el = document.createElement('div');
  el.className = 'fx-banner';
  el.setAttribute('role', 'status');
  lines.forEach(l => {
    const row = document.createElement('div'); row.className = 'fx-line';
    if (l.k){ const k = document.createElement('span'); k.className = 'fx-k'; k.textContent = l.k; row.appendChild(k); }
    row.appendChild(document.createTextNode(l.text));
    if (l.sub){ const s = document.createElement('span'); s.className = 'fx-sub'; s.textContent = l.sub; row.appendChild(s); }
    el.appendChild(row);
  });
  document.body.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, ms);
}
function flash(el, sym, label){
  if (!el || !onScreen(el)) return;
  const p = center(el);
  const b = document.createElement('div');
  b.className = 'fx-flash';
  b.style.left = p.x + 'px'; b.style.top = p.y + 'px';
  const big = document.createElement('b'); big.textContent = sym;
  const sm = document.createElement('small'); sm.textContent = label;
  b.appendChild(big); b.appendChild(sm);
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 1800);
}
const seatEl = i => document.querySelector(`[data-seat="${i}"]`);

// 統一的事件播放（單人直接呼叫；多人由房主廣播給每個人）
function play(e){
  switch (e.type){
    case 'deal': sound('deal'); break;
    case 'chip': sound('chip'); break;
    case 'reveal': sound('reveal'); break;
    case 'special':
      sound('special');
      flash(seatEl(e.seat), e.sym, e.sym === '√' ? `${e.name} 抽到根號` : `${e.name} 抽到乘號`);
      break;
    case 'win': {
      sound('win');
      if (e.lines && e.lines.length) banner(e.lines);
      // Look the pot and seat up when the coins leave: the table may have been redrawn meanwhile.
      (e.winners || []).forEach((w, k) => setTimeout(() => coins(document.querySelector('.pot'), seatEl(w.seat), w.coins || 8), 350 + k * 300));
      break;
    }
  }
}

/* ---------- 20 位電腦角色（虛構，參考德州撲克常見的高手風格） ----------
   agg：加注傾向　loose：跟注寬鬆度（負數＝容易棄牌）　bluff：牌不好也加注的機率
   swingy：Swing 傾向　hiBias：偏好賭大（正）或賭小（負） */
const PERSONAS = [
  {id:'kai',    name:'阿凱',  tag:'激進',  desc:'什麼牌都想加注，逼別人表態。',          agg:.80, loose:.25, bluff:.15, swingy:.60, hiBias:0},
  {id:'yu',     name:'小雨',  tag:'謹慎',  desc:'只玩好牌，她一加注就要小心。',          agg:.25, loose:-.30, bluff:.02, swingy:.20, hiBias:0},
  {id:'zhou',   name:'老周',  tag:'老練',  desc:'牌好才進場，進場就打得很兇。',          agg:.65, loose:-.05, bluff:.06, swingy:.50, hiBias:0},
  {id:'mila',   name:'米拉',  tag:'愛詐唬', desc:'常常牌不好也加注，讓人摸不清。',        agg:.70, loose:.10, bluff:.28, swingy:.50, hiBias:0},
  {id:'desheng',name:'德生',  tag:'保守',  desc:'能過牌就過牌，很少冒險。',              agg:.30, loose:-.20, bluff:.03, swingy:.20, hiBias:0},
  {id:'tie',    name:'阿鐵',  tag:'跟注站', desc:'很少棄牌，喜歡跟到最後看結果。',        agg:.20, loose:.50, bluff:.02, swingy:.30, hiBias:0},
  {id:'volcano',name:'火山',  tag:'瘋狂',  desc:'幾乎每一輪都加注。',                    agg:.95, loose:.40, bluff:.35, swingy:.80, hiBias:0},
  {id:'abacus', name:'算盤',  tag:'數學派', desc:'照牌力算好才下注，幾乎不詐唬。',        agg:.55, loose:-.05, bluff:.02, swingy:.40, hiBias:0},
  {id:'ice',    name:'冰姐',  tag:'冷靜',  desc:'不動聲色，偶爾一記重拳。',              agg:.50, loose:-.10, bluff:.10, swingy:.40, hiBias:0},
  {id:'leo',    name:'阿豹',  tag:'衝動',  desc:'看到機會就衝，最愛 Swing。',            agg:.75, loose:.20, bluff:.18, swingy:.95, hiBias:0},
  {id:'bai',    name:'小白',  tag:'新手',  desc:'什麼都想跟，常常看錯局勢。',            agg:.35, loose:.35, bluff:.05, swingy:.30, hiBias:0},
  {id:'prof',   name:'教授',  tag:'讀牌型', desc:'觀察大家再出手，偏好賭大。',            agg:.50, loose:0,   bluff:.08, swingy:.40, hiBias:.25},
  {id:'captain',name:'船長',  tag:'穩健',  desc:'穩穩下注，不追也不躁。',                agg:.45, loose:-.10, bluff:.04, swingy:.30, hiBias:0},
  {id:'fox',    name:'狐狸',  tag:'狡猾',  desc:'先示弱引誘，再突然加注。',              agg:.60, loose:0,   bluff:.30, swingy:.50, hiBias:0},
  {id:'bear',   name:'大熊',  tag:'豪爽',  desc:'籌碼多就愛跟，輸了也不在意。',          agg:.70, loose:.30, bluff:.10, swingy:.50, hiBias:0},
  {id:'deer',   name:'小鹿',  tag:'膽小',  desc:'一有人加注就想棄牌。',                  agg:.15, loose:-.35, bluff:0,   swingy:.10, hiBias:0},
  {id:'ming',   name:'阿明',  tag:'重注型', desc:'有好牌就一路推到上限。',                agg:.85, loose:.05, bluff:.10, swingy:.70, hiBias:0},
  {id:'shirley',name:'雪莉',  tag:'均衡',  desc:'攻守平衡，很難看穿。',                  agg:.55, loose:.05, bluff:.10, swingy:.50, hiBias:0},
  {id:'kiki',   name:'Kiki', tag:'賭小派', desc:'幾乎都押小，靠最小的牌決勝負。',        agg:.45, loose:0,   bluff:.06, swingy:.30, hiBias:-.30},
  {id:'datou',  name:'大頭',  tag:'賭大派', desc:'不管牌多難湊，都想押大。',              agg:.50, loose:.10, bluff:.08, swingy:.30, hiBias:.35},
];
function pickPersonas(n){
  const a = PERSONAS.slice();
  for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}
function personaById(id){ return PERSONAS.find(p => p.id === id) || null; }

window.FX = {sound, setMuted, isMuted:() => muted, coins, banner, flash, play, PERSONAS, pickPersonas, personaById};
})();
