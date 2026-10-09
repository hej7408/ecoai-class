/* 에코 놀이터 2: 탄소중립 e캘린더 · 퀴즈 아레나 · ONE CHANCE 스토리 · 프롬프트 연구소 */
(function (Eco) {
  const { h } = Eco.ui;

  /* ───── 탄소중립 e캘린더 ───── */
  const ACTIONS = [['cup', '🥤', '텀블러·개인컵 사용', .05], ['bag', '🛍️', '장바구니·에코백 사용', .03], ['light', '💡', '안 쓰는 전등 끄기', .08], ['plug', '🔌', '안 쓰는 플러그 뽑기', .1], ['walk', '🚶', '가까운 거리는 걸어가기', .4], ['bus', '🚌', '대중교통·자전거 이용', .5], ['food', '🍚', '음식 남기지 않기', .25], ['sort', '♻️', '분리배출 꼼꼼히 하기', .1], ['water', '🚿', '샤워 시간 줄이기·물 아끼기', .1], ['paper', '📄', '이면지·종이 아껴 쓰기', .05], ['veg', '🥗', '채식 한 끼 먹어 보기', .6], ['stairs', '🪜', '엘리베이터 대신 계단', .05]];
  Eco.addGame('carbon', { name: '탄소중립 e캘린더', emoji: '📅', tag: '습관 챌린지', desc: '매일 실천한 탄소중립 행동을 체크하고 나무를 키워요. (ZERO 탄소중립 생활실천 모티브)', cat: '실천',
    make() {
      const S = Eco.store.get(); const today = Eco.today(); S.carbon[today] = S.carbon[today] || [];
      const box = h('div.gamebox'); const now = new Date(); let ym = { y: now.getFullYear(), m: now.getMonth() };
      const total = () => Object.values(S.carbon).reduce((a, l) => a + l.length, 0);
      const kg = () => Object.values(S.carbon).reduce((a, l) => a + l.reduce((s, id) => s + (ACTIONS.find(x => x[0] === id) || [0, 0, 0, 0])[3], 0), 0);
      const stage = n => n >= 100 ? ['🌳', '울창한 나무'] : n >= 50 ? ['🌲', '큰 나무'] : n >= 20 ? ['🌴', '어린 나무'] : n >= 8 ? ['🌿', '묘목'] : n >= 1 ? ['🌱', '새싹'] : ['🌰', '씨앗'];
      const draw = () => {
        box.innerHTML = ''; const n = total(), st = stage(n);
        box.append(h('div.row.spread', h('div', h('b', '🗓 오늘 (' + today + ')'), h('div.small.muted', '오늘 실천한 행동을 눌러 체크! (하루 5개까지 XP)')), h('div', { style: { textAlign: 'center' } }, h('div', { style: { fontSize: '3rem' } }, st[0]), h('small', st[1] + ' · 실천 ' + n + '회'))));
        const g = h('div.grid.g3'); ACTIONS.forEach(a => { const on = S.carbon[today].includes(a[0]); g.append(h('button.step' + (on ? '.on' : ''), { style: { width: '100%', textAlign: 'left' }, onclick: () => { const L = S.carbon[today], i = L.indexOf(a[0]); if (i >= 0) L.splice(i, 1); else { L.push(a[0]); Eco.ui.sfx('coin'); if (L.length <= 5) Eco.store.addXP(3, '탄소중립 실천 · ' + a[2]); } Eco.store.save(); if (L.length === 5) { Eco.ui.confetti(40); } draw(); } }, h('span', { style: { fontSize: '1.5rem' } }, a[1]), h('span', h('b', a[2]), h('div.small.muted', '≈ ' + a[3] + 'kg CO₂ 감축')))); }); box.append(g);
        box.append(h('div.note', '🌏 지금까지 줄인 이산화탄소(추정): ', h('b', kg().toFixed(2) + ' kg'), ' ≈ 소나무 ' + (kg() / 6.6).toFixed(1) + '그루가 1년 동안 흡수하는 양 (교육용 대략치)'));
        /* 달력 */
        const first = new Date(ym.y, ym.m, 1), days = new Date(ym.y, ym.m + 1, 0).getDate();
        const head = h('div.row.spread', h('button.btn.alt.sm', { onclick: () => { ym.m--; if (ym.m < 0) { ym.m = 11; ym.y--; } draw(); } }, '◀'), h('b', ym.y + '년 ' + (ym.m + 1) + '월'), h('button.btn.alt.sm', { onclick: () => { ym.m++; if (ym.m > 11) { ym.m = 0; ym.y++; } draw(); } }, '▶'));
        const cal = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginTop: '6px' } }); ['일', '월', '화', '수', '목', '금', '토'].forEach(d => cal.append(h('div.small.muted', { style: { textAlign: 'center' } }, d)));
        for (let i = 0; i < first.getDay(); i++) cal.append(h('div'));
        for (let d = 1; d <= days; d++) { const key = ym.y + '-' + String(ym.m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'), c = (S.carbon[key] || []).length; cal.append(h('div', { style: { aspectRatio: '1', borderRadius: '10px', border: '2px solid ' + (key === today ? 'var(--g1)' : 'var(--line)'), background: c ? 'hsl(110,55%,' + (92 - Math.min(c, 6) * 6) + '%)' : '#fafdf6', display: 'grid', placeItems: 'center', fontSize: '.8rem', textAlign: 'center', lineHeight: 1.1 } }, h('div', d, c ? h('div', '🌿×' + c) : null))); }
        box.append(h('h3', { style: { marginTop: '14px' } }, '📆 우리의 e캘린더'), head, cal);
      };
      draw(); return box;
    } });

  /* ───── 퀴즈 아레나 ───── */
  Eco.addGame('arena', { name: '에코 퀴즈 아레나', emoji: '🏟️', tag: '퀴즈 배틀', desc: '15초 안에 답해요! 콤보·50:50·패스 찬스로 최고 점수에 도전!', cat: '퀴즈',
    make() {
      let qs = Eco.shuffle(Eco.ARENA).slice(0, 10), i = 0, score = 0, combo = 0, t = 15, tmr, lives = 3, fifty = 1, pass = 1, right = 0;
      const box = h('div.gamebox'); const draw = () => {
        clearInterval(tmr); box.innerHTML = '';
        if (i >= qs.length || lives <= 0) { const xp = Math.min(30, Math.floor(score / 15)); box.append(h('h2', lives <= 0 ? '💔 라이프가 모두 떨어졌어요' : '🏁 아레나 클리어!'), h('div.note', '점수 ' + score + ' · 정답 ' + right + '/' + qs.length), h('button.btn', { onclick: () => { qs = Eco.shuffle(Eco.ARENA).slice(0, 10); i = 0; score = 0; combo = 0; lives = 3; fifty = 1; pass = 1; right = 0; draw(); } }, '🔁 다시 도전')); Eco.ui.confetti(40); Eco.gameDone('arena', score, xp, '에코 퀴즈 아레나'); return; }
        const q = qs[i]; t = 15; let opts = Eco.shuffle(q[1].map((o, k) => ({ o, ok: k === q[2] })));
        const tb = h('span', '⏱ 15'); const hud = h('div.hudline', h('span', '문제 ' + (i + 1) + '/' + qs.length), h('span', '⭐ ' + score), h('span', '🔥 ' + combo), h('span', '❤️'.repeat(lives)), tb);
        const area = h('div'); const pbar = h('div.progress', h('span', { style: { width: '100%', transition: 'width 1s linear' } }));
        const answer = (ok, btn) => { clearInterval(tmr); area.querySelectorAll('button').forEach(b => b.disabled = true); if (ok) { combo++; right++; score += 10 + Math.max(0, t) + Math.min(combo, 5) * 3; Eco.ui.sfx('ok'); btn && btn.classList.add('ok'); } else { combo = 0; lives--; Eco.ui.sfx('bad'); btn && btn.classList.add('bad'); const co = [...area.querySelectorAll('button')].find(b => b.dataset.ok); co && co.classList.add('ok'); } setTimeout(() => { i++; draw(); }, 900); };
        const render = () => { area.innerHTML = ''; opts.forEach(x => { const b = h('button.quiz-opt', { onclick: () => answer(x.ok, b) }, x.o); if (x.ok) b.dataset.ok = 1; area.append(b); }); };
        render();
        const tools = h('div.row', { style: { marginTop: '8px' } }, h('button.btn.alt.sm', { disabled: !fifty, onclick: () => { fifty = 0; const wrong = opts.filter(x => !x.ok); wrong.slice(0, 2).forEach(w => opts.splice(opts.indexOf(w), 1)); render(); tools.children[0].disabled = true; } }, '✂️ 50:50 (' + fifty + ')'), h('button.btn.alt.sm', { disabled: !pass, onclick: () => { pass = 0; i++; draw(); } }, '⏭ 패스 (' + pass + ')'));
        box.append(hud, pbar, h('h3', { style: { marginTop: '10px' } }, q[0]), area, tools);
        requestAnimationFrame(() => { pbar.firstChild.style.width = '0%'; pbar.firstChild.style.transitionDuration = '15s'; });
        tmr = setInterval(() => { t--; tb.textContent = '⏱ ' + t; if (t <= 0) answer(false, null); }, 1000);
      };
      Eco.onLeave(() => clearInterval(tmr)); draw(); return box;
    } });

  /* ───── ONE CHANCE 스토리 챌린지 ───── */
  const STORIES = [
    { id: 'sea', emoji: '🌊', name: '해양 · 아기 바다거북 파랑이', intro: '파랑이가 사는 바다에 알록달록한 플라스틱이 둥둥 떠다녀요. 파랑이는 해파리인 줄 알고 삼킬 뻔했어요!', stages: [
      { k: '오감체험', q: '바다의 소리를 눈 감고 들어 보니 어떤 생각이 드나요?', o: [['파도 소리 사이로 비닐이 부스럭거려요. 바다가 아파 보여요.', 2, '소리와 마음에 귀 기울이는 것이 오감체험의 시작이에요.'], ['시끄러우니 귀를 막아요.', 0, '조금만 더 귀 기울여 볼까요?'], ['상관없어요.', 0, '바다는 우리와 연결되어 있어요.']] },
      { k: '탐구활동', q: '바다 쓰레기는 어디서 왔을까요? 가장 알맞은 탐구 방법은?', o: [['우리 동네 하천·해변 쓰레기 종류를 조사해 표로 정리해요.', 2, '데이터로 원인을 찾는 탐구예요!'], ['바다가 스스로 만들었다고 생각해요.', 0, '원인은 우리의 생활 속에 있어요.'], ['아무도 모르니 포기해요.', 0, '조사하면 알 수 있어요.']] },
      { k: '관계맺기', q: '파랑이를 돕는 마음을 친구들과 나누려면?', o: [['해양 보호 포스터를 만들어 학교에 공유해요.', 2, '공감을 나누는 활동이에요.'], ['혼자만 알고 있어요.', 0, '함께하면 힘이 커져요.'], ['친구에게 쓰레기를 버리라고 해요.', 0, '반대로 해야 해요!']] },
      { k: '실천활동', q: '내일부터 실천할 수 있는 한 가지는?', o: [['일회용 플라스틱 대신 텀블러·장바구니 쓰기', 2, '작은 실천이 바다를 구해요.'], ['바다에 가서 쓰레기 줍고 오지 않기', 0, '주운 쓰레기는 꼭 가져와야 해요.'], ['아무것도 하지 않기', 0, '한 번뿐인 기회예요!']] }] },
    { id: 'bee', emoji: '🐝', name: '생물 · 꿀벌 붕붕이', intro: '붕붕이가 꽃을 찾아 날아다니지만 꽃밭이 점점 줄어들고 있어요. 꿀벌이 사라지면 우리 식탁도 위험해요!', stages: [
      { k: '오감체험', q: '꽃밭에서 눈을 감고 느껴 보세요. 무엇이 느껴지나요?', o: [['윙윙 소리, 꽃 향기, 따뜻한 햇살!', 2, '오감으로 생명을 느껴요.'], ['아무것도 없어요.', 0, '조금 더 천천히 느껴 보아요.'], ['벌이 무서워서 도망가요.', 0, '가만히 있으면 꿀벌은 공격하지 않아요.']] },
      { k: '탐구활동', q: '꿀벌이 하는 중요한 일은?', o: [['꽃가루받이로 열매와 씨앗을 맺게 도와요.', 2, '많은 작물이 꿀벌의 도움을 받아요.'], ['나무를 베요.', 0, '꿀벌은 꽃가루를 옮겨요.'], ['쓰레기를 치워요.', 0, '꽃가루받이가 핵심이에요.']] },
      { k: '관계맺기', q: '꿀벌과 다른 생물은 어떻게 연결되어 있을까요?', o: [['꽃→벌→새·곤충…먹이그물로 서로 연결돼요.', 2, '생물다양성은 연결이에요.'], ['서로 아무 상관 없어요.', 0, '모든 생물은 연결되어 있어요.'], ['벌만 중요해요.', 0, '모두 중요해요.']] },
      { k: '실천활동', q: '꿀벌을 돕는 실천은?', o: [['화단에 꽃을 심고 살충제 대신 자연 방제를 알아봐요.', 2, '꽃밭이 늘면 꿀벌도 늘어요.'], ['꽃을 모두 뽑아요.', 0, '꽃은 꿀벌의 식당이에요.'], ['벌집을 막대기로 쑤셔요.', 0, '위험하고 해로워요!']] }] },
    { id: 'soil', emoji: '🪱', name: '토양 · 지렁이 꿈틀이', intro: '꿈틀이가 사는 흙에 쓰레기가 쌓여 식물이 시들고 있어요. 흙을 살리려면 어떻게 해야 할까요?', stages: [
      { k: '오감체험', q: '흙을 한 줌 만져 보세요. 어떤 느낌인가요?', o: [['촉촉하고 부드럽고, 흙냄새가 나요.', 2, '건강한 흙은 살아 있어요.'], ['더러우니 만지지 않을래요.', 0, '장갑을 끼고 안전하게 만져 볼 수 있어요.'], ['돌덩이 같아요.', 1, '다져진 흙은 숨쉬기 힘들어요.']] },
      { k: '탐구활동', q: '쓰레기 중 흙 속에서 가장 오래 남는 것은?', o: [['플라스틱 (수백 년)', 2, '플라스틱은 분해가 거의 안 돼요.'], ['바나나 껍질', 0, '음식물은 비교적 빨리 분해돼요.'], ['나뭇잎', 0, '자연물은 분해돼요.']] },
      { k: '관계맺기', q: '꿈틀이와 같은 분해자가 하는 일은?', o: [['죽은 잎과 음식 찌꺼기를 분해해 흙을 비옥하게 해요.', 2, '분해자는 숲의 청소부이자 요리사예요.'], ['식물을 먹어요.', 0, '분해자는 죽은 생물을 분해해요.'], ['공기를 오염시켜요.', 0, '반대로 흙을 건강하게 해요.']] },
      { k: '실천활동', q: '흙을 살리는 실천은?', o: [['커피찌꺼기·음식물을 거름으로 만들어 텃밭에 써요.', 2, '유기농 비료 만들기와 같은 실천이에요!'], ['쓰레기를 땅에 묻어요.', 0, '땅에 묻어도 사라지지 않아요.'], ['농약을 많이 뿌려요.', 0, '과도한 농약은 흙을 아프게 해요.']] }] },
    { id: 'ice', emoji: '🐻‍❄️', name: '기후 · 북극곰 하양이', intro: '하양이가 쉬던 얼음이 점점 녹아요. 지구가 뜨거워지는 건 우리가 내보내는 이산화탄소 때문이래요!', stages: [
      { k: '오감체험', q: '여름 한낮의 뜨거운 햇볕 아래 서 있어 보세요. 북극곰에게 이런 더위가 계속된다면?', o: [['얼음이 녹고 지낼 곳이 사라질 것 같아요.', 2, '공감이 실천의 시작이에요.'], ['시원해서 좋아해요.', 0, '북극곰은 추운 곳에서 살아요.'], ['모르겠어요.', 0, '조금 더 생각해 봐요.']] },
      { k: '탐구활동', q: '지구온난화를 일으키는 주된 기체는?', o: [['이산화탄소 등 온실가스', 2, '화석연료를 태울 때 많이 나와요.'], ['산소', 0, '산소는 온실가스가 아니에요.'], ['수소', 0, '주된 원인은 이산화탄소예요.']] },
      { k: '관계맺기', q: '지구의 기온을 1.5℃ 이내로 지키려면 누가 노력해야 할까요?', o: [['정부·기업·학교·나 모두 함께!', 2, '함께할 때 힘이 커져요.'], ['어른만', 0, '우리도 할 수 있어요.'], ['북극곰만', 0, '모두의 문제예요.']] },
      { k: '실천활동', q: '오늘 바로 줄일 수 있는 탄소는?', o: [['안 쓰는 전등·플러그 끄기, 가까운 거리 걷기', 2, 'e캘린더에서 매일 기록해 봐요!'], ['에어컨 틀고 창문 열기', 0, '에너지 낭비예요.'], ['일회용품 많이 쓰기', 0, '쓰레기와 탄소가 늘어요.']] }] }
  ];
  Eco.addGame('onechance', { name: 'ONE CHANCE 스토리', emoji: '🐢', tag: '입상작 모티브', desc: '해양·생물·토양·기후 스토리를 오감체험→탐구→관계맺기→실천 4단계로 해결해요.', cat: '스토리',
    make() {
      const S = Eco.store.get(); const box = h('div.gamebox');
      const menu = () => { box.innerHTML = ''; box.append(h('p.muted', '‘하나뿐인 지구를 살릴 수 있는 마지막 기회!’ — 4가지 환경 스토리에서 4단계 도전을 완수해요.'), h('div.grid.g2', STORIES.map(s => { const r = S.stories[s.id]; return h('button.tile', { onclick: () => play(s) }, h('div.ic', s.emoji), h('h3', s.name), h('p', s.intro), r ? h('span.chip.sun', '⭐ ' + r.score + '/8') : h('span.chip', '미도전')); })));
        const done = Object.keys(S.stories).length; if (done === 4) box.append(h('div.note', '🌍 4가지 스토리를 모두 완수했어요! 대단해요!')); };
      const play = st => { let k = 0, score = 0; const step = () => {
        box.innerHTML = ''; if (k >= 4) { S.stories[st.id] = { score: Math.max(score, (S.stories[st.id] || {}).score || 0), ts: Date.now() }; Eco.store.save(); Eco.ui.confetti(); const nfirst = Object.keys(S.stories).length; box.append(h('h2', st.emoji + ' 스토리 완수!'), h('div.note', '점수 ' + score + ' / 8'), h('p', '마지막 기회를 지켜 낸 나의 약속을 학습카페에 남겨 봐요.'), h('button.btn', { onclick: menu }, '다른 스토리 고르기')); Eco.gameDone('onechance', Object.values(S.stories).reduce((a, b) => a + b.score, 0), 15, 'ONE CHANCE ' + st.name.split('·')[0].trim()); return; }
        const s = st.stages[k]; box.append(h('div.row.spread', h('b', st.emoji + ' ' + st.name), h('span.chip.sun', (k + 1) + '단계 · ' + s.k)), h('div.progress', h('span', { style: { width: k / 4 * 100 + '%' } })), k === 0 ? h('div.note', st.intro) : null, h('h3', { style: { marginTop: '10px' } }, s.q));
        Eco.shuffle(s.o).forEach(o => box.append(h('button.quiz-opt', { onclick: e => { box.querySelectorAll('.quiz-opt').forEach(b => b.disabled = true); e.target.classList.add(o[1] === 2 ? 'ok' : 'bad'); Eco.ui.sfx(o[1] === 2 ? 'ok' : 'bad'); score += o[1]; box.append(h('div.note' + (o[1] === 2 ? '' : '.blue'), o[2]), h('button.btn.sm', { onclick: () => { k++; step(); } }, k < 3 ? '다음 단계 ▶' : '결과 보기')); } }, o[0])));
      }; step(); };
      menu(); return box;
    } });

  /* ───── 프롬프트 연구소 ───── */
  const MISSIONS = [
    { id: 'm1', t: '증산 작용 이해하기', goal: '비닐봉투를 씌운 나뭇잎에 물방울이 맺히는 까닭을 AI에게 물어보세요.', kw: ['증산', '비닐', '물방울', '잎'] },
    { id: 'm2', t: '환경 동화 줄거리', goal: '지구의 날을 주제로 한 4컷 환경 동화 줄거리를 AI에게 부탁하세요.', kw: ['동화', '지구', '줄거리', '환경'] },
    { id: 'm3', t: '학교숲 활동 아이디어', goal: '4학년 학생들이 학교 숲에서 할 수 있는 안전한 체험 활동을 추천받아 보세요.', kw: ['학교', '숲', '활동', '안전'] }
  ];
  const CHECKS = [
    ['역할', '“너는 ~야 / ~처럼 말해 줘”로 AI의 역할을 정했나요?', t => /(너는|당신은|역할|전문가|선생님|해설사|박사|처럼)/.test(t)],
    ['상황·대상', '누구에게 필요한지(초등학생·4학년·학교숲 등) 알려 주었나요?', t => /(초등|학년|학생|어린이|친구|학교|숲|우리 반)/.test(t)],
    ['구체적 질문', '무엇을 알고 싶은지 구체적으로 물었나요? (20자 이상 + 질문/요청)', t => t.length >= 20 && /(\?|알려|설명|추천|만들어|써 줘|써줘|정리|제안|알고)/.test(t)],
    ['형식', '답의 모양(표·3문장·단계별·목록)을 정했나요?', t => /(표|문장|단계|목록|번호|줄|개로|가지로|요약|이야기)/.test(t)],
    ['조건', '쉬운 말, 예시, 글자 수 같은 조건을 달았나요?', t => /(쉬운|쉽게|예시|예를|이하|이내|간단|초등학생이 이해)/.test(t)],
    ['검증 요청', '근거·출처·확인 방법을 함께 요청했나요?', t => /(출처|근거|확인|사실|검증|왜냐|이유)/.test(t)]
  ];
  Eco.addGame('prompt', { name: '프롬프트 연구소', emoji: '🧪', tag: '생성형 AI', desc: '좋은 질문(프롬프트)을 쓰면 별 6개! 뤼튼·제미나이 같은 생성형 AI를 쓰기 전에 연습해요.', cat: 'AI 리터러시',
    make() {
      const S = Eco.store.get(); let mi = 0; const box = h('div.gamebox');
      const draw = () => {
        box.innerHTML = ''; const m = MISSIONS[mi];
        const ta = h('textarea', { placeholder: '여기에 AI에게 보낼 질문을 써 보세요…', style: { minHeight: '120px' } }), res = h('div');
        const chips = h('div.pill-tabs', MISSIONS.map((x, i) => h('button' + (i === mi ? '.on' : ''), { onclick: () => { mi = i; draw(); } }, '미션 ' + (i + 1))));
        const check = h('button.btn.ai', { onclick: () => {
          const t = ta.value.trim(); if (t.length < 5) { Eco.ui.toast('질문을 먼저 써 주세요'); return; }
          const r = CHECKS.map(c => ({ n: c[0], d: c[1], ok: c[2](t) })); const stars = r.filter(x => x.ok).length; res.innerHTML = '';
          res.append(h('div', { style: { fontSize: '1.8rem' } }, '⭐'.repeat(stars) + '☆'.repeat(6 - stars)), r.map(x => h('div.step' + (x.ok ? '.on' : ''), h('span', x.ok ? '✅' : '⬜'), h('span', h('b', x.n + ': '), x.d))));
          const miss = r.filter(x => !x.ok); if (miss.length) res.append(h('div.note.blue', '💡 더 좋은 질문을 만들려면: ' + miss.slice(0, 3).map(x => x.n).join(', ') + ' 을(를) 덧붙여 보세요.'));
          res.append(h('div.row', h('button.btn.alt.sm', { onclick: () => Eco.copy(t) }, '📋 내 프롬프트 복사'), h('a.btn.sm', { href: 'https://wrtn.ai/', target: '_blank', rel: 'noopener' }, '뤼튼에서 해 보기 ↗'), h('a.btn.sm', { href: 'https://gemini.google.com', target: '_blank', rel: 'noopener' }, '제미나이에서 해 보기 ↗')), h('div.note', '⚠️ AI의 답은 사실인지 교과서·도감·선생님과 꼭 확인해요!'));
          const best = S.prompts[m.id] || 0; if (stars > best) { S.prompts[m.id] = stars; Eco.store.save(); }
          if (stars >= 5) { Eco.ui.confetti(40); Eco.ui.sfx('win'); } else Eco.ui.sfx('ok');
          Eco.gameDone('prompt', Object.values(S.prompts).reduce((a, b) => a + b, 0), stars >= 4 ? 20 : stars >= 2 ? 8 : 0, '프롬프트 연구소');
        } }, '🔬 프롬프트 분석하기');
        const example = h('div.note', '예시(별 6개): “너는 친절한 숲 해설사야. 초등학교 4학년이 이해할 수 있도록 비닐봉투를 씌운 나뭇잎에 물방울이 맺히는 이유를 3문장으로 쉽게 설명하고, 그 근거를 확인할 방법도 알려 줘.”');
        box.append(chips, h('div.mission-banner', h('b', '🎯 미션: ' + m.t + ' — '), m.goal, S.prompts[m.id] ? h('span.chip.sun', { style: { marginLeft: '8px' } }, '최고 ⭐' + S.prompts[m.id]) : null), h('div.note.blue', '좋은 프롬프트 6요소: 역할 · 상황/대상 · 구체적 질문 · 형식 · 조건 · 검증 요청'), ta, h('div.row', { style: { margin: '8px 0' } }, check), res, h('details', h('summary', '💡 예시 보기'), example));
      };
      draw(); return box;
    } });
})(window.Eco);
