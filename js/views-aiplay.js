/* 부가 프로그램: Eco AI 가이드북 AIplay 체험 + 입상작 모티브 프로그램 */
(function (Eco) {
  const { h } = Eco.ui;
  const W = Eco.widgets;

  const copy = (txt, btn) => { const done = () => { Eco.ui.toast('복사했어요! 📋'); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, () => fallback()); else fallback(); function fallback() { const t = h('textarea', { style: { position: 'fixed', opacity: 0 } }); t.value = txt; document.body.append(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { Eco.ui.toast('복사하지 못했어요. 직접 선택해 복사해 주세요.'); } t.remove(); } };
  Eco.copy = copy;

  function toolCard(t) {
    const S = Eco.store.get(), done = S.aiplay[t.id] && S.aiplay[t.id].done;
    return h('a.toolcard', { href: '#/aiplay/' + t.id },
      h('div.row.spread', h('span.chip.' + t.colorClass, t.cat), done ? h('span', '✅') : h('span.muted.small', '#' + t.no)),
      h('div.logo', t.logo ? h('img', { src: t.logo, alt: t.tool + ' 로고', loading: 'lazy', style: t.logoH ? { height: t.logoH + 'px' } : null }) : h('span.emo', t.emoji)),
      h('b', t.emoji + ' ' + t.tool), h('div.small.muted', t.title), t.day ? h('span.chip.sun', '📅 ' + t.day) : null);
  }

  /* 계기교육일 카드 (AIplay 허브·계기교육 달력 공용) */
  const ddayChip = x => h('span.chip' + (x.diff === 0 ? '.berry' : x.diff <= 14 ? '.sun' : ''), { style: x.diff === 0 ? { background: '#ffe0e5', color: '#b2304d' } : null }, x.diff === 0 ? '🎉 오늘!' : 'D-' + x.diff);
  function dayCard(x) {
    const ai = x.ai && Eco.AIPLAY.find(a => a.id === x.ai);
    return h('div.card', h('div.row.spread', h('div', { style: { fontSize: '2rem' } }, x.ic), ddayChip(x)), h('b', x.d.replace('.', '월 ') + '일 · ' + x.name), h('div.small.muted', { style: { margin: '4px 0 8px' } }, (x.tool ? x.tool + ' · ' : '') + x.tip),
      h('div.row', { style: { gap: '6px' } }, ai ? h('a.btn.ai.sm', { href: '#/aiplay/' + ai.id }, '🤖 ' + ai.tool.split(' (')[0] + ' 프로젝트') : null, x.go ? h('a.btn.sm', { href: x.go[0] }, '🎯 ' + x.go[1]) : null));
  }
  Eco.dayCard = dayCard;
  Eco.route('/days', function () {
    let month = 0; const out = h('div.grid.g3'), tabs = h('div.pill-tabs');
    const all = Eco.upcomingDays(Eco.DAYS.length);
    const draw = () => { tabs.innerHTML = ''; [['전체', 0], ...Array.from({ length: 12 }, (_, i) => [(i + 1) + '월', i + 1])].forEach(([t, m]) => { const n = m ? Eco.DAYS.filter(d => +d.d.split('.')[0] === m).length : Eco.DAYS.length; if (m && !n) return; tabs.append(h('button' + (m === month ? '.on' : ''), { onclick: () => { month = m; draw(); } }, t + ' ' + n)); });
      out.innerHTML = ''; (month ? all.filter(d => +d.d.split('.')[0] === month).sort((a, b) => +a.d.split('.')[1] - +b.d.split('.')[1]) : all).forEach(x => out.append(dayCard(x))); };
    draw();
    return h('div.fade-in', h('a.back', { href: '#/aiplay' }, '← AIplay 가이드'), h('h1', '📅 생태환경 계기교육 달력'),
      h('p.muted', '환경·생태와 관련된 기념일 ' + Eco.DAYS.length + '개예요. 기념일을 계기로 디지털교과서 체험, AIplay, 에코 놀이터 활동을 이어서 수업할 수 있어요. 가까운 날짜 순으로 보여 줘요.'),
      h('div.card', { style: { marginBottom: '12px' } }, h('b', '🔔 다가오는 계기교육일'), h('div.grid.g3', { style: { marginTop: '8px' } }, Eco.upcomingDays(3).map(dayCard))),
      tabs, out, h('div.note', 'ℹ️ 날짜는 환경 관련 공개 자료를 바탕으로 정리했어요. 학교 연간 계획과 환경부·교육청의 공식 공지를 함께 확인해 주세요. (식목일은 법정 공휴일이 아니에요.)'));
  });

  Eco.route('/aiplay', function () {
    const main = Eco.AIPLAY.filter(x => !x.extra), more = Eco.AIPLAY.filter(x => x.extra);
    const S = Eco.store.get(), doneN = Object.values(S.aiplay).filter(x => x.done).length;
    return h('div.fade-in',
      h('div.hero', { style: { background: 'linear-gradient(135deg,#3a7bd5,#7b5cd6)' } }, h('h1', '🤖 AIplay 가이드북 · 부가 프로그램'),
        h('p', 'Eco AI 3단계 ‘심화’ — 디지털교과서에서 체험한 내용을 생성형 AI·에듀테크·메타버스로 탐구·제작·실천해요. 원본 가이드북의 10개 AIplay 프로젝트와 활용 도구를 그대로 담았어요.'),
        h('div.stats', h('div.stat', h('b', doneN + '/' + Eco.AIPLAY.length), h('small', '체험 완료')), h('div.stat', h('b', Eco.AIPLAY.length), h('small', '도구·프로젝트')))),
      h('div.section-title', h('h2', '📅 생태환경 계기교육 달력'), h('a.btn.alt.sm', { href: '#/days' }, '전체 ' + Eco.DAYS.length + '개 보기 ▶')),
      h('p.small.muted', '가까운 계기교육일이에요. 날짜마다 이 앱의 활동과 AIplay 프로젝트를 연결해 두었어요.'),
      h('div.grid.g4', Eco.upcomingDays(4).map(dayCard)),
      h('div.section-title', h('h2', '🧩 가이드북 AIplay 프로젝트 10선')), h('div.grid.g3', main.map(toolCard)),
      h('div.section-title', h('h2', '🔧 함께 쓰는 에듀테크'), h('span.muted.small', '설명서 ‘AI·에듀테크 활용 예시’의 도구 + 게임형 퀴즈 에듀테크(카훗·블루킷·웨이그라운드)')), h('div.grid.g3', more.map(toolCard)),
      h('div.section-title', h('h2', '🏆 입상작 모티브 추가 프로그램'), h('span.muted.small', '최근 생태환경교육·AI 에듀테크 입상 연구를 참고해 이 앱 안에서 바로 즐길 수 있게 만들었어요')),
      h('div.grid.g2', Eco.EXTRA.map(x => h('a.tile', { href: x.route }, h('div.ic', x.emoji), h('h3', x.name), h('p', x.desc), h('small.muted', '📎 ' + x.ref)))),
      h('div.note', '※ 외부 서비스(뤼튼·제미나이·캔바·젭·딜라이트엑스 등)는 각 사이트의 약관·연령 정책·계정 조건을 따라요. 학생 계정이 필요한 도구는 교사 안내 후 사용해요.'));
  });

  Eco.route('/aiplay/:id', function (id) {
    const t = Eco.AIPLAY.find(x => x.id === id); if (!t) return h('div.card', '프로그램을 찾을 수 없어요.');
    const S = Eco.store.get(); const rec = S.aiplay[id] || {}; const note = h('textarea', { placeholder: '체험 소감이나 만든 작품 링크를 적어 두세요 (학습카페에 올릴 내용 메모)…' }); note.value = rec.note || '';
    note.addEventListener('input', () => { S.aiplay[id] = Object.assign(S.aiplay[id] || {}, { note: note.value }); Eco.store.save(); });
    const idx = Eco.AIPLAY.indexOf(t), prev = Eco.AIPLAY[idx - 1], next = Eco.AIPLAY[idx + 1];
    const done = h('div'); const drawDone = () => { done.innerHTML = ''; const r = S.aiplay[id]; if (r && r.done) done.append(h('div.note', '✅ AIplay 체험 완료! 결과물은 학습카페에 올려 공유해 보세요.')); else done.append(h('button.btn.ai', { onclick: () => { S.aiplay[id] = Object.assign(S.aiplay[id] || {}, { done: true, ts: Date.now(), note: note.value }); Eco.store.save(); Eco.store.addXP(50, 'AIplay · ' + t.tool); Eco.ui.confetti(); Eco.ui.sfx('win'); drawDone(); } }, '🏅 AIplay 체험 완료 (+50XP)')); }; drawDone();
    let extraW = null; if (t.builtin && t.builtin.widget && W[t.builtin.widget]) extraW = W[t.builtin.widget](t);
    const progs = t.link.map(Eco.prog).filter(Boolean);
    return h('div.fade-in', h('a.back', { href: '#/aiplay' }, '← AIplay 가이드'),
      h('div.row.spread', h('h1', t.emoji + ' ' + t.tool), h('div.row', h('span.chip.' + t.colorClass, t.cat), t.day ? h('span.chip.sun', '📅 ' + t.day) : null)),
      h('div.mission-banner', { style: { background: 'linear-gradient(90deg,#e6f0ff,#d6e6ff)', borderColor: '#7aa7e6' } }, h('b', '🎯 활동 '), t.title),
      h('p', t.desc), h('div.small.muted', '🔑 ' + t.needs),
      h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', alignItems: 'start', marginTop: '10px' } },
        h('div.grid',
          h('div.card', h('h3', '🧭 조작 과정'), h('ol.ol', t.steps.map(s => h('li', s))), t.links ? h('div.link-list', t.links.map(l => h('a', { href: l.u, target: '_blank', rel: 'noopener' }, '🔗 ' + l.t))) : null),
          t.prompts ? h('div.card', h('h3', '💡 프롬프트 예시'), t.prompts.map(p => h('div.note.blue', p, h('div', h('button.btn.alt.sm', { onclick: () => copy(p) }, '📋 복사'))))) : null,
          extraW ? h('div.card', extraW) : null),
        h('div.grid',
          t.logo ? h('div.card', { style: { textAlign: 'center' } }, h('img', { src: t.logo, alt: t.tool, style: { maxHeight: '90px' } })) : null,
          t.photos ? h('div.card', h('h3', '📷 수업 장면 · 화면'), h('div.photo-row', t.photos.map(p => h('img', { src: p, alt: t.tool + ' 활동 사진', loading: 'lazy' })))) : null,
          h('div.card', h('h3', '🌲 연계 Eco AI 프로그램'), progs.length ? h('div.grid', progs.map(p => Eco.questCard(p))) : h('p.muted.small', '디지털교과서 어느 프로그램과도 연계해 활용할 수 있어요.')),
          h('div.card', h('h3', '🚀 바로 가기'), h('div.row', h('a.btn.ai', { href: t.url, target: '_blank', rel: 'noopener' }, (t.openLabel || t.tool + ' 열기') + ' ↗'), (t.urls || []).map(x => h('a.btn.ai', { href: x.u, target: '_blank', rel: 'noopener' }, x.t + ' ↗')), t.builtin && t.builtin.route ? h('a.btn.sun', { href: t.builtin.route }, t.builtin.label) : null), h('a.small', { href: Eco.CAFE, target: '_blank', rel: 'noopener', style: { display: 'block', marginTop: '8px' } }, '☕ 학습카페 과제 업로드')),
          h('div.card', h('h3', '📝 내 메모'), note, h('div', { style: { marginTop: '8px' } }, done)))),
      h('div.row.spread', { style: { marginTop: '16px' } }, prev ? h('a.btn.alt', { href: '#/aiplay/' + prev.id }, '◀ ' + prev.tool) : h('span'), next ? h('a.btn', { href: '#/aiplay/' + next.id }, next.tool + ' ▶') : h('span')));
  });

  /* ── 위젯: 환경 동화책 스토리카드 (캔바) ── */
  W.storybook = function () {
    const S = Eco.store.get(); const d = S.meta.story = S.meta.story || { title: '', scenes: ['', '', '', ''] };
    const ti = h('input', { type: 'text', placeholder: '동화책 제목 (예: 지구를 지켜줘)', value: d.title }); ti.addEventListener('input', () => { d.title = ti.value; Eco.store.save(); });
    const hints = ['① 주인공과 문제 상황', '② 문제가 커져요', '③ 친구들이 힘을 모아요', '④ 지구를 지키는 실천!'];
    const emos = ['🌍', '😢', '🤝', '🌳'];
    const inputs = d.scenes.map((s, i) => { const t = h('textarea', { placeholder: hints[i], style: { minHeight: '60px' } }); t.value = s; t.addEventListener('input', () => { d.scenes[i] = t.value; Eco.store.save(); }); return t; });
    const out = h('div');
    const preview = h('button.btn.sm', { onclick: () => {
      out.innerHTML = ''; let pg = 0; const card = h('div.card', { style: { background: '#fffbe8', textAlign: 'center', minHeight: '150px' } }); const draw = () => { card.innerHTML = ''; card.append(h('div', { style: { fontSize: '3rem' } }, emos[pg]), h('b', pg === 0 ? '📖 ' + (d.title || '제목 없음') : ''), h('p', d.scenes[pg] || '(내용을 적어 보세요)'), h('div.small.muted', (pg + 1) + ' / 4 쪽')); };
      draw(); out.append(card, h('div.row', { style: { justifyContent: 'center' } }, h('button.btn.alt.sm', { onclick: () => { pg = (pg + 3) % 4; draw(); } }, '◀'), h('button.btn.alt.sm', { onclick: () => { pg = (pg + 1) % 4; draw(); } }, '▶'), h('button.btn.alt.sm', { onclick: () => { const t = '[' + (d.title || '제목') + ']\n' + d.scenes.map((s, i) => (i + 1) + '쪽: ' + s).join('\n') + '\n\n' + d.scenes.map((s, i) => (i + 1) + '쪽 삽화 프롬프트: ' + (s || '장면') + ' — 귀엽고 따뜻한 동화 일러스트, 밝은 색감').join('\n'); copy(t); } }, '📋 캔바용으로 복사')));
      if (d.scenes.every(s => s.trim().length > 5)) Eco.dailyOnce('story', 10, '환경동화 4장면 완성');
    } }, '📖 책으로 미리보기');
    return h('div', h('h3', '📖 환경 동화책 스토리카드'), h('p.small.muted', '4장면의 줄거리를 짜고, 캔바에서 쓸 삽화 프롬프트까지 만들어요.'), ti, inputs.map((t, i) => h('div', { style: { marginTop: '6px' } }, h('small.muted', emos[i] + ' ' + hints[i]), t)), h('div.row', { style: { margin: '8px 0' } }, preview), out);
  };

  /* ── 위젯: 방탈출 퀴즈 메이커 (젭퀴즈) ── */
  W.quizmaker = function () {
    const S = Eco.store.get(); const qs = S.meta.qm = S.meta.qm || [{ q: '식물이 잎으로 물을 내보내는 작용은?', a: '증산', o: ['증산', '광합성', '호흡'] }];
    const list = h('div'); const play = h('div');
    const save = () => Eco.store.save();
    const draw = () => { list.innerHTML = ''; qs.forEach((x, i) => list.append(h('div.card', { style: { marginBottom: '6px', padding: '10px' } }, h('div.row.spread', h('b', 'Q' + (i + 1) + '. ' + x.q), h('button.btn.alt.sm', { onclick: () => { qs.splice(i, 1); save(); draw(); } }, '🗑')), h('div.small', '정답: ', h('b', x.a), x.o.length > 1 ? ' · 보기: ' + x.o.join(' / ') : ' (단답형)')))); };
    draw();
    const qi = h('input', { type: 'text', placeholder: '문제 (예: 5월 22일은 무슨 날?)' }), ai = h('input', { type: 'text', placeholder: '정답 (예: 생물종 다양성 보존의 날)' }), oi = h('input', { type: 'text', placeholder: '오답 보기 쉼표로 (비우면 단답형)' });
    const add = h('button.btn.sm', { onclick: () => { if (!qi.value.trim() || !ai.value.trim()) { Eco.ui.toast('문제와 정답을 적어 주세요'); return; } const wrong = oi.value.split(',').map(s => s.trim()).filter(Boolean); qs.push({ q: qi.value.trim(), a: ai.value.trim(), o: wrong.length ? [ai.value.trim(), ...wrong] : [ai.value.trim()] }); qi.value = ai.value = oi.value = ''; save(); draw(); Eco.ui.sfx('pop'); if (qs.length >= 5) Eco.dailyOnce('qm', 15, '방탈출 문제 5개 제작'); } }, '➕ 문제 추가');
    const run = h('button.btn.sun.sm', { onclick: () => { if (!qs.length) return; let i = 0; const stage = () => { play.innerHTML = ''; if (i >= qs.length) { play.append(h('div.note', '🎉 모든 문을 열고 탈출 성공! 🔓')); Eco.ui.confetti(60); return; } const x = qs[i]; play.append(h('div.card', h('div', { style: { fontSize: '2.2rem' } }, '🚪'.repeat(1) + ' ' + (i + 1) + '번째 문'), h('b', x.q), x.o.length > 1 ? Eco.shuffle(x.o).map(o => h('button.quiz-opt', { onclick: e => { const ok = o === x.a; e.target.classList.add(ok ? 'ok' : 'bad'); Eco.ui.sfx(ok ? 'ok' : 'bad'); if (ok) { i++; setTimeout(stage, 600); } } }, o)) : (() => { const inp = h('input', { type: 'text', placeholder: '정답 입력' }); return h('div.row', inp, h('button.btn.sm', { onclick: () => { if (inp.value.trim() === x.a) { Eco.ui.sfx('ok'); i++; stage(); } else Eco.ui.sfx('bad'); } }, '확인')); })())); }; stage(); } }, '▶ 미리 탈출해 보기');
    const exp = h('button.btn.alt.sm', { onclick: () => copy(qs.map((x, i) => (i + 1) + '. ' + x.q + '\n  정답: ' + x.a + (x.o.length > 1 ? '\n  보기: ' + x.o.join(' / ') : '')).join('\n\n')) }, '📋 문제 목록 복사');
    /* 에코아이 퀘스트의 미니퀴즈 불러오기 · 카훗/블루킷/웨이그라운드/젭퀴즈용 파일(CSV) 내보내기 */
    const progSel = h('select', { 'aria-label': '퀘스트 선택', style: { width: 'auto', maxWidth: '100%' } }, [h('option', { value: '' }, '에코아이 퀘스트 퀴즈 불러오기…'), ...Eco.PROGRAMS.filter(p => Eco.QUIZ[p.id]).map(p => h('option', { value: p.id }, p.code + ' ' + p.name))]);
    progSel.addEventListener('change', () => { const id = progSel.value; if (!id) return; const base = qs.length; (Eco.QUIZ[id] || []).forEach(x => { if (!qs.some(q => q.q === x[0])) qs.push({ q: x[0], a: x[1][x[2]], o: x[1].slice() }); }); progSel.value = ''; save(); draw(); Eco.ui.toast((qs.length - base) + '문제를 불러왔어요'); });
    const csvBtn = h('button.btn.alt.sm', { onclick: () => {
      const rows = [['문제', '보기1', '보기2', '보기3', '보기4', '정답 번호(1~4)']];
      qs.filter(x => x.o.length > 1).forEach(x => { const opts = Eco.shuffle(x.o).slice(0, 4); if (!opts.includes(x.a)) opts[0] = x.a; while (opts.length < 4) opts.push(''); rows.push([x.q, ...opts, opts.indexOf(x.a) + 1]); });
      if (rows.length < 2) { Eco.ui.toast('보기가 있는 문제가 없어요 (단답형은 제외돼요)'); return; } Eco.csv(rows, '에코아이_퀴즈.csv'); } }, '⬇ 스프레드시트(CSV) 저장');
    return h('div', h('h3', '🧩 퀴즈 메이커'), h('p.small.muted', '에코아이 퀘스트의 문제를 불러오거나 새로 만들고, 여기서 미리 풀어 본 뒤 카훗·블루킷·웨이그라운드·젭퀴즈에 옮겨 쓰세요. (CSV는 서비스마다 가져오기 양식이 달라서, 서비스의 양식에 맞춰 열을 옮겨 붙여 넣어야 할 수 있어요.)'), progSel, list, qi, ai, oi, h('div.row', { style: { margin: '8px 0' } }, add, run, exp, csvBtn), play);
  };

  /* ── 위젯: 물의 순환 퀴즈 (에듀넷 디지털교과서) ── */
  W.watercycle = function () {
    const STEPS = [['☀️ 증발·증산', '햇빛으로 물이 수증기가 돼요'], ['☁️ 응결(구름)', '수증기가 식어 작은 물방울이 돼요'], ['🌧️ 강수(비·눈)', '물방울이 커져 땅으로 내려와요'], ['🏞️ 흐름·스며듦', '강과 바다, 땅속으로 물이 모여요']]; let order = [];
    const out = h('div.note.blue', '순서대로 눌러 물의 여행을 완성해 보세요!'); const box = h('div.row');
    const draw = () => { box.innerHTML = ''; Eco.shuffle(STEPS.map((s, i) => i)).forEach(i => { }); };
    const shuffled = Eco.shuffle([0, 1, 2, 3]);
    shuffled.forEach(i => box.append(h('button.btn.alt', { onclick: e => { if (i === order.length) { order.push(i); e.target.classList.add('sun'); e.target.disabled = true; Eco.ui.sfx('ok'); out.textContent = '✔ ' + STEPS[i][0] + ' — ' + STEPS[i][1]; if (order.length === 4) { out.textContent = '🎉 물의 순환 완성! 식물의 증산도 물의 여행에 한몫해요.'; Eco.ui.confetti(50); Eco.dailyOnce('wcycle', 10, '물의 순환 퍼즐'); } } else { Eco.ui.sfx('bad'); out.textContent = '앗, 순서를 다시 생각해 봐요. 먼저 일어나는 일은?'; } } }, STEPS[i][0])));
    return h('div', h('h3', '💧 물의 여행 순서 퍼즐'), h('p.small.muted', '에듀넷 디지털교과서 과학 ‘물의 상태 변화’·‘물의 여행’ 연결 활동'), box, out);
  };

})(window.Eco);
