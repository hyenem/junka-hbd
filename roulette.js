/* 파티 룰렛 — 카니발 프라이즈 휠 로직 */
(() => {
  "use strict";

  const STORE_KEY = "junka:wheel";
  const MAX_ITEMS = 10;
  const DEFAULTS = ["술값 내기", "다음 잔 원샷", "쭌카 칭찬 10개", "통과", "노래 한 곡", "벌칙 면제"];

  // Festive slice colors (carnival palette). Picked so neighbors differ.
  const PALETTE = [
    "#e84a5f", "#f6c945", "#2bb673", "#ff7a3c",
    "#4ec5ff", "#c879e8", "#ff5a8a", "#7ed957",
    "#ffb43d", "#5b8def",
  ];

  // ---- DOM ----
  const wheel    = document.getElementById("wheel");
  const spinBtn  = document.getElementById("spin");
  const emptyEl  = document.getElementById("wheelEmpty");
  const resultEl = document.getElementById("result");
  const chipsEl  = document.getElementById("chips");
  const hintEl   = document.getElementById("hint");
  const form     = document.getElementById("addForm");
  const input    = document.getElementById("itemInput");
  const addBtn   = form.querySelector(".add-row__btn");
  const resetBtn = document.getElementById("reset");

  // ---- State ----
  let items = load();
  let rotation = 0;     // cumulative degrees
  let spinning = false;

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr.filter(x => typeof x === "string" && x.trim()).slice(0, MAX_ITEMS);
      }
    } catch (e) { /* ignore */ }
    return DEFAULTS.slice();
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(items)); } catch (e) { /* ignore */ }
  }

  const colorFor = (i) => PALETTE[i % PALETTE.length];

  // ---- Render the wheel (slices + labels) ----
  function render() {
    const n = items.length;

    // empty / too-few handling
    const enough = n >= 2;
    emptyEl.hidden = enough;
    spinBtn.disabled = !enough || spinning;

    // Build conic-gradient. Default conic start = top (12 o'clock), goes clockwise.
    if (n === 0) {
      wheel.style.background = "conic-gradient(#0a3a2c 0deg 360deg)";
    } else {
      const a = 360 / n;
      const stops = items.map((_, i) =>
        `${colorFor(i)} ${(i * a).toFixed(4)}deg ${((i + 1) * a).toFixed(4)}deg`
      ).join(", ");
      wheel.style.background = `conic-gradient(${stops})`;
    }

    // Labels: clear and rebuild
    wheel.querySelectorAll(".wheel__label").forEach(el => el.remove());
    if (n > 0) {
      const a = 360 / n;
      items.forEach((label, i) => {
        const el = document.createElement("span");
        el.className = "wheel__label";
        el.textContent = label;
        // Label points to slice center: (i + 0.5) * a clockwise from top.
        // CSS rotate is clockwise; element default points right (3 o'clock),
        // so offset by -90deg to start from top.
        const angle = (i + 0.5) * a - 90;
        el.style.transform = `rotate(${angle}deg)`;
        wheel.appendChild(el);
      });
    }

    renderChips();
    renderHint();
    addBtn.disabled = items.length >= MAX_ITEMS;
  }

  function renderChips() {
    chipsEl.innerHTML = "";
    items.forEach((label, i) => {
      const li = document.createElement("li");
      li.className = "chip";

      const sw = document.createElement("span");
      sw.className = "chip__swatch";
      sw.style.background = colorFor(i);
      sw.setAttribute("aria-hidden", "true");

      const txt = document.createElement("span");
      txt.textContent = label;

      const x = document.createElement("button");
      x.type = "button";
      x.className = "chip__x";
      x.textContent = "×";
      x.setAttribute("aria-label", `${label} 삭제`);
      x.addEventListener("click", () => removeItem(i));

      li.append(sw, txt, x);
      chipsEl.appendChild(li);
    });
  }

  function renderHint() {
    if (items.length < 2) {
      hintEl.textContent = "룰렛을 돌리려면 항목이 2개 이상 필요해요.";
    } else if (items.length >= MAX_ITEMS) {
      hintEl.textContent = `최대 ${MAX_ITEMS}개까지 추가할 수 있어요.`;
    } else {
      hintEl.textContent = `현재 ${items.length}개 항목`;
    }
  }

  // ---- Item ops ----
  function addItem(text) {
    const v = text.trim();
    if (!v) return;
    if (items.length >= MAX_ITEMS) return;
    items.push(v);
    save();
    render();
  }

  function removeItem(i) {
    items.splice(i, 1);
    save();
    render();
  }

  function resetItems() {
    items = DEFAULTS.slice();
    save();
    resultEl.textContent = "";
    render();
  }

  // ---- Spin ----
  function spin() {
    const n = items.length;
    if (spinning || n < 2) return;
    spinning = true;
    spinBtn.disabled = true;
    resultEl.classList.remove("pop");
    resultEl.textContent = "🎡 돌리는 중...";

    const a = 360 / n;
    const extra = Math.random() * 360;          // 0–360
    rotation += 5 * 360 + extra;                 // 5 full turns + random
    wheel.style.transform = `rotate(${rotation}deg)`;

    // Winner math: pointer fixed at top.
    // After rotating wheel by R clockwise, the top points into slice:
    const norm = (360 - (rotation % 360)) % 360;
    const winningIndex = Math.floor(norm / a) % n;

    const onEnd = () => {
      wheel.removeEventListener("transitionend", onEnd);
      finish(winningIndex);
    };
    wheel.addEventListener("transitionend", onEnd);
    // Safety fallback in case transitionend doesn't fire.
    clearTimeout(spin._t);
    spin._t = setTimeout(onEnd, 5200);
  }

  function finish(idx) {
    if (!spinning) return;          // guard against double-fire
    spinning = false;
    const label = items[idx] ?? "?";
    resultEl.innerHTML = `결과: <b>${escapeHtml(label)}</b>`;
    resultEl.classList.remove("pop");
    void resultEl.offsetWidth;       // reflow to restart animation
    resultEl.classList.add("pop");
    spinBtn.disabled = items.length < 2;

    if (window.JunkaConfetti) {
      window.JunkaConfetti.burst(160, {
        colors: ["#f6c945", "#e84a5f", "#2bb673", "#4ec5ff", "#ff7a3c", "#fff4d6"],
      });
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  // ---- Events ----
  spinBtn.addEventListener("click", spin);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addItem(input.value);
    input.value = "";
    input.focus();
  });

  resetBtn.addEventListener("click", resetItems);

  // ---- Init ----
  render();
})();
