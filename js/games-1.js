/* 에코 놀이터 1: 분리배출 · 바다를 구해줘 · 먹이그물 · 곤충과 숨바꼭질 · 사계절 기억카드 */
(function (Eco) {
  const { h } = Eco.ui;
  Eco.games = {};
  Eco.addGame = (id, def) => { Eco.games[id] = Object.assign({ id }, def); };
  /** 게임 종료 처리: 최고기록 저장 + 하루 1회 보상 */
  Eco.gameDone = (id, score, xp, label) => {
    const best = Eco.store.patchGame(id, score);
    const got = xp > 0 && Eco.dailyOnce('g:' + id, xp, label || Eco.games[id].name);
    if (xp > 0 && !got) Eco.ui.toast('오늘의 ' + Eco.games[id].name + ' 보상은 이미 받았어요 🌙');
    if (best && score > 0) Eco.ui.toast('🏆 새 최고 기록! ' + score);
    return best;
  };

  /* ───── 분리배출 달인 ───── */
  Eco.addGame('trash', { name: '분리배출 달인', emoji: '♻️', tag: '타임어택', desc: '60초 안에 쓰레기를 알맞은 통에! 콤보로 점수를 올려요.', cat: '실천',
    make() {
      const BINS = { paper: ['📄', '종이'], glass: ['🫙', '유리'], can: ['🥫', '캔·고철'], plastic: ['🧴', '플라스틱'], food: ['🍎', '음식물'], general: ['🗑️', '일반'] };
      const ITEMS = [['🗞️', '신문지', 'paper', '펼쳐서 묶어 종이류로!'], ['📦', '택배상자', 'paper', '테이프·송장을 떼고 납작하게 접어요.'], ['📚', '다 읽은 책', 'paper', '종이류예요.'], ['🥛', '우유팩', 'paper', '헹구어 말려 종이팩으로!'], ['🍾', '유리병', 'glass', '뚜껑을 분리하고 헹궈 유리류로!'], ['🫙', '빈 잼병', 'glass', '내용물을 비우고 헹궈요.'], ['🥫', '참치캔', 'can', '내용물을 비우고 헹궈 캔류로!'], ['🥤', '음료 캔', 'can', '찌그러뜨려 캔류로!'], ['🧴', '샴푸통', 'plastic', '다 쓰고 헹궈 플라스틱류로!'], ['🍶', '페트병', 'plastic', '라벨을 떼고 압축해서 플라스틱류로!'], ['🥡', '배달 용기', 'plastic', '음식물을 씻어 플라스틱류로!'], ['🍎', '사과 속', 'food', '음식물 쓰레기예요.'], ['🍌', '바나나 껍질', 'food', '음식물 쓰레기예요.'], ['🥬', '시든 채소', 'food', '음식물 쓰레기예요.'], ['🧻', '사용한 휴지', 'general', '일반 쓰레기예요.'], ['🦴', '닭뼈', 'general', '딱딱한 뼈는 일반 쓰레기!'], ['🪥', '칫솔', 'general', '복합 재질은 일반 쓰레기!'], ['🥚', '달걀 껍데기', 'general', '달걀 껍데기는 일반 쓰레기!'], ['🧃', '비닐 포장지', 'plastic', '깨끗이 헹궈 비닐류(플라스틱)로!']];
      let t = 60, score = 0, combo = 0, cur, timer, over = false, right = 0, total = 0;
      const stats = h('div.hudline'), card = h('div', { style: { textAlign: 'center', margin: '10px 0' } }), msg = h('div', { style: { textAlign: 'center', minHeight: '2.4em', fontWeight: 700 } }), bins = h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))' } });
      const draw = () => { stats.innerHTML = ''; stats.append(h('span', '⏱ ' + t + '초'), h('span', '⭐ ' + score), h('span', '🔥 콤보 ' + combo)); };
      const nextItem = () => { cur = Eco.pick(ITEMS); card.innerHTML = ''; card.append(h('div.item', { style: { width: '110px', height: '110px', fontSize: '4rem', cursor: 'default' } }, cur[0]), h('div', { style: { fontFamily: 'var(--font-h)', fontSize: '1.2rem' } }, cur[1])); };
      function end() { over = true; clearInterval(timer); bins.innerHTML = ''; card.innerHTML = ''; const xp = Math.min(30, Math.floor(score / 20)); msg.innerHTML = ''; msg.append(h('div.note', '⏰ 끝! 점수 ' + score + ' (정답 ' + right + '/' + total + ') → 최고 기록에 도전했어요.'), h('button.btn', { onclick: start }, '🔁 다시 하기')); Eco.ui.confetti(40); Eco.gameDone('trash', score, xp, '분리배출 달인'); draw(); }
      function start() { t = 60; score = 0; combo = 0; right = 0; total = 0; over = false; msg.textContent = '쓰레기를 알맞은 통으로!'; bins.innerHTML = ''; Object.entries(BINS).forEach(([k, v]) => bins.append(h('button.bin', { onclick: () => choose(k) }, h('div', { style: { fontSize: '2rem' } }, v[0]), v[1]))); nextItem(); draw(); clearInterval(timer); timer = setInterval(() => { t--; draw(); if (t <= 0) end(); }, 1000); }
      function choose(k) { if (over) return; total++; if (k === cur[2]) { combo++; right++; score += 10 + Math.min(combo, 10) * 2; Eco.ui.sfx('ok'); msg.textContent = '✔ 정답! ' + cur[3]; } else { combo = 0; score = Math.max(0, score - 5); Eco.ui.sfx('bad'); msg.textContent = '✖ 아쉬워요! ' + cur[1] + '은(는) ' + BINS[cur[2]][1] + '. ' + cur[3]; } nextItem(); draw(); }
      Eco.onLeave(() => clearInterval(timer));
      const box = h('div.gamebox', stats, card, msg, bins); start(); return box;
    } });

  /* ───── 바다를 구해줘 (조건문·변수 체험) ───── */
  Eco.addGame('ocean', { name: '바다를 구해줘', emoji: '🐧', tag: '코딩 개념', desc: '펭귄이 쓰레기에 닿으면 사라지고 변수 +1! 조건문을 눈으로 확인해요.', cat: '코딩',
    make() {
      const cv = h('canvas', { width: 520, height: 340 }), ctx = cv.getContext('2d'); let raf, pen = { x: 260, y: 170 }, trash = [], got = 0, time = 45, keys = {}, target = null, over = false, lastHit = 0, tmr;
      const T = ['🥤', '🧴', '🍾', '👟', '🛍️', '🥫'];
      const spawn = () => ({ x: 20 + Math.random() * 480, y: 20 + Math.random() * 300, e: Eco.pick(T), vx: (Math.random() - .5) * .6, vy: (Math.random() - .5) * .4 });
      const reset = () => { trash = Array.from({ length: 9 }, spawn); got = 0; time = 45; over = false; pen = { x: 260, y: 170 }; clearInterval(tmr); tmr = setInterval(() => { if (!over && --time <= 0) finish(); }, 1000); };
      const code = h('div', { style: { fontFamily: 'monospace', fontSize: '.9rem', background: '#1d2b24', color: '#d9f5d0', borderRadius: '14px', padding: '10px 14px', lineHeight: 1.7 } });
      const drawCode = hit => { code.innerHTML = '<div>🟩 <b>계속 반복하기</b></div><div style="margin-left:14px;' + (hit ? 'background:#2f8f4e;border-radius:6px;' : '') + '">🟦 만약 <b>펭귄</b>이 <b>쓰레기</b>에 닿으면</div><div style="margin-left:34px;' + (hit ? 'background:#2f8f4e;border-radius:6px;' : '') + '">🟪 쓰레기 <b>숨기기</b></div><div style="margin-left:34px;' + (hit ? 'background:#2f8f4e;border-radius:6px;' : '') + '">🟧 <b>모은 쓰레기</b> = 모은 쓰레기 + 1  → <b>' + got + '</b></div>'; };
      function finish() { over = true; clearInterval(tmr); Eco.ui.confetti(40); Eco.gameDone('ocean', got, Math.min(30, got * 3), '바다를 구해줘'); }
      const onkd = e => { keys[e.key.toLowerCase()] = 1; if (e.key.startsWith('Arrow')) e.preventDefault(); }, onku = e => keys[e.key.toLowerCase()] = 0;
      window.addEventListener('keydown', onkd); window.addEventListener('keyup', onku);
      const pt = e => { const r = cv.getBoundingClientRect(); target = { x: (e.clientX - r.left) * 520 / r.width, y: (e.clientY - r.top) * 340 / r.height }; };
      cv.addEventListener('pointerdown', e => { pt(e); cv.setPointerCapture(e.pointerId); cv.dataset.d = 1; }); cv.addEventListener('pointermove', e => { if (cv.dataset.d) pt(e); }); cv.addEventListener('pointerup', () => { cv.dataset.d = ''; target = null; });
      function loop() {
        const sp = 3; if (keys['arrowleft'] || keys['a']) pen.x -= sp; if (keys['arrowright'] || keys['d']) pen.x += sp; if (keys['arrowup'] || keys['w']) pen.y -= sp; if (keys['arrowdown'] || keys['s']) pen.y += sp;
        if (target) { const dx = target.x - pen.x, dy = target.y - pen.y, d = Math.hypot(dx, dy); if (d > 4) { pen.x += dx / d * sp * 1.3; pen.y += dy / d * sp * 1.3; } }
        pen.x = Math.max(16, Math.min(504, pen.x)); pen.y = Math.max(20, Math.min(326, pen.y));
        const g = ctx.createLinearGradient(0, 0, 0, 340); g.addColorStop(0, '#8fd8f5'); g.addColorStop(1, '#2f7fb8'); ctx.fillStyle = g; ctx.fillRect(0, 0, 520, 340);
        ctx.font = '26px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let i = trash.length - 1; i >= 0; i--) { const o = trash[i]; if (!over) { o.x += o.vx; o.y += o.vy; if (o.x < 10 || o.x > 510) o.vx *= -1; if (o.y < 10 || o.y > 330) o.vy *= -1; } ctx.fillText(o.e, o.x, o.y);
          if (!over && Math.hypot(o.x - pen.x, o.y - pen.y) < 26) { trash.splice(i, 1); got++; trash.push(spawn()); lastHit = performance.now(); Eco.ui.sfx('pop'); } }
        ctx.font = '34px serif'; ctx.fillText('🐧', pen.x, pen.y);
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, 520, 28); ctx.fillStyle = '#fff'; ctx.font = '700 15px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('⏱ ' + time + '   🗑️ 모은 쓰레기: ' + got, 10, 15);
        if (over) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 110, 520, 120); ctx.fillStyle = '#fff'; ctx.font = '700 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('바다가 깨끗해졌어요! ' + got + '개', 260, 160); ctx.font = '16px sans-serif'; ctx.fillText('(아래 ‘다시 하기’로 새 판)', 260, 195); }
        drawCode(performance.now() - lastHit < 300); raf = requestAnimationFrame(loop);
      }
      Eco.onLeave(() => { cancelAnimationFrame(raf); clearInterval(tmr); window.removeEventListener('keydown', onkd); window.removeEventListener('keyup', onku); });
      reset(); loop();
      return h('div.gamebox', h('p.small.muted', '방향키·WASD 또는 화면을 드래그해 펭귄을 움직여요. 45초 동안 쓰레기를 모아 바다를 지켜요!'), cv, h('div', { style: { marginTop: '8px' } }, code), h('div.row', { style: { marginTop: '8px' } }, h('button.btn', { onclick: reset }, '🔁 다시 하기')),
        h('div.note.blue', '💡 헬로메이플 ‘바다를 구해줘’에서도 같은 원리예요: 조건문(만약 ~이면)과 변수(모은 쓰레기)로 게임이 움직여요!'));
    } });

  /* ───── 먹이그물 퍼즐 ───── */
  Eco.addGame('foodweb', { name: '먹이그물 퍼즐', emoji: '🕸️', tag: '생태계', desc: '누가 누구에게 먹히는지 화살표로 이어요. 한 종이 사라지면?', cat: '생태',
    make() {
      const N = [{ id: 'grass', e: '🌿', n: '풀', x: 14, y: 78 }, { id: 'nut', e: '🌰', n: '도토리', x: 14, y: 22 }, { id: 'bug', e: '🐛', n: '애벌레', x: 38, y: 82 }, { id: 'rabbit', e: '🐇', n: '토끼', x: 38, y: 55 }, { id: 'squir', e: '🐿️', n: '다람쥐', x: 38, y: 22 }, { id: 'bird', e: '🐦', n: '딱새', x: 63, y: 78 }, { id: 'fox', e: '🦊', n: '여우', x: 63, y: 40 }, { id: 'owl', e: '🦉', n: '올빼미', x: 88, y: 60 }];
      const OK = new Set(['grass>rabbit', 'grass>bug', 'nut>squir', 'bug>bird', 'rabbit>fox', 'squir>fox', 'bird>owl', 'squir>owl']);
      const found = new Set(); let sel = null, wrong = 0; const box = h('div', { style: { position: 'relative', height: '380px', background: 'linear-gradient(#eaf7e0,#d4ecbf)', borderRadius: '16px', border: '2px solid var(--line)' } });
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; box.append(svg);
      const info = h('div.note', '먹히는 생물을 먼저 누르고, 먹는 생물을 눌러요. (예: 풀 → 토끼)'); const cnt = h('span.chip.sun', '');
      const upd = () => { cnt.textContent = '찾은 관계 ' + found.size + ' / ' + OK.size; };
      const line = (a, b, ok) => { const A = N.find(n => n.id === a), B = N.find(n => n.id === b); const l = document.createElementNS('http://www.w3.org/2000/svg', 'line'); l.setAttribute('x1', A.x + 4); l.setAttribute('y1', A.y + 6); l.setAttribute('x2', B.x + 4); l.setAttribute('y2', B.y + 6); l.setAttribute('stroke', ok ? '#2f8f4e' : '#e8506f'); l.setAttribute('stroke-width', '.9'); l.setAttribute('marker-end', 'url(#ar' + (ok ? 'g' : 'r') + ')'); svg.append(l); if (!ok) setTimeout(() => l.remove(), 900); };
      svg.innerHTML = '<defs><marker id="arg" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="#2f8f4e"/></marker><marker id="arr" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="#e8506f"/></marker></defs>';
      const nodes = {};
      N.forEach(n => { const b = h('button', { style: { position: 'absolute', left: n.x + '%', top: n.y + '%', transform: 'translate(-10%,-10%)', border: '3px solid #fff', borderRadius: '16px', background: '#fff', boxShadow: 'var(--sh2)', padding: '4px 8px', fontWeight: 700, cursor: 'pointer' }, onclick: () => {
        if (!sel) { sel = n.id; b.style.background = '#fff1c2'; return; }
        const key = sel + '>' + n.id; nodes[sel].style.background = '#fff'; const from = sel; sel = null; if (from === n.id) return;
        if (OK.has(key)) { if (!found.has(key)) { found.add(key); line(from, n.id, true); Eco.ui.sfx('ok'); info.textContent = '✔ ' + N.find(x => x.id === from).n + ' → ' + n.n + ' 맞아요!'; upd(); if (found.size === OK.size) win(); } }
        else { wrong++; line(from, n.id, false); Eco.ui.sfx('bad'); info.textContent = '✖ 그런 관계는 없어요. (먹히는 쪽 → 먹는 쪽 순서로!)'; }
      } }, h('div', { style: { fontSize: '1.7rem', textAlign: 'center' } }, n.e), h('div.small', n.n)); nodes[n.id] = b; box.append(b); });
      const after = h('div');
      function win() { Eco.ui.confetti(); Eco.ui.sfx('win'); Eco.gameDone('foodweb', Math.max(0, 100 - wrong * 10), 20, '먹이그물 완성');
        const qz = [['여우가 사라진다면 토끼와 다람쥐는 어떻게 될까요?', ['처음엔 늘어나지만 풀이 부족해질 수 있어요', '모두 사라져요', '변화가 전혀 없어요'], 0], ['먹이그물에서 화살표 방향은 무엇을 뜻할까요?', ['에너지(먹이)가 이동하는 방향', '달리는 방향', '사는 곳'], 0]];
        after.innerHTML = ''; after.append(h('div.note', '🎉 먹이그물 완성! 이제 생각해 봐요.')); qz.forEach(q => { after.append(h('b', q[0])); Eco.shuffle(q[1].map((t, i) => ({ t, i }))).forEach(o => after.append(h('button.quiz-opt', { onclick: e => { e.target.classList.add(o.i === q[2] ? 'ok' : 'bad'); Eco.ui.sfx(o.i === q[2] ? 'ok' : 'bad'); } }, o.t))); }); }
      upd();
      return h('div.gamebox', h('div.row.spread', h('h3', '🕸️ 숲속 먹이그물'), cnt), info, box, after, h('div.row', { style: { marginTop: '8px' } }, h('button.btn.alt.sm', { onclick: () => Eco.render() }, '🔁 처음부터')));
    } });

  /* ───── 곤충과 숨바꼭질 ───── */
  Eco.addGame('hide', { name: '곤충과 숨바꼭질', emoji: '🐛', tag: '관찰력', desc: '보호색으로 숨은 곤충을 찾아요. 천천히, 자세히 관찰해 보세요.', cat: '관찰',
    make() {
      const cv = h('canvas', { width: 520, height: 340, style: { cursor: 'crosshair' } }), ctx = cv.getContext('2d'); let round = 1, bugs = [], found = 0, t = 50, tmr, over = false, score = 0, hints = 2;
      const PAL = [['#5a8a3a', '#6fa043', '#4a7a32', '#8bb34d'], ['#8a6a3a', '#a07c46', '#6d5230', '#b99059'], ['#a8742a', '#c18a38', '#8a5f22', '#d9a24f']];
      const info = h('div.hudline'); const msg = h('div.note', '👀 화면 속에 숨은 곤충을 눌러 찾아요!');
      function scene() {
        const pal = PAL[(round - 1) % 3]; ctx.fillStyle = pal[0]; ctx.fillRect(0, 0, 520, 340);
        for (let i = 0; i < 420; i++) { ctx.fillStyle = pal[Math.random() * 4 | 0]; ctx.save(); ctx.translate(Math.random() * 520, Math.random() * 340); ctx.rotate(Math.random() * 6); ctx.beginPath(); ctx.ellipse(0, 0, 8 + Math.random() * 12, 3 + Math.random() * 5, 0, 0, 7); ctx.fill(); ctx.restore(); }
        bugs = Array.from({ length: 4 + round }, () => ({ x: 30 + Math.random() * 460, y: 30 + Math.random() * 280, f: false, c: pal[Math.random() * 4 | 0] }));
        bugs.forEach(b => { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.random() * 6); ctx.fillStyle = b.c; ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, 0, 9, 4.5, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(9, 0, 3, 0, 7); ctx.fill(); for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * 3, 3); ctx.lineTo(k * 3 - 2, 8); ctx.moveTo(k * 3, -3); ctx.lineTo(k * 3 - 2, -8); ctx.stroke(); } ctx.restore(); });
        found = 0; t = 50; hints = 2; draw();
      }
      const draw = () => { info.innerHTML = ''; info.append(h('span', '라운드 ' + round + '/3'), h('span', '🐛 ' + found + '/' + bugs.length), h('span', '⏱ ' + t), h('span', '💡 힌트 ' + hints)); };
      const mark = (b, ok) => { ctx.lineWidth = 3; ctx.strokeStyle = ok ? '#ffe14d' : '#ff6b6b'; ctx.beginPath(); ctx.arc(b.x, b.y, 18, 0, 7); ctx.stroke(); };
      cv.addEventListener('pointerdown', e => { if (over) return; const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * 520 / r.width, y = (e.clientY - r.top) * 340 / r.height; const b = bugs.find(b => !b.f && Math.hypot(b.x - x, b.y - y) < 18); if (b) { b.f = true; found++; mark(b, true); Eco.ui.sfx('coin'); score += 10 + t; draw(); if (found === bugs.length) { clearInterval(tmr); if (round >= 3) fin(); else { msg.textContent = '🎉 라운드 클리어! 다음 서식지로…'; setTimeout(() => { round++; start(); }, 1000); } } } else { Eco.ui.sfx('bad'); score = Math.max(0, score - 3); } });
      function start() { clearInterval(tmr); scene(); tmr = setInterval(() => { if (--t <= 0) { clearInterval(tmr); fin(); } draw(); }, 1000); }
      function fin() { over = true; clearInterval(tmr); msg.innerHTML = ''; msg.append('🏁 끝! 점수 ' + score + ' · 보호색 덕분에 곤충들은 천적을 피해요. ', h('button.btn.sm', { onclick: () => { round = 1; score = 0; over = false; start(); } }, '🔁 다시 하기')); Eco.ui.confetti(30); Eco.gameDone('hide', score, Math.min(25, Math.floor(score / 12)), '곤충과 숨바꼭질'); }
      const hint = h('button.btn.alt.sm', { onclick: () => { if (hints <= 0 || over) return; const b = bugs.find(b => !b.f); if (b) { hints--; mark(b, false); ctx.beginPath(); draw(); setTimeout(() => { }, 0); } } }, '💡 힌트 (빨간 원)');
      Eco.onLeave(() => clearInterval(tmr)); start();
      return h('div.gamebox', info, cv, h('div.row', { style: { margin: '8px 0' } }, hint), msg, h('div.note.blue', '🐞 보호색(위장)은 곤충이 주변과 비슷한 색·모양으로 숨는 생존 전략이에요.'));
    } });

})(window.Eco);
