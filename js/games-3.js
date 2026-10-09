/* 에코 놀이터 3: AI 트레이너 · 바이브 숲 스튜디오 · 숲 해설사 챗봇 */
(function (Eco) {
  const { h } = Eco.ui;

  /* ───── AI 트레이너 (지도학습 체험) ───── */
  const SETS = {
    recycle: { title: '분리수거 AI (엔트리 모티브)', classes: ['종이', '유리', '캔', '플라스틱'], feat: ['투명도', '반짝임', '말랑함', '무게'],
      train: [['🗞️', '신문', 0, [0, 0, .8, .1]], ['📦', '상자', 0, [0, 0, .5, .3]], ['📚', '책', 0, [0, .1, .3, .4]], ['🥛', '우유팩', 0, [0, .2, .5, .2]], ['🍾', '유리병', 1, [.9, .8, 0, .9]], ['🫙', '잼병', 1, [.8, .7, 0, .8]], ['🥃', '유리컵', 1, [.9, .9, 0, .6]], ['🍷', '유리잔', 1, [.95, .9, 0, .5]], ['🥫', '참치캔', 2, [0, .9, 0, .5]], ['🥫', '통조림', 2, [0, .85, 0, .6]], ['🥤', '음료캔', 2, [0, 1, 0, .3]], ['🧂', '캔 용기', 2, [0, .8, 0, .4]], ['🧴', '샴푸통', 3, [.4, .5, .6, .2]], ['🍶', '페트병', 3, [.8, .5, .5, .2]], ['🥡', '배달 용기', 3, [.5, .4, .4, .2]], ['🪣', '플라스틱통', 3, [.2, .4, .2, .4]]],
      test: [['📰', '잡지', 0, [0, .2, .6, .2]], ['🧃', '주스 팩', 0, [0, .3, .5, .2]], ['🫙', '피클병', 1, [.85, .75, 0, .85]], ['🍺', '유리 맥주병', 1, [.7, .8, 0, .9]], ['🥫', '옥수수캔', 2, [0, .95, 0, .45]], ['🥤', '탄산캔', 2, [0, 1, 0, .25]], ['🧴', '세제통', 3, [.5, .6, .5, .2]], ['🍼', '플라스틱 물병', 3, [.85, .5, .5, .2]]] },
    plant: { title: '식물 용도 분류 AI (티처블머신 모티브)', classes: ['원료·재료', '먹을거리', '아름다운 환경', '그 밖의 쓰임'], feat: ['먹을 수 있음', '재료로 씀', '아름다움', '약·향기'],
      train: [['🌲', '소나무', 0, [0, 1, .4, .2]], ['🎋', '대나무', 0, [.1, 1, .2, 0]], ['🪵', '참나무', 0, [0, 1, .3, 0]], ['🌾', '목화', 0, [0, 1, .3, 0]], ['🌾', '벼', 1, [1, .2, .1, 0]], ['🥔', '감자', 1, [1, 0, 0, 0]], ['🍎', '사과나무', 1, [1, 0, .3, 0]], ['🥬', '상추', 1, [1, 0, 0, .1]], ['🌹', '장미', 2, [.1, 0, 1, .4]], ['🌷', '튤립', 2, [0, 0, 1, 0]], ['🌻', '해바라기', 2, [.4, .2, 1, 0]], ['🪴', '스킨답서스', 2, [0, 0, .9, 0]], ['🌿', '박하', 3, [.2, 0, .2, 1]], ['🌿', '쑥', 3, [.2, 0, 0, 1]], ['🌱', '알로에', 3, [.1, 0, .3, 1]], ['🌼', '캐모마일', 3, [.2, 0, .5, .9]]],
      test: [['🌲', '잣나무', 0, [0, .95, .4, .2]], ['🎋', '갈대', 0, [0, .8, .3, 0]], ['🍅', '토마토', 1, [1, 0, .2, 0]], ['🌽', '옥수수', 1, [1, .2, .1, 0]], ['🌸', '벚나무', 2, [0, .2, 1, 0]], ['💐', '코스모스', 2, [0, 0, .95, .1]], ['🌿', '라벤더', 3, [0, 0, .5, 1]], ['🌿', '민트', 3, [.3, 0, .2, .9]]] }
  };
  Eco.addGame('aitrainer', { name: 'AI 트레이너', emoji: '🤖', tag: '머신러닝 체험', desc: '내가 가르친 대로 AI가 분류해요! 데이터가 틀리면 AI도 틀려요.', cat: 'AI 리터러시',
    make() {
      let key = 'recycle', labels = {}, trained = false, results = null; const box = h('div.gamebox');
      const dist = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
      function predict(f, D) { const pts = D.train.map((t, i) => ({ i, c: labels[i], d: dist(f, t[3]) })).filter(p => p.c != null).sort((a, b) => a.d - b.d).slice(0, 3); if (!pts.length) return [null, 0]; const sc = {}; pts.forEach(p => sc[p.c] = (sc[p.c] || 0) + 1 / (p.d + .05)); const tot = Object.values(sc).reduce((a, b) => a + b, 0); const best = Object.entries(sc).sort((a, b) => b[1] - a[1])[0]; return [+best[0], best[1] / tot]; }
      const draw = () => {
        const D = SETS[key]; box.innerHTML = '';
        box.append(h('div.pill-tabs', Object.entries(SETS).map(([k, v]) => h('button' + (k === key ? '.on' : ''), { onclick: () => { key = k; labels = {}; trained = false; results = null; draw(); } }, v.title))));
        box.append(h('div.note.blue', '1️⃣ 데이터에 이름표(라벨)를 붙여 가르쳐요 → 2️⃣ AI 학습 → 3️⃣ 처음 보는 물건을 맞히는지 시험! (이미지 대신 특징 숫자로 단순화한 체험이에요)'));
        const g = h('div.grid.g3'); D.train.forEach((t, i) => g.append(h('div.card', { style: { padding: '8px' } }, h('div.row', h('span', { style: { fontSize: '2rem' } }, t[0]), h('b', t[1])), h('div.small.muted', D.feat.map((f, k) => f + ' ' + Math.round(t[3][k] * 100)).join(' · ')), h('div.row', { style: { gap: '4px', marginTop: '4px' } }, D.classes.map((c, ci) => h('button.btn.sm' + (labels[i] === ci ? '' : '.alt'), { style: { padding: '3px 8px' }, onclick: () => { labels[i] = ci; trained = false; Eco.ui.sfx('click'); draw(); } }, c)))))); box.append(g);
        const n = Object.keys(labels).length; box.append(h('div.row', { style: { margin: '10px 0' } }, h('span.chip', '라벨 ' + n + '/' + D.train.length), h('button.btn.sm.alt', { onclick: () => { D.train.forEach((t, i) => labels[i] = t[2]); draw(); } }, '👩‍🏫 정답 라벨 자동 입력'), h('button.btn.sm.alt', { onclick: () => { D.train.forEach((t, i) => labels[i] = Math.random() < .4 ? (t[2] + 1 + Math.random() * 2 | 0) % D.classes.length : t[2]); draw(); } }, '😈 일부러 틀리게 가르치기'), h('button.btn.sm.alt', { onclick: () => { labels = {}; draw(); } }, '지우기'),
          h('button.btn.ai', { onclick: () => { const need = D.classes.some((c, ci) => !Object.values(labels).includes(ci)); if (need) { Eco.ui.toast('모든 종류에 최소 1개씩 라벨을 붙여 주세요'); return; } trained = true; results = D.test.map(t => { const [p, conf] = predict(t[3], D); return { t, p, conf, ok: p === t[2] }; }); Eco.ui.sfx('ok'); const acc = results.filter(r => r.ok).length; if (acc >= 6) Eco.ui.confetti(40); Eco.gameDone('aitrainer', acc * 10 + (n === D.train.length ? 5 : 0), acc >= 6 ? 20 : acc >= 4 ? 10 : 3, 'AI 트레이너'); draw(); } }, '🧠 AI 학습시키고 시험 보기')));
        if (results && trained) { const acc = results.filter(r => r.ok).length; box.append(h('h3', '📝 AI 시험 결과: ' + acc + ' / ' + results.length), h('div.grid.g4', results.map(r => h('div.card', { style: { padding: '8px', borderColor: r.ok ? 'var(--g2)' : 'var(--berry)' } }, h('div', { style: { fontSize: '2rem' } }, r.t[0]), h('b', r.t[1]), h('div.small', 'AI 예측: ', h('b', D.classes[r.p] || '?'), ' (' + Math.round(r.conf * 100) + '%)'), h('div.small', r.ok ? '✅ 정답' : '❌ 정답은 ' + D.classes[r.t[2]]))))); box.append(h('div.note', acc >= 7 ? '🎉 좋은 데이터로 가르치니 AI가 잘 맞혔어요!' : '🤔 AI가 틀렸어요. 라벨이 틀렸거나 데이터가 부족하지 않았나요? ‘정답 라벨 자동 입력’과 비교해 보세요. AI는 데이터를 닮아요!')); }
      };
      draw(); return box;
    } });

  /* ───── 바이브 숲 스튜디오 ───── */
  const NUM = { 한: 1, 하나: 1, 두: 2, 둘: 2, 세: 3, 셋: 3, 네: 4, 넷: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10, 여러: 6, 많은: 7 };
  const NOUNS = [['tree', ['나무', '숲'], 4], ['pine', ['소나무', '침엽수'], 4], ['maple', ['단풍나무'], 4], ['cherry', ['벚나무', '벚꽃나무'], 3], ['flower', ['꽃'], 8], ['grass', ['풀밭', '풀'], 1], ['🍄', ['버섯'], 4], ['🪨', ['바위', '돌'], 3], ['🐿️', ['다람쥐'], 2], ['🐇', ['토끼'], 2], ['🦌', ['사슴'], 2], ['🐦', ['새'], 3], ['🦋', ['나비'], 4], ['🐻', ['곰'], 1], ['🦊', ['여우'], 1], ['🐸', ['개구리'], 2], ['🦉', ['부엉이', '올빼미'], 1], ['🐢', ['거북'], 1], ['🏠', ['오두막', '집'], 1], ['⛺', ['텐트'], 1], ['🔥', ['모닥불'], 1], ['🌈', ['무지개'], 1], ['lake', ['호수', '연못'], 1], ['river', ['강', '시냇물', '냇물'], 1], ['🪵', ['통나무'], 2]];
  function parseScene(text) {
    const t = text.replace(/\s+/g, ' ');
    const spec = { season: /가을|단풍/.test(t) ? '가을' : /겨울|눈 |눈이|설경/.test(t + ' ') ? '겨울' : /여름|한여름/.test(t) ? '여름' : /봄|벚꽃/.test(t) ? '봄' : '여름', time: /밤|달빛|별/.test(t) ? '밤' : /저녁|노을|해질/.test(t) ? '저녁' : /새벽|아침/.test(t) ? '새벽' : '낮', weather: /비가|비 오|비오|소나기|장마/.test(t) ? '비' : /눈이|눈 내|함박눈|눈 오/.test(t) ? '눈' : /안개/.test(t) ? '안개' : /흐린|구름/.test(t) ? '흐림' : '맑음', objects: [] };
    if (/눈이|눈 내|함박눈|눈 오/.test(t) && !/가을|여름|봄/.test(t)) spec.season = '겨울';
    NOUNS.forEach(([ty, al, def]) => {
      let best = null;
      al.forEach(a => { let from = 0, idx; while ((idx = t.indexOf(a, from)) >= 0) { from = idx + a.length;
        // 더 긴 단어(소나무/단풍나무/벚나무 속 '나무', 오두막집 속 '집')에 포함되면 무시
        if (a === '나무' && /(소|단풍|벚|벚꽃)$/.test(t.slice(Math.max(0, idx - 3), idx))) continue;
        if (a === '집' && /오두막$/.test(t.slice(0, idx))) continue; if (a === '새' && /^(벽|롭|로|싹|해)/.test(t.slice(idx + 1, idx + 2))) continue;
        let n = null; const pre = t.slice(Math.max(0, idx - 8), idx), post = t.slice(idx + a.length, idx + a.length + 8);
        let m = /(\d+|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|여러|많은)\s*(그루|마리|송이|개|채|명|포기)?\s*(의)?\s*$/.exec(pre); if (m) n = isNaN(m[1]) ? NUM[m[1]] : +m[1];
        if (n == null) { m = /^[을를이가은는과와도의]?\s*(\d+|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|여러|많은)\s*(그루|마리|송이|개|채|명|포기)/.exec(post); if (m) n = isNaN(m[1]) ? NUM[m[1]] : +m[1]; }
        if (a === '숲' && n == null) n = 8; if (n == null) n = /들/.test(post.slice(0, 2)) ? def + 2 : (['flower', 'tree', 'pine'].includes(ty) ? def : (ty === 'grass' ? 1 : (def > 1 ? Math.max(1, Math.round(def / 2)) : def)));
        best = Math.max(best || 0, Math.min(n, 14)); } });
      if (best) spec.objects.push({ type: ty, count: best });
    });
    if (spec.season === '가을' && spec.objects.some(o => o.type === 'tree') && !spec.objects.some(o => o.type === 'maple')) { /* 일반 나무도 가을색 */ }
    if (/단풍나무/.test(t)) spec.season = '가을';
    return spec;
  }
  function seeded(s) { let a = 0; for (let i = 0; i < s.length; i++) a = (a * 31 + s.charCodeAt(i)) | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function renderScene(cv, spec, seedStr, tick) {
    const ctx = cv.getContext('2d'), W = cv.width, H = cv.height, R = seeded(seedStr), horizon = H * .52; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const night = spec.time === '밤', dusk = spec.time === '저녁', dawn = spec.time === '새벽', dark = spec.weather === '비' || spec.weather === '흐림';
    const sk = night ? ['#0b1a3d', '#243b72'] : dusk ? ['#ff9a5a', '#7a5ea8'] : dawn ? ['#ffd1a6', '#9ecfff'] : dark ? ['#9aa8b5', '#c8d2db'] : ['#6bb8f0', '#d8f0ff'];
    let g = ctx.createLinearGradient(0, 0, 0, horizon); g.addColorStop(0, sk[0]); g.addColorStop(1, sk[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon + 2);
    if (night) { for (let i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (.4 + R() * .6) + ')'; ctx.fillRect(R() * W, R() * horizon * .9, 2, 2); } ctx.font = '46px serif'; ctx.fillText('🌙', W * .78, 60); }
    else if (spec.weather === '맑음' || spec.weather === '안개') { ctx.font = '50px serif'; ctx.fillText(dusk ? '🌇' : '☀️', dusk ? W * .08 : W * .8, dusk ? horizon - 12 : 62); }
    else { ctx.font = '40px serif'; ctx.fillText('☁️', W * .2, 60); ctx.fillText('☁️', W * .6, 44); }
    const gc = { 봄: ['#9be07a', '#76c85c'], 여름: ['#56b03e', '#3d9a35'], 가을: ['#d6a64a', '#c2862f'], 겨울: ['#f2f7fb', '#dfe9f2'] }[spec.season];
    const mc = { 봄: '#7aa68a', 여름: '#4f8a63', 가을: '#9a7a58', 겨울: '#b9c9d9' }[spec.season];
    ctx.fillStyle = mc; ctx.beginPath(); ctx.moveTo(0, horizon); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, horizon - 30 - R() * 55); ctx.lineTo(W, horizon); ctx.fill();
    g = ctx.createLinearGradient(0, horizon, 0, H); g.addColorStop(0, gc[0]); g.addColorStop(1, gc[1]); ctx.fillStyle = g; ctx.fillRect(0, horizon, W, H - horizon);
    const place = () => ({ x: 30 + R() * (W - 60), y: horizon + 14 + R() * (H - horizon - 30) });
    const items = [];
    spec.objects.forEach(o => { for (let i = 0; i < o.count; i++) { const p = place(); items.push({ ty: o.type, x: p.x, y: p.y, s: R() }); } });
    spec.objects.filter(o => o.type === 'lake').forEach(() => { ctx.fillStyle = night ? '#1f3f7a' : '#7cc7f0'; ctx.beginPath(); ctx.ellipse(W * .3, horizon + 78, 95, 26, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.stroke(); });
    spec.objects.filter(o => o.type === 'river').forEach(() => { ctx.strokeStyle = night ? '#1f3f7a' : '#7cc7f0'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(W * .6, horizon); ctx.bezierCurveTo(W * .3, horizon + 40, W * .8, horizon + 90, W * .45, H); ctx.stroke(); ctx.lineWidth = 1; });
    items.sort((a, b) => a.y - b.y).forEach(it => {
      const sc = .7 + (it.y - horizon) / (H - horizon) * .8; ctx.save(); ctx.translate(it.x, it.y); ctx.scale(sc, sc);
      const leaf = { 봄: ['#ffb7d1', '#8edc6a', '#6fc851'], 여름: ['#2f9a3f', '#3fae4a', '#278a37'], 가을: ['#e8731f', '#d9a21f', '#c4361f'], 겨울: ['#eaf3fb', '#cfe0ee', '#fff'] }[spec.season];
      if (['tree', 'maple', 'cherry'].includes(it.ty)) { ctx.fillStyle = '#7a4d2a'; ctx.fillRect(-4, -28, 8, 30); const cols = it.ty === 'cherry' ? ['#ffb7d1', '#ff9fc2', '#ffd0e0'] : it.ty === 'maple' ? ['#e8731f', '#d9361f', '#e8a31f'] : leaf; [[0, -46, 22], [-14, -34, 17], [14, -34, 17]].forEach((c, i) => { ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.arc(c[0], c[1], c[2], 0, 7); ctx.fill(); }); }
      else if (it.ty === 'pine') { ctx.fillStyle = '#6b4a2a'; ctx.fillRect(-3, -8, 6, 12); [[-22, -8, 22], [-17, -26, 17], [-12, -44, 12]].forEach(c => { ctx.fillStyle = spec.season === '겨울' ? '#e8f2f8' : '#2f7a4a'; ctx.beginPath(); ctx.moveTo(c[0] + 0, c[1]); ctx.lineTo(-c[0], c[1]); ctx.lineTo(0, c[1] - c[2] * 1.4); ctx.fill(); }); }
      else if (it.ty === 'flower') { ctx.fillStyle = ['#ff6b8a', '#ffd93d', '#ffffff', '#b58cff'][(it.s * 4) | 0]; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(Math.cos(k * 1.256) * 5, -10 + Math.sin(k * 1.256) * 5, 3.5, 0, 7); ctx.fill(); } ctx.fillStyle = '#ffd93d'; ctx.beginPath(); ctx.arc(0, -10, 3, 0, 7); ctx.fill(); ctx.strokeStyle = '#3d9a35'; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 4); ctx.stroke(); }
      else if (it.ty === 'grass') { ctx.strokeStyle = '#3d9a35'; for (let k = -10; k < 11; k += 4) { ctx.beginPath(); ctx.moveTo(k, 4); ctx.lineTo(k + (k % 3), -10); ctx.stroke(); } }
      else { const big = { '🏠': 48, '⛺': 44, '🔥': 30, '🐻': 40, '🦌': 40 }[it.ty] || 30; ctx.font = big + 'px serif'; ctx.textAlign = 'center'; const bob = ['🦋', '🐦'].includes(it.ty) ? Math.sin(tick / 12 + it.x) * 6 - 24 : 0; ctx.fillText(it.ty, 0, bob); }
      ctx.restore();
    });
    if (night) { ctx.fillStyle = 'rgba(8,16,48,.38)'; ctx.fillRect(0, 0, W, H); } else if (dusk) { ctx.fillStyle = 'rgba(255,140,60,.15)'; ctx.fillRect(0, 0, W, H); }
    if (spec.weather === '안개') { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(0, horizon - 30, W, 110); }
    if (spec.weather === '비' || spec.weather === '눈') { const snow = spec.weather === '눈'; ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.fillStyle = 'rgba(255,255,255,.9)'; const rr = seeded('rain'); for (let i = 0; i < (snow ? 90 : 120); i++) { const x = rr() * W, y = (rr() * H + tick * (snow ? 1.4 : 7)) % H; if (snow) { ctx.beginPath(); ctx.arc(x + Math.sin((tick + i) / 20) * 6, y, 2.4, 0, 7); ctx.fill(); } else { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 10); ctx.stroke(); } } }
    if (spec.objects.some(o => o.type === '🌈')) { /* 무지개는 이모지로 */ }
  }
  const VMISSIONS = [['가을 저녁 숲에 다람쥐 세 마리와 단풍나무 다섯 그루가 있어요.', s => s.season === '가을' && s.time === '저녁' && cnt(s, '🐿️') >= 3 && cnt(s, 'maple') >= 5], ['눈이 내리는 겨울 밤, 소나무 여섯 그루 옆에 모닥불과 텐트를 놓아 줘.', s => s.season === '겨울' && s.time === '밤' && cnt(s, 'pine') >= 6 && cnt(s, '🔥') >= 1 && cnt(s, '⛺') >= 1], ['비가 오는 봄 낮, 벚나무 세 그루와 꽃 열 송이, 개구리 두 마리가 사는 연못을 그려 줘.', s => s.season === '봄' && s.weather === '비' && cnt(s, 'cherry') >= 3 && cnt(s, 'flower') >= 10 && cnt(s, '🐸') >= 2 && cnt(s, 'lake') >= 1]];
  const cnt = (s, ty) => (s.objects.find(o => o.type === ty) || { count: 0 }).count;
  Eco.addGame('vibe', { name: '바이브 숲 스튜디오', emoji: '🪄', tag: '바이브코딩', desc: '말로 설명하면 코드가 숲을 그려 줘요! 자연어 → 장면 명세 → 그림.', cat: 'AI 리터러시',
    make() {
      const S = Eco.store.get(); let raf, tick = 0, spec, text = '여름 낮, 숲에 꽃 다섯 송이와 나비 두 마리, 호수가 있어요.'; const cv = h('canvas', { width: 560, height: 340 });
      const ta = h('textarea', { 'aria-label': '장면 설명', style: { minHeight: '70px' } }); ta.value = text; const out = h('pre', { style: { background: '#1d2b24', color: '#d9f5d0', padding: '10px 14px', borderRadius: '14px', fontSize: '.8rem', overflow: 'auto', margin: 0, maxHeight: '200px' } }); const mis = h('div');
      const apply = () => { text = ta.value; spec = parseScene(text); out.textContent = JSON.stringify(spec, null, 1).replace(/\n\s+/g, ' ').replace(/\{ "type"/g, '\n  { "type"'); const hit = VMISSIONS.findIndex(m => m[1](spec)); drawMis(hit); };
      const drawMis = hit => { mis.innerHTML = ''; mis.append(h('b', '🎯 장면 미션 (말로 정확히 설명해 보세요)'), VMISSIONS.map((m, i) => h('div.step' + (S.meta['vm' + i] ? '.on' : ''), { onclick: () => { ta.value = m[0]; apply(); } }, h('span', S.meta['vm' + i] ? '✅' : '🎯'), h('span', m[0])))); if (hit >= 0 && !S.meta['vm' + hit]) { S.meta['vm' + hit] = 1; Eco.store.save(); Eco.store.addXP(15, '바이브 숲 미션 성공'); Eco.ui.confetti(40); Eco.ui.sfx('win'); drawMis(-1); } };
      const loop = () => { tick++; if (spec) renderScene(cv, spec, text.replace(/\d/g, '').slice(0, 20) + spec.season, tick); raf = requestAnimationFrame(loop); }; Eco.onLeave(() => cancelAnimationFrame(raf));
      const run = h('button.btn.meta', { onclick: () => { apply(); Eco.ui.sfx('pop'); Eco.dailyOnce('vibe', 8, '바이브 숲 만들기'); } }, '✨ 숲 만들기');
      const chips = h('div.row', ['🌸 봄', '🌞 여름', '🍁 가을', '⛄ 겨울', '🌙 밤', '🌧️ 비', '🦌 사슴', '🐿️ 다람쥐', '🔥 모닥불', '🌈 무지개'].map(c => h('button.btn.alt.sm', { onclick: () => { ta.value = (ta.value.trim() + ' ' + c.split(' ')[1] + ' ').replace(/\s+/g, ' '); apply(); } }, c)));
      const prompt = h('button.btn.alt.sm', { onclick: () => { const o = spec.objects.map(x => x.count + ' ' + x.type).join(', '); Eco.copy('Illustration of a ' + spec.weather + ' ' + spec.season + ' ' + spec.time + ' forest with ' + o + '. Soft watercolor style for an elementary school ecology textbook.\n한글: ' + text); } }, '📋 이미지 생성 AI용 프롬프트 복사');
      const save = h('button.btn.alt.sm', { onclick: () => { const a = h('a', { href: cv.toDataURL('image/png'), download: '내가-만든-숲.png' }); document.body.append(a); a.click(); a.remove(); } }, '💾 그림 저장');
      apply(); loop();
      return h('div.gamebox', h('div.note.purple', '🪄 ', h('b', '바이브코딩'), '이란? 코드를 한 줄씩 쓰는 대신 ‘하고 싶은 일을 말로 설명’해 AI가 코드를 만들게 하는 방식이에요. 여기서는 내 문장을 컴퓨터가 읽을 수 있는 ', h('b', '장면 명세(JSON)'), '로 바꾸고, 그 명세대로 그림을 그려요.'),
        cv, h('div.grid.g2', { style: { marginTop: '8px' } }, h('div', h('b', '✏️ 장면 설명'), ta, chips, h('div.row', { style: { marginTop: '6px' } }, run, prompt, save)), h('div', h('b', '🧾 컴퓨터가 읽은 장면 명세'), out)), h('div', { style: { marginTop: '10px' } }, mis),
        h('div.note', '팁: 계절(봄·여름·가을·겨울), 시간(낮·저녁·밤), 날씨(비·눈·안개), 숫자와 함께 나무·동물·소품을 말해 보세요. 숫자가 명확할수록 AI(코드)가 정확해요 → 좋은 프롬프트의 힘!'));
    } });

  /* ───── 숲 해설사 챗봇 (오프라인 지식봇) ───── */
  Eco.addGame('chatbot', { name: '숲 해설사 에코봇', emoji: '🦉', tag: 'AI 리터러시', desc: '숲·환경 궁금증을 물어봐요. (인터넷 없이 동작하는 지식봇 · 진짜 생성형 AI 질문도 만들어 줘요)', cat: 'AI 리터러시',
    make() {
      const log = h('div', { style: { minHeight: '240px', maxHeight: '380px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px' } }); const inp = h('input', { type: 'text', placeholder: '예: 나무는 어떻게 숨을 쉬어요?', 'aria-label': '질문' });
      const say = (who, node) => { const b = h('div', { style: { alignSelf: who === 'me' ? 'flex-end' : 'flex-start', background: who === 'me' ? '#d9f5c9' : '#fff', border: '2px solid var(--line)', borderRadius: '16px', padding: '8px 12px', maxWidth: '85%' } }, node); log.append(b); log.scrollTop = log.scrollHeight; };
      const ask = q => { q = q.trim(); if (!q) return; say('me', q); inp.value = ''; const low = q.toLowerCase(); const sc = Eco.FACTS.map(f => ({ f, s: f.k.filter(k => low.includes(k.toLowerCase())).length })).filter(x => x.s).sort((a, b) => b.s - a.s);
        setTimeout(() => { if (sc.length) { say('bot', '🦉 ' + sc[0].f.a); Eco.dailyOnce('chat', 5, '에코봇과 대화'); } else say('bot', h('div', '🦉 음, 제 지식 주머니에는 아직 없는 이야기예요. 진짜 생성형 AI에게 이렇게 물어볼까요?', h('div.note.blue', '너는 친절한 숲 해설사야. 초등학생이 이해할 수 있게 “' + q + '”에 대해 3문장으로 쉽게 설명하고, 확인할 방법도 알려 줘.', h('div', h('button.btn.alt.sm', { onclick: () => Eco.copy('너는 친절한 숲 해설사야. 초등학생이 이해할 수 있게 “' + q + '”에 대해 3문장으로 쉽게 설명하고, 확인할 방법도 알려 줘.') }, '📋 복사')), h('a.small', { href: 'https://wrtn.ai/', target: '_blank', rel: 'noopener' }, '뤼튼 열기 ↗'), ' · ', h('a.small', { href: 'https://gemini.google.com', target: '_blank', rel: 'noopener' }, '제미나이 열기 ↗')))); }, 350); };
      say('bot', '🦉 안녕! 나는 숲 해설사 에코봇이야. 증산 작용, 광합성, 도토리, 탄소중립 같은 걸 물어봐 줘!');
      const quick = h('div.row', ['증산 작용이 뭐예요?', '나무 높이는 어떻게 재요?', '커피 찌꺼기 비료', '탄소중립이 뭐예요?', '분리배출 방법'].map(q => h('button.btn.alt.sm', { onclick: () => ask(q) }, q)));
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') ask(inp.value); });
      return h('div.gamebox', h('div.note', '이 에코봇은 미리 저장된 ' + Eco.FACTS.length + '가지 지식으로 답하는 ‘규칙 기반 챗봇’이에요. 생성형 AI와 무엇이 다른지 비교해 보세요! (모르는 질문은 생성형 AI용 프롬프트로 바꿔 줘요)'), log, quick, h('div.row', { style: { marginTop: '8px', flexWrap: 'nowrap' } }, inp, h('button.btn', { onclick: () => ask(inp.value) }, '보내기')));
    } });
})(window.Eco);
