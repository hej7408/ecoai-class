/* 앱 시작: 내비게이션 · 라우터 · 로그인 가드 */
(function (Eco) {
  const { h, $ } = Eco.ui;
  const role = () => (Eco.session && Eco.session.role) || null;
  const BASE = [['#/home', '🏠', '홈', ['/home']], ['#/aidt', '🌲', '에코아이 교과서', ['/aidt', '/quest', '/read']], ['#/map', '🗺️', '숲체험 지도', ['/map']], ['#/aiplay', '🤖', 'AIplay 가이드', ['/aiplay']], ['#/arcade', '🎮', '에코 놀이터', ['/arcade', '/game']], ['#/meta', '🧊', '메타버스', ['/meta']], ['#/passport', '🏅', '내 여권', ['/passport']], ['#/about', '📘', '소개', ['/about']]];
  const SHORT = { '#/home': '홈', '#/aidt': '교과서', '#/aiplay': 'AIplay', '#/arcade': '놀이터', '#/meta': '메타버스', '#/passport': '여권', '#/teacher': '교사', '#/admin': '관리' };
  const navItems = () => {
    const r = role(); if (!r) return [];
    const L = BASE.slice();
    if (r === 'teacher' || r === 'admin') L.unshift(['#/teacher', '👩‍🏫', '교사 대시보드', ['/teacher']]);
    if (r === 'admin') L.unshift(['#/admin', '🛠️', '관리자', ['/admin']]);
    return L;
  };

  function drawNav(path) {
    const act = n => n[3].some(p => path === p || path.startsWith(p + '/'));
    const nav = $('#nav'), tab = $('#tabbar'); nav.innerHTML = ''; tab.innerHTML = '';
    const items = navItems();
    items.forEach(n => nav.append(h('a' + (act(n) ? '.on' : ''), { href: n[0] }, n[1] + ' ' + n[2])));
    const small = role() === 'teacher' || role() === 'admin' ? items.filter(n => ['#/admin', '#/teacher', '#/home', '#/aidt', '#/arcade', '#/passport'].includes(n[0])) : items.filter(n => SHORT[n[0]]);
    small.slice(0, 6).forEach(n => tab.append(h('a' + (act(n) ? '.on' : ''), { href: n[0] }, h('span', n[1]), SHORT[n[0]])));
    tab.classList.toggle('hidden', !items.length);
  }

  Eco.render = function () {
    Eco.cleanups.splice(0).forEach(f => { try { f(); } catch (e) { } });
    const path = (location.hash.slice(1) || '/home').split('?')[0];
    const view = $('#view'); view.innerHTML = '';
    if (!role() && path !== '/login') { location.hash = '#/login'; return; }
    if (role() && (path === '/home' || path === '/') && (role() === 'teacher' || role() === 'admin') && !sessionStorage.getItem('ecoai.landed')) { try { sessionStorage.setItem('ecoai.landed', '1'); } catch (e) { } location.hash = role() === 'admin' ? '#/admin' : '#/teacher'; return; }
    const r = Eco.routes.find(x => x.re.test(path));
    drawNav(path);
    try {
      if (!r) { view.append(h('div.card', h('h2', '길을 잃었어요 🧭'), h('p', '없는 페이지예요.'), h('a.btn', { href: '#/home' }, '홈으로'))); return; }
      const args = r.re.exec(path).slice(1).map(decodeURIComponent);
      const node = r.fn(...args); if (node) view.append(node);
    } catch (err) {
      console.error(err); view.append(h('div.card', h('h2', '앗, 문제가 생겼어요 😢'), h('pre', { style: { whiteSpace: 'pre-wrap' } }, String(err && err.stack || err)), h('a.btn', { href: '#/home' }, '홈으로')));
    }
    window.scrollTo(0, 0); view.focus({ preventScroll: true }); Eco.ui.refreshHud();
  };

  /* 교사 보너스 XP·메시지 반영 (학생 로그인 시) */
  Eco.applyTeacherMessages = function () {
    const s = Eco.session; if (!s || s.role !== 'student') return;
    const S = Eco.store.get(); const list = Eco.auth.comments(s.code, s.no); let changed = false;
    list.forEach(c => { const k = 'aw' + c.t; if (!S.meta[k]) { S.meta[k] = 1; changed = true; Eco.store.logEvent('teacher', '선생님 메시지: ' + c.text.slice(0, 40), c.xp || 0); if (c.xp > 0) Eco.store.addXP(c.xp, '선생님 보너스'); } });
    if (changed) Eco.store.save();
  };

  window.addEventListener('hashchange', Eco.render);
  document.getElementById('hud-btn').addEventListener('click', () => { const r = role(); if (r === 'teacher') Eco.go('#/teacher'); else if (r === 'admin') Eco.go('#/admin'); else Eco.go('#/passport'); });
  document.getElementById('logout-btn').addEventListener('click', () => { if (confirm('로그아웃할까요?')) Eco.logout(); });

  const start = () => {
    const S = Eco.store.get();
    Eco.applyTeacherMessages();
    Eco.render(); Eco.checkBadges && Eco.checkBadges();
    if (role() === 'guest' && !S.name && !sessionStorage.getItem('ecoai.welcomed')) { try { sessionStorage.setItem('ecoai.welcomed', '1'); } catch (e) { } setTimeout(Eco.openProfile, 600); }
    // 클라우드: 교사 메시지 가져오기
    if (Eco.cloud && Eco.cloud.enabled && role() === 'student') {
      Eco.cloud.fetchComments(Eco.session.code, Eco.session.no).then(list => { if (list && list.length) { const R = Eco.auth.R(), k = Eco.session.code + '-' + Eco.session.no; const have = new Set((R.comments[k] || []).map(c => c.t)); const add = list.filter(c => !have.has(c.t)); if (add.length) { R.comments[k] = [...add, ...(R.comments[k] || [])]; Eco.auth.saveR(); Eco.applyTeacherMessages(); Eco.render(); } } });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  // 출석 보너스 (학생·게스트)
  (function () { const S = Eco.store.get(); if ((role() === 'student' || role() === 'guest') && S.streak.last !== Eco.today()) { Eco.dailyOnce('visit', 5, '오늘의 출석'); } })();

  // 학습 시간 기록: 화면이 보이고 최근 2분 이내 조작이 있을 때 30초마다 0.5분 적립
  let lastAct = Date.now(); ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(t => window.addEventListener(t, () => { lastAct = Date.now(); }, { passive: true }));
  setInterval(() => {
    if (role() !== 'student' || document.visibilityState !== 'visible' || Date.now() - lastAct > 120000) return;
    const S = Eco.store.get(), d = Eco.today(); S.stats = S.stats || { min: {} }; S.stats.min[d] = (S.stats.min[d] || 0) + .5; Eco.store.save();
  }, 30000);
})(window.Eco);
