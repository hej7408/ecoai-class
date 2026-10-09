/* 경기도 숲체험 지도 (Leaflet + OpenStreetMap) */
(function (Eco) {
  const { h } = Eco.ui;

  Eco.route('/map', function () {
    const S = Eco.store.get(); S.meta.visits = S.meta.visits || {};
    const SITES = Eco.FOREST_MAP, TYPES = Eco.FOREST_TYPES;
    let filter = 'all', q = '', onlyOrig = false, alwaysLabels = false, map = null; const markers = {}; let closeTimer = null;
    const root = h('div.fade-in');
    const visitedN = () => SITES.filter(s => S.meta.visits[s.id]).length;

    const mapBox = h('div#forest-map', { style: { height: 'min(70vh,620px)', minHeight: '380px', borderRadius: '20px', border: '3px solid var(--g2)', overflow: 'hidden', boxShadow: 'var(--sh)', zIndex: 0 } });
    const banner = h('div.note', { style: { display: 'none' } }, '지도 배경 이미지를 불러오지 못했어요. 인터넷 연결을 확인해 주세요. (아래 목록의 링크는 그대로 쓸 수 있어요)');
    const list = h('div', { style: { maxHeight: 'min(70vh,620px)', overflow: 'auto', display: 'grid', gap: '6px' } });
    const stats = h('div.row');
    const chips = h('div.pill-tabs');

    const visible = () => SITES.filter(s => (filter === 'all' || s.type === filter) && (!onlyOrig || s.kind === 'orig') && (!q || (s.name + s.city).includes(q)));

    function popupNode(s) {
      const t = TYPES[s.type]; const done = S.meta.visits[s.id];
      const node = h('div', { style: { minWidth: '210px', fontFamily: 'var(--font)' } },
        h('div', { style: { fontWeight: 700, fontSize: '1.05rem' } }, t.ic + ' ' + s.name),
        h('div.small', { style: { color: '#55664d' } }, t.name + ' · 경기도 ' + s.city + (s.kind === 'orig' ? ' · 원본 전자책 수록' : '')),
        s.note ? h('div.small', { style: { margin: '4px 0' } }, s.note) : null,
        s.approx ? h('div.small', { style: { color: '#a4580a' } }, '📍 위치는 대략적인 지점이에요. 방문 전에 정확한 위치를 확인하세요.') : null,
        h('div.row', { style: { marginTop: '6px', gap: '6px' } },
          s.url ? h('a.btn.sm', { href: s.url, target: '_blank', rel: 'noopener', style: { color: '#fff' } }, s.search ? '🔎 지도에서 검색' : '🔗 웹사이트 열기') : null,
          h('button.btn.sm' + (done ? '.alt' : '.sun'), { onclick: e => toggleVisit(s, e.target) }, done ? '✅ 다녀왔어요 (' + done + ')' : '📌 가 봤어요!')),
        s.search ? h('div.small', { style: { color: '#55664d', marginTop: '4px' } }, '공식 홈페이지 대신 네이버 지도 검색 결과로 연결돼요.') : null);
      // 팝업 위에 마우스가 있는 동안은 닫히지 않게
      node.addEventListener('mouseenter', () => clearTimeout(closeTimer)); node.addEventListener('mouseleave', () => { closeTimer = setTimeout(() => map && map.closePopup(), 500); });
      return node;
    }
    function toggleVisit(s, btn) {
      if (S.meta.visits[s.id]) { delete S.meta.visits[s.id]; Eco.store.save(); Eco.ui.toast('방문 표시를 지웠어요'); }
      else { S.meta.visits[s.id] = Eco.today(); Eco.store.save(); Eco.store.addXP(15, '숲체험 장소 방문 · ' + s.name); Eco.ui.confetti(30); Eco.ui.sfx('coin'); }
      refreshMarker(s); drawList(); drawStats(); map.closePopup(); Eco.checkBadges && Eco.checkBadges();
    }
    function iconFor(s) {
      const t = TYPES[s.type], v = S.meta.visits[s.id];
      return L.divIcon({ className: 'fm-icon', iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -16], html: '<div class="fm-pin' + (v ? ' got' : '') + '" style="border-color:' + t.color + '">' + t.ic + (v ? '<i>✓</i>' : '') + '</div>' });
    }
    function refreshMarker(s) { const m = markers[s.id]; if (m) m.setIcon(iconFor(s)); }

    function buildMarkers() {
      SITES.forEach(s => {
        const m = L.marker([s.lat, s.lon], { icon: iconFor(s), title: s.name, riseOnHover: true });
        m.bindTooltip(s.name, { permanent: true, direction: 'right', offset: [14, 0], className: 'fm-label' });
        m.bindPopup(() => popupNode(s), { maxWidth: 280, autoPan: false, closeButton: true, className: 'fm-popup' });
        m.on('mouseover', () => { clearTimeout(closeTimer); m.openPopup(); });
        m.on('mouseout', () => { closeTimer = setTimeout(() => { if (!map) return; const el = m.getPopup() && m.getPopup().getElement(); if (!(el && el.matches(':hover'))) m.closePopup(); }, 600); });
        markers[s.id] = m;
      });
    }
    function applyFilter(noFit) {
      const vs = visible(); const vis = new Set(vs.map(s => s.id));
      if (!noFit && vs.length) map.fitBounds(L.latLngBounds(vs.map(s => [s.lat, s.lon])).pad(.12), { maxZoom: 12, animate: false });
      SITES.forEach(s => { const m = markers[s.id]; if (vis.has(s.id)) { if (!map.hasLayer(m)) m.addTo(map); } else if (map.hasLayer(m)) map.removeLayer(m); });
      drawList(); drawChips(); drawStats();
    }
    function drawChips() {
      chips.innerHTML = ''; const cnt = k => SITES.filter(s => (k === 'all' || s.type === k) && (!onlyOrig || s.kind === 'orig')).length;
      chips.append(h('button' + (filter === 'all' ? '.on' : ''), { onclick: () => { filter = 'all'; applyFilter(); } }, '전체 ' + cnt('all')));
      Object.entries(TYPES).forEach(([k, t]) => chips.append(h('button' + (filter === k ? '.on' : ''), { onclick: () => { filter = k; applyFilter(); } }, t.ic + ' ' + t.name + ' ' + cnt(k))));
    }
    function drawStats() { const n = visitedN(); stats.innerHTML = ''; stats.append(h('span.chip.sun', '📌 다녀온 곳 ' + n + ' / ' + SITES.length), h('div.progress', { style: { flex: 1, minWidth: '120px' } }, h('span', { style: { width: Math.round(n / SITES.length * 100) + '%' } })), h('span.small.muted', '보이는 곳 ' + visible().length + '곳')); }
    function drawList() {
      list.innerHTML = ''; const v = visible();
      v.forEach(s => { const t = TYPES[s.type]; list.append(h('button.qcard' + (S.meta.visits[s.id] ? '.done' : ''), { style: { padding: '8px 10px' }, onclick: () => { const m = markers[s.id]; map.flyTo([s.lat, s.lon], Math.max(map.getZoom(), 12), { duration: .8 }); setTimeout(() => { if (map) m.openPopup(); }, 850); mapBox.scrollIntoView({ behavior: 'smooth', block: 'center' }); } },
        h('div', { style: { fontSize: '1.5rem' } }, t.ic), h('div', h('b', s.name), h('small', ' ' + s.city + (s.kind === 'orig' ? ' · 전자책' : '') + (s.approx ? ' · 대략 위치' : ''))), h('span.stamp', S.meta.visits[s.id] ? '✅' : ''))); });
      if (!v.length) list.append(h('p.muted', '조건에 맞는 곳이 없어요.'));
    }

    const search = h('input', { type: 'text', placeholder: '🔍 이름·시군 검색 (예: 가평)', style: { maxWidth: '260px' } }); search.addEventListener('input', () => { q = search.value.trim(); if (map) applyFilter(); });
    const origCb = h('label.row.small', h('input', { type: 'checkbox', style: { width: '18px' }, onchange: e => { onlyOrig = e.target.checked; applyFilter(); } }), '원본 전자책 수록 23곳만');
    const labCb = h('label.row.small', h('input', { type: 'checkbox', style: { width: '18px' }, onchange: e => { alwaysLabels = e.target.checked; setLabels(); } }), '이름 항상 보기');
    function setLabels() { if (!map) return; mapBox.classList.toggle('labels-on', alwaysLabels || map.getZoom() >= 10); }

    root.append(h('a.back', { href: '#/aidt' }, '← 에코아이 교과서'),
      h('div.row.spread', h('h1', '🗺️ 경기도 숲체험 지도'), h('a.btn.alt.sm', { href: '#/read/page048' }, '📖 원본 ‘경기도 숲체험기관’ 쪽')),
      h('p.muted', '원본 전자책에 실린 23곳에 자연휴양림·식물원·생태공원 등 ' + (SITES.length - 23) + '곳을 더해 경기도 숲체험 장소 ' + SITES.length + '곳을 지도에 표시했어요. 표시에 마우스를 올리면(휴대폰은 누르면) 이름과 웹사이트 링크가 나와요. 다녀온 곳은 ‘가 봤어요!’를 눌러 도장과 XP를 받아요.'),
      h('div.row', { style: { margin: '8px 0' } }, search, origCb, labCb), chips, stats, banner,
      h('div.grid', { style: { gridTemplateColumns: 'minmax(0,1fr) 300px', alignItems: 'start', marginTop: '10px' }, class: 'map-grid' }, mapBox, list),
      h('div.note', 'ℹ️ 위치는 OpenStreetMap과 네이버 플레이스 정보를 바탕으로 한 값이고, “대략 위치”로 표시된 곳은 도로·마을·산 기준의 근사 지점이에요. 운영 시간·예약·요금·휴관일은 방문 전에 링크에서 꼭 확인해 주세요. 공식 홈페이지를 확인하지 못한 곳은 네이버 지도 검색 결과로 연결돼요.'));
    // 모바일에서는 목록을 지도 아래로
    const mq = () => { const g = root.querySelector('.map-grid'); if (g) g.style.gridTemplateColumns = innerWidth < 900 ? '1fr' : 'minmax(0,1fr) 300px'; };
    window.addEventListener('resize', mq); Eco.onLeave(() => window.removeEventListener('resize', mq));

    setTimeout(() => {
      if (!window.L) { mapBox.append(h('div.note', 'Leaflet 지도 엔진을 불러오지 못했어요. js/vendor/leaflet.js 를 확인하세요.')); drawList(); drawChips(); drawStats(); return; }
      mq();
      map = L.map(mapBox, { zoomControl: true, minZoom: 8, maxZoom: 17 }).setView([37.5, 127.15], 9);
      let errs = 0; const tl = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);
      tl.on('tileerror', () => { if (++errs > 3) banner.style.display = 'block'; }); tl.on('tileload', () => { banner.style.display = 'none'; });
      buildMarkers(); applyFilter(true); map.fitBounds(L.latLngBounds(SITES.map(s => [s.lat, s.lon])).pad(.08)); setLabels(); map.on('zoomend', setLabels);
      Eco.onLeave(() => { clearTimeout(closeTimer); try { map.stop(); map.off(); map.remove(); } catch (e) { } map = null; });
    }, 30);
    return root;
  });
})(window.Eco);
