/* 선택 기능: Firebase(Firestore + Auth) 동기화. 설정이 없으면 비활성(로컬 모드).
 * 교사·관리자는 이메일 없이 로그인합니다. (내부적으로 아이디를 '아이디@teacher.ecoai.app' 형태의 가상 이메일로 변환)
 *  - 관리자: 비밀번호만 입력 (고정 계정 admin@ecoai.app)
 *  - 교사: 아이디 + 비밀번호, 가입 시 '교사 가입 코드' 필요 (코드 검증은 Firestore 보안 규칙이 서버에서 수행)
 * ⚠ 학생·교사 흐름은 실제 프로젝트로 일부만 시험했습니다. 시험 학급으로 먼저 확인하세요. */
window.Eco = window.Eco || {};
(function (Eco) {
  const cfg = window.ECO_FIREBASE;
  const C = Eco.cloud = { enabled: !!(cfg && cfg.apiKey && cfg.projectId), lastError: '', status: cfg ? '연결 준비 중' : '꺼짐(로컬 모드)' };
  if (!C.enabled) return;
  const ADMIN_EMAIL = 'admin@ecoai.app';
  const teacherEmail = id => String(id).trim().toLowerCase() + '@teacher.ecoai.app';
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  let fb, db, auth;
  const load = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('SDK 로드 실패: ' + src)); document.head.append(s); });
  C.ready = (async () => {
    await load(SDK + 'firebase-app-compat.js'); await load(SDK + 'firebase-auth-compat.js'); await load(SDK + 'firebase-firestore-compat.js');
    fb = window.firebase; fb.initializeApp(cfg); auth = fb.auth(); db = fb.firestore();
    try { await auth.setPersistence(fb.auth.Auth.Persistence.SESSION); } catch (e) { /* 지원하지 않으면 기본값 */ }
    C.status = '연결됨';
    await new Promise(r => { const u = auth.onAuthStateChanged(() => { u(); r(); }); });
  })().catch(e => { C.lastError = String(e.message || e); C.status = '오류'; C.enabled = false; });
  const msg = e => { const c = e && e.code || ''; return ({
    'auth/email-already-in-use': '이미 있는 아이디예요.', 'auth/invalid-credential': '아이디 또는 비밀번호가 맞지 않아요.', 'auth/wrong-password': '아이디 또는 비밀번호가 맞지 않아요.', 'auth/user-not-found': '아이디 또는 비밀번호가 맞지 않아요.',
    'auth/weak-password': '비밀번호는 6자 이상이어야 해요.', 'auth/operation-not-allowed': 'Firebase 콘솔에서 ‘이메일/비밀번호’ 로그인을 켜 주세요.', 'auth/too-many-requests': '시도가 너무 많아요. 잠시 뒤 다시 해 주세요.',
    'permission-denied': '권한이 없어요. (가입 코드가 다르거나 규칙이 맞지 않아요)' }[c]) || String(e && e.message || e); };
  const guard = async fn => { try { await C.ready; if (!C.enabled) return null; return await fn(); } catch (e) { C.lastError = msg(e); return null; } };
  const ensureAnon = async () => { if (!auth.currentUser) await auth.signInAnonymously(); };
  const isStaff = () => !!auth.currentUser && !auth.currentUser.isAnonymous;
  const D = (...p) => db.doc(p.join('/'));

  Object.assign(C, {
    ADMIN_EMAIL,
    /* ── 관리자: 비밀번호만 ── */
    adminSignIn: pw => guard(async () => { await auth.signInWithEmailAndPassword(ADMIN_EMAIL, pw); return 'admin'; }),
    adminCreate: pw => guard(async () => { if (String(pw).length < 6) throw { code: 'auth/weak-password' }; await auth.createUserWithEmailAndPassword(ADMIN_EMAIL, pw); return 'admin'; }),
    adminChangePw: (oldPw, newPw) => guard(async () => { if (String(newPw).length < 6) throw { code: 'auth/weak-password' }; const u = auth.currentUser; await u.reauthenticateWithCredential(fb.auth.EmailAuthProvider.credential(ADMIN_EMAIL, oldPw)); await u.updatePassword(newPw); return true; }),
    getTeacherCode: () => guard(async () => { const d = await D('config', 'codes').get(); return d.exists ? (d.data().teacher || '') : ''; }),
    setTeacherCode: code => guard(async () => { await D('config', 'codes').set({ teacher: String(code).trim() }, { merge: true }); return true; }),
    /* ── 교사: 아이디 + 비밀번호 (+ 가입 코드) ── */
    teacherSignUp: (id, pw, code, name) => guard(async () => {
      id = String(id).trim(); if (!/^[A-Za-z0-9._-]{3,20}$/.test(id)) throw new Error('아이디는 영문·숫자 3~20자로 입력해 주세요.');
      const cred = await auth.createUserWithEmailAndPassword(teacherEmail(id), pw);
      try { await D('teachers', cred.user.uid).set({ id, name: name || id, code: String(code).trim(), created: Date.now() }); }
      catch (e) { try { await cred.user.delete(); } catch (x) { /* 정리 실패 */ } throw new Error('가입 코드가 달라요. 선생님들께 받은 코드를 확인해 주세요.'); }
      return { id, name: name || id };
    }),
    teacherSignIn: (id, pw) => guard(async () => {
      const cred = await auth.signInWithEmailAndPassword(teacherEmail(id), pw);
      const d = await D('teachers', cred.user.uid).get();
      if (!d.exists) { await auth.signOut(); throw new Error('교사 등록이 해제된 계정이에요. 관리자에게 문의하세요.'); }
      return { id: d.data().id, name: d.data().name };
    }),
    listTeachers: () => guard(async () => { const s = await db.collection('teachers').get(); return s.docs.map(d => Object.assign({ uid: d.id }, d.data())); }),
    removeTeacher: uid => guard(async () => { await D('teachers', uid).delete(); return true; }),
    signOut: () => guard(() => auth.signOut()),
    /* ── 학급·학생 동기화 ── */
    pushClass: cls => guard(async () => { if (!isStaff()) return; await D('classes', cls.code).set(cls, { merge: true }); }),
    fetchClass: code => guard(async () => { await ensureAnon(); const d = await D('classes', code).get(); return d.exists ? d.data() : null; }),
    pushStudent: (code, no, name, state, summary, pin) => guard(async () => { await ensureAnon(); await D('classes', code, 'students', String(no)).set({ no, name, summary, pin: pin || null, state: JSON.stringify(state), updatedAt: Date.now() }); }),
    fetchStudent: (code, no) => guard(async () => { await ensureAnon(); const d = await D('classes', code, 'students', String(no)).get(); if (!d.exists) return null; const x = d.data(); return { name: x.name, summary: x.summary, pin: x.pin, state: x.state ? JSON.parse(x.state) : null }; }),
    deleteStudent: (code, no) => guard(async () => { if (!isStaff()) return; await D('classes', code, 'students', String(no)).delete(); }),
    pullClass: code => guard(async () => {
      if (!isStaff()) throw new Error('교사 계정으로 로그인해야 가져올 수 있어요.');
      const R = Eco.auth.R(); const snap = await db.collection('classes').doc(code).collection('students').get(); let n = 0;
      snap.forEach(d => { const x = d.data(), k = code + '-' + x.no, local = R.students[k]; const st = x.state ? JSON.parse(x.state) : null;
        const localSt = Eco.auth.getState(code, x.no); const localT = localSt && localSt.events && localSt.events[0] ? localSt.events[0].t : 0, cloudT = st && st.events && st.events[0] ? st.events[0].t : 0;
        if (!local) R.students[k] = { code, no: x.no, name: x.name, created: Date.now(), last: x.updatedAt || 0, summary: x.summary || null, pin: x.pin || undefined };
        if (st && cloudT >= localT) { Eco.auth.setState(code, x.no, st); R.students[k].summary = x.summary || R.students[k].summary; R.students[k].last = x.updatedAt || R.students[k].last; n++; } });
      Eco.auth.saveR(); return n;
    }),
    /** 교사: 내 학급 목록을 가져오기 / 관리자: 전체 학급 */
    pullClassesFor: teacherId => guard(async () => { const R = Eco.auth.R(); const q = teacherId ? db.collection('classes').where('teacherId', '==', teacherId) : db.collection('classes'); const snap = await q.get(); let n = 0; snap.forEach(d => { if (!R.classes[d.id]) n++; R.classes[d.id] = d.data(); }); Eco.auth.saveR(); return n; }),
    pushComments: (code, no, list) => guard(async () => { if (!isStaff()) return; await D('classes', code, 'comments', String(no)).set({ list: JSON.stringify(list), updatedAt: Date.now() }); }),
    fetchComments: (code, no) => guard(async () => { await ensureAnon(); const d = await D('classes', code, 'comments', String(no)).get(); return d.exists ? JSON.parse(d.data().list) : null; })
  });
})(window.Eco);
