// ========= State =========
const currentStats = {
  temp:  { hi: null, lo: null, sum: 0, count: 0 },
  humid: { hi: null, lo: null, sum: 0, count: 0 },
  light: { hi: null, lo: null, sum: 0, count: 0 }
};

// ========= Init from API =========
async function initTodayStats() {
  try {
    const res = await fetch("/api/sensors/today");
    const data = await res.json();
    if (!data || !data.stats) return;

    ["temp","humid","light"].forEach(type => {
      const s = data.stats[type];
      if (!s) return;

      currentStats[type].hi   = s.hi;
      currentStats[type].lo   = s.lo;
      currentStats[type].sum  = s.avg * data.rows.length; // phục hồi sum từ avg*count
      currentStats[type].count= data.rows.length;

      document.getElementById(`${type}-high`).innerText = `${s.hi.toFixed(1)}${unitFor(type)}`;
      document.getElementById(`${type}-low`).innerText  = `${s.lo.toFixed(1)}${unitFor(type)}`;
      document.getElementById(`${type}-avg`).innerText  = `${s.avg.toFixed(1)}${unitFor(type)}`;
    });
  } catch (err) {
    console.error("Init today stats failed", err);
  }
}

// ========= Realtime Update =========
function updateRealtimeStats(row) {
  const t = numberOrNull(row.temp);
  const h = numberOrNull(row.humid);
  const l = numberOrNull(row.light);

  if (t!=null) document.getElementById('temp').innerText  = `${t.toFixed(1)}°C`;
  if (h!=null) document.getElementById('humid').innerText = `${h.toFixed(1)}%`;
  if (l!=null) document.getElementById('light').innerText = `${l.toFixed(1)} lux`;

  updateOneStat("temp", t);
  updateOneStat("humid", h);
  updateOneStat("light", l);
}

function updateOneStat(type, val) {
  if (val==null) return;
  const unit = unitFor(type);
  const stat = currentStats[type];

  // high
  if (stat.hi==null || val > stat.hi) {
    stat.hi = val;
    document.getElementById(`${type}-high`).innerText = `${val.toFixed(1)}${unit}`;
  }
  // low
  if (stat.lo==null || val < stat.lo) {
    stat.lo = val;
    document.getElementById(`${type}-low`).innerText = `${val.toFixed(1)}${unit}`;
  }
  // average (tính cộng dồn)
  stat.sum += val;
  stat.count++;
  const avg = stat.sum / stat.count;
  document.getElementById(`${type}-avg`).innerText = `${avg.toFixed(1)}${unit}`;
}

function unitFor(type) {
  if (type==="temp") return "°C";
  if (type==="humid") return "%";
  if (type==="light") return " lux";
  return "";
}

// ========= Socket realtime =========
socket.on('sensors:new', (row) => {
  const isToday = isTodayLocal(row.measured_at || Date.now());
  if (!isToday) return;
  updateRealtimeStats(row);
});

// Helper
function isTodayLocal(dateLike) {
  const d = new Date(dateLike), now = new Date();
  return d.getFullYear()===now.getFullYear() &&
         d.getMonth()===now.getMonth() &&
         d.getDate()===now.getDate();
}

// ========= Init =========
initTodayStats();
