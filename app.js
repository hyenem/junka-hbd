/* ===== 쭌카 증권거래소 · app.js (vanilla, 의존성 0) ===== */
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const won = (n) => "₩" + Math.round(n).toLocaleString("ko-KR");
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const today = () => new Date().toISOString().slice(0, 10);

const store = {
  get(k, d) { try { const v = localStorage.getItem("junka:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("junka:" + k, JSON.stringify(v)); } catch {} },
};

/* ===================== 티커 ===================== */
(() => {
  const items = [
    ["🦫 JUNKA EXCHANGE", "hl"], ["쭌카전자 ▲ 2.8%", "up"], ["롤토체스코인 ▲▲ 31% 전국구", "up"],
    ["서울대수학지수 ▲ 1.2%", "up"], ["클라이밍홀딩스 ▲ 4.0%", "up"], ["경기과학고밈 ▼ 0.7%", "down"],
    ["980619 신규상장", "hl"], ["28세 사상 최고가 경신 🚀", "up"], ["인성 펀더멘털 견고", ""],
    ["쿼카상 프리미엄", "hl"], ["목표주가 ∞", "up"],
  ];
  const make = () => items.map(([t, c]) => `<span class="${c}">${t}</span>`).join("");
  $("#tickerTrack").innerHTML = make() + make();
})();

/* ===================== 색종이 ===================== */
const confetti = (() => {
  const cv = $("#confetti"), ctx = cv.getContext("2d");
  let parts = [], raf = null;
  const resize = () => { cv.width = innerWidth; cv.height = innerHeight; };
  addEventListener("resize", resize); resize();
  const colors = ["#ffb43d", "#ff5a6e", "#00d68f", "#8b6cff", "#ffd166", "#4ec5ff"];
  function burst(n = 120, x = innerWidth / 2, y = innerHeight / 3) {
    for (let i = 0; i < n; i++) parts.push({
      x, y, vx: rand(-6, 6), vy: rand(-13, -4), g: rand(.18, .32),
      s: rand(5, 11), c: pick(colors), rot: rand(0, 6.28), vr: rand(-.25, .25), life: rand(60, 120),
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
  return { burst };
})();

/* ===================== 케이크 ===================== */
(() => {
  const cake = $("#cake"), hint = $("#cakeHint");
  let done = false;
  const blow = () => {
    if (done) return; done = true;
    cake.classList.add("out");
    hint.textContent = "🎉 28세 상장 성공! 생일 축하해 쭌카!";
    confetti.burst(180);
  };
  cake.addEventListener("click", blow);
  cake.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") blow(); });
})();

/* ===================== 거래소 ===================== */
const STOCKS = [
  { key: "QKE", name: "쿼카전자", emoji: "📱", base: 70000, vol: .045 },
  { key: "TFT", name: "롤토체스코인", emoji: "♟️", base: 8000, vol: .26 },
  { key: "SNU", name: "서울대수학지수", emoji: "🧮", base: 30000, vol: .08 },
  { key: "CLB", name: "클라이밍홀딩스", emoji: "🧗", base: 15000, vol: .12 },
  { key: "KSA", name: "경기과학고밈", emoji: "🧪", base: 5000, vol: .19 },
];
const EVENTS = [
  { key: "TFT", mult: 1.34, t: "쭌카 롤토체스 1등! 롤토체스코인 +34% 🚀" },
  { key: "TFT", mult: 0.7, t: "롤토체스 2등 강등... 롤토체스코인 -30% 😩" },
  { key: "QKE", mult: 1.12, t: "삼성 신제품 대박! 쿼카전자 +12% 📈" },
  { key: "QKE", mult: 0.88, t: "야근 발생, 쿼카전자 -12% 📉" },
  { key: "CLB", mult: 1.25, t: "쭌카 볼더링 완등! 클라이밍홀딩스 +25% 🧗" },
  { key: "SNU", mult: 1.18, t: "어려운 적분 풀어냄, 서울대수학지수 +18% 🧮" },
  { key: "KSA", mult: 1.4, t: "경기과학고 동문회 떡상, 경기과학고밈 +40% 🔥" },
  { key: "KSA", mult: 0.66, t: "밈 유행 끝, 경기과학고밈 -34% 🥶" },
  { key: "QKE", mult: 1.2, t: "쿼카상 프리미엄 부각, 쿼카전자 +20% 🦫" },
];
const START_CASH = 1000000, MAX_DAY = 10;

const ex = {
  el: { cash: $("#cash"), nw: $("#networth"), roi: $("#roi"), day: $("#dayLabel"), stocks: $("#stocks"), ev: $("#eventText"), next: $("#nextDayBtn") },
  state: null,
  load() {
    this.state = store.get("exchange", null);
    if (!this.state) this.fresh();
  },
  fresh() {
    const prices = {}, holds = {};
    STOCKS.forEach(s => { prices[s.key] = s.base; holds[s.key] = 0; });
    this.state = { day: 1, cash: START_CASH, prices, holds, done: false };
    store.set("exchange", this.state);
  },
  save() { store.set("exchange", this.state); },
  networth() {
    return this.state.cash + STOCKS.reduce((a, s) => a + this.state.holds[s.key] * this.state.prices[s.key], 0);
  },
  renderStocks() {
    this.el.stocks.innerHTML = STOCKS.map(s => {
      const px = this.state.prices[s.key], q = this.state.holds[s.key];
      return `<div class="stock" data-k="${s.key}">
        <div class="stock__row">
          <span class="stock__emoji">${s.emoji}</span>
          <div class="stock__info"><div class="stock__name">${s.name}</div><div class="stock__ticker">${s.key}</div></div>
          <div class="stock__price"><div class="stock__px mono">${won(px)}</div><div class="stock__chg mono" data-chg></div></div>
        </div>
        <div class="stock__hold">
          <span class="stock__qty">보유 <b>${q}</b>주 · 평가 ${won(q * px)}</span>
          <span class="stock__btns"><button class="sell">매도</button><button class="buy">매수</button></span>
        </div>
      </div>`;
    }).join("");
  },
  renderPortfolio() {
    const nw = this.networth(), roi = (nw - START_CASH) / START_CASH * 100;
    this.el.cash.textContent = won(this.state.cash);
    this.el.nw.textContent = won(nw);
    this.el.roi.textContent = (roi >= 0 ? "+" : "") + roi.toFixed(2) + "%";
    this.el.roi.className = "pf__value mono " + (roi >= 0 ? "up" : "down");
    this.el.day.textContent = `DAY ${Math.min(this.state.day, MAX_DAY)} / ${MAX_DAY}`;
  },
  trade(key, dir) {
    if (this.state.done) return;
    const px = this.state.prices[key];
    if (dir > 0) { if (this.state.cash < px) { this.flashEv("현금이 부족해요 💸"); return; } this.state.cash -= px; this.state.holds[key]++; }
    else { if (this.state.holds[key] <= 0) return; this.state.cash += px; this.state.holds[key]--; }
    this.save(); this.renderStocks(); this.renderPortfolio();
  },
  flashEv(t) { this.el.ev.textContent = t; },
  nextDay() {
    if (this.state.done) return;
    let eventText = "", evtFired = false;
    if (Math.random() < 0.55) {
      const e = pick(EVENTS);
      this.state.prices[e.key] = Math.max(100, this.state.prices[e.key] * e.mult);
      eventText = e.t; evtFired = true;
    }
    STOCKS.forEach(s => {
      const drift = rand(-s.vol, s.vol) + 0.01; // 살짝 우상향 바이어스
      this.state.prices[s.key] = Math.max(100, this.state.prices[s.key] * (1 + drift));
    });
    this.state.day++;
    this.renderStocks(); this.renderPortfolio();
    if (!evtFired) eventText = pick(["조용한 장세입니다.", "쭌카가 흐뭇하게 차트를 봅니다 🦫", "거래량 평이.", "시장이 쭌카를 주목합니다."]);
    this.el.ev.textContent = `DAY ${Math.min(this.state.day, MAX_DAY)} · ${eventText}`;
    if (this.state.day > MAX_DAY) this.finish();
    this.save();
  },
  finish() {
    this.state.done = true;
    const nw = this.networth(), roi = (nw - START_CASH) / START_CASH * 100;
    let title;
    if (roi >= 100) title = "쭌카 워렌버핏 🐃";
    else if (roi >= 30) title = "쭌카 펀드매니저 📈";
    else if (roi >= 0) title = "본전 사수 쭌카 🦫";
    else if (roi > -30) title = "쭌카 개미 🐜";
    else title = "쭌카 개미지옥 🔥";
    this.el.ev.innerHTML = `🏁 거래 종료! 최종 수익률 <b class="${roi >= 0 ? "up" : "down"}">${(roi >= 0 ? "+" : "") + roi.toFixed(2)}%</b> · 칭호 <b>${title}</b> — 스샷 찍어 친구랑 비교!`;
    this.el.next.textContent = "거래 종료 🏁"; this.el.next.disabled = true;
    if (roi >= 0) confetti.burst(160);
  },
  reset() {
    this.fresh(); this.renderStocks(); this.renderPortfolio();
    this.el.ev.textContent = "처음부터 다시. ‘다음 날’을 눌러 거래 시작.";
    this.el.next.textContent = "다음 날 (시세 갱신) ▸"; this.el.next.disabled = false;
  },
  init() {
    this.load(); this.renderStocks(); this.renderPortfolio();
    if (this.state.done) this.finish();
    this.el.stocks.addEventListener("click", e => {
      const card = e.target.closest(".stock"); if (!card) return;
      if (e.target.classList.contains("buy")) this.trade(card.dataset.k, 1);
      else if (e.target.classList.contains("sell")) this.trade(card.dataset.k, -1);
    });
    this.el.next.addEventListener("click", () => this.nextDay());
    $("#resetBtn").addEventListener("click", () => { if (confirm("거래를 처음부터 다시 시작할까요?")) this.reset(); });
  },
};

/* 시세 변동 시 카드 플래시: 가격 저장→비교 방식으로 단순화 */
ex._prevPrices = {};
const origRenderStocks = ex.renderStocks.bind(ex);
ex.renderStocks = function () {
  origRenderStocks();
  $$(".stock").forEach(c => {
    const k = c.dataset.k, now = this.state.prices[k], prev = this._prevPrices[k];
    if (prev != null) {
      const chgEl = c.querySelector("[data-chg]");
      const pct = (now - prev) / prev * 100;
      if (Math.abs(pct) > 0.001) {
        chgEl.textContent = (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
        chgEl.className = "stock__chg mono " + (pct >= 0 ? "up" : "down");
        c.classList.add(pct >= 0 ? "flash-up" : "flash-down");
        setTimeout(() => c.classList.remove("flash-up", "flash-down"), 600);
      }
    }
  });
  this._prevPrices = { ...this.state.prices };
};

/* 럭키드로우 */
(() => {
  const btn = $("#luckyBtn");
  const drawn = store.get("luckyDate", "");
  if (drawn === today()) { btn.disabled = true; btn.textContent = "🪙 오늘 럭키드로우 완료 (내일 또!)"; }
  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    const bonus = Math.round(rand(10000, 120000) / 1000) * 1000;
    ex.state.cash += bonus; ex.save(); ex.renderPortfolio();
    store.set("luckyDate", today());
    btn.disabled = true; btn.textContent = `🪙 +${won(bonus)} 획득! (내일 또)`;
    confetti.burst(80);
    ex.flashEv(`럭키드로우로 ${won(bonus)} 코인 획득! 🪙`);
  });
})();

/* ===================== 리포트 스탯 바 ===================== */
(() => {
  const stats = [["이성", 99], ["착함", 95], ["사회성", 92], ["쿼카력", 100], ["너드위장력", 88]];
  $("#stats").innerHTML = stats.map(([n, v]) => `
    <div class="stat">
      <div class="stat__top"><span>${n}</span><b>${v}</b></div>
      <div class="stat__bar"><div class="stat__fill" data-v="${v}"></div></div>
    </div>`).join("");
  const io = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { $$(".stat__fill").forEach(f => f.style.width = f.dataset.v + "%"); io.disconnect(); } });
  }, { threshold: .3 });
  io.observe($("#report"));
})();

/* ===================== 증강체 ===================== */
(() => {
  const AUG = [
    { t: "prism", ico: "🚀", n: "무한 떡상", d: "오늘 가는 곳마다 1등. 막을 수 없음." },
    { t: "prism", ico: "👑", n: "전국구 인증", d: "롤토체스도 인생도 챌린저." },
    { t: "prism", ico: "🦫", n: "쿼카 오라", d: "마주치는 모두가 행복해짐." },
    { t: "gold", ico: "🍗", n: "무한 리필", d: "석암생소금구이 고기 무한 추가." },
    { t: "gold", ico: "🧗", n: "완등 보장", d: "오늘 도전하는 루트 전부 성공." },
    { t: "gold", ico: "💰", n: "보너스 코인", d: "지갑이 가벼워질 일이 없음." },
    { t: "gold", ico: "🧠", n: "두뇌 풀가동", d: "모든 문제 암산으로 해결." },
    { t: "silver", ico: "😴", n: "꿀잠", d: "오늘 야근 없음. 칼퇴 확정." },
    { t: "silver", ico: "🎮", n: "솔랭 승급", d: "한 판만 더가 진짜 한 판만." },
    { t: "silver", ico: "☕", n: "카페인 충전", d: "하루 종일 컨디션 만렙." },
    { t: "silver", ico: "🍀", n: "소소한 행운", d: "신호등이 다 초록불." },
    { t: "silver", ico: "🎂", n: "생일 버프", d: "오늘 하루 모든 게 +28%." },
  ];
  const tierName = { prism: "PRISMATIC", gold: "GOLD", silver: "SILVER" };
  const area = $("#augmentArea");
  const saved = store.get("augment", null);

  function showResult(a) {
    area.innerHTML = `<div class="aug-result ${a.t}">
      <div class="ico">${a.ico}</div>
      <div class="tier">${tierName[a.t]} 증강</div>
      <div class="nm">${a.n}</div>
      <div class="desc">${a.d}</div>
    </div><p class="aug-note">오늘의 증강체는 정해졌어요. 내일 또 뽑기! (캡처해서 자랑하기 📸)</p>`;
  }
  function deal() {
    const opts = [];
    while (opts.length < 3) { const a = pick(AUG); if (!opts.includes(a)) opts.push(a); }
    area.innerHTML = `<div class="aug-cards">${opts.map((a, i) => `
      <div class="aug-card ${a.t}" data-i="${i}"><div class="back">❓</div></div>`).join("")}</div>
      <p class="aug-note">카드를 1장 탭해서 오늘의 증강을 선택!</p>`;
    $$(".aug-card", area).forEach(card => card.addEventListener("click", () => {
      const a = opts[+card.dataset.i];
      store.set("augment", { date: today(), aug: a });
      showResult(a); confetti.burst(a.t === "prism" ? 140 : 70);
    }, { once: true }));
  }
  if (saved && saved.date === today()) showResult(saved.aug); else deal();
})();

/* ===================== 쭌카.GG ===================== */
(() => {
  const champs = ["쿼카", "야스오", "티모", "리신", "징크스", "아무무", "갈리오"];
  const games = [
    ["롤토체스 1등", "8 / 1 / 28"], ["인성 발산 승", "12 / 0 / 30"], ["하드캐리", "15 / 2 / 9"],
    ["갱 호응 미스 패", "3 / 7 / 4"], ["역전승", "9 / 3 / 17"], ["트롤 만나 패", "5 / 6 / 8"],
    ["솔킬 따고 승", "11 / 1 / 6"], ["애매하게 패", "6 / 5 / 10"],
  ];
  const tft = ["1등 🥇", "2등", "3등", "4등", "1등 🥇", "5등"];
  const list = $("#ggMatches");
  function roll() {
    const out = [];
    for (let i = 0; i < 5; i++) {
      const win = Math.random() < 0.7;
      const g = pick(games);
      const isTft = Math.random() < 0.4;
      out.push(`<li class="${win ? "win" : "lose"}">
        <span class="res">${win ? "승" : "패"}</span>
        <span class="desc">${isTft ? "롤토체스 " + pick(tft) : pick(champs) + " · " + g[0]}</span>
        <span class="kda">${isTft ? "TFT" : g[1]}</span>
      </li>`);
    }
    list.innerHTML = out.join("");
  }
  roll();
  $("#ggRefresh").addEventListener("click", roll);
})();

/* ===================== 클라이밍 ===================== */
(() => {
  const wall = $(".climb__wall"), climber = $("#climber"), hEl = $("#climbHeight"), bEl = $("#climbBest"), btn = $("#climbBtn");
  let h = 0, best = store.get("climbBest", 0), won_ = false;
  bEl.textContent = best;
  const draw = () => {
    const pct = Math.min(h, 100) / 100;
    const max = wall.clientHeight - 40;
    climber.style.bottom = 6 + pct * max + "px";
    hEl.textContent = Math.floor(h);
  };
  draw();
  btn.addEventListener("click", () => {
    if (won_) { h = 0; won_ = false; climber.textContent = "🧗"; btn.textContent = "올라가기! 🧗"; draw(); return; }
    if (Math.random() < 0.12) { h = Math.max(0, h - rand(3, 8)); climber.textContent = "😵"; setTimeout(() => { if (!won_) climber.textContent = "🧗"; }, 250); }
    else { h += rand(4, 10); climber.textContent = "🧗"; }
    if (h >= 100) {
      h = 100; won_ = true; climber.textContent = "🎉";
      btn.textContent = "정상 정복! 다시 도전 🔁";
      confetti.burst(120);
      if (100 > best) { best = 100; }
    }
    if (Math.floor(h) > best && h < 100) best = Math.floor(h);
    store.set("climbBest", best); bEl.textContent = best;
    draw();
  });
})();

/* ===================== 너드 관문 ===================== */
(() => {
  const form = $("#gateForm"), input = $("#gateInput"), box = form, reward = $("#gateReward");
  if (store.get("gateSolved", false)) { reward.hidden = false; }
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (Number(input.value) === 28) {
      reward.hidden = false; store.set("gateSolved", true);
      confetti.burst(120); reward.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      box.classList.add("wrong"); setTimeout(() => box.classList.remove("wrong"), 400);
      $("#gateHint").textContent = "힌트: 2026 − 1998 = ? (쭌카 나이)";
    }
  });
})();

/* ===================== 빙고 ===================== */
(() => {
  const POOL = [
    "롤토체스 얘기 시작", "쿼카 같다는 말 나옴", "코드/일 얘기함", "고기 굽기 장인 등장",
    "건배 제의", "쭌카 웃참 실패", "수학 얘기 나옴", "클라이밍 자랑", "겜 한 판 하자",
    "옛날 얘기 시작", "사진 찍자", "케이크 등장", "선물 개봉", "다같이 노래", "택시 부름",
  ];
  const board = $("#bingoBoard"), status = $("#bingoStatus");
  let st = store.get("bingo", null);
  function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
  function fresh() {
    const cells = shuffle(POOL).slice(0, 8);
    cells.splice(4, 0, "🦫 FREE");
    st = { cells, on: cells.map((_, i) => i === 4) };
    store.set("bingo", st);
  }
  if (!st || !st.cells || st.cells.length !== 9) fresh();
  function lines() {
    const o = st.on, L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return L.filter(l => l.every(i => o[i])).length;
  }
  let prevLines = 0;
  function render() {
    board.innerHTML = st.cells.map((c, i) =>
      `<div class="bingo__cell ${st.on[i] ? "on" : ""} ${i === 4 ? "free" : ""}" data-i="${i}">${c}</div>`).join("");
    const n = lines(); status.textContent = `빙고 ${n}줄`;
    if (n > prevLines && n > 0) confetti.burst(100);
    prevLines = n;
  }
  prevLines = lines(); render(); prevLines = lines();
  board.addEventListener("click", e => {
    const cell = e.target.closest(".bingo__cell"); if (!cell) return;
    const i = +cell.dataset.i; if (i === 4) return;
    st.on[i] = !st.on[i]; store.set("bingo", st); render();
  });
  $("#bingoReset").addEventListener("click", () => { fresh(); prevLines = 0; render(); });
})();

/* ===================== IPO 청약 ===================== */
(() => {
  const form = $("#ipoForm"), area = $("#certArea");
  function render(c) {
    area.innerHTML = `<div class="cert">
      <div class="cert__title">JUNKA EXCHANGE · 株主證書</div>
      <div class="cert__h">쭌카 주주증서</div>
      <div class="cert__body">
        본 증서는 <b>${c.name}</b> 님이<br/>쭌카(JUNKA) 주식을 보유함을 증명합니다.
        <div class="cert__shares mono">${c.shares}</div>
        <div class="mono" style="font-size:.7rem;color:var(--muted)">보유 주식 수</div>
        <div class="cert__msg">“${c.msg}”</div>
      </div>
      <div class="cert__foot">
        <span>발행번호 ${c.no}<br/>2026.06.19 발행</span>
        <span class="cert__stamp">쭌카<br/>認證</span>
      </div>
    </div><p class="aug-note">캡처해서 단톡방에 자랑하세요 📸</p>`;
  }
  const saved = store.get("cert", null);
  if (saved) render(saved);
  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#ipoName").value.trim(), msg = $("#ipoMsg").value.trim();
    if (!name || !msg) return;
    const lucky = Math.random() < 0.15;
    const shares = lucky ? "∞ 주 (대박!)" : Math.floor(rand(1, 1000)) + " 주";
    const no = "JK-" + Math.floor(rand(1000, 9999));
    const c = { name, msg, shares, no };
    store.set("cert", c); render(c); confetti.burst(lucky ? 160 : 90);
    area.scrollIntoView({ behavior: "smooth", block: "center" });
  });
})();

/* ===================== 변동성 룰렛 ===================== */
(() => {
  const wheel = $("#wheel"), spin = $("#spinBtn"), result = $("#wheelResult"), chips = $("#chips"), addForm = $("#addForm"), addInput = $("#addInput");
  const palette = ["#ffb43d", "#ff5a6e", "#00d68f", "#8b6cff", "#ffd166", "#4ec5ff", "#f5a623", "#ff8a5c"];
  let items = store.get("wheel", ["술값 내기", "다음 잔 원샷", "쭌카 칭찬 10개", "통과", "노래 한 곡", "벌칙 면제"]);
  let rotation = 0, spinning = false;

  function render() {
    if (!items.length) {
      wheel.style.background = "var(--panel)";
      wheel.querySelectorAll(".wheel__label").forEach(n => n.remove());
      chips.innerHTML = `<span class="chip">항목을 추가하세요</span>`;
      return;
    }
    const a = 360 / items.length;
    const stops = items.map((_, i) => `${palette[i % palette.length]} ${i * a}deg ${(i + 1) * a}deg`).join(",");
    wheel.style.background = `conic-gradient(${stops})`;
    wheel.querySelectorAll(".wheel__label").forEach(n => n.remove());
    items.forEach((it, i) => {
      const lab = document.createElement("div");
      lab.className = "wheel__label";
      lab.textContent = it.length > 7 ? it.slice(0, 7) + "…" : it;
      lab.style.transform = `rotate(${(i + 0.5) * a - 90}deg)`;
      wheel.appendChild(lab);
    });
    chips.innerHTML = items.map((it, i) =>
      `<span class="chip" style="border-color:${palette[i % palette.length]}66">${it}<button data-i="${i}" aria-label="삭제">×</button></span>`).join("");
  }
  function doSpin() {
    if (spinning || items.length < 2) return;
    spinning = true; result.textContent = "";
    const a = 360 / items.length;
    rotation += 360 * 5 + rand(0, 360);
    wheel.style.transform = `rotate(${rotation}deg)`;
    setTimeout(() => {
      const norm = (360 - (rotation % 360)) % 360;
      const idx = Math.floor(norm / a) % items.length;
      result.innerHTML = `결과: <b>${items[idx]}</b>`;
      confetti.burst(70);
      spinning = false;
    }, 4700);
  }
  spin.addEventListener("click", doSpin);
  wheel.addEventListener("click", doSpin);
  chips.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    items.splice(+b.dataset.i, 1); store.set("wheel", items); render();
  });
  addForm.addEventListener("submit", e => {
    e.preventDefault();
    const v = addInput.value.trim(); if (!v) return;
    if (items.length >= 10) { result.textContent = "최대 10개까지만!"; return; }
    items.push(v); addInput.value = ""; store.set("wheel", items); render();
  });
  render();
})();

/* ===================== 부팅 ===================== */
ex.init();

})();
