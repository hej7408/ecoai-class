/* 주자료: Eco AI 디지털교과서 (미션맵 · 영역별 목록 · 퀘스트 · 원본 열람) */
(function (Eco) {
  const { h, esc } = Eco.ui;
  const M = Eco.MEDIA;

  /* 원본 전자책 쪽 ↔ 프로그램 */
  const pageToProg = {};
  Eco.PROGRAMS.forEach(p => { if (p.vid) pageToProg[p.vid] = p.id; if (p.sheet) pageToProg[p.sheet] = p.id; });
  const KNOWN = { page002: '미션맵(지도)', page003: '숲체험학습', page004: '놀(나무공예) 체험학습', page006: '자(자연물놀이) 체험학습', page099: '자(자연물놀이) 기타체험', page104: 'AIplay 심화체험', page048: '경기도 숲체험기관', page105: 'AIplay 안내', page103: '지도 안내',
    page080: '숲 체험학습 안내', page081: '놀 체험학습 안내', page082: '자 체험학습 안내', page100: '기타체험 안내', page086: '경기도 숲체험기관 안내', pubtree_cover: '표지', pubtree_title_page: '표제지' };
  Eco.pageTitle = id => { const q = pageToProg[id]; if (q) { const p = Eco.prog(q); return p.code + ' ' + p.name + (id === p.sheet ? ' (활동지)' : ''); } return KNOWN[id] || id; };
  Eco.pageToProg = pageToProg;

  /* 원본 프레임에서 오는 메시지 */
  Eco.frameHandlers = {};
  window.addEventListener('message', e => {
    const d = e.data; if (!d || !d.eco) return;
    if (d.eco === 'go') { (Eco.frameHandlers.go || defaultGo)(d.id); }
    if (d.eco === 'page') { Eco.frameHandlers.page && Eco.frameHandlers.page(d.id); }
  });
  function defaultGo(id) {
    const areaOf = { page003: 'forest', page004: 'wood', page006: 'nature', page099: 'nature' };
    if (areaOf[id]) { Eco.go('#/aidt/area/' + areaOf[id]); return; }
    if (id === 'page104') { Eco.go('#/aiplay'); return; }
    if (id === 'page002') { Eco.go('#/aidt'); return; }
    Eco.go('#/read/' + id);
  }

  /* ---------- 허브 ---------- */
  Eco.route('/aidt', function () {
    const pr = Eco.progress();
    Eco.frameHandlers = { go: defaultGo };
    const map = h('div', Eco.frame('page002', Math.min(420, innerWidth - 40)), h('p.small.muted', { style: { textAlign: 'center' } }, '▲ 원본 ‘숲속 탐험대 Mission Map’ — 지도의 그림을 눌러 보세요!'));
    const area = k => {
      const a = Eco.AREAS[k], p = Eco.progress(k);
      return h('a.tile.main', { href: '#/aidt/area/' + k }, h('div.row.spread', h('div.ic', a.icon), h('span.chip.' + a.color, a.ch)), h('h3', a.name + ' (' + p.total + ')'), h('p', a.desc), h('div.progress', h('span', { style: { width: p.pct + '%' } })), h('small.muted', p.done + ' / ' + p.total + ' 완료'));
    };
    const seasonRow = h('div.seasonbar', Eco.SEASONS.map(s => h('a.chip.sun', { href: '#/aidt/season/' + s.k, style: { fontSize: '.95rem', padding: '5px 14px', textDecoration: 'none' } }, s.ic + ' ' + s.k)));
    return h('div.fade-in', h('h1', '🌲 Eco AI 디지털교과서'), h('p.muted', '주자료 · 나모오서로 만든 원본 디지털교과서의 영상·그림·활동지를 그대로 담았어요. 프로그램을 골라 체험하고 도장을 모아 보세요!'),
      h('div.mapwrap', map, h('div',
        h('div.card', h('div.row.spread', h('b', '전체 진행률'), h('span.chip.sun', pr.done + ' / ' + pr.total)), h('div.progress', h('span', { style: { width: pr.pct + '%' } })), h('div.small.muted', { style: { marginTop: '6px' } }, '프로그램을 마칠 때마다 XP와 도장을 받아요.')),
        h('div.grid', { style: { marginTop: '12px' } }, area('forest'), area('wood'), area('nature')),
        h('div.card', { style: { marginTop: '12px' } }, h('b', '🍂 계절별로 골라 하기'), seasonRow),
        h('div.row', { style: { marginTop: '12px' } }, h('a.btn.alt', { href: '#/read/page002' }, '📖 원본 전자책으로 보기'), h('a.btn.alt', { href: '#/map' }, '🗺️ 경기도 숲체험 지도'), h('a.btn.alt', { href: '#/read/page048' }, '🏞️ 원본 숲체험기관 쪽'), h('a.btn.ai', { href: '#/aiplay' }, '🤖 AIplay 심화체험')))));
  });

  /* ---------- 영역별 목록 ---------- */
  Eco.route('/aidt/area/:key', function (key) {
    const a = Eco.AREAS[key]; if (!a) return h('div.card', '없는 영역이에요.');
    let list = Eco.progsOf(key), season = '전체';
    const out = h('div.grid.g2'); const pr = Eco.progress(key);
    const fill = () => { out.innerHTML = ''; list.filter(p => season === '전체' || p.season.includes(season) || p.season.includes('사계절')).forEach(p => out.append(Eco.questCard(p))); };
    const tabs = h('div.pill-tabs');
    const drawTabs = () => { tabs.innerHTML = ''; ['전체', ...Eco.SEASONS.map(s => s.k)].forEach(s => tabs.append(h('button' + (s === season ? '.on' : ''), { onclick: () => { season = s; drawTabs(); fill(); } }, s === '전체' ? '전체' : (Eco.SEASONS.find(x => x.k === s).ic + ' ' + s)))); };
    drawTabs(); fill();
    return h('div.fade-in', h('a.back', { href: '#/aidt' }, '← 미션맵'), h('div.row.spread', h('h1', a.icon + ' ' + a.ch + ' · ' + a.name), h('a.btn.alt.sm', { href: '#/read/' + a.hub }, '📖 원본 ' + a.ch + ' 목차 보기')),
      h('p.muted', a.desc), h('div.row', h('div.progress', { style: { flex: 1, minWidth: '160px' } }, h('span', { style: { width: pr.pct + '%' } })), h('b', pr.done + '/' + pr.total)),
      key === 'wood' ? h('div.note', '🛡️ 목공 활동은 반드시 선생님과 함께, 보안경·장갑을 착용하고 해요. (놀-1~4는 기술 익히기, 놀-5~13은 만들기)') : null, tabs, out);
  });
  Eco.route('/aidt/season/:s', function (s) {
    const sd = Eco.SEASONS.find(x => x.k === s) || Eco.SEASONS[0];
    const list = Eco.PROGRAMS.filter(p => p.season.includes(sd.k));
    return h('div.fade-in', h('a.back', { href: '#/aidt' }, '← 미션맵'), h('h1', sd.ic + ' ' + sd.k + ' 프로그램'), h('p.muted', sd.msg + ' · 추천 계절에 맞는 프로그램이에요. (' + list.length + '종)'),
      h('div.grid.g2', list.map(p => Eco.questCard(p))));
  });

  /* ---------- 퀘스트(프로그램 상세) ---------- */
  Eco.route('/quest/:id', function (id) {
    const p = Eco.prog(id); if (!p) return h('div.card', '프로그램을 찾을 수 없어요.');
    const a = Eco.AREAS[p.area], S = Eco.store.get();
    const q = Eco.store.quest(id) || {};
    const saved = Object.assign({ steps: [], notes: {}, quiz: null }, q);
    const list = Eco.progsOf(p.area), idx = list.findIndex(x => x.id === id);
    const prev = list[idx - 1], next = list[idx + 1];
    const save = () => Eco.store.patchQuest(id, { steps: saved.steps, notes: saved.notes, quiz: saved.quiz });

    const video = p.vid && M.vid[p.vid] ? h('video', { controls: true, preload: 'metadata', poster: M.poster[p.vid] ? 'aidt/nep_image/' + M.poster[p.vid] : null, style: { width: '100%', borderRadius: '16px', background: '#000', maxHeight: '440px' }, src: 'aidt/nep_video/' + M.vid[p.vid] }) : null;
    const sheetImg = p.sheet && M.sheet[p.sheet] ? h('img', { src: 'aidt/nep_image/' + M.sheet[p.sheet], alt: p.name + ' 활동지', style: { borderRadius: '14px', border: '2px solid var(--line)', width: '100%' }, loading: 'lazy' }) : null;

    const stepsBox = h('div');
    const doneCount = () => saved.steps.filter(Boolean).length;
    const stepLabel = h('span.chip', '');
    const drawSteps = () => {
      stepsBox.innerHTML = '';
      p.steps.forEach((s, i) => {
        const cb = h('input', { type: 'checkbox', checked: !!saved.steps[i], 'aria-label': (i + 1) + '단계 완료' });
        const row = h('label.step' + (saved.steps[i] ? '.on' : ''), cb, h('span', h('b', (i + 1) + '. '), s));
        cb.addEventListener('change', () => { saved.steps[i] = cb.checked; row.classList.toggle('on', cb.checked); Eco.ui.sfx('click'); save(); stepLabel.textContent = doneCount() + '/' + p.steps.length; });
        stepsBox.append(row);
      });
      stepLabel.textContent = doneCount() + '/' + p.steps.length;
    };
    drawSteps();

    const thinkBox = h('div', p.think.map((t, i) => {
      const ta = h('textarea', { placeholder: '내 생각을 적어 보아요…', 'aria-label': t }); ta.value = saved.notes['t' + i] || '';
      ta.addEventListener('input', () => { saved.notes['t' + i] = ta.value; save(); });
      return h('div', { style: { marginBottom: '8px' } }, h('div', h('b', '💭 생각할 거리 ' + (p.think.length > 1 ? (i + 1) : '')), h('div', t)), ta);
    }));

    /* 퀴즈 */
    const qs = Eco.QUIZ[id] || []; const quizBox = h('div'); let qi = 0, right = 0;
    const stampBtnBox = h('div');
    const drawQuiz = () => {
      quizBox.innerHTML = '';
      if (!qs.length) { quizBox.append(h('p.muted', '이 프로그램은 퀴즈가 없어요.')); return; }
      if (saved.quiz && saved.quiz.total === qs.length && qi === 0 && !quizBox.dataset.retry) {
        quizBox.append(h('div.note', '🎯 퀴즈 결과: ' + saved.quiz.right + ' / ' + saved.quiz.total + '  ', h('button.btn.alt.sm', { onclick: () => { quizBox.dataset.retry = 1; qi = 0; right = 0; drawQuiz(); } }, '다시 풀기')));
        return;
      }
      if (qi >= qs.length) { saved.quiz = { right, total: qs.length }; save(); delete quizBox.dataset.retry; quizBox.append(h('div.note', '🎯 퀴즈 결과: ' + right + ' / ' + qs.length)); drawStamp(); if (right === qs.length) Eco.ui.confetti(60); return; }
      const [qq, opts, ans, exp] = qs[qi];
      quizBox.append(h('div', h('b', 'Q' + (qi + 1) + '. ' + qq)));
      Eco.shuffle(opts.map((t, i) => ({ t, i }))).forEach(o => {
        const b = h('button.quiz-opt', { onclick: () => {
          const ok = o.i === ans; b.classList.add(ok ? 'ok' : 'bad'); Eco.ui.sfx(ok ? 'ok' : 'bad'); if (ok) right++;
          quizBox.querySelectorAll('.quiz-opt').forEach(x => x.disabled = true);
          quizBox.append(h('div.note' + (ok ? '' : '.blue'), (ok ? '정답! ' : '정답은 “' + opts[ans] + '”. ') + (exp || '')), h('button.btn.sm', { onclick: () => { qi++; drawQuiz(); } }, qi + 1 < qs.length ? '다음 문제 ▶' : '결과 보기'));
        } }, o.t);
        quizBox.append(b);
      });
    };
    const drawStamp = () => {
      stampBtnBox.innerHTML = '';
      const done = Eco.store.questDone(id);
      if (done) { const d = new Date(Eco.store.quest(id).ts); stampBtnBox.append(h('div.note', '✅ 도장 완료! (' + d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate() + ')  ', h('span', '다음 탐험을 떠나 볼까요?'))); return; }
      const ready = !qs.length || (saved.quiz && saved.quiz.total === qs.length);
      stampBtnBox.append(h('button.btn.sun', { disabled: !ready, onclick: () => {
        const bonus = (saved.quiz ? saved.quiz.right : 0) * 5;
        Eco.store.patchQuest(id, { done: true, ts: Date.now(), steps: saved.steps, notes: saved.notes, quiz: saved.quiz });
        Eco.store.addXP(p.xp + bonus, p.code + ' ' + p.name); Eco.ui.confetti(); Eco.ui.sfx('win'); drawStamp(); stampTop.textContent = '✅ 완료';
      } }, '🔖 도장 찍기 (+' + (p.xp + (saved.quiz ? saved.quiz.right * 5 : 0)) + 'XP)'), ready ? null : h('span.small.muted', '  퀴즈를 모두 풀면 도장을 찍을 수 있어요'));
    };
    const stampTop = h('span.chip', Eco.store.questDone(id) ? '✅ 완료' : '미완료');
    drawQuiz(); drawStamp();

    const wdg = p.widget && Eco.widgets && Eco.widgets[p.widget] ? Eco.widgets[p.widget](p) : null;

    return h('div.fade-in',
      h('a.back', { href: '#/aidt/area/' + p.area }, '← ' + a.ch + ' · ' + a.name),
      h('div.row.spread', h('h1', p.emoji + ' ' + p.name), h('div.row', h('span.chip.' + a.color, p.code), stampTop, p.season.map(s => h('span.chip.sun', s)))),
      h('div.mission-banner', h('b', '🎯 미션 '), p.goal),
      h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', marginTop: '14px', alignItems: 'start' } },
        h('div.grid',
          video ? h('div.card', h('h3', '🎬 체험 영상 (원본)'), video) : h('div.card', h('h3', '🎬 안내'), h('p.muted', '이 프로그램은 별도 영상 없이 활동지로 진행해요.')),
          h('div.card', h('div.row.spread', h('h3', '✅ 진행 방법'), stepLabel), p.mats.length ? h('div', { style: { marginBottom: '8px' } }, h('b', '🎒 준비물 '), p.mats.map(m => h('span.chip', { style: { margin: '2px' } }, m))) : null, stepsBox),
          wdg ? h('div.card', wdg) : null,
          h('div.card', thinkBox)),
        h('div.grid',
          sheetImg ? h('div.card', h('h3', '📄 원본 활동지'), sheetImg, h('div.row', { style: { marginTop: '8px' } }, h('a.btn.alt.sm', { href: 'aidt/nep_image/' + M.sheet[p.sheet], target: '_blank', rel: 'noopener' }, '🖨️ 크게 보기·인쇄'))) : null,
          h('div.card', h('h3', '❓ 미니 퀴즈'), quizBox, stampBtnBox),
          h('div.card', h('h3', '📖 원본 전자책'), h('p.small.muted', '나모오서 디지털교과서 원본 쪽을 그대로 열어 볼 수 있어요.'), h('div.row', p.vid ? h('a.btn.alt.sm', { href: '#/read/' + p.vid }, '체험 쪽') : null, p.sheet ? h('a.btn.alt.sm', { href: '#/read/' + p.sheet }, '활동지 쪽') : null)),
          h('div.card', h('h3', '🤖 AIplay로 심화하기'), h('p.small.muted', 'Eco AI 3단계 — 이 체험을 AI·에듀테크로 더 깊이 탐구해요.'),
            h('div.row', Eco.AIPLAY.filter(x => x.link.includes(id)).map(x => h('a.btn.ai.sm', { href: '#/aiplay/' + x.id }, x.emoji + ' ' + x.tool)), Eco.AIPLAY.some(x => x.link.includes(id)) ? null : h('a.btn.ai.sm', { href: '#/aiplay' }, 'AIplay 가이드 보기')),
            h('a.small', { href: Eco.CAFE, target: '_blank', rel: 'noopener', style: { display: 'block', marginTop: '8px' } }, '☕ 결과물은 학습카페에 올려 공유해요'))
        )),
      h('div.row.spread', { style: { marginTop: '18px' } }, prev ? h('a.btn.alt', { href: '#/quest/' + prev.id }, '◀ ' + prev.name) : h('span'), next ? h('a.btn', { href: '#/quest/' + next.id }, next.name + ' ▶') : h('a.btn', { href: '#/aidt' }, '미션맵으로')));
  });

  /* ---------- 원본 전자책 열람 ---------- */
  Eco.route('/read/:page', function (page) {
    let cur = page;
    const side = h('div.card'); const titleEl = h('b', Eco.pageTitle(cur));
    const avail = () => Math.min(800, document.getElementById('view').clientWidth - 40);
    let fitS = Math.max(.42, Math.min(1, (innerHeight - 230) / 1280, avail() / 800));
    const stage = h('div.reader-stage');
    let frame = Eco.frame(cur, 800 * fitS); stage.append(frame);
    const rescale = s => { fitS = Math.max(.3, Math.min(1.25, s)); frame.remove(); frame = Eco.frame(cur, 800 * fitS); stage.append(frame); };
    const drawSide = () => {
      side.innerHTML = ''; const q = pageToProg[cur];
      side.append(h('h3', '📖 지금 보는 쪽'), titleEl);
      if (q) { const p = Eco.prog(q); side.append(h('div', { style: { marginTop: '10px' } }, Eco.questCard(p))); }
      side.append(h('h3', { style: { marginTop: '14px' } }, '이동'), h('div.row',
        h('button.btn.alt.sm', { onclick: () => go('page002') }, '🗺️ 지도'), h('button.btn.alt.sm', { onclick: () => go('page003') }, '숲'), h('button.btn.alt.sm', { onclick: () => go('page004') }, '놀'), h('button.btn.alt.sm', { onclick: () => go('page006') }, '자'), h('button.btn.alt.sm', { onclick: () => go('page099') }, '자-기타'), h('button.btn.alt.sm', { onclick: () => go('page104') }, 'AIplay'), h('button.btn.alt.sm', { onclick: () => go('page048') }, '숲체험기관')),
        h('div.small.muted', { style: { marginTop: '10px' } }, '원본 쪽 안의 단추와 영상은 그대로 동작해요. 활동지 쪽에는 인쇄해서 쓸 수 있어요.'));
    };
    function go(id) { cur = id; frame.setPage(id); titleEl.textContent = Eco.pageTitle(id); drawSide(); history.replaceState(null, '', '#/read/' + id); }
    Eco.frameHandlers = { go: id => go(id), page: id => { if (id !== cur) { cur = id; titleEl.textContent = Eco.pageTitle(id); drawSide(); history.replaceState(null, '', '#/read/' + id); } } };
    drawSide();
    return h('div.fade-in', h('a.back', { href: '#/aidt' }, '← 에코아이 교과서'),
      h('div.reader-bar', h('button.btn.alt.sm', { onclick: () => rescale(fitS - .1) }, '➖ 작게'), h('button.btn.alt.sm', { onclick: () => rescale(fitS + .1) }, '➕ 크게'), h('button.btn.alt.sm', { onclick: () => rescale(Math.min(1, (innerHeight - 230) / 1280)) }, '↔ 맞춤'), h('button.btn.alt.sm', { onclick: () => { const el = stage; (el.requestFullscreen || el.webkitRequestFullscreen || (() => { })).call(el); } }, '⛶ 전체화면')),
      h('div.reader', stage, side));
  });
})(window.Eco);
