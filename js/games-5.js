/* 에코 놀이터 5: 만들고 키우고 지키는 게임 — 에코타운 · 쓰레기 몬스터 디펜스 · 에코 농장 · 바다 청소 보트 (퀴즈 없이 플레이로 배우기) */
(function (Eco) {
  const { h } = Eco.ui;
  const R = (a, b) => a + Math.random() * (b - a);
  const ri = n => Math.random() * n | 0;

  /* ───── 1. 에코타운 만들기 ───── */
  const BLD = {
    house: ['🏠', '집', 10, { pop: 2, coin: 1 }, '사람이 살아요 (+인구)'], factory: ['🏭', '공장', 0, { coin: 3, pol: 5 }, '돈은 벌지만 공기를 더럽혀요'],
    solar: ['☀️', '태양광', 22, { coin: 4 }, '깨끗한 에너지로 돈을 벌어요'], wind: ['🌬️', '풍력', 30, { coin: 6 }, '바람으로 전기를 만들어요'],
    tree: ['🌳', '나무', 6, { pol: -3, happy: 1 }, '공기를 맑게 해요'], bus: ['🚌', '버스정류장', 16, { pol: -4, happy: 2 }, '자동차 대신 대중교통'], recycle: ['♻️', '재활용센터', 26, { pol: -5, coin: 3 }, '쓰레기를 자원으로']
  };
  Eco.addGame('ecotown', { name: '에코타운 만들기', emoji: '🏙️', tag: '도시 건설', desc: '매연 가득한 도시를 내 손으로 바꿔요! 공장을 철거하고 태양광·나무·버스를 지어 에코타운 인증에 도전.', cat: '만들기',
    make() {
      const box = h('div.gamebox'); const W = 8, Hh = 5; const st = { coin: 30, tick: 0, grid: [], sel: 'tree', done: false };
      for (let i = 0; i < W * Hh; i++) st.grid.push(i % 3 === 0 ? 'factory' : i % 5 === 1 ? 'house' : null);
      const calc = () => { let coin = 0, pol = 0, pop = 0, hp = 0; st.grid.forEach(k => { if (k) { const e = BLD[k][3]; coin += e.coin || 0; pol += e.pol || 0; pop += e.pop || 0; hp += e.happy || 0; } }); pol = Math.max(0, pol); return { coin, pol, pop, happy: Math.max(0, Math.min(100, 100 - pol * 3 + hp * 2)) }; };
      const info = h('div.note'), msg = h('div.small.muted'), gridEl = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(' + W + ',1fr)', gap: '4px', margin: '8px 0' } }), pal = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } });
      const goal = () => { const c = calc(); return c.pol <= 5 && c.pop >= 8 && c.happy >= 85; };
      const draw = () => {
        const c = calc(); info.innerHTML = ''; info.append('🪙 ', h('b', st.coin), '  (+' + c.coin + '/2초)  · 🏭 오염 ', h('b', c.pol), ' · 👪 인구 ', h('b', c.pop), ' · 😊 행복 ', h('b', c.happy), h('div.small', '🎯 목표: 오염 5 이하 · 인구 8 이상 · 행복 85 이상'));
        gridEl.innerHTML = ''; st.grid.forEach((k, i) => gridEl.append(h('button', { style: { aspectRatio: '1', fontSize: '1.6rem', borderRadius: '10px', border: '2px solid var(--line)', background: k === 'factory' ? '#e8e0d8' : k ? '#eaf7e0' : '#fafdf6', cursor: 'pointer' }, onclick: () => place(i) }, k ? BLD[k][0] : '＋')));
        pal.innerHTML = ''; Object.entries(BLD).forEach(([k, b]) => { if (k === 'factory') return; pal.append(h('button.btn' + (st.sel === k ? '' : '.alt') + '.sm', { title: b[4], onclick: () => { st.sel = k; msg.textContent = b[0] + ' ' + b[1] + ' — ' + b[4] + ' (🪙' + b[2] + ')'; draw(); } }, b[0] + ' ' + b[1] + ' 🪙' + b[2])); }); pal.append(h('button.btn.alt.sm', { onclick: () => { st.sel = 'del'; msg.textContent = '🧹 철거: 건물을 없애요 (🪙3)'; draw(); } }, '🧹 철거 🪙3'));
        if (goal() && !st.done) { st.done = true; const sc = Math.max(20, 400 - st.tick * 3); Eco.gameDone('ecotown', sc, 12, '에코타운 만들기'); Eco.ui.confetti(80); box.append(h('div.card', h('h2', '🏆 에코타운 인증!'), h('p', '점수 ' + sc + ' · ' + (st.tick * 2) + '초 걸렸어요. 공장을 줄이고 재생에너지·나무·대중교통을 늘리니 공기와 행복이 함께 올랐죠?'), h('button.btn', { onclick: () => { Object.assign(st, { coin: 30, tick: 0, done: false, sel: 'tree' }); st.grid = []; for (let i = 0; i < W * Hh; i++) st.grid.push(i % 3 === 0 ? 'factory' : i % 5 === 1 ? 'house' : null); box.querySelector('.card').remove(); draw(); } }, '새 도시로 다시'))); }
      };
      const place = i => { const k = st.grid[i];
        if (st.sel === 'del') { if (!k) return; if (st.coin < 3) return msg.textContent = '코인이 부족해요'; st.coin -= 3; st.grid[i] = null; Eco.ui.sfx('coin'); }
        else { const b = BLD[st.sel]; if (k) return msg.textContent = '빈 땅에만 지을 수 있어요. 먼저 철거!'; if (st.coin < b[2]) return msg.textContent = '코인이 모자라요. 잠시 기다려요 ⏳'; st.coin -= b[2]; st.grid[i] = st.sel; Eco.ui.sfx('coin'); }
        draw(); };
      const tmr = setInterval(() => { if (st.done) return; st.tick++; st.coin += calc().coin; draw(); }, 2000); Eco.onLeave(() => clearInterval(tmr));
      box.append(info, pal, msg, gridEl, h('div.small.muted', '💡 공장은 돈을 많이 벌지만 오염이 커요. 태양광·풍력으로 수입을 먼저 바꾼 뒤 공장을 철거해 보세요!')); draw(); return box;
    } });

  /* ───── 2. 쓰레기 몬스터 디펜스 ───── */
  Eco.addGame('trashdefense', { name: '쓰레기 몬스터 디펜스', emoji: '🛡️', tag: '실시간 방어', desc: '쓰레기 몬스터가 학교로 쳐들어와요! 햇빛을 모아 해바라기·새싹 슈터·선인장을 심어 막아요.', cat: '만들기',
    make() {
      const box = h('div.gamebox'); const CW = 9, RW = 5, S = 64; const cv = h('canvas', { width: CW * S, height: RW * S + 30 }); const g = cv.getContext('2d');
      const PL = { sun: ['🌻', 50, 'sun'], shoot: ['🌱', 100, 'shoot'], wall: ['🌵', 50, 'wall'], tree: ['🌳', 175, 'tree'] };
      let st; const reset = () => { st = { sun: 100, plants: [], mons: [], shots: [], t: 0, sel: 'sun', over: 0, kills: 0, spawned: 0, fall: [] }; }; reset();
      const MON = ['🥤', '🛍️', '🔋', '🛢️']; const TOTAL = 28;
      const bar = h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '6px 0' } });
      const drawBar = () => { bar.innerHTML = ''; bar.append(h('b', '☀️ ' + st.sun + '  ')); Object.entries(PL).forEach(([k, p]) => bar.append(h('button.btn' + (st.sel === k ? '' : '.alt') + '.sm', { onclick: () => { st.sel = k; drawBar(); } }, p[0] + ' ' + p[1]))); };
      cv.addEventListener('pointerdown', e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * cv.width / r.width, y = (e.clientY - r.top) * cv.height / r.height;
        const f = st.fall.findIndex(s => Math.hypot(s.x - x, s.y - y) < 28); if (f >= 0) { st.sun += 25; st.fall.splice(f, 1); Eco.ui.sfx('coin'); drawBar(); return; }
        const c = x / S | 0, r2 = (y - 30) / S | 0; if (r2 < 0 || r2 >= RW || c >= CW || c < 1) return; if (st.plants.some(p => p.c === c && p.r === r2)) return; const P = PL[st.sel]; if (st.sun < P[1]) return;
        st.sun -= P[1]; st.plants.push({ k: st.sel, c, r: r2, hp: st.sel === 'wall' ? 12 : 4, cd: 0 }); drawBar(); });
      const step = () => { if (st.over) return; st.t++;
        if (st.t % 240 === 0) st.fall.push({ x: R(80, CW * S - 40), y: 40, vy: .6 });
        st.fall.forEach(s => { if (s.y < RW * S) s.y += s.vy; });
        if (st.t > 150 && st.spawned < TOTAL && st.t % Math.max(60, 190 - st.spawned * 4) === 0) { st.mons.push({ x: CW * S, r: ri(RW), hp: 3 + (st.spawned > 14 ? 2 : 0), e: Eco.pick(MON), sp: R(.25, .4) }); st.spawned++; }
        st.plants.forEach(p => { p.cd--; if (p.k === 'sun' && p.cd <= 0) { p.cd = 600; st.fall.push({ x: p.c * S + 30, y: p.r * S + 50, vy: 0 }); }
          if ((p.k === 'shoot' || p.k === 'tree') && p.cd <= 0 && st.mons.some(m => m.r === p.r && m.x > p.c * S)) { p.cd = p.k === 'tree' ? 45 : 85; st.shots.push({ x: p.c * S + 50, r: p.r, d: p.k === 'tree' ? 2 : 1 }); } });
        st.shots.forEach(s => { s.x += 5; const m = st.mons.find(m => m.r === s.r && Math.abs(m.x - s.x) < 22); if (m) { m.hp -= s.d; s.dead = 1; } }); st.shots = st.shots.filter(s => !s.dead && s.x < CW * S);
        st.mons.forEach(m => { const p = st.plants.find(p => p.r === m.r && Math.abs(p.c * S + 40 - m.x) < 30); if (p) { p.hp -= .02; if (p.hp <= 0) st.plants.splice(st.plants.indexOf(p), 1); } else m.x -= m.sp; if (m.x < 60) st.over = -1; });
        const before = st.mons.length; st.mons = st.mons.filter(m => m.hp > 0); st.kills += before - st.mons.length;
        if (!st.over && st.spawned >= TOTAL && !st.mons.length) st.over = 1;
        if (st.over) end(); render(); drawBar(); };
      const end = () => { const sc = st.over === 1 ? 100 + st.sun : st.kills * 3; Eco.gameDone('trashdefense', sc, st.over === 1 ? 12 : 3, '쓰레기 몬스터 디펜스'); if (st.over === 1) Eco.ui.confetti(80); };
      const render = () => { g.clearRect(0, 0, cv.width, cv.height); g.fillStyle = '#e9f6d9'; g.fillRect(0, 30, cv.width, RW * S);
        for (let r = 0; r < RW; r++) for (let c = 0; c < CW; c++) { g.fillStyle = (r + c) % 2 ? '#d9efc4' : '#e3f4d1'; g.fillRect(c * S, 30 + r * S, S, S); }
        g.fillStyle = '#fff'; g.fillRect(0, 30, S, RW * S); g.font = '34px serif'; g.textAlign = 'center'; for (let r = 0; r < RW; r++) g.fillText('🏫', S / 2, 30 + r * S + 44);
        g.fillStyle = '#2d5a1f'; g.font = 'bold 14px sans-serif'; g.fillText('처치 ' + st.kills + ' · 남은 몬스터 ' + (TOTAL - st.kills), 120, 20);
        g.font = '36px serif'; st.plants.forEach(p => g.fillText(PL[p.k][0], p.c * S + S / 2, 30 + p.r * S + 44)); st.shots.forEach(s => { g.font = '16px serif'; g.fillText('💧', s.x, 30 + s.r * S + 36); });
        g.font = '36px serif'; st.mons.forEach(m => g.fillText(m.e, m.x, 30 + m.r * S + 44)); g.font = '30px serif'; st.fall.forEach(s => g.fillText('☀️', s.x, s.y));
        if (st.over) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.fillText(st.over === 1 ? '🎉 학교를 지켰어요!' : '😢 몬스터가 학교에 도착했어요', cv.width / 2, cv.height / 2); } };
      const tmr = setInterval(step, 16); Eco.onLeave(() => clearInterval(tmr)); drawBar();
      box.append(h('div.note', '☀️ 하늘에서 떨어지는 햇빛을 눌러 모아요. 해바라기는 햇빛을 만들고, 새싹·큰나무는 물방울로 쓰레기를 맞혀요. 몬스터가 학교(왼쪽)에 닿으면 끝!'), bar, cv, h('button.btn.alt.sm', { style: { marginTop: '8px' }, onclick: () => { reset(); drawBar(); } }, '🔄 처음부터')); return box;
    } });

  /* ───── 3. 에코 농장 ───── */
  const CROPS = { carrot: ['🥕', 4, 12, 6], tomato: ['🍅', 6, 18, 10], corn: ['🌽', 10, 28, 15] };
  Eco.addGame('ecofarm', { name: '에코 농장', emoji: '🧑‍🌾', tag: '키우기 · 경영', desc: '씨앗을 심고 물을 주고 수확해요. 빗물통·퇴비·무당벌레로 농약 없는 친환경 농장을 키워요!', cat: '만들기',
    make() {
      const S = Eco.store.get(); S.farm = S.farm || { coin: 15, up: {}, harv: 0 };
      const F = S.farm, box = h('div.gamebox'); const plots = Array.from({ length: 12 }, () => ({ s: 'empty' })); let sel = 'carrot'; let done = false;
      const UP = { rain: ['🪣', '빗물통', 25, '물주기를 자동으로 해 줘요'], compost: ['🧺', '퇴비통', 30, '잔반 퇴비로 성장 속도 1.5배'], ladybug: ['🐞', '무당벌레', 20, '해충을 자동으로 잡아요'] };
      const info = h('div.note'), msg = h('div.small.muted'), pal = h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } }), gridEl = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', margin: '8px 0' } }), ups = h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } });
      const draw = () => {
        info.innerHTML = ''; info.append('🪙 ', h('b', F.coin), ' · 수확 ', h('b', F.harv), '개 · 🎯 목표: 수확 12개 + 업그레이드 3개');
        pal.innerHTML = ''; Object.entries(CROPS).forEach(([k, c]) => pal.append(h('button.btn' + (sel === k ? '' : '.alt') + '.sm', { onclick: () => { sel = k; draw(); } }, c[0] + ' 씨앗 🪙' + c[1] + ' → 🪙' + c[2])));
        ups.innerHTML = ''; Object.entries(UP).forEach(([k, u]) => ups.append(F.up[k] ? h('span.chip', u[0] + ' ' + u[1] + ' ✔') : h('button.btn.alt.sm', { title: u[3], onclick: () => { if (F.coin < u[2]) return msg.textContent = '코인이 부족해요'; F.coin -= u[2]; F.up[k] = 1; Eco.store.save(); Eco.ui.sfx('coin'); msg.textContent = u[0] + ' ' + u[1] + ' 설치! ' + u[3]; draw(); } }, u[0] + ' ' + u[1] + ' 🪙' + u[2])));
        gridEl.innerHTML = ''; plots.forEach((p, i) => { const c = CROPS[p.k]; const label = p.s === 'empty' ? '＋' : p.s === 'grow' ? (p.wet ? '🌱' : '🥀') : p.s === 'ready' ? c[0] : '🐛'; const sub = p.s === 'grow' ? (p.wet ? Math.floor(p.pr) + '%' : '물!') : p.s === 'ready' ? '수확!' : p.s === 'bug' ? '해충!' : '';
          gridEl.append(h('button', { style: { aspectRatio: '1.2', fontSize: '1.7rem', borderRadius: '12px', border: '2px solid ' + (p.s === 'ready' ? '#f0b429' : '#c9b08a'), background: p.s === 'grow' && p.wet ? '#8d6e4a' : '#b89968', color: '#fff', cursor: 'pointer', lineHeight: 1.1 }, onclick: () => click(i) }, label, h('div', { style: { fontSize: '.7rem' } }, sub))); });
        if (!done && F.harv >= 12 && Object.keys(F.up).length >= 3) { done = true; Eco.gameDone('ecofarm', F.harv * 10, 12, '에코 농장'); Eco.ui.confetti(70); msg.textContent = '🏅 친환경 농장 인증! 계속 키워도 좋아요.'; }
      };
      const click = i => { const p = plots[i]; if (p.s === 'empty') { const c = CROPS[sel]; if (F.coin < c[1]) return msg.textContent = '씨앗값이 부족해요'; F.coin -= c[1]; plots[i] = { s: 'grow', k: sel, pr: 0, wet: !!F.up.rain }; Eco.ui.sfx('coin'); }
        else if (p.s === 'grow' && !p.wet) { p.wet = true; Eco.ui.sfx('coin'); } else if (p.s === 'ready') { F.coin += CROPS[p.k][2]; F.harv++; plots[i] = { s: 'empty' }; Eco.ui.sfx('coin'); Eco.store.save(); }
        else if (p.s === 'bug') { p.s = 'grow'; msg.textContent = '🐛 해충을 손으로 잡았어요! 농약 없이도 가능해요.'; } draw(); };
      const tmr = setInterval(() => { plots.forEach(p => { if (p.s === 'grow') { if (F.up.rain && !p.wet) p.wet = true; if (p.wet) { p.pr += 100 / (CROPS[p.k][3] * (F.up.compost ? .67 : 1)) / 2; if (p.pr >= 100) { p.s = 'ready'; } else if (!F.up.ladybug && Math.random() < .012) p.s = 'bug'; else if (F.up.ladybug && Math.random() < .004) { /* 무당벌레가 처리 */ } } } else if (p.s === 'bug') { p.pr -= 2; if (p.pr < 0) plots[plots.indexOf(p)] = { s: 'empty' }; } }); draw(); }, 500); Eco.onLeave(() => clearInterval(tmr));
      box.append(info, pal, msg, gridEl, h('div.small', '🏗️ 업그레이드'), ups, h('div.small.muted', { style: { marginTop: '6px' } }, '💡 칸을 눌러 심기 → 물주기 → 수확! 🐛 해충은 눌러서 잡거나 🐞 무당벌레를 키워요. 코인과 업그레이드는 저장돼요.')); draw(); return box;
    } });

  /* ───── 4. 바다 청소 보트 ───── */
  Eco.addGame('boat', { name: '바다 청소 보트', emoji: '🚤', tag: '아케이드 · 성장', desc: '보트를 몰아 바다 쓰레기를 건져요! 거북이·물고기는 피해요. 번 코인으로 그물과 엔진을 업그레이드!', cat: '만들기',
    make() {
      const S = Eco.store.get(); S.boat = S.boat || { coin: 0, net: 0, spd: 0, runs: 0 }; const B = S.boat;
      const box = h('div.gamebox'); const W = 560, H = 420; const cv = h('canvas', { width: W, height: H }); const g = cv.getContext('2d');
      let run = null; const shop = h('div'), top = h('div.note');
      const drawShop = () => { top.innerHTML = ''; top.append('🪙 보유 ', h('b', B.coin), ' · 그물 Lv.', h('b', B.net), ' · 엔진 Lv.', h('b', B.spd), ' · 출항 ', B.runs, '회'); shop.innerHTML = ''; shop.append(h('button.btn.alt.sm', { onclick: () => up('net') }, '🕸️ 그물 키우기 🪙' + (10 + B.net * 12)), ' ', h('button.btn.alt.sm', { onclick: () => up('spd') }, '⚙️ 엔진 🪙' + (10 + B.spd * 12)), ' ', h('button.btn.sm', { onclick: start }, run ? '🔁 다시 출항' : '🚤 출항하기!')); };
      const up = k => { const c = 10 + B[k] * 12; if (B.coin < c || B[k] >= 5) return Eco.ui.toast(B[k] >= 5 ? '최대 레벨이에요!' : '코인이 부족해요'); B.coin -= c; B[k]++; Eco.store.save(); Eco.ui.sfx('coin'); drawShop(); };
      const ITEMS = ['🥤', '🛍️', '👟', '🥫', '🎣', '🧴']; const LIFE = ['🐢', '🐟', '🐙', '🐬'];
      const start = () => { run = { x: W / 2, tx: W / 2, y: H - 70, t: 45 * 60, items: [], got: 0, hit: 0, score: 0, over: false, f: 0 }; B.runs++; };
      cv.addEventListener('pointermove', e => { if (!run) return; const r = cv.getBoundingClientRect(); run.tx = (e.clientX - r.left) * W / r.width; });
      cv.addEventListener('pointerdown', e => { if (!run) return; const r = cv.getBoundingClientRect(); run.tx = (e.clientX - r.left) * W / r.width; });
      const onk = e => { if (!run) return; if (e.key === 'ArrowLeft') run.tx -= 50; if (e.key === 'ArrowRight') run.tx += 50; }; window.addEventListener('keydown', onk);
      let raf; const loop = () => { raf = requestAnimationFrame(loop); g.fillStyle = '#7ac4ea'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 8; i++) g.fillRect(((i * 97 + (run ? run.f : 0) * 1.5) % (W + 60)) - 30, (i * 53) % H, 50, 4);
        if (!run) { g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('🚤 출항하기를 눌러요!', W / 2, H / 2); g.font = '16px sans-serif'; g.fillText('마우스/손가락으로 보트를 좌우로 움직여요', W / 2, H / 2 + 30); return; }
        const r = run; r.f++; if (!r.over) { r.t--; const sp = 7 + B.spd * 2.2; r.x += Math.max(-sp, Math.min(sp, r.tx - r.x)); r.x = Math.max(24, Math.min(W - 24, r.x));
          if (r.f % Math.max(14, 34 - Math.floor(r.f / 120)) === 0) r.items.push(Math.random() < .25 ? { e: Eco.pick(LIFE), life: true, x: R(20, W - 20), y: -20, v: R(1.5, 2.6) } : { e: Eco.pick(ITEMS), x: R(20, W - 20), y: -20, v: R(1.8, 3.2) });
          const reach = 30 + B.net * 8; r.items.forEach(it => { it.y += it.v; if (Math.abs(it.x - r.x) < reach && Math.abs(it.y - r.y) < 30) { it.dead = 1; if (it.life) { r.hit++; r.score -= 8; Eco.ui.sfx('coin'); } else { r.got++; r.score += 5; Eco.ui.sfx('coin'); } } if (it.y > H + 20) it.dead = 1; }); r.items = r.items.filter(i => !i.dead);
          if (r.t <= 0) { r.over = true; const earn = Math.max(0, r.got * 2 - r.hit * 3); B.coin += earn; r.earn = earn; Eco.store.save(); Eco.gameDone('boat', Math.max(0, r.score), 8, '바다 청소 보트'); drawShop(); } }
        g.textAlign = 'center'; g.font = '30px serif'; r.items.forEach(it => g.fillText(it.e, it.x, it.y)); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.beginPath(); g.arc(r.x, r.y + 6, 30 + B.net * 8, Math.PI, 0); g.stroke(); g.font = '44px serif'; g.fillText('🚤', r.x, r.y + 20);
        g.fillStyle = '#0b3a5c'; g.font = 'bold 16px sans-serif'; g.textAlign = 'left'; g.fillText('⏱ ' + Math.ceil(r.t / 60) + '초   🗑️ ' + r.got + '   🐢 잘못 잡음 ' + r.hit, 12, 24);
        if (r.over) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 26px sans-serif'; g.fillText('쓰레기 ' + r.got + '개 수거! 🪙 +' + r.earn, W / 2, H / 2 - 6); g.font = '16px sans-serif'; g.fillText('바다 생물을 잡으면 감점이에요 — 그물이 커질수록 조심!', W / 2, H / 2 + 24); } };
      loop(); Eco.onLeave(() => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onk); }); drawShop();
      box.append(top, cv, h('div', { style: { marginTop: '8px' } }, shop)); return box;
    } });

  Eco.EXTRA.push(
    { id: 'ecotown', route: '#/game/ecotown', emoji: '🏙️', name: '에코타운 만들기', ref: '게이미피케이션 확장 — 도시 건설형 시뮬레이션(탄소중립·에너지 전환)', desc: '공장을 철거하고 태양광·나무·버스로 에코타운을 완성해요.' },
    { id: 'trashdefense', route: '#/game/trashdefense', emoji: '🛡️', name: '쓰레기 몬스터 디펜스', ref: '게이미피케이션 확장 — 실시간 방어형', desc: '해바라기·새싹 슈터·선인장으로 쓰레기 몬스터를 막아요.' },
    { id: 'ecofarm', route: '#/game/ecofarm', emoji: '🧑‍🌾', name: '에코 농장', ref: '게이미피케이션 확장 — 키우기·경영형(친환경 농업)', desc: '심고 물 주고 수확하며 빗물통·퇴비·무당벌레로 농장을 키워요.' },
    { id: 'boat', route: '#/game/boat', emoji: '🚤', name: '바다 청소 보트', ref: '게이미피케이션 확장 — 아케이드+업그레이드 성장형', desc: '바다 쓰레기를 건지고 번 코인으로 보트를 업그레이드해요.' }
  );
})(window.Eco);
