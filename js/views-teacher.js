/* 교사 대시보드: 학급 현황 · 진도 매트릭스 · 활동 로그 · 학급 관리 · 학생 상세 */
(function (Eco) {
  const { h } = Eco.ui;
  const A = Eco.auth;
  const ago = t => { if (!t) return '기록 없음'; const m = Math.floor((Date.now() - t) / 60000); if (m < 1) return '방금'; if (m < 60) return m + '분 전'; const hh = Math.floor(m / 60); if (hh < 24) return hh + '시간 전'; const d = Math.floor(hh / 24); return d < 30 ? d + '일 전' : new Date(t).toLocaleDateString('ko-KR'); };
  const fdt = t => new Date(t).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const isToday = t => t && new Date(t).toDateString() === new Date().toDateString();
  const need = roles => !roles.includes(A.role());
  const TOTAL = () => Eco.PROGRAMS.length;
  const deny = () => h('div.card', h('h2', '🔒 교사 로그인이 필요해요'), h('p', '교사 또는 관리자 계정으로 로그인해 주세요.'), h('a.btn', { href: '#/login' }, '로그인 화면으로'));

  /** 학생 한 명의 요약(레지스트리 요약 → 없으면 상태에서 계산) */
  function sum(s) { if (s.summary) return s.summary; const st = A.getState(s.code, s.no); return st ? Eco.summarize(st) : null; }
  function classRows(code) { return A.listStudents(code).map(s => ({ s, m: sum(s) })); }
  function teacherName(id) { const t = A.R().teachers[id]; return t ? t.name : (id || '-'); }
  const cloudBar = (code, onDone) => (Eco.cloud && Eco.cloud.enabled) ? h('button.btn.alt.sm', { onclick: async e => { e.target.disabled = true; const n = await Eco.cloud.pullClass(code); e.target.disabled = false; Eco.ui.toast(n == null ? '가져오기 실패: ' + (Eco.cloud.lastError || '') : '☁️ ' + n + '명의 기록을 가져왔어요'); onDone && onDone(); } }, '☁️ 클라우드에서 기록 가져오기') : null;

  /* ───────── 교사 홈 ───────── */
  Eco.route('/teacher', function () {
    if (need(['teacher', 'admin'])) return deny();
    const ses = Eco.session, isAdmin = A.role() === 'admin';
    const classes = A.listClasses(isAdmin ? null : ses.id);
    const g = h('div.grid.g3');
    classes.forEach(c => { const rows = classRows(c.code), n = rows.length, act = rows.filter(r => r.m && isToday(r.m.last)).length, avgQ = n ? Math.round(rows.reduce((a, r) => a + (r.m ? r.m.quests : 0), 0) / n / TOTAL() * 100) : 0, avgX = n ? Math.round(rows.reduce((a, r) => a + (r.m ? r.m.xp : 0), 0) / n) : 0;
      g.append(h('a.tile.main', { href: '#/teacher/class/' + c.code }, h('div.row.spread', h('h3', '🏫 ' + c.name), h('span.chip.sun', c.code)), h('div.row', h('span.chip', '학생 ' + n + '명'), h('span.chip.forest', '오늘 접속 ' + act + '명')), h('div.progress', h('span', { style: { width: avgQ + '%' } })), h('small.muted', '평균 퀘스트 완료율 ' + avgQ + '% · 평균 XP ' + avgX), isAdmin ? h('small.muted', '담당: ' + teacherName(c.teacherId)) : null)); });
    const grade = h('input', { type: 'number', min: 1, max: 6, placeholder: '학년', style: { width: '90px' } }), cls = h('input', { type: 'number', min: 1, max: 30, placeholder: '반', style: { width: '90px' } }), nm = h('input', { type: 'text', placeholder: '학급 이름(비우면 자동)', style: { flex: 1, minWidth: '160px' } });
    const create = h('button.btn', { onclick: () => { if (!grade.value || !cls.value) { Eco.ui.toast('학년과 반을 입력해 주세요'); return; } const code = A.createClass({ grade: grade.value, cls: cls.value, name: nm.value.trim(), teacherId: isAdmin ? '' : ses.id }); Eco.ui.toast('학급을 만들었어요! 코드: ' + code); Eco.go('#/teacher/class/' + code); } }, '➕ 학급 만들기');
    const pwBox = isAdmin || (Eco.cloud && Eco.cloud.enabled) ? null : h('button.btn.alt.sm', { onclick: pwModal }, '🔑 비밀번호 변경');
    function pwModal() { const o = h('input', { type: 'password', placeholder: '현재 비밀번호' }), n = h('input', { type: 'password', placeholder: '새 비밀번호(4자 이상)' }); const m = Eco.ui.modal(h('div', h('h2', '🔑 비밀번호 변경'), h('div.grid', { style: { gap: '8px' } }, o, n, h('button.btn', { onclick: async () => { if (n.value.length < 4) { Eco.ui.toast('4자 이상이에요'); return; } if (await A.changeTeacherPw(ses.id, o.value, n.value)) { Eco.ui.toast('바꿨어요'); m.close(); } else Eco.ui.toast('현재 비밀번호가 달라요'); } }, '변경')))); }
    return h('div.fade-in', h('div.hero', { style: { background: 'linear-gradient(135deg,#2c6e8f,#2f8f4e)' } }, h('h1', '👩‍🏫 교사 대시보드'), h('p', (ses.name || '') + ' 선생님, 학생들의 탐험 기록을 확인해 보세요.'), h('div.row', isAdmin ? h('a.btn.sun', { href: '#/admin' }, '🛠️ 관리자 화면') : null, pwBox, h('button.btn.alt', { onclick: Eco.logout }, '🚪 로그아웃'))),
      h('div.section-title', h('h2', '내 학급 (' + classes.length + ')')), classes.length ? g : h('div.note', '아직 학급이 없어요. 아래에서 학급을 만들면 학생용 ‘학급 코드’가 만들어져요.'),
      h('div.card', { style: { marginTop: '16px' } }, h('h3', '➕ 새 학급 만들기'), h('div.row', grade, cls, nm, create)),
      (Eco.cloud && Eco.cloud.enabled) ? h('div.note.blue', '☁️ Firebase 연동 켜짐 (' + Eco.cloud.status + '). 학급 화면에서 ‘클라우드에서 기록 가져오기’로 학생 기기의 기록을 모아요.') : h('div.note', '💾 로컬 모드: 학생이 이 기기에서 로그인한 기록만 보여요. 여러 기기의 기록을 모으려면 README의 ‘Firebase 연동’을 확인하세요.'));
  });

  /* ───────── 학급 상세 ───────── */
  const classTab = {}; // code -> tab
  Eco.route('/teacher/class/:code', function (code) {
    if (need(['teacher', 'admin'])) return deny();
    const c = A.getClass(code); if (!c) return h('div.card', '학급을 찾을 수 없어요.', h('a.btn', { href: '#/teacher' }, '돌아가기'));
    if (A.role() === 'teacher' && c.teacherId !== Eco.session.id) return h('div.card', '이 학급을 볼 권한이 없어요.');
    let tab = classTab[code] || 'status', sortKey = 'no', sortDir = 1, q = '', onlyAbsent = false;
    const body = h('div'); const tabs = h('div.pill-tabs');
    const draw = () => { classTab[code] = tab; tabs.innerHTML = ''; [['status', '📊 현황'], ['matrix', '🧩 진도 매트릭스'], ['log', '🕘 활동 로그'], ['manage', '⚙️ 학급 관리']].forEach(([k, t]) => tabs.append(h('button' + (k === tab ? '.on' : ''), { onclick: () => { tab = k; draw(); } }, t))); body.innerHTML = ''; body.append({ status, matrix, log, manage }[tab]()); };

    /* 현황 */
    function status() {
      const rows = classRows(code), n = rows.length, withM = rows.filter(r => r.m);
      const act = rows.filter(r => r.m && isToday(r.m.last)).length;
      const avg = f => withM.length ? Math.round(withM.reduce((a, r) => a + f(r.m), 0) / withM.length) : 0;
      const tiles = h('div.grid.g4', [['👥', n, '학생 수'], ['🟢', act, '오늘 접속'], ['🔖', avg(m => m.quests) + '/' + TOTAL(), '평균 완료 퀘스트'], ['⭐', avg(m => m.xp), '평균 XP'], ['⏱', avg(m => m.minutes) + '분', '평균 학습 시간'], ['🤖', avg(m => m.aiplay), '평균 AIplay'], ['🏅', avg(m => m.badges), '평균 배지'], ['🔥', avg(m => m.streak), '평균 연속 출석']].map(t => h('div.card', { style: { textAlign: 'center', padding: '12px' } }, h('div', { style: { fontSize: '1.6rem' } }, t[0]), h('b', { style: { fontSize: '1.4rem', fontFamily: 'var(--font-h)', fontWeight: 400 } }, t[1]), h('div.small.muted', t[2]))));
      const search = h('input', { type: 'text', placeholder: '🔍 이름·번호 검색', value: q, style: { maxWidth: '220px' } }); search.addEventListener('input', () => { q = search.value; table(); });
      const absent = h('label.row.small', h('input', { type: 'checkbox', checked: onlyAbsent, style: { width: '18px' }, onchange: e => { onlyAbsent = e.target.checked; table(); } }), '오늘 접속하지 않은 학생만');
      const tw = h('div', { style: { overflowX: 'auto' } });
      const cols = [['no', '번호'], ['name', '이름'], ['level', '레벨'], ['xp', 'XP'], ['quests', '퀘스트'], ['aiplay', 'AIplay'], ['games', '게임'], ['badges', '배지'], ['minutes', '학습(분)'], ['last', '최근 접속']];
      function table() {
        const val = (r, k) => k === 'no' ? r.s.no : k === 'name' ? r.s.name : (r.m ? r.m[k] : -1);
        let list = rows.filter(r => (!q || r.s.name.includes(q) || String(r.s.no) === q) && (!onlyAbsent || !(r.m && isToday(r.m.last))));
        list.sort((a, b) => { const x = val(a, sortKey), y = val(b, sortKey); return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sortDir; });
        tw.innerHTML = ''; tw.append(h('table.t.dash', h('thead', h('tr', cols.map(([k, t]) => h('th', { style: { cursor: 'pointer', whiteSpace: 'nowrap' }, onclick: () => { if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = k === 'name' || k === 'no' ? 1 : -1; } table(); } }, t + (sortKey === k ? (sortDir > 0 ? ' ▲' : ' ▼') : ''))), h('th', ''))),
          h('tbody', list.map(({ s, m }) => h('tr', h('td', s.no), h('td', h('b', (m ? m.avatar + ' ' : '') + s.name)), h('td', m ? 'Lv.' + m.level + ' ' + m.levelName : '-'), h('td', m ? m.xp : '-'),
            h('td', m ? h('div', { style: { minWidth: '90px' } }, h('div.progress', h('span', { style: { width: Math.round(m.quests / TOTAL() * 100) + '%' } })), h('small', m.quests + '/' + TOTAL())) : '-'),
            h('td', m ? m.aiplay + '/' + Eco.AIPLAY.length : '-'), h('td', m ? m.games : '-'), h('td', m ? m.badges : '-'), h('td', m ? m.minutes : '-'),
            h('td', m ? h('span' + (isToday(m.last) ? '.chip.forest' : ''), ago(m.last)) : h('span.muted.small', '접속 기록 없음')), h('td', h('a.btn.alt.sm', { href: '#/teacher/student/' + code + '/' + s.no }, '상세 ▶')))))));
        if (!list.length) tw.append(h('p.muted', n ? '조건에 맞는 학생이 없어요.' : '아직 학생이 없어요. ‘학급 관리’에서 명단을 추가하거나 학생이 학급 코드로 로그인하게 하세요.'));
      }
      table();
      return h('div', tiles, h('div.row.spread', { style: { margin: '14px 0 6px' } }, h('div.row', search, absent), h('div.row', cloudBar(code, draw), h('button.btn.alt.sm', { onclick: () => Eco.csv([['번호', '이름', '레벨', 'XP', '완료 퀘스트', 'AIplay', '게임 종류', '배지', '학습(분)', '연속 출석', '최근 접속'], ...rows.map(({ s, m }) => [s.no, s.name, m ? m.level : '', m ? m.xp : '', m ? m.quests : '', m ? m.aiplay : '', m ? m.games : '', m ? m.badges : '', m ? m.minutes : '', m ? m.streak : '', m && m.last ? new Date(m.last).toLocaleString('ko-KR') : ''])], c.name + '_현황.csv') }, '⬇ CSV 저장'), h('button.btn.alt.sm', { onclick: () => print() }, '🖨️ 인쇄'))), tw);
    }

    /* 진도 매트릭스 */
    function matrix() {
      const rows = classRows(code); const states = rows.map(r => A.getState(code, r.s.no));
      const th = (p) => h('th', { title: p.name, style: { fontSize: '.7rem', padding: '3px', textAlign: 'center', whiteSpace: 'nowrap', background: { forest: '#d7f0d2', wood: '#f3e1cb', nature: '#fde7c5' }[p.area] } }, p.code.replace('자-기', '기').replace('숲-', '숲').replace('놀-', '놀').replace('자-', '자'));
      const tbl = h('table.t.matrix', h('thead', h('tr', h('th', { style: { position: 'sticky', left: 0, background: '#fff' } }, '학생'), Eco.PROGRAMS.map(th), h('th', '완료'))),
        h('tbody', rows.map((r, i) => { const st = states[i]; const done = st ? Eco.PROGRAMS.filter(p => st.quests[p.id] && st.quests[p.id].done).length : 0;
          return h('tr', h('td', { style: { position: 'sticky', left: 0, background: '#fff', whiteSpace: 'nowrap' } }, h('a', { href: '#/teacher/student/' + code + '/' + r.s.no }, r.s.no + ' ' + r.s.name)),
            Eco.PROGRAMS.map(p => { const q = st && st.quests[p.id]; const ok = q && q.done; const sc = q && q.quiz ? q.quiz.right + '/' + q.quiz.total : ''; return h('td', { title: ok ? p.name + ' · ' + new Date(q.ts).toLocaleDateString('ko-KR') + (sc ? ' · 퀴즈 ' + sc : '') : p.name, style: { textAlign: 'center', padding: '2px', background: ok ? (q.quiz && q.quiz.total && q.quiz.right === q.quiz.total ? '#b9ecaa' : '#e1f5d6') : '#fafafa', fontSize: '.75rem' } }, ok ? '✔' : ''); }), h('td', h('b', done + '')));
        })));
      const colSum = h('div.small.muted', { style: { marginTop: '6px' } }, '✔ 완료 (진한 초록 = 퀴즈 만점). 칸에 마우스를 올리면 완료일과 퀴즈 점수가 보여요. 열 헤더 색: 숲=초록 · 놀=갈색 · 자=주황');
      const popular = Eco.PROGRAMS.map(p => ({ p, n: states.filter(st => st && st.quests[p.id] && st.quests[p.id].done).length })).sort((a, b) => b.n - a.n);
      return h('div', h('div', { style: { overflowX: 'auto', border: '2px solid var(--line)', borderRadius: '14px' } }, tbl), colSum, h('div.grid.g2', { style: { marginTop: '12px' } },
        h('div.card', h('h3', '🔥 많이 한 프로그램'), popular.slice(0, 5).map(x => h('div.small', x.p.emoji + ' ' + x.p.code + ' ' + x.p.name + ' — ' + x.n + '명'))),
        h('div.card', h('h3', '🌱 아직 아무도 안 한 프로그램'), h('div.small', popular.filter(x => x.n === 0).slice(0, 12).map(x => x.p.code + ' ' + x.p.name).join(' · ') || '모든 프로그램을 누군가 했어요!'))));
    }

    /* 활동 로그 */
    function log() {
      const rows = classRows(code); let ev = []; rows.forEach(r => { const st = A.getState(code, r.s.no); if (st) (st.events || []).forEach(e => ev.push(Object.assign({ no: r.s.no, name: r.s.name }, e))); });
      ev.sort((a, b) => b.t - a.t); let kind = '', who = '';
      const out = h('div'); const draw2 = () => { let L = ev.filter(e => (!kind || e.k === kind) && (!who || String(e.no) === who)).slice(0, 200); out.innerHTML = ''; out.append(h('table.t', h('thead', h('tr', h('th', '시각'), h('th', '학생'), h('th', '종류'), h('th', '내용'))), h('tbody', L.map(e => h('tr', h('td', { style: { whiteSpace: 'nowrap' } }, fdt(e.t)), h('td', e.no + ' ' + e.name), h('td', h('span.chip' + (e.k === 'xp' ? '.forest' : e.k === 'game' ? '.sun' : e.k === 'login' ? '' : '.ai'), { login: '접속', xp: '활동', game: '게임', teacher: '교사' }[e.k] || e.k)), h('td', e.m)))))); if (!L.length) out.append(h('p.muted', '기록이 아직 없어요.')); };
      const ks = h('select', { style: { width: 'auto' }, onchange: e => { kind = e.target.value; draw2(); } }, [['', '전체 종류'], ['login', '접속'], ['xp', '활동(XP)'], ['game', '게임']].map(o => h('option', { value: o[0] }, o[1])));
      const ws = h('select', { style: { width: 'auto' }, onchange: e => { who = e.target.value; draw2(); } }, [h('option', { value: '' }, '전체 학생'), ...rows.map(r => h('option', { value: r.s.no }, r.s.no + ' ' + r.s.name))]);
      draw2(); return h('div', h('div.row', ks, ws, h('button.btn.alt.sm', { onclick: () => Eco.csv([['시각', '번호', '이름', '종류', '내용', 'XP'], ...ev.map(e => [new Date(e.t).toLocaleString('ko-KR'), e.no, e.name, e.k, e.m, e.xp])], c.name + '_활동로그.csv') }, '⬇ CSV 저장')), out);
    }

    /* 학급 관리 */
    function manage() {
      const rows = A.listStudents(code);
      const nm = h('input', { type: 'text', value: c.name }); const save = h('button.btn.sm', { onclick: () => { A.updateClass(code, { name: nm.value.trim() || c.name }); Eco.ui.toast('저장했어요'); Eco.render(); } }, '저장');
      const sr = h('label.row', h('input', { type: 'checkbox', checked: c.settings.selfRegister, style: { width: '20px' }, onchange: e => A.updateClassSettings(code, { selfRegister: e.target.checked }) }), '명단에 없어도 학생이 번호·이름으로 직접 등록하게 허용');
      const rp = h('label.row', h('input', { type: 'checkbox', checked: c.settings.requirePin, style: { width: '20px' }, onchange: e => A.updateClassSettings(code, { requirePin: e.target.checked }) }), '학생 비밀번호(숫자 4자리) 사용 — 처음 로그인할 때 학생이 직접 정해요');
      const no = h('input', { type: 'text', inputmode: 'numeric', placeholder: '번호', style: { width: '90px' } }), nn = h('input', { type: 'text', placeholder: '이름', style: { flex: 1, minWidth: '120px' } });
      const add = h('button.btn.sm', { onclick: () => { const r = A.addStudent(code, no.value, nn.value); if (r) Eco.ui.toast(r); else { Eco.ui.toast('추가했어요'); Eco.render(); } } }, '➕ 추가');
      const bulk = h('textarea', { placeholder: '한 줄에 한 명씩: 번호,이름\n예)\n1,김하늘\n2,이나무\n3 박숲' });
      const bulkBtn = h('button.btn.sm', { onclick: () => { const r = A.bulkAdd(code, bulk.value); Eco.ui.toast(r.ok + '명 추가' + (r.skip.length ? ', 건너뜀 ' + r.skip.length : '')); if (r.skip.length) alert('건너뛴 줄:\n' + r.skip.join('\n')); Eco.render(); } }, '📋 한꺼번에 추가');
      const list = h('table.t', h('thead', h('tr', h('th', '번호'), h('th', '이름'), h('th', '관리'))), h('tbody', rows.map(s => h('tr', h('td', s.no), h('td', s.name), h('td', h('div.row', { style: { gap: '4px' } },
        h('button.btn.alt.sm', { onclick: () => { const v = prompt('새 이름', s.name); if (v && v.trim()) { A.renameStudent(code, s.no, v.trim()); Eco.render(); } } }, '✏️ 이름'),
        c.settings.requirePin ? h('button.btn.alt.sm', { onclick: () => { A.setPin(code, s.no, ''); Eco.ui.toast('비밀번호를 초기화했어요. 다음 로그인 때 다시 정해요.'); } }, '🔑 비번 초기화') : null,
        h('button.btn.alt.sm', { onclick: () => { if (confirm(s.no + '번 ' + s.name + '의 탐험 기록을 모두 지울까요?')) { A.resetStudent(code, s.no); Eco.render(); } } }, '♻️ 기록 초기화'),
        h('button.btn.berry.sm', { onclick: () => { if (confirm(s.no + '번 ' + s.name + ' 학생을 명단에서 삭제할까요? 기록도 함께 지워져요.')) { A.removeStudent(code, s.no); Eco.render(); } } }, '🗑 삭제')))))));
      return h('div', h('div.card', h('h3', '🔑 학생 로그인 안내'), h('div.row', h('div', { style: { fontSize: '2.2rem', fontFamily: 'var(--font-h)', letterSpacing: '4px' } }, code), h('button.btn.alt.sm', { onclick: () => Eco.copy(code) }, '📋 코드 복사'), h('button.btn.sm', { onclick: () => card() }, '🖨️ 안내 카드 인쇄')), h('p.small.muted', '학생은 로그인 화면에서 이 학급 코드와 번호·이름을 입력해요.')),
        h('div.card', { style: { marginTop: '12px' } }, h('h3', '⚙️ 학급 설정'), h('div.row', nm, save), sr, rp, cloudBar(code, () => Eco.render())),
        h('div.grid.g2', { style: { marginTop: '12px' } }, h('div.card', h('h3', '➕ 학생 한 명 추가'), h('div.row', no, nn, add)), h('div.card', h('h3', '📋 명단 붙여넣기'), bulk, h('div', { style: { marginTop: '6px' } }, bulkBtn))),
        h('div.card', { style: { marginTop: '12px', overflowX: 'auto' } }, h('h3', '👥 명단 (' + rows.length + '명)'), rows.length ? list : h('p.muted', '아직 명단이 없어요.')),
        h('div.card', { style: { marginTop: '12px' } }, h('h3', '🗑 학급 삭제'), h('p.small.muted', '학급과 소속 학생 기록이 이 기기에서 모두 삭제돼요. (되돌릴 수 없어요)'), h('button.btn.berry.sm', { onclick: () => { if (prompt('삭제하려면 학급 코드 ' + code + ' 를 입력하세요') === code) { A.deleteClass(code); Eco.go('#/teacher'); } } }, '학급 삭제')));
    }
    function card() {
      document.body.classList.add('pm'); const m = Eco.ui.modal(h('div', { style: { textAlign: 'center', border: '5px double var(--g1)', borderRadius: '16px', padding: '22px' } }, h('div', { style: { fontSize: '3rem' } }, '🌳'), h('h1', 'Eco AI 숲속탐험대'), h('p', c.name), h('p.muted', '로그인 방법'), h('div', { style: { fontSize: '3rem', fontFamily: 'var(--font-h)', letterSpacing: '8px', color: 'var(--g0)' } }, code), h('ol', { style: { textAlign: 'left', display: 'inline-block' } }, h('li', '로그인 화면에서 ‘학생’을 눌러요.'), h('li', '학급 코드 ' + code + ' 를 입력해요.'), h('li', '내 번호와 이름을 입력해요.')), h('div.no-print', h('button.btn', { onclick: () => print() }, '🖨️ 인쇄'))), { onclose: () => document.body.classList.remove('pm') });
    }
    draw();
    return h('div.fade-in', h('a.back', { href: '#/teacher' }, '← 교사 홈'), h('div.row.spread', h('h1', '🏫 ' + c.name), h('span.chip.sun', '코드 ' + code)), tabs, body);
  });

  /* ───────── 학생 상세 ───────── */
  Eco.route('/teacher/student/:code/:no', function (code, no) {
    if (need(['teacher', 'admin'])) return deny();
    const c = A.getClass(code), s = A.getStudent(code, no); if (!c || !s) return h('div.card', '학생을 찾을 수 없어요.', h('a.btn', { href: '#/teacher' }, '돌아가기'));
    if (A.role() === 'teacher' && c.teacherId !== Eco.session.id) return h('div.card', '이 학생을 볼 권한이 없어요.');
    const st = A.getState(code, no);
    const head = h('a.back', { href: '#/teacher/class/' + code }, '← ' + c.name);
    if (!st) return h('div.fade-in', head, h('h1', no + '번 ' + s.name), h('div.note', '아직 이 학생의 탐험 기록이 없어요. 학생이 로그인해 활동하면 여기에 나타나요.'), cloudBar(code, () => Eco.render()));
    const m = Eco.summarize(st), L = Eco.store.levelInfo(st.xp);
    /* 메시지 / XP */
    const txt = h('textarea', { placeholder: '학생에게 보낼 응원·피드백 메시지를 적어요 (학생 홈에 표시돼요)', style: { minHeight: '70px' } }); let stk = '🌟';
    const stks = h('div.row', ['🌟', '👏', '🌳', '💚', '🏆', '🦋'].map(x => h('button.btn.alt.sm' + (x === stk ? '.sun' : ''), { onclick: e => { stk = x; [...stks.children].forEach(b => b.classList.remove('sun')); e.target.classList.add('sun'); } }, x)));
    const xpSel = h('select', { style: { width: 'auto' } }, [0, 5, 10, 20, 30].map(v => h('option', { value: v }, v ? '+' + v + ' XP 보너스' : 'XP 보너스 없음')));
    const send = h('button.btn', { onclick: () => { const t = txt.value.trim(); if (!t) { Eco.ui.toast('메시지를 적어 주세요'); return; } A.addComment(code, no, { from: Eco.session.name || '선생님', text: t, sticker: stk, xp: +xpSel.value || 0 }); Eco.ui.toast('보냈어요! 학생이 다음에 접속하면 보여요'); Eco.render(); } }, '💬 보내기');
    /* 진도 */
    const areaProg = ['forest', 'wood', 'nature'].map(k => { const pr = Eco.progsOf(k), d = pr.filter(p => st.quests[p.id] && st.quests[p.id].done).length; return h('div', h('div.row.spread', h('b', Eco.AREAS[k].icon + ' ' + Eco.AREAS[k].ch + ' ' + Eco.AREAS[k].name), h('span', d + '/' + pr.length)), h('div.progress', h('span', { style: { width: Math.round(d / pr.length * 100) + '%' } }))); });
    const doneQ = Eco.PROGRAMS.filter(p => st.quests[p.id] && st.quests[p.id].done).sort((a, b) => st.quests[b.id].ts - st.quests[a.id].ts);
    const notes = Eco.PROGRAMS.filter(p => { const q = st.quests[p.id]; return q && q.notes && Object.values(q.notes).some(v => v && v.trim()); });
    const aip = Eco.AIPLAY.filter(a => st.aiplay[a.id] && (st.aiplay[a.id].done || (st.aiplay[a.id].note || '').trim()));
    const games = Object.entries(st.games).map(([id, g]) => [Eco.games[id] ? Eco.games[id].emoji + ' ' + Eco.games[id].name : id, g.plays, g.best]);
    const carbonDays = Object.keys(st.carbon).filter(k => st.carbon[k].length), carbonN = Object.values(st.carbon).reduce((a, l) => a + l.length, 0);
    const days = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); days.push([k, (st.stats && st.stats.min && st.stats.min[k]) || 0]); }
    const mx = Math.max(10, ...days.map(d => d[1]));
    const bars = h('div', { style: { display: 'flex', alignItems: 'flex-end', gap: '4px', height: '90px' } }, days.map(([k, v]) => h('div', { title: k + ' · ' + Math.round(v) + '분', style: { flex: 1, textAlign: 'center', fontSize: '.6rem' } }, h('div', { style: { height: Math.max(2, v / mx * 70) + 'px', background: 'var(--g2)', borderRadius: '4px 4px 0 0' } }), k.slice(8))));
    const cmts = A.comments(code, no);
    return h('div.fade-in', head,
      h('div.hero', { style: { background: 'linear-gradient(135deg,#2c6e8f,#2f8f4e)' } }, h('div.row', h('div', { style: { fontSize: '3.6rem' } }, st.avatar), h('div', h('h1', no + '번 ' + s.name), h('p', c.name + ' · ' + L.icon + ' Lv.' + L.level + ' ' + L.name + ' · ' + st.xp + ' XP'))),
        h('div.stats', [['🔖', m.quests + '/' + TOTAL(), '퀘스트'], ['🤖', m.aiplay + '/' + Eco.AIPLAY.length, 'AIplay'], ['🎮', m.games, '게임'], ['🏅', m.badges, '배지'], ['⏱', m.minutes + '분', '학습 시간'], ['🔥', m.streak + ' (최고 ' + m.best + ')', '연속 출석']].map(t => h('div.stat', h('b', t[1]), h('small', t[2]))))),
      h('div.grid.g2', { style: { marginTop: '14px', alignItems: 'start' } },
        h('div.grid',
          h('div.card', h('h3', '💬 응원 메시지 보내기'), txt, stks, h('div.row', { style: { marginTop: '8px' } }, xpSel, send), cmts.length ? h('div', { style: { marginTop: '8px' } }, h('b.small', '보낸 메시지'), cmts.slice(0, 5).map(x => h('div.small', fdt(x.t) + ' ' + x.sticker + ' ' + x.text + (x.xp ? ' (+' + x.xp + 'XP)' : '') + (x.read ? ' · 읽음' : ' · 안 읽음')))) : null),
          h('div.card', h('h3', '🗺️ 탐험 진도'), areaProg, h('h4', { style: { marginTop: '10px' } }, '완료한 프로그램 (' + doneQ.length + ')'), doneQ.length ? h('table.t', doneQ.map(p => { const q = st.quests[p.id]; return h('tr', h('td', p.emoji + ' ' + p.code + ' ' + p.name), h('td', { style: { whiteSpace: 'nowrap' } }, new Date(q.ts).toLocaleDateString('ko-KR')), h('td', q.quiz ? '퀴즈 ' + q.quiz.right + '/' + q.quiz.total : '')); })) : h('p.muted.small', '아직 완료한 프로그램이 없어요.')),
          h('div.card', h('h3', '📝 생각 노트'), notes.length ? notes.map(p => h('div', { style: { marginBottom: '8px' } }, h('b.small', p.emoji + ' ' + p.name), Object.values(st.quests[p.id].notes).filter(v => v && v.trim()).map(v => h('div.note', v)))) : h('p.muted.small', '작성한 노트가 없어요.')),
          h('div.card', h('h3', '🤖 AIplay 기록'), aip.length ? aip.map(a => h('div', { style: { marginBottom: '6px' } }, h('b.small', (st.aiplay[a.id].done ? '✅ ' : '⬜ ') + a.emoji + ' ' + a.tool), (st.aiplay[a.id].note || '').trim() ? h('div.note.blue', st.aiplay[a.id].note) : null)) : h('p.muted.small', '아직 없어요.'))),
        h('div.grid',
          h('div.card', h('h3', '⏱ 최근 14일 학습 시간(분)'), bars),
          h('div.card', h('h3', '🎮 게임 기록'), games.length ? h('table.t', h('thead', h('tr', h('th', '게임'), h('th', '횟수'), h('th', '최고'))), games.map(g => h('tr', h('td', g[0]), h('td', g[1]), h('td', g[2])))) : h('p.muted.small', '아직 없어요.')),
          h('div.card', h('h3', '🌱 실천·창작 활동'), h('ul.small', h('li', '탄소중립 e캘린더: ' + carbonDays.length + '일 · ' + carbonN + '회 실천'), h('li', '희망트리 잎 ' + st.tree.leaves.length + '장'), h('li', 'ONE CHANCE 스토리 ' + Object.keys(st.stories).length + '/4'), h('li', '프롬프트 연구소 최고 별 ' + (Math.max(0, ...Object.values(st.prompts)) || 0) + '개'), h('li', '에코크래프트: ' + (st.meta.ecDone ? '숲 복원 완료' : st.meta.ec ? '진행 중' : '미체험'))), st.tree.leaves.length ? h('div', h('b.small', '💌 희망트리 편지'), st.tree.leaves.slice(-6).map(l => h('div.note', l.t))) : null),
          h('div.card', h('h3', '🏅 배지 (' + Object.keys(st.badges).length + ')'), h('div.row', Object.keys(st.badges).map(id => { const b = Eco.BADGES.find(x => x.id === id); return b ? h('span.chip.sun', { title: b.d }, b.ic + ' ' + b.n) : null; }), Object.keys(st.badges).length ? null : h('span.muted.small', '아직 없어요'))),
          h('div.card', h('h3', '🕘 활동 타임라인'), h('div', { style: { maxHeight: '320px', overflow: 'auto' } }, (st.events || []).slice(0, 80).map(e => h('div.small', { style: { padding: '3px 0', borderBottom: '1px dashed var(--line)' } }, h('span.muted', fdt(e.t) + ' '), { login: '🔓 ', xp: '⭐ ', game: '🎮 ', teacher: '👩‍🏫 ' }[e.k] || '', e.m))), (st.events || []).length ? null : h('p.muted.small', '기록이 없어요.')),
          h('div.card', h('h3', '⚙️ 관리'), h('div.row', h('button.btn.alt.sm', { onclick: () => Eco.download(st, no + '번_' + s.name + '_탐험기록.json') }, '⬇ 이 학생 기록 저장'), h('button.btn.alt.sm', { onclick: () => { if (confirm('이 학생의 탐험 기록을 모두 지울까요?')) { A.resetStudent(code, no); Eco.go('#/teacher/class/' + code); } } }, '♻️ 기록 초기화'))))));
  });
})(window.Eco);
