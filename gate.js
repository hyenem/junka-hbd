/* 너드 관문 · 수학 게이트 — 정답 28 ( Σ(n³+n)/2ⁿ = 26 + 2 = 28 = 쭌카 나이 ) */
(() => {
  "use strict";
  const KEY = "junka:gateSolved";

  const form    = document.getElementById("gateForm");
  const input   = document.getElementById("answer");
  const hint    = document.getElementById("hint");
  const secret  = document.getElementById("secret");
  const board   = document.querySelector(".board");
  const resetBtn= document.getElementById("resetBtn");

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function unlock(celebrate) {
    secret.hidden = false;
    hint.hidden = true;
    form.hidden = true;
    if (celebrate && window.JunkaConfetti) {
      window.JunkaConfetti.burst(160, {
        colors: ["#f3e08a", "#f4f3ea", "#9be0c5", "#f0a9b6", "#fbf3b0"],
      });
    }
  }

  function lock() {
    secret.hidden = true;
    form.hidden = false;
    hint.hidden = true;
    input.value = "";
    input.focus();
  }

  function wrong() {
    hint.hidden = false;
    if (!reduce) {
      board.classList.remove("is-shaking");
      void board.offsetWidth;        // reflow to restart animation
      board.classList.add("is-shaking");
      board.addEventListener("animationend", () => board.classList.remove("is-shaking"), { once: true });
    }
    input.select();
  }

  // restore solved state
  if (localStorage.getItem(KEY) === "true") {
    unlock(false);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = parseInt(input.value, 10);
    if (val === 28) {
      localStorage.setItem(KEY, "true");
      unlock(true);
    } else {
      wrong();
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem(KEY);
      lock();
    });
  }
})();
