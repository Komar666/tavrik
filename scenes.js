/*
 * Крымские пейзажи, нарисованные кодом (SVG-слои для параллакса).
 * Это временные фоны: если положить картинку в assets/scenes/<имя>.webp,
 * она автоматически ляжет поверх и заменит нарисованную сцену.
 */
window.Scenes = (() => {
  const W = 520, H = 800;
  let uid = 0;

  const rng = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

  // Линия хребта: сумма синусов + «зубцы» (как у Ай-Петри)
  function ridge(r, base, amp, jag = 0, step = 6) {
    const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
    let d = `M0 ${H} L0 ${base}`;
    for (let x = 0; x <= W + step; x += step) {
      let y = base - amp * (0.55 * Math.sin(x / 97 + ph[0]) + 0.3 * Math.sin(x / 41 + ph[1]) + 0.15 * Math.sin(x / 15 + ph[2]));
      if (jag && r() < jag) y -= r() * amp * 0.35;
      d += ` L${x} ${y.toFixed(1)}`;
    }
    return { d: d + ` L${W} ${H} Z`, at: (x) => base - amp * (0.55 * Math.sin(x / 97 + ph[0]) + 0.3 * Math.sin(x / 41 + ph[1]) + 0.15 * Math.sin(x / 15 + ph[2])) };
  }

  const SCENES = {
    sea: {
      sky: ['#140a1c', '#43183a', '#a8454a', '#f0ad68', '#ffe0a3'], sun: { y: 455, r: 40, c: '#fff1c4' },
      clouds: '#f6b98a', hills: [['#7a3448', 470, 50, .2, .55], ['#4a1b33', 480, 32, .1, .9]],
      sea: { top: 478, c: ['#3a4f6b', '#1b2338', '#0b0d18'], glint: '#ffd98a' }, fx: ['dust', 'gulls'],
    },
    autumn: {
      sky: ['#1c0c07', '#5e2410', '#bb5a26', '#eea85a', '#fbd893'], sun: { y: 360, r: 34, c: '#ffe0a0' },
      clouds: '#f3a76a', hills: [['#8a3a1a', 420, 70, 0, .7], ['#5c2010', 520, 60, 0, .9], ['#2c0f09', 640, 50, 0, 1]],
      trees: { kind: 'round', on: [1, 2], colors: ['#c4512a', '#e08a2e', '#a8321f', '#f2b84b', '#7a1f1a'] }, fx: ['leaves', 'dust'],
    },
    mountains: {
      sky: ['#0e0918', '#2b1736', '#6b2f4e', '#d1846a', '#f5c690'], sun: { y: 400, r: 30, c: '#ffd9a6' },
      clouds: '#e89a86', hills: [['#5a2a4a', 380, 110, .25, .5], ['#3b1a35', 470, 90, .2, .75], ['#241023', 570, 70, .1, .9], ['#130811', 670, 45, 0, 1]],
      fog: '#f2b6a0', fx: ['dust'],
    },
    forest: {
      sky: ['#08110d', '#163026', '#46684a', '#b7b77c', '#f1dfa6'], sun: { y: 300, r: 36, c: '#fff4c8' }, rays: true,
      clouds: '#e6e0b0', hills: [['#2c4a38', 430, 80, .1, .6], ['#1a3226', 540, 60, 0, .85], ['#0b1a12', 660, 40, 0, 1]],
      trees: { kind: 'pine', on: [0, 1, 2], colors: ['#20402e', '#163224', '#0c1f16'] }, fog: '#cfe3c2', fx: ['dust'],
    },
    night: {
      sky: ['#03040b', '#0d1233', '#2a1d4f', '#5a2a5a'], stars: 140, milky: true, moon: { x: 380, y: 170, r: 26 },
      hills: [['#3a2d62', 470, 80, .25, .6], ['#22193f', 515, 45, .1, .9]],
      sea: { top: 520, c: ['#141a3a', '#0a0d20', '#04050d'], glint: '#c9d4ff' }, fx: ['shooting', 'dust'],
    },
    storm: {
      sky: ['#120d14', '#3a2632', '#7a4a42', '#c08355'], sun: { y: 430, r: 22, c: '#ffd9a0' }, clouds: '#4a3438', heavyClouds: true,
      hills: [['#6a3420', 460, 80, .15, .7], ['#45200f', 560, 60, 0, .9], ['#1f0d07', 660, 40, 0, 1]],
      trees: { kind: 'round', on: [1, 2], colors: ['#7a2e14', '#9a4a1a', '#5a1f10', '#b0682a'] }, fx: ['lightning', 'leaves', 'rain'],
    },
    golden: {
      sky: ['#240a12', '#6e1f30', '#c86a42', '#f2c97f', '#fff2cf'], sun: { y: 420, r: 54, c: '#fff6d8' }, rays: true,
      clouds: '#f7c98f', hills: [['#7a2a3a', 450, 60, .15, .6], ['#4c1622', 470, 34, .1, .9]],
      sea: { top: 468, c: ['#8a4a3a', '#3c1a1e', '#140708'], glint: '#ffe6a6' }, fx: ['dust'],
    },
    city: {
      sky: ['#05070f', '#111634', '#2c2450', '#7a3f5e'], stars: 60,
      hills: [['#1c1a3a', 440, 90, .2, .6], ['#120f26', 500, 60, .1, .9]],
      lights: true, sea: { top: 520, c: ['#1b1f42', '#0b0d22', '#05060f'], glint: '#ffcf7a' }, fx: ['dust'],
    },
    dawn: {
      sky: ['#180a14', '#541a33', '#c0575a', '#f4b47a', '#ffe9b8'], sun: { y: 470, r: 46, c: '#fff4d6' }, rays: true,
      clouds: '#ffc39a', hills: [['#82384d', 480, 55, .2, .55], ['#4c1a30', 490, 30, .1, .9]],
      sea: { top: 488, c: ['#5a4a7a', '#2a1e3e', '#0d0814'], glint: '#ffe0a8' }, fx: ['dust', 'gulls'],
    },
  };

  function svgFor(spec, seed) {
    const id = 's' + (++uid);
    const r = rng(seed);
    const layers = [];
    const svg = (body, cls = '') => `<svg class="${cls}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;

    // Небо, солнце/луна, звёзды, облака
    const stops = spec.sky.map((c, i) => `<stop offset="${(i / (spec.sky.length - 1)) * 0.75}" stop-color="${c}"/>`).join('');
    let sky = `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>
      <radialGradient id="${id}s"><stop offset="0" stop-color="${spec.sun ? spec.sun.c : '#fff'}"/><stop offset=".25" stop-color="${spec.sun ? spec.sun.c : '#fff'}" stop-opacity=".9"/><stop offset="1" stop-color="${spec.sun ? spec.sun.c : '#fff'}" stop-opacity="0"/></radialGradient>
      <filter id="${id}b"><feGaussianBlur stdDeviation="9"/></filter></defs>
      <rect width="${W}" height="${H}" fill="url(#${id}g)"/>`;
    if (spec.stars) {
      for (let i = 0; i < spec.stars; i++) {
        sky += `<circle class="tw" style="animation-delay:${(r() * 4).toFixed(2)}s" cx="${(r() * W).toFixed(0)}" cy="${(r() * 420).toFixed(0)}" r="${(r() * 1.3 + .3).toFixed(2)}" fill="#fff"/>`;
      }
    }
    if (spec.milky) {
      sky += `<g filter="url(#${id}b)" opacity=".35"><ellipse cx="${W / 2}" cy="230" rx="${W * .7}" ry="38" fill="#c9b6ff" transform="rotate(-24 ${W / 2} 230)"/><ellipse cx="${W / 2 + 30}" cy="220" rx="${W * .4}" ry="16" fill="#fff1d6" transform="rotate(-24 ${W / 2} 230)"/></g>`;
    }
    if (spec.moon) {
      const m = spec.moon;
      sky += `<circle cx="${m.x}" cy="${m.y}" r="${m.r * 4}" fill="url(#${id}s)" opacity=".25"/><circle cx="${m.x}" cy="${m.y}" r="${m.r}" fill="#f4ecd6"/><circle cx="${m.x + 9}" cy="${m.y - 5}" r="${m.r}" fill="${spec.sky[1]}" opacity=".9"/>`;
    }
    layers.push({ depth: 0, html: svg(sky) });
    if (spec.sun) {
      const s = spec.sun;
      layers.push({ depth: .05, cls: 'sun', html: svg(`<circle cx="${W / 2}" cy="${s.y}" r="${s.r * 5}" fill="url(#${id}s)" opacity=".55"/><circle cx="${W / 2}" cy="${s.y}" r="${s.r}" fill="${s.c}"/>`) });
    }
    if (spec.clouds) {
      let cl = '';
      const n = spec.heavyClouds ? 9 : 5;
      for (let i = 0; i < n; i++) {
        const y = spec.heavyClouds ? 40 + r() * 260 : 80 + r() * 260;
        cl += `<ellipse cx="${(r() * W).toFixed(0)}" cy="${y.toFixed(0)}" rx="${(80 + r() * 120).toFixed(0)}" ry="${(spec.heavyClouds ? 40 : 12) + r() * 22}" fill="${spec.clouds}" opacity="${spec.heavyClouds ? .85 : (.25 + r() * .35).toFixed(2)}"/>`;
      }
      layers.push({ depth: .12, cls: 'clouds', html: svg(`<g filter="url(#${id}b)">${cl}</g>`) });
    }

    // Хребты (+ деревья)
    spec.hills.forEach(([c, base, amp, jag, depth], k) => {
      const rd = ridge(r, base, amp, jag);
      let body = `<path d="${rd.d}" fill="${c}"/>`;
      if (spec.trees && spec.trees.on.includes(k)) {
        const cols = spec.trees.colors;
        for (let x = -10; x < W + 10; x += 7 + r() * 9) {
          const y = rd.at(x) + 4;
          const s = (6 + r() * 8) * (1 + k * 0.45);
          const col = cols[Math.floor(r() * cols.length)];
          body += spec.trees.kind === 'pine'
            ? `<path d="M${x} ${y - s * 2.6} L${x - s * .7} ${y} L${x + s * .7} ${y} Z" fill="${col}"/>`
            : `<circle cx="${x}" cy="${y - s * .6}" r="${s}" fill="${col}"/>`;
        }
      }
      if (spec.lights && k === spec.hills.length - 1) {
        for (let x = 0; x < W; x += 2 + r() * 4) {
          const top = Math.min(rd.at(x) + 6, 512);
          const y = top + r() * (518 - top);
          const rr = r() * 1.6 + .8;
          body += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(rr * 3).toFixed(1)}" fill="#ffb84d" opacity=".12"/><circle class="tw" style="animation-delay:${(r() * 3).toFixed(2)}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rr.toFixed(1)}" fill="${r() < .7 ? '#ffd27a' : '#fff4dc'}"/>`;
        }
      }
      layers.push({ depth, html: svg(body) });
      if (spec.fog && k < spec.hills.length - 1) {
        layers.push({ depth: depth + .05, cls: 'fog', html: svg(`<g filter="url(#${id}b)"><ellipse cx="${W / 2}" cy="${base + 30}" rx="${W * .8}" ry="26" fill="${spec.fog}" opacity=".18"/></g>`) });
      }
    });

    // Море с солнечной дорожкой
    if (spec.sea) {
      const sx = spec.sea;
      let body = `<defs><linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1">${sx.c.map((c, i) => `<stop offset="${i / (sx.c.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient></defs>
        <rect y="${sx.top}" width="${W}" height="${H - sx.top}" fill="url(#${id}w)"/>`;
      for (let y = sx.top + 6; y < H; y += 7 + (y - sx.top) / 14) {
        const spread = 18 + (y - sx.top) * .45;
        const w = 10 + r() * spread;
        body += `<rect class="glint" style="animation-delay:${(r() * 2).toFixed(2)}s" x="${(W / 2 - spread / 2 + r() * spread - w / 2).toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${1.4 + (y - sx.top) / 140}" rx="1" fill="${sx.glint}" opacity="${(.85 - (y - sx.top) / 500).toFixed(2)}"/>`;
      }
      for (let i = 0; i < 26; i++) {
        const y = sx.top + 20 + r() * (H - sx.top);
        body += `<rect x="${(r() * W).toFixed(0)}" y="${y.toFixed(0)}" width="${(20 + r() * 50).toFixed(0)}" height="1.2" fill="#fff" opacity=".07"/>`;
      }
      layers.push({ depth: .9, cls: 'sea', html: svg(body) });
    }
    return layers;
  }

  // Частицы и эффекты поверх сцены (HTML, чтобы анимировать CSS)
  function fx(spec, r) {
    let h = '';
    const list = spec.fx || [];
    if (list.includes('dust')) h += Array.from({ length: 22 }, () => `<i class="fx-dust" style="left:${r() * 100}%;top:${30 + r() * 70}%;--d:${(2 + r() * 3).toFixed(1)}px;--t:${(6 + r() * 7).toFixed(1)}s;--delay:-${(r() * 10).toFixed(1)}s;--x:${((r() - .5) * 80).toFixed(0)}px"></i>`).join('');
    if (list.includes('leaves')) h += Array.from({ length: 14 }, () => `<i class="fx-leaf" style="left:${r() * 100}%;--t:${(5 + r() * 6).toFixed(1)}s;--delay:-${(r() * 10).toFixed(1)}s;--x:${((r() - .3) * 160).toFixed(0)}px;--c:${['#e08a2e', '#c4512a', '#f2b84b', '#a8321f'][Math.floor(r() * 4)]}"></i>`).join('');
    if (list.includes('rain')) h += Array.from({ length: 40 }, () => `<i class="fx-rain" style="left:${r() * 110}%;--t:${(.5 + r() * .5).toFixed(2)}s;--delay:-${(r() * 2).toFixed(2)}s"></i>`).join('');
    if (list.includes('gulls')) h += Array.from({ length: 3 }, (_, k) => `<i class="fx-gull" style="top:${18 + k * 6 + r() * 6}%;--t:${(16 + r() * 10).toFixed(0)}s;--delay:-${(r() * 16).toFixed(0)}s;--s:${(.6 + r() * .6).toFixed(2)}"></i>`).join('');
    if (list.includes('shooting')) h += '<i class="fx-shoot"></i>';
    if (list.includes('lightning')) h += '<i class="fx-flash"></i>';
    if (spec.rays) h += '<i class="fx-rays"></i>';
    return h;
  }

  // Нарисованные картины (assets/scenes/<имя>.webp). Картины горизонтальные (16:9),
  // поэтому для вертикальной обрезки задаём «точку фокуса»: где главное в кадре.
  const PHOTO_FOCUS = { autumn: '62% 45%', city: '34% 50%', dawn: '60% 50%', forest: '46% 50%', mountains: '50% 50%', night: '42% 50%', storm: '56% 40%', sea: '40% 50%', golden: '52% 50%' };
  // временная замена, пока нет своей картины
  const PHOTO_ALIAS = {};

  /** HTML сцены. mode: 'card' (лёгкий дрейф) или 'story' (параллакс + эффекты) */
  function render(name, mode = 'card', seed = 7) {
    const spec = SCENES[name] || SCENES.sea;
    const r = rng(seed * 31 + name.length);
    const layers = svgFor(spec, seed).map((l, i) =>
      `<div class="scene__layer ${l.cls || ''}" style="--depth:${l.depth};--i:${i}">${l.html}</div>`).join('');
    const photo = PHOTO_ALIAS[name] || name;
    const focus = PHOTO_FOCUS[photo] || '50% 50%';
    // порядок: нарисованная кодом сцена → картина поверх → живые эффекты (пыль, листья, дождь) поверх картины
    return `<div class="scene scene--${mode} scene--${name}">${layers}
      <img class="scene__photo" src="assets/scenes/${photo}.webp" style="object-position:${focus}" alt="" onerror="this.remove()">
      ${mode === 'story' ? `<video class="scene__photo" src="assets/scenes/${photo}.mp4" style="object-position:${focus}" autoplay muted loop playsinline onerror="this.remove()"></video>` : ''}
      <div class="scene__fx">${mode === 'story' || name === 'autumn' ? fx(spec, r) : fx({ fx: ['dust'] }, r)}</div></div>`;
  }

  return { render, names: Object.keys(SCENES) };
})();
