/* 로그인·학급·명단·교사/관리자 계정 관리 (이 기기의 localStorage 기반 + 선택적 Firebase 동기화) */
window.Eco = window.Eco || {};
(function (Eco) {
  const RK = 'ecoai.registry.v1';
  const blank = () => ({ v: 1, admin: null, teachers: {}, classes: {}, students: {}, comments: {}, audit: [], recent: [] });
  let R;
  try { R = JSON.parse(localStorage.getItem(RK) || 'null'); } catch (e) { R = null; }
  if (!R || R.v !== 1) R = blank();
  Object.keys(blank()).forEach(k => { if (!(k in R)) R[k] = blank()[k]; });
  /* 기본 관리자 비밀번호(해시로만 저장). 관리자 설정 화면에서 바꾸는 것을 권장합니다. */
  const DEFAULT_ADMIN = { salt: 'ecoai24s', hash: '13fc41a0b9469586e922b4ff79035f77c08d470b04a5c51d2787bb99762eb525' };
  if (!R.admin) { R.admin = DEFAULT_ADMIN; try { localStorage.setItem(RK, JSON.stringify(R)); } catch (e) { /* 저장 불가 */ } }
  const saveR = () => { try { localStorage.setItem(RK, JSON.stringify(R)); } catch (e) { /* 저장 불가 */ } };

  async function sha(s) {
    try { const b = new TextEncoder().encode(s), h = await crypto.subtle.digest('SHA-256', b); return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join(''); }
    catch (e) { let a = 5381; for (let i = 0; i < s.length; i++) a = ((a << 5) + a + s.charCodeAt(i)) | 0; return 'x' + (a >>> 0).toString(16); }
  }
  const salt = () => Math.random().toString(36).slice(2, 10);
  const hashPw = async (pw, s) => sha(s + '|' + pw);
  const key = (code, no) => code + '-' + no;
  const normNo = n => String(parseInt(String(n).replace(/\D/g, ''), 10) || '');
  const normName = n => String(n || '').replace(/\s+/g, '').trim();
  const normCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  function audit(role, id, act) { R.audit.unshift({ t: Date.now(), role, id, act }); if (R.audit.length > 300) R.audit.length = 300; saveR(); }
  function setSession(o) { try { sessionStorage.setItem('ecoai.session', JSON.stringify(o)); } catch (e) { /* 세션 저장 불가 */ } }
  function clearSession() { try { sessionStorage.removeItem('ecoai.session'); sessionStorage.removeItem('ecoai.welcomed'); sessionStorage.removeItem('ecoai.loginlogged'); sessionStorage.removeItem('ecoai.landed'); } catch (e) { } }
  const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const newCode = () => { let c; do { c = Array.from({ length: 6 }, () => CODE_CH[Math.random() * CODE_CH.length | 0]).join(''); } while (R.classes[c]); return c; };
  const cloudOn = () => !!(Eco.cloud && Eco.cloud.enabled);

  const A = Eco.auth = {
    R: () => R, saveR, normNo, normName, normCode, audit,
    session: () => Eco.session,
    setSession,
    role: () => (Eco.session && Eco.session.role) || null,

    /* ── 관리자 ── */
    hasAdmin: () => !!R.admin,
    async setupAdmin(pw) { if (R.admin) return false; const s = salt(); R.admin = { salt: s, hash: await hashPw(pw, s) }; audit('admin', 'admin', '관리자 계정 생성'); saveR(); return true; },
    async loginAdmin(pw) { if (!R.admin) return false; const ok = (await hashPw(pw, R.admin.salt)) === R.admin.hash; audit('admin', 'admin', ok ? '관리자 로그인' : '관리자 로그인 실패'); if (ok) setSession({ role: 'admin', id: 'admin', name: '관리자' }); return ok; },
    async changeAdminPw(oldPw, newPw) { if ((await hashPw(oldPw, R.admin.salt)) !== R.admin.hash) return false; const s = salt(); R.admin = { salt: s, hash: await hashPw(newPw, s) }; audit('admin', 'admin', '관리자 비밀번호 변경'); saveR(); return true; },

    /* ── 교사 ── */
    listTeachers: () => Object.values(R.teachers),
    async createTeacher(id, name, pw) { id = String(id).trim(); if (!/^[A-Za-z0-9._-]{3,20}$/.test(id)) return '아이디는 영문·숫자 3~20자로 입력해 주세요.'; if (R.teachers[id]) return '이미 있는 아이디예요.'; if (String(pw).length < 4) return '비밀번호는 4자 이상이에요.'; const s = salt(); R.teachers[id] = { id, name: name || id, salt: s, hash: await hashPw(pw, s), created: Date.now() }; audit('admin', 'admin', '교사 계정 생성: ' + id); saveR(); return ''; },
    async resetTeacherPw(id, pw) { const t = R.teachers[id]; if (!t) return false; t.salt = salt(); t.hash = await hashPw(pw, t.salt); audit('admin', 'admin', '교사 비밀번호 재설정: ' + id); saveR(); return true; },
    deleteTeacher(id) { delete R.teachers[id]; Object.values(R.classes).forEach(c => { if (c.teacherId === id) c.teacherId = ''; }); audit('admin', 'admin', '교사 계정 삭제: ' + id); saveR(); },
    async loginTeacher(id, pw) { const t = R.teachers[String(id).trim()]; if (!t) { audit('teacher', id, '교사 로그인 실패(없는 아이디)'); return false; } const ok = (await hashPw(pw, t.salt)) === t.hash; audit('teacher', t.id, ok ? '교사 로그인' : '교사 로그인 실패'); if (ok) setSession({ role: 'teacher', id: t.id, name: t.name }); return ok; },
    async changeTeacherPw(id, oldPw, newPw) { const t = R.teachers[id]; if (!t || (await hashPw(oldPw, t.salt)) !== t.hash) return false; t.salt = salt(); t.hash = await hashPw(newPw, t.salt); saveR(); return true; },

    /* ── 학급 ── */
    listClasses(teacherId) { return Object.values(R.classes).filter(c => !teacherId || c.teacherId === teacherId).sort((a, b) => (a.grade - b.grade) || (a.cls - b.cls) || a.created - b.created); },
    getClass: code => R.classes[normCode(code)] || null,
    createClass({ grade, cls, name, teacherId }) { const code = newCode(); R.classes[code] = { code, grade: +grade || 0, cls: +cls || 0, name: name || ((+grade || '') + '학년 ' + (+cls || '') + '반'), teacherId: teacherId || '', created: Date.now(), settings: { selfRegister: true, requirePin: false } }; audit(Eco.session ? Eco.session.role : '-', Eco.session ? Eco.session.id : '-', '학급 생성 ' + code); saveR(); cloudOn() && Eco.cloud.pushClass(R.classes[code]); return code; },
    updateClass(code, patch) { Object.assign(R.classes[code], patch); saveR(); cloudOn() && Eco.cloud.pushClass(R.classes[code]); },
    updateClassSettings(code, patch) { Object.assign(R.classes[code].settings, patch); saveR(); cloudOn() && Eco.cloud.pushClass(R.classes[code]); },
    deleteClass(code) { Object.keys(R.students).filter(k => R.students[k].code === code).forEach(k => A.removeStudent(R.students[k].code, R.students[k].no, true)); delete R.classes[code]; audit(Eco.session.role, Eco.session.id, '학급 삭제 ' + code); saveR(); },

    /* ── 학생 명단 ── */
    listStudents(code) { return Object.values(R.students).filter(s => s.code === code).sort((a, b) => a.no - b.no); },
    getStudent: (code, no) => R.students[key(code, no)] || null,
    addStudent(code, no, name) { no = normNo(no); name = String(name || '').trim(); if (!no || !name) return '번호와 이름을 입력해 주세요.'; const k = key(code, no); if (R.students[k]) return no + '번은 이미 있어요.'; R.students[k] = { code, no: +no, name, created: Date.now(), last: 0, summary: null }; saveR(); return ''; },
    bulkAdd(code, text) { let ok = 0, skip = []; String(text).split(/\r?\n/).forEach(line => { const m = line.trim().match(/^(\d+)\s*[,\t .번 ]\s*(.+)$/); if (!m) { if (line.trim()) skip.push(line.trim()); return; } const r = A.addStudent(code, m[1], m[2]); if (r) skip.push(line.trim() + ' (' + r + ')'); else ok++; }); return { ok, skip }; },
    renameStudent(code, no, name) { const s = R.students[key(code, no)]; if (!s) return; s.name = name; try { const st = A.getState(code, no); if (st) { st.name = name; if (st.identity) st.identity.name = name; A.setState(code, no, st); } } catch (e) { } saveR(); },
    removeStudent(code, no, silent) { const k = key(code, no); delete R.students[k]; delete R.comments[k]; try { localStorage.removeItem(Eco.studentKey(code, no)); } catch (e) { } if (!silent) { audit(Eco.session.role, Eco.session.id, '학생 삭제 ' + k); saveR(); } cloudOn() && Eco.cloud.deleteStudent(code, no); },
    resetStudent(code, no) { try { localStorage.removeItem(Eco.studentKey(code, no)); } catch (e) { } const s = R.students[key(code, no)]; if (s) { s.summary = null; s.last = 0; } audit(Eco.session.role, Eco.session.id, '학생 기록 초기화 ' + key(code, no)); saveR(); },
    setPin(code, no, pin) { const s = R.students[key(code, no)]; if (s) { if (pin) s.pin = pin; else delete s.pin; saveR(); } },
    getState(code, no) { try { return JSON.parse(localStorage.getItem(Eco.studentKey(code, no)) || 'null'); } catch (e) { return null; } },
    setState(code, no, st) { try { localStorage.setItem(Eco.studentKey(code, no), JSON.stringify(st)); } catch (e) { } },

    /* ── 학생 로그인 ── */
    async loginStudent({ code, no, name, pin }) {
      code = normCode(code); no = normNo(no); const nm = String(name || '').trim();
      if (!code || !no || !nm) return { ok: false, msg: '학급 코드, 번호, 이름을 모두 입력해 주세요.' };
      let cls = R.classes[code];
      if (!cls && cloudOn()) { try { cls = await Eco.cloud.fetchClass(code); if (cls) { R.classes[code] = cls; saveR(); } } catch (e) { /* 네트워크 오류 */ } }
      if (!cls) return { ok: false, msg: '학급 코드를 찾을 수 없어요. 선생님께 받은 코드를 확인해 주세요.' };
      const k = key(code, no); let s = R.students[k];
      if (!s && cloudOn()) { try { const d = await Eco.cloud.fetchStudent(code, no); if (d) { s = R.students[k] = { code, no: +no, name: d.name, created: Date.now(), last: 0, summary: d.summary || null, pin: d.pin }; if (d.state) A.setState(code, no, d.state); saveR(); } } catch (e) { } }
      if (s) {
        if (normName(s.name) !== normName(nm)) { audit('student', k, '로그인 실패(이름 불일치)'); return { ok: false, msg: no + '번의 이름이 달라요. 이름을 다시 확인하거나 선생님께 알려 주세요.' }; }
      } else {
        if (!cls.settings.selfRegister) return { ok: false, msg: '명단에 없는 번호예요. 선생님께 확인해 주세요.' };
        s = R.students[k] = { code, no: +no, name: nm, created: Date.now(), last: 0, summary: null };
      }
      if (cls.settings.requirePin) {
        if (!/^\d{4}$/.test(String(pin || ''))) return { ok: false, needPin: true, msg: s.pin ? '비밀번호(숫자 4자리)를 입력해 주세요.' : '처음이에요! 나만의 숫자 4자리 비밀번호를 정해 주세요.' };
        const ph = await sha(k + '|' + pin);
        if (s.pin && s.pin !== ph) { audit('student', k, '로그인 실패(비밀번호)'); return { ok: false, needPin: true, msg: '비밀번호가 맞지 않아요.' }; }
        s.pin = ph;
      }
      s.last = Date.now(); saveR();
      A.pushRecent({ code, no: +no, name: s.name, cls: cls.name });
      setSession({ role: 'student', code, no: +no, name: s.name, cls: cls.name });
      audit('student', k, '학생 로그인');
      return { ok: true };
    },
    pushRecent(o) { try { const L = JSON.parse(localStorage.getItem('ecoai.recent') || '[]').filter(x => !(x.code === o.code && x.no === o.no)); L.unshift(o); localStorage.setItem('ecoai.recent', JSON.stringify(L.slice(0, 12))); } catch (e) { } },
    recent() { try { return JSON.parse(localStorage.getItem('ecoai.recent') || '[]'); } catch (e) { return []; } },
    guest() { setSession({ role: 'guest', name: '게스트' }); },
    logout() { const r = A.role(); if (r) audit(r, (Eco.session && (Eco.session.id || (Eco.session.code + '-' + Eco.session.no))) || '-', '로그아웃'); clearSession(); },

    /* ── 학생 → 요약 동기화 ── */
    _timer: null,
    afterSave(S) {
      clearTimeout(A._timer);
      A._timer = setTimeout(() => {
        const id = S.identity; if (!id) return; const k = key(id.code, id.no); const s = R.students[k]; if (!s) return;
        s.summary = Eco.summarize(S); s.last = Date.now(); saveR();
        cloudOn() && Eco.cloud.pushStudent(id.code, id.no, s.name, S, s.summary, s.pin);
      }, 1500);
    },

    /* ── 교사 → 학생 메시지 ── */
    addComment(code, no, c) { const k = key(code, no); (R.comments[k] = R.comments[k] || []).unshift(Object.assign({ t: Date.now(), read: false }, c)); R.comments[k].length = Math.min(R.comments[k].length, 50); saveR(); cloudOn() && Eco.cloud.pushComments(code, no, R.comments[k]); },
    comments: (code, no) => R.comments[key(code, no)] || [],
    markRead(code, no) { const L = R.comments[key(code, no)]; if (L && L.some(c => !c.read)) { L.forEach(c => c.read = true); saveR(); } },

    /* ── 백업/복원 ── */
    exportAll() { const states = {}; Object.values(R.students).forEach(s => { const st = A.getState(s.code, s.no); if (st) states[key(s.code, s.no)] = st; }); return { v: 1, exportedAt: Date.now(), registry: R, states }; },
    importAll(obj) { if (!obj || !obj.registry || obj.registry.v !== 1) return false; R = obj.registry; Object.keys(blank()).forEach(k => { if (!(k in R)) R[k] = blank()[k]; }); saveR(); Object.entries(obj.states || {}).forEach(([k, st]) => { try { localStorage.setItem('ecoai.s.' + k, JSON.stringify(st)); } catch (e) { } }); return true; },
    wipeAll() { Object.keys(localStorage).filter(k => k.startsWith('ecoai.')).forEach(k => localStorage.removeItem(k)); R = blank(); R.admin = DEFAULT_ADMIN; saveR(); }
  };

  /* 로그인 직후 학생 상태를 보정 (store 모듈이 먼저 로드되었으므로 여기서 한 번 더) */
  const ses = Eco.session;
  if (ses && ses.role === 'student') {
    const S = Eco.store.get();
    if (!S.identity || S.identity.code !== ses.code || S.identity.no !== ses.no) { S.identity = { code: ses.code, no: ses.no, name: ses.name }; }
    S.name = ses.name; if (!S.created) S.created = Date.now();
    let first = false; try { first = !sessionStorage.getItem('ecoai.loginlogged'); sessionStorage.setItem('ecoai.loginlogged', '1'); } catch (e) { }
    if (first) { Eco.store.logEvent('login', '로그인'); }
    else Eco.store.save();
    // 교사가 로그아웃된 이후의 이어 하기: 요약이 비어 있으면 채움
    A.afterSave(S);
  }
})(window.Eco);
