// Cab ride map: plays a YouTube cab-view video and shows the train's live position on a route map.
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const ids = Object.keys(window.ROUTES || {});
  const routeId = ids.includes(location.hash.slice(1)) ? location.hash.slice(1) : ids[0];
  const R = window.ROUTES[routeId];
  const KEY = "cabride:" + routeId;

  // ---------- saved adjustments (per browser) ----------
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} };
  const stations = R.stations.map((s, i) => {
    const o = saved.times && saved.times[i];
    return { name: s.name, arr: o ? o[0] : s.arr, dep: o ? o[1] : s.dep, shape: s.shape };
  });
  let offset = saved.offset || 0;
  const n = stations.length;

  // ---------- helpers ----------
  function fmt(s) {
    if (s == null || !isFinite(s)) return "—";
    s = Math.max(0, Math.round(s));
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- timeline model ----------
  function points() {
    const p = [];
    stations.forEach((s, i) => {
      if (s.arr != null) p.push({ t: s.arr, pos: i });
      if (s.dep != null) p.push({ t: s.dep, pos: i });
    });
    return p;
  }
  let P = points();
  function state(t) {
    if (!P.length) return { phase: "none", pos: 0 };
    const first = P[0], last = P[P.length - 1];
    const base = { start: first.t, end: last.t, endPos: last.pos };
    if (t < first.t) return { ...base, phase: "before", pos: first.pos, at: first.pos, eta: first.t - t, segFrac: 0 };
    for (let j = 0; j < P.length - 1; j++) {
      const a = P[j], b = P[j + 1];
      if (t >= a.t && t < b.t) {
        const f = (t - a.t) / (b.t - a.t);
        if (a.pos === b.pos) return { ...base, phase: "dwell", pos: a.pos, at: a.pos, eta: b.t - t, segFrac: f };
        const pos = a.pos + (b.pos - a.pos) * f;
        const next = Math.min(b.pos, Math.floor(pos) + 1);
        const prev = Math.max(a.pos, Math.ceil(pos) - 1);
        const tAt = k => a.t + (k - a.pos) / (b.pos - a.pos) * (b.t - a.t);
        return { ...base, phase: "moving", pos, from: prev, next, eta: tAt(next) - t, segFrac: (t - tAt(prev)) / (tAt(next) - tAt(prev)) };
      }
    }
    return { ...base, phase: last.pos === n - 1 ? "end" : "after", pos: last.pos, at: last.pos, segFrac: 1 };
  }

  // ---------- map ----------
  const geo = stations.every(s => s.shape) ? stations.map(s => s.shape) : null;
  const STRIP = { W: 1000, PADL: 60, PADR: 60, Y: 60 };
  function xy(pos) {
    const p = Math.max(0, Math.min(n - 1, pos));
    if (!geo) return [STRIP.PADL + p * (STRIP.W - STRIP.PADL - STRIP.PADR) / (n - 1), STRIP.Y];
    const i = Math.min(n - 2, Math.floor(p)), f = p - i, a = geo[i], b = geo[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  }
  const LP = { W: ["end", -15, 7], E: ["start", 15, 7], NE: ["start", 11, -12], NW: ["end", -11, -12], SE: ["start", 11, 27], SW: ["end", -11, 27], S: ["middle", 0, 32], N: ["middle", 0, -18] };
  function buildMap() {
    const svg = $("svg");
    let h = "";
    const pts = stations.map((_, i) => xy(i).join(",")).join(" ");
    svg.setAttribute("viewBox", "0 0 1000 600");
    h += `<polyline class="track" points="${pts}"/><polyline class="spent" id="spent" points=""/>`;
    (R.landmarks || []).forEach(l => {
      const [a, b] = l.between.map(xy);
      h += `<text class="note" x="${(a[0] + b[0]) / 2}" y="${(a[1] + b[1]) / 2 + (l.dy || 0)}" text-anchor="middle">${esc(l.text)}</text>`;
    });
    stations.forEach((s, i) => {
      const [x, y] = xy(i);
      h += `<circle class="dot" id="d${i}" cx="${x}" cy="${y}" r="7.5"/>`;
      if (geo) {
        const [anchor, dx, dy] = LP[geo[i][2]] || LP.E;
        h += `<text class="lbl" id="l${i}" x="${x + dx}" y="${y + dy}" text-anchor="${anchor}">${esc(s.name)}</text>`;
      } else {
        h += `<text class="lbl" id="l${i}" x="${x}" y="${STRIP.Y + 22}" text-anchor="end" transform="rotate(-40 ${x} ${STRIP.Y + 22})">${esc(s.name)}</text>`;
      }
    });
    h += `<g class="train" id="train"><circle class="halo" r="17"/><circle class="core" r="10"/></g>`;
    svg.innerHTML = h;
    fitMap();
  }
  // Fit the viewBox to the drawing (labels included) so the map fills its panel.
  function fitMap() {
    const svg = $("svg");
    try {
      const b = svg.getBBox(), pad = 14;
      if (b.width) svg.setAttribute("viewBox", `${b.x - pad} ${b.y - pad} ${b.width + pad * 2} ${b.height + pad * 2}`);
    } catch (e) {}
  }
  document.fonts && document.fonts.ready.then(fitMap);
  function spentPoints(pos) {
    const pts = [];
    for (let i = 0; i <= Math.floor(pos); i++) pts.push(xy(i));
    pts.push(xy(pos));
    return pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  }

  // ---------- player ----------
  let player = null, playing = false;
  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player("player", {
      videoId: R.videoId,
      playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
      events: { onStateChange: e => { playing = e.data === YT.PlayerState.PLAYING; } }
    });
  };
  const videoTime = () => (player && player.getCurrentTime ? player.getCurrentTime() || 0 : 0);

  // ---------- render ----------
  let last = null;
  function render() {
    const vt = videoTime(), t = vt + offset, s = state(t);
    $("clock").textContent = fmt(vt);
    const E = $("eyebrow"), H = $("headline"), S = $("sub");
    if (s.phase === "none") { E.textContent = "No times"; H.textContent = stations[0].name; S.innerHTML = ""; }
    else if (s.phase === "before") { E.textContent = "Approaching"; H.textContent = stations[s.at].name; S.innerHTML = `Arriving in <b>${fmt(s.eta)}</b>`; }
    else if (s.phase === "dwell") { E.textContent = "Now at"; H.textContent = stations[s.at].name; S.innerHTML = `Departs in <b>${fmt(s.eta)}</b>`; }
    else if (s.phase === "moving") { E.textContent = `Departed ${stations[s.from].name}`; H.textContent = `Next: ${stations[s.next].name}`; S.innerHTML = `Arriving in <b>${fmt(s.eta)}</b>`; }
    else if (s.phase === "end") { E.textContent = "End of line"; H.textContent = stations[s.at].name; S.innerHTML = "Ride complete."; }
    else { E.textContent = "After"; H.textContent = stations[s.at].name; S.innerHTML = ""; }

    const stationNo = s.phase === "moving" ? s.next : Math.round(s.pos);
    $("tStation").textContent = `${stationNo + 1} / ${n}`;
    if (s.start != null) {
      $("tElapsed").textContent = fmt(Math.max(0, t - s.start));
      $("tRemainLbl").textContent = "To " + stations[s.endPos].name;
      $("tRemain").textContent = fmt(Math.max(0, s.end - t));
      const frac = s.end > s.start ? Math.min(1, Math.max(0, (t - s.start) / (s.end - s.start))) : 0;
      $("overall").style.width = frac * 100 + "%";
    }
    $("segbar").style.width = (s.segFrac || 0) * 100 + "%";

    const [x, y] = xy(s.pos);
    $("spent").setAttribute("points", spentPoints(s.pos));
    const tr = $("train");
    tr.setAttribute("transform", `translate(${x} ${y})`);
    tr.classList.toggle("moving", s.phase === "moving" && playing);
    const here = s.phase === "moving" ? -1 : Math.round(s.pos);
    for (let i = 0; i < n; i++) {
      const done = i < s.pos - 1e-6 && i !== here;
      $("d" + i).setAttribute("class", "dot" + (i === here ? " here" : done ? " done" : ""));
      $("l" + i).setAttribute("class", "lbl" + (i === here ? " here" : (s.phase === "moving" && i === s.next) ? " next" : done ? " done" : ""));
    }
    if (s.phase === "moving" || s.phase === "dwell" || s.phase === "before") document.title = `${H.textContent} · ${R.name}`;
    last = s;
  }
  setInterval(render, 100);

  // ---------- adjustments ----------
  const showOffset = () => { $("offset").textContent = (offset > 0 ? "+" : "") + offset + "s"; };
  document.querySelectorAll("[data-off]").forEach(b => b.onclick = () => { offset += Number(b.dataset.off); saved.offset = offset; persist(); showOffset(); });
  $("offReset").onclick = () => { offset = 0; saved.offset = 0; persist(); showOffset(); };
  function saveTimes(msg) {
    saved.times = stations.map(s => [s.arr, s.dep]); persist(); P = points();
    $("msg").textContent = msg;
  }
  $("mark").onclick = () => {
    if (!last) return;
    const i = last.phase === "moving" ? last.next : last.at;
    if (i == null) return;
    stations[i].arr = Math.round(videoTime() * 10) / 10;
    saveTimes(`Arrival at ${stations[i].name} set to ${fmt(stations[i].arr)}.`);
  };
  $("markDep").onclick = () => {
    if (!last) return;
    const i = last.phase === "moving" ? last.from : last.at;
    if (i == null || i === n - 1) return;
    stations[i].dep = Math.round(videoTime() * 10) / 10;
    saveTimes(`Departure from ${stations[i].name} set to ${fmt(stations[i].dep)}.`);
  };
  let armed = null;
  $("resetTimes").onclick = () => {
    if (!armed) { $("resetTimes").textContent = "Click again to restore"; armed = setTimeout(() => { armed = null; $("resetTimes").textContent = "Restore original times"; }, 3000); return; }
    clearTimeout(armed); armed = null; $("resetTimes").textContent = "Restore original times";
    R.stations.forEach((s, i) => { stations[i].arr = s.arr; stations[i].dep = s.dep; });
    delete saved.times; persist(); P = points(); $("msg").textContent = "Original times restored.";
  };

  // ---------- full screen ----------
  function toggleFs() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
  }
  $("fs").onclick = toggleFs;
  document.addEventListener("keydown", e => {
    if (e.target.tagName === "INPUT" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "f" || e.key === "F") toggleFs();
    else if (e.code === "Space" && player && player.getPlayerState) {
      e.preventDefault();
      playing ? player.pauseVideo() : player.playVideo();
    }
  });
  window.addEventListener("hashchange", () => location.reload());

  // ---------- init ----------
  $("routeName").textContent = R.name;
  $("routeSub").textContent = R.subtitle || "";
  $("credit").textContent = R.credit || "";
  if (R.color) document.documentElement.style.setProperty("--line", R.color);
  showOffset();
  buildMap();
  render();
})();
