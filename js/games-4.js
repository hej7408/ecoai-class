/* 에코 놀이터 4: 입상작 모티브 — 에코-노트 · 그린 아쿠아 팜 · 학교숲 씨앗왕 · AI 스마트팜 코딩 (내용은 새로 구성) */
(function (Eco) {
  const { h } = Eco.ui;

  /* ───── 그린 아쿠아 팜 (제54회 전국교육자료전 '무한 리사이클 모듈형 그린 아쿠아 팜' 모티브) ───── */
  Eco.addGame('aquafarm', { name: '그린 아쿠아 팜', emoji: '🐟', tag: '입상작 모티브', desc: '물고기·미생물·식물이 물을 돌려 쓰는 순환 농장! 먹이와 햇빛을 조절해 10일 동안 건강하게 지켜요. (아쿠아포닉스 모티브)', cat: '생태',
    make() {
      const box = h('div.gamebox');
      const st = { day: 1, fish: 5, plant: 5, amm: 2, nit: 2, log: [], feed: 3, light: 3, over: false };
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const step = () => {
        /* 물고기 먹이 → 암모니아↑, 미생물이 암모니아→질산염, 식물이 질산염 흡수, 빛↑ 식물 성장 */
        st.amm = clamp(st.amm + st.feed * .8 - 2.2, 0, 10); const conv = Math.min(st.amm, 2.2); st.amm = clamp(st.amm - 0, 0, 10);
        st.nit = clamp(st.nit + conv * .8 - st.plant * .2, 0, 10);
        const lack = st.nit < 1.2; st.plant = clamp(st.plant + (st.light - 2) * .6 - (lack ? 1.2 : 0) - (st.light > 4.5 ? .8 : 0), 0, 10);
        const toxic = st.amm > 6; st.fish = clamp(st.fish - (toxic ? 1.5 : 0) - (st.feed < 1.5 ? 1 : 0) + (st.feed >= 2.5 && st.amm < 5 ? .3 : 0), 0, 10);
        st.log.unshift('D' + st.day + (toxic ? ' ⚠️ 암모니아가 높아 물고기가 힘들어요' : lack ? ' 🌱 영양(질산염)이 부족해 식물이 시들어요' : ' ✅ 순환이 잘 되고 있어요'));
        st.day++; if (st.day > 10 || st.fish <= 0 || st.plant <= 0) st.over = true;
      };
      const bar = (label, v, color) => h('div', { style: { margin: '4px 0' } }, h('div.small', label + ' ' + v.toFixed(1) + ' / 10'), h('div.xpbar', h('span', { style: { width: v * 10 + '%', background: color } })));
      const draw = () => {
        box.innerHTML = '';
        if (st.over) {
          const sc = Math.round((st.fish + st.plant) * 5 + (st.fish > 0 && st.plant > 0 ? 20 : 0)); Eco.gameDone('aquafarm', sc, 10, '그린 아쿠아 팜');
          box.append(h('div.card', h('h2', st.fish > 0 && st.plant > 0 ? '🎉 순환 농장 성공!' : '😢 순환이 무너졌어요'), h('p', '점수 ' + sc), h('p.muted', '물고기 배설물(암모니아) → 미생물 → 식물 영양(질산염) → 깨끗해진 물이 다시 물고기에게. 이 고리가 균형을 이루면 물을 갈지 않아도 돼요!'), h('button.btn', { onclick: () => { Object.assign(st, { day: 1, fish: 5, plant: 5, amm: 2, nit: 2, log: [], feed: 3, light: 3, over: false }); draw(); } }, '다시 하기'))); return;
        }
        box.append(h('div.note', '📆 ' + st.day + '일째 / 10일 · 무한 리사이클 팜을 지켜요'),
          h('div', { style: { fontSize: '2.2rem', textAlign: 'center' } }, '🐟'.repeat(Math.max(1, Math.round(st.fish / 2))) + ' 🦠 ' + '🥬'.repeat(Math.max(1, Math.round(st.plant / 2)))),
          bar('🐟 물고기 건강', st.fish, '#4aa3df'), bar('🥬 식물 건강', st.plant, '#6bbf59'), bar('☠️ 암모니아(독)', st.amm, '#d9534f'), bar('🧪 질산염(영양)', st.nit, '#e0b43a'));
        const slider = (label, key) => h('label', { style: { display: 'block', margin: '8px 0' } }, label + ' ', h('b', st[key]), h('input', { type: 'range', min: 0, max: 5, step: 1, value: st[key], style: { width: '100%' }, oninput: e => { st[key] = +e.target.value; e.target.previousSibling.textContent = st[key]; } }));
        box.append(slider('🍽️ 먹이 주는 양 (0~5)', 'feed'), slider('☀️ 햇빛(식물등) 세기 (0~5)', 'light'), h('button.btn', { onclick: () => { step(); Eco.ui.sfx('coin'); draw(); } }, '하루 보내기 ▶'), h('div.small.muted', { style: { marginTop: '8px' } }, st.log.slice(0, 4).map(t => h('div', t))));
      };
      draw(); return box;
    } });

  /* 입상작 모티브 안내 (허브에서 표시) */
  Eco.EXTRA.push(
    { id: 'aquafarm', route: '#/game/aquafarm', emoji: '🐟', name: '그린 아쿠아 팜 (순환 농장)', ref: '제54회 전국교육자료전 ‘무한 리사이클 모듈형 그린 아쿠아 팜’(김진희 외) 모티브', desc: '물고기·미생물·식물이 물을 돌려 쓰는 순환 농장을 10일 동안 지켜요.' }
  );
})(window.Eco);
