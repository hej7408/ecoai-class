/* 관리자 대시보드: 개요 · 교사 · 학급 · 학생 검색 · 접속 기록 · 데이터 · 설정 */
(function (Eco) {
  const { h } = Eco.ui;
  const A = Eco.auth;
  const fdt = t => new Date(t).toLocaleString('ko-KR', { year: '2-digit', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const deny = () => h('div.card', h('h2', '🔒 관리자 로그인이 필요해요'), h('a.btn', { href: '#/login' }, '로그인 화면으로'));
  const fileInput = (accept, onText) => h('input', { type: 'file', accept, class: 'hidden', onchange: e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => onText(r.result); r.readAsText(f); } });
  let tab = 'overview';

  Eco.route('/admin', function () {
    if (A.role() !== 'admin') return deny();
    const body = h('div'), tabs = h('div.pill-tabs');
    const R = A.R();
    const draw = () => { tabs.innerHTML = ''; [['overview', '📊 개요'], ['teachers', '👩‍🏫 교사'], ['classes', '🏫 학급'], ['students', '🔍 학생 검색'], ['audit', '🕘 접속 기록'], ['data', '💾 데이터·백업'], ['settings', '⚙️ 설정']].forEach(([k, t]) => tabs.append(h('button' + (k === tab ? '.on' : ''), { onclick: () => { tab = k; draw(); } }, t))); body.innerHTML = ''; body.append(({ overview, teachers, classes, students, audit, data, settings })[tab]()); };

    function overview() {
      const nS = Object.keys(R.students).length, nC = Object.keys(R.classes).length, nT = Object.keys(R.teachers).length;
      const act = Object.values(R.students).filter(s => s.last && new Date(s.last).toDateString() === new Date().toDateString()).length;
      const size = Math.round(Object.keys(localStorage).filter(k => k.startsWith('ecoai.')).reduce((a, k) => a + (localStorage.getItem(k) || '').length, 0) / 1024);
      return h('div', h('div.grid.g4', [['👩‍🏫', nT, '교사'], ['🏫', nC, '학급'], ['🧒', nS, '학생'], ['🟢', act, '오늘 접속 학생'], ['💾', size + 'KB', '이 기기 저장 용량']].map(t => h('div.card', { style: { textAlign: 'center' } }, h('div', { style: { fontSize: '1.8rem' } }, t[0]), h('b', { style: { fontSize: '1.5rem', fontFamily: 'var(--font-h)', fontWeight: 400 } }, t[1]), h('div.small.muted', t[2])))),
        h('div.card', { style: { marginTop: '12px' } }, h('h3', '🕘 최근 접속·관리 기록'), h('table.t', R.audit.slice(0, 10).map(a => h('tr', h('td', fdt(a.t)), h('td', a.role), h('td', a.id), h('td', a.act)))), R.audit.length ? null : h('p.muted', '기록이 없어요.')),
        h('div.row', { style: { marginTop: '12px' } }, h('a.btn', { href: '#/teacher' }, '👩‍🏫 교사 화면으로 (모든 학급 보기)')));
    }

    const cloud = () => !!(Eco.cloud && Eco.cloud.enabled);
    function teachersCloud() {
      const box = h('div'); const code = h('input', { type: 'text', placeholder: '교사 가입 코드 (예: 숫자·영문 6자 이상)', style: { maxWidth: '320px' } });
      const codeBox = h('div.card', h('h3', '🔑 교사 가입 코드'), h('p.small.muted', '교사가 가입할 때 입력해야 하는 코드예요. 코드는 서버(Firestore)에 저장되고 관리자만 볼 수 있어요. 선생님들께만 알려 주세요.'), h('div.row', code, h('button.btn.sm', { onclick: async () => { const v = code.value.trim(); if (v.length < 4) { Eco.ui.toast('4자 이상으로 정해 주세요'); return; } const ok = await Eco.cloud.setTeacherCode(v); Eco.ui.toast(ok ? '가입 코드를 저장했어요' : '저장 실패: ' + Eco.cloud.lastError); } }, '저장')));
      Eco.cloud.getTeacherCode().then(v => { if (v) code.value = v; });
      const list = h('div.card', { style: { marginTop: '12px', overflowX: 'auto' } }, h('p.muted', '불러오는 중…'));
      const load = async () => { const L = await Eco.cloud.listTeachers(); list.innerHTML = ''; if (!L) { list.append(h('div.note', '교사 목록을 불러오지 못했어요: ' + Eco.cloud.lastError)); return; } list.append(h('h3', '가입한 교사 (' + L.length + ')'), L.length ? h('table.t', h('thead', h('tr', h('th', '아이디'), h('th', '이름'), h('th', '가입일'), h('th', ''))), h('tbody', L.map(t => h('tr', h('td', t.id), h('td', t.name), h('td', new Date(t.created).toLocaleDateString('ko-KR')), h('td', h('button.btn.berry.sm', { onclick: async () => { if (confirm(t.name + ' 교사의 등록을 해제할까요? (로그인해도 대시보드를 열 수 없게 돼요)')) { await Eco.cloud.removeTeacher(t.uid); load(); } } }, '등록 해제')))))) : h('p.muted', '아직 가입한 교사가 없어요.'), h('p.small.muted', '비밀번호를 잊은 교사는 이메일이 없어 재설정할 수 없어요. 등록 해제 후 새 아이디로 다시 가입하게 해 주세요.')); };
      load(); box.append(codeBox, list); return box;
    }
    function teachers() {
      if (cloud()) return teachersCloud();
      const id = h('input', { type: 'text', placeholder: '아이디(영문·숫자)', style: { width: '160px' } }), nm = h('input', { type: 'text', placeholder: '이름(예: 김선생)', style: { width: '160px' } }), pw = h('input', { type: 'text', placeholder: '임시 비밀번호', style: { width: '160px' } });
      const add = h('button.btn.sm', { onclick: async () => { const e = await A.createTeacher(id.value, nm.value.trim(), pw.value); if (e) Eco.ui.toast(e); else { Eco.ui.toast('교사 계정을 만들었어요'); draw(); } } }, '➕ 교사 계정 만들기');
      const list = A.listTeachers();
      return h('div', h('div.card', h('h3', '➕ 교사 계정 만들기'), h('div.row', id, nm, pw, add), h('p.small.muted', '교사에게 아이디와 임시 비밀번호를 알려 주세요. 로그인 후 스스로 비밀번호를 바꿀 수 있어요.')),
        h('div.card', { style: { marginTop: '12px', overflowX: 'auto' } }, h('h3', '교사 목록 (' + list.length + ')'), list.length ? h('table.t', h('thead', h('tr', h('th', '아이디'), h('th', '이름'), h('th', '담당 학급'), h('th', '만든 날'), h('th', ''))), h('tbody', list.map(t => h('tr', h('td', t.id), h('td', t.name), h('td', A.listClasses(t.id).map(c => c.name).join(', ') || '-'), h('td', new Date(t.created).toLocaleDateString('ko-KR')), h('td', h('div.row', { style: { gap: '4px' } },
          h('button.btn.alt.sm', { onclick: async () => { const p = prompt('새 임시 비밀번호', ''); if (p && p.length >= 4) { await A.resetTeacherPw(t.id, p); Eco.ui.toast('재설정했어요'); } else if (p) Eco.ui.toast('4자 이상이어야 해요'); } }, '🔑 비번 재설정'),
          h('button.btn.berry.sm', { onclick: () => { if (confirm(t.name + ' 교사 계정을 삭제할까요? (담당 학급은 ‘담당 없음’이 돼요)')) { A.deleteTeacher(t.id); draw(); } } }, '🗑 삭제'))))))) : h('p.muted', '아직 교사 계정이 없어요.')));
    }

    function classes() {
      const list = A.listClasses(); const ts = A.listTeachers();
      const pull = cloud() ? h('button.btn.alt.sm', { onclick: async e => { e.target.disabled = true; const n = await Eco.cloud.pullClassesFor(null); let m = 0; for (const c of A.listClasses()) { const k = await Eco.cloud.pullClass(c.code); if (k) m += k; } e.target.disabled = false; Eco.ui.toast(n == null ? '실패: ' + Eco.cloud.lastError : '☁️ 학급 ' + (n || 0) + '개 추가, 학생 기록 ' + m + '건 갱신'); draw(); } }, '☁️ 모든 학급·학생 기록 가져오기') : null;
      return h('div', h('div.card', { style: { overflowX: 'auto' } }, h('div.row.spread', h('h3', '전체 학급 (' + list.length + ')'), pull), list.length ? h('table.t', h('thead', h('tr', h('th', '학급'), h('th', '코드'), h('th', '학생'), h('th', '담당 교사'), h('th', ''))), h('tbody', list.map(c => h('tr', h('td', c.name), h('td', h('b', c.code)), h('td', A.listStudents(c.code).length), h('td', cloud() ? (c.teacherId || '(담당 없음)') : h('select', { style: { width: 'auto' }, onchange: e => { A.updateClass(c.code, { teacherId: e.target.value }); Eco.ui.toast('담당 교사를 바꿨어요'); } }, [h('option', { value: '' }, '(담당 없음)'), ...ts.map(t => h('option', { value: t.id, selected: t.id === c.teacherId }, t.name + ' (' + t.id + ')'))])), h('td', h('a.btn.alt.sm', { href: '#/teacher/class/' + c.code }, '열기 ▶')))))) : h('p.muted', '학급이 없어요. 교사 화면에서 만들 수 있어요.')));
    }

    function students() {
      const q = h('input', { type: 'text', placeholder: '🔍 이름·학급·코드로 검색', style: { maxWidth: '320px' } }); const out = h('div');
      const find = () => { const v = q.value.trim(); const L = Object.values(R.students).filter(s => !v || s.name.includes(v) || s.code.includes(v.toUpperCase()) || (R.classes[s.code] && R.classes[s.code].name.includes(v))).sort((a, b) => b.last - a.last).slice(0, 100); out.innerHTML = ''; out.append(h('table.t', h('thead', h('tr', h('th', '학급'), h('th', '번호'), h('th', '이름'), h('th', '레벨/XP'), h('th', '최근 접속'), h('th', ''))), h('tbody', L.map(s => { const m = s.summary; return h('tr', h('td', R.classes[s.code] ? R.classes[s.code].name : s.code), h('td', s.no), h('td', s.name), h('td', m ? 'Lv.' + m.level + ' · ' + m.xp : '-'), h('td', s.last ? fdt(s.last) : '-'), h('td', h('a.btn.alt.sm', { href: '#/teacher/student/' + s.code + '/' + s.no }, '상세 ▶'))); })))); if (!L.length) out.append(h('p.muted', '검색 결과가 없어요.')); };
      q.addEventListener('input', find); find();
      return h('div', h('div.card', { style: { overflowX: 'auto' } }, h('div.row', q, h('button.btn.alt.sm', { onclick: () => Eco.csv([['학급', '코드', '번호', '이름', '레벨', 'XP', '완료 퀘스트', '학습(분)', '최근 접속'], ...Object.values(R.students).map(s => [R.classes[s.code] ? R.classes[s.code].name : '', s.code, s.no, s.name, s.summary ? s.summary.level : '', s.summary ? s.summary.xp : '', s.summary ? s.summary.quests : '', s.summary ? s.summary.minutes : '', s.last ? new Date(s.last).toLocaleString('ko-KR') : ''])], 'EcoAI_전체학생.csv') }, '⬇ 전체 CSV')), out));
    }

    function audit() {
      let role = ''; const out = h('div'); const dr = () => { out.innerHTML = ''; out.append(h('table.t', h('thead', h('tr', h('th', '시각'), h('th', '구분'), h('th', '대상'), h('th', '내용'))), h('tbody', R.audit.filter(a => !role || a.role === role).slice(0, 200).map(a => h('tr', h('td', { style: { whiteSpace: 'nowrap' } }, fdt(a.t)), h('td', a.role), h('td', a.id), h('td', { style: a.act.includes('실패') ? { color: 'var(--berry)', fontWeight: 700 } : {} }, a.act)))))); };
      const sel = h('select', { style: { width: 'auto' }, onchange: e => { role = e.target.value; dr(); } }, [['', '전체'], ['student', '학생'], ['teacher', '교사'], ['admin', '관리자']].map(o => h('option', { value: o[0] }, o[1])));
      dr(); return h('div.card', { style: { overflowX: 'auto' } }, h('div.row', h('h3', '🕘 접속·관리 기록 (최근 300건)'), sel), out);
    }

    function data() {
      const file = fileInput('.json,application/json', t => { try { if (confirm('백업 파일로 이 기기의 모든 학급·학생 기록을 덮어쓸까요?') && A.importAll(JSON.parse(t))) { Eco.ui.toast('복원했어요'); location.reload(); } } catch (e) { Eco.ui.toast('올바른 백업 파일이 아니에요'); } });
      return h('div.grid.g2',
        h('div.card', h('h3', '💾 전체 백업'), h('p.small.muted', '교사·학급·학생 명단과 모든 학생의 탐험 기록을 한 파일로 저장해요. (관리자 비밀번호 정보도 포함되니 안전한 곳에 보관하세요)'), h('button.btn', { onclick: () => Eco.download(A.exportAll(), 'EcoAI_백업_' + Eco.today() + '.json') }, '⬇ 백업 파일 저장')),
        h('div.card', h('h3', '📂 백업에서 복원'), h('p.small.muted', '다른 기기에서 저장한 백업 파일을 불러와요. 현재 기기의 데이터는 덮어써져요.'), h('button.btn.alt', { onclick: () => file.click() }, '📂 백업 파일 선택'), file),
        h('div.card', h('h3', '🧹 학생 기록만 초기화'), h('p.small.muted', '새 학기용: 명단은 두고 모든 학생의 탐험 기록(XP·퀘스트 등)만 지워요.'), h('button.btn.berry', { onclick: () => { if (prompt('모든 학생의 탐험 기록을 지웁니다. 계속하려면 “초기화”를 입력하세요.') === '초기화') { Object.values(R.students).forEach(s => { try { localStorage.removeItem(Eco.studentKey(s.code, s.no)); } catch (e) { } s.summary = null; s.last = 0; }); A.audit('admin', 'admin', '전체 학생 기록 초기화'); Eco.ui.toast('초기화했어요'); draw(); } } }, '학생 기록 초기화')),
        h('div.card', h('h3', '⚠️ 이 기기의 모든 데이터 삭제'), h('p.small.muted', '관리자·교사·학급·학생·게스트 기록을 모두 지우고 처음 상태로 되돌려요. 되돌릴 수 없어요.'), h('button.btn.berry', { onclick: () => { if (prompt('모두 삭제합니다. 계속하려면 “전체삭제”를 입력하세요.') === '전체삭제') { A.wipeAll(); A.logout(); location.hash = '#/login'; location.reload(); } } }, '모두 삭제')));
    }

    function settings() {
      const o = h('input', { type: 'password', placeholder: '현재 비밀번호' }), n = h('input', { type: 'password', placeholder: '새 비밀번호(6자 이상)' });
      const C = Eco.cloud || {};
      return h('div.grid.g2',
        h('div.card', h('h3', '🔑 관리자 비밀번호 변경'), h('div.grid', { style: { gap: '8px' } }, o, n, h('button.btn', { onclick: async () => { if (n.value.length < 6) { Eco.ui.toast('6자 이상이에요'); return; } const ok = cloud() ? await Eco.cloud.adminChangePw(o.value, n.value) : await A.changeAdminPw(o.value, n.value); if (ok) { Eco.ui.toast('바꿨어요'); o.value = n.value = ''; } else Eco.ui.toast(cloud() ? ('실패: ' + (Eco.cloud.lastError || '현재 비밀번호를 확인해 주세요')) : '현재 비밀번호가 달라요'); } }, '변경'))),
        h('div.card', h('h3', '☁️ Firebase 연동 상태'), h('p', C.enabled ? '켜짐 · ' + C.status : '꺼짐(로컬 모드) — ' + (C.status || '')), C.lastError ? h('div.note', '최근 오류: ' + C.lastError) : null,
          h('ol.ol.green', h('li', 'Firebase 콘솔에서 프로젝트 생성 → Authentication에서 ‘익명’, ‘이메일/비밀번호’ 사용 설정'), h('li', 'Firestore 데이터베이스 만들기 → 규칙에 firestore.rules 붙여넣기'), h('li', '웹 앱 등록 후 설정값을 js/firebase-config.js에 입력'), h('li', '시험 학급으로 학생 로그인 → 교사 ‘기록 가져오기’ 확인')),
          h('div.note', '⚠️ Firebase 연동 코드는 아직 실제 프로젝트로 시험되지 않았어요. 학생 개인정보(번호·이름·학습 기록)가 외부 서버에 저장되므로 학교·교육청 지침과 보호자 동의를 먼저 확인하세요.')),
        h('div.card', h('h3', '🔐 보안 안내'), h('ul.small', h('li', '로컬 모드의 비밀번호는 이 기기 안에서 해시로 저장돼 ‘기기 접근 권한이 있는 사람’은 개발자 도구로 데이터를 볼 수 있어요. 공용 PC에서는 교사 PC 계정 잠금이 필요해요.'), h('li', '학생 로그인은 학급 코드 + 번호 + 이름이에요. 같은 반 친구가 알 수 있으니 필요하면 학급 설정에서 학생 비밀번호(4자리)를 켜세요.'), h('li', '여러 기기·정식 운영이 필요하면 Firebase 같은 서버 인증을 사용하세요.'))));
    }
    draw();
    return h('div.fade-in', h('div.hero', { style: { background: 'linear-gradient(135deg,#444c6e,#7b5cd6)' } }, h('h1', '🛠️ 관리자 대시보드'), h('p', '교사 계정과 학급, 전체 학생 기록을 관리해요.'), h('div.row', h('a.btn.sun', { href: '#/teacher' }, '👩‍🏫 교사 화면'), h('button.btn.alt', { onclick: Eco.logout }, '🚪 로그아웃'))), tabs, body);
  });
})(window.Eco);
