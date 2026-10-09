/* 에코크래프트: 네모난 3D 세상에서 시든 땅을 숲으로 되살리는 메타버스 게임 (Three.js) */
(function (Eco) {
  const { h } = Eco.ui;
  const N = 24, POND = { x0: 15, x1: 20, z0: 3, z1: 8 };
  const SEASON = { 봄: { leaf: [0x8edc6a, 0xffb7d1], grass: 0x8fd16a, bg: 0xbfe6ff }, 여름: { leaf: [0x2f9a3f, 0x3fae4a], grass: 0x4fa83a, bg: 0x9fd4f7 }, 가을: { leaf: [0xe8731f, 0xd9a21f], grass: 0xb8a24a, bg: 0xffd9a6 }, 겨울: { leaf: [0xdfeaf2, 0xffffff], grass: 0xe9f1f7, bg: 0xd6e6f2 } };
  const ANIMALS = [['squirrel', '🐿️', '다람쥐', s => s.trees >= 6], ['rabbit', '🐇', '토끼', s => s.grass >= 30], ['bird', '🐦', '새', s => s.houses >= 1 && s.trees >= 4], ['butterfly', '🦋', '나비', s => s.flowers >= 6], ['frog', '🐸', '개구리', s => s.clean]];

  function build(container, hooks) {
    if (!window.THREE || !THREE.OrbitControls) { container.append(h('div.note', '3D 엔진(three.js)을 불러오지 못했어요. js/vendor 폴더를 확인해 주세요.')); return () => { }; }
    const S = Eco.store.get(); const saved = S.meta.ec;
    const st = saved || { grid: null, objs: [], trash: [], clean: false, collected: 0, season: '봄', night: false };
    const rnd = (a, b) => a + Math.random() * (b - a);
    const isPond = (x, z) => x >= POND.x0 && x <= POND.x1 && z >= POND.z0 && z <= POND.z1;
    if (!st.grid) {
      st.grid = []; for (let i = 0; i < N * N; i++) st.grid.push(isPond(i % N, (i / N) | 0) ? 'w' : 'd');
      st.trash = []; let tries = 0; while (st.trash.length < 28 && tries++ < 400) { const x = Math.random() * N | 0, z = Math.random() * N | 0; if (st.grid[z * N + x] === 'd' && !st.trash.some(t => t.x === x && t.z === z)) st.trash.push({ x, z, c: [0x9aa5b1, 0x5b8bd6, 0xe8e8e8, 0xd9a21f][Math.random() * 4 | 0] }); }
    }
    const W = Math.max(320, container.clientWidth || 800), Hh = Math.min(560, Math.max(320, innerHeight * .62));
    const scene = new THREE.Scene(); scene.background = new THREE.Color(SEASON[st.season].bg); scene.fog = new THREE.Fog(SEASON[st.season].bg, 28, 60);
    const cam = new THREE.PerspectiveCamera(50, W / Hh, .1, 120); cam.position.set(0, 14, 17);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(W, Hh);
    const wrap = h('div.ecocraft-wrap'); wrap.append(renderer.domElement); container.append(wrap);
    const controls = new THREE.OrbitControls(cam, renderer.domElement); controls.enablePan = false; controls.minDistance = 9; controls.maxDistance = 40; controls.maxPolarAngle = Math.PI / 2.15; controls.enableDamping = true; controls.target.set(0, 0, 0);
    const amb = new THREE.AmbientLight(0xffffff, .65), sun = new THREE.DirectionalLight(0xffffff, .8); sun.position.set(10, 20, 8); scene.add(amb, sun);

    /* 땅 (InstancedMesh) */
    const gGeo = new THREE.BoxGeometry(1, 1, 1), gMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const ground = new THREE.InstancedMesh(gGeo, gMat, N * N); const M4 = new THREE.Matrix4(), C = new THREE.Color();
    const base = {}; // 타일별 약간의 색 차이
    for (let i = 0; i < N * N; i++) base[i] = Math.random() * .12 - .06;
    function tileColor(i) { const c = st.grid[i]; const v = base[i];
      if (c === 'w') return C.setHex(st.clean ? 0x4aa8e8 : 0x7a6a3a).offsetHSL(0, 0, v * .5);
      if (c === 'g') return C.setHex(SEASON[st.season].grass).offsetHSL(0, 0, v);
      return C.setHex(0xa8845a).offsetHSL(0, -.1, v); }
    function paintTile(i) { const x = i % N, z = (i / N) | 0; M4.makeTranslation(x - N / 2 + .5, st.grid[i] === 'w' ? -.62 : -.5, z - N / 2 + .5); ground.setMatrixAt(i, M4); ground.setColorAt(i, tileColor(i)); }
    for (let i = 0; i < N * N; i++) paintTile(i); ground.instanceMatrix.needsUpdate = true; ground.instanceColor.needsUpdate = true; scene.add(ground);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(N + .6, .5, N + .6), new THREE.MeshLambertMaterial({ color: 0x6a4a2a })); edge.position.y = -1.3; scene.add(edge);

    /* 오브젝트 */
    const objGroup = new THREE.Group(), trashGroup = new THREE.Group(), animalGroup = new THREE.Group(); scene.add(objGroup, trashGroup, animalGroup);
    const tilePos = (x, z) => [x - N / 2 + .5, z - N / 2 + .5];
    const box = (w, hh, d, col) => new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), new THREE.MeshLambertMaterial({ color: col }));
    const tag = (g, x, z, kind) => g.traverse(o => { o.userData.tile = { x, z }; o.userData.kind = kind; });
    const nodes = {}; // 'x,z' -> {o, group}
    function leafColors() { return SEASON[st.season].leaf; }
    function makeObj(o) {
      const g = new THREE.Group(), [px, pz] = tilePos(o.x, o.z); g.position.set(px, 0, pz);
      if (o.k === 'sapling') { const s = box(.18, .5, .18, 0x6b8e3a); s.position.y = .25; const l = box(.45, .25, .45, 0x7ad36a); l.position.y = .55; g.add(s, l); }
      else if (o.k === 'tree') { const tr = box(.32, 1.1, .32, 0x7a4d2a); tr.position.y = .55; const l1 = box(1.15, .9, 1.15, leafColors()[0]), l2 = box(.75, .6, .75, leafColors()[1]); l1.position.y = 1.5; l2.position.y = 2.15; l1.name = 'leaf'; l2.name = 'leaf'; g.add(tr, l1, l2); if (o.house) { const hb = box(.35, .3, .3, 0xc98b4a), hole = box(.1, .1, .05, 0x222222); hb.position.set(0, 1.1, .62); hole.position.set(0, 1.12, .78); g.add(hb, hole); } g.scale.setScalar(.2); g.userData.grow = 1; }
      else if (o.k === 'flower') { const s = box(.07, .35, .07, 0x3d9a35); s.position.y = .17; const hd = box(.28, .2, .28, [0xff6b8a, 0xffd93d, 0xffffff, 0xb58cff][o.c || 0]); hd.position.y = .42; g.add(s, hd); }
      tag(g, o.x, o.z, o.k); objGroup.add(g); nodes[o.x + ',' + o.z] = { o, g }; return g;
    }
    function rebuildTrees() { Object.values(nodes).forEach(n => { if (n.o.k === 'tree') n.g.traverse(m => { if (m.name === 'leaf') { m.material.color.setHex(leafColors()[m.position.y > 1.8 ? 1 : 0]); } }); }); }
    st.objs.forEach(o => { if (o.k === 'sapling' && o.w) o.k = 'tree'; makeObj(o); });
    const trashMeshes = [];
    function makeTrash(t) { const m = box(.5, .5, .5, t.c); const [px, pz] = tilePos(t.x, t.z); m.position.set(px + rnd(-.2, .2), .26, pz + rnd(-.2, .2)); m.rotation.y = Math.random() * 3; m.userData = { kind: 'trash', ref: t }; trashGroup.add(m); trashMeshes.push(m); }
    st.trash.forEach(makeTrash);

    /* 동물 스프라이트 */
    const emojiTex = e => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.font = '96px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 64, 70); return new THREE.CanvasTexture(c); };
    const animals = {};
    function stats() {
      const objs = Object.values(nodes).map(n => n.o); const trees = objs.filter(o => o.k === 'tree').length, flowers = objs.filter(o => o.k === 'flower').length, houses = objs.filter(o => o.house).length, grass = st.grid.filter(c => c === 'g').length;
      return { trees, flowers, houses, grass, trash: st.trash.length, clean: st.clean };
    }
    function health(s) { return Math.min(100, Math.round(Math.min(s.trees, 12) / 12 * 30 + (28 - s.trash) / 28 * 20 + Math.min(s.grass, 120) / 120 * 15 + Math.min(s.flowers, 10) / 10 * 10 + (s.clean ? 10 : 0) + Math.min(s.houses, 3) / 3 * 5 + ANIMALS.filter(a => animals[a[0]]).length / 5 * 10)); }
    function updateAnimals(s) { ANIMALS.forEach(a => { if (a[3](s) && !animals[a[0]]) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(a[1]), transparent: true })); sp.scale.set(1.1, 1.1, 1); const [px, pz] = tilePos(Math.random() * N | 0, Math.random() * N | 0); sp.position.set(px, .55, pz); sp.userData = { kind: 'animal', name: a[2], e: a[1], tx: px, tz: pz }; animalGroup.add(sp); animals[a[0]] = sp; say('🎉 ' + a[1] + ' ' + a[2] + '가(이) 숲에 찾아왔어요!'); Eco.ui.sfx('coin'); } }); }

    /* HUD */
    const pills = h('div.ec-hud'), msg = h('div.ec-msg', '도구를 고르고 땅을 눌러 보세요!'); const tools = h('div.ec-tools');
    let tool = 'trash'; const TOOLS = [['trash', '🧹', '쓰레기 줍기'], ['plant', '🌱', '묘목 심기'], ['water', '💧', '물 주기'], ['flower', '🌼', '꽃 심기'], ['house', '🐦', '새집 달기'], ['clean', '🫧', '연못 정화']];
    const tb = {}; TOOLS.forEach(t => { const b = h('button' + (t[0] === tool ? '.on' : ''), { onclick: () => { tool = t[0]; Object.values(tb).forEach(x => x.classList.remove('on')); b.classList.add('on'); say(t[2] + ' — ' + hint[t[0]]); Eco.ui.sfx('click'); } }, t[1] + ' ' + t[2]); tb[t[0]] = b; tools.append(b); });
    const hint = { trash: '쓰레기(네모 상자)를 눌러 주워요.', plant: '맨땅·풀밭을 눌러 묘목을 심어요.', water: '묘목을 눌러 물을 주면 나무로 자라요. 맨땅에도 주면 풀이 돋아요.', flower: '풀이 난 땅에 꽃을 심어요.', house: '큰 나무에 새집을 달아요.', clean: '쓰레기를 10개 이상 주운 뒤 탁한 연못을 눌러요.' };
    wrap.append(pills, msg, tools);
    function say(t) { msg.textContent = t; }

    const mission = h('div.card'); function drawMissions(s) {
      const M = [['쓰레기 10개 줍기', st.collected >= 10], ['나무 8그루 키우기', s.trees >= 8], ['연못 정화하기', s.clean], ['꽃 6송이 피우기', s.flowers >= 6], ['새집 2개 달기', s.houses >= 2], ['동물 친구 3종 만나기', Object.keys(animals).length >= 3], ['생태 건강도 100% 달성', health(s) >= 100]];
      mission.innerHTML = ''; mission.append(h('h3', '🎯 에코크래프트 미션'), M.map(m => h('div.step' + (m[1] ? '.on' : ''), h('span', m[1] ? '✅' : '⬜'), h('span', m[0]))));
      const done = M.filter(m => m[1]).length; if (done === M.length && !S.meta.ecDone) { S.meta.ecDone = 1; Eco.store.save(); Eco.store.addXP(60, '에코크래프트 숲 복원 완료'); Eco.ui.confetti(); Eco.ui.sfx('win'); }
      M.forEach((m, i) => { if (m[1] && !S.meta['ecm' + i]) { S.meta['ecm' + i] = 1; Eco.store.save(); if (i < 6) Eco.store.addXP(8, '미션: ' + m[0]); } });
    }
    function refresh() {
      const s = stats(); updateAnimals(s); const hp = health(s);
      pills.innerHTML = ''; [['💚 생태 건강도 ' + hp + '%'], ['🌳 ' + s.trees + '  🌼 ' + s.flowers + '  🗑️ ' + s.trash], ['🧹 주운 쓰레기 ' + st.collected]].forEach(p => pills.append(h('div.pill', p[0])));
      drawMissions(s); st.objs = Object.values(nodes).map(n => n.o); S.meta.ec = st; Eco.store.save(); hooks && hooks.onChange && hooks.onChange(hp);
    }

    /* 상호작용 */
    const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(); let down = null;
    const el = renderer.domElement;
    el.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    el.addEventListener('pointerup', e => { if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); const quick = performance.now() - down.t < 450; down = null; if (moved < 6 && quick) click(e); });
    function click(e) {
      const r = el.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(mouse, cam);
      const hits = ray.intersectObjects([ground, ...trashGroup.children, ...objGroup.children, ...animalGroup.children], true); if (!hits.length) return; const hit = hits[0], ob = hit.object;
      if (ob.userData.kind === 'animal') { say(ob.userData.e + ' ' + ob.userData.name + ': 숲이 건강해서 놀러 왔어!'); Eco.ui.sfx('pop'); return; }
      if (ob.userData.kind === 'trash') { if (tool !== 'trash') { say('쓰레기는 🧹 도구로 주울 수 있어요.'); return; } pickTrash(ob); return; }
      let x, z; if (ob === ground) { const i = hit.instanceId; x = i % N; z = (i / N) | 0; } else if (ob.userData.tile) { x = ob.userData.tile.x; z = ob.userData.tile.z; } else return;
      act(x, z);
    }
    function pickTrash(m) { trashGroup.remove(m); const i = st.trash.indexOf(m.userData.ref); if (i >= 0) st.trash.splice(i, 1); st.collected++; Eco.ui.sfx('pop'); say('✔ 쓰레기를 주웠어요! (' + st.collected + '개) — 분리배출 잊지 말아요.'); refresh(); }
    function act(x, z) {
      if (tool === 'trash') { const m = trashMeshes.find(m => m.parent && m.userData.ref.x === x && m.userData.ref.z === z); if (m) pickTrash(m); else say('쓰레기가 있는 칸을 눌러요. (반짝이는 작은 상자)'); return; }
      const i = z * N + x, key = x + ',' + z, nd = nodes[key];
      if (tool === 'plant') { if (st.grid[i] === 'w') { say('물 위에는 심을 수 없어요.'); return; } if (nd) { say('이미 무언가 있어요.'); return; } const o = { x, z, k: 'sapling' }; makeObj(o); Eco.ui.sfx('pop'); say('🌱 묘목을 심었어요. 💧로 물을 주세요!'); }
      else if (tool === 'water') { if (nd && nd.o.k === 'sapling') { nd.o.w = 1; objGroup.remove(nd.g); delete nodes[key]; const o = { x, z, k: 'tree' }; makeObj(o); [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => { const a = x + dx, b = z + dz; if (a >= 0 && b >= 0 && a < N && b < N && st.grid[b * N + a] === 'd') { st.grid[b * N + a] = 'g'; paintTile(b * N + a); } }); ground.instanceColor.needsUpdate = ground.instanceMatrix.needsUpdate = true; Eco.ui.sfx('ok'); say('🌳 묘목이 쑥쑥 자라 나무가 되었어요! 주변에 풀이 돋아요.'); }
        else if (st.grid[i] === 'd') { st.grid[i] = 'g'; paintTile(i); ground.instanceColor.needsUpdate = true; Eco.ui.sfx('pop'); say('💧 물을 주니 풀이 돋았어요.'); } else { say('물을 줄 곳은 묘목이나 맨땅이에요.'); return; } }
      else if (tool === 'flower') { if (st.grid[i] !== 'g') { say('꽃은 풀이 난 땅에 심을 수 있어요. 먼저 💧로 풀을 키워요.'); return; } if (nd) { say('이미 무언가 있어요.'); return; } makeObj({ x, z, k: 'flower', c: Math.random() * 4 | 0 }); Eco.ui.sfx('coin'); say('🌼 꽃이 피었어요!'); }
      else if (tool === 'house') { if (nd && nd.o.k === 'tree' && !nd.o.house) { objGroup.remove(nd.g); const o = Object.assign(nd.o, { house: 1 }); delete nodes[key]; makeObj(o); nodes[key].g.scale.setScalar(1); nodes[key].g.userData.grow = 0; Eco.ui.sfx('ok'); say('🐦 새집을 달았어요! 새가 찾아올지도 몰라요.'); } else { say('새집은 아직 새집이 없는 큰 나무에 달아요.'); return; } }
      else if (tool === 'clean') { if (st.grid[i] !== 'w') { say('탁한 연못(물)을 눌러 주세요.'); return; } if (st.clean) { say('연못은 이미 깨끗해요!'); return; } if (st.collected < 10) { say('연못을 정화하려면 쓰레기를 10개 이상 주워야 해요. (지금 ' + st.collected + '개)'); Eco.ui.sfx('bad'); return; } st.clean = true; for (let k = 0; k < N * N; k++) if (st.grid[k] === 'w') paintTile(k); ground.instanceColor.needsUpdate = true; Eco.ui.sfx('win'); say('🫧 연못이 맑아졌어요!'); }
      else { say('쓰레기를 주울 때는 네모 상자를 눌러요.'); return; }
      refresh();
    }

    /* 계절·밤 */
    function applySky() { const sk = SEASON[st.season]; const col = st.night ? 0x0f1f46 : sk.bg; scene.background.setHex(col); scene.fog.color.setHex(col); amb.intensity = st.night ? .32 : .65; sun.intensity = st.night ? .25 : .8; sun.color.setHex(st.night ? 0x7a8cff : 0xffffff); }
    function setSeason(s) { st.season = s; for (let i = 0; i < N * N; i++) paintTile(i); ground.instanceColor.needsUpdate = true; rebuildTrees(); applySky(); refresh(); }
    applySky();

    /* 루프 */
    let raf, t0 = performance.now(), alive = true;
    function loop() { if (!alive) return; raf = requestAnimationFrame(loop); const t = (performance.now() - t0) / 1000; controls.update();
      Object.values(nodes).forEach(n => { if (n.g.userData.grow) { const s = n.g.scale.x + (1 - n.g.scale.x) * .12; n.g.scale.setScalar(s); if (s > .99) { n.g.scale.setScalar(1); n.g.userData.grow = 0; } } });
      Object.values(animals).forEach((a, i) => { const u = a.userData; if (Math.hypot(a.position.x - u.tx, a.position.z - u.tz) < .2) { u.tx = rnd(-N / 2 + 1, N / 2 - 1); u.tz = rnd(-N / 2 + 1, N / 2 - 1); } const dx = u.tx - a.position.x, dz = u.tz - a.position.z, d = Math.hypot(dx, dz) || 1; const sp = u.e === '🦋' || u.e === '🐦' ? .045 : .02; a.position.x += dx / d * sp; a.position.z += dz / d * sp; a.position.y = (u.e === '🦋' || u.e === '🐦' ? 1.6 + Math.sin(t * 3 + i) * .3 : .55 + Math.abs(Math.sin(t * 5 + i)) * .15); });
      renderer.render(scene, cam); }
    loop(); refresh();
    const onResize = () => { const w = Math.max(320, container.clientWidth); renderer.setSize(w, Hh); cam.aspect = w / Hh; cam.updateProjectionMatrix(); }; window.addEventListener('resize', onResize);

    const api = {
      mission, setSeason, act: (t, x, z) => { tool = t; act(x, z); }, state: () => st, toggleNight: () => { st.night = !st.night; applySky(); refresh(); }, season: () => st.season, shot: () => { renderer.render(scene, cam); return renderer.domElement.toDataURL('image/png'); },
      reset: () => { delete S.meta.ec; Eco.store.save(); Eco.render(); },
      dispose: () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); controls.dispose(); renderer.dispose(); }
    };
    return api;
  }

  Eco.ecocraft = function () {
    const host = h('div'); let api = null;
    const box = h('div');
    const controls = h('div.row', { style: { margin: '10px 0' } });
    setTimeout(() => {
      api = build(host, {});
      if (!api || !api.setSeason) return;
      Eco._ec = api;
      Eco.onLeave(() => api.dispose());
      ['봄', '여름', '가을', '겨울'].forEach(s => controls.append(h('button.btn.alt.sm', { onclick: () => api.setSeason(s) }, { 봄: '🌸', 여름: '🌞', 가을: '🍁', 겨울: '⛄' }[s] + ' ' + s)));
      controls.append(h('button.btn.alt.sm', { onclick: () => api.toggleNight() }, '🌙 낮/밤'), h('button.btn.alt.sm', { onclick: () => { const a = h('a', { href: api.shot(), download: '에코크래프트.png' }); document.body.append(a); a.click(); a.remove(); } }, '📸 캡처 저장'), h('button.btn.alt.sm', { onclick: () => { if (confirm('새 세상으로 다시 시작할까요? (지금 세상은 사라져요)')) api.reset(); } }, '🔄 새 세상'));
      side.append(api.mission);
    }, 30);
    const side = h('div');
    box.append(host, controls, h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', alignItems: 'start' } }, side,
      h('div.card', h('h3', '🎮 조작 방법'), h('ul', h('li', '마우스 왼쪽 드래그 / 한 손가락 드래그: 시점 돌리기'), h('li', '휠 / 두 손가락 벌리기: 확대·축소'), h('li', '아래 도구를 고르고 땅·쓰레기·나무를 눌러요'), h('li', '계절과 낮/밤을 바꿔 숲을 감상해요')),
        h('div.note.purple', '🌱 마인크래프트·로블록스처럼 ‘세상을 직접 만지며 배우는’ 체험이에요. 현실 숲을 지키는 일도 한 번에 되지 않죠? 쓰레기 줍기 → 풀 → 나무 → 꽃 → 동물 순서로 생태계가 회복돼요!'))));
    return box;
  };
})(window.Eco);
