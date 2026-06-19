/* 쭌카 파티 빙고 — 3x3 보드, 중앙(idx4) FREE 고정 */
(() => {
  "use strict";

  const POOL = [
    "롤토체스 얘기 시작", "쿼카 같다는 말 나옴", "코드/일 얘기함",
    "고기 굽기 장인 등장", "건배 제의", "쭌카 웃참 실패",
    "수학 얘기 나옴", "클라이밍 자랑", "겜 한 판 하자",
    "옛날 얘기 시작", "사진 찍자", "케이크 등장",
    "선물 개봉", "다같이 노래", "택시 부름",
  ];
  const FREE = "🦫 FREE";
  const CENTER = 4;
  const KEY = "junka:bingo";

  // 8개의 winning line (행3 + 열3 + 대각2)
  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],      // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8],      // cols
    [0, 4, 8], [2, 4, 6],                 // diagonals
  ];

  const boardEl = document.getElementById("board");
  const countEl = document.getElementById("bingoCount");
  const shuffleBtn = document.getElementById("shuffle");

  let state = { cells: [], on: [] };
  let prevBingo = 0;

  // --- pure helpers ---

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 새 보드: 8개 무작위 + 중앙 FREE
  function makeBoard() {
    const picks = shuffleArray(POOL).slice(0, 8);
    const cells = [];
    let p = 0;
    for (let i = 0; i < 9; i++) {
      cells[i] = i === CENTER ? FREE : picks[p++];
    }
    const on = new Array(9).fill(false);
    on[CENTER] = true; // FREE always marked
    return { cells, on };
  }

  // 완성된 줄 수
  function countBingo(s) {
    let n = 0;
    for (const line of LINES) {
      if (line.every((idx) => s.on[idx])) n++;
    }
    return n;
  }

  function isValid(s) {
    return (
      s &&
      Array.isArray(s.cells) && s.cells.length === 9 &&
      Array.isArray(s.on) && s.on.length === 9 &&
      s.cells[CENTER] === FREE
    );
  }

  // --- persistence ---

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) { /* ignore quota / private mode */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return isValid(parsed) ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  // --- rendering ---

  function render() {
    boardEl.innerHTML = "";
    state.cells.forEach((text, i) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cell";
      cell.setAttribute("role", "gridcell");
      cell.dataset.idx = String(i);

      const isFree = i === CENTER;
      if (isFree) cell.classList.add("free");
      if (state.on[i]) cell.classList.add("on");
      cell.setAttribute("aria-pressed", String(!!state.on[i]));

      const txt = document.createElement("span");
      txt.className = "cell__text";
      txt.textContent = text;
      cell.appendChild(txt);

      if (!isFree) {
        const stamp = document.createElement("span");
        stamp.className = "cell__stamp";
        stamp.textContent = "✔";
        stamp.setAttribute("aria-hidden", "true");
        cell.appendChild(stamp);
      }

      cell.addEventListener("click", () => toggle(i));
      boardEl.appendChild(cell);
    });
    updateCount(false);
  }

  function updateCount(animate) {
    const n = countBingo(state);
    countEl.textContent = "빙고 " + n + "줄";

    if (animate && n > prevBingo && window.JunkaConfetti) {
      window.JunkaConfetti.burst(140, {
        colors: ["#ff4d4d", "#00bfa6", "#ffd23f", "#ff7eb6", "#4ec5ff"],
      });
    }
    prevBingo = n;
  }

  // --- interaction ---

  function toggle(i) {
    if (i === CENTER) return; // FREE locked
    state.on[i] = !state.on[i];

    const cell = boardEl.querySelector('.cell[data-idx="' + i + '"]');
    if (cell) {
      cell.classList.toggle("on", state.on[i]);
      cell.setAttribute("aria-pressed", String(state.on[i]));
    }
    updateCount(true);
    save();
  }

  function reshuffle() {
    state = makeBoard();
    prevBingo = 0;
    save();
    render();
    boardEl.classList.remove("spin");
    void boardEl.offsetWidth; // restart animation
    boardEl.classList.add("spin");
  }

  // --- init ---

  function init() {
    const loaded = load();
    state = loaded || makeBoard();
    if (!loaded) save();
    prevBingo = countBingo(state);
    render();
    shuffleBtn.addEventListener("click", reshuffle);
  }

  init();
})();
