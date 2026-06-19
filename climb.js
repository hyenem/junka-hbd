/* ===== 쭌카 클라이밍 등반 게임 ===== */
(() => {
  "use strict";

  const SUMMIT = 100;            // meters to win
  const SLIP_CHANCE = 0.18;      // 18% per tap
  const BEST_KEY = "junka:climbBest";

  const els = {
    cur: document.getElementById("curVal"),
    best: document.getElementById("bestVal"),
    climber: document.getElementById("climber"),
    slip: document.getElementById("slip"),
    btn: document.getElementById("climbBtn"),
    congrats: document.getElementById("congrats"),
    congratsMsg: document.getElementById("congratsMsg"),
    hint: document.getElementById("hint"),
    holds: document.getElementById("holds"),
    ruler: document.getElementById("ruler"),
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  let height = 0;      // current meters (0..SUMMIT)
  let won = false;     // reached summit, awaiting reset
  let slipTimer = null;

  /* ---- best record ---- */
  function loadBest() {
    const n = parseInt(localStorage.getItem(BEST_KEY) || "0", 10);
    return Number.isFinite(n) && n > 0 ? Math.min(n, SUMMIT) : 0;
  }
  function saveBest(v) {
    try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) {}
  }
  let best = loadBest();

  /* ---- rendering ---- */
  function renderHUD() {
    els.cur.innerHTML = Math.round(height) + "<small>m</small>";
    els.best.innerHTML = Math.round(best) + "<small>m</small>";
  }

  // Map height (0..100m) → climber bottom position within the wall.
  // Keep climber off the very top so 🎂 stays visible until win.
  function renderClimber() {
    const pct = clamp(height / SUMMIT, 0, 1);     // visual cap at 100m
    // travel from ground (6px) up to ~84% of wall height (keeps 🎂 visible)
    els.climber.style.bottom = `calc(6px + ${pct * 84}%)`;
  }

  function updateBestIfNeeded() {
    if (height > best) {
      best = Math.round(height);
      saveBest(best);
    }
  }

  /* ---- slip feedback ---- */
  function showSlip() {
    els.slip.classList.add("show");
    els.climber.classList.add("slipping");
    els.climber.textContent = "😵";
    clearTimeout(slipTimer);
    slipTimer = setTimeout(() => {
      els.slip.classList.remove("show");
      els.climber.classList.remove("slipping");
      if (!won) els.climber.textContent = "🧗";
    }, 650);
  }

  /* ---- win ---- */
  function doWin() {
    won = true;
    height = SUMMIT;
    els.climber.textContent = "🎉";
    els.climber.classList.add("win");
    els.climber.classList.remove("slipping");
    els.slip.classList.remove("show");
    renderClimber();
    updateBestIfNeeded();
    renderHUD();

    els.congrats.hidden = false;
    const msgs = [
      "정상 정복! 쭌카 28세 생일 축하해! 🎂",
      "TOP-OUT! 전국구 클라이머 인증 🧗🏆",
      "100m 완등! 오늘 석암생소금구이 가자 🥩",
    ];
    els.congratsMsg.textContent = msgs[Math.floor(Math.random() * msgs.length)];

    els.btn.textContent = "다시 도전 🔁";
    els.btn.classList.add("reset");
    els.hint.textContent = "버튼을 누르면 다시 0m부터 시작합니다.";

    if (window.JunkaConfetti) {
      window.JunkaConfetti.burst(160, {
        colors: ["#ff4d4f", "#2e90ff", "#ffcb2e", "#23c16b", "#ff8a3d"],
      });
    }
  }

  /* ---- reset ---- */
  function resetGame() {
    won = false;
    height = 0;
    els.climber.textContent = "🧗";
    els.climber.classList.remove("win", "slipping");
    els.congrats.hidden = true;
    els.btn.textContent = "올라가기! 🧗";
    els.btn.classList.remove("reset");
    els.hint.textContent = "한 번 탭할 때마다 4~10m씩 오릅니다. 가끔 미끄러지니 조심!";
    renderClimber();
    renderHUD();
  }

  /* ---- one climb step ---- */
  function climbStep() {
    const slipped = Math.random() < SLIP_CHANCE;
    if (slipped) {
      const loss = rand(3, 8);
      height = clamp(height - loss, 0, SUMMIT);  // never below 0
      showSlip();
      renderClimber();
      renderHUD();
      return;
    }

    const gain = rand(4, 10);
    height = clamp(height + gain, 0, SUMMIT);
    els.climber.textContent = "🧗";
    renderClimber();
    updateBestIfNeeded();
    renderHUD();

    if (height >= SUMMIT) doWin();
  }

  /* ---- main button ---- */
  els.btn.addEventListener("click", () => {
    if (won) { resetGame(); return; }
    climbStep();
  });

  /* ---- decorative holds + ruler (built once) ---- */
  function buildScenery() {
    const colors = ["red", "blue", "yellow", "green", "orange", "purple"];
    const cssColors = {
      red: "#ff4d4f", blue: "#2e90ff", yellow: "#ffcb2e",
      green: "#23c16b", orange: "#ff8a3d", purple: "#9b5cff",
    };
    const N = 16;
    for (let i = 0; i < N; i++) {
      const h = document.createElement("span");
      h.className = "hold";
      const c = colors[i % colors.length];
      h.style.background = cssColors[c];
      // spread across, avoid left ruler strip
      h.style.left = (12 + Math.random() * 74) + "%";
      h.style.top = (6 + (i / N) * 84 + Math.random() * 5) + "%";
      h.style.transform = `rotate(${Math.floor(rand(-40, 40))}deg) scale(${rand(0.7, 1.25).toFixed(2)})`;
      els.holds.appendChild(h);
    }
    // ruler ticks every 20m (top=100m, bottom=0m)
    for (let m = 0; m <= SUMMIT; m += 20) {
      const t = document.createElement("span");
      t.className = "tick";
      t.textContent = m;
      // top% so that 100 is near top, 0 near bottom
      const topPct = 100 - (m / SUMMIT) * 90 - 5;
      t.style.top = topPct + "%";
      els.ruler.appendChild(t);
    }
  }

  /* ---- init ---- */
  buildScenery();
  renderHUD();
  renderClimber();
})();
