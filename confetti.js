/* 공유 색종이 모듈 — window.JunkaConfetti.burst(count, opts) */
(() => {
  let cv = document.getElementById("confetti");
  if (!cv) {
    cv = document.createElement("canvas");
    cv.id = "confetti";
    cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
    document.body.appendChild(cv);
  }
  const ctx = cv.getContext("2d");
  let parts = [], raf = null;
  const resize = () => { cv.width = innerWidth; cv.height = innerHeight; };
  addEventListener("resize", resize); resize();
  const rand = (a, b) => a + Math.random() * (b - a);
  const DEFAULT = ["#ffb43d", "#ff5a6e", "#00d68f", "#8b6cff", "#ffd166", "#4ec5ff"];

  function burst(n = 120, opts = {}) {
    const colors = opts.colors || DEFAULT;
    const x = opts.x ?? innerWidth / 2;
    const y = opts.y ?? innerHeight / 3;
    for (let i = 0; i < n; i++) parts.push({
      x, y, vx: rand(-6, 6), vy: rand(-13, -4), g: rand(.18, .32),
      s: rand(5, 11), c: colors[Math.floor(Math.random() * colors.length)],
      rot: rand(0, 6.28), vr: rand(-.25, .25), life: rand(60, 120),
    });
    if (!raf) loop();
  }
  function loop() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(p => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore();
    });
    parts = parts.filter(p => p.life > 0 && p.y < cv.height + 40);
    if (parts.length) raf = requestAnimationFrame(loop);
    else { ctx.clearRect(0, 0, cv.width, cv.height); raf = null; }
  }
  window.JunkaConfetti = { burst };
})();
