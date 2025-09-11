
(() => {
  /* =========================
   *  Core namespace
   * =========================*/
  const App = {};
  window.App = App; // expose global

  /* -------------------------
   *  Utils
   * -------------------------*/
  App.Utils = {
    clamp(v, min, max){ return Math.min(Math.max(v, min), max); },
    fmtUsage(sec){
      sec = Number(sec||0);
      const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60;
      if(h>0) return `${h}h ${m}m`;
      if(m>0) return `${m}m${s?` ${s}s`:''}`;
      return `${s}s`;
    },
    fmtTime(d){
      const dt = new Date(d);
      const pad = n => n.toString().padStart(2,'0');
      return `${pad(dt.getDate())}/${pad(dt.getMonth()+1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
    },
    isTodayLocal(dateLike){
      const d=new Date(dateLike), now=new Date();
      return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate();
    },
    numberOrNull(v){ const n=Number(v); return isNaN(n)?null:n; },
    qs(sel, root=document){ return root.querySelector(sel); },
    qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); },
  };

  /* -------------------------
   *  Network helpers
   * -------------------------*/
  App.API = {
    async getJSON(url){
      const r = await fetch(url);
      if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json();
    },
    async postJSON(url, body){
      const r = await fetch(url, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body||{})
      });
      if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json().catch(()=> ({}));
    }
  };

  /* -------------------------
   *  Socket singleton
   * -------------------------*/
  let _socket = null;
  App.Realtime = {
    socket(){
      if(!_socket){
        // requires <script src="/socket.io/socket.io.js"></script> on page
        _socket = io();
      }
      return _socket;
    }
  };

  /* -------------------------
   *  Pagination (table)
   * -------------------------*/
  App.Pager = {
    createTablePager({
      tbodyId,
      paginationId,
      prevId,
      nextId,
      pageInfoId,
      rowsPerPage = 10
    }){
      const { clamp } = App.Utils;

      const tbody = document.getElementById(tbodyId);
      const pagination = document.getElementById(paginationId);
      const prevBtn = document.getElementById(prevId);
      const nextBtn = document.getElementById(nextId);
      const pageInfo = document.getElementById(pageInfoId);

      if (!tbody || !pagination || !prevBtn || !nextBtn || !pageInfo) {
        console.warn('[Pager] Missing required element(s).');
        return null;
      }

      let rows = Array.from(tbody.querySelectorAll('tr'));
      let currentPage = 1;

      function buildPageList(curr, total){
        if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);
        const list = [1];
        if (curr > 3) list.push('...');
        const start = Math.max(2, curr - 1);
        const end   = Math.min(total - 1, curr + 1);
        for (let i=start;i<=end;i++) list.push(i);
        if (curr < total - 2) list.push('...');
        list.push(total);
        return list;
      }

      function drawPagination(pageCount){
        pagination.innerHTML = '';
        const pages = buildPageList(currentPage, pageCount);
        pages.forEach(p => {
          if (p === '...'){
            const span = document.createElement('span');
            span.textContent = '…';
            span.className = 'dots';
            pagination.appendChild(span);
          } else {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = p;
            if (p === currentPage) btn.classList.add('active');
            btn.addEventListener('click', () => renderPage(p));
            pagination.appendChild(btn);
          }
        });
      }

      function renderPage(page){
        rows = Array.from(tbody.querySelectorAll('tr'));
        const totalRows = rows.length;
        const pageCount = Math.max(1, Math.ceil(totalRows / rowsPerPage));
        currentPage = clamp(page, 1, pageCount);
        const start = (currentPage - 1) * rowsPerPage;
        const end = Math.min(start + rowsPerPage, totalRows);

        rows.forEach((tr, i) => {
          tr.style.display = (i >= start && i < end) ? '' : 'none';
        });

        drawPagination(pageCount);
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === pageCount;
        pageInfo.textContent = totalRows ? `Hiển thị ${start + 1}–${end} / ${totalRows}` : 'Không có dữ liệu';
      }

      prevBtn.addEventListener('click', () => renderPage(currentPage - 1));
      nextBtn.addEventListener('click', () => renderPage(currentPage + 1));

      const api = {
        refresh(){ renderPage(1); },
        goTo(p){ renderPage(Number(p) || 1); },
        setRowsPerPage(n){
          rowsPerPage = Math.max(1, Number(n) || rowsPerPage);
          renderPage(1);
        },
        get currentPage(){ return currentPage; },
        get totalRows(){ return tbody.querySelectorAll('tr').length; }
      };

      renderPage(1);
      return api;
    }
  };

  /* -------------------------
   *  Charts (Chart.js)
   * -------------------------*/
  App.Charts = {
    createLineChart(ctx){
      // requires Chart + time scale adapters loaded in page
      return new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            { label:'Temperature (°C)', data:[], yAxisID:'y',  borderColor:'#ef4444', backgroundColor:'#ef4444', tension:0.3, pointRadius:0 },
            { label:'Humidity (%)',     data:[], yAxisID:'y',  borderColor:'#3b82f6', backgroundColor:'#3b82f6', tension:0.3, pointRadius:0 },
            { label:'Illuminance (lux)',data:[], yAxisID:'y1', borderColor:'#f59e0b', backgroundColor:'#f59e0b', tension:0.3, pointRadius:0 }
          ]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          interaction:{ mode:'nearest', intersect:false },
          scales:{
            x:{ type:'time', time:{ unit:'minute' }, ticks:{ maxRotation:0 } },
            y:{ position:'left', title:{ display:true, text:'Temp / Hum' }, min:0, max:100, grid:{ drawOnChartArea:true } },
            y1:{ position:'right', title:{ display:true, text:'Lux' }, min:0, grid:{ drawOnChartArea:false } }
          },
          plugins:{
            legend:{ display:true },
            tooltip:{ callbacks:{ label:(ctx)=>{
              const label=ctx.dataset.label||'', v=ctx.parsed.y;
              if(label.includes('Temperature')) return `${label}: ${v.toFixed(1)} °C`;
              if(label.includes('Humidity'))    return `${label}: ${v.toFixed(0)} %`;
              if(label.includes('Illuminance')) return `${label}: ${v.toFixed(0)} lux`;
              return `${label}: ${v}`;
            }}}
          }
        }
      });
    },
    addPoint(lineChart, tsISOorMs, temp, hum, lux, keep=300){
      const ts = typeof tsISOorMs==='string' ? new Date(tsISOorMs).getTime() : tsISOorMs;
      if(!isNaN(temp)) lineChart.data.datasets[0].data.push({x:ts,y:Number(temp)});
      if(!isNaN(hum))  lineChart.data.datasets[1].data.push({x:ts,y:Number(hum)});
      if(!isNaN(lux))  lineChart.data.datasets[2].data.push({x:ts,y:Number(lux)});
      lineChart.data.datasets.forEach(ds=>{ while(ds.data.length>keep) ds.data.shift(); });
      lineChart.update('none');
    }
  };

  /* -------------------------
   *  Devices helpers
   * -------------------------*/
  App.Devices = {
    // Map chung dùng cả index/devices
    DEVICE_MAP: {
      light: { id: 1, label: 'Light Bulb' },
      fan:   { id: 2, label: 'Fan' },
      ac:    { id: 3, label: 'Air Conditioner' }
    },
    setDeviceStatus(key, status){
      const el = document.getElementById(`status-${key}`);
      if(!el) return;
      el.innerText = status;
      el.classList.remove('on','off');
      el.classList.add(status==='ON'?'on':'off');
    },
    getToggleInput(key){
      return document.querySelector(`input[type="checkbox"][onchange*="toggleDevice('${key}'"]`);
    },
    async toggleById(id, status){
      return App.API.postJSON('/api/devices/toggle', { id, status });
    },
    // Devices page cards
    findCardByTitle(title){
      return App.Utils.qsa('.card').find(card=>{
        const h3 = card.querySelector('.devicepage-info h3');
        return h3 && h3.textContent.trim()===title;
      });
    },
    setCardState(title, {status, usage_seconds_today}){
      const card = App.Devices.findCardByTitle(title);
      if(!card) return;
      const { fmtUsage } = App.Utils;

      const badge = card.querySelector('.devicepage-status');
      if (badge){
        badge.textContent = status;
        badge.classList.remove('on-status','off-status');
        badge.classList.add(status==='ON'?'on-status':'off-status');
      }
      const usageEl = card.querySelector('.data .data-value');
      if (usageEl) usageEl.textContent = fmtUsage(usage_seconds_today);
      const chk = card.querySelector('.toggle-switch input[type="checkbox"]');
      if (chk) chk.checked = (status==='ON');
    },
    wireCardToggles(){
      const mapTitleToId = { 'Light Bulb':1, 'Fan':2, 'Air Conditioner':3 };
      App.Utils.qsa('.card').forEach(card=>{
        const titleEl = card.querySelector('.devicepage-info h3');
        const chk = card.querySelector('.toggle-switch input[type="checkbox"]');
        if(!titleEl || !chk) return;
        const title = titleEl.textContent.trim();
        const id = mapTitleToId[title];
        if(!id) return;

        chk.addEventListener('change', async (e)=>{
          const status = e.target.checked?'ON':'OFF';
          try{
            await App.Devices.toggleById(id, status);
            App.Devices.setCardState(title, {status});
          }catch(err){
            console.error(err);
            e.target.checked = !e.target.checked;
            alert('Toggle thất bại');
          }
        });
      });
    }
  };

  /* -------------------------
   *  Sensors helpers (cards & stats)
   * -------------------------*/
  App.Sensors = {
    updateTopCards(row){
      if(!row) return;
      const t=Number(row.temp), h=Number(row.humid), l=Number(row.light);
      if(!isNaN(t)) document.getElementById('temp')?.innerText  = `${t.toFixed(1)}°C`;
      if(!isNaN(h)) document.getElementById('humid')?.innerText = `${h.toFixed(1)}%`;
      if(!isNaN(l)) document.getElementById('light')?.innerText = `${l.toFixed(1)} lux`;
    },
    renderCurrentCards(latestRow){
      if(!latestRow) return;
      const { numberOrNull } = App.Utils;
      const t = numberOrNull(latestRow.temp);
      const h = numberOrNull(latestRow.humid);
      const l = numberOrNull(latestRow.light);
      if (t!=null) document.getElementById('temp-current')?.innerText  = `${t.toFixed(1)}°C`;
      if (h!=null) document.getElementById('humid-current')?.innerText = `${h.toFixed(1)}%`;
      if (l!=null) document.getElementById('light-current')?.innerText = `${l.toFixed(1)} lux`;
    },
    computeTodayHiLoAvg(rows){
      const { isTodayLocal, numberOrNull } = App.Utils;
      const today = rows.filter(r => isTodayLocal(r.measured_at||r.createdAt));
      function stats(getter){
        const vals = today.map(getter).map(numberOrNull).filter(v=>v!=null);
        if(!vals.length) return {hi:null, lo:null, avg:null};
        return { hi:Math.max(...vals), lo:Math.min(...vals), avg: vals.reduce((a,b)=>a+b,0)/vals.length };
      }
      return {
        temp:  stats(r=>r.temp),
        humid: stats(r=>r.humid),
        light: stats(r=>r.light)
      };
    },
    applyStatsToDOM(st){
      const set = (id, val, suffix='') => {
        const el = document.getElementById(id);
        if(!el) return;
        el.innerText = (val==null) ? '--' : `${suffix?val.toFixed(0):val.toFixed(1)}${suffix}`;
      };
      set('temp-high', st.temp.hi, '°C');
      set('temp-low',  st.temp.lo, '°C');
      set('temp-avg',  st.temp.avg, '°C');

      const set0 = (id, val, suffix) => {
        const el=document.getElementById(id);
        if(!el) return;
        el.innerText = (val==null) ? '--' : `${val.toFixed(0)} ${suffix}`;
      };
      set0('humid-high', st.humid.hi, '%');
      set0('humid-low',  st.humid.lo, '%');
      set0('humid-avg',  st.humid.avg, '%');
      set0('light-high', st.light.hi, 'lux');
      set0('light-low',  st.light.lo, 'lux');
      set0('light-avg',  st.light.avg, 'lux');
    },
    renderTable(tbodyId, rows){
      const { fmtTime } = App.Utils;
      const tbody = document.getElementById(tbodyId);
      if(!tbody) return;
      tbody.innerHTML = rows.map(r=>`
        <tr>
          <td>${fmtTime(r.measured_at || r.createdAt || Date.now())}</td>
          <td>${Number(r.temp).toFixed(1)}</td>
          <td>${Number(r.humid).toFixed(1)}</td>
          <td>${Number(r.light).toFixed(1)}</td>
        </tr>
      `).join('');
    }
  };

  /* =========================
   *  Page initializers
   * =========================*/

  // ---- index.html ----
  App.initIndexPage = async function(){
    const sock = App.Realtime.socket();
    const { updateTopCards } = App.Sensors;
    const { addPoint, createLineChart } = App.Charts;
    const { setDeviceStatus, getToggleInput, DEVICE_MAP } = App.Devices;

    // Chart
    const ctx = document.getElementById('chartLine')?.getContext('2d');
    const lineChart = ctx ? createLineChart(ctx) : null;

    // Snapshot sensors
    try{
      const latest = await App.API.getJSON('/api/sensors/latest');
      if(latest && latest.temp!=null) updateTopCards(latest);
    }catch(e){ console.warn('load latest sensors failed', e); }

    // History for chart
    try{
      if(lineChart){
        let history = await App.API.getJSON('/api/sensors?limit=200');
        history.sort((a,b)=> new Date(a.measured_at) - new Date(b.measured_at));
        history.forEach(r=> addPoint(lineChart, r.measured_at, r.temp, r.humid, r.light));
      }
    }catch(e){ console.warn('load history failed', e); }

    // Devices for 3 switches
    try{
      const devices = await App.API.getJSON('/api/devices');
      const byId = {}; devices.forEach(d=> byId[d.id]=d);
      Object.entries(DEVICE_MAP).forEach(([key,{id}])=>{
        const dev = byId[id]; if(!dev) return;
        setDeviceStatus(key, dev.status);
        const input = getToggleInput(key);
        if(input) input.checked = dev.status==='ON';
      });
    }catch(e){ console.warn('load devices failed', e); }

    // Realtime
    sock.on('sensors:new', row=>{
      updateTopCards(row);
      if(lineChart) addPoint(lineChart, row.measured_at || Date.now(), row.temp, row.humid, row.light);
    });
    sock.on('devices:update', payload=>{
      const entry = Object.entries(DEVICE_MAP).find(([_,v])=> v.id===payload.id);
      if(!entry) return;
      const [key] = entry;
      App.Devices.setDeviceStatus(key, payload.status);
      const input = App.Devices.getToggleInput(key);
      if(input) input.checked = payload.status==='ON';
    });

    // Toggle handler (reusable)
    window.toggleDevice = async function(key, checkboxEl){
      const meta = App.Devices.DEVICE_MAP[key]; if(!meta) return;
      const status = checkboxEl.checked ? 'ON' : 'OFF';
      try{
        await App.Devices.toggleById(meta.id, status);
        App.Devices.setDeviceStatus(key, status); // optimistic; ACK sẽ đồng bộ lại
      }catch(e){
        console.error('toggle failed', e);
        checkboxEl.checked = !checkboxEl.checked;
        alert('Toggle thất bại!');
      }
    };
  };

  // ---- sensordata.html ----
  App.initSensorDataPage = async function(){
    const sock = App.Realtime.socket();
    const { numberOrNull, isTodayLocal } = App.Utils;
    const { renderCurrentCards, computeTodayHiLoAvg, applyStatsToDOM, renderTable } = App.Sensors;

    let allRows = [];
    let filteredRows = [];
    const tbodyId = 'sensorDataTable';

    // Pager instance (khởi tạo sau khi DOM sẵn sàng)
    const pager = App.Pager.createTablePager({
      tbodyId,
      paginationId:'pagination',
      prevId:'prevPage',
      nextId:'nextPage',
      pageInfoId:'pageInfo',
      rowsPerPage:10
    });

    // Load once
    try{
      let rows = await App.API.getJSON('/api/sensors?limit=5000');
      rows.sort((a,b)=> new Date(b.measured_at||b.createdAt) - new Date(a.measured_at||a.createdAt));
      allRows = rows;

      renderCurrentCards(allRows[0]);
      applyStatsToDOM(computeTodayHiLoAvg(allRows));

      filteredRows = [...allRows];
      renderTable(tbodyId, filteredRows);
      pager?.refresh?.();
    }catch(e){ console.warn('Load sensors failed', e); }

    // Search & filters
    function applyFilters(){
      const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
      const kind = document.getElementById('dataTypeSelect').value; // all | temperature | humidity | light | time

      filteredRows = allRows.filter(r=>{
        const tStr = Number(r.temp).toFixed(1);
        const hStr = Number(r.humid).toFixed(1);
        const lStr = Number(r.light).toFixed(1);
        const timeStr = App.Utils.fmtTime(r.measured_at || r.createdAt).toLowerCase();

        let haystack = '';
        if (kind==='temperature')      haystack = tStr;
        else if (kind==='humidity')    haystack = hStr;
        else if (kind==='light')       haystack = lStr;
        else if (kind==='time')        haystack = timeStr;
        else                           haystack = `${tStr} ${hStr} ${lStr} ${timeStr}`;

        return haystack.includes(q);
      });

      renderTable(tbodyId, filteredRows);
      pager?.refresh?.();
    }

    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    document.getElementById('dataTypeSelect')?.addEventListener('change', applyFilters);
    document.getElementById('pageSizeSelect')?.addEventListener('change', (e)=>{
      pager?.setRowsPerPage?.(Number(e.target.value||10));
    });

    // Realtime: chỉ cập nhật CURRENT & HIGH/LOW nếu thuộc hôm nay (không đụng bảng/avg)
    const currentStats = { temp:{hi:null,lo:null}, humid:{hi:null,lo:null}, light:{hi:null,lo:null} };
    // seed hi/lo từ tính toán ban đầu
    (function seedHiLo(){
      const st = App.Sensors.computeTodayHiLoAvg(allRows);
      currentStats.temp = {hi:st.temp.hi, lo:st.temp.lo};
      currentStats.humid= {hi:st.humid.hi,lo:st.humid.lo};
      currentStats.light= {hi:st.light.hi,lo:st.light.lo};
    })();

    sock.on('sensors:new', row=>{
      const isToday = isTodayLocal(row.measured_at || Date.now());
      // current cards
      const t = numberOrNull(row.temp);
      const h = numberOrNull(row.humid);
      const l = numberOrNull(row.light);
      if (t!=null) document.getElementById('temp-current')?.innerText  = `${t.toFixed(1)}°C`;
      if (h!=null) document.getElementById('humid-current')?.innerText = `${h.toFixed(1)}%`;
      if (l!=null) document.getElementById('light-current')?.innerText = `${l.toFixed(1)} lux`;

      if (!isToday) return;
      // hi/lo realtime
      if (t!=null){
        if (currentStats.temp.hi==null || t>currentStats.temp.hi){ currentStats.temp.hi=t; document.getElementById('temp-high')?.innerText=`${t.toFixed(1)}°C`; }
        if (currentStats.temp.lo==null || t<currentStats.temp.lo){ currentStats.temp.lo=t; document.getElementById('temp-low') ?.innerText=`${t.toFixed(1)}°C`; }
      }
      if (h!=null){
        if (currentStats.humid.hi==null || h>currentStats.humid.hi){ currentStats.humid.hi=h; document.getElementById('humid-high')?.innerText=`${h.toFixed(0)}%`; }
        if (currentStats.humid.lo==null || h<currentStats.humid.lo){ currentStats.humid.lo=h; document.getElementById('humid-low') ?.innerText=`${h.toFixed(0)}%`; }
      }
      if (l!=null){
        if (currentStats.light.hi==null || l>currentStats.light.hi){ currentStats.light.hi=l; document.getElementById('light-high')?.innerText=`${l.toFixed(0)} lux`; }
        if (currentStats.light.lo==null || l<currentStats.light.lo){ currentStats.light.lo=l; document.getElementById('light-low') ?.innerText=`${l.toFixed(0)} lux`; }
      }
    });
  };

  // ---- devices.html ----
  App.initDevicesPage = async function(){
    const sock = App.Realtime.socket();
    const { setCardState, wireCardToggles } = App.Devices;

    // Pager for history table
    const pager = App.Pager.createTablePager({
      tbodyId:'ActionHistoryTable',
      paginationId:'pagination',
      prevId:'prevPage',
      nextId:'nextPage',
      pageInfoId:'pageInfo',
      rowsPerPage:10
    });

    // Load devices & bind toggles
    try{
      const devices = await App.API.getJSON('/api/devices');
      const byId = {}; devices.forEach(d=> byId[d.id]=d);
      const mapTitleToId = { 'Light Bulb':1, 'Fan':2, 'Air Conditioner':3 };

      Object.keys(mapTitleToId).forEach(title=>{
        const d = byId[ mapTitleToId[title] ];
        if(!d) return;
        setCardState(title, d);
      });
      wireCardToggles();
    }catch(e){ console.warn('loadDevices failed', e); }

    // Realtime ACK
    sock.on('devices:update', payload=>{
      const idToTitle = {1:'Light Bulb', 2:'Fan', 3:'Air Conditioner'};
      const title = idToTitle[payload.id];
      if(!title) return;
      setCardState(title, payload);
    });

    // --- History table search/filter/page size (client-side) ---
    const historyTbody = document.getElementById('ActionHistoryTable');
    let historyRowsData = [];

    function snapshotHistoryTable(){
      historyRowsData = App.Utils.qsa('tr', historyTbody).map(tr=>{
        const tds = tr.querySelectorAll('td');
        return {
          time:     (tds[0]?.innerText || '').trim(),
          device:   (tds[1]?.innerText || '').trim(),
          status:   (tds[2]?.innerText || '').trim(),
          actionBy: (tds[3]?.innerText || '').trim(),
          html:     tr.outerHTML
        };
      });
    }
    function normalizeKind(v){
      // phòng khi HTML cũ dùng sai value
      if (v === 'temperature') return 'time';
      if (v === 'humidity')    return 'device';
      if (v === 'light')       return 'status';
      return v; // all | time | device | status | actionby
    }
    function filterTable(){
      const qRaw  = document.getElementById('searchInput').value || '';
      const kind0 = document.getElementById('dataTypeSelect').value;
      const q = qRaw.trim().toLowerCase();

      const select = document.getElementById('dataTypeSelect');
      const selectedText = select.options[select.selectedIndex].textContent.trim().toLowerCase();

      let kind = normalizeKind(kind0);
      if (selectedText === 'action by') kind = 'actionby';

      const matches = historyRowsData.filter(row=>{
        let haystack = '';
        if (kind==='time')      haystack = row.time;
        else if (kind==='device')   haystack = row.device;
        else if (kind==='status')   haystack = row.status;
        else if (kind==='actionby') haystack = row.actionBy;
        else                        haystack = `${row.time} ${row.device} ${row.status} ${row.actionBy}`;
        return haystack.toLowerCase().includes(q);
      });

      historyTbody.innerHTML = matches.map(r=>r.html).join('');
      pager?.refresh?.();
    }
    function changePageSize(){
      const n = Number(document.getElementById('pageSizeSelect').value || 10);
      pager?.setRowsPerPage?.(n);
    }

    snapshotHistoryTable();
    document.getElementById('searchInput')?.addEventListener('input', filterTable);
    document.getElementById('dataTypeSelect')?.addEventListener('change', filterTable);
    document.getElementById('pageSizeSelect')?.addEventListener('change', changePageSize);
  };

})();

