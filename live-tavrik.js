/*
 * «Живой Таврик» — сидящий малыш, собранный из коротких видео-клипов Kling.
 * Все клипы начинаются и заканчиваются ОДНИМ и тем же кадром, поэтому
 * переключение между ними незаметно (как анимации персонажа в игре):
 *
 *   hello — радуется, увидев пользователя (играет один раз при появлении)
 *   idle  — спокойно «живёт»: дышит, моргает, водит хвостиком (по кругу)
 *   tap-1..3 — реакции на тап (выбирается случайная из готовых)
 *
 * Нет файла — клип пропускается: вместо него картинка + CSS-анимация.
 * В приложении на React Native это будет тот же принцип на expo-video
 * (или один файл Rive со стейт-машиной).
 */
window.LiveTavrik = (() => {
  const VER = '?v=2'; // меняй при замене роликов, чтобы браузер не взял старые из кэша
  const SRC = {
    hello: 'assets/video/tavrik-hello.mp4' + VER, idle: 'assets/video/tavrik-idle.mp4' + VER,
    tap1: 'assets/video/tavrik-tap-1.mp4' + VER, tap2: 'assets/video/tavrik-tap-2.mp4' + VER, tap3: 'assets/video/tavrik-tap-3.mp4' + VER,
  };
  const TAPS = ['tap1', 'tap2', 'tap3'];
  const POSTER = 'assets/tavrik-bow.webp';
  const haptic = () => navigator.vibrate && navigator.vibrate(10);

  // greet — сразу порадоваться; initial: 'first' — стоять на первом кадре приветствия (ждать greet())
  function mount(root, { greet = true, initial = 'last' } = {}) {
    root.classList.add('live', 'live--video');
    root.innerHTML = `
      <div class="live__stage"><img class="live__still" src="${POSTER}" alt="Таврик">
      ${Object.entries(SRC).map(([k, src]) => `<video class="live__clip" data-clip="${k}" src="${src}" ${k === 'hello' ? 'poster="assets/video/tavrik-hello-first.jpg"' : ''} muted playsinline preload="auto" ${k === 'idle' ? 'loop' : ''}></video>`).join('')}</div>
      <span class="live__sparks"></span>`;
    const clips = Object.fromEntries([...root.querySelectorAll('video')].map((v) => [v.dataset.clip, v]));
    const ok = {};
    let current = null;
    // статус файлов запоминаем сразу: 404 приходит раньше, чем пользователь успеет тапнуть
    for (const [k, v] of Object.entries(clips)) {
      v.addEventListener('loadeddata', () => (ok[k] = true), { once: true });
      v.addEventListener('error', () => (ok[k] = false), { once: true });
    }

    // Готов ли клип. «Нет» запоминаем только при настоящей ошибке (файла нет);
    // долгая загрузка — не повод навсегда считать клип отсутствующим.
    const ready = (k) => new Promise((res) => {
      const v = clips[k];
      const check = () => {
        if (ok[k] === false || v.error || v.networkState === 3) return (ok[k] = false);
        if (ok[k] === true || v.readyState >= 2) return (ok[k] = true);
        return null;
      };
      const r0 = check();
      if (r0 !== null) return res(r0);
      const t0 = Date.now();
      const poll = setInterval(() => {
        const r = check();
        if (r !== null) { clearInterval(poll); res(r); }
        else if (Date.now() - t0 > 4000) { clearInterval(poll); res(false); } // без кэширования
      }, 50);
    });

    // уходящий клип мягко растворяется поверх нового (позы на стыке могут чуть отличаться)
    function fadeOut(v) {
      v.classList.add('leaving');
      setTimeout(() => v.classList.remove('leaving'), 380);
    }

    function setOn(k) {
      const next = k && clips[k];
      const prev = current && clips[current];
      if (prev && prev !== next && prev.classList.contains('on')) fadeOut(prev);
      current = k;
      root.classList.toggle('live--video', !!k);
      root.classList.remove('held');
      for (const v of Object.values(clips)) {
        const on = v === next;
        v.classList.toggle('on', on);
        if (!on) v.pause();
      }
      return next;
    }

    function show(k) {
      const v = setOn(k);
      if (v) { v.currentTime = 0; v.play().catch(() => { if (current === k) v.currentTime = 0; }); }
    }

    // Показать кадр клипа без воспроизведения (первый или последний).
    // В покое Таврик едва заметно «дышит», пока нет отдельного клипа idle.
    function hold(k, atEnd = false) {
      const v = setOn(k);
      v.pause();
      root.classList.toggle('held', atEnd);
      const seek = () => { v.currentTime = atEnd ? Math.max(0, v.duration - 0.05) : 0; };
      v.readyState >= 1 ? seek() : v.addEventListener('loadedmetadata', seek, { once: true });
    }

    async function toIdle() {
      if (await ready('idle')) show('idle');
      // idle ещё не сгенерирован: замираем на последнем кадре прыжка (это и есть поза для idle)
      else if (await ready('hello')) hold('hello', true);
      else show(null);
    }

    async function play(k, cssFallback) {
      if (await ready(k)) { show(k); clips[k].onended = toIdle; }
      else cssFallback();
    }

    function sparks(e) {
      const r = root.getBoundingClientRect();
      const x = e ? e.clientX - r.left : r.width / 2, y = e ? e.clientY - r.top : r.height / 2;
      const box = root.querySelector('.live__sparks');
      for (let i = 0; i < 10; i++) {
        const s = document.createElement('i');
        const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 50;
        s.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 20}px;--s:${.6 + Math.random() * .8}`;
        box.appendChild(s);
        setTimeout(() => s.remove(), 900);
      }
    }

    // Параллакс: Таврик плавно поворачивается и смещается вслед за курсором (только мышь;
    // на телефоне курсора нет — сидит спокойно). Плавность — через затухающую интерполяцию.
    const area = root.closest('.screen') || root;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    const step = () => {
      cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
      root.style.setProperty('--px', cx.toFixed(4));
      root.style.setProperty('--py', cy.toFixed(4));
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(step) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    area.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const a = area.getBoundingClientRect(), r = root.getBoundingClientRect();
      tx = clamp((e.clientX - (r.left + r.width / 2)) / (a.width / 2));
      ty = clamp((e.clientY - (r.top + r.height / 2)) / (a.height / 2));
      kick();
    });
    area.addEventListener('pointerleave', () => { tx = ty = 0; kick(); });

    root.addEventListener('click', (e) => {
      e.stopPropagation();
      haptic();
      sparks(e);
      if (TAPS.includes(current) && !clips[current].ended) return; // не перебиваем текущую реакцию
      // реакция — только видео-клипом. Нет клипов — просто искорки, без прыжков картинки
      Promise.all(TAPS.map(ready)).then((r) => {
        const avail = TAPS.filter((k, i) => r[i] && k !== current);
        if (avail.length) play(avail[Math.floor(Math.random() * avail.length)], () => {});
      });
    });

    // С первой же миллисекунды виден первый кадр приветствия (poster), а не картинка-заглушка.
    // Заглушка появляется, только если ролика нет вовсе.
    clips.hello.classList.add('on');
    current = 'hello';
    clips.hello.addEventListener('error', () => { setOn(null); }, { once: true });

    if (greet) setTimeout(() => play('hello', toIdle), 350);
    else if (initial === 'first') ready('hello').then((r) => r && hold('hello'));
    else toIdle();
    return { greet: () => play('hello', toIdle) };
  }

  return { mount };
})();
