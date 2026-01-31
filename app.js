function hasMonthlyHours() {
  const mh = parseTrNumber(document.getElementById("monthHours")?.value);
  return Number.isFinite(mh) && mh > 0;
}

const HOURLY_RATE = 177; // TL/saat

const $ = (id) => document.getElementById(id);

function parseTrNumber(s) {
  if (s == null) return NaN;
  const cleaned = String(s).trim().replace(/\s+/g, "").replace(",", ".");
  const normalized = cleaned.replace(/[^0-9.-]/g, "");
  return Number(normalized);
}

function tl(n) {
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });
}

function daysInMonth(year, month1to12) {
  return new Date(year, month1to12, 0).getDate();
}

function dailyPackageBonus(pk) {
  if (!Number.isFinite(pk)) return 0;
  if (pk >= 76) return 4830;
  if (pk >= 70) return 4320;
  if (pk >= 64) return 3815;
  if (pk >= 59) return 3390;
  if (pk >= 55) return 3055;
  if (pk >= 49) return 2550;
  if (pk >= 43) return 2040;
  if (pk >= 38) return 1595;
  if (pk >= 34) return 1180;
  if (pk >= 28) return 770;
  if (pk >= 24) return 505;
  if (pk >= 20) return 255;
  return 0;
}

function monthlyBonus(totalPk) {
  if (!Number.isFinite(totalPk)) return 0;
  if (totalPk >= 1800) return 68575;
  if (totalPk >= 1600) return 55698;
  if (totalPk >= 1400) return 47970;
  if (totalPk >= 1200) return 40300;
  if (totalPk >= 1000) return 33408;
  if (totalPk >= 900)  return 27520;
  if (totalPk >= 800)  return 20224;
  if (totalPk >= 700)  return 12800;
  return 0;
}

function showError(msg) {
  const el = $("error");
  el.textContent = msg;
  el.style.display = "block";
}
function clearError() {
  const el = $("error");
  el.textContent = "";
  el.style.display = "none";
}

function stateKey(monthStr){ return `kurye_calc_${monthStr}`; }
function hoursKey(monthStr){ return `kurye_hours_${monthStr}`; }

function defaultMonth() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function loadMonthState(monthStr, dayCount) {
  const raw = localStorage.getItem(stateKey(monthStr));
  if (!raw) {
    return Array.from({ length: dayCount }, () => ({ t: "work", h: "", pk: "", km: "0" }));
  }
  try {
    const arr = JSON.parse(raw);
    return Array.from({ length: dayCount }, (_, i) => arr[i] ?? ({ t: "work", h: "", pk: "", km: "0" }));
  } catch {
    return Array.from({ length: dayCount }, () => ({ t: "work", h: "", pk: "", km: "0" }));
  }
}

function saveMonthState(monthStr, daysArr) {
  localStorage.setItem(stateKey(monthStr), JSON.stringify(daysArr));
}

function toastTop(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.position = "fixed";
  t.style.left = "50%";
  t.style.top = "18px";
  t.style.transform = "translateX(-50%)";
  t.style.padding = "14px 16px";
  t.style.borderRadius = "16px";
  t.style.background = "#16a34a";
  t.style.color = "#ffffff";
  t.style.fontWeight = "800";
  t.style.zIndex = "999999";
  t.style.boxShadow = "0 10px 30px rgba(0,0,0,.35)";
  t.style.maxWidth = "92vw";
  t.style.textAlign = "center";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

function confettiBurst(durationMs = 1500) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.style.position = "fixed";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "999998";
  document.body.appendChild(canvas);

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  const colors = ["#22c55e", "#60a5fa", "#f59e0b", "#a78bfa", "#ef4444", "#14b8a6"];
  const pieces = [];
  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  const count = 140;
  for (let i = 0; i < count; i++) {
    pieces.push({
      x: W() / 2 + (Math.random() - 0.5) * 120,
      y: H() * 0.25 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * -8 - 3,
      g: 0.22 + Math.random() * 0.12,
      r: 2 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1
    });
  }

  const start = performance.now();

  function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, W(), H());

    for (const p of pieces) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      const life = Math.min(1, t / durationMs);
      p.alpha = 1 - life;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r, -p.r * 0.6, p.r * 2.2, p.r * 1.2);
      ctx.restore();
    }

    if (t < durationMs) requestAnimationFrame(frame);
    else { window.removeEventListener("resize", resize); canvas.remove(); }
  }

  requestAnimationFrame(frame);
}

/* --------------------
   Liste görünümü (istersen kullan)
-------------------- */
function renderDays(monthStr, year, month1to12) {
  const dc = daysInMonth(year, month1to12);
  const container = $("days");
  if (!container) return () => loadMonthState(monthStr, dc);
  container.innerHTML = "";

  const daysArr = loadMonthState(monthStr, dc);

  daysArr.forEach((d, idx) => {
    const dayNo = idx + 1;
    const row = document.createElement("div");
    row.className = "day";
    row.innerHTML = `
      <div><b>${dayNo}</b><br><small>gün</small></div>

      <div class="c2">
        <label style="margin:0 0 6px;">Durum</label>
        <select data-k="t">
          <option value="work">Çalıştım</option>
          <option value="off">Haftalık izin</option>
          <option value="unpaid">Çalışmadım</option>
        </select>
      </div>

      <div class="c2">
        <label style="margin:0 0 6px;">Saat</label>
        <input data-k="h" inputmode="decimal" placeholder="örn: 7.8" />
      </div>

      <div class="c2">
        <label style="margin:0 0 6px;">Paket</label>
        <input data-k="pk" inputmode="numeric" placeholder="örn: 42" />
      </div>

      <div class="c3" style="display:none;">
        <label style="margin:0 0 6px;">KM</label>
        <select data-k="km">
          <option value="0">0</option>
          <option value="25">25</option>
          <option value="35">35</option>
        </select>
      </div>
    `;

    const tSel = row.querySelector('select[data-k="t"]');
    const hInp = row.querySelector('input[data-k="h"]');
    const pkInp = row.querySelector('input[data-k="pk"]');
    const kmWrap = row.querySelector(".c3");
    const kmSel = row.querySelector('select[data-k="km"]');

    tSel.value = d.t ?? "work";
    hInp.value = d.h ?? "";
    pkInp.value = d.pk ?? "";
    kmSel.value = d.km ?? "0";

    function applyEnabled() {
      const isWork = tSel.value === "work";
      hInp.disabled = !isWork;
      pkInp.disabled = !isWork;
      if (!isWork) { hInp.value = ""; pkInp.value = ""; }

      const kmOn = $("kmMode")?.value === "on";
      kmWrap.style.display = kmOn ? "block" : "none";
      kmSel.disabled = !(kmOn && isWork);
      if (!(kmOn && isWork)) kmSel.value = "0";
    }

    function persist() {
      daysArr[idx] = { t: tSel.value, h: hInp.value, pk: pkInp.value, km: kmSel.value };
      saveMonthState(monthStr, daysArr);
    }

    tSel.addEventListener("change", () => { applyEnabled(); persist(); });
    hInp.addEventListener("input", persist);
    pkInp.addEventListener("input", persist);
    kmSel.addEventListener("change", persist);

    applyEnabled();
    container.appendChild(row);
  });

  return () => loadMonthState(monthStr, dc);
}

/* --------------------
   Hesaplama
-------------------- */
function calculate(getDays, year, month1to12) {
  clearError();

  const monthStr = $("month")?.value || `${year}-${String(month1to12).padStart(2,"0")}`;
  const daysArr = getDays();

  const monthHours = parseTrNumber($("monthHours")?.value);
  const useMonthlyHours = Number.isFinite(monthHours) && monthHours > 0;

  let workDays = 0, offDays = 0, unpaidDays = 0;
  let totalPk = 0;
  let totalHours = 0;

  let fixedSum = 0;
  let dailyBonusSum = 0;
  let kmSum = 0;

  const kmOn = $("kmMode")?.value === "on";

  for (const d of daysArr) {
    if (d.t === "work") workDays++;
    else if (d.t === "off") offDays++;
    else unpaidDays++;

    const pk = parseTrNumber(d.pk);
    const pkInt = Number.isFinite(pk) ? Math.max(0, Math.floor(pk)) : 0;
    totalPk += (d.t === "work") ? pkInt : 0;

    dailyBonusSum += (d.t === "work") ? dailyPackageBonus(pkInt) : 0;

    const h = parseTrNumber(d.h);
    const hVal = (d.t === "work" && Number.isFinite(h) && h >= 0) ? h : 0;
    totalHours += hVal;

    if (kmOn && d.t === "work") {
      const km = parseTrNumber(d.km);
      kmSum += Number.isFinite(km) ? km : 0;
    }
  }

  // Sabit hakediş:
  fixedSum = (useMonthlyHours ? monthHours : totalHours) * HOURLY_RATE;

  const mBonus = monthlyBonus(totalPk);
  const grand = fixedSum + dailyBonusSum + kmSum + mBonus;

  $("workDays").textContent = workDays;
  $("offDays").textContent = offDays;
  $("unpaidDays").textContent = unpaidDays;
  $("totalPk").textContent = totalPk;
  $("totalHours").textContent = (useMonthlyHours ? monthHours : totalHours).toLocaleString("tr-TR", { maximumFractionDigits: 2 });

  $("fixedSum").textContent = tl(fixedSum);
  $("dailyBonusSum").textContent = tl(dailyBonusSum);
  $("kmSum").textContent = tl(kmSum);
  $("monthlyBonus").textContent = tl(mBonus);
  $("grand").textContent = tl(grand);

  // 1000 paket kutlama (ayda 1)
  const eggKey = `egg_1000_${monthStr}`;
  if (totalPk >= 1000 && !localStorage.getItem(eggKey)) {
    localStorage.setItem(eggKey, "shown");
    toastTop("🥤 Ooo 1000 paketi geçmişsin! Yarın sodalar senden 😄");
    confettiBurst(1500);
    if (navigator.vibrate) navigator.vibrate([120, 60, 140]);
  }
}

/* --------------------
   Wizard (Adım adım) + Saat + Paket + KM
-------------------- */
function wizardSetup() {
  const startBtn = $("startWizard");
  const wiz = $("wizard");
  const title = $("wizTitle");
  const progress = $("wizProgress");
  const status = $("wizStatus");
  const hours = $("wizHours");
  const pk = $("wizPk");
  const kmLabel = $("wizKmLabel");
  const kmSel = $("wizKm");
  const prev = $("wizPrev");
  const next = $("wizNext");
  const finish = $("wizFinish");
  const daysList = $("days");

  if (!startBtn || !wiz || !title || !progress || !status || !hours || !pk || !kmSel || !prev || !next || !finish) return;

  let idx = 0, dc = 0, y = 0, m = 0, monthStr = "";
  let daysArr = [];

  function loadMonth() {
    const parts = $("month").value.split("-");
    y = Number(parts[0]); m = Number(parts[1]);
    dc = daysInMonth(y, m);
    monthStr = $("month").value;
    daysArr = loadMonthState(monthStr, dc);
  }

  function applyEnabled() {
    const isWork = status.value === "work";
    hours.disabled = !isWork;
    pk.disabled = !isWork;
    if (!isWork) { hours.value = ""; pk.value = ""; }

    const kmOn = $("kmMode").value === "on";
    kmLabel.style.display = kmOn ? "block" : "none";
    kmSel.style.display = kmOn ? "block" : "none";
    kmSel.disabled = !(kmOn && isWork);
    if (!(kmOn && isWork)) kmSel.value = "0";
  }

  function saveCurrent() {
    if (!daysArr[idx]) daysArr[idx] = { t: "work", h: "", pk: "", km: "0" };
    daysArr[idx].t = status.value;

    if (status.value === "work") {
      daysArr[idx].h = hours.value;
      daysArr[idx].pk = pk.value;
      const kmOn = $("kmMode").value === "on";
      daysArr[idx].km = kmOn ? kmSel.value : "0";
    } else {
      daysArr[idx].h = "";
      daysArr[idx].pk = "";
      daysArr[idx].km = "0";
    }

    saveMonthState(monthStr, daysArr);
  }

  function render() {
    title.textContent = `Gün ${idx + 1}`;
    progress.textContent = `${idx + 1}/${dc}`;

    const d = daysArr[idx] ?? { t: "work", h: "", pk: "", km: "0" };
    status.value = d.t ?? "work";
    hours.value = d.h ?? "";
    pk.value = d.pk ?? "";
    kmSel.value = d.km ?? "0";

    applyEnabled();

    prev.disabled = idx === 0;
    const last = idx === dc - 1;
    next.style.display = last ? "none" : "block";
    finish.style.display = last ? "block" : "none";
  }

  function openWizard() {
    loadMonth();
    idx = 0;
    wiz.style.display = "block";
    if (daysList) daysList.style.display = "none";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeWizard() {
    wiz.style.display = "none";
    if (daysList) daysList.style.display = "flex";
  }

  startBtn.addEventListener("click", openWizard);

  status.addEventListener("change", applyEnabled);
  $("kmMode").addEventListener("change", applyEnabled);

  prev.addEventListener("click", () => { saveCurrent(); if (idx > 0) idx--; render(); });
  next.addEventListener("click", () => { saveCurrent(); if (idx < dc - 1) idx++; render(); });

  finish.addEventListener("click", () => {
    saveCurrent();
    calculate(() => loadMonthState(monthStr, dc), y, m);
    closeWizard();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* --------------------
   About modal + Easter eggs
-------------------- */
(function aboutModal(){
  const btn = document.getElementById("aboutBtn");
  const modal = document.getElementById("aboutModal");
  const close = document.getElementById("closeAbout");
  if (!btn || !modal || !close) return;
  btn.addEventListener("click", () => modal.style.display = "flex");
  close.addEventListener("click", () => modal.style.display = "none");
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
})();

(function easterEggTitleTap(){
  const title = document.getElementById("title");
  if (!title) return;

  let taps = 0;
  let timer = null;

  function toast(msg){
    const t = document.createElement("div");
    t.textContent = msg;
    t.addEventListener("click", () => t.remove());
    t.style.fontWeight = "800";
    t.style.fontSize = "16px";
    t.style.maxWidth = "90vw";
    t.style.textAlign = "center";
    t.style.position = "fixed";
    t.style.left = "50%";
    t.style.bottom = "24px";
    t.style.transform = "translateX(-50%)";
    t.style.padding = "12px 14px";
    t.style.borderRadius = "14px";
    t.style.background = "#0f172a";
    t.style.border = "1px solid #334155";
    t.style.color = "#e5e7eb";
    t.style.zIndex = "9999";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 6000);
  }

  title.addEventListener("click", () => {
    taps++;
    clearTimeout(timer);
    timer = setTimeout(() => taps = 0, 1800);
    if (taps === 7) {
      taps = 0;
      toast("🐬 yunusgpt modu: Saatlik sabit + bonus takibi açık 😄");
      document.body.style.filter = "hue-rotate(25deg)";
      setTimeout(() => (document.body.style.filter = ""), 1200);
    }
  });
})();

(function longPressOnCalc(){
  const btn = document.getElementById("calc");
  if (!btn) return;
  let pressTimer = null;

  btn.addEventListener("touchstart", () => {
    pressTimer = setTimeout(() => {
      const month = document.getElementById("month")?.value || "-";
      const pk = document.getElementById("totalPk")?.textContent || "0";
      const hours = document.getElementById("totalHours")?.textContent || "0";
      const grand = document.getElementById("grand")?.textContent || "-";
      alert(`🕵️ Gizli Özet\nAy: ${month}\nToplam Saat: ${hours}\nToplam Paket: ${pk}\nToplam Kazanç: ${grand}`);
    }, 650);
  }, { passive:true });

  btn.addEventListener("touchend", () => clearTimeout(pressTimer));
  btn.addEventListener("touchmove", () => clearTimeout(pressTimer));
})();

(function konami(){
  const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let i = 0;
  function toast(msg){
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.position = "fixed";
    t.style.left = "50%";
    t.style.top = "18px";
    t.style.transform = "translateX(-50%)";
    t.style.padding = "10px 12px";
    t.style.borderRadius = "14px";
    t.style.background = "#111827";
    t.style.border = "1px solid #334155";
    t.style.color = "#e5e7eb";
    t.style.zIndex = "9999";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }
  window.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === seq[i]) {
      i++;
      if (i === seq.length) {
        i = 0;
        toast("🎮 KONAMI! 'Bonus Avcısı' rozetini kazandın.");
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      }
    } else i = 0;
  });
})();

/* --------------------
   Init
-------------------- */
(function init(){
  // UI defaults
  if ($("hourlyRate")) $("hourlyRate").value = String(HOURLY_RATE);
  $("month").value = defaultMonth();

  // load monthHours from storage
  const monthStr = $("month").value;
  const savedHours = localStorage.getItem(hoursKey(monthStr));
  if (savedHours != null) $("monthHours").value = savedHours;

  $("month").addEventListener("change", () => {
    const ms = $("month").value;
    const sh = localStorage.getItem(hoursKey(ms));
    $("monthHours").value = sh ?? "";
  });

  $("monthHours").addEventListener("input", () => {
    const ms = $("month").value;
    localStorage.setItem(hoursKey(ms), $("monthHours").value);
  });

  let getDays = () => [];
  function refresh() {
    const [yStr, mStr] = $("month").value.split("-");
    const y = Number(yStr), m = Number(mStr);
    if (!y || !m) return;
    const ms = $("month").value;
    getDays = renderDays(ms, y, m);
  }

  $("kmMode").addEventListener("change", refresh);
  $("month").addEventListener("change", refresh);

  $("calc").addEventListener("click", () => {
    const [yStr, mStr] = $("month").value.split("-");
    calculate(getDays, Number(yStr), Number(mStr));
  });

  refresh();
  wizardSetup();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try { await navigator.serviceWorker.register("./sw.js"); } catch {}
    });
  }
})();
