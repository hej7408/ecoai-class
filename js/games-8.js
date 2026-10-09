/* 메타버스 게임: 숲속탐험대 월드 — 로블록스 어드벤처처럼 열린 숲을 자유롭게 돌아다니며 NPC 미션을 해결하는 3D 게임 */
(function (Eco) {
  const { h } = Eco.ui;
  const TRASH = { plastic: ['🥤', '플라스틱', 0x4aa8e8], paper: ['📰', '종이', 0xf2d04a], can: ['🥫', '캔', 0xe8506f], general: ['🍌', '일반쓰레기', 0x8a8f96] };
  const BINS = [['plastic', -4.5], ['paper', -1.5], ['can', 1.5], ['general', 4.5]];
  const ANIMALS = [['🐿️', '다람쥐', '도토리를 땅에 묻어 두었다가 잊어버려요. 그 도토리가 싹이 터서 새 나무가 되기도 해요!', -8, 21], ['🐇', '토끼', '풀과 새싹을 먹는 초식동물이에요. 깨끗하고 넓은 풀밭을 좋아해요.', 30, 20], ['🐸', '개구리', '깨끗한 물에서만 살아요. 개구리가 있으면 물이 건강하다는 신호예요!', 16, -20], ['🐦', '딱따구리', '나무줄기를 쪼아 속에 사는 벌레를 잡아먹어요. 숲의 의사라고 불려요.', -31, -24], ['🦌', '고라니', '풀숲에서 조용히 살아요. 사람 소리에 깜짝 놀라 도망가니 멀리서 살짝 지켜봐요.', 8, -33], ['🦋', '나비', '꽃에서 꽃으로 날아다니며 꽃가루를 옮겨 줘요. 꽃이 많아야 나비도 많아져요.', -4, 33]];
  const PATCHES = [[-16, 16], [-22, 20], [-28, 13], [-18, 27]];
  const POND = { x: 25, z: -14, r: 7 };
  const SORT = 12, TREES = 4, PONDN = 5;

  function emoji(e, s = 1.2) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.font = '92px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 64, 70); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true })); sp.scale.set(s, s, 1); return sp; }
  function label(text, color = '#fff', scale = 4) { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.font = 'bold 34px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 6; x.strokeStyle = 'rgba(0,0,0,.7)'; x.strokeText(text, 128, 34); x.fillStyle = color; x.fillText(text, 128, 34); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false })); s.scale.set(scale, scale / 4, 1); return s; }

  function build(retry) {
    const name = (Eco.store.get().name || '탐험가').slice(0, 8); const cl = (v, a, b) => Math.max(a, Math.min(b, v)); const lerpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
    let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const wrap = h('div', { style: { position: 'relative', aspectRatio: '16/9', background: '#bfc7b0', borderRadius: '16px', overflow: 'hidden', userSelect: 'none' } });
    const renderer = new THREE.WebGLRenderer({ antialias: true }); const cv = renderer.domElement; cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;border-radius:0;max-width:none'; wrap.append(cv);
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0xbfc7b0); scene.fog = new THREE.Fog(0xbfc7b0, 35, 95); const cam = new THREE.PerspectiveCamera(60, 16 / 9, .1, 200);
    scene.add(new THREE.AmbientLight(0xffffff, .72)); const sun = new THREE.DirectionalLight(0xffffff, .7); sun.position.set(20, 40, 15); scene.add(sun);
    const box = (w, hh, d, c) => new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), new THREE.MeshLambertMaterial({ color: c }));
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x9c9a5a }); const ground = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), grassMat); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x7d8a5c }); const trunkMat = new THREE.MeshLambertMaterial({ color: 0x7a4d2a });
    const circles = [], boxes = []; /* 충돌 */
    const excl = [[0, 0, 12], [-20, -4, 7], [POND.x, POND.z, POND.r + 4], ...PATCHES.map(p => [p[0], p[1], 4])];
    const okSpot = (x, z, m = 0) => !excl.some(e => Math.hypot(x - e[0], z - e[1]) < e[2] + m);

    /* 나무 (인스턴스) */
    const NT = 150, trunks = new THREE.InstancedMesh(new THREE.BoxGeometry(.6, 2.6, .6), trunkMat, NT), leaves1 = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 1.9, 2.6), leafMat, NT), leaves2 = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 1.4, 1.7), leafMat, NT); const M = new THREE.Matrix4(); let n = 0;
    while (n < NT) { const x = (rnd() - .5) * 90, z = (rnd() - .5) * 90; if (!okSpot(x, z) || circles.some(c => Math.hypot(c[0] - x, c[1] - z) < 3)) continue; const s = .8 + rnd() * .7; M.makeScale(s, s, s).setPosition(x, 1.3 * s, z); trunks.setMatrixAt(n, M); M.makeScale(s, s, s).setPosition(x, 3.3 * s, z); leaves1.setMatrixAt(n, M); M.makeScale(s, s, s).setPosition(x, 4.75 * s, z); leaves2.setMatrixAt(n, M); circles.push([x, z, .9 * s]); n++; }
    scene.add(trunks, leaves1, leaves2);
    /* 꽃 (진행도에 따라 늘어남) */
    const NF = 220, flowers = new THREE.InstancedMesh(new THREE.BoxGeometry(.35, .35, .35), new THREE.MeshLambertMaterial({ color: 0xffffff }), NF); const fc = new THREE.Color(); for (let i = 0; i < NF; i++) { let x, z; do { x = (rnd() - .5) * 90; z = (rnd() - .5) * 90; } while (!okSpot(x, z, -3)); M.makeTranslation(x, .2, z); flowers.setMatrixAt(i, M); flowers.setColorAt(i, fc.setHex([0xff6b8a, 0xffd93d, 0xffffff, 0xb58cff][i % 4])); } flowers.count = 0; scene.add(flowers);
    /* 마을 · 학교 · 묘목장 */
    const school = box(8, 4, 5, 0xf2e6c8); school.position.set(0, 2, -6); const roof = box(8.6, .8, 5.6, 0xc0504d); roof.position.set(0, 4.4, -6); scene.add(school, roof); boxes.push([-4, -8.5, 4, -3.5]); const sl = label('🏫 숲속학교', '#fff', 6); sl.position.set(0, 6.4, -6); scene.add(sl);
    const hut = box(4, 2.6, 4, 0xb98a55), hroof = box(4.6, .6, 4.6, 0x6b4f2c); hut.position.set(-22, 1.3, -4); hroof.position.set(-22, 2.9, -4); scene.add(hut, hroof); boxes.push([-24, -6, -20, -2]); const hl = label('🌱 묘목장', '#fff', 5); hl.position.set(-22, 4.6, -4); scene.add(hl);
    BINS.forEach(([t, x]) => { const b = box(1.3, 1.6, 1.3, TRASH[t][2]); b.position.set(x, .8, 6); scene.add(b); const l = label(TRASH[t][0] + TRASH[t][1], '#fff', 3.4); l.position.set(x, 2.6, 6); scene.add(l); circles.push([x, 6, .9]); });
    /* 연못 */
    const pondM = new THREE.MeshLambertMaterial({ color: 0x5a4a2a }); const pond = new THREE.Mesh(new THREE.CircleGeometry(POND.r, 32), pondM); pond.rotation.x = -Math.PI / 2; pond.position.set(POND.x, .03, POND.z); scene.add(pond);
    const pl = label('💧 연못', '#cff', 4); pl.position.set(POND.x, 2.2, POND.z); scene.add(pl);
    /* 시든 땅 (나무 심는 곳) */
    const patches = PATCHES.map(([x, z]) => { const d = new THREE.Mesh(new THREE.CircleGeometry(1.6, 16), new THREE.MeshLambertMaterial({ color: 0x6b4f2c })); d.rotation.x = -Math.PI / 2; d.position.set(x, .04, z); scene.add(d); return { x, z, state: 0, obj: null, grow: 0, disc: d }; });
    const pLabel = label('🌱 시든 땅 · 나무를 심어요', '#ffe', 5); pLabel.position.set(-21, 3, 19); scene.add(pLabel);
    /* 구름 */
    const clouds = []; for (let i = 0; i < 16; i++) { const c = box(7 + rnd() * 6, 1.3, 3 + rnd() * 3, 0xffffff); c.material.transparent = true; c.material.opacity = .7; c.position.set((rnd() - .5) * 140, 28 + rnd() * 10, (rnd() - .5) * 140); scene.add(c); clouds.push(c); }
    /* NPC */
    const npc = (e, x, z, nm) => { const g = new THREE.Group(); const sp = emoji(e, 2.4); sp.position.y = 1.5; g.add(sp); const l = label(nm, '#ffe14d', 4); l.position.y = 3.3; g.add(l); g.position.set(x, 0, z); scene.add(g); circles.push([x, z, .8]); return { g, x, z, sp }; };
    const owl = npc('🦉', 5, -1, '숲 해설사 부엉이'), bear = npc('🐻', -18, -4, '정원사 곰');
    /* 쓰레기 */
    const items = []; const tKeys = Object.keys(TRASH);
    const addTrash = (x, z, t, pondItem) => { const T = TRASH[t]; const g = new THREE.Group(); const m = box(.6, .6, .6, T[2]); m.position.y = .35; g.add(m); const sp = emoji(T[0], 1); sp.position.y = 1.3; g.add(sp); g.position.set(x, 0, z); scene.add(g); items.push({ g, x, z, t, pond: pondItem, got: 0 }); };
    for (let i = 0; i < 14; i++) { let x, z; do { x = (rnd() - .5) * 76; z = (rnd() - .5) * 76; } while (!okSpot(x, z, 1) || circles.some(c => Math.hypot(c[0] - x, c[1] - z) < 2)); addTrash(x, z, tKeys[i % 4], false); }
    for (let i = 0; i < PONDN; i++) { const a = i / PONDN * 6.28 + .4, rr = POND.r + 1.3 + (i % 2) * .8; addTrash(POND.x + Math.cos(a) * rr, POND.z + Math.sin(a) * rr, ['plastic', 'can', 'general'][i % 3], true); }
    /* 동물 */
    const animals = ANIMALS.map(a => { const sp = emoji(a[0], 1.6); sp.position.set(a[3], 1, a[4]); scene.add(sp); return { a, sp, x: a[3], z: a[4], found: 0, ph: rnd() * 6 }; });
    /* 아바타 */
    const hero = new THREE.Group(); const torso = box(.9, .8, .5, 0x3fae4a); torso.position.y = 1.1; const fcv = document.createElement('canvas'); fcv.width = fcv.height = 64; const fx = fcv.getContext('2d'); fx.fillStyle = '#ffd9a6'; fx.fillRect(0, 0, 64, 64); fx.fillStyle = '#222'; fx.fillRect(18, 22, 6, 10); fx.fillRect(40, 22, 6, 10); fx.lineWidth = 4; fx.strokeStyle = '#222'; fx.beginPath(); fx.arc(32, 36, 14, .15 * Math.PI, .85 * Math.PI); fx.stroke();
    const sk = new THREE.MeshLambertMaterial({ color: 0xffd9a6 }); const head = new THREE.Mesh(new THREE.BoxGeometry(.55, .55, .55), [sk, sk, sk, sk, new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(fcv) }), sk]); head.position.y = 1.78; const cap = box(.62, .2, .62, 0xe0861f); cap.position.y = 2.1;
    const limb = (w, len, c, px, py) => { const g = new THREE.Group(); const m = box(w, len, w, c); m.position.y = -len / 2; g.add(m); g.position.set(px, py, 0); return g; };
    const armL = limb(.3, .8, 0xffd9a6, -.62, 1.48), armR = limb(.3, .8, 0xffd9a6, .62, 1.48), legL = limb(.4, .7, 0x6b4f2c, -.22, .7), legR = limb(.4, .7, 0x6b4f2c, .22, .7);
    hero.add(torso, head, cap, armL, armR, legL, legR); const tag = label(name, '#fff', 3); tag.position.y = 2.9; hero.add(tag); scene.add(hero);
    const backpack = box(.7, .8, .3, 0x8a5a2a); backpack.position.set(0, 1.15, -.4); hero.add(backpack);

    /* 상태 */
    const S = { x: 0, y: 0, z: 9, vy: 0, bag: [], seed: 0, water: 0, sorted: 0, pondDone: 0, grown: 0, found: 0, wrong: 0, t: 0, dlg: null, finished: 0, intro: 0, ending: 0 };
    Eco._fw = S; S.items = items; S.animals = animals; const K = { l: 0, r: 0, u: 0, d: 0, j: 0 }; const km = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd', ' ': 'j' };
    let yaw = 0, pitch = .45, dist = 10, T = 0, raf, last = performance.now(), frame = 0, nearest = null; const chat = []; const say = (m, c = '#fff') => chat.push({ m, c, t: performance.now() });
    const vitality = () => (Math.min(S.sorted, SORT) / SORT + Math.min(S.grown, TREES) / TREES + S.pondDone / PONDN + S.found / ANIMALS.length) / 4;
    const missions = () => [['🗑️ 쓰레기를 주워 올바른 분리배출함에 버려요', Math.min(S.sorted, SORT), SORT], ['🌳 묘목을 심고 물을 줘서 나무 키우기', S.grown, TREES], ['💧 연못 쓰레기를 치워 물을 맑게', S.pondDone, PONDN], ['🔎 숨은 동물 친구 찾기', S.found, ANIMALS.length]];
    const allDone = () => missions().every(m => m[1] >= m[2]);

    /* HUD */
    const panel = css => h('div', { style: Object.assign({ position: 'absolute', background: 'rgba(20,20,20,.55)', color: '#fff', borderRadius: '10px', padding: '6px 10px', fontSize: '.78rem', lineHeight: 1.45, pointerEvents: 'none', fontWeight: 600 }, css) });
    const quest = panel({ left: '8px', top: '8px', maxWidth: '46%' }), inv = panel({ right: '8px', top: '8px', minWidth: '120px' }), chatEl = panel({ left: '8px', bottom: '8px', maxWidth: '55%', background: 'rgba(20,20,20,.35)', fontWeight: 500 });
    const mini = h('canvas', { width: 120, height: 120, style: { position: 'absolute', right: '8px', top: '96px', width: '96px', height: '96px', borderRadius: '10px', background: 'rgba(20,40,20,.55)', border: '2px solid rgba(255,255,255,.5)', maxWidth: 'none', margin: 0 } }); const mg = mini.getContext('2d');
    const prompt = h('button.btn', { style: { position: 'absolute', left: '50%', bottom: '14%', transform: 'translateX(-50%)', display: 'none' }, onclick: () => act() }); const dlgEl = h('div', { style: { position: 'absolute', left: '8%', right: '8%', bottom: '8%', background: '#fff', color: '#23311f', borderRadius: '16px', padding: '12px 16px', display: 'none', boxShadow: '0 6px 20px rgba(0,0,0,.4)' } });
    const banner = h('div', { style: { position: 'absolute', left: 0, right: 0, top: '30%', textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: '1.8rem', textShadow: '0 2px 8px #000', pointerEvents: 'none', transition: 'opacity .6s', opacity: 0 } }); const result = h('div', { style: { position: 'absolute', inset: 0, display: 'none', placeItems: 'center', background: 'rgba(0,0,0,.55)', color: '#fff', textAlign: 'center' } });
    const fsBtn = h('button', { style: { position: 'absolute', right: '8px', bottom: '8px', border: 0, borderRadius: '8px', padding: '4px 8px', background: 'rgba(20,20,20,.55)', color: '#fff', cursor: 'pointer' }, onclick: () => { if (document.fullscreenElement) document.exitFullscreen(); else wrap.requestFullscreen && wrap.requestFullscreen(); } }, '⛶');
    wrap.append(quest, inv, mini, chatEl, banner, prompt, dlgEl, result, fsBtn); const showBanner = t => { banner.textContent = t; banner.style.opacity = 1; setTimeout(() => { banner.style.opacity = 0; }, 2400); };
    const ro = new ResizeObserver(() => { const w = wrap.clientWidth, hh = wrap.clientHeight; if (!w || !hh) return; renderer.setSize(w, hh, false); cam.aspect = w / hh; cam.updateProjectionMatrix(); }); ro.observe(wrap);
    const onFs = () => { const f = document.fullscreenElement === wrap; wrap.style.aspectRatio = f ? 'auto' : '16/9'; wrap.style.height = f ? '100vh' : ''; wrap.style.borderRadius = f ? '0' : '16px'; }; document.addEventListener('fullscreenchange', onFs);

    /* 대화 */
    const talk = (nm, em, lines, cb) => { let i = 0; S.dlg = true; const show = () => { dlgEl.style.display = 'block'; dlgEl.innerHTML = ''; dlgEl.append(h('div', { style: { fontWeight: 800, marginBottom: '4px' } }, em + ' ' + nm), h('div', { style: { fontSize: '1rem' } }, lines[i]), h('div', { style: { textAlign: 'right', marginTop: '6px' } }, h('button.btn.sm', { style: { pointerEvents: 'auto' }, onclick: next }, i < lines.length - 1 ? '다음 ▶' : '확인 ✔'))); };
      const next = () => { i++; if (i >= lines.length) { dlgEl.style.display = 'none'; dlgEl.innerHTML = ''; S.dlg = null; S.nextFn = null; cb && cb(); } else show(); }; S.nextFn = next; show(); };
    const doneM = (msg) => { Eco.store.addXP(8, '숲속탐험대 미션 · ' + msg); Eco.ui.sfx('coin'); Eco.ui.confetti(40); showBanner('✅ 미션 완료!'); say('[미션] ' + msg + ' 완료! 🎉', '#ff9'); };
    const bump = (key, val, goal, msg) => { const before = S[key]; S[key] = val; if (before < goal && S[key] >= goal) doneM(msg); };
    const wrongHint = 'ℹ️ 쓰레기 그림과 같은 색 분리배출함에 버려요: 🥤 파랑(플라스틱) · 📰 노랑(종이) · 🥫 빨강(캔) · 🍌 회색(일반)';

    /* 상호작용 대상 */
    const spots = () => { const L = [];
      L.push({ x: owl.x, z: owl.z, r: 3.5, text: '🦉 부엉이와 대화', fn: () => { if (!S.intro) { S.intro = 1; talk('숲 해설사 부엉이', '🦉', ['안녕, 탐험대원 ' + name + '! 나는 이 숲을 지키는 부엉이야.', '요즘 숲이 많이 아파졌어. 쓰레기가 쌓이고, 나무가 줄고, 연못은 탁해졌지.', '네 가지 미션을 도와줄래? ① 쓰레기를 주워 분리배출 ② 나무 심기 ③ 연못 청소 ④ 숨은 동물 찾기', '왼쪽 위 미션 판을 확인하고, 다 끝나면 나한테 다시 와!']); } else if (allDone()) finale(); else talk('숲 해설사 부엉이', '🦉', ['아직 남은 미션이 있어! 왼쪽 위 미션 판을 확인해 봐.', S.sorted < SORT ? '쓰레기는 가방에 담아서 학교 앞 분리배출함에 버려. 같은 색 통이 정답이야.' : S.grown < TREES ? '곰 정원사에게 묘목을 받고, 연못에서 물을 길어 시든 땅에 나무를 심어 봐.' : S.pondDone < PONDN ? '연못 둘레의 쓰레기를 모두 주워야 물이 맑아져.' : '숲 곳곳에 숨은 동물 친구를 찾아 가까이 가 봐!']); } });
      L.push({ x: bear.x, z: bear.z, r: 3.5, text: '🐻 정원사 곰과 대화', fn: () => { if (S.grown >= TREES) return talk('정원사 곰', '🐻', ['덕분에 숲이 푸르러졌어! 고마워.']); if (S.seed >= TREES - S.grown) return talk('정원사 곰', '🐻', ['묘목은 충분히 가졌네! 연못에서 물을 떠서 시든 땅에 심어 봐.']); const g = (TREES - S.grown) - S.seed; S.seed += g; talk('정원사 곰', '🐻', ['묘목 ' + g + '그루를 줄게! 🌱', '묘목은 시든 땅(왼쪽 아래)에 심고, 연못에서 길어 온 물을 줘야 해.', '나무는 뿌리로 물을 마시고 잎으로 햇빛을 받아 자란단다.']); say('[아이템] 🌱 묘목 ' + S.seed + '그루', '#9f9'); } });
      BINS.forEach(([t, x]) => L.push({ x, z: 6, r: 2.6, text: TRASH[t][0] + ' ' + TRASH[t][1] + '통에 버리기', fn: () => { if (!S.bag.length) return say('[안내] 가방이 비어 있어요. 숲의 쓰레기를 주워요!', '#ddd'); const keep = []; let ok = 0, bad = 0; S.bag.forEach(i => { if (i.t === t) ok++; else { keep.push(i); bad++; } }); S.bag = keep; if (ok) { say('[분리배출] ' + TRASH[t][0] + ' ' + ok + '개 올바르게 버렸어요! ✅', '#9f9'); Eco.ui.sfx('coin'); bump('sorted', S.sorted + ok, SORT, '분리배출 ' + SORT + '개'); } if (!ok) { S.wrong++; say('[분리배출] 이 통에 맞는 쓰레기가 없어요. 🤔', '#f99'); say(wrongHint, '#ddd'); } } }));
      if (Math.hypot(S.x - POND.x, S.z - POND.z) < POND.r + 3.5) L.push({ x: S.x, z: S.z, r: 99, text: '🪣 연못에서 물 뜨기', fn: () => { if (S.water >= 4) return say('[안내] 물통이 가득 찼어요!', '#ddd'); S.water = 4; say('[아이템] 💧 물 4통을 떴어요', '#9ff'); Eco.ui.sfx('coin'); } });
      patches.forEach(p => { if (p.state < 2) L.push({ x: p.x, z: p.z, r: 3, text: p.state === 0 ? '🌱 묘목 심기' : '💧 물 주기', fn: () => { if (p.state === 0) { if (S.seed <= 0) return say('[안내] 묘목이 없어요. 묘목장의 곰에게 받아요!', '#f99'); S.seed--; p.state = 1; const sp = new THREE.Group(); const a = box(.12, .6, .12, 0x6b8e3a), b = box(.5, .3, .5, 0x7ad36a); b.position.y = .5; sp.add(a, b); sp.position.set(p.x, 0, p.z); scene.add(sp); p.obj = sp; say('[숲] 🌱 묘목을 심었어요! 물을 줘요.', '#9f9'); Eco.ui.sfx('coin'); }
        else { if (S.water <= 0) return say('[안내] 물이 없어요. 연못에서 물을 떠 와요!', '#f99'); S.water--; p.state = 2; p.grow = 0; scene.remove(p.obj); const tr = new THREE.Group(); const t1 = box(.6, 2.6, .6, 0x7a4d2a); t1.position.y = 1.3; const l1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.9, 2.6), leafMat), l2 = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.4, 1.7), leafMat); l1.position.y = 3.3; l2.position.y = 4.75; tr.add(t1, l1, l2); tr.position.set(p.x, 0, p.z); tr.scale.setScalar(.2); scene.add(tr); p.obj = tr; circles.push([p.x, p.z, .9]); p.disc.material.color.setHex(0x4fa83a); say('[숲] 🌳 나무가 쑥쑥 자라요!', '#9f9'); Eco.ui.sfx('coin'); bump('grown', S.grown + 1, TREES, '나무 ' + TREES + '그루 심기'); } } }); });
      return L; };
    const act = () => { if (S.dlg) return S.nextFn && S.nextFn(); if (S.finished || !nearest) return; nearest.fn(); };
    const finale = () => talk('숲 해설사 부엉이', '🦉', ['대단해! 쓰레기는 사라지고, 나무는 자라고, 연못은 맑아졌어. 동물 친구도 모두 만났구나!', '네가 한 행동 하나하나가 숲을 살렸어. 일상에서도 분리배출과 물 아끼기를 꼭 실천해 줘!', '🎖️ 오늘부터 너는 명예 숲속탐험대장이야!'], () => { S.finished = 1; const sc = Math.max(60, 300 - S.wrong * 8 - Math.floor(S.t / 8)); Eco.gameDone('forestworld', sc, 18, '숲속탐험대 월드'); Eco.ui.confetti(120); const fl = ['🎆', '🎇', '✨']; showBanner('🏆 숲이 되살아났어요!'); result.style.display = 'grid'; result.innerHTML = ''; result.append(h('div', h('h2', '🏆 숲속탐험대 월드 클리어!'), h('p', '⏱ ' + Math.floor(S.t / 60) + '분 ' + Math.floor(S.t % 60) + '초 · 분리배출 실수 ' + S.wrong + '번'), h('p', '점수 ' + sc), h('p.small', '🌳 숲이 ' + Math.round(vitality() * 100) + '% 회복됐어요'), h('button.btn', { style: { pointerEvents: 'auto' }, onclick: retry }, '🔁 새로운 모험'))); });
    const kd = e => { if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') { act(); return; } const m = km[e.key]; if (m) { K[m] = 1; if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault(); } }, ku = e => { const m = km[e.key]; if (m) K[m] = 0; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    let drag = null; cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); }); cv.addEventListener('pointermove', e => { if (!drag) return; yaw -= (e.clientX - drag.x) * .008; pitch = cl(pitch + (e.clientY - drag.y) * .006, .1, 1.3); drag = { x: e.clientX, y: e.clientY }; }); cv.addEventListener('pointerup', () => { drag = null; }); cv.addEventListener('wheel', e => { e.preventDefault(); dist = cl(dist + e.deltaY * .01, 4, 20); }, { passive: false });
    say('[시스템] 숲속탐험대 월드에 오신 걸 환영해요! 🌲', '#9ff'); say('[시스템] 부엉이에게 말을 걸어 보세요 (E)', '#ddd'); setTimeout(() => showBanner('숲속탐험대 월드'), 300);

    const loop = now => { raf = requestAnimationFrame(loop); const dt = Math.min(.04, (now - last) / 1000); last = now; T += dt; frame++; if (!S.finished && !S.dlg) S.t += dt;
      let moving = false;
      if (!S.dlg && !S.finished) {
        const ix = K.r - K.l, fw = K.u - K.d; let mx = Math.cos(yaw) * ix - Math.sin(yaw) * fw, mz = -Math.sin(yaw) * ix - Math.cos(yaw) * fw; const len = Math.hypot(mx, mz); if (len > 0) { mx /= len; mz /= len; moving = true; hero.rotation.y = Math.atan2(mx, mz); const sp = 8; S.x += mx * sp * dt; S.z += mz * sp * dt; }
        circles.forEach(c => { const dx = S.x - c[0], dz = S.z - c[1], d = Math.hypot(dx, dz), m = c[2] + .4; if (d < m) { S.x = c[0] + dx / (d || 1) * m; S.z = c[1] + dz / (d || 1) * m; } }); boxes.forEach(b => { if (S.x > b[0] - .4 && S.x < b[2] + .4 && S.z > b[1] - .4 && S.z < b[3] + .4) { const l = S.x - (b[0] - .4), r = b[2] + .4 - S.x, u = S.z - (b[1] - .4), d = b[3] + .4 - S.z, mn = Math.min(l, r, u, d); if (mn === l) S.x = b[0] - .4; else if (mn === r) S.x = b[2] + .4; else if (mn === u) S.z = b[1] - .4; else S.z = b[3] + .4; } });
        S.x = cl(S.x, -42, 42); S.z = cl(S.z, -42, 42); if (K.j && S.y <= 0) { S.vy = 9; Eco.ui.sfx('coin'); } }
      S.vy -= 28 * dt; S.y = Math.max(0, S.y + S.vy * dt); if (S.y === 0 && S.vy < 0) S.vy = 0;
      /* 자동 줍기 · 동물 발견 */
      if (!S.dlg) { items.forEach(i => { if (i.got || Math.hypot(S.x - i.x, S.z - i.z) > 1.4) return; if (S.bag.length >= 8) { if (frame % 90 === 0) say('[안내] 가방이 가득! 분리배출함에 먼저 버려요.', '#f99'); return; } i.got = 1; scene.remove(i.g); S.bag.push(i); Eco.ui.sfx('coin'); say('[줍기] ' + TRASH[i.t][0] + ' ' + TRASH[i.t][1] + ' 획득! (가방 ' + S.bag.length + '/8)', '#ddd'); if (i.pond) { bump('pondDone', S.pondDone + 1, PONDN, '연못 청소'); } });
        animals.forEach(a => { if (!a.found && Math.hypot(S.x - a.x, S.z - a.z) < 3.2) { a.found = 1; Eco.store.addXP(2, '동물 발견 · ' + a.a[1]); Eco.ui.sfx('coin'); say('[도감] ' + a.a[0] + ' ' + a.a[1] + ' 발견!', '#ff9'); talk(a.a[1] + ' 도감', a.a[0], [a.a[2]], () => bump('found', S.found + 1, ANIMALS.length, '동물 친구 모두 찾기')); } }); }
      animals.forEach(a => { a.sp.position.y = 1 + Math.abs(Math.sin(T * (a.found ? 4 : 1.5) + a.ph)) * (a.found ? .5 : .15); }); patches.forEach(p => { if (p.state === 2 && p.obj && p.obj.scale.x < 1) p.obj.scale.setScalar(Math.min(1, p.obj.scale.x + dt * .5)); });
      /* 회복 연출: 숲이 점점 푸르러져요 */
      const v = vitality(); grassMat.color.lerp(lerpC(0x9c9a5a, 0x4fa83a, v), .05); leafMat.color.lerp(lerpC(0x7d8a5c, 0x2f9a3f, v), .05); scene.background.lerp(lerpC(0xbfc7b0, 0x9fd8f7, v), .03); scene.fog.color.copy(scene.background); pondM.color.lerp(lerpC(0x5a4a2a, 0x4aa8e8, S.pondDone / PONDN), .05); flowers.count = Math.floor(NF * v); clouds.forEach(c => { c.position.x += dt * .8; if (c.position.x > 75) c.position.x = -75; });
      const sw = Math.sin(T * 11) * .85; if (S.y > .05) { armL.rotation.x = armR.rotation.x = -2.5; legL.rotation.x = .35; legR.rotation.x = -.35; } else if (moving) { armL.rotation.x = sw; armR.rotation.x = -sw; legL.rotation.x = -sw; legR.rotation.x = sw; } else { armL.rotation.x = armR.rotation.x = legL.rotation.x = legR.rotation.x = 0; }
      hero.position.set(S.x, S.y, S.z); const ty = S.y + 1.6; cam.position.set(S.x + dist * Math.sin(yaw) * Math.cos(pitch), Math.max(.5, ty + dist * Math.sin(pitch)), S.z + dist * Math.cos(yaw) * Math.cos(pitch)); cam.lookAt(S.x, ty, S.z); renderer.render(scene, cam);
      if (frame % 5 === 0) { nearest = null; let bd = 1e9; spots().forEach(s => { const d = Math.hypot(S.x - s.x, S.z - s.z); if (d < s.r && d < bd) { bd = d; nearest = s; } }); prompt.style.display = nearest && !S.dlg && !S.finished ? '' : 'none'; if (nearest) prompt.textContent = 'E · ' + nearest.text;
        quest.innerHTML = ''; quest.append(h('div', { style: { opacity: .8 } }, '📋 미션 · 숲 회복 ' + Math.round(v * 100) + '%')); missions().forEach(m => quest.append(h('div', { style: { color: m[1] >= m[2] ? '#9f9' : '#fff' } }, (m[1] >= m[2] ? '✅ ' : '⬜ ') + m[0] + ' (' + m[1] + '/' + m[2] + ')'))); if (allDone() && !S.finished) quest.append(h('div', { style: { color: '#ffe14d' } }, '⭐ 부엉이에게 돌아가 보고해요!'));
        inv.innerHTML = ''; inv.append(h('div', '🎒 가방 ' + S.bag.length + '/8'), h('div', S.bag.map(i => TRASH[i.t][0]).join(' ') || '비어 있음'), h('div', '🌱 ' + S.seed + '  💧 ' + S.water), h('div', '⏱ ' + Math.floor(S.t) + '초'));
        chatEl.innerHTML = ''; chat.filter(c => now - c.t < 9000).slice(-4).forEach(c => chatEl.append(h('div', { style: { color: c.c } }, c.m))); chatEl.style.display = chatEl.children.length ? '' : 'none';
        mg.clearRect(0, 0, 120, 120); const P = (x, z) => [(x + 45) / 90 * 120, (z + 45) / 90 * 120]; mg.fillStyle = '#4aa8e8'; let q = P(POND.x, POND.z); mg.beginPath(); mg.arc(q[0], q[1], 9, 0, 7); mg.fill(); mg.fillStyle = '#6b4f2c'; patches.forEach(p => { q = P(p.x, p.z); mg.fillRect(q[0] - 3, q[1] - 3, 6, 6); }); mg.fillStyle = '#9aa0a8'; items.forEach(i => { if (!i.got) { q = P(i.x, i.z); mg.fillRect(q[0] - 1.5, q[1] - 1.5, 3, 3); } }); mg.fillStyle = '#c8a0ff'; animals.forEach(a => { if (!a.found) { q = P(a.x, a.z); mg.fillRect(q[0] - 2, q[1] - 2, 4, 4); } }); mg.fillStyle = '#ffe14d'; [owl, bear].forEach(o => { q = P(o.x, o.z); mg.beginPath(); mg.arc(q[0], q[1], 3.5, 0, 7); mg.fill(); }); mg.fillStyle = '#fff'; q = P(0, 8); mg.fillRect(q[0] - 5, q[1] - 2, 10, 4); mg.fillStyle = '#ff3b30'; q = P(S.x, S.z); mg.beginPath(); mg.arc(q[0], q[1], 4, 0, 7); mg.fill(); } };
    raf = requestAnimationFrame(loop);
    const btn = (lb, key) => h('button.btn.alt', { style: { fontSize: '1.3rem', minWidth: '58px', touchAction: 'none', userSelect: 'none' }, onpointerdown: e => { e.preventDefault(); K[key] = 1; }, onpointerup: () => { K[key] = 0; }, onpointerleave: () => { K[key] = 0; }, onpointercancel: () => { K[key] = 0; } }, lb);
    const el = h('div', wrap, h('div.row', { style: { justifyContent: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' } }, btn('◀', 'l'), btn('▲', 'u'), btn('▼', 'd'), btn('▶', 'r'), btn('⤒ 점프', 'j'), h('button.btn', { onclick: () => act() }, '✋ 상호작용(E)')),
      h('div.small.muted', { style: { marginTop: '6px' } }, '⌨️ WASD/방향키 이동 · 스페이스 점프 · E 상호작용/대화 · 마우스 드래그 카메라 · 휠 줌. 쓰레기는 가까이 가면 자동으로 가방에 담겨요. 숲은 미션을 할수록 푸르러져요!'));
    return { el, destroy() { cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); document.removeEventListener('fullscreenchange', onFs); ro.disconnect(); renderer.dispose(); } };
  }

  Eco.addGame('forestworld', { name: '숲속탐험대 월드', emoji: '🌲', tag: '3D 오픈월드', desc: '로블록스 어드벤처처럼 열린 숲을 자유롭게 탐험해요! 부엉이·정원사 곰 NPC의 부탁으로 쓰레기 분리배출, 나무 심기, 연못 정화, 동물 도감 미션을 해결해 숲을 되살려요.', cat: '메타버스',
    make() {
      const box = h('div.gamebox'); if (!window.THREE) { box.append(h('div.note', '3D 엔진(three.js)을 불러오지 못했어요. 새로고침 해 주세요.')); return box; }
      let cur; const mount = () => { if (cur) { cur.destroy(); cur.el.remove(); } cur = build(mount); box.append(cur.el); }; mount(); Eco.onLeave(() => cur && cur.destroy()); return box;
    } });
})(window.Eco);
