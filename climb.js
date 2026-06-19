/* ===== 쭌카 클라이밍 등반 게임 — 정상까지 최단시간 기록 ===== */
(() => {
  "use strict";

  const SUMMIT = 100;            // meters to win
  const SLIP_CHANCE = 0.18;      // 18% per tap
  const BEST_KEY = "junka:climbBestTime";   // 최단 기록(ms)

  const els = {
    cur: document.getElementById("curVal"),
    time: document.getElementById("timeVal"),
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
  const now = () => performance.now();
  const fmt = (ms) => (ms / 1000).toFixed(2);

  let height = 0;        // current meters (0..SUMMIT)
  let won = false;       // reached summit, awaiting reset
  let started = false;   // 첫 탭 이후 타이머 가동 중
  let startTime = 0;
  let rafId = null;
  let slipTimer = null;

  /* ---- best record (최단 시간, ms) ---- */
  function loadBest() {
    const n = parseInt(localStorage.getItem(BEST_KEY) || "0", 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  function saveBest(v) { try { localStorage.setItem(BEST_KEY, String(v)); } catch (e) {} }
  let best = loadBest();

  /* ---- rendering ---- */
  function renderHUD() {
    els.cur.innerHTML = Math.round(height) + "<small>m</small>";
    els.best.innerHTML = best > 0 ? fmt(best) + "<small>초</small>" : "—";
  }
  function renderTime(ms) {
    els.time.innerHTML = fmt(ms) + "<small>초</small>";
  }
  function renderClimber() {
    const pct = clamp(height / SUMMIT, 0, 1);
    els.climber.style.bottom = `calc(6px + ${pct * 84}%)`;
  }

  /* ---- 라이브 타이머 ---- */
  function loop() {
    if (!started || won) return;
    renderTime(now() - startTime);
    rafId = requestAnimationFrame(loop);
  }
  function startTimer() {
    started = true;
    startTime = now();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }
  function stopTimer() {
    started = false;
    cancelAnimationFrame(rafId);
    rafId = null;
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
    const elapsed = now() - startTime;
    won = true;
    height = SUMMIT;
    stopTimer();
    renderTime(elapsed);

    els.climber.textContent = "🎉";
    els.climber.classList.add("win");
    els.climber.classList.remove("slipping");
    els.slip.classList.remove("show");
    renderClimber();

    const isRecord = best === 0 || elapsed < best;
    if (isRecord) { best = Math.round(elapsed); saveBest(best); }
    renderHUD();

    els.congrats.hidden = false;
    const head = isRecord ? "🏆 신기록!" : "정상 정복!";
    els.congratsMsg.textContent = `${head} ${fmt(elapsed)}초 만에 완등! ${isRecord ? "쭌카도 깜짝 🦫" : "최고 " + fmt(best) + "초"}`;

    els.btn.textContent = "다시 도전 🔁";
    els.btn.classList.add("reset");
    els.hint.textContent = "버튼을 누르면 다시 0m부터, 시간도 0초부터 시작합니다.";

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
    stopTimer();
    renderTime(0);
    els.climber.textContent = "🧗";
    els.climber.classList.remove("win", "slipping");
    els.congrats.hidden = true;
    els.btn.textContent = "올라가기! 🧗";
    els.btn.classList.remove("reset");
    els.hint.textContent = "정상까지 최단시간 도전! 미끄러지면 시간 손해 ⏱️";
    renderClimber();
    renderHUD();
  }

  /* ---- one climb step ---- */
  function climbStep() {
    if (!started) startTimer();   // 첫 탭에 타이머 시작

    const slipped = Math.random() < SLIP_CHANCE;
    if (slipped) {
      height = clamp(height - rand(3, 8), 0, SUMMIT);
      showSlip();
      renderClimber();
      renderHUD();
      return;
    }

    height = clamp(height + rand(4, 10), 0, SUMMIT);
    els.climber.textContent = "🧗";
    renderClimber();
    renderHUD();
    if (height >= SUMMIT) doWin();
  }

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
      h.style.background = cssColors[colors[i % colors.length]];
      h.style.left = (12 + Math.random() * 74) + "%";
      h.style.top = (6 + (i / N) * 84 + Math.random() * 5) + "%";
      h.style.transform = `rotate(${Math.floor(rand(-40, 40))}deg) scale(${rand(0.7, 1.25).toFixed(2)})`;
      els.holds.appendChild(h);
    }
    for (let m = 0; m <= SUMMIT; m += 20) {
      const t = document.createElement("span");
      t.className = "tick";
      t.textContent = m;
      t.style.top = (100 - (m / SUMMIT) * 90 - 5) + "%";
      els.ruler.appendChild(t);
    }
  }

  /* ---- init ---- */
  buildScenery();
  resetGame();
})();
