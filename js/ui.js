/* UI 도우미: DOM 생성, 모달, 토스트, 효과음, 폭죽 */
window.Eco = window.Eco || {};
(function (Eco) {
  /* Element.append 에 배열·null 을 그대로 넘겨도 되도록 보강 */
  const _append = Element.prototype.append;
  Element.prototype.append = function (...a) { return _append.apply(this, a.flat(9).filter(x => x != null && x !== false)); };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /** h('div.cls#id', {onclick}, children...) */
  function h(tag, attrs, ...kids) {
    const m = /^([a-z0-9]+)((?:[.#][\w-]+)*)$/i.exec(tag) || [0, 'div', ''];
    const el = document.createElement(m[1]);
    (m[2].match(/[.#][\w-]+/g) || []).forEach(t => t[0] === '.' ? el.classList.add(t.slice(1)) : el.id = t.slice(1));
    if (attrs != null && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
    for (const k in (attrs || {})) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'class') el.className += ' ' + v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat(9).forEach(c => { if (c == null || c === false) return; el.append(c instanceof Node ? c : document.createTextNode(c)); });
    return el;
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [...(r || document).querySelectorAll(s)]; }

  /* 효과음 (WebAudio 합성) */
  let ac;
  function tone(freq, dur, type = 'sine', vol = .12, when = 0) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = freq; g.gain.value = vol;
      o.connect(g); g.connect(ac.destination);
      const t = ac.currentTime + when;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.start(t); o.stop(t + dur + .02);
    } catch (e) { /* 소리 불가 */ }
  }
  function sfx(name) {
    if (!Eco.store.get().settings.sound) return;
    const seq = {
      ok: [[660, .1], [880, .14]], bad: [[220, .18, 'sawtooth', .08]], click: [[520, .05, 'triangle', .08]],
      level: [[523, .12], [659, .12], [784, .12], [1047, .3]], pop: [[740, .07, 'triangle']], coin: [[988, .08, 'square', .06], [1319, .18, 'square', .06]],
      win: [[523, .1], [659, .1], [784, .1], [1047, .1], [1319, .35]]
    }[name] || [];
    seq.forEach((n, i) => tone(n[0], n[1], n[2] || 'sine', n[3] || .12, i * (n[1] * .9)));
  }

  function toast(msg, kind) {
    const root = $('#toasts'); if (!root) return;
    const t = h('div.toast' + (kind ? '.' + kind : ''), msg);
    root.append(t); setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = 0; setTimeout(() => t.remove(), 420); }, 2600);
  }

  function modal(content, opts = {}) {
    const root = $('#modal-root');
    const close = () => { ov.remove(); document.removeEventListener('keydown', onkey); opts.onclose && opts.onclose(); };
    const onkey = e => { if (e.key === 'Escape') close(); };
    const box = h('div.modal' + (opts.wide ? '.wide' : ''), { role: 'dialog', 'aria-modal': 'true' },
      h('div.row.spread', h('div'), h('button.btn.alt.sm', { onclick: close, 'aria-label': '닫기' }, '✕ 닫기')), content);
    const ov = h('div.ov', { onclick: e => { if (e.target === ov) close(); } }, box);
    root.append(ov); document.addEventListener('keydown', onkey);
    return { close, box };
  }

  /* 폭죽 */
  function confetti(n = 120) {
    const c = $('#confetti'); if (!c) return;
    const ctx = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
    const colors = ['#5fb35a', '#ffc533', '#e8506f', '#4aa8e8', '#7b5cd6', '#ff8a3d'];
    const ps = Array.from({ length: n }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4,
      s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - .5) * .4, col: colors[(Math.random() * colors.length) | 0]
    }));
    let f = 0;
    (function loop() {
      ctx.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.col; ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); ctx.restore(); });
      if (++f < 130) requestAnimationFrame(loop); else ctx.clearRect(0, 0, c.width, c.height);
    })();
  }

  function refreshHud() {
    const S = Eco.store.get(), L = Eco.store.levelInfo();
    const set = (id, v, prop = 'textContent') => { const e = document.getElementById(id); if (e) e[prop] = v; };
    const ses = Eco.session, lo = document.getElementById('logout-btn'); if (lo) lo.classList.toggle('hidden', !ses);
    const hb0 = document.getElementById('hud-btn'); if (hb0) hb0.classList.toggle('hidden', !ses);
    if (ses && (ses.role === 'teacher' || ses.role === 'admin')) {
      set('hud-avatar', ses.role === 'admin' ? '🛠️' : '👩‍🏫'); set('hud-level', (ses.name || '') + (ses.role === 'admin' ? ' (관리자)' : ' 선생님')); set('hud-streak', '');
      const x0 = document.getElementById('hud-xp'); if (x0) x0.style.width = '0%'; return;
    }
    const hb = document.getElementById('hud-btn'); if (hb && ses && ses.role === 'student') hb.title = (ses.cls || '') + ' ' + ses.no + '번 ' + ses.name;
    set('hud-avatar', S.avatar); set('hud-level', 'Lv.' + L.level + ' ' + L.name); set('hud-streak', '🔥' + S.streak.count);
    const x = document.getElementById('hud-xp'); if (x) x.style.width = L.pct + '%';
  }

  Eco.ui = { h, $, $$, esc, tone, sfx, toast, modal, confetti, refreshHud };

  /* 해시 라우터 등록 */
  Eco.routes = []; Eco.cleanups = [];
  Eco.route = (pattern, fn, nav) => Eco.routes.push({ re: new RegExp('^' + pattern.replace(/:\w+/g, '([^/]+)') + '$'), fn, nav });
  Eco.onLeave = fn => Eco.cleanups.push(fn);
  Eco.go = hash => { location.hash = hash; };
  /* 하루 한 번만 보너스 XP */
  Eco.dailyOnce = (key, xp, reason) => {
    const S = Eco.store.get(), k = 'd:' + Eco.today() + ':' + key;
    if (S.meta[k]) return false;
    S.meta[k] = 1; Eco.store.save(); Eco.store.addXP(xp, reason); return true;
  };
  Eco.shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };
  Eco.pick = a => a[Math.random() * a.length | 0];
  /** 같은 출처가 아니어도(file://) 동작하는 원본 전자책 프레임 */
  Eco.frame = (pageId, width, opts = {}) => {
    const W = 800, H = 1280;
    const wrap = h('div.pageframe-wrap');
    const ifr = h('iframe', { src: 'aidt/' + pageId + '.html', title: '원본 Eco AI 디지털교과서 ' + pageId, width: W, height: H, loading: 'lazy', allow: 'autoplay; fullscreen' });
    wrap.append(ifr);
    const fit = () => {
      const avail = Math.min(width || wrap.parentElement && wrap.parentElement.clientWidth || 420, W * (opts.max || 1.0));
      const s = Math.max(.3, Math.min(1.2, avail / W));
      ifr.style.transform = 'scale(' + s + ')'; wrap.style.width = W * s + 'px'; wrap.style.height = H * s + 'px';
    };
    requestAnimationFrame(fit);
    const ro = () => fit(); window.addEventListener('resize', ro); Eco.onLeave(() => window.removeEventListener('resize', ro));
    wrap.setPage = id => { ifr.src = 'aidt/' + id + '.html'; };
    wrap.fit = fit;
    return wrap;
  };
})(window.Eco);
