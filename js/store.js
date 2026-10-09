/* Eco AI 에코아이 웹앱 - 상태 저장소 (localStorage) */
window.Eco = window.Eco || {};
(function (Eco) {
  /* 세션: 탭을 닫으면 로그아웃되도록 sessionStorage 사용 (공용 태블릿 안전) */
  const LEGACY = 'ecoai.webapp.v1';       // 게스트 체험(로그인 없이) 기록
  const readSession = () => { try { return JSON.parse(sessionStorage.getItem('ecoai.session') || 'null'); } catch (e) { return null; } };
  const SESSION = readSession();
  Eco.session = SESSION;                 // {role:'student'|'teacher'|'admin'|'guest', code, no, name, id}
  const studentKey = (code, no) => 'ecoai.s.' + code + '-' + no;
  const KEY = SESSION && SESSION.role === 'student' ? studentKey(SESSION.code, SESSION.no) : LEGACY;
  Eco.studentKey = studentKey;
  const LEVELS = [
    { xp: 0, name: '씨앗', icon: '🌰' }, { xp: 100, name: '새싹', icon: '🌱' },
    { xp: 300, name: '묘목', icon: '🌿' }, { xp: 600, name: '어린나무', icon: '🌳' },
    { xp: 1000, name: '큰나무', icon: '🌲' }, { xp: 1600, name: '숲지기', icon: '🦌' },
    { xp: 2500, name: '지구지킴이', icon: '🌏' }
  ];
  const fresh = () => ({
    v: 1, name: '', avatar: '🧒', xp: 0, created: Date.now(),
    streak: { last: '', count: 0, best: 0 },
    quests: {},      // id -> {done, ts, notes:{think}, quiz:{right,total}, steps:[bool]}
    badges: {},      // id -> ts
    games: {},       // id -> {best, plays, last}
    aiplay: {},      // id -> {done, ts, note}
    tree: { leaves: [] },        // 희망트리
    carbon: {},      // 'YYYY-MM-DD' -> [action ids]
    prompts: {},     // 프롬프트 연구소 최고점
    stories: {},     // ONE CHANCE 스토리
    seasons: {},     // 계절 스탬프
    meta: {},        // 메타버스 미션
    settings: { sound: true },
    log: [],         // 최근 활동(요약)
    events: [],      // 교사용 상세 로그 [{t,k,m,xp}]
    stats: { min: {} }, // 날짜별 학습 분(분)
    identity: null   // 학생 로그인 정보 {code,no,name}
  });
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { S = null; }
  if (!S || S.v !== 1) S = fresh();
  Object.keys(fresh()).forEach(k => { if (!(k in S)) S[k] = fresh()[k]; });

  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  Eco.today = today;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 저장 불가 환경 */ }
    if (SESSION && SESSION.role === 'student' && Eco.auth && Eco.auth.afterSave) Eco.auth.afterSave(S);
  }
  /** 교사 대시보드용 요약 */
  Eco.summarize = (st) => {
    const lv = levelInfo(st.xp), pdone = Object.values(st.quests).filter(q => q.done).length;
    const mins = Object.values(st.stats && st.stats.min || {}).reduce((a, b) => a + b, 0);
    return { xp: st.xp, level: lv.level, levelName: lv.name, quests: pdone, aiplay: Object.values(st.aiplay).filter(x => x.done).length, games: Object.keys(st.games).length,
      badges: Object.keys(st.badges).length, minutes: Math.round(mins), streak: st.streak.count, best: st.streak.best, last: (st.events[0] && st.events[0].t) || st.created, avatar: st.avatar };
  };
  function logEvent(k, m, xp) { S.events.unshift({ t: Date.now(), k, m, xp: xp || 0 }); if (S.events.length > 400) S.events.length = 400; }
  function levelInfo(xp = S.xp) {
    let i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
    const cur = LEVELS[i], next = LEVELS[i + 1];
    return { idx: i, level: i + 1, name: cur.name, icon: cur.icon, cur: cur.xp, next: next ? next.xp : null,
      pct: next ? Math.round((xp - cur.xp) / (next.xp - cur.xp) * 100) : 100 };
  }
  function touchStreak() {
    const t = today();
    if (S.streak.last === t) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const ys = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
    S.streak.count = S.streak.last === ys ? S.streak.count + 1 : 1;
    S.streak.last = t;
    S.streak.best = Math.max(S.streak.best || 0, S.streak.count);
  }
  function pushLog(msg, xp) { S.log.unshift({ t: Date.now(), m: msg }); S.log = S.log.slice(0, 40); logEvent('xp', msg, xp); }

  Eco.store = {
    get: () => S,
    save, levelInfo, LEVELS,
    addXP(n, reason) {
      const before = levelInfo().idx;
      touchStreak();
      S.xp = Math.max(0, S.xp + n);
      if (reason) pushLog(reason + ' +' + n + 'XP', n);
      save();
      Eco.ui && Eco.ui.toast('+' + n + ' XP ' + (reason ? '· ' + reason : ''), 'xp');
      const after = levelInfo().idx;
      if (after > before) {
        const L = levelInfo();
        Eco.ui && (Eco.ui.confetti(), Eco.ui.toast('🎉 레벨 업! ' + L.icon + ' ' + L.name, 'badge'), Eco.ui.sfx('level'));
      }
      Eco.checkBadges && Eco.checkBadges();
      Eco.ui && Eco.ui.refreshHud();
    },
    reset() { const id = S.identity, nm = S.name; S = fresh(); S.identity = id; if (id) S.name = nm; save(); },
    importData(obj) { if (obj && obj.v === 1) { const id = S.identity, nm = S.name; S = obj; Object.keys(fresh()).forEach(k => { if (!(k in S)) S[k] = fresh()[k]; }); if (id) { S.identity = id; S.name = nm; } save(); return true; } return false; },
    quest(id) { return S.quests[id] || null; },
    questDone(id) { return !!(S.quests[id] && S.quests[id].done); },
    patchQuest(id, patch) { S.quests[id] = Object.assign(S.quests[id] || {}, patch); save(); },
    patchGame(id, score) {
      const g = S.games[id] || { best: 0, plays: 0 };
      g.plays++; g.last = score; const isBest = score > g.best; if (isBest) g.best = score;
      S.games[id] = g; logEvent('game', (Eco.games && Eco.games[id] ? Eco.games[id].name : id) + ' · 점수 ' + score); save(); Eco.checkBadges && Eco.checkBadges(); return isBest;
    },
    logEvent(k, m, xp) { logEvent(k, m, xp); save(); },
    key: KEY
  };
  Eco.LEVELS = LEVELS;
})(window.Eco);
