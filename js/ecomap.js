/* 우리 학교 생태지도: 학교를 검색하면 그 위치의 지도를 불러오고, 지도 위에 관찰한 생물·환경 문제를 표시한다.
 * 위치 검색: OpenStreetMap Nominatim (학생이 검색 버튼을 눌렀을 때만 호출) · 지도: OpenStreetMap / Esri 위성 */
(function (Eco) {
  const { h } = Eco.ui;
  const W = Eco.widgets;
  const BR = [['🌳', '나무'], ['🌼', '꽃'], ['🍀', '풀'], ['🐛', '곤충'], ['🐦', '새'], ['🍄', '버섯·이끼'], ['🗑️', '쓰레기(문제점)']];

  W.ecomap = function () {
    const S = Eco.store.get(); const m = S.meta.ecomap2 = S.meta.ecomap2 || { school: null, pins: [] };
    let map = null, cur = BR[0], base = 'osm'; const markers = {};
    const mapBox = h('div', { style: { height: 'min(60vh,460px)', minHeight: '320px', borderRadius: '16px', border: '2px solid var(--line)', overflow: 'hidden', zIndex: 0 } });
    const info = h('div.note', m.school ? '📍 ' + m.school.name + ' 주변 지도예요. 지도를 눌러 관찰한 생물을 표시해 보세요!' : '먼저 우리 학교 이름을 검색해 위치를 불러와요.');
    const sum = h('div.small'); const results = h('div', { style: { display: 'grid', gap: '6px', margin: '6px 0' } });
    const q = h('input', { type: 'text', placeholder: '학교 이름 (예: 군남초등학교) 또는 주소', value: m.school ? m.school.name : '', 'aria-label': '학교 이름 검색' });
    const savePins = () => { Eco.store.save(); drawSum(); };
    const cnt = () => { const c = {}; m.pins.forEach(p => c[p.e] = (c[p.e] || 0) + 1); return c; };
    function drawSum() { const c = cnt(); sum.textContent = BR.map(b => b[0] + b[1] + ' ' + (c[b[0]] || 0)).join('  ') + '  | 총 ' + m.pins.length + '건'; if (m.pins.length >= 15) Eco.dailyOnce('ecomap', 12, '생태지도 15건 기록'); }

    /** 'A, 길, 면, 군, 도, 우편번호, 대한민국' → '면 군 도' (시·군 구분용) */
    const place = d => d.split(',').map(s => s.trim()).filter(s => s && s !== '대한민국' && !/^\d{4,5}$/.test(s)).slice(-3).join(' · ');
    /* ── 학교 검색: 나이스(NEIS) 교육정보 개방 포털의 학교 기본 정보(이름·주소) → 주소를 OpenStreetMap으로 좌표화 ── */
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    async function neisSearch(nm) {
      const url = 'https://open.neis.go.kr/hub/schoolInfo?' + new URLSearchParams({ Type: 'json', pIndex: '1', pSize: '40', SCHUL_NM: nm });
      const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status); const d = await r.json();
      return d.schoolInfo ? d.schoolInfo[1].row : [];
    }
    async function nomi(qs) {
      const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ q: qs, format: 'json', limit: '3', countrycodes: 'kr', 'accept-language': 'ko' });
      const r = await fetch(url, { headers: { Accept: 'application/json' } }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
    }
    /** 도로명주소 → 좌표. 정확한 건물 → 도로 → 읍·면·동 → 시·군 순으로 시도하고 정확도(level)를 함께 돌려준다 */
    async function geocodeAddr(addr) {
      const a = addr.replace(/\(.*?\)/g, '').replace(/,.*$/, '').trim(), t = a.split(/\s+/);
      const noNum = t.length > 1 && /^\d[\d-]*$/.test(t[t.length - 1]) ? t.slice(0, -1) : t;
      const road = noNum.find(w => /(로|길)\d*(번길)?$/.test(w) || /\d+(로|길)$/.test(w)), area = t.filter(w => /(시|군|구|읍|면|동|리)$/.test(w) && w !== road);
      const city = t.slice(0, 3).filter(w => /(도|시|군|구)$/.test(w)).join(' '), eup = area.filter(w => /(읍|면|동|리)$/.test(w));
      const steps = [[a, 3], [noNum.join(' '), 3], road ? [road + ' ' + area.slice(-2).join(' '), 3] : null, eup.length ? [eup[eup.length - 1] + ' ' + (area.find(w => /(시|군)$/.test(w)) || ''), 2] : null, [area.filter(w => /(시|군)$/.test(w)).join(' ') || city, 1]].filter(Boolean);
      const seen = new Set();
      for (let i = 0; i < steps.length; i++) {
        if (seen.has(steps[i][0])) continue; seen.add(steps[i][0]); if (i) await sleep(1100);
        const res = await nomi(steps[i][0]); if (res.length) return { lat: +res[0].lat, lon: +res[0].lon, level: steps[i][1] };
      }
      return null;
    }
    const schoolCard = (x, onclick) => h('button.qcard', { style: { padding: '8px 10px' }, onclick },
      h('div', { style: { fontSize: '1.4rem' } }, '🏫'), h('div', h('b', x.name), h('small', ' ' + x.sub), x.addr ? h('div.small.muted', x.addr) : null));

    async function search() {
      const text = q.value.trim(); if (!text) { Eco.ui.toast('학교 이름을 입력해 주세요'); return; }
      results.innerHTML = ''; results.append(h('div.small.muted', '학교를 찾는 중…'));
      const toks = text.split(/\s+/), nm = toks[0], rest = toks.slice(1); let rows = [], neisOk = true;
      try {
        rows = await neisSearch(nm);
        if (!rows.length && /(초|중|고)$/.test(nm)) rows = await neisSearch(nm.replace(/초$/, '초등학교').replace(/중$/, '중학교').replace(/고$/, '고등학교'));
      } catch (e) { neisOk = false; }
      results.innerHTML = '';
      if (rows.length) {
        const hit = x => rest.filter(w => (x.ORG_RDNMA + x.ATPT_OFCDC_SC_NM + x.LCTN_SC_NM).includes(w)).length;
        rows.sort((a, b) => (hit(b) - hit(a)) || ((b.ATPT_OFCDC_SC_NM.startsWith('경기') ? 1 : 0) - (a.ATPT_OFCDC_SC_NM.startsWith('경기') ? 1 : 0)));
        if (rows.length > 12) results.append(h('div.small.muted', '검색 결과가 많아요. ‘학교 이름 + 시·군 이름’(예: 군남초 연천)으로 줄여 보세요.'));
        rows.slice(0, 12).forEach(x => results.append(schoolCard({ name: x.SCHUL_NM, sub: '· ' + x.SCHUL_KND_SC_NM + (x.FOND_SC_NM ? ' · ' + x.FOND_SC_NM : ''), addr: x.ORG_RDNMA.replace(/\s*,.*$/, '') }, () => pickNeis(x))));
        return;
      }
      /* 나이스에서 못 찾았거나(네트워크 오류 포함) → OpenStreetMap 이름 검색으로 보조 */
      try {
        const list = await nomi(text);
        if (list.length) { list.forEach(x => results.append(schoolCard({ name: (x.name || x.display_name.split(',')[0]).trim(), sub: '· ' + place(x.display_name) }, () => setSchool({ name: (x.name || x.display_name.split(',')[0]).trim(), lat: +x.lat, lon: +x.lon, level: 3 })))); return; }
      } catch (e) { /* 아래 안내 */ }
      results.append(h('div.note', (neisOk ? '검색 결과가 없어요. 학교 이름을 다르게 써 보세요(예: ‘군남초’, ‘군남초등학교’).' : '학교 정보를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.') + ' 또는 아래 지도를 직접 움직여 학교 위치로 간 뒤 ‘이 화면 중심을 학교로 저장’을 눌러도 돼요.'));
    }
    async function pickNeis(x) {
      results.innerHTML = ''; results.append(h('div.small.muted', '📍 ' + x.SCHUL_NM + ' 위치를 찾는 중… (잠시만 기다려 주세요)'));
      let pos = null; try { pos = await geocodeAddr(x.ORG_RDNMA); } catch (e) { /* 아래 */ }
      results.innerHTML = '';
      if (!pos) { results.append(h('div.note', '주소로 위치를 찾지 못했어요. 지도를 직접 움직여 학교로 이동한 뒤 ‘이 화면 중심을 학교로 저장’을 눌러 주세요. (학교 주소: ' + x.ORG_RDNMA + ')')); return; }
      setSchool({ name: x.SCHUL_NM, lat: pos.lat, lon: pos.lon, addr: x.ORG_RDNMA, level: pos.level });
    }
    function setSchool(s) {
      const lv = s.level || 3; m.school = s; Eco.store.save(); results.innerHTML = '';
      info.textContent = lv >= 3 ? '📍 ' + s.name + ' 주변 지도예요. 지도를 눌러 관찰한 생물을 표시해 보세요!'
        : '📍 ' + s.name + ' — 주소로 찾은 ' + (lv === 2 ? '동네(읍·면·동)' : '시·군') + ' 근처 대략 위치예요. 위성 지도로 바꿔 학교 건물을 찾아 지도를 옮긴 뒤 ‘📌 이 화면 중심을 학교로 저장’을 눌러 정확하게 맞춰 주세요.';
      if (map) map.setView([s.lat, s.lon], lv >= 3 ? 18 : lv === 2 ? 16 : 14); Eco.dailyOnce('ecomap-school', 5, '우리 학교 위치 불러오기'); drawSchoolMarker();
    }
    let schoolMk = null;
    function drawSchoolMarker() { if (!map) return; if (schoolMk) map.removeLayer(schoolMk); if (m.school) schoolMk = L.marker([m.school.lat, m.school.lon], { icon: L.divIcon({ className: 'fm-icon', iconSize: [38, 38], iconAnchor: [19, 19], html: '<div class="fm-pin" style="border-color:#e8506f;width:38px;height:38px">🏫</div>' }), interactive: false, keyboard: false, zIndexOffset: -100 }).addTo(map); }

    /* ── 핀 ── */
    function iconOf(e) { return L.divIcon({ className: 'fm-icon', iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14], html: '<div class="fm-pin" style="width:30px;height:30px;font-size:16px;border-color:#2f8f4e">' + e + '</div>' }); }
    function popupFor(p) {
      const memo = h('input', { type: 'text', placeholder: '이름·메모 (예: 느티나무)', value: p.memo || '', style: { minWidth: '180px' } }); memo.addEventListener('input', () => { p.memo = memo.value; Eco.store.save(); });
      return h('div', h('b', p.e + ' ' + p.n), h('div.small.muted', p.lat.toFixed(5) + ', ' + p.lon.toFixed(5)), memo, h('button.btn.berry.sm', { style: { marginTop: '6px', color: '#fff' }, onclick: () => removePin(p) }, '🗑 지우기'));
    }
    function addMarker(p) {
      const mk = L.marker([p.lat, p.lon], { icon: iconOf(p.e), draggable: true, title: p.n }).addTo(map); mk.bindPopup(() => popupFor(p), { autoPan: false });
      mk.on('dragend', () => { const ll = mk.getLatLng(); p.lat = ll.lat; p.lon = ll.lng; Eco.store.save(); }); markers[p.id] = mk;
    }
    function removePin(p) { const mk = markers[p.id]; if (mk) map.removeLayer(mk); delete markers[p.id]; m.pins = m.pins.filter(x => x.id !== p.id); savePins(); }
    function addPin(ll) { const p = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), lat: ll.lat, lon: ll.lng, e: cur[0], n: cur[1], memo: '', ts: Date.now() }; m.pins.push(p); addMarker(p); Eco.ui.sfx('pop'); savePins(); }


    /* ── PNG로 저장: 지도 타일 + 표시한 핀 + 제목/범례를 한 장의 그림으로 ── */
    function savePng() {
      if (!map || !m.school) { Eco.ui.toast('먼저 학교를 검색해 지도를 불러와 주세요'); return; }
      const mr = mapBox.getBoundingClientRect(), W0 = Math.round(mr.width), H0 = Math.round(mr.height), HEAD = 70, FOOT = 30, sc = 2;
      const cv = document.createElement('canvas'); cv.width = W0 * sc; cv.height = (H0 + HEAD + FOOT) * sc; const g = cv.getContext('2d'); g.scale(sc, sc);
      g.fillStyle = '#fff'; g.fillRect(0, 0, W0, H0 + HEAD + FOOT);
      g.fillStyle = '#2f8f4e'; g.fillRect(0, 0, W0, HEAD); g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.font = 'bold 22px sans-serif'; g.fillText('🗺️ ' + m.school.name + ' 생태지도', 14, 26);
      const c = cnt(); g.font = '13px sans-serif'; g.fillText(BR.map(b => b[0] + (c[b[0]] || 0)).join('  ') + '  | 총 ' + m.pins.length + '건', 14, 53);
      g.save(); g.beginPath(); g.rect(0, HEAD, W0, H0); g.clip(); g.translate(0, HEAD); g.fillStyle = '#e8efe0'; g.fillRect(0, 0, W0, H0);
      mapBox.querySelectorAll('img.leaflet-tile').forEach(im => { if (!im.complete || !im.naturalWidth) return; const r = im.getBoundingClientRect(); try { g.drawImage(im, r.left - mr.left, r.top - mr.top, r.width, r.height); } catch (e) { } });
      const pin = (x, y, emo, r, col, memo) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 3; g.strokeStyle = col; g.stroke(); g.fillStyle = '#000'; g.font = Math.round(r * 1.05) + 'px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emo, x, y + 1);
        if (memo) { g.font = 'bold 12px sans-serif'; g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.95)'; g.strokeText(memo, x, y + r + 11); g.fillStyle = '#23311f'; g.fillText(memo, x, y + r + 11); } };
      m.pins.forEach(p => { const q = map.latLngToContainerPoint([p.lat, p.lon]); pin(q.x, q.y, p.e, 15, '#2f8f4e', p.memo); });
      const sp = map.latLngToContainerPoint([m.school.lat, m.school.lon]); pin(sp.x, sp.y, '🏫', 19, '#e8506f', null); g.restore();
      g.fillStyle = '#55664d'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = '11px sans-serif'; const d = new Date(); g.fillText('Eco AI 숲속탐험대 · ' + d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate() + ' · ' + (base === 'sat' ? 'Tiles © Esri' : '© OpenStreetMap contributors'), 14, H0 + HEAD + FOOT / 2);
      try {
        cv.toBlob(b => { if (!b) { Eco.ui.toast('그림을 만들지 못했어요'); return; } const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = '생태지도_' + m.school.name.replace(/[\\/:*?"<>|\s]/g, '') + '_' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '.png'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); Eco.ui.toast('🖼️ PNG 그림을 저장했어요! (다운로드 폴더)'); Eco.dailyOnce('ecomap-png', 5, '생태지도 PNG 저장'); }, 'image/png');
      } catch (e) { Eco.ui.toast('이 화면은 그림으로 저장할 수 없어요. 화면 캡처(Win+Shift+S)를 이용해 주세요.'); }
    }

    /* ── 도구 ── */
    const tools = h('div.row', BR.map((b, i) => h('button.btn.sm' + (i === 0 ? '.sun' : '.alt'), { onclick: e => { cur = b; [...e.target.parentElement.children].forEach(x => { x.classList.remove('sun'); x.classList.add('alt'); }); e.target.classList.add('sun'); e.target.classList.remove('alt'); } }, b[0] + ' ' + b[1])));
    const baseBtns = h('div.row', { style: { gap: '4px' } }, h('button.btn.sm', { onclick: e => setBase('osm', e.target) }, '🗺️ 지도'), h('button.btn.sm.alt', { onclick: e => setBase('sat', e.target) }, '🛰️ 위성'));
    let osm, sat;
    function setBase(k, btn) { base = k; if (!map) return; if (k === 'sat') { map.removeLayer(osm); sat.addTo(map); } else { map.removeLayer(sat); osm.addTo(map); } [...baseBtns.children].forEach(b => { b.classList.add('alt'); }); btn.classList.remove('alt'); }
    const gps = h('button.btn.alt.sm', { onclick: () => { if (!navigator.geolocation) { Eco.ui.toast('이 기기에서는 위치 기능을 쓸 수 없어요'); return; } navigator.geolocation.getCurrentPosition(pos => { setSchool({ name: (m.school && m.school.name) || '내 위치', lat: pos.coords.latitude, lon: pos.coords.longitude }); }, () => Eco.ui.toast('위치 권한이 없어요. 학교 이름으로 검색해 주세요.'), { enableHighAccuracy: true, timeout: 10000 }); } }, '📍 지금 내 위치로');
    const center = h('button.btn.alt.sm', { onclick: () => { if (!map) return; const c = map.getCenter(); setSchool({ name: q.value.trim() || (m.school && m.school.name) || '우리 학교', lat: c.lat, lon: c.lng }); } }, '📌 이 화면 중심을 학교로 저장');
    const search1 = h('button.btn.sm', { onclick: search }, '🔍 검색'); q.addEventListener('keydown', e => { if (e.key === 'Enter') search(); });

    setTimeout(() => {
      if (!window.L) { mapBox.append(h('div.note', '지도 엔진을 불러오지 못했어요.')); return; }
      const c = m.school ? [m.school.lat, m.school.lon] : [36.5, 127.8];
      map = L.map(mapBox, { maxZoom: 20 }).setView(c, m.school ? 18 : 7);
      osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20, maxNativeZoom: 19, crossOrigin: 'anonymous', attribution: '© OpenStreetMap contributors' }).addTo(map);
      sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20, maxNativeZoom: 19, crossOrigin: 'anonymous', attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics' });
      m.pins.forEach(addMarker); drawSchoolMarker(); map.on('click', e => { if (!m.school) { Eco.ui.toast('먼저 학교를 검색해 위치를 불러와 주세요'); return; } addPin(e.latlng); });
      map.invalidateSize(); drawSum();
      Eco.onLeave(() => { try { map.off(); map.remove(); } catch (e) { } map = null; });
    }, 50);
    drawSum();
    return h('div', h('h3', '🗺️ 우리 학교 생태지도 그리기'),
      h('p.small.muted', '① 학교 이름을 검색해 지도를 불러와요 → ② 생물 도구를 고르고 → ③ 지도를 눌러 관찰한 곳을 표시해요. 표시를 눌러 이름을 적고, 끌어서 위치를 고칠 수 있어요. (‘데이터를 만드는 아이’ 되기)'),
      h('div.row', { style: { flexWrap: 'nowrap' } }, q, search1), results, h('div.row', { style: { margin: '6px 0' } }, gps, center), info, tools, h('div.row.spread', { style: { margin: '6px 0' } }, sum, baseBtns), mapBox,
      h('div.row', { style: { marginTop: '8px' } },
        h('button.btn.sm', { onclick: savePng }, '🖼️ PNG로 저장'),
        h('button.btn.alt.sm', { onclick: () => Eco.copy(['학교,' + ((m.school && m.school.name) || ''), '번호,종류,메모,위도,경도', ...m.pins.map((p, i) => [i + 1, p.n, '"' + (p.memo || '').replace(/"/g, '""') + '"', p.lat.toFixed(6), p.lon.toFixed(6)].join(','))].join('\n')) }, '📋 표(CSV)로 복사'),
        h('button.btn.alt.sm', { onclick: () => { if (!m.pins.length) return; if (confirm('표시한 ' + m.pins.length + '곳을 모두 지울까요?')) { Object.values(markers).forEach(mk => map.removeLayer(mk)); Object.keys(markers).forEach(k => delete markers[k]); m.pins = []; savePins(); } } }, '🧹 모두 지우기')),
      h('div.small.muted', { style: { marginTop: '6px' } }, '※ 학교 위치 검색은 OpenStreetMap 데이터를 사용해요. 학교가 검색되지 않으면 주소로 검색하거나 지도를 직접 움직여 ‘이 화면 중심을 학교로 저장’을 눌러 주세요.'));
  };
})(window.Eco);
