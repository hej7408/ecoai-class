/* 프로그램별 인터랙티브 위젯 (바이브코딩으로 제작한 체험 도우미) */
(function (Eco) {
  const { h } = Eco.ui;
  const W = Eco.widgets = {};
  const title = (t, sub) => h('div', h('h3', t), sub ? h('p.small.muted', sub) : null);

  /* ── 숲-1 명상: 호흡 원 + 합성 숲소리 ── */
  W.meditate = function () {
    let ac, nodes = [], timer, left = 0, running = false, birdT;
    const label = h('div', { style: { fontSize: '1.6rem', fontFamily: 'var(--font-h)', textAlign: 'center' } }, '준비되면 시작!');
    const circle = h('div', { style: { width: '150px', height: '150px', borderRadius: '50%', margin: '10px auto', background: 'radial-gradient(circle,#c9f0b5,#5fb35a)', transition: 'transform 4s ease-in-out', boxShadow: '0 0 40px #8ed17a' } });
    const time = h('div', { style: { textAlign: 'center', fontWeight: 700 } }, '');
    let mins = 3; const sel = h('select', { 'aria-label': '명상 시간', style: { width: 'auto' } }, [1, 3, 5, 10].map(m => h('option', { value: m, selected: m === 3 }, m + '분')));
    sel.addEventListener('change', () => mins = +sel.value);
    function startSound() {
      try {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
        const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
        const g = ac.createGain(); g.gain.value = .05;
        const lfo = ac.createOscillator(); lfo.frequency.value = .15; const lg = ac.createGain(); lg.gain.value = 250; lfo.connect(lg); lg.connect(f.frequency);
        src.connect(f); f.connect(g); g.connect(ac.destination); src.start(); lfo.start(); nodes = [src, lfo, g];
        const chirp = () => { if (!running) return; const t = ac.currentTime, o = ac.createOscillator(), gg = ac.createGain(); o.type = 'sine'; const b = 2200 + Math.random() * 1200;
          o.frequency.setValueAtTime(b, t); o.frequency.exponentialRampToValueAtTime(b * 1.4, t + .08); o.frequency.exponentialRampToValueAtTime(b * .9, t + .18);
          gg.gain.setValueAtTime(.0001, t); gg.gain.exponentialRampToValueAtTime(.05, t + .03); gg.gain.exponentialRampToValueAtTime(.0001, t + .22); o.connect(gg); gg.connect(ac.destination); o.start(t); o.stop(t + .25);
          birdT = setTimeout(chirp, 2500 + Math.random() * 5000); };
        birdT = setTimeout(chirp, 1500);
      } catch (e) { /* 오디오 불가 */ }
    }
    function stop(done) {
      running = false; clearInterval(timer); clearTimeout(birdT); nodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) { } }); nodes = [];
      circle.style.transform = 'scale(1)'; btn.textContent = '▶ 명상 시작'; label.textContent = done ? '🌿 마음이 편안해졌나요?' : '준비되면 시작!';
      if (done) { Eco.ui.sfx('ok'); if (Eco.dailyOnce('meditate', 10, '숲속 명상 완료')) Eco.ui.confetti(40); }
    }
    const btn = h('button.btn', { onclick: () => {
      if (running) { stop(false); return; }
      running = true; left = mins * 60; btn.textContent = '■ 그만하기'; startSound();
      let phase = 0; const breathe = () => { if (!running) return; phase = 1 - phase; circle.style.transform = phase ? 'scale(1.5)' : 'scale(1)'; label.textContent = phase ? '들이쉬어요… 🌬️' : '내쉬어요… 🍃'; };
      breathe(); const bt = setInterval(() => running ? breathe() : clearInterval(bt), 4000);
      timer = setInterval(() => { left--; time.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); if (left <= 0) stop(true); }, 1000);
    } }, '▶ 명상 시작');
    Eco.onLeave(() => stop(false));
    return h('div', title('🧘 숲속 명상 타이머', '이어폰을 끼고, 나무에 등을 기대어 눈을 감아 봐요. 숲소리(바람·새소리)가 들려요. 하루 한 번 완주하면 보너스 XP!'), label, circle, time, h('div.row', { style: { justifyContent: 'center' } }, sel, btn));
  };

  /* ── 숲-2 태블릿 미션 ── */
  W.photomission = function (p) {
    const S = Eco.store.get(); S.meta.photo = S.meta.photo || [false, false, false, false];
    const items = ['서로 다른 종류의 꽃 10종류와 인증샷을 찍으시오.', '나무와 하늘이 어우러진 멋진 하늘 사진을 찍으시오.', '자연물을 활용하여 ‘I LOVE 00’를 만들어 찍으시오. (절대 자연을 훼손하면 안 됨)', '자연을 배경으로 하여 세상에서 가장 해맑은 단체사진을 찍으시오.'];
    const oath = h('input', { type: 'checkbox' }); const out = h('div'); const draw = () => { const n = S.meta.photo.filter(Boolean).length; out.textContent = '🏅 확인 스티커 ' + n + ' / 4'; if (n === 4) out.textContent += ' — 미션 완료!'; };
    return h('div', title('📸 Tablet PC 미션 두루마리', '미션을 마치면 체크! (✔ Tablet PC 두 손 잡기)'),
      items.map((t, i) => h('label.step' + (S.meta.photo[i] ? '.on' : ''), h('input', { type: 'checkbox', checked: S.meta.photo[i], onchange: e => { S.meta.photo[i] = e.target.checked; Eco.store.save(); draw(); e.target.closest('label').classList.toggle('on', e.target.checked); if (S.meta.photo.every(Boolean)) { Eco.ui.confetti(50); Eco.dailyOnce('photomission', 15, '숲속 관찰 미션 4/4'); } } }), h('span', h('b', ['一', '二', '三', '四'][i] + '. '), t))),
      h('label.small', oath, ' 나는 자연을 훼손하지 않고 소중히 다룰 것을 약속해요.'), out);
  };

  /* ── 숲-5 보물카드 ── */
  W.treasure = function () {
    const S = Eco.store.get(); S.meta.treasure = S.meta.treasure || {};
    const CARDS = [['🌰', '도토리 한 알'], ['🌲', '솔방울'], ['🍂', '단풍잎 3종류'], ['🪨', '손에 쏙 들어오는 둥근 돌'], ['🌿', '하트 모양 잎'], ['🌼', '노란 꽃 (꺾지 말고 사진으로!)'], ['🪶', '새가 남긴 깃털'], ['🪵', 'Y자 모양 나뭇가지'], ['🍃', '세 갈래로 갈라진 잎'], ['🐛', '곤충 한 마리 (관찰 후 제자리에!)'], ['🌱', '이끼가 낀 곳'], ['🕸️', '거미줄 (이슬 맺힌 곳)']];
    const cardBox = h('div', { style: { minHeight: '120px', textAlign: 'center' } }); const coll = h('div.row', { style: { gap: '6px' } });
    let drawColl = () => { coll.innerHTML = ''; CARDS.forEach(c => coll.append(h('span.chip' + (S.meta.treasure[c[1]] ? '.sun' : ''), { title: c[1] }, S.meta.treasure[c[1]] ? c[0] + ' ' + c[1] : '❔ 미발견'))); };
    let cur = null;
    const draw = () => {
      cardBox.innerHTML = '';
      if (!cur) { cardBox.append(h('button.btn.sun', { onclick: () => { cur = Eco.pick(CARDS); Eco.ui.sfx('pop'); draw(); } }, '🎴 보물카드 뽑기')); return; }
      let shown = false; const face = h('div', { style: { fontSize: '3rem', padding: '14px', border: '3px dashed var(--g2)', borderRadius: '18px', background: '#f6fcef', margin: '8px auto', maxWidth: '280px' } }, '🎴 (눌러서 확인)');
      face.onclick = () => { shown = !shown; face.innerHTML = shown ? cur[0] + '<div style="font-size:1.1rem">' + cur[1] + '</div>' : '🎴 (눌러서 확인)'; };
      cardBox.append(face, h('p.small', '🤫 친구들에게 카드 내용을 절대 알려 주면 안 돼요!'), h('div.row', { style: { justifyContent: 'center' } },
        h('button.btn', { onclick: () => { S.meta.treasure[cur[1]] = 1; Eco.store.save(); Eco.ui.sfx('coin'); if (Eco.dailyOnce('treasure', 5, '보물 발견')) { } Eco.ui.toast('보물을 찾았어요! ' + cur[0]); cur = null; draw(); drawColl(); } }, '✅ 찾았어요!'), h('button.btn.alt', { onclick: () => { cur = null; draw(); } }, '다른 카드')));
    };
    const head = h('h4', { style: { marginTop: '8px' } }, '');
    const drawHead = () => { head.textContent = '내 보물 도감 (' + Object.keys(S.meta.treasure).length + '/' + CARDS.length + ')'; };
    const _drawColl = drawColl; drawColl = () => { _drawColl(); drawHead(); };
    draw(); drawColl();
    return h('div', title('🗺️ 보물카드 뽑기', '카드에 적힌 보물을 숲속에서 찾아와 그림으로 만들어 봐요. 자연은 해치지 말고 사진으로 남겨도 좋아요.'), cardBox, head, coll);
  };

  /* ── 숲-6 희망트리 ── */
  W.hopetree = function () {
    const S = Eco.store.get(); const cv = h('canvas', { width: 520, height: 360, style: { background: 'linear-gradient(#cdeeff,#eaf8d8)', width: '100%', maxWidth: '520px', display: 'block', margin: '0 auto', borderRadius: '16px' } });
    const ctx = cv.getContext('2d'); const msg = h('textarea', { placeholder: '숲에게 보내는 고마운 마음을 적어 보세요… (예: 시원한 그늘을 줘서 고마워!)', maxlength: 120, 'aria-label': '숲에게 편지' });
    const out = h('div.note.blue', { style: { display: 'none' } });
    const colors = ['#ff7aa8', '#ffb23d', '#7ad36a', '#ff6b6b', '#8f7aff'];
    function draw() {
      ctx.clearRect(0, 0, 520, 360);
      ctx.fillStyle = '#9ad46a'; ctx.beginPath(); ctx.ellipse(260, 350, 280, 36, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#8a5a2b'; ctx.lineCap = 'round';
      const br = (x, y, len, ang, w, d) => { if (d === 0 || len < 8) return; const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); br(x2, y2, len * .72, ang - .5, w * .7, d - 1); br(x2, y2, len * .72, ang + .45, w * .7, d - 1); };
      br(260, 340, 82, -Math.PI / 2, 16, 6);
      S.tree.leaves.forEach(l => { ctx.fillStyle = colors[l.c % 5]; ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.bezierCurveTo(l.x - 12, l.y - 8, l.x - 6, l.y - 20, l.x, l.y - 20); ctx.bezierCurveTo(l.x + 6, l.y - 20, l.x + 12, l.y - 8, l.x, l.y); ctx.fill(); });
      ctx.fillStyle = '#23311f'; ctx.font = '700 15px sans-serif'; ctx.fillText('🌳 희망 잎 ' + S.tree.leaves.length + '개', 12, 24);
    }
    cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * 520 / r.width, y = (e.clientY - r.top) * 360 / r.height; const l = S.tree.leaves.find(l => Math.hypot(l.x - x, l.y - 10 - y) < 14); if (l) { out.style.display = 'block'; out.textContent = '💌 ' + l.t; } });
    const add = h('button.btn', { onclick: () => {
      const t = msg.value.trim(); if (!t) { Eco.ui.toast('편지를 먼저 적어 주세요'); return; }
      let x, y, tries = 0; do { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 120; x = 260 + Math.cos(a) * r * 1.25; y = 120 + Math.sin(a) * r * .85; tries++; } while (tries < 20 && S.tree.leaves.some(l => Math.hypot(l.x - x, l.y - y) < 12));
      S.tree.leaves.push({ x, y, c: Math.random() * 5 | 0, t, d: Eco.today() }); Eco.store.save(); msg.value = ''; draw(); Eco.ui.sfx('coin');
      if (S.tree.leaves.filter(l => l.d === Eco.today()).length <= 3) Eco.store.addXP(5, '희망 잎 달기');
      if (S.tree.leaves.length === 10) { Eco.ui.confetti(); Eco.ui.toast('🌳 희망트리가 풍성해졌어요!', 'badge'); }
    } }, '🍃 잎 달기');
    draw();
    return h('div', title('💌 숲에게 보내는 희망트리', '고마운 마음을 적어 잎으로 달아요. 달린 잎을 눌러 편지를 다시 읽어 보세요. (하루 3장까지 XP)'), cv, out, msg, h('div.row', { style: { marginTop: '6px' } }, add));
  };

  /* ── 숲-7 나무 높이 재기 ── */
  W.treeheight = function () {
    const dist = h('input', { type: 'number', min: 1, max: 50, step: .1, value: 12, 'aria-label': '나무까지 거리(m)' }), eye = h('input', { type: 'number', min: .5, max: 2, step: .05, value: 1.2, 'aria-label': '눈높이(m)' });
    const svg = h('div'); const res = h('div', { style: { fontFamily: 'var(--font-h)', fontSize: '1.4rem', textAlign: 'center' } });
    const calc = () => {
      const d = +dist.value || 0, e = +eye.value || 0, ht = d + e; res.textContent = '🌳 나무 높이 ≈ ' + ht.toFixed(1) + ' m (' + d + ' + ' + e + ')';
      const sx = 460 / Math.max(25, d + 4), sy = Math.min(1.6 * sx, 200 / Math.max(ht, 6)); const ox = 20, gy = 190, tx = ox + d * sx + 10;
      svg.innerHTML = '<svg viewBox="0 0 500 220" style="width:100%;max-width:520px;display:block;margin:auto;background:#eaf7ff;border-radius:14px"><rect y="190" width="500" height="30" fill="#9ad46a"/>'
        + '<text x="' + (tx - 14) + '" y="' + Math.max(30, gy - ht * sy - 6) + '" font-size="40">🌳</text>'
        + '<line x1="' + tx + '" y1="190" x2="' + tx + '" y2="' + (gy - ht * sy) + '" stroke="#8a5a2b" stroke-width="5"/>'
        + '<text x="' + ox + '" y="' + (gy - e * sy - 4) + '" font-size="30">🧒</text>'
        + '<line x1="' + (ox + 14) + '" y1="' + (gy - e * sy) + '" x2="' + tx + '" y2="' + (gy - e * sy) + '" stroke="#e8506f" stroke-dasharray="5 4"/>'
        + '<line x1="' + (ox + 14) + '" y1="' + (gy - e * sy) + '" x2="' + tx + '" y2="' + (gy - ht * sy) + '" stroke="#4aa8e8" stroke-width="2"/>'
        + '<text x="' + (ox + d * sx / 2) + '" y="206" font-size="13" text-anchor="middle" fill="#23311f">거리 ' + d + 'm</text></svg>';
    };
    [dist, eye].forEach(i => i.addEventListener('input', calc)); calc();
    /* 연습 문제 */
    let a = 0, ans, qd, qe; const pq = h('div'); const mk = () => { qd = 6 + (Math.random() * 20 | 0); qe = 1 + (Math.random() * 5 | 0) / 10 + .1; ans = +(qd + qe).toFixed(1); pq.innerHTML = '';
      const inp = h('input', { type: 'number', step: .1, placeholder: '높이(m)', style: { width: '120px', display: 'inline-block' } });
      pq.append(h('div', '문제: 나무까지 거리 ', h('b', qd + ' m'), ', 내 눈높이 ', h('b', qe.toFixed(1) + ' m'), ' → 나무 높이는?'), h('div.row', inp, h('button.btn.sm', { onclick: () => { const ok = Math.abs(+inp.value - ans) < .06; Eco.ui.sfx(ok ? 'ok' : 'bad'); if (ok) { a++; Eco.ui.toast('정답! 🌟 연속 ' + a); if (a === 3) { Eco.dailyOnce('treeheight', 10, '나무 높이 연습 3연속'); } mk(); } else { a = 0; Eco.ui.toast('아쉬워요. 거리 + 눈높이 = ' + ans + 'm'); } } }, '확인'))); };
    mk();
    return h('div', title('📏 나무 높이 계산기', '막대 눈금 맞추기(닮은 삼각형): 나무까지 거리 + 내 눈높이 = 나무 높이'), svg, h('div.row', { style: { margin: '8px 0' } }, h('label', '거리(m) ', dist), h('label', '눈높이(m) ', eye)), res, h('hr'), h('b', '🎯 연습 문제 (3연속 정답 시 보너스)'), pq);
  };

  /* ── 숲-8 증산 실험 시뮬 ── */
  W.transpiration = function () {
    let light = 1, hours = 0; const box = h('div'), info = h('div.note.blue');
    const draw = () => {
      const drops = Math.round(Math.min(12, hours * (light ? 3 : .7)));
      box.innerHTML = '<svg viewBox="0 0 320 180" style="width:100%;max-width:420px;display:block;margin:auto;background:' + (light ? '#e9f7ff' : '#c9d2e6') + ';border-radius:14px"><text x="12" y="30" font-size="26">' + (light ? '☀️' : '☁️') + '</text><path d="M160 170 L160 90" stroke="#6b8e3a" stroke-width="6"/><ellipse cx="160" cy="70" rx="60" ry="42" fill="#5fb35a" opacity=".9"/><path d="M95 40 Q160 0 225 40 L235 110 Q160 135 85 110 Z" fill="#fff" opacity=".35" stroke="#7aa" stroke-dasharray="4 3"/>'
        + Array.from({ length: drops }, (_, i) => '<circle cx="' + (112 + (i * 37) % 100) + '" cy="' + (60 + (i * 29) % 55) + '" r="4" fill="#4aa8e8"/>').join('') + '</svg>';
      info.textContent = hours === 0 ? '잎에 비닐봉투를 씌우고 시간을 흘려 보세요.' : '⏱ ' + hours + '시간 뒤: 물방울 ' + drops + '개 — ' + (light ? '밝은 곳에서는 증산 작용이 활발해요.' : '그늘에서는 증산 작용이 느려요.');
    };
    const sl = h('input', { type: 'range', min: 0, max: 4, step: 1, value: 0, 'aria-label': '경과 시간', onchange: e => { hours = +e.target.value; draw(); } });
    const tog = h('button.btn.alt.sm', { onclick: () => { light = 1 - light; tog.textContent = light ? '☀️ 밝은 곳' : '☁️ 그늘'; draw(); } }, '☀️ 밝은 곳');
    draw();
    return h('div', title('💨 증산 작용 시뮬레이터', '시간(0~4시간)과 밝기를 바꾸며 비닐봉투 속 물방울 변화를 관찰해요.'), box, h('div.row', { style: { margin: '8px 0' } }, tog, h('label', '시간 ', sl)), info);
  };

  /* ── 숲-9 나무껍질 무늬 도감 ── */
  W.bark = function () {
    const TYPES = [{ k: '세로로 깊게 갈라진 껍질', f: 'v' }, { k: '가로줄이 있는 매끈한 껍질', f: 'h' }, { k: '조각조각 벗겨지는 껍질', f: 'p' }, { k: '그물(마름모) 무늬 껍질', f: 'g' }];
    const cv = h('canvas', { width: 220, height: 160, style: { borderRadius: '14px', border: '2px solid var(--line)', background: '#8a6a45' } }); const ctx = cv.getContext('2d');
    let cur, score = 0, rounds = 0; const opts = h('div'), info = h('div.small.muted', '');
    function paint(f) {
      ctx.fillStyle = '#7c5c3a'; ctx.fillRect(0, 0, 220, 160); ctx.lineWidth = 3; ctx.strokeStyle = '#3d2a17';
      for (let i = 0; i < 26; i++) { ctx.beginPath();
        if (f === 'v') { const x = i * 9 + Math.random() * 4; ctx.moveTo(x, 0); for (let y = 0; y < 160; y += 20) ctx.lineTo(x + (Math.random() - .5) * 7, y); ctx.stroke(); }
        else if (f === 'h') { const y = i * 6.5; ctx.lineWidth = 1.6; ctx.moveTo(0, y); ctx.lineTo(220, y + (Math.random() - .5) * 2); ctx.stroke(); }
        else if (f === 'p') { ctx.fillStyle = ['#a07a52', '#6d4f30', '#8d6a42'][i % 3]; ctx.beginPath(); ctx.ellipse(Math.random() * 220, Math.random() * 160, 18 + Math.random() * 14, 10 + Math.random() * 10, Math.random() * 3, 0, 7); ctx.fill(); }
        else { ctx.lineWidth = 2; ctx.moveTo(i * 12, 0); ctx.lineTo(i * 12 - 90, 160); ctx.moveTo(i * 12 - 90, 0); ctx.lineTo(i * 12, 160); ctx.stroke(); } }
    }
    function next() { cur = Eco.pick(TYPES); paint(cur.f); opts.innerHTML = ''; Eco.shuffle(TYPES).forEach(t => opts.append(h('button.quiz-opt', { onclick: e => { rounds++; const ok = t === cur; Eco.ui.sfx(ok ? 'ok' : 'bad'); e.target.classList.add(ok ? 'ok' : 'bad'); if (ok) score++; info.textContent = '맞힌 개수 ' + score + ' / ' + rounds; if (score === 5) Eco.dailyOnce('bark', 10, '나무껍질 도감 5개'); setTimeout(next, 700); } }, t.k))); }
    next();
    return h('div', title('🔍 나무껍질 무늬 알아맞히기', '껍질 무늬를 보고 특징을 골라요. (실제 숲에서 만나는 껍질과 비교해 보세요!)'), h('div', { style: { textAlign: 'center' } }, cv), opts, info);
  };

  /* ── 놀-5 카프라 타워 (스택 게임) ── */
  W.kapla = function () {
    const cv = h('canvas', { width: 320, height: 420, style: { width: '100%', maxWidth: '320px', display: 'block', margin: 'auto', background: 'linear-gradient(#e6f4ff,#f7fbe9)', borderRadius: '16px', touchAction: 'manipulation' } });
    const ctx = cv.getContext('2d'); let tower, mov, dir, speed, over, best = 0;
    const bw0 = 120, bh = 24;
    const reset = () => { tower = [{ x: 100, w: bw0 }]; mov = { x: 0, w: bw0 }; dir = 1; speed = 2; over = false; };
    reset();
    let raf; const loop = () => {
      ctx.clearRect(0, 0, 320, 420); const base = 420 - 10, off = Math.max(0, (tower.length + 1) * bh - 300);
      tower.forEach((b, i) => { ctx.fillStyle = 'hsl(' + (30 + i * 12) + ',60%,' + (60 - (i % 3) * 5) + '%)'; ctx.fillRect(b.x, base - (i + 1) * bh + off, b.w, bh - 2); });
      if (!over) { mov.x += dir * speed; if (mov.x < 0 || mov.x + mov.w > 320) dir *= -1; ctx.fillStyle = '#c98b4a'; ctx.fillRect(mov.x, base - (tower.length + 1) * bh + off, mov.w, bh - 2); }
      ctx.fillStyle = '#23311f'; ctx.font = '700 16px sans-serif'; ctx.fillText('높이 ' + (tower.length - 1) + '단  최고 ' + best, 8, 22);
      if (over) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 150, 320, 90); ctx.fillStyle = '#fff'; ctx.font = '700 22px sans-serif'; ctx.fillText('와르르! 다시 도전 (탭)', 56, 205); }
      raf = requestAnimationFrame(loop);
    }; loop(); Eco.onLeave(() => cancelAnimationFrame(raf));
    const drop = () => {
      if (over) { reset(); return; }
      const top = tower[tower.length - 1]; const l = Math.max(mov.x, top.x), r = Math.min(mov.x + mov.w, top.x + top.w), w = r - l;
      if (w <= 4) { over = true; best = Math.max(best, tower.length - 1); Eco.ui.sfx('bad'); if (tower.length - 1 >= 8) Eco.dailyOnce('kapla', 10, '카프라 타워 8단'); return; }
      tower.push({ x: l, w }); mov = { x: 0, w }; speed = Math.min(5.5, speed + .18); Eco.ui.sfx('pop'); best = Math.max(best, tower.length - 1);
    };
    cv.addEventListener('pointerdown', drop);
    return h('div', title('🏰 카프라 타워 쌓기', '움직이는 블록을 알맞은 때에 탭해서 쌓아요. 겹치는 만큼만 남아요! 8단을 쌓으면 보너스.'), cv);
  };

  /* ── 자-2 풀싸움 ── */
  W.tug = function () {
    const types = [{ n: '질경이 줄기 (튼튼)', p: 1.25 }, { n: '억새 줄기 (보통)', p: 1 }, { n: '여린 풀 (약함)', p: .75 }]; let sel = types[1], pos = 50, going = false, t;
    const bar = h('div', { style: { height: '30px', borderRadius: '99px', background: '#e3ecd9', position: 'relative', overflow: 'hidden' } }, h('div', { style: { position: 'absolute', top: 0, bottom: 0, width: '6px', background: '#e8506f', left: '50%' } }));
    const knot = h('div', { style: { position: 'absolute', top: '2px', fontSize: '1.5rem', left: '50%', transform: 'translateX(-50%)', transition: 'left .1s' } }, '🌿'); bar.append(knot);
    const msg = h('div', { style: { textAlign: 'center', fontWeight: 700, minHeight: '1.5em' } }, '풀을 고르고 시작! 버튼을 연타해서 당겨요!');
    const pull = h('button.btn.sun', { style: { width: '100%', fontSize: '1.3rem', padding: '16px' }, onclick: () => { if (!going) return; pos += 2.4 * sel.p; Eco.ui.sfx('click'); upd(); } }, '💪 당겨!');
    const upd = () => { knot.style.left = pos + '%'; if (pos >= 95) end(true); if (pos <= 5) end(false); };
    function end(win) { going = false; clearInterval(t); msg.textContent = win ? '🎉 내 풀이 이겼어요! 상대 풀이 끊어졌어요!' : '😢 내 풀이 끊어졌어요… 다음엔 더 튼튼한 풀로!'; Eco.ui.sfx(win ? 'win' : 'bad'); if (win) Eco.dailyOnce('tug', 8, '풀싸움 승리'); }
    const start = h('button.btn', { onclick: () => { pos = 50; going = true; msg.textContent = '시작!'; clearInterval(t); t = setInterval(() => { pos -= .9 + Math.random() * 1.2; upd(); }, 100); } }, '▶ 시작');
    const sels = h('select', { 'aria-label': '풀 고르기', onchange: e => sel = types[e.target.value] }, types.map((x, i) => h('option', { value: i, selected: i === 1 }, x.n)));
    Eco.onLeave(() => clearInterval(t));
    return h('div', title('🌾 풀싸움 (연타 게임)', '튼튼한 풀일수록 잘 당겨져요! 옛날 아이들의 자연 놀이를 게임으로 해 봐요.'), h('div.row', sels, start), bar, msg, pull);
  };

  /* ── 자-5 도토리 팽이 ── */
  W.spin = function () {
    const sz = h('input', { type: 'range', min: 1, max: 5, value: 3, 'aria-label': '도토리 크기' }), tip = h('input', { type: 'range', min: 1, max: 5, value: 3, 'aria-label': '이쑤시개 길이' }), bal = h('input', { type: 'range', min: 0, max: 5, value: 0, 'aria-label': '구멍이 빗나간 정도' });
    const top = h('div', { style: { fontSize: '3.4rem', textAlign: 'center', transition: 'transform 0s' } }, '🌰'); const msg = h('div', { style: { textAlign: 'center', fontWeight: 700 } }, ''); let best = 0;
    const go = h('button.btn', { onclick: () => {
      const s = +sz.value, t = +tip.value, b = +bal.value;
      const dur = Math.max(1.5, (6 - Math.abs(t - 3) * 1.1) * (1 + (s >= 2 && s <= 4 ? .25 : 0)) - b * 1.2 + Math.random() * 2);
      top.style.transition = 'transform ' + dur + 's cubic-bezier(.2,.8,.4,1)'; top.style.transform = 'rotate(' + (dur * 1500) + 'deg)';
      msg.textContent = '돌아가는 중… 🌀'; setTimeout(() => { top.style.transition = 'none'; top.style.transform = 'none'; msg.textContent = '⏱ ' + dur.toFixed(1) + '초 회전!' + (dur > best ? ' 🏆 최고 기록!' : ''); if (dur > best) best = dur; Eco.ui.sfx('ok'); if (dur > 7) Eco.dailyOnce('spin', 8, '도토리팽이 7초 돌파'); }, dur * 1000);
    } }, '🌀 팽이 돌리기');
    return h('div', title('🌀 도토리팽이 실험실', '도토리 크기·이쑤시개 길이·구멍 위치를 바꾸며 가장 오래 도는 팽이를 찾아봐요. (무게중심이 낮고 정중앙이면 오래 돌아요)'),
      top, h('div.grid.g2', h('label', '도토리 크기 ', sz), h('label', '이쑤시개 길이 ', tip), h('label', '구멍이 빗나간 정도 ', bal)), h('div.row', { style: { margin: '6px 0' } }, go), msg);
  };

  /* ── 자-7·자-9 혼합 비율 ── */
  W.mix = function (p) {
    const cfg = p.id === 'n7' ? { a: '계피 원액', b: '물', ra: 1, rb: 1, u: 'ml', total: 100, ic: '🦟' } : { a: '말린 커피찌꺼기', b: '배양토', ra: 1, rb: 9, u: 'g', total: 500, ic: '☕' };
    const tot = h('input', { type: 'number', min: 10, step: 10, value: cfg.total, 'aria-label': '전체 양' }); const out = h('div'); const bar = h('div', { style: { display: 'flex', height: '34px', borderRadius: '12px', overflow: 'hidden', margin: '8px 0' } });
    const draw = () => { const t = +tot.value || 0, A = t * cfg.ra / (cfg.ra + cfg.rb), B = t - A; bar.innerHTML = ''; bar.append(h('div', { style: { width: cfg.ra / (cfg.ra + cfg.rb) * 100 + '%', background: '#8a5a2b', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '.8rem' } }, cfg.a.slice(0, 4)), h('div', { style: { flex: 1, background: p.id === 'n7' ? '#8fd0f5' : '#6b4a2a', color: '#fff', display: 'grid', placeItems: 'center' } }, cfg.b)); out.textContent = cfg.ic + ' 전체 ' + t + cfg.u + ' → ' + cfg.a + ' ' + A.toFixed(1) + cfg.u + ' + ' + cfg.b + ' ' + B.toFixed(1) + cfg.u + ' (비율 ' + cfg.ra + ':' + cfg.rb + ')'; };
    tot.addEventListener('input', draw); draw();
    return h('div', title('🧮 혼합 비율 계산기', cfg.a + ' : ' + cfg.b + ' = ' + cfg.ra + ' : ' + cfg.rb), h('label', '만들고 싶은 전체 양(' + cfg.u + ') ', tot), bar, out, p.id === 'n7' ? h('div.note', '⚠️ 에탄올은 불 근처에 두지 말고, 피부가 약하면 먼저 조금 뿌려 테스트해요.') : null);
  };

  /* ── 자-10 AI 식물 찾기 체험 ── */
  W.lens = function () {
    const PL = [{ n: '민들레', c: '노랑', l: '톱니 깊은 긴 잎', hab: '양지바른 길가', e: '🌼' }, { n: '토끼풀(클로버)', c: '하양', l: '동그란 세 잎', hab: '풀밭', e: '☘️' }, { n: '개망초', c: '하양', l: '긴 타원형 잎', hab: '공터·길가', e: '🌼' }, { n: '봉선화', c: '분홍', l: '뾰족한 긴 잎', hab: '화단', e: '🌺' }, { n: '금계국', c: '노랑', l: '가늘게 갈라진 잎', hab: '도로변·화단', e: '🏵️' }, { n: '질경이', c: '연두', l: '넓은 타원형 잎', hab: '밟히는 길', e: '🌿' }];
    const sel = { c: '', l: '', hab: '' }; const out = h('div'); const mk = (label, key, vals) => h('div', h('b', label), h('div.row', vals.map(v => h('button.btn.alt.sm', { onclick: e => { sel[key] = v; [...e.target.parentElement.children].forEach(x => x.classList.remove('sun')); e.target.classList.add('sun'); run(); } }, v))));
    function run() { const sc = PL.map(p => ({ p, s: (p.c === sel.c) + (p.l === sel.l) + (p.hab === sel.hab) })).sort((a, b) => b.s - a.s); const t = sc[0]; if (!sel.c && !sel.l && !sel.hab) return; const conf = Math.round(40 + t.s * 18 + (t.s > sc[1].s ? 8 : 0)); out.innerHTML = ''; out.append(h('div.note', '🤖 AI 추측: ', h('b', t.p.e + ' ' + t.p.n), ' (자신감 ' + conf + '%)'), h('div.small.muted', '비슷한 후보: ' + sc.slice(1, 3).map(x => x.p.n).join(', ')), h('div.note.blue', '단서가 적을수록 AI도 틀리기 쉬워요. 실제 스마트렌즈 결과도 도감·선생님과 꼭 확인해요!')); if (t.s === 3) Eco.dailyOnce('lens', 8, 'AI 식물 찾기 성공'); }
    const lnk = (t, u) => h('a.btn.alt.sm', { href: u, target: '_blank', rel: 'noopener' }, t);
    const guide = h('div',
      h('h3', '🔎 구글 렌즈로도 찾아봐요'),
      h('p.small.muted', '사진 한 장으로 식물·곤충·사물을 검색하는 AI 이미지 검색이에요. 네이버 스마트렌즈와 같은 원리라서 두 가지를 비교해 보면 더 좋아요.'),
      h('table.t', h('thead', h('tr', h('th', ''), h('th', '📱 스마트렌즈'), h('th', '🔎 구글 렌즈'))),
        h('tbody',
          h('tr', h('td', h('b', '어디서?')), h('td', '네이버 앱의 카메라(스마트렌즈)'), h('td', 'Google 앱·구글 포토·크롬 등 (기기·앱 버전에 따라 화면이 조금 달라요)')),
          h('tr', h('td', h('b', '하는 일')), h('td', '사진 속 식물·사물의 이름과 비슷한 이미지를 찾아줘요'), h('td', '사진 속 사물을 인식해 정보·비슷한 이미지·관련 웹사이트를 보여줘요')),
          h('tr', h('td', h('b', '공통점')), h('td', { colSpan: 2 }, '둘 다 AI가 사진을 보고 ‘가장 비슷한 것’을 추측해요 → 결과가 틀릴 수 있어서 꼭 확인해야 해요.')))),
      h('h4', { style: { marginTop: '10px' } }, '구글 렌즈로 식물 찾는 순서'),
      h('ol.ol.green',
        h('li', '식물의 잎·꽃이 잘 보이게 ', h('b', '가까이서 선명하게'), ' 사진을 찍어요. (흐리거나 어두우면 틀리기 쉬워요)'),
        h('li', 'Google 앱의 카메라(렌즈) 아이콘을 누르거나, 구글 포토에서 사진을 열고 렌즈로 검색해요. 컴퓨터에서는 google.com → ‘이미지로 검색’ → 사진 올리기.'),
        h('li', '결과에 나온 이름 후보를 여러 개 살펴봐요. 첫 번째가 항상 정답은 아니에요.'),
        h('li', ['국가생물종지식정보시스템 같은 ', lnk('식물 도감 사이트', 'https://species.nibr.go.kr'), '에서 잎 모양·꽃 색·자라는 곳이 맞는지 ', h('b', '다시 확인'), '해요.']),
        h('li', '맞았다면 이름과 알게 된 점을 ‘생각할 거리’에 적어요.')),
      h('div.note', '🛡️ 사진을 찍을 때 친구 얼굴이 나오지 않게 하고, 식물은 꺾지 말고 사진으로만 만나요. 학교 계정(구글 워크스페이스)은 렌즈 기능이 제한될 수 있으니 선생님과 먼저 확인해요.'),
      h('div.row', lnk('🔎 구글 렌즈 소개 열기', 'https://lens.google.com'), lnk('📖 구글 이미지 검색 도움말', 'https://support.google.com/websearch/answer/1325808?hl=ko'), lnk('🌿 국가생물종지식정보시스템', 'https://www.nature.go.kr')),
      h('div.small.muted', { style: { marginTop: '6px' } }, '※ 구글 렌즈는 Google의 서비스예요. 사용 가능 여부와 화면은 기기·계정·앱 버전에 따라 다를 수 있어요.'));
    return h('div', guide, h('hr', { style: { margin: '14px 0' } }), title('📱 AI 식물 찾기 체험','식물의 단서를 골라 보세요. AI는 단서를 모아 ‘가장 비슷한 식물’을 추측해요. (실제 스마트렌즈는 사진으로 비교)'),
      mk('꽃 색', 'c', ['노랑', '하양', '분홍', '연두']), mk('잎 모양', 'l', [...new Set(PL.map(p => p.l))]), mk('자라는 곳', 'hab', [...new Set(PL.map(p => p.hab))]), out);
  };

  /* ── 자-기5 아카시아 잎놀이 (가위바위보 + 잎따기) ── */
  W.leafgame = function () {
    let leaves = 9, turn = null; const msg = h('div', { style: { textAlign: 'center', fontWeight: 700, minHeight: '3em' } }, '가위바위보로 먼저 잎을 딸 사람을 정해요!'); const view = h('div', { style: { textAlign: 'center', fontSize: '1.8rem', letterSpacing: '4px', minHeight: '2.4rem' } });
    const draw = () => { view.textContent = '🍃'.repeat(leaves) || '(잎이 없어요)'; };
    const RPS = ['✌️ 가위', '✊ 바위', '🖐️ 보']; const bts = h('div.row', { style: { justifyContent: 'center' } });
    const rps = () => { bts.innerHTML = ''; RPS.forEach((t, i) => bts.append(h('button.btn.alt', { onclick: () => { const c = Math.random() * 3 | 0; if (i === c) { msg.textContent = '비겼어요! 한 번 더!'; return; } const win = (i - c + 3) % 3 === 2; msg.textContent = '상대: ' + RPS[c] + ' → ' + (win ? '이겼어요! 잎을 따요 (1~2장)' : '졌어요! 상대가 잎을 따요'); win ? pickMine() : cpu(); } }, t))); };
    function pickMine() { bts.innerHTML = ''; [1, 2].forEach(n => { if (n <= leaves) bts.append(h('button.btn', { onclick: () => take(n, 'me') }, n + '장 따기')); }); }
    function cpu() { const n = Math.min(leaves, 1 + (Math.random() * 2 | 0)); msg.textContent += '  (상대가 ' + n + '장 땄어요)'; take(n, 'cpu'); }
    function take(n, who) { leaves -= n; draw(); Eco.ui.sfx('pop'); if (leaves <= 0) { const win = who === 'me'; msg.textContent = win ? '🎉 마지막 잎을 땄어요! 내가 이겼어요!' : '😅 상대가 마지막 잎을 땄어요!'; if (win) Eco.dailyOnce('leaf', 6, '아카시아 잎놀이 승리'); bts.innerHTML = ''; bts.append(h('button.btn', { onclick: () => { leaves = 7 + (Math.random() * 5 | 0); draw(); msg.textContent = '새 판! 가위바위보!'; rps(); } }, '🔁 다시')); return; } if (who === 'me') rps(); else rps(); }
    leaves = 7 + (Math.random() * 5 | 0); draw(); rps();
    return h('div', title('🍀 아카시아 잎놀이 (가위바위보)', '이긴 사람이 잎을 1~2장 따요. 마지막 잎을 따는 사람이 이겨요!'), view, msg, bts);
  };
})(window.Eco);
