/* 에코 놀이터(게임 허브) */
(function (Eco) {
  const { h } = Eco.ui;
  const ORDER = ['trash', 'ocean', 'foodweb', 'hide', 'carbon', 'arena', 'onechance', 'prompt', 'aitrainer', 'vibe', 'chatbot'];

  Eco.route('/arcade', function () {
    const S = Eco.store.get();
    const card = g => { const rec = S.games[g.id]; return h('a.tile', { href: '#/game/' + g.id }, h('span.chip.sun.tag', g.tag), h('div.ic', g.emoji), h('h3', g.name), h('p', g.desc), rec ? h('small.muted', '▶ ' + rec.plays + '회 · 🏆 최고 ' + rec.best) : h('small.muted', '아직 안 해 봤어요')); };
    const cats = [['🏗️ 만들고 키우고 지키는 게임', ['ecotown', 'trashdefense', 'ecofarm', 'boat']], ['🌱 생태·관찰·실천', ['trash', 'ocean', 'foodweb', 'hide', 'carbon', 'aquafarm']], ['🧠 퀴즈·스토리', ['arena', 'onechance']], ['🤖 AI 리터러시 (생성형 AI·바이브코딩)', ['prompt', 'aitrainer', 'vibe', 'chatbot']]];
    return h('div.fade-in', h('div.hero', { style: { background: 'linear-gradient(135deg,#e0861f,#e8506f)' } }, h('h1', '🎮 에코 놀이터'), h('p', '숲에서 배운 것을 게임으로 한 번 더! 게임마다 하루 한 번 XP를 받고, 최고 기록을 쌓아요.')),
      cats.map(([t, ids]) => h('div', h('div.section-title', h('h2', t)), h('div.grid.g3', ids.map(id => Eco.games[id]).filter(Boolean).map(card)))),
      h('div.section-title', h('h2', '🧊 메타버스 게임')), h('div.grid.g3', h('a.tile', { href: '#/meta/ecocraft' }, h('span.chip.meta.tag', '3D'), h('div.ic', '🧊'), h('h3', '에코크래프트'), h('p', '네모난 3D 세상에서 숲을 되살려요. (마인크래프트 느낌의 생태 복원 게임)')), card(Eco.games.forestworld)));
  });
  Eco.route('/game/:id', function (id) {
    const g = Eco.games[id]; if (!g) return h('div.card', '게임을 찾을 수 없어요.');
    return h('div.fade-in', h('a.back', { href: '#/arcade' }, '← 에코 놀이터'), h('div.row.spread', h('h1', g.emoji + ' ' + g.name), h('span.chip.sun', g.tag)), h('p.muted', g.desc), g.make());
  });
})(window.Eco);
