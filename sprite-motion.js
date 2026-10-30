// Raster animation rig: a fixed ground anchor, breathing torso, delayed head
// and cloth follow-through. Frames are cached; pixel edges never rotate/blur.
const cache = new Map();
const images = new Map();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function load(src) {
  if (!images.has(src)) images.set(src, new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  }));
  return images.get(src);
}

async function framesFor(kind, index) {
  const key = `${kind}-${index}`;
  if (cache.has(key)) return cache.get(key);
  const promise = (async () => {
    const hero = kind === 'hero';
    const image = await load(`./assets/${hero ? 'heroes' : 'monsters'}.png`);
    const w = 192, h = hero ? 256 : 192;
    const source = document.createElement('canvas');
    source.width = w; source.height = h;
    const ctx = source.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const sw = image.width / 3, sh = image.height / (hero ? 1 : 2);
    ctx.drawImage(image, index % 3 * sw, Math.floor(index / 3) * sh, sw, sh, 0, 0, w, h);
    return Array.from({length: 24}, (_, frame) => {
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const paint = canvas.getContext('2d');
      paint.imageSmoothingEnabled = false;
      const phase = frame / 24 * Math.PI * 2;
      const ghost = !hero && index === 3;
      const breath = (1 - Math.cos(phase)) / 2;
      // Heavy armour barely breathes; soft robes and undead have more motion.
      const strength = hero ? [1.8, 1.1, 1.6][index] : [2.1, 1.2, 1.7, 2.5, 0.9, 1.5][index];
      for (let y = 0; y < h; y++) {
        const t = y / h;
        // Keep the bottom 18% exactly planted; no whole-image bobbing.
        const upper = Math.max(0, Math.min(1, (0.82 - t) / 0.46));
        const dy = Math.round(-breath * strength * upper + (ghost ? Math.sin(phase) * 2 : 0));
        const cloth = t > 0.35 && t < 0.82 ? Math.sin((t - 0.35) / 0.47 * Math.PI) : 0;
        const drift = hero && index === 1 ? 0 : Math.round(Math.sin(phase - t * 3) * cloth * (ghost ? 2 : 1));
        // Overlapping scanlines fill the tiny gaps caused by the breathing pose.
        paint.drawImage(source, 0, y, w, 1, drift, y + dy, w, 2);
      }
      return canvas;
    });
  })();
  cache.set(key, promise);
  return promise;
}

export async function mountSpriteMotion(heroIndex, monsterIndex) {
  const fighters = [...document.querySelectorAll('.fighter')];
  await Promise.all(fighters.map(async (fighter, i) => {
    const hero = fighter.classList.contains('hero');
    try {
      const frames = await framesFor(hero ? 'hero' : 'enemy', hero ? heroIndex : monsterIndex);
      if (!fighter.isConnected) return;
      const canvas = document.createElement('canvas');
      canvas.width = frames[0].width; canvas.height = frames[0].height;
      canvas.className = 'sprite-raster';
      canvas.setAttribute('aria-hidden', 'true');
      fighter.append(canvas);
      fighter.classList.add('raster-ready');
      fighter.dataset.kind = hero ? ['adventurer','knight','wizard'][heroIndex] : ['zombie','skeleton','spider','wraith','golem','necromancer'][monsterIndex];
      const ctx = canvas.getContext('2d');
      const started = performance.now();
      const period = hero ? [2400, 3000, 2800][heroIndex] : [2600, 3100, 1800, 3200, 3800, 2900][monsterIndex];
      let lastFrame = -1;
      const draw = (now) => {
        if (!canvas.isConnected) return;
        const action = /hero-attack|enemy-attack|hero-cast|enemy-cast/.test(fighter.className);
        const frame = reducedMotion.matches || action ? 0 : Math.floor(((now - started + i * 650) % period) / period * frames.length);
        if (frame !== lastFrame) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(frames[frame], 0, 0);
          lastFrame = frame;
        }
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    } catch (error) { console.warn('Sprite animation fallback', error); }
  }));
}
