/* 에코 메타버스: 에코크래프트(3D) + 마인크래프트 에듀케이션 · 로블록스 · 젭 · 딜라이트엑스 · 헬로메이플 체험 가이드 */
(function (Eco) {
  const { h } = Eco.ui;
  const ext = (t, u) => h('a', { href: u, target: '_blank', rel: 'noopener' }, '🔗 ' + t);

  const MISSIONS = [
    { id: 'mm1', ic: '⛏️', t: '마인크래프트로 우리 학교 숲 재현하기', d: '숲·놀·자 체험에서 만난 학교 숲을 마인크래프트 월드에 블록으로 만들고, 쓰레기 없는 숲 규칙 표지판을 세워요.', steps: ['학교 숲에서 찍은 사진·스케치를 보며 지도를 그린다.', '마인크래프트 에듀케이션에서 평평한 월드를 만들고 나무·길·연못을 배치한다.', '‘숲에게 보내는 편지’ 표지판(희망트리)을 세운다.', '완성 후 스크린샷을 찍어 학습카페에 공유한다.'] },
    { id: 'mm2', ic: '🟥', t: '로블록스 환경 게임 체험 후 소감 쓰기', d: '교사가 안내한 환경·재활용 체험을 플레이하고, 현실에서 실천할 한 가지를 정해요. (계정·연령·채팅 설정은 교사가 먼저 확인)', steps: ['교사가 안내한 환경·재활용 체험을 20분 이내로 플레이한다.', '게임 속 쓰레기 줍기·분리배출이 현실과 어떻게 같고 다른지 쓴다.', '현실에서 실천할 한 가지를 정해 e캘린더에 기록한다.'] },
    { id: 'mm3', ic: '🚪', t: '젭퀴즈·딜라이트엑스로 나만의 생태 월드 만들기', d: '메타버스 도구로 방탈출 퀴즈나 VR 에코팜을 만들어 친구를 초대해요.', steps: ['AIplay 가이드에서 젭퀴즈 또는 딜라이트엑스 프로젝트를 고른다.', '디지털교과서에서 배운 개념으로 문제·장면을 만든다.', '친구에게 링크를 공유하고 피드백을 받아 고친다.'] }
  ];

  const PLATFORMS = [
    { ic: '⛏️', name: '마인크래프트 에듀케이션', color: 'meta', desc: '블록 세상에서 생태계·기후 문제를 탐구하는 교육용 마인크래프트예요.',
      facts: ['WWF와 협력한 콘텐츠 팩: 생태계·보전·생물다양성을 다루는 몰입형 월드와 표준 연계 수업이 제공돼요.', 'Climate Futures: UN 지속가능발전목표(SDGs)에 맞춘 기후변화 수업·월드 모음이에요.', 'Crown Estate × Microsoft: ‘Conservation Quest at Windsor Great Park’(생태 보전 퀘스트 4개)와 ‘Offshore Wind Power Challenge’(해상풍력 계획) 월드가 있어요. (영국 사례)'],
      tips: ['학교 Microsoft 365 Education 계정·라이선스 필요 여부를 먼저 확인해요.', '기본 월드에서 ‘학교 숲 재현’ 같은 열린 미션으로도 충분히 수업할 수 있어요.'],
      links: [['마인크래프트 에듀케이션', 'https://education.minecraft.net'], ['Crown Estate 마인크래프트 월드 소개', 'https://www.thecrownestate.co.uk/minecraftedu']] },
    { ic: '🟥', name: '로블록스 (Roblox)', color: 'meta', desc: '친구와 함께 만든 세계를 돌아다니며 환경 미션을 해결하는 플랫폼이에요.',
      facts: ['Salvage Safari: Niagara Cares × Games for Change × Filament Games가 만든 재활용 게임으로, 해변 쓰레기를 모아 분리하며 순환경제를 배워요.', '기후행동 1.5°(가이드북): 로블록스 기반 환경보호 게임으로 가상공간에서 쓰레기를 주우면 포인트를 얻고 미션을 해결해요.', 'Digital Voices of the Future(영국 컴브리아대): 어린이가 로블록스에서 나무 심기가 숲 풍경에 미치는 영향을 보며 환경에 관심을 갖는 연구 프로젝트예요.'],
      tips: ['연령 등급·친구 요청·채팅·결제 설정은 교사/보호자가 먼저 점검해요.', '플레이 시간을 정하고(예: 20분), 반드시 현실 실천(e캘린더)과 연결해요.', '게임을 ‘만드는’ 활동(Roblox Studio)은 중·고학년 동아리에 알맞아요.'],
      links: [['로블록스', 'https://www.roblox.com'], ['Games for Change', 'https://gamesforchange.org'], ['Salvage Safari 보도자료(PDF)', 'https://www.niagarawater.com/wp-content/uploads/2025/04/Niagara-x-Filament-Games-FINAL-Press-Release_111924.pdf'], ['컴브리아대 로블록스 나무 심기 소식', 'https://news.cumbria.ac.uk/news/researchers-seek-to-ignite-childrens-green-passion-through-online-gaming']] },
    { ic: '🚪', name: '젭(ZEP) · 젭퀴즈', color: 'meta', desc: '2D 메타버스 공간. 문제만 입력하면 방탈출 스페이스가 만들어져요.', facts: ['가이드북 AIplay 4번: 5.22 생물종 다양성 보존의 날 방탈출 게임 만들기'], tips: ['AIplay 가이드 → 젭퀴즈 프로젝트에서 퀴즈 메이커로 문제를 먼저 만들어 봐요.'], links: [['젭퀴즈', 'https://quiz.zep.us/']], inapp: '#/aiplay/zepquiz' },
    { ic: '🥽', name: '딜라이트엑스 (옛 이름 코스페이시스)', color: 'meta', desc: '3D 공간·VR·AR 콘텐츠를 만들고 코블록스로 움직이게 해요. (CoSpaces Edu가 Delightex로 이름이 바뀌었어요.)', facts: ['가이드북 AIplay 2번: 머지큐브로 나만의 VR 에코팜 만들기'], tips: ['교사·학생 계정 라이선스는 별도 구매가 필요해요.'], links: [['딜라이트엑스(Delightex)', 'https://www.delightex.com']], inapp: '#/aiplay/cospaces' },
    { ic: '🐧', name: '헬로메이플', color: 'meta', desc: '블록코딩으로 게임을 만드는 플랫폼. 환경 게임을 체험하고 리메이크해요.', facts: ['가이드북 AIplay 6번: ‘바다를 구해줘’ 조건문 게임'], tips: ['웹에서는 ‘바다를 구해줘’ 미니게임으로 원리를 먼저 체험해요.'], links: [['헬로메이플 공식 사이트', 'https://www.hellomaple.org'], ['헬로메이플 생태환경 게임 월드', 'https://maplestoryworlds.nexon.com/ko/play/f9dc4d29d3ed419ab0ecc86153872093/']], inapp: '#/game/ocean' }
  ];

  Eco.route('/meta', function () {
    const S = Eco.store.get();
    return h('div.fade-in',
      h('div.hero', { style: { background: 'linear-gradient(135deg,#5438a8,#4aa8e8)' } }, h('h1', '🧊 에코 메타버스'), h('p', '로블록스·마인크래프트 같은 가상 세계에서 직접 해 보며 배우는 생태환경교육! 이 앱 안에서 바로 즐기는 3D 게임과, 학교 수업에서 활용할 수 있는 체험 가이드를 모았어요.')),
      h('div.section-title', h('h2', '🎮 바로 플레이')),
      h('div.grid.g2', h('a.tile.main', { href: '#/meta/ecocraft', style: { borderColor: 'var(--meta)' } }, h('span.chip.meta.tag', '3D · 직접 제작'), h('div.ic', '🧊'), h('h3', '에코크래프트'), h('p', '네모난 3D 세상에서 쓰레기를 줍고, 풀과 나무를 키우고, 연못을 정화하고, 동물 친구를 불러 숲을 되살려요. 마인크래프트·로블록스처럼 탐험하고 만드는 생태 복원 게임!'), h('small.muted', S.meta.ecDone ? '✅ 숲 복원 완료!' : '미션 7개를 달성해 보세요')),
        h('a.tile.main', { href: '#/game/forestworld', style: { borderColor: 'var(--meta)' } }, h('span.chip.meta.tag', '3D · 오픈월드 어드벤처'), h('div.ic', '🌲'), h('h3', '숲속탐험대 월드'), h('p', '열린 숲을 자유롭게 돌아다니며 NPC 미션(분리배출·나무 심기·연못 청소·동물 도감)을 해결해 숲을 되살려요!')),
        h('a.tile', { href: '#/game/vibe' }, h('span.chip.meta.tag', '바이브코딩'), h('div.ic', '🪄'), h('h3', '바이브 숲 스튜디오'), h('p', '말로 설명하면 숲 장면이 그려져요. AI 시대의 ‘말로 코딩하기’를 체험!'))),
      h('div.section-title', h('h2', '🌐 메타버스 플랫폼 체험 가이드'), h('span.muted.small', '직접 해 보는 외부 서비스 — 학교 정책과 계정 조건을 먼저 확인해요')),
      h('div.grid.g2', PLATFORMS.map(p => h('div.card', h('div.row.spread', h('h3', p.ic + ' ' + p.name), h('span.chip.meta', '체험 가이드')), h('p', p.desc), h('ul', p.facts.map(f => h('li', f))), p.tips.map(t => h('div.note.purple', '💡 ' + t)), h('div.link-list', p.links.map(l => ext(l[0], l[1])), p.inapp ? h('a', { href: p.inapp }, '➡ 이 앱의 연계 활동 열기') : null)))),
      h('div.note', 'ℹ️ 위 외부 콘텐츠 정보는 공개된 자료(검색 시점 기준)를 요약한 것이며, 서비스 내용·링크·요금은 바뀔 수 있어요. 수업 전에 직접 확인해 주세요.'),
      h('div.section-title', h('h2', '🧭 메타버스 수업 미션 3종'), h('span.chip.sun', '완료 시 +30XP')),
      h('div.grid.g3', MISSIONS.map(m => missionCard(m))),
      h('div.card', { style: { marginTop: '16px' } }, h('h3', '🛡️ 메타버스·게임 활용 약속'), h('ul', h('li', '플레이 시간을 정하고, 체험 뒤에는 현실 실천(e캘린더·학습카페)으로 연결해요.'), h('li', '이름·학교·사진 같은 개인정보는 게임 속에 쓰지 않아요.'), h('li', '연령 정책과 채팅 기능을 교사가 먼저 확인하고, 필요하면 채팅을 끄고 해요.'), h('li', '가상 세계의 쓰레기 줍기가 끝이 아니에요. 진짜 숲과 바다를 지키는 일이 목표예요!'))));
  });

  function missionCard(m) {
    const S = Eco.store.get(); const rec = S.meta['mission_' + m.id] || {};
    const card = h('div.card'); const draw = () => {
      card.innerHTML = ''; const r = S.meta['mission_' + m.id] || {};
      const note = h('textarea', { placeholder: '한 일·느낀 점·작품 링크를 적어 보세요…' }); note.value = r.note || ''; note.addEventListener('input', () => { S.meta['mission_' + m.id] = Object.assign(S.meta['mission_' + m.id] || {}, { note: note.value }); Eco.store.save(); });
      card.append(h('div', { style: { fontSize: '2.2rem' } }, m.ic), h('h3', m.t), h('p.small', m.d), h('ol.ol.purple', m.steps.map(s => h('li', s))), note,
        r.done ? h('div.note', '✅ 완료!') : h('button.btn.meta', { onclick: () => { S.meta['mission_' + m.id] = Object.assign(S.meta['mission_' + m.id] || {}, { done: true, note: note.value, ts: Date.now() }); Eco.store.save(); Eco.store.addXP(30, '메타버스 미션'); Eco.ui.confetti(); draw(); } }, '🏅 미션 완료 (+30XP)'));
    }; draw(); return card;
  }

  Eco.route('/meta/ecocraft', function () {
    return h('div.fade-in', h('a.back', { href: '#/meta' }, '← 에코 메타버스'), h('h1', '🧊 에코크래프트'), h('p.muted', '시든 땅을 다시 숲으로! 쓰레기 줍기 → 풀 키우기 → 나무 심기 → 꽃·새집 → 동물 친구까지 생태계가 살아나요.'), Eco.ecocraft());
  });
})(window.Eco);
