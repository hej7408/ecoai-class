/* 내 탐험 여권: 도장·배지·기록·설정 + 배지 판정 */
(function (Eco) {
  const { h } = Eco.ui;
  const cntArea = (S, a) => Eco.progsOf(a).filter(p => S.quests[p.id] && S.quests[p.id].done).length;
  const cntSeason = (S, s) => Eco.PROGRAMS.filter(p => p.season.includes(s) && S.quests[p.id] && S.quests[p.id].done).length;
  const doneAll = S => Object.values(S.quests).filter(q => q.done).length;
  const BADGES = [
    { id: 'first', ic: '🌱', n: '첫 발걸음', d: '첫 프로그램 완료', t: S => doneAll(S) >= 1 },
    { id: 'forest10', ic: '🌲', n: '숲속 탐험가', d: '숲 10개 완료', t: S => cntArea(S, 'forest') >= 10 },
    { id: 'wood5', ic: '🪵', n: '목공 꿈나무', d: '놀 5개 완료', t: S => cntArea(S, 'wood') >= 5 },
    { id: 'wood13', ic: '🛠️', n: '목공 달인', d: '놀 13개 완료', t: S => cntArea(S, 'wood') >= 13 },
    { id: 'nature8', ic: '🍃', n: '자연물 놀이꾼', d: '자 8개 완료', t: S => cntArea(S, 'nature') >= 8 },
    { id: 'all', ic: '🏆', n: '숲놀자 마스터', d: '모든 프로그램 완료', t: S => doneAll(S) >= Eco.PROGRAMS.length },
    { id: 'spring', ic: '🌸', n: '봄의 요정', d: '봄 프로그램 5개', t: S => cntSeason(S, '봄') >= 5 },
    { id: 'summer', ic: '🌞', n: '여름의 탐험가', d: '여름 프로그램 5개', t: S => cntSeason(S, '여름') >= 5 },
    { id: 'autumn', ic: '🍁', n: '가을의 수집가', d: '가을 프로그램 4개', t: S => cntSeason(S, '가을') >= 4 },
    { id: 'winter', ic: '⛄', n: '겨울의 지킴이', d: '겨울 프로그램 2개', t: S => cntSeason(S, '겨울') >= 2 },
    { id: 'quiz', ic: '🎯', n: '퀴즈 천재', d: '퀘스트 퀴즈 만점 5회', t: S => Object.values(S.quests).filter(q => q.quiz && q.quiz.total && q.quiz.right === q.quiz.total).length >= 5 },
    { id: 'ai3', ic: '🤖', n: 'AI 탐험가', d: 'AIplay 3개 완료', t: S => Object.values(S.aiplay).filter(x => x.done).length >= 3 },
    { id: 'ai10', ic: '🧠', n: 'AIplay 마스터', d: 'AIplay 10개 완료', t: S => Object.values(S.aiplay).filter(x => x.done).length >= 10 },
    { id: 'game5', ic: '🎮', n: '놀이터 단골', d: '게임 5종 플레이', t: S => Object.keys(S.games).length >= 5 },
    { id: 'game10', ic: '🕹️', n: '놀이터 정복', d: '게임 10종 플레이', t: S => Object.keys(S.games).length >= 10 },
    { id: 'streak3', ic: '🔥', n: '3일 연속 출석', d: '3일 연속 탐험', t: S => S.streak.best >= 3 },
    { id: 'streak7', ic: '☄️', n: '7일 연속 출석', d: '7일 연속 탐험', t: S => S.streak.best >= 7 },
    { id: 'meta', ic: '🧊', n: '메타버스 정착민', d: '에코크래프트 숲 복원', t: S => !!S.meta.ecDone },
    { id: 'hope', ic: '💌', n: '희망 나무지기', d: '희망 잎 10장', t: S => S.tree.leaves.length >= 10 },
    { id: 'carbon', ic: '📅', n: '탄소중립 실천가', d: '탄소중립 20회 실천', t: S => Object.values(S.carbon).reduce((a, l) => a + l.length, 0) >= 20 },
    { id: 'prompt', ic: '🧪', n: '프롬프트 장인', d: '프롬프트 별 6개', t: S => Object.values(S.prompts).some(v => v >= 6) },
    { id: 'vibe', ic: '🪄', n: '바이브 코더', d: '바이브 숲 미션 성공', t: S => Object.keys(S.meta).some(k => /^vm\d/.test(k)) },
    { id: 'story', ic: '🐢', n: 'ONE CHANCE 수호자', d: '스토리 4개 완료', t: S => Object.keys(S.stories).length >= 4 },
    { id: 'visit5', ic: '📌', n: '숲체험 탐방가', d: '숲체험 장소 5곳 다녀오기', t: S => Object.keys(S.meta.visits || {}).length >= 5 },
    { id: 'visit15', ic: '🧭', n: '경기도 숲 여행가', d: '숲체험 장소 15곳 다녀오기', t: S => Object.keys(S.meta.visits || {}).length >= 15 },
    { id: 'lvl4', ic: '🌳', n: '어린나무 레벨', d: 'Lv.4 달성', t: S => Eco.store.levelInfo(S.xp).level >= 4 },
    { id: 'lvl7', ic: '🌏', n: '지구지킴이', d: 'Lv.7 달성', t: S => Eco.store.levelInfo(S.xp).level >= 7 }
  ];
  Eco.BADGES = BADGES;
  Eco.checkBadges = function () {
    const S = Eco.store.get(); let n = 0;
    BADGES.forEach(b => { if (!S.badges[b.id]) { let ok = false; try { ok = b.t(S); } catch (e) { } if (ok) { S.badges[b.id] = Date.now(); n++; Eco.ui.toast('🏅 새 배지: ' + b.ic + ' ' + b.n, 'badge'); setTimeout(() => { Eco.ui.confetti(50); Eco.ui.sfx('level'); }, 200); } } });
    if (n) Eco.store.save();
  };

  Eco.route('/passport', function () {
    const S = Eco.store.get(), L = Eco.store.levelInfo();
    const stamps = area => h('div', h('h3', Eco.AREAS[area].icon + ' ' + Eco.AREAS[area].ch + ' · ' + Eco.AREAS[area].name), h('div.stamp-grid', Eco.progsOf(area).map(p => { const d = Eco.store.questDone(p.id); return h('a.stampcell' + (d ? '.got' : ''), { href: '#/quest/' + p.id, title: p.name, style: { textDecoration: 'none', color: 'inherit' } }, h('div', p.emoji, h('small', p.code))); })));
    const stu = Eco.session && Eco.session.role === 'student'; const msgs = stu ? Eco.auth.comments(Eco.session.code, Eco.session.no) : [];
    const notes = Eco.PROGRAMS.filter(p => { const q = S.quests[p.id]; return q && q.notes && Object.values(q.notes).some(v => v && v.trim()); });
    const file = h('input', { type: 'file', accept: '.json,application/json', class: 'hidden', onchange: e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { if (Eco.store.importData(JSON.parse(r.result))) { Eco.ui.toast('불러왔어요!'); location.reload(); } else Eco.ui.toast('올바른 기록 파일이 아니에요.'); } catch (er) { Eco.ui.toast('파일을 읽지 못했어요.'); } }; r.readAsText(f); } });
    const next = L.next ? (L.next - S.xp) + ' XP 더 모으면 ' + Eco.LEVELS[L.idx + 1].icon + ' ' + Eco.LEVELS[L.idx + 1].name : '최고 레벨!';
    return h('div.fade-in', h('div.hero', { style: { background: 'linear-gradient(135deg,#a56a3a,#e0861f)' } },
      h('div.row', h('div', { style: { fontSize: '4rem' } }, S.avatar), h('div', h('h1', (S.name || '이름 없는 탐험가') + '의 탐험 여권'), h('p', L.icon + ' Lv.' + L.level + ' ' + L.name + ' · ' + S.xp + ' XP'), Eco.session && Eco.session.role === 'student' ? h('p.small', '🏫 ' + (Eco.session.cls || '') + ' · ' + Eco.session.no + '번') : null)),
      h('div.xpbar', { style: { height: '14px' } }, h('span', { style: { width: L.pct + '%' } })), h('div.small', next), h('div.row', { style: { marginTop: '10px' } }, h('button.btn.sun', { onclick: Eco.openProfile }, '✏️ 이름·캐릭터 바꾸기'), h('button.btn.alt', { onclick: cert }, '📜 탐험대원 인증서'))),
      msgs.length ? h('div', h('div.section-title', h('h2', '💌 선생님 메시지')), h('div.card', msgs.slice(0, 10).map(c => h('div.note', h('b', (c.sticker || '🌟') + ' ' + (c.from || '선생님') + ' · ' + new Date(c.t).toLocaleDateString('ko-KR') + ' — '), c.text, c.xp ? h('span.chip.sun', { style: { marginLeft: '6px' } }, '+' + c.xp + 'XP') : null)))) : null,
      h('div.section-title', h('h2', '🔖 퀘스트 도장 (' + doneAll(S) + '/' + Eco.PROGRAMS.length + ')')), h('div.card', ['forest', 'wood', 'nature'].map(stamps)),
      h('div.section-title', h('h2', '🏅 배지 (' + Object.keys(S.badges).length + '/' + BADGES.length + ')')),
      h('div.grid.g4', BADGES.map(b => h('div.badge' + (S.badges[b.id] ? '.got' : ''), h('div.bi', b.ic), h('b', b.n), h('small', b.d)))),
      h('div.section-title', h('h2', '📝 내 생각 노트')), notes.length ? h('div.grid.g2', notes.map(p => h('div.card', h('b', p.emoji + ' ' + p.name), Object.entries(S.quests[p.id].notes).filter(([, v]) => v && v.trim()).map(([, v]) => h('p', '💭 ' + v)), h('a.small', { href: '#/quest/' + p.id }, '열어서 고치기')))) : h('div.note', '퀘스트의 ‘생각할 거리’에 적은 글이 여기에 모여요.'),
      S.log.length ? h('div', h('div.section-title', h('h2', '🕘 최근 활동')), h('div.card', S.log.slice(0, 12).map(l => h('div.small', new Date(l.t).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' · ' + l.m)))) : null,
      h('div.section-title', h('h2', '⚙️ 설정·기록 관리')),
      h('div.card', h('div.row', h('label.row', h('input', { type: 'checkbox', checked: S.settings.sound, style: { width: '20px' }, onchange: e => { S.settings.sound = e.target.checked; Eco.store.save(); } }), '효과음 켜기'),
        h('button.btn.alt.sm', { onclick: () => { const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }); const a = h('a', { href: URL.createObjectURL(blob), download: 'ecoai-' + (S.name || '탐험가') + '-' + Eco.today() + '.json' }); document.body.append(a); a.click(); a.remove(); } }, '💾 기록 내보내기(JSON)'), h('button.btn.alt.sm', { onclick: () => file.click() }, '📂 기록 불러오기'), file,
        stu ? null : h('button.btn.berry.sm', { onclick: () => { if (confirm('정말 모든 기록을 지울까요? 되돌릴 수 없어요.')) { Eco.store.reset(); location.reload(); } } }, '🗑 기록 초기화'),
        h('button.btn.alt.sm', { onclick: Eco.logout }, '🚪 로그아웃')),
        h('p.small.muted', '기록은 이 기기의 브라우저에만 저장돼요. 학급 공용 태블릿에서는 학생별로 ‘기록 내보내기’ 파일을 만들어 두면 다음 시간에 불러올 수 있어요.')));
    function cert() {
      const d = new Date();
      Eco.ui.modal(h('div', { style: { textAlign: 'center', border: '6px double var(--g1)', borderRadius: '18px', padding: '26px', background: 'linear-gradient(#fffef2,#f1fae6)' } }, h('div', { style: { fontSize: '3rem' } }, '🌳'), h('h1', '숲속탐험대 인증서'), h('p', { style: { fontSize: '1.4rem' } }, h('b', (S.avatar || '') + ' ' + (S.name || '탐험가') + ' 대원')), h('p', 'Eco AI(에코아이) 생태환경교육 탐험에서', h('br'), '퀘스트 ' + doneAll(S) + '개 · 배지 ' + Object.keys(S.badges).length + '개 · ' + L.icon + ' ' + L.name + '(Lv.' + L.level + ')를 달성하고', h('br'), '자연과 함께하는 마음을 키웠음을 인증합니다.'), h('p.muted', d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일'), h('button.btn.no-print', { onclick: () => print() }, '🖨️ 인쇄하기')));
    }
  });
})(window.Eco);
