/* 쭌카.GG — fake esports recent-games generator */
(() => {
  "use strict";

  const CHAMPS = ["쿼카", "야스오", "티모", "리신", "징크스", "아무무", "갈리오"];

  const WIN_BLURBS = ["하드캐리", "역전승", "솔킬 따고 승", "캐리 받고 승", "후반 폭주"];
  const LOSS_BLURBS = ["트롤 만나 패", "갱 호응 미스 패", "애매하게 패", "정글차이 패"];

  const TFT_RANKS = ["1등 🥇", "2등", "3등", "4등", "5등"];

  const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const num = (a, b) => Math.floor(a + Math.random() * (b - a + 1));

  function kdaWin() {
    return { k: num(7, 16), d: num(0, 3), a: num(8, 22) };
  }
  function kdaLoss() {
    return { k: num(1, 6), d: num(4, 10), a: num(2, 9) };
  }

  // Build one random match object
  function makeMatch() {
    const win = Math.random() < 0.70;
    const isTft = Math.random() < 0.45;

    if (isTft) {
      // TFT placement: wins lean toward top placements
      const rank = win
        ? rnd(["1등 🥇", "1등 🥇", "2등", "3등", "4등"])
        : rnd(["5등", "6등", "7등", "8등"]);
      return { win, mode: "tft", rank };
    }

    const k = win ? kdaWin() : kdaLoss();
    return {
      win,
      mode: "lol",
      champ: rnd(CHAMPS),
      blurb: win ? rnd(WIN_BLURBS) : rnd(LOSS_BLURBS),
      kda: k,
    };
  }

  function renderMatch(m) {
    const li = document.createElement("li");
    li.className = "match " + (m.win ? "win" : "loss") + " " + m.mode;

    const bar = document.createElement("span");
    bar.className = "match__bar";

    const result = document.createElement("span");
    result.className = "match__result";
    result.textContent = m.win ? "승" : "패";

    const body = document.createElement("div");
    body.className = "match__body";

    const mode = document.createElement("span");
    mode.className = "match__mode";
    mode.textContent = m.mode === "tft" ? "TFT" : "LoL";

    if (m.mode === "tft") {
      const champ = document.createElement("div");
      champ.className = "match__champ";
      champ.appendChild(mode);
      champ.appendChild(document.createTextNode("롤토체스 랭크"));
      body.appendChild(champ);

      const blurb = document.createElement("div");
      blurb.className = "match__blurb";
      blurb.textContent = m.win ? "상위권 마무리" : "막판에 미끄러짐";
      body.appendChild(blurb);

      li.append(bar, result, body);

      const rank = document.createElement("div");
      rank.className = "match__rank";
      rank.textContent = m.rank;
      li.appendChild(rank);
    } else {
      const champ = document.createElement("div");
      champ.className = "match__champ";
      champ.appendChild(mode);
      champ.appendChild(document.createTextNode(m.champ));
      body.appendChild(champ);

      const blurb = document.createElement("div");
      blurb.className = "match__blurb";
      blurb.textContent = m.blurb;
      body.appendChild(blurb);

      li.append(bar, result, body);

      const kda = document.createElement("div");
      kda.className = "match__kda";
      const ratio = ((m.kda.k + m.kda.a) / Math.max(1, m.kda.d)).toFixed(1);
      kda.innerHTML =
        m.kda.k + " <i>/</i> <b>" + m.kda.d + "</b> <i>/</i> " + m.kda.a +
        ' <span style="color:var(--muted);font-size:13px">(' + ratio + ":1)</span>";
      li.appendChild(kda);
    }

    return li;
  }

  const listEl = document.getElementById("matchList");
  const tallyEl = document.getElementById("winTally");
  const btn = document.getElementById("reroll");

  function reroll() {
    const matches = Array.from({ length: 5 }, makeMatch);

    listEl.innerHTML = "";
    matches.forEach((m, i) => {
      const node = renderMatch(m);
      node.style.animationDelay = i * 0.05 + "s";
      listEl.appendChild(node);
    });

    const wins = matches.filter((m) => m.win).length;
    tallyEl.innerHTML = "<b>" + wins + "승</b> " + (5 - wins) + "패";

    // nice-to-have: confetti on a perfect 5-win re-roll
    if (wins === 5 && window.JunkaConfetti) {
      window.JunkaConfetti.burst(140, {
        colors: ["#2ee6ff", "#2bd576", "#3b82f6", "#7df0ff", "#ffcf4d"],
      });
    }
  }

  if (btn) btn.addEventListener("click", reroll);
  reroll();
})();
