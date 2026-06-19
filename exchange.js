/* ===== 준영증권거래소 · exchange.js ===== */
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const won = (n) => "₩" + Math.round(n).toLocaleString("ko-KR");
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const today = () => new Date().toISOString().slice(0, 10);
const boom = (n, colors) => { if (window.JunkaConfetti) window.JunkaConfetti.burst(n, { colors }); };
const store = {
  get(k, d) { try { const v = localStorage.getItem("junka:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("junka:" + k, JSON.stringify(v)); } catch {} },
};

/* 티커 */
(() => {
  const items = [
    ["🦫 JUNKA EXCHANGE", "hl"], ["쿼카전자 ▲ 2.8%", "up"], ["롤토체스코인 ▲▲ 31% 전국구", "up"],
    ["서울대수학지수 ▲ 1.2%", "up"], ["클라이밍홀딩스 ▲ 4.0%", "up"], ["경기과학고밈 ▼ 0.7%", "down"],
    ["980619 신규상장", "hl"], ["28세 사상 최고가 경신 🚀", "up"], ["목표주가 ∞", "up"],
  ];
  const make = () => items.map(([t, c]) => `<span class="${c}">${t}</span>`).join("");
  $("#tickerTrack").innerHTML = make() + make();
})();

/* 종목 — 특징(desc) + 변동성 태그(vibe) 포함 */
const STOCKS = [
  { key: "QKE", name: "쿼카전자", emoji: "📱", base: 70000, vol: .045, vibe: "안정형", desc: "삼성 패러디 우량주. 변동 적고 꾸준한 배당주 느낌. 야근 터지면 잠깐 휘청." },
  { key: "TFT", name: "롤토체스코인", emoji: "♟️", base: 8000, vol: .26, vibe: "초고변동", desc: "전국구 잡코인. 1등 뜨면 떡상, 강등 뜨면 나락. 심장 약하면 비추." },
  { key: "SNU", name: "서울대수학지수", emoji: "🧮", base: 30000, vol: .08, vibe: "우량 지수", desc: "탄탄한 펀더멘털. 어려운 적분 풀 때마다 우상향하는 똑똑이 지수." },
  { key: "CLB", name: "클라이밍홀딩스", emoji: "🧗", base: 15000, vol: .12, vibe: "성장주", desc: "완등 소식에 급등하는 성장주. 추세 좋지만 가끔 추락(슬립) 주의." },
  { key: "KSA", name: "경기과학고밈", emoji: "🧪", base: 5000, vol: .19, vibe: "밈 테마주", desc: "유행 타면 폭등, 식으면 급락하는 예측불가 테마주. 한탕 노림수." },
];
const EVENTS = [
  { key: "TFT", mult: 1.34, t: "쭌카 롤토체스 1등! 롤토체스코인 +34% 🚀" },
  { key: "TFT", mult: 0.70, t: "롤토체스 2등 강등... 롤토체스코인 -30% 😩" },
  { key: "QKE", mult: 1.12, t: "삼성 신제품 대박! 쿼카전자 +12% 📈" },
  { key: "QKE", mult: 0.88, t: "야근 발생, 쿼카전자 -12% 📉" },
  { key: "CLB", mult: 1.25, t: "쭌카 볼더링 완등! 클라이밍홀딩스 +25% 🧗" },
  { key: "SNU", mult: 1.18, t: "어려운 적분 풀어냄, 서울대수학지수 +18% 🧮" },
  { key: "KSA", mult: 1.40, t: "경기과학고 밈 떡상, 경기과학고밈 +40% 🔥" },
  { key: "KSA", mult: 0.66, t: "밈 유행 끝, 경기과학고밈 -34% 🥶" },
  { key: "QKE", mult: 1.20, t: "쿼카상 프리미엄 부각, 쿼카전자 +20% 🦫" },
];
const START_CASH = 1000000, MAX_DAY = 10;

const ex = {
  el: { cash: $("#cash"), nw: $("#networth"), roi: $("#roi"), day: $("#dayLabel"), stocks: $("#stocks"), ev: $("#eventText"), next: $("#nextDayBtn") },
  state: null, _prev: {},
  load() { this.state = store.get("exchange", null); if (!this.state) this.fresh(); },
  fresh() {
    const prices = {}, holds = {};
    STOCKS.forEach(s => { prices[s.key] = s.base; holds[s.key] = 0; });
    this.state = { day: 1, cash: START_CASH, prices, holds, done: false };
    store.set("exchange", this.state);
  },
  save() { store.set("exchange", this.state); },
  networth() { return this.state.cash + STOCKS.reduce((a, s) => a + this.state.holds[s.key] * this.state.prices[s.key], 0); },
  renderStocks() {
    this.el.stocks.innerHTML = STOCKS.map(s => {
      const px = this.state.prices[s.key], q = this.state.holds[s.key];
      return `<div class="stock" data-k="${s.key}">
        <div class="stock__row">
          <span class="stock__emoji">${s.emoji}</span>
          <div class="stock__info">
            <div class="stock__name">${s.name} <span class="stock__ticker">${s.key} · ${s.vibe}</span></div>
            <div class="stock__desc">${s.desc}</div>
          </div>
          <div class="stock__price"><div class="stock__px mono">${won(px)}</div><div class="stock__chg mono" data-chg></div></div>
        </div>
        <div class="stock__hold">
          <span class="stock__qty">보유 <b>${q}</b>주 · 평가 ${won(q * px)}</span>
          <span class="stock__btns"><button class="sell">매도</button><button class="buy">매수</button><button class="buyall">풀매수</button></span>
        </div>
      </div>`;
    }).join("");
    // 변동 플래시
    $$(".stock", this.el.stocks).forEach(c => {
      const k = c.dataset.k, now = this.state.prices[k], prev = this._prev[k];
      if (prev != null) {
        const pct = (now - prev) / prev * 100, chgEl = c.querySelector("[data-chg]");
        if (Math.abs(pct) > 0.001) {
          chgEl.textContent = (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
          chgEl.className = "stock__chg mono " + (pct >= 0 ? "up" : "down");
          c.classList.add(pct >= 0 ? "flash-up" : "flash-down");
          setTimeout(() => c.classList.remove("flash-up", "flash-down"), 600);
        }
      }
    });
    this._prev = { ...this.state.prices };
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
    if (dir > 0) { if (this.state.cash < px) { this.el.ev.textContent = "현금이 부족해요 💸"; return; } this.state.cash -= px; this.state.holds[key]++; }
    else { if (this.state.holds[key] <= 0) return; this.state.cash += px; this.state.holds[key]--; }
    this.save(); this.renderStocks(); this.renderPortfolio();
  },
  tradeMax(key) {
    if (this.state.done) return;
    const px = this.state.prices[key];
    const qty = Math.floor(this.state.cash / px);
    if (qty <= 0) { this.el.ev.textContent = "현금이 부족해요 💸"; return; }
    this.state.cash -= qty * px; this.state.holds[key] += qty;
    this.save(); this.renderStocks(); this.renderPortfolio();
    this.el.ev.textContent = `${STOCKS.find(s => s.key === key).name} ${qty}주 풀매수! 🤑`;
  },
  nextDay() {
    if (this.state.done) return;
    let text = "", evt = false;
    if (Math.random() < 0.55) {
      const e = pick(EVENTS);
      this.state.prices[e.key] = Math.max(100, this.state.prices[e.key] * e.mult);
      text = e.t; evt = true;
    }
    STOCKS.forEach(s => {
      const drift = rand(-s.vol, s.vol) + 0.01;
      this.state.prices[s.key] = Math.max(100, this.state.prices[s.key] * (1 + drift));
    });
    this.state.day++;
    this.renderStocks(); this.renderPortfolio();
    if (!evt) text = pick(["조용한 장세입니다.", "쭌카가 흐뭇하게 차트를 봅니다 🦫", "거래량 평이.", "시장이 쭌카를 주목합니다."]);
    this.el.ev.textContent = `DAY ${Math.min(this.state.day, MAX_DAY)} · ${text}`;
    if (this.state.day > MAX_DAY) this.finish();
    this.save();
  },
  finish() {
    this.state.done = true;
    const nw = this.networth(), roi = (nw - START_CASH) / START_CASH * 100;
    let title = roi >= 100 ? "쭌카 워렌버핏 🐃" : roi >= 30 ? "쭌카 펀드매니저 📈" : roi >= 0 ? "본전 사수 쭌카 🦫" : roi > -30 ? "쭌카 개미 🐜" : "쭌카 개미지옥 🔥";
    this.el.ev.innerHTML = `🏁 거래 종료! 최종 수익률 <b class="${roi >= 0 ? "up" : "down"}">${(roi >= 0 ? "+" : "") + roi.toFixed(2)}%</b> · 칭호 <b>${title}</b> — 스샷 찍어 친구랑 비교!`;
    this.el.next.textContent = "거래 종료 🏁"; this.el.next.disabled = true;
    if (roi >= 0) boom(160);
  },
  reset() {
    this._prev = {}; this.fresh(); this.renderStocks(); this.renderPortfolio();
    this.el.ev.textContent = "처음부터 다시. ‘다음 날’을 눌러 거래 시작.";
    this.el.next.textContent = "다음 날 (시세 갱신) ▸"; this.el.next.disabled = false;
  },
  init() {
    this.load(); this.renderStocks(); this.renderPortfolio();
    if (this.state.done) this.finish();
    this.el.stocks.addEventListener("click", e => {
      const card = e.target.closest(".stock"); if (!card) return;
      if (e.target.classList.contains("buyall")) this.tradeMax(card.dataset.k);
      else if (e.target.classList.contains("buy")) this.trade(card.dataset.k, 1);
      else if (e.target.classList.contains("sell")) this.trade(card.dataset.k, -1);
    });
    this.el.next.addEventListener("click", () => this.nextDay());
    $("#resetBtn").addEventListener("click", () => { if (confirm("거래를 처음부터 다시 시작할까요?")) this.reset(); });
  },
};

/* 럭키드로우 */
(() => {
  const btn = $("#luckyBtn");
  if (store.get("luckyDate", "") === today()) { btn.disabled = true; btn.textContent = "🪙 오늘 럭키드로우 완료 (내일 또!)"; }
  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    const bonus = Math.round(rand(10000, 120000) / 1000) * 1000;
    ex.state.cash += bonus; ex.save(); ex.renderPortfolio();
    store.set("luckyDate", today());
    btn.disabled = true; btn.textContent = `🪙 +${won(bonus)} 획득! (내일 또)`;
    boom(80, ["#ffd166", "#ffb43d", "#f5a623"]);
    ex.el.ev.textContent = `럭키드로우로 ${won(bonus)} 코인 획득! 🪙`;
  });
})();

/* IPO 청약 / 주주증서 */
(() => {
  const form = $("#ipoForm"), area = $("#certArea");
  const render = (c) => {
    area.innerHTML = `<div class="cert">
      <div class="cert__title">JUNKA EXCHANGE · 株主證書</div>
      <div class="cert__h">쭌카 주주증서</div>
      <div class="cert__body">본 증서는 <b>${c.name}</b> 님이<br/>쭌카(JUNKA) 주식을 보유함을 증명합니다.
        <div class="cert__shares mono">${c.shares}</div>
        <div class="mono" style="font-size:.7rem;color:var(--muted)">보유 주식 수</div>
        <div class="cert__msg">“${c.msg}”</div>
      </div>
      <div class="cert__foot"><span>발행번호 ${c.no}<br/>2026.06.19 발행</span><span class="cert__stamp">쭌카<br/>認證</span></div>
    </div><p class="cert-note">캡처해서 단톡방에 자랑하세요 📸</p>`;
  };
  const saved = store.get("cert", null); if (saved) render(saved);
  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#ipoName").value.trim(), msg = $("#ipoMsg").value.trim();
    if (!name || !msg) return;
    const lucky = Math.random() < 0.15;
    const c = { name, msg, shares: lucky ? "∞ 주 (대박!)" : Math.floor(rand(1, 1000)) + " 주", no: "JK-" + Math.floor(rand(1000, 9999)) };
    store.set("cert", c); render(c); boom(lucky ? 160 : 90);
    area.scrollIntoView({ behavior: "smooth", block: "center" });
  });
})();

ex.init();
})();
