(() => {
  "use strict";

  const STORE_KEY = "junka:augment";
  const today = new Date().toISOString().slice(0, 10);

  // ===== 증강체 데이터 (12) =====
  const AUGMENTS = [
    { id: "boom",    tier: "prism",  icon: "🚀", name: "무한 떡상",   desc: "오늘 가는 곳마다 1등. 막을 수 없음." },
    { id: "natl",    tier: "prism",  icon: "👑", name: "전국구 인증", desc: "롤토체스도 인생도 챌린저." },
    { id: "aura",    tier: "prism",  icon: "🦫", name: "쿼카 오라",   desc: "마주치는 모두가 행복해짐." },
    { id: "refill",  tier: "gold",   icon: "🍗", name: "무한 리필",   desc: "석암생소금구이 고기 무한 추가." },
    { id: "summit",  tier: "gold",   icon: "🧗", name: "완등 보장",   desc: "오늘 도전하는 루트 전부 성공." },
    { id: "luck1",   tier: "gold",   icon: "💰", name: "행운의 한 방", desc: "오늘 뽑기·내기 운 폭발." },
    { id: "brain",   tier: "gold",   icon: "🧠", name: "두뇌 풀가동", desc: "모든 문제 암산으로 해결." },
    { id: "sleep",   tier: "silver", icon: "😴", name: "꿀잠",        desc: "오늘 야근 없음. 칼퇴 확정." },
    { id: "rank",    tier: "silver", icon: "🎮", name: "솔랭 승급",   desc: "한 판만 더가 진짜 한 판만." },
    { id: "caffeine",tier: "silver", icon: "☕", name: "카페인 충전", desc: "하루 종일 컨디션 만렙." },
    { id: "luck2",   tier: "silver", icon: "🍀", name: "소소한 행운", desc: "신호등이 다 초록불." },
    { id: "bday",    tier: "silver", icon: "🎂", name: "생일 버프",   desc: "오늘 하루 모든 게 +28%." },
  ];

  const TIER_META = {
    prism:  { label: "PRISMATIC", cls: "tier-prism",  rcls: "is-prism",  confetti: ["#ff6ec7", "#ffd166", "#39d6ff", "#8b6cff", "#ffffff"] },
    gold:   { label: "GOLD",      cls: "tier-gold",   rcls: "",          confetti: ["#f0c060", "#ffd87a", "#39d6ff"] },
    silver: { label: "SILVER",    cls: "tier-silver", rcls: "is-silver", confetti: ["#c9d4df", "#39d6ff", "#e9eef6"] },
  };

  // ===== DOM =====
  const cardsEl    = document.getElementById("cards");
  const pickArea   = document.getElementById("pickArea");
  const pickHint   = document.getElementById("pickHint");
  const resultArea = document.getElementById("resultArea");
  const revealCard = document.getElementById("revealCard");
  const elTier     = document.getElementById("revealTier");
  const elIcon     = document.getElementById("revealIcon");
  const elName     = document.getElementById("revealName");
  const elDesc     = document.getElementById("revealDesc");
  const resultNote = document.getElementById("resultNote");
  const subtitle   = document.getElementById("subtitle");

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ===== utils =====
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 3장 뽑기 — 프리즈매틱은 더 희귀하게 가중치 적용
  function dealThree() {
    const weight = (t) => (t === "prism" ? 1 : t === "gold" ? 4 : 5);
    const pool = shuffle(AUGMENTS).map((a) => ({ a, k: Math.random() / weight(a.tier) }));
    pool.sort((x, y) => x.k - y.k); // k가 작을수록(가중치 높을수록) 우선
    return pool.slice(0, 3).map((p) => p.a);
  }

  function fireConfetti(tier) {
    if (!window.JunkaConfetti) return;
    const meta = TIER_META[tier];
    const count = tier === "prism" ? 200 : 120;
    window.JunkaConfetti.burst(count, { colors: meta.confetti });
  }

  // ===== 결과 화면 렌더 =====
  function renderResult(aug, opts = {}) {
    const meta = TIER_META[aug.tier];
    elIcon.textContent = aug.icon;
    elName.textContent = aug.name;
    elDesc.textContent = aug.desc;
    elTier.textContent = meta.label;
    elTier.className = "reveal__tier " + meta.cls;
    revealCard.className = "reveal" + (meta.rcls ? " " + meta.rcls : "");

    resultNote.textContent = opts.saved
      ? "🔒 오늘은 이미 뽑았어요 · 내일 또 뽑기!"
      : "✨ 오늘의 증강체 확정 · 내일 또 뽑기!";

    pickArea.hidden = true;
    resultArea.hidden = false;
  }

  // ===== 카드 한 장 선택 =====
  let drawn = false;
  function pickCard(cardBtn, aug, allCards) {
    if (drawn) return;
    drawn = true;

    // 선택한 카드 앞면 채우기
    const ci = cardBtn.querySelector(".ci");
    const cn = cardBtn.querySelector(".cn");
    if (ci) ci.textContent = aug.icon;
    if (cn) cn.textContent = aug.name;

    cardBtn.classList.add("is-flipped");
    cardBtn.setAttribute("aria-pressed", "true");
    pickHint.style.display = "none";

    // 나머지 카드 페이드 & 잠금
    allCards.forEach((c) => {
      c.classList.add("is-locked");
      if (c !== cardBtn) c.classList.add("is-faded");
    });

    // 저장 (하루 한 번)
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ date: today, aug }));
    } catch (e) { /* localStorage 불가 환경 무시 */ }

    const flipDelay = reduceMotion ? 0 : 750;
    setTimeout(() => {
      renderResult(aug, { saved: false });
      fireConfetti(aug.tier);
    }, flipDelay);
  }

  // ===== 카드 3장 빌드 =====
  function buildCards() {
    const three = dealThree();
    cardsEl.innerHTML = "";
    const buttons = [];

    three.forEach((aug, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card";
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", `증강체 카드 ${idx + 1} (뒤집힌 카드, 탭하여 공개)`);
      btn.innerHTML =
        '<div class="card__inner">' +
          '<div class="card__face card__back"><span class="card__qmark">❓</span></div>' +
          '<div class="card__face card__front"><span class="ci"></span><span class="cn"></span></div>' +
        '</div>';
      btn.addEventListener("click", () => pickCard(btn, aug, buttons));
      cardsEl.appendChild(btn);
      buttons.push(btn);
    });
  }

  // ===== 초기화 =====
  function init() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch (e) {}

    if (saved && saved.date === today && saved.aug) {
      // 오늘 이미 뽑음 → 결과 바로 표시 (컨페티 없음)
      drawn = true;
      subtitle.innerHTML = "오늘의 운명은 이미 정해졌어요. 🔮";
      renderResult(saved.aug, { saved: true });
    } else {
      buildCards();
    }
  }

  init();
})();
