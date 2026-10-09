/* 홈(탐험 대시보드) + 소개 + 프로필 */
(function (Eco) {
  const { h, esc } = Eco.ui;
  const CAFE = 'https://cafe.naver.com/treesnplay';
  Eco.CAFE = CAFE;

  Eco.progress = area => {
    const list = area ? Eco.progsOf(area) : Eco.PROGRAMS;
    const done = list.filter(p => Eco.store.questDone(p.id)).length;
    return { done, total: list.length, pct: list.length ? Math.round(done / list.length * 100) : 0 };
  };
  Eco.currentSeason = () => { const m = new Date().getMonth() + 1; return m >= 3 && m <= 5 ? '봄' : m <= 8 && m >= 6 ? '여름' : m >= 9 && m <= 11 ? '가을' : '겨울'; };

  const AVATARS = ['🧒', '👧', '👦', '🧑‍🌾', '🦊', '🐿️', '🦌', '🐻', '🐰', '🦉', '🐸', '🦋', '🐢', '🐧', '🦔', '🐝'];
  Eco.openProfile = function () {
    const S = Eco.store.get();
    let avatar = S.avatar;
    const isStu = Eco.session && Eco.session.role === 'student';
    const nameIn = h('input', { type: 'text', maxlength: 12, value: S.name, placeholder: '탐험가 이름 (예: 숲지기 민준)', 'aria-label': '탐험가 이름', disabled: isStu });
    const grid = h('div.row', { style: { gap: '6px' } });
    const draw = () => { grid.innerHTML = ''; AVATARS.forEach(a => grid.append(h('button.btn.sm' + (a === avatar ? '' : '.alt'), { style: { fontSize: '1.5rem', padding: '4px 10px' }, onclick: () => { avatar = a; draw(); Eco.ui.sfx('click'); } }, a))); };
    draw();
    const m = Eco.ui.modal(h('div', h('h2', '🧭 나는 숲속탐험대 대원!'), h('p.muted', '이름과 캐릭터를 골라요. (기록은 이 기기의 브라우저에만 저장돼요)'), nameIn, h('h3', { style: { marginTop: '14px' } }, '캐릭터 고르기'), grid,
      h('div.row', { style: { marginTop: '16px' } }, h('button.btn', { onclick: () => { if (!isStu) S.name = nameIn.value.trim(); S.avatar = avatar; Eco.store.save(); Eco.ui.refreshHud(); m.close(); Eco.ui.toast('환영해요, ' + (S.name || '탐험가') + '!'); Eco.render(); } }, '✔ 저장하기'))));
  };

  const tile = (href, ic, title, desc, extra) => h('a.tile' + (extra && extra.main ? '.main' : ''), { href }, extra && extra.tag ? h('span.chip.tag' + (extra.tagc || ''), extra.tag) : null, h('div.ic', ic), h('h3', title), h('p', desc), extra && extra.prog ? h('div', h('div.progress', h('span', { style: { width: extra.prog.pct + '%' } })), h('small.muted', extra.prog.done + ' / ' + extra.prog.total + ' 완료')) : null);

  Eco.route('/home', function () {
    const S = Eco.store.get(), L = Eco.store.levelInfo(), pr = Eco.progress();
    const season = Eco.currentSeason();
    const sIc = Eco.SEASONS.find(s => s.k === season);
    const doneAI = Object.values(S.aiplay).filter(x => x.done).length;
    const rec = Eco.PROGRAMS.filter(p => p.season.includes(season) && !Eco.store.questDone(p.id)).slice(0, 4);
    // 오늘의 미션: 날짜 기반 고정 추천
    const dayN = Math.floor(Date.now() / 864e5);
    const pool = Eco.PROGRAMS.filter(p => p.area !== 'wood' || p.xp >= 40);
    const todayQ = pool[dayN % pool.length];
    const dq = Eco.ARENA[dayN % Eco.ARENA.length];
    const ses = Eco.session; const unread = ses && ses.role === 'student' ? Eco.auth.comments(ses.code, ses.no).filter(c => !c.read) : [];
    const msgCard = unread.length ? h('div.card', { style: { marginBottom: '14px', borderColor: '#e9c14b', background: '#fffbe8' } }, h('h3', '💌 선생님이 보낸 메시지'), unread.slice(0, 5).map(c => h('div.note', h('b', (c.sticker || '🌟') + ' ' + (c.from || '선생님') + ': '), c.text, c.xp ? h('span.chip.sun', { style: { marginLeft: '6px' } }, '+' + c.xp + 'XP') : null)), h('button.btn.sm', { onclick: () => { Eco.auth.markRead(ses.code, ses.no); Eco.render(); } }, '👍 확인했어요')) : null;
    const el = h('div.fade-in', msgCard,
      h('div.hero',
        h('h1', (S.name ? S.avatar + ' ' + S.name + ' 대원, ' : '') + '숲속탐험대에 온 걸 환영해요!'),
        h('p', '자연과 함께 놀며 배우는 생태환경교육 AIDT ', h('b', 'Eco AI(에코아이)'), ' — 숲·놀·자 체험으로 생태감수성을 키우고, AIplay와 메타버스로 더 깊이 탐험해요.'),
        h('div.row', h('a.btn.sun', { href: '#/aidt' }, '🗺️ 탐험 시작하기'), S.name ? null : h('button.btn.alt', { onclick: Eco.openProfile }, '🧭 대원 등록하기')),
        h('div.stats',
          h('div.stat', h('b', L.icon + ' Lv.' + L.level), h('small', L.name)), h('div.stat', h('b', pr.done + '/' + pr.total), h('small', '체험 퀘스트')),
          h('div.stat', h('b', Object.keys(S.badges).length), h('small', '배지')), h('div.stat', h('b', '🔥' + S.streak.count), h('small', '연속 출석')), h('div.stat', h('b', S.xp), h('small', '경험치 XP')))),

      h('div.section-title', h('h2', '🧭 Eco AI 3step 탐험 코스')),
      h('div.grid.g4',
        h('div.card', h('span.chip', '1단계 · 기본'), h('h3', '교과 수업'), h('p.small.muted', '실과·교과서 차시대로 생태환경교육 요소를 학습해요.')),
        h('a.tile.main', { href: '#/aidt' }, h('span.chip.forest', '2단계 · 발전 (주자료)'), h('h3', '🌲 Eco AI 디지털교과서'), h('p', '숲·놀·자 체험 프로그램 ' + Eco.PROGRAMS.length + '종. 원본 영상과 활동지 그대로!')),
        h('a.tile', { href: '#/aiplay' }, h('span.chip.ai', '3단계 · 심화 (부가)'), h('h3', '🤖 AIplay 가이드북'), h('p', 'AI·에듀테크 ' + Eco.AIPLAY.length + '종으로 탐구·제작·실천해요.')),
        h('a.tile', { href: Eco.CAFE, target: '_blank', rel: 'noopener' }, h('span.chip.sun', '공유 · 학습카페'), h('h3', '☕ Eco AI 학습카페'), h('p', '작품·소감·질문을 올려 함께 나눠요. (네이버 카페)'))),

      h('div.section-title', h('h2', '🎯 오늘의 도전'), h('span.chip.sun', '일일 보너스')),
      h('div.grid.g2',
        h('div.card', h('div.row', h('span', { style: { fontSize: '2.4rem' } }, todayQ.emoji), h('div', h('b', '오늘의 탐험: ' + todayQ.name), h('div.small.muted', Eco.AREAS[todayQ.area].ch + ' · ' + todayQ.code + ' · ' + todayQ.season.join('/')))), h('p', todayQ.goal), h('a.btn', { href: '#/quest/' + todayQ.id }, Eco.store.questDone(todayQ.id) ? '✅ 다시 보기' : '지금 도전! +' + todayQ.xp + 'XP')),
        dailyQuiz(dq)),

      h('div.section-title', h('h2', '📅 다가오는 계기교육일'), h('a.btn.alt.sm', { href: '#/days' }, '달력 전체 보기 ▶')),
      h('div.grid.g3', Eco.upcomingDays(3).map(Eco.dayCard)),

      h('div.section-title', h('h2', sIc.ic + ' 지금은 ' + season + ' · 추천 프로그램'), h('span.muted.small', sIc.msg)),
      rec.length ? h('div.grid.g2', rec.map(p => questCard(p))) : h('div.note', '이번 계절 추천 프로그램을 모두 마쳤어요! 다른 계절 체험도 열어 보세요. 🎉'),

      h('div.section-title', h('h2', '🌳 3가지 숲놀자 영역')),
      h('div.grid.g3', ['forest', 'wood', 'nature'].map(k => { const a = Eco.AREAS[k]; return tile('#/aidt/area/' + k, a.icon, a.ch + ' · ' + a.name, a.desc, { prog: Eco.progress(k), main: true }); })),

      h('div.section-title', h('h2', '➕ 부가 프로그램'), h('span.chip.ai', 'AI · 에듀테크 · 메타버스 · 게임')),
      h('div.grid.g3',
        tile('#/aiplay', '🤖', 'AIplay 가이드북 (' + Eco.AIPLAY.length + '종)', '뤼튼·제미나이·캔바·젭퀴즈·딜라이트엑스·엔트리 등 활용 프로젝트와 웹 체험 도구', { tag: '가이드북', tagc: '.ai', prog: { done: doneAI, total: Eco.AIPLAY.length, pct: Math.round(doneAI / Eco.AIPLAY.length * 100) } }),
        tile('#/arcade', '🎮', '에코 놀이터', '분리배출·바다 구하기·생태계 균형·AI 트레이너·프롬프트 연구소 등 웹 게임 모음', { tag: 'GAME', tagc: '.sun' }),
        tile('#/meta', '🧊', '에코 메타버스', '3D 에코크래프트 + 마인크래프트 에듀케이션·로블록스·젭·딜라이트엑스 체험 가이드', { tag: 'META', tagc: '.meta' }),
        tile('#/game/onechance', '🐢', 'ONE CHANCE 스토리', '해양·생물·토양·기후 4가지 환경 스토리 챌린지 (입상 연구 모티브)', { tag: '입상작 모티브', tagc: '.sun' }),
        tile('#/game/carbon', '📅', '탄소중립 e캘린더', '매일 실천을 체크하고 나무를 키워요 (입상 연구 모티브)', { tag: '입상작 모티브', tagc: '.sun' }),
        tile('#/map', '🗺️', '경기도 숲체험 지도', '수목원·자연휴양림·유아숲체험원·생태공원 ' + (Eco.FOREST_MAP ? Eco.FOREST_MAP.length : 60) + '곳을 지도에서 찾고 다녀온 곳에 도장!', { tag: '지도', tagc: '.sun' }),
        tile('#/passport', '🏅', '내 탐험 여권', '도장·배지·기록을 모아 보고 학급용 기록을 저장해요', {})),

      h('div.card', { style: { marginTop: '22px' } }, h('div.row.spread', h('div', h('b', '📘 이 자료에 대해'), h('div.small.muted', '2024 제71회 경기도교육자료전 실과 분야 3등급 입상작 · 박경환·황의준(연천 군남초)')), h('a.btn.alt', { href: '#/about' }, '설명서 요약 보기')))
    );
    return el;
  });

  function questCard(p) {
    const done = Eco.store.questDone(p.id), a = Eco.AREAS[p.area];
    return h('a.qcard.' + a.color + (done ? '.done' : ''), { href: '#/quest/' + p.id }, h('div.num', a.ch), h('div', h('b', p.emoji + ' ' + p.name), h('small', p.code + ' · ' + p.season.join('/') + ' · +' + p.xp + 'XP')), h('span.stamp', done ? '✅' : '▶'));
  }
  Eco.questCard = questCard;

  function dailyQuiz(q) {
    const S = Eco.store.get(), key = 'd:' + Eco.today() + ':quiz';
    const box = h('div.card'); const draw = () => {
      box.innerHTML = '';
      box.append(h('div.row.spread', h('b', '❓ 오늘의 한 문제'), h('span.chip.sun', '+10XP')));
      if (S.meta[key]) { box.append(h('p', '오늘의 퀴즈를 이미 풀었어요! 내일 또 만나요 🌙'), h('div.small.muted', 'Q. ' + q[0] + ' → 정답: ' + q[1][0])); return; }
      box.append(h('p', q[0]));
      Eco.shuffle(q[1].map((t, i) => ({ t, i }))).forEach(o => box.append(h('button.quiz-opt', { onclick: e => {
        const ok = o.i === 0; e.target.classList.add(ok ? 'ok' : 'bad'); Eco.ui.sfx(ok ? 'ok' : 'bad');
        S.meta[key] = ok ? 2 : 1; Eco.store.save();
        if (ok) { Eco.store.addXP(10, '오늘의 퀴즈'); } else Eco.ui.toast('아쉬워요! 정답: ' + q[1][0]);
        setTimeout(draw, 1200);
      } }, o.t)));
    }; draw(); return box;
  }

  Eco.route('/about', function () {
    return h('div.fade-in',
      h('h1', '📘 자료 소개'), h('p.muted', '「자연과 함께 놀며 배우는 생태환경교육 AIDT Eco AI(에코아이)」 설명서 요약 — 제71회 경기도교육자료전 실과 분야 3등급'),
      h('div.card',
        h('h2', '제작 동기'), h('ul', h('li', '미래를 위한 생태환경교육의 첫걸음인 ‘자연친화지능’이 높은 아이로 성장하기 위한 자연친화적 생태교육의 필요성'),
          h('li', '숲을 활용한 자연친화 생태환경교육으로 학생들의 환경에 대한 인식 전환'), h('li', '디지털·AI 시대 학생들을 위한 AI·에듀테크·메타버스 활용 생태환경교육 자료 제작')),
        h('h2', '자료의 구성'), h('table.t', h('tr', h('th', '구분'), h('th', '자료'), h('th', '이 웹앱에서는')),
          h('tr', h('td', '주자료'), h('td', 'Eco AI 디지털교과서 (나모오서)'), h('td', h('a', { href: '#/aidt' }, '에코아이 교과서'), ' — 원본 전자책을 그대로 열람 + 퀘스트화')),
          h('tr', h('td', '보조'), h('td', 'Eco AI 가이드북 (AIplay 체험)'), h('td', h('a', { href: '#/aiplay' }, 'AIplay 가이드'), ' — 부가 프로그램')),
          h('tr', h('td', '보조'), h('td', 'Eco AI 학습카페'), h('td', h('a', { href: Eco.CAFE, target: '_blank', rel: 'noopener' }, '네이버 카페'))),
          h('tr', h('td', '보조'), h('td', 'Eco AI 활동지·수업자료, QR코드 50개'), h('td', '퀘스트 안에 원본 활동지 이미지 수록')),
          h('tr', h('td', '보조'), h('td', 'Eco AI 보드게임, 목공놀이 체험자료 10종'), h('td', '‘놀’ 영역 퀘스트 · 에코 놀이터 게임으로 재해석'))),
        h('h2', 'Eco AI 3step 실행 과정'), h('ol.ol.green', h('li', h('b', '기본 (교과) '), '실과 교과서 흐름대로 생태환경교육 요소 수업'), h('li', h('b', '발전 (체험) '), 'Eco AI 디지털교과서의 미션맵에서 숲·놀·자 프로그램을 골라 체험'), h('li', h('b', '심화 (탐구·실천) '), 'Eco AI 가이드북으로 AIplay 체험 → 학습카페에 작품·소감 공유')),
        h('h2', '교수·학습 지도안 예시 (2차시, 설명서 p.25~26)'), h('table.t', h('tr', h('th', '흐름'), h('th', '활동'), h('th', '시간'), h('th', '이 앱에서')),
          h('tr', h('td', '도입'), h('td', '학교나 인근 주변 숲 찾아보기 · 숲에서 할 수 있는 활동 알아보기 · 학습목표 안내(숲속탐험대 프로젝트 체험)'), h('td', '10′'), h('td', h('a', { href: '#/read/page048' }, '경기도 숲체험기관'), ' · 미션맵')),
          h('tr', h('td', '전개 ①'), h('td', '‘Eco AI 디지털교과서’로 숲·놀·자 체험 — 미션맵에서 원하는 프로그램을 골라 체험 (사전 안전교육 필수)'), h('td', '35′'), h('td', h('a', { href: '#/aidt' }, '에코아이 교과서'))),
          h('tr', h('td', '전개 ②'), h('td', '‘Eco AI 가이드북’으로 AIplay 심화 — 엔트리 AI 스마트 분리수거 쓰레기통, 캔바 환경동화책 만들기 등'), h('td', '35′'), h('td', h('a', { href: '#/aiplay' }, 'AIplay 가이드'))),
          h('tr', h('td', '정리'), h('td', '‘Eco AI 학습카페’에 학습 내용 공유·정리 · 과제 제시와 다음 차시 예고(물관·체관 관찰, 뤼튼·제미나이 탐구)'), h('td', '5′'), h('td', h('a', { href: Eco.CAFE, target: '_blank', rel: 'noopener' }, '학습카페')))),
        h('h2', '교육적 효과 (설명서 설문, 5·6학년·중1 20명)'), h('div.grid.g3',
          h('div.card', h('b', '자연친화지능 향상'), h('p', '긍정 응답 18명 · 모름 2명 · 부정 0명')),
          h('div.card', h('b', '생태환경 흥미·관심 향상'), h('p', '긍정 응답 20명 (100%)')),
          h('div.card', h('b', 'AI·에듀테크 자기주도 심화학습'), h('p', '긍정 응답 18명 · 모름 2명'))),
        h('h2', '이 웹앱의 변화 (2024 → 지금)'), h('ul',
          h('li', '디지털교과서(나모오서 전자책)는 ', h('b', '원본 영상·그림·활동지 그대로'), ' 유지하고, 게이미피케이션(XP·레벨·배지·여권·퀘스트·퀴즈)을 얹었어요.'),
          h('li', '가이드북의 AI·에듀테크 프로그램은 모두 ', h('b', '부가 프로그램'), '으로 구성했어요.'),
          h('li', '생성형 AI와 바이브코딩으로 만든 웹 게임·3D 에코크래프트 메타버스를 더했어요.'),
          h('li', '최근 입상작(ONE CHANCE, e캘린더 ZERO 탄소중립, 학교숲 이야기)을 모티브로 한 추가 프로그램을 담았어요.')),
        h('div.note.blue', '이 앱의 기록(XP·배지·메모)은 사용하는 기기의 브라우저에만 저장돼요. 학급 기록은 ‘내 여권 → 기록 내보내기’로 파일 저장 후 모아 볼 수 있어요.')));
  });
})(window.Eco);
