/* Таврик — прототип. Чистый JS без сборки, чтобы просто открыть index.html. */
(() => {
  const C = window.TAVRIK_CONTENT;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const haptic = () => navigator.vibrate && navigator.vibrate(8);

  // localStorage может быть недоступен (приватный режим) — не падаем
  const store = {
    get(k, d) { try { const v = localStorage.getItem('tavrik.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('tavrik.' + k, JSON.stringify(v)); } catch {} },
  };

  const ICON = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    building: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4"/>',
    coins: '<circle cx="9" cy="9" r="6"/><path d="M15.9 10.1A6 6 0 1 1 10.1 15.9M9 6.5v5M7 8h3"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    send: '<path d="M4.5 11.5 20 4l-7.5 15.5-2-6z"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
    door: '<path d="M4 21h16M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M14 12h.01"/>',
    book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6.5a2.5 2.5 0 0 0 0 5H19M8 7h7"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
    heart: '<path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 9-2.5A4.5 4.5 0 0 1 21 11c-2 4.5-9 9-9 9z"/>',
    heartPlus: '<path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 9-2.5A4.5 4.5 0 0 1 21 11c-2 4.5-9 9-9 9zM12 9v6M9 12h6"/>',
    crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
    hand: '<path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V10m0-4V4.5a1.5 1.5 0 0 1 3 0V10m0-4.5a1.5 1.5 0 0 1 3 0V12m0-3.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-5-2.7L4 14.5a1.5 1.5 0 0 1 2.5-1.7L7 13.5"/>',
  };
  const icon = (n, sw = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;
  // 'v-*' и 't-*' — стикеры (Вернадский и Таврик для чата), остальное — стальной Таврик
  const IMG_V = '?v=3'; // меняй при замене картинок, чтобы браузер не брал старые из кэша
  const pic = (n) => (/^[vt]-/.test(n) ? `assets/stickers/${n}.webp` : `assets/${n}.webp${IMG_V}`);
  const medal = (who = 'tavrik') => who === 'vernadsky'
    ? '<span class="medal medal--v"><img src="assets/vernadsky-face.webp" alt=""></span>'
    : '<span class="medal"><img src="assets/tavrik-head.webp" alt=""></span>';

  /* ---------- Подгон телефона под окно ---------- */
  function fit() {
    const s = Math.min(1, (innerHeight - 40) / 876, (innerWidth - 40) / 417);
    document.documentElement.style.setProperty('--s', s.toFixed(3));
  }
  addEventListener('resize', fit); fit();

  function tickClock() {
    const d = new Date();
    $('#clock').textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  tickClock(); setInterval(tickClock, 20000);

  /* ---------- Навигация ---------- */
  const TABS = ['home', 'schedule', 'dorm', 'stipend'];
  const OVERLAYS = ['chat', 'history'];
  const state = { tab: 'home', overlay: null, base: 'splash' };
  const scr = (n) => $(`[data-screen="${n}"]`);
  const hooks = {};

  function go(name) {
    if (OVERLAYS.includes(name)) {
      if (state.overlay && state.overlay !== name) closeOverlay(true);
      state.overlay = name;
      scr(name).classList.add('is-active');
      if (scr(name).classList.contains('pushed')) scr(state.tab).classList.add('is-under');
    } else {
      if (state.overlay) closeOverlay(true);
      if (TABS.includes(name)) state.tab = name;
      state.base = name;
      for (const el of $$('.screen')) {
        if (OVERLAYS.includes(el.dataset.screen) || el.classList.contains('is-leaving')) continue;
        el.classList.toggle('is-active', el.dataset.screen === name);
      }
    }
    const current = state.overlay || name;
    $('#tabbar').classList.toggle('is-hidden', !TABS.includes(current));
    $$('#tabbar [data-go]').forEach((b) => b.classList.toggle('on', b.dataset.go === state.tab));
    hooks[name] && hooks[name]();
    updateGuide(current);
  }

  function closeOverlay(silent) {
    const name = state.overlay;
    if (!name) return;
    scr(name).classList.remove('is-active');
    scr(state.tab).classList.remove('is-under');
    state.overlay = null;
    if (name === 'history') story.stop();
    if (!silent) {
      $('#tabbar').classList.toggle('is-hidden', !TABS.includes(state.base));
      updateGuide(state.base);
    }
  }

  $('#app').addEventListener('click', (e) => {
    const t = e.target.closest('[data-go],[data-action]');
    if (!t) return;
    haptic();
    if (t.dataset.go) go(t.dataset.go);
    const a = t.dataset.action;
    if (a === 'back') closeOverlay();
    if (a === 'finishOnboarding') finishOnboarding();
    if (a === 'ask') sendToChat(t.dataset.text);
  });

  /* ---------- Таббар ---------- */
  $('#tabbar').innerHTML = `
    <button data-go="home">${icon('home')}Главная</button>
    <button data-go="schedule">${icon('calendar')}Расписание</button>
    <button class="tab-tavrik" data-go="chat" aria-label="Спросить Таврика">${medal()}</button>
    <button data-go="dorm">${icon('building')}Общежитие</button>
    <button data-go="stipend">${icon('coins')}Стипендии</button>`;
  $$('.icon-btn[data-action="back"]').forEach((b) => (b.innerHTML = icon('back', 2.4)));
  $('.story__close').innerHTML = icon('close', 2.4);
  $('.chat__input .send').innerHTML = icon('send', 2.2);

  /* ---------- 1. Загрузка ---------- */
  const splash = scr('splash');
  let splashTimer, tipTimer, cleanupTimer;
  function startSplash() {
    clearTimeout(splashTimer); clearTimeout(cleanupTimer); clearInterval(tipTimer);
    splash.classList.remove('is-leaving');
    // перезапуск CSS-анимаций
    $$('*', splash).forEach((n) => { n.style.animation = 'none'; void n.offsetHeight; n.style.animation = ''; });
    go('splash');

    $('#particles').innerHTML = Array.from({ length: 34 }, () => {
      const d = 2 + Math.random() * 5;
      return `<i style="left:${Math.random() * 100}%;--d:${d}px;--t:${5 + Math.random() * 6}s;--delay:${Math.random() * 5}s;--x:${(Math.random() - .5) * 120}px;--o:${.4 + Math.random() * .6}"></i>`;
    }).join('');

    const tip = $('#splashTip');
    let i = 0;
    tip.textContent = C.splashTips[0];
    tipTimer = setInterval(() => {
      tip.style.opacity = 0;
      setTimeout(() => { tip.textContent = C.splashTips[++i % C.splashTips.length]; tip.style.opacity = 1; }, 250);
    }, 950);

    function leave() {
      clearInterval(tipTimer);
      splash.classList.add('is-leaving');
      go(store.get('onboarded', false) ? 'home' : 'onboarding');
      cleanupTimer = setTimeout(() => splash.classList.remove('is-active', 'is-leaving'), 850);
    }
    // Стальной Таврик вылетает (CSS-анимация картинки), затем — приложение
    splashTimer = setTimeout(leave, 4300);
  }

  /* ---------- 2. Онбординг ---------- */
  const track = $('#obTrack');
  const groups = ['ИТ-б-о-231', 'ПИ-б-о-241', 'ЮР-б-о-232', 'ФИЛ-б-о-221', 'МЕД-с-о-251', 'ЭК-б-о-242'];
  function renderGroups() {
    const g = store.get('group', C.user.group);
    $('#obGroups').innerHTML = groups.map((x) => `<button class="chip pressable ${x === g ? 'on' : ''}" data-group="${x}">${x}</button>`).join('');
  }
  $('#obGroups').addEventListener('click', (e) => {
    const b = e.target.closest('[data-group]');
    if (!b) return;
    haptic();
    store.set('group', b.dataset.group);
    renderGroups();
  });
  const obIndex = () => Math.round(track.scrollLeft / track.clientWidth);
  track.addEventListener('scroll', () => {
    const i = obIndex();
    $$('#obDots i').forEach((d, k) => d.classList.toggle('on', k === i));
    $('#obNext').textContent = i === 2 ? 'Начать' : 'Далее';
  });
  $('#obNext').addEventListener('click', () => {
    haptic();
    const i = obIndex();
    if (i >= 2) finishOnboarding();
    else track.scrollTo({ left: (i + 1) * track.clientWidth, behavior: 'smooth' });
  });
  function finishOnboarding() { store.set('onboarded', true); go('home'); }
  let obLive; // создаётся заранее, при запуске (см. «Старт»)
  hooks.onboarding = () => { renderGroups(); track.scrollLeft = 0; obLive.greet(); };

  /* ---------- Расписание: общие расчёты ---------- */
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const todayIdx = () => (new Date().getDay() + 6) % 7;
  const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const TYPE_COLOR = { 'Лекция': 'var(--gold-400)', 'Практика': 'var(--blue)', 'Лаба': 'var(--violet)', 'Семинар': 'var(--teal)', 'Встреча': 'var(--rose)' };
  const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; };
  const fmtIn = (m) => (m < 60 ? `${m} ${plural(m, 'минуту', 'минуты', 'минут')}` : `${Math.floor(m / 60)} ч ${m % 60} мин`);

  function pairsFor(day, week = 'num') {
    const list = C.schedule.week[day] || [];
    // демо: в «знаменатель» последней пары нет
    return week === 'den' && list.length > 1 ? list.slice(0, -1) : list;
  }

  function pairStatus() {
    const list = pairsFor(todayIdx());
    const now = nowMin();
    for (const p of list) {
      const [s, e] = C.schedule.times[p[0] - 1].map(toMin);
      if (now >= s && now < e) return { kind: 'now', p, left: e - now, pct: ((now - s) / (e - s)) * 100 };
      if (now < s) return { kind: 'next', p, in: s - now };
    }
    return { kind: 'done' };
  }

  /* ---------- 3. Главная ---------- */
  let factI = new Date().getDate() % C.facts.length;
  function renderHome() {
    const g = store.get('group', C.user.group);
    const st = pairStatus();
    let pairHTML;
    if (st.kind === 'done') {
      pairHTML = `<div class="next-pair__info"><span class="eyebrow">На сегодня всё</span><b>Пары закончились 🎉</b><span>Отдыхай — завтра покажу новые</span></div><img src="${pic('tavrik-music')}" alt="">`;
    } else {
      const [n, subj, type, room] = st.p;
      const [s] = C.schedule.times[n - 1];
      pairHTML = `
        <div class="next-pair__time"><b>${s}</b><small>${n} пара</small></div>
        <div class="next-pair__info">
          <span class="eyebrow">${st.kind === 'now' ? '● Идёт сейчас' : 'Следующая · через ' + fmtIn(st.in)}</span>
          <b>${subj}</b><span>${type} · ауд. ${room}</span>
          ${st.kind === 'now' ? `<div class="progress"><i style="width:${st.pct}%"></i></div>` : ''}
        </div>`;
    }
    const topics = [
      { go: 'history', t: 'История', s: 'Рассказывает Вернадский', img: pic('v-reading'), scene: 'mountains' },
      { go: 'dorm', t: 'Общежития', s: 'Заселение, корпуса, чек-лист', img: pic('tavrik-armchair'), scene: 'forest' },
      { go: 'stipend', t: 'Стипендии', s: 'Узнай, что положено тебе', img: pic('tavrik-chest'), scene: 'autumn' },
      { go: 'schedule', t: 'Расписание', s: 'Пары на неделю', img: pic('v-clock'), scene: 'sea' },
    ];
    // Каркас главной создаётся один раз. «Живой Таврик» (#homeLive) никогда не вынимается из страницы —
    // иначе браузер может не перерисовать остановленный кадр видео, и Таврик «исчезает».
    if (!$('#homeLive')) {
      $('#homeScroll').innerHTML = `
        <div class="home-bg"></div>
        <div id="homeHead"></div>
        <div class="home-live"><div class="live" id="homeLive"></div></div>
        <div id="homeBody"></div>`;
    }
    $('#homeHead').innerHTML = `
      <div class="home-top">
        <img class="home-crest" src="assets/crest-kfu.webp" alt="Герб КФУ">
        <div class="home-top__hi"><b>Привет, ${C.user.name}! 👋</b><span>${g} · ${C.user.institute}</span></div>
        <div class="avatar">${C.user.name[0]}</div>
      </div>`;
    $('#homeBody').innerHTML = `
      <div class="hero gold-border">
        <div class="hero__bubble">Чем помочь сегодня?</div>
        <h2>Спроси о&nbsp;<em>чём угодно</em></h2>
        <button class="hero__ask pressable" data-go="chat">${icon('sparkle')}<span>Спроси Таврика…</span><i class="go">${icon('arrow', 2.4)}</i></button>
      </div>

      <button class="next-pair glass pressable" data-go="schedule" style="width:100%;text-align:left">${pairHTML}</button>

      <div class="section-title"><h3>Спроси о главном</h3></div>
      <div class="topics">
        ${topics.map((x) => `
          <button class="topic pressable" data-go="${x.go}">
            ${Scenes.render(x.scene, 'card')}
            <img class="topic__pic" src="${x.img}" alt=""><b>${x.t}</b><span>${x.s}</span>
          </button>`).join('')}
      </div>

      <div class="section-title"><h3>Факт дня</h3><span>от профессора</span></div>
      <div class="fact glass gold-border">
        ${medal('vernadsky')}
        <div><p id="factText">${C.facts[factI]}</p><button id="factNext">Ещё факт →</button></div>
      </div>`;
    $('#factNext').onclick = () => {
      haptic();
      const p = $('#factText');
      p.style.opacity = 0;
      setTimeout(() => { factI = (factI + 1) % C.facts.length; p.textContent = C.facts[factI]; p.style.opacity = 1; }, 250);
    };
  }
  // Таврик на главной создаётся один раз (видео грузится однажды) и переносится в новую разметку.
  // Каждый раз, когда пользователь возвращается на главную, он радуется заново — без задержки.
  let homeLive, homeLiveEl;
  hooks.home = () => {
    renderHome();
    // Таврик создан заранее (при запуске) и всегда остаётся на месте — просто радуется заново
    homeLive.greet();
  };

  /* ---------- 4. Расписание ---------- */
  const sched = { day: todayIdx(), week: 'num' };
  function renderSchedule() {
    const monday = new Date(); monday.setDate(monday.getDate() - todayIdx());
    const names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const list = pairsFor(sched.day, sched.week);
    const isToday = sched.day === todayIdx();
    const now = nowMin();

    let rows = '';
    list.forEach((p, k) => {
      const [n, subj, type, room, teacher] = p;
      const [s, e] = C.schedule.times[n - 1];
      const live = isToday && now >= toMin(s) && now < toMin(e);
      if (k > 0) {
        const prevEnd = toMin(C.schedule.times[list[k - 1][0] - 1][1]);
        const gap = toMin(s) - prevEnd;
        const len = gap >= 60 ? `${Math.floor(gap / 60)} ч${gap % 60 ? ` ${gap % 60} мин` : ''}` : `${gap} мин`;
        rows += `<div class="break">${gap > 30 ? 'окно' : 'перерыв'} ${len}</div>`;
      }
      rows += `
        <div class="pair ${live ? 'now' : ''}" style="animation-delay:${k * 60}ms">
          <div class="pair__time"><b>${s}</b><span>${e}</span></div>
          <div class="pair__card glass" style="--tc:${TYPE_COLOR[type] || 'var(--gold-400)'}">
            <span class="pair__type">${type}</span><span class="pair__num">${n} пара</span>
            <b>${subj}</b>
            <div class="pair__meta"><span>${icon('door')}${room}</span><span>${icon('user')}${teacher}</span></div>
            ${live ? `<div class="progress"><i style="width:${((now - toMin(s)) / (toMin(e) - toMin(s))) * 100}%"></i></div><div class="pair__live"><span><i></i>Идёт сейчас</span><span>осталось ${fmtIn(toMin(e) - now)}</span></div>` : ''}
          </div>
        </div>`;
    });

    $('#scheduleScroll').innerHTML = `
      <div class="screen-head"><h1>Расписание</h1><span class="pill">${store.get('group', C.user.group)}</span></div>
      <div class="week-toggle ${sched.week === 'den' ? 'right' : ''}">
        <i class="thumb"></i>
        <button data-week="num" class="${sched.week === 'num' ? 'on' : ''}">Числитель</button>
        <button data-week="den" class="${sched.week === 'den' ? 'on' : ''}">Знаменатель</button>
      </div>
      <div class="days">
        ${names.map((nm, i) => {
          const d = new Date(monday); d.setDate(monday.getDate() + i);
          return `<button class="day pressable ${i === sched.day ? 'on' : ''} ${i === todayIdx() ? 'today' : ''} ${pairsFor(i, sched.week).length ? 'has' : ''}" data-day="${i}"><small>${nm}</small><b>${d.getDate()}</b><i></i></button>`;
        }).join('')}
      </div>
      ${list.length ? `<div class="pairs">${rows}</div>` : `
        <div class="empty"><img src="${pic('tavrik-music')}" alt=""><b>Выходной!</b><p>Пар нет. Таврик включил музыку — и тебе советует отдохнуть.</p></div>`}
      <p class="note">Демо-расписание. В приложении оно будет приходить с сервера КФУ, а за 10 минут до пары придёт пуш-уведомление.</p>`;
  }
  $('#scheduleScroll').addEventListener('click', (e) => {
    const d = e.target.closest('[data-day]');
    const w = e.target.closest('[data-week]');
    if (d) { haptic(); sched.day = +d.dataset.day; renderSchedule(); }
    if (w) { haptic(); sched.week = w.dataset.week; renderSchedule(); }
  });
  hooks.schedule = renderSchedule;

  /* ---------- Сегмент-контрол ---------- */
  const segment = (items, active, attr) => {
    const i = items.findIndex((x) => x[0] === active);
    return `<div class="segment"><i class="thumb" style="width:calc(${100 / items.length}% - ${8 / items.length}px);transform:translateX(${i * 100}%)"></i>
      ${items.map(([k, label]) => `<button data-${attr}="${k}" class="${k === active ? 'on' : ''}">${label}</button>`).join('')}</div>`;
  };

  /* ---------- 5. Общежития ---------- */
  const dorm = { tab: 'steps' };
  function renderDorm() {
    const D = C.dorm;
    const checked = store.get('check', []);
    let body = '';
    if (dorm.tab === 'steps') {
      body = `<div class="steps">${D.steps.map((s, i) => `
          <div class="step" style="animation-delay:${i * 70}ms"><div class="step__n">${i + 1}</div>
          <div class="step__card glass"><b>${s.title}</b><p>${s.text}</p></div></div>`).join('')}</div>
        <div class="section-title"><h3>Правила</h3></div>
        <ul class="rules glass">${D.rules.map((r) => `<li>${r}</li>`).join('')}</ul>`;
    } else if (dorm.tab === 'buildings') {
      body = D.buildings.map((b, i) => `
        <div class="building glass" style="animation-delay:${i * 70}ms">
          <div class="building__top"><b>${b.name}</b><span class="walk">🚶 ${b.walk}</span></div>
          <p>${icon('pin')}${b.addr}</p>
          <div class="tags">${b.tags.map((t) => `<span>${t}</span>`).join('')}</div>
          <button class="btn-ghost pressable">${icon('map')}Построить маршрут</button>
        </div>`).join('');
    } else {
      const n = checked.length, total = D.checklist.length, all = n === total;
      body = `
        <div class="check-head glass gold-border">
          <div class="ring" style="--p:${(n / total) * 100}"><b>${n}/${total}</b></div>
          <div><b>${all ? 'Ты готов к заселению!' : 'Собираем вещи'}</b><p>${all ? 'Таврик гордится тобой 💛' : 'Отмечай, что уже положил в сумку'}</p></div>
          <img id="checkSticker" src="${pic(all ? 'tavrik-pillow' : 'tavrik-suitcase')}" alt="">
        </div>
        ${D.checklist.map((c, i) => `
          <button class="check glass pressable ${checked.includes(i) ? 'done' : ''}" data-check="${i}">
            <i class="box">${icon('check', 3)}</i><span>${c}</span>
          </button>`).join('')}`;
    }
    $('#dormScroll').innerHTML = `
      <div class="cover">
        ${Scenes.render('forest', 'card', 3)}
        <img class="cover__pic" src="${pic(dorm.tab === 'check' ? (checked.length === D.checklist.length ? 'tavrik-pillow' : 'tavrik-suitcase') : 'tavrik-armchair')}" alt="">
        <div class="cover__title"><h1>Общежития</h1><p>Всё о заселении — по шагам</p></div>
      </div>
      ${segment([['steps', 'Заселение'], ['buildings', 'Корпуса'], ['check', 'Чек-лист']], dorm.tab, 'dtab')}
      ${body}
      <p class="note">Адреса и порядок — демо. Перед релизом сверить с отделом заселения КФУ.</p>`;
  }
  $('#dormScroll').addEventListener('click', (e) => {
    const t = e.target.closest('[data-dtab]');
    const c = e.target.closest('[data-check]');
    if (t) { haptic(); dorm.tab = t.dataset.dtab; renderDorm(); }
    if (c) {
      haptic();
      const i = +c.dataset.check;
      const list = store.get('check', []);
      store.set('check', list.includes(i) ? list.filter((x) => x !== i) : [...list, i]);
      renderDorm();
      const st = $('#checkSticker');
      st.classList.add('jump'); setTimeout(() => st.classList.remove('jump'), 350);
    }
  });
  hooks.dorm = renderDorm;

  /* ---------- 6. Стипендии ---------- */
  const quiz = store.get('quiz', { form: 'budget', grades: 'good', benefit: 'no', achieve: 'no', course: '12' });
  function eligible(q) {
    const budget = q.form === 'budget';
    const goodGrades = ['excellent', 'good', 'first'].includes(q.grades);
    return {
      academic: budget && goodGrades,
      raised: budget && q.achieve === 'yes' && ['excellent', 'good'].includes(q.grades),
      social: budget && q.benefit === 'yes',
      social_raised: budget && q.benefit === 'yes' && q.course === '12' && ['excellent', 'good'].includes(q.grades),
      named: budget && q.grades === 'excellent' && q.achieve === 'yes',
      help: budget,
    };
  }
  function renderStipend() {
    const Q = [
      ['form', 'Форма обучения', [['budget', 'Бюджет'], ['paid', 'Контракт']]],
      ['grades', 'Как прошла сессия', [['excellent', 'Только «5»'], ['good', '«4» и «5»'], ['three', 'Есть «3»'], ['first', 'Я первокурсник']]],
      ['benefit', 'Есть льготная категория', [['yes', 'Да'], ['no', 'Нет']]],
      ['achieve', 'Есть достижения (наука, спорт, творчество)', [['yes', 'Да'], ['no', 'Нет']]],
      ['course', 'Курс', [['12', '1–2'], ['3', '3 и старше']]],
    ];
    const el = eligible(quiz);
    const count = Object.values(el).filter(Boolean).length;
    $('#stipendScroll').innerHTML = `
      <div class="cover" style="height:260px">
        ${Scenes.render('autumn', 'card', 5)}
        <img class="cover__pic" src="${pic('tavrik-chest')}" alt="">
        <div class="cover__title"><h1>Стипендии</h1><p>Проверь за 20 секунд, что положено именно тебе</p></div>
      </div>
      <div class="quiz glass gold-border" style="margin-top:14px">
        <h3>Какие стипендии мне доступны?</h3>
        <p>Отвечай — результат обновляется сразу.</p>
        ${Q.map(([k, label, opts]) => `
          <div class="q"><label class="eyebrow">${label}</label>
            <div class="chips">${opts.map(([v, t]) => `<button class="chip pressable ${quiz[k] === v ? 'on' : ''}" data-q="${k}" data-v="${v}">${t}</button>`).join('')}</div>
          </div>`).join('')}
        <div class="result">
          <img src="${pic('tavrik-emerald')}" alt="">
          <div><b>${count}</b><p>${count ? plural(count, 'вид поддержки доступен', 'вида поддержки доступно', 'видов поддержки доступно') + ' тебе. Подробности ниже 👇' : 'На контракте госстипендии не платят, но бывают скидки за учёбу — спроси в деканате.'}</p></div>
        </div>
      </div>
      <div class="section-title"><h3>Виды поддержки</h3><span>${count} из ${C.stipends.length}</span></div>
      ${C.stipends.map((s) => `
        <div class="stip glass ${el[s.id] ? 'yes' : 'no'}">
          <i class="stip__ic">${icon(s.icon, 1.8)}</i>
          <div><b>${s.name}</b><p>${s.who}</p></div>
          <i class="ok">${icon('check', 3)}</i>
        </div>`).join('')}
      <p class="note">Правила упрощены для демо. Точные суммы и условия — в разделе «Стипендии» на cfuv.ru; туда же будет вести кнопка в приложении.</p>`;
  }
  $('#stipendScroll').addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]');
    if (!b) return;
    haptic();
    quiz[b.dataset.q] = b.dataset.v;
    store.set('quiz', quiz);
    const y = $('#stipendScroll').scrollTop;
    renderStipend();
    $('#stipendScroll').scrollTop = y;
  });
  hooks.stipend = renderStipend;

  /* ---------- 7. Чат ---------- */
  const list = $('#chatList');
  let chatStarted = false, busy = false;
  const norm = (s) => s.toLowerCase().replace(/ё/g, 'е');
  const scrollDown = () => requestAnimationFrame(() => (list.scrollTop = list.scrollHeight));

  function append(html) { list.insertAdjacentHTML('beforeend', html); scrollDown(); }

  function answerFor(text) {
    const t = norm(text);
    let best = null, score = 0;
    for (const it of C.intents) {
      const s = it.keys.filter((k) => t.includes(k)).length;
      if (s > score) { best = it; score = s; }
    }
    if (!best) return C.fallback;
    if (best.dynamic === 'schedule') {
      const tomorrow = t.includes('завтра');
      const day = (todayIdx() + (tomorrow ? 1 : 0)) % 7;
      const ps = pairsFor(day);
      const when = tomorrow ? 'Завтра' : 'Сегодня';
      if (!ps.length) return [{ img: 't-sleep' }, { text: `${when} пар нет — можно выспаться 😴` }];
      return [
        { img: 'v-clock' },
        { text: `${when} у тебя ${ps.length} ${plural(ps.length, 'пара', 'пары', 'пар')}:` },
        { pairs: ps },
        { open: 'schedule', label: 'Открыть расписание' },
      ];
    }
    return best.reply;
  }

  async function botSay(blocks) {
    busy = true;
    for (const b of blocks) {
      if (b.text || b.pairs) {
        append('<div class="typing" id="typing"><i></i><i></i><i></i></div>');
        await sleep(450 + Math.min((b.text || '').length * 9, 900));
        $('#typing')?.remove();
      } else await sleep(200);
      if (b.img) append(`<img class="msg-sticker" src="${pic(b.img)}" alt="">`);
      if (b.text) append(`<div class="msg bot">${b.text}</div>`);
      if (b.pairs) append(`<div class="msg-pairs">${b.pairs.map(([n, s, type, room]) => `<div class="mini-pair"><b>${C.schedule.times[n - 1][0]}</b><span>${s}</span><small>${room}</small></div>`).join('')}</div>`);
      if (b.open) append(`<button class="btn-ghost pressable msg-action" data-go="${b.open}">${b.label} ${icon('arrow', 2.4)}</button>`);
      if (b.chips) append(`<div class="chips msg-chips">${b.chips.map((c) => `<button class="chip pressable" data-action="ask" data-text="${c}">${c}</button>`).join('')}</div>`);
    }
    busy = false;
  }

  async function send(text) {
    text = text.trim();
    if (!text) return;
    while (busy) await sleep(120);
    append(`<div class="msg me">${text.replace(/</g, '&lt;')}</div>`);
    await sleep(250);
    await botSay(answerFor(text));
  }
  function sendToChat(text) {
    if (state.overlay !== 'chat') go('chat');
    setTimeout(() => send(text), chatStarted ? 0 : 1600);
  }

  $('#chatChips').innerHTML = C.quick.map((q) => `<button class="chip pressable" data-action="ask" data-text="${q}">${q}</button>`).join('');
  $('#chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = $('#chatInput');
    send(inp.value);
    inp.value = '';
  });
  hooks.chat = () => {
    if (chatStarted) return;
    chatStarted = true;
    append('<div class="date-chip">Сегодня</div>');
    botSay([{ img: 't-hello' }, { text: 'Привет! Я Таврик ✨ Помогу разобраться с расписанием, общежитием, стипендиями и расскажу историю КФУ.' }, { text: 'Напиши вопрос или выбери подсказку внизу 👇' }]);
  };

  /* ---------- 8. История ---------- */
  const story = (() => {
    const H = C.history;
    const el = scr('history');
    const stage = $('#storyStage');
    let i = 0, prev = -1, pressT = 0, rollTimer;
    $('#storyBars').innerHTML = H.map(() => '<span><i></i></span>').join('');
    el.style.setProperty('--dur', '9s');

    // Год «прокручивается» от предыдущей главы к текущей
    function rollYear(node, from, to) {
      cancelAnimationFrame(rollTimer);
      if (typeof to !== 'number') { node.textContent = to; node.classList.add('word'); return; }
      node.classList.remove('word');
      if (typeof from !== 'number') from = to - 12;
      const t0 = performance.now();
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / 1100);
        const e = 1 - Math.pow(1 - k, 3);
        node.textContent = Math.round(from + (to - from) * e);
        if (k < 1) rollTimer = requestAnimationFrame(tick);
      };
      rollTimer = requestAnimationFrame(tick);
    }

    const words = (text, start, step, cls = '') =>
      text.split(' ').map((w, k) => `<span class="${cls}" style="animation-delay:${(start + k * step).toFixed(2)}s">${w}</span>`).join(' ');

    function constellation(seed) {
      let s = seed * 9301 + 49297;
      const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
      const pts = Array.from({ length: 10 }, () => [30 + r() * 333, 20 + r() * 330]);
      const lines = pts.slice(1).map((p, k) => [pts[k], p]).concat([[pts[0], pts[5]], [pts[2], pts[7]], [pts[3], pts[9]]]);
      return `<svg class="constellation" viewBox="0 0 393 380">
        ${lines.map(([a, b], k) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" style="animation-delay:${(.3 + k * .15).toFixed(2)}s"/>`).join('')}
        ${pts.map((p, k) => `<circle cx="${p[0]}" cy="${p[1]}" r="${2 + (k % 3)}" style="animation-delay:${(.2 + k * .12).toFixed(2)}s,${(k * .3).toFixed(2)}s"/>`).join('')}
      </svg>`;
    }

    function show(k) {
      i = Math.max(0, Math.min(k, H.length - 1));
      const c = H[i];

      // Пейзаж: новый слой поверх, старый растворяется
      const old = $$('.scene', stage);
      stage.insertAdjacentHTML('beforeend', Scenes.render(c.scene, 'story', i + 2));
      old.forEach((o) => { o.classList.add('out'); setTimeout(() => o.remove(), 950); });

      $$('#storyBars span').forEach((s, j) => {
        s.className = j < i ? 'done' : j === i ? 'run' : '';
        const bar = s.firstElementChild;
        bar.style.animation = 'none'; void bar.offsetHeight; bar.style.animation = '';
      });

      $('#storyLabel').innerHTML = `${medal(c.mascot ? 'tavrik' : 'vernadsky')}${c.mascot ? 'Таврик' : 'Профессор Вернадский'} рассказывает`;

      let hero = '';
      if (c.medal) hero = `<div style="position:absolute;left:50%;top:22%;translate:-50% 0">${medal(c.medal)}</div>`;
      if (c.portrait) hero = '<div class="story__portrait"><i class="beam"></i><i class="halo"></i><img src="assets/vernadsky.webp" alt="Вернадский"><i class="floor"></i></div>';
      if (c.constellation) hero = constellation(i + 1);
      if (c.signature) hero = '<div class="signature">Вернадский<small>Таврический национальный университет</small></div>';
      if (c.crest) hero = '<img class="story__crest" src="assets/crest-kfu.webp" alt="Герб КФУ">';
      if (c.mascot) hero = `<div class="story__hero--fly" style="position:absolute;left:50%;top:18%;translate:-50% 0"><img src="${pic('tavrik-gold-fly')}" alt=""></div>`;
      $('#storyHero').innerHTML = hero;

      const last = i === H.length - 1;
      $('#storyBody').innerHTML = `
        <div class="story__year" id="storyYear"></div>
        <div class="story__title">${words(c.title, .25, .09)}</div>
        <div class="story__speech">
          ${c.narrator ? `<img class="story__narrator" src="${pic(c.narrator)}" alt="">` : ''}
          <p class="story__bubble">${words(c.text, .95, .045)}</p>
        </div>
        ${last ? `<button class="btn-gold story__cta" data-go="chat">Спросить Таврика ${icon('arrow', 2.4)}</button>` : ''}`;
      rollYear($('#storyYear'), prev >= 0 ? H[prev].year : null, c.year);
      prev = i;
    }

    $('#storyBars').addEventListener('animationend', () => { if (i < H.length - 1) show(i + 1); });
    for (const [id, dir] of [['#storyPrev', -1], ['#storyNext', 1]]) {
      const zone = $(id);
      zone.addEventListener('pointerdown', () => { pressT = Date.now(); el.classList.add('paused'); });
      zone.addEventListener('pointerup', () => {
        el.classList.remove('paused');
        if (Date.now() - pressT < 250) { haptic(); show(i + dir); }
      });
      zone.addEventListener('pointerleave', () => el.classList.remove('paused'));
    }
    // Заставка: Вернадский открывает книгу → начинаются главы. Тап по заставке — пропустить.
    const intro = $('#storyIntro');
    const endIntro = () => {
      if (!intro.classList.contains('on')) return;
      intro.classList.remove('on'); intro.pause();
      prev = -1; show(0);
    };
    intro.addEventListener('ended', endIntro);
    intro.addEventListener('click', endIntro);
    intro.addEventListener('error', endIntro);
    return {
      start: () => {
        $$('#storyBars span').forEach((s) => (s.className = ''));
        intro.classList.add('on'); intro.currentTime = 0;
        intro.play().catch(endIntro);
      },
      stop: () => {
        intro.classList.remove('on'); intro.pause(); $$('#storyBars span').forEach((s) => (s.className = '')); setTimeout(() => { if (state.overlay !== 'history') stage.innerHTML = ''; }, 500); },
    };
  })();
  hooks.history = story.start;

  /* ---------- Гид для компьютера ---------- */
  const GUIDE = {
    splash: ['Экран загрузки', 'Стальной золотой Таврик вылетает и парит, вокруг поднимается золотая пыль, надпись проявляется по буквам. Это не видео, а анимация картинки — поэтому надпись на банте всегда чёткая. В Expo: <code>expo-splash-screen</code>, пока грузится JS, затем этот экран на <code>react-native-reanimated</code>.'],
    onboarding: ['Онбординг', 'Свайпай слайды мышкой/тачпадом. На телефоне это нативный горизонтальный список с «защёлкиванием». Показывается только при первом запуске — флаг хранится на устройстве (<code>AsyncStorage</code>).'],
    home: ['Главная', 'Нижнее меню — это Tab Navigator (<code>expo-router</code>, папка <code>(tabs)</code>). Каждое нажатие даёт лёгкую вибрацию (<code>expo-haptics</code>). Виджет «следующая пара» считается по текущему времени.'],
    chat: ['Чат с Тавриком', 'Сейчас ответы ищутся по ключевым словам в <code>content.js</code>. Следующий шаг — свой сервер с ИИ: база знаний вуза уходит в модель как контекст, и Таврик понимает любые формулировки.'],
    history: ['История (сторис)', 'Тап справа — дальше, слева — назад, зажми — пауза. У каждой главы свой крымский пейзаж из слоёв с параллаксом — пока нарисованный кодом. Положишь картинку в <code>assets/scenes/</code> — она встанет вместо него. В приложении — <code>react-native-reanimated</code>, 60 fps.'],
    schedule: ['Расписание', 'Пара, которая идёт сейчас, подсвечивается с прогрессом. В приложении данные приходят с сервера КФУ, а за 10 минут до пары — пуш (<code>expo-notifications</code>).'],
    dorm: ['Общежития', 'Чек-лист сохраняется на телефоне и работает без интернета. Кнопка «Маршрут» откроет Яндекс Карты / 2ГИС через deep link.'],
    stipend: ['Стипендии', 'Мини-квиз считается прямо на устройстве. Правила вынесены в данные, их можно менять с сервера без обновления в App Store / Google Play.'],
  };
  const NAV = [['splash', 'Загрузка'], ['onboarding', 'Онбординг'], ['home', 'Главная'], ['chat', 'Чат'], ['history', 'История'], ['schedule', 'Расписание'], ['dorm', 'Общежития'], ['stipend', 'Стипендии']];
  $('#guideNav').innerHTML = NAV.map(([k, t]) => `<button data-nav="${k}">${t}</button>`).join('');
  $('#guideNav').addEventListener('click', (e) => {
    const b = e.target.closest('[data-nav]');
    if (!b) return;
    const k = b.dataset.nav;
    if (k === 'splash') return startSplash();
    if (scr('splash').classList.contains('is-active')) { clearTimeout(splashTimer); clearInterval(tipTimer); scr('splash').classList.remove('is-active'); }
    if (OVERLAYS.includes(k) && !TABS.includes(state.base)) go('home');
    go(k);
  });
  $('#replay').addEventListener('click', startSplash);
  function updateGuide(name) {
    $$('#guideNav button').forEach((b) => b.classList.toggle('on', b.dataset.nav === name));
    const g = GUIDE[name];
    if (!g) return;
    $('#guideTitle').textContent = g[0];
    $('#guideText').innerHTML = g[1];
  }

  /* ---------- Старт ---------- */
  // «Живые Таврики» создаются сразу: пока идёт заставка, их видео успевает загрузиться,
  // и на главной/онбординге радость начинается без подмены картинки и рывка.
  renderHome();
  homeLiveEl = $('#homeLive');
  homeLive = LiveTavrik.mount(homeLiveEl, { greet: false, initial: 'first' });
  obLive = LiveTavrik.mount($('#obLive'), { greet: false, initial: 'first' });
  startSplash();
})();
