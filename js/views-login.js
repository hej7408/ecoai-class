/* 로그인 화면 (학생 · 교사 · 관리자 · 게스트) */
(function (Eco) {
  const { h } = Eco.ui;
  const A = Eco.auth;

  Eco.afterLogin = function (target) { location.hash = target; location.reload(); };
  Eco.logout = function () { if (Eco.cloud && Eco.cloud.enabled) Eco.cloud.signOut(); A.logout(); location.hash = '#/login'; location.reload(); };
  Eco.csv = function (rows, filename) {
    const esc = v => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    const blob = new Blob(['﻿' + rows.map(r => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = h('a', { href: URL.createObjectURL(blob), download: filename }); document.body.append(a); a.click(); a.remove();
  };
  Eco.download = function (obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: filename }); document.body.append(a); a.click(); a.remove();
  };

  Eco.route('/login', function () {
    let tab = (Eco.session && Eco.session.role === 'teacher') ? 'teacher' : 'student';
    const box = h('div.card', { style: { maxWidth: '560px', margin: '0 auto' } });
    const tabs = h('div.pill-tabs');
    const msg = h('div.note', { style: { display: 'none' } });
    const say = (t, kind) => { msg.style.display = 'block'; msg.className = 'note' + (kind ? '.' + kind : ''); msg.className = 'note' + (kind === 'ok' ? '' : ' blue'); msg.textContent = t; };
    const busy = (btn, fn) => async () => { btn.disabled = true; try { await fn(); } finally { btn.disabled = false; } };

    function studentForm() {
      const code = h('input', { type: 'text', placeholder: '학급 코드 (예: K7M2PX)', maxlength: 8, autocomplete: 'off', 'aria-label': '학급 코드', style: { textTransform: 'uppercase' } });
      const no = h('input', { type: 'text', inputmode: 'numeric', placeholder: '번호 (숫자)', maxlength: 3, 'aria-label': '번호' });
      const name = h('input', { type: 'text', placeholder: '이름', maxlength: 12, 'aria-label': '이름' });
      const pin = h('input', { type: 'password', inputmode: 'numeric', placeholder: '비밀번호 숫자 4자리', maxlength: 4, 'aria-label': '비밀번호 4자리', class: 'hidden' });
      const go = h('button.btn.sun', { style: { width: '100%', fontSize: '1.1rem', padding: '12px' } }, '🌳 탐험 시작!');
      go.onclick = busy(go, async () => {
        const r = await A.loginStudent({ code: code.value, no: no.value, name: name.value, pin: pin.value });
        if (r.ok) { Eco.afterLogin('#/home'); return; }
        if (r.needPin) pin.classList.remove('hidden');
        say(r.msg);
      });
      [code, no, name, pin].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') go.click(); }));
      const recent = A.recent();
      return h('div', h('p.muted', '선생님께 받은 학급 코드와 내 번호·이름을 입력해요.'),
        h('div.grid', { style: { gap: '8px' } }, code, h('div.row', { style: { flexWrap: 'nowrap' } }, no, name), pin), h('div', { style: { marginTop: '10px' } }, go),
        recent.length ? h('div', { style: { marginTop: '14px' } }, h('b.small', '이 기기에서 최근 로그인한 친구'), h('div.row', { style: { marginTop: '6px' } }, recent.map(r => h('button.btn.alt.sm', { title: r.cls, onclick: () => { code.value = r.code; no.value = r.no; name.value = r.name; name.focus(); } }, r.no + '번 ' + r.name)))) : null);
    }
    function teacherForm() {
      if (Eco.cloud && Eco.cloud.enabled) return cloudTeacherForm();
      const id = h('input', { type: 'text', placeholder: '교사 아이디', autocomplete: 'username', 'aria-label': '교사 아이디' });
      const pw = h('input', { type: 'password', placeholder: '비밀번호', autocomplete: 'current-password', 'aria-label': '비밀번호' });
      const go = h('button.btn', { style: { width: '100%' } }, '👩‍🏫 교사 로그인');
      go.onclick = busy(go, async () => { if (await A.loginTeacher(id.value, pw.value)) Eco.afterLogin('#/teacher'); else say('아이디 또는 비밀번호가 맞지 않아요.'); });
      pw.addEventListener('keydown', e => { if (e.key === 'Enter') go.click(); });
      return h('div', h('p.muted', '교사 계정은 관리자가 만들어 줘요. 아직 계정이 없다면 ‘관리자’ 탭에서 먼저 관리자를 설정하세요.'), h('div.grid', { style: { gap: '8px' } }, id, pw, go),
        A.listTeachers().length ? null : h('div.note', '아직 등록된 교사가 없어요. 관리자 로그인 → 교사 관리에서 만들 수 있어요.'));
    }
    function cloudTeacherForm() {
      let mode = 'in';
      const wrap = h('div');
      const after = async r => { if (!r) { say(Eco.cloud.lastError || '실패했어요. 다시 확인해 주세요.'); return; } A.setSession({ role: 'teacher', id: r.id, name: r.name }); await Eco.cloud.pullClassesFor(r.id); Eco.afterLogin('#/teacher'); };
      const drawT = () => {
        wrap.innerHTML = '';
        const id = h('input', { type: 'text', placeholder: '교사 아이디 (영문·숫자 3~20자)', autocomplete: 'username', 'aria-label': '교사 아이디' }), pw = h('input', { type: 'password', placeholder: '비밀번호 (6자 이상)', autocomplete: mode === 'in' ? 'current-password' : 'new-password', 'aria-label': '비밀번호' });
        if (mode === 'in') {
          const go = h('button.btn', { style: { width: '100%' } }, '👩‍🏫 교사 로그인'); go.onclick = busy(go, async () => after(await Eco.cloud.teacherSignIn(id.value, pw.value)));
          pw.addEventListener('keydown', e => { if (e.key === 'Enter') go.click(); });
          wrap.append(h('div.grid', { style: { gap: '8px' } }, id, pw, go), h('p.small', { style: { marginTop: '10px' } }, '처음이세요? ', h('a', { href: '#', onclick: e => { e.preventDefault(); mode = 'up'; drawT(); } }, '교사 가입하기')));
        } else {
          const nm = h('input', { type: 'text', placeholder: '이름 (예: 김선생)', 'aria-label': '이름' }), code = h('input', { type: 'text', placeholder: '교사 가입 코드', autocomplete: 'off', 'aria-label': '교사 가입 코드' });
          const up = h('button.btn', { style: { width: '100%' } }, '✨ 교사 가입'); up.onclick = busy(up, async () => after(await Eco.cloud.teacherSignUp(id.value, pw.value, code.value, nm.value.trim())));
          wrap.append(h('div.grid', { style: { gap: '8px' } }, nm, id, pw, code, up), h('p.small', { style: { marginTop: '10px' } }, '이미 계정이 있어요 → ', h('a', { href: '#', onclick: e => { e.preventDefault(); mode = 'in'; drawT(); } }, '로그인')));
        }
      };
      drawT();
      return h('div', h('div.note.blue', '☁️ 이메일 없이 아이디와 비밀번호로 로그인해요. 가입 코드는 관리자에게 받으세요. (' + Eco.cloud.status + ')'), wrap);
    }
    function adminForm() {
      if (Eco.cloud && Eco.cloud.enabled) {
        const pw = h('input', { type: 'password', placeholder: '관리자 비밀번호', autocomplete: 'current-password', 'aria-label': '관리자 비밀번호' }), go = h('button.btn', { style: { width: '100%' } }, '🛠️ 관리자 로그인');
        go.onclick = busy(go, async () => { const r = await Eco.cloud.adminSignIn(pw.value); if (r) { A.setSession({ role: 'admin', id: 'admin', name: '관리자' }); await Eco.cloud.pullClassesFor(null); Eco.afterLogin('#/admin'); } else say(Eco.cloud.lastError || '비밀번호가 맞지 않아요.'); });
        pw.addEventListener('keydown', e => { if (e.key === 'Enter') go.click(); });
        const first = h('a', { href: '#', onclick: async e => { e.preventDefault(); const p1 = prompt('관리자 계정을 처음 만듭니다.\n새 관리자 비밀번호 (6자 이상)'); if (!p1) return; if (p1 !== prompt('비밀번호를 한 번 더 입력하세요')) { say('비밀번호가 서로 달라요.'); return; } const r = await Eco.cloud.adminCreate(p1); if (r) { A.setSession({ role: 'admin', id: 'admin', name: '관리자' }); Eco.afterLogin('#/admin'); } else say(Eco.cloud.lastError || '만들지 못했어요. (이미 관리자 계정이 있을 수 있어요)'); } }, '관리자 계정 처음 만들기');
        return h('div', h('div.note.blue', '☁️ 관리자는 비밀번호만 입력해요. (' + Eco.cloud.status + ')'), h('div.grid', { style: { gap: '8px' } }, pw, go), h('p.small.muted', { style: { marginTop: '10px' } }, '처음 한 번만: ', first));
      }
      if (!A.hasAdmin()) {
        const p1 = h('input', { type: 'password', placeholder: '새 관리자 비밀번호 (6자 이상)', autocomplete: 'new-password' }), p2 = h('input', { type: 'password', placeholder: '비밀번호 한 번 더', autocomplete: 'new-password' });
        const go = h('button.btn', { style: { width: '100%' } }, '🛠️ 관리자 만들기');
        go.onclick = busy(go, async () => { if (p1.value.length < 6) { say('비밀번호는 6자 이상이에요.'); return; } if (p1.value !== p2.value) { say('비밀번호가 서로 달라요.'); return; } await A.setupAdmin(p1.value); await A.loginAdmin(p1.value); Eco.afterLogin('#/admin'); });
        return h('div', h('div.note', '👋 처음 설정이에요! 이 기기의 관리자 비밀번호를 만들어 주세요. 잊어버리면 이 기기의 기록을 초기화해야 하니 꼭 적어 두세요.'), h('div.grid', { style: { gap: '8px' } }, p1, p2, go));
      }
      const pw = h('input', { type: 'password', placeholder: '관리자 비밀번호', autocomplete: 'current-password' }), go = h('button.btn', { style: { width: '100%' } }, '🛠️ 관리자 로그인');
      go.onclick = busy(go, async () => { if (await A.loginAdmin(pw.value)) Eco.afterLogin('#/admin'); else say('비밀번호가 맞지 않아요.'); });
      pw.addEventListener('keydown', e => { if (e.key === 'Enter') go.click(); });
      return h('div', h('div.grid', { style: { gap: '8px' } }, pw, go));
    }
    function guestForm() {
      const go = h('button.btn.alt', { style: { width: '100%' }, onclick: () => { A.guest(); Eco.afterLogin('#/home'); } }, '🌱 게스트로 체험하기');
      return h('div', h('p.muted', '로그인 없이 구경해 볼 수 있어요. 기록은 이 기기에만 남고 선생님 대시보드에는 나타나지 않아요.'), go);
    }
    const FORMS = { student: studentForm, teacher: teacherForm, admin: adminForm, guest: guestForm };
    const draw = () => {
      tabs.innerHTML = ''; [['student', '🧒 학생'], ['teacher', '👩‍🏫 교사'], ['admin', '🛠️ 관리자'], ['guest', '🌱 게스트']].forEach(([k, t]) => tabs.append(h('button' + (k === tab ? '.on' : ''), { onclick: () => { tab = k; msg.style.display = 'none'; draw(); } }, t)));
      box.innerHTML = ''; box.append(h('div', { style: { textAlign: 'center' } }, h('div', { style: { fontSize: '3rem' } }, '🌳'), h('h1', 'Eco AI 숲속탐험대'), h('div.login-sub', '🌿 자연과 함께 놀며 배우는 생태환경교육 AIDT'), h('p.small.muted', { style: { maxWidth: '420px', margin: '0 auto 8px' } }, 'Eco AI(에코아이)는 숲·놀이·자연 체험 디지털교과서에 AIplay·에듀테크·메타버스 게임을 더한 초등 생태환경교육 웹앱이에요. (제71회 경기도교육자료전 입상작)'), h('p.muted', '로그인하고 나만의 탐험 기록을 쌓아요')), tabs, msg, FORMS[tab]());
    };
    draw();
    return h('div.fade-in', { style: { padding: '10px 0' } }, box, h('p.small.muted', { style: { textAlign: 'center', marginTop: '12px' } }, Eco.cloud && Eco.cloud.enabled ? '☁️ 여러 기기에서 기록이 모아져요.' : '💾 기록은 이 기기의 브라우저에 저장돼요. (여러 기기 연동은 README의 Firebase 연동 참고)'));
  });
})(window.Eco);
