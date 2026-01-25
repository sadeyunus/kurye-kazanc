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

function defaultMonth() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function loadMonthState(monthStr, dayCount) {
  const raw = localStorage.getItem(stateKey(monthStr));
  if (!raw) {
    return Array.from({ length: dayCount }, () => ({ t: "work", pk: "", km: "0" })); // varsayılan: çalıştım
  }
  try {
    const arr = JSON.parse(raw);
    // Gün sayısı değişmişse (28/30/31) uzat/kısalt
    const out = Array.from({ length: dayCount }, (_, i) => arr[i] ?? ({ t: "work", pk: "", km: "0" }));
    return out;
  } catch {
    return Array.from({ length: dayCount }, () => ({ t: "work", pk: "", km: "0" }));
  }
}

function saveMonthState(monthStr, daysArr) {
  localStorage.setItem(stateKey(monthStr), JSON.stringify(daysArr));
}

function renderDays(monthStr, year, month1to12) {
  const dc = daysInMonth(year, month1to12);
  const container = $("days");
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
          <option value="unpaid">Çalışmadım (ücretsiz)</option>
        </select>
      </div>

      <div class="c2">
        <label style="margin:0 0 6px;">Paket sayısı</label>
        <input data-k="pk" inputmode="numeric" placeholder="örn: 42" />
      </div>

      <div class="c3" style="display:none;">
        <label style="margin:0 0 6px;">KM desteği</label>
        <select data-k="km">
          <option value="0">0</option>
          <option value="25">25</option>
          <option value="35">35</option>
        </select>
      </div>
    `;

    const tSel = row.querySelector('select[data-k="t"]');
    const pkInp = row.querySelector('input[data-k="pk"]');
    const kmWrap = row.querySelector(".c3");
    const kmSel = row.querySelector('select[data-k="km"]');

    // yükle
    tSel.value = d.t ?? "work";
    pkInp.value = d.pk ?? "";
    kmSel.value = d.km ?? "0";

    function applyEnabled() {
      const isWork = tSel.value === "work";
      pkInp.disabled = !isWork;
      if (!isWork) pkInp.value = ""; // izin/ücretsiz gün paketi sıfırla
      const kmOn = $("kmMode").value === "on";
      kmWrap.style.display = kmOn ? "block" : "none";
      kmSel.disabled = !(kmOn && isWork);
      if (!(kmOn && isWork)) kmSel.value = "0";
    }

    function persist() {
      daysArr[idx] = { t: tSel.value, pk: pkInp.value, km: kmSel.value };
      saveMonthState(monthStr, daysArr);
    }

    tSel.addEventListener("change", () => { applyEnabled(); persist(); });
    pkInp.addEventListener("input", () => { persist(); });
    kmSel.addEventListener("change", () => { persist(); });

    applyEnabled();
    container.appendChild(row);
  });

  // Hesapla butonu için gün verisini geri döndür
  return () => loadMonthState(monthStr, dc);
}

function calculate(getDays, year, month1to12) {
  clearError();

  const fixedMonthly = parseTrNumber($("fixedMonthly").value);
  if (!Number.isFinite(fixedMonthly) || fixedMonthly <= 0) {
    return showError("Aylık sabit ücret geçerli değil.");
  }

  const dc = daysInMonth(year, month1to12);
  const fixedDaily = fixedMonthly / dc;

  const daysArr = getDays();

  let workDays = 0, offDays = 0, unpaidDays = 0;
  let totalPk = 0;
  let fixedSum = 0;
  let dailyBonusSum = 0;
  let kmSum = 0;

  const kmOn = $("kmMode").value === "on";

  for (const d of daysArr) {
    if (d.t === "work") {
      workDays++;
      fixedSum += fixedDaily;

      const pk = parseTrNumber(d.pk);
      const pkInt = Number.isFinite(pk) ? Math.max(0, Math.floor(pk)) : 0;
      totalPk += pkInt;

      dailyBonusSum += dailyPackageBonus(pkInt);

      if (kmOn) {
        const km = parseTrNumber(d.km);
        kmSum += Number.isFinite(km) ? km : 0;
      }
    } else if (d.t === "off") {
      offDays++;
      fixedSum += fixedDaily; // izin günü sabit var
    } else {
      unpaidDays++;
      // hiçbir şey yok
    }
  }

  const mBonus = monthlyBonus(totalPk);
  const grand = fixedSum + dailyBonusSum + kmSum + mBonus;

  $("workDays").textContent = workDays;
  $("offDays").textContent = offDays;
  $("unpaidDays").textContent = unpaidDays;
  $("totalPk").textContent = totalPk;

  $("fixedSum").textContent = tl(fixedSum);
  $("dailyBonusSum").textContent = tl(dailyBonusSum);
  $("kmSum").textContent = tl(kmSum);
  $("monthlyBonus").textContent = tl(mBonus);
  $("grand").textContent = tl(grand);
}

// Başlat
(function init(){
  // defaults
  $("fixedMonthly").value = "55223";
  $("month").value = defaultMonth();

  let getDays = () => [];

  function refresh() {
    const [yStr, mStr] = $("month").value.split("-");
    const y = Number(yStr), m = Number(mStr);
    if (!y || !m) return;
    const monthStr = $("month").value;
    getDays = renderDays(monthStr, y, m);
  }

  $("month").addEventListener("change", refresh);
  $("kmMode").addEventListener("change", refresh);
  $("calc").addEventListener("click", () => {
    const [yStr, mStr] = $("month").value.split("-");
    calculate(getDays, Number(yStr), Number(mStr));
  });

  refresh();

  // SW
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try { await navigator.serviceWorker.register("./sw.js"); } catch {}
    });
  }
})();
