// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabs = document.querySelectorAll('.tab');
const tradeForm = document.getElementById('tradeForm');
const screenshotInput = document.getElementById('screenshotInput');
const previewImage = document.getElementById('previewImage');
const imagePreview = document.getElementById('imagePreview');
const directionToggle = document.getElementById('directionToggle');
const setupTag = document.getElementById('setupTag');
const customTag = document.getElementById('customTag');
const mentalSlider = document.getElementById('mentalSlider');
const mentalValue = document.getElementById('mentalValue');
const quickAddBtn = document.getElementById('quickAddBtn');
const gridViewBtn = document.getElementById('gridViewBtn');
const tableViewBtn = document.getElementById('tableViewBtn');

// Load Charts
let strategyRadar, timeHeatmap, equityCurve, mentalScatter, calendarHeatmap;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTrades();
  renderDashboard();
  renderHistory();
  setupEventListeners();
});

// Tab Navigation
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabs.forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');

    if (btn.dataset.tab === 'analyses') {
      renderAnalyses();
    }
  });
});

// Quick Add
quickAddBtn.addEventListener('click', () => {
  tabBtns.forEach(b => b.classList.remove('active'));
  tabs.forEach(t => t.classList.remove('active'));
  document.querySelector('[data-tab="add"]').classList.add('active');
  document.querySelector('[data-tab="add"]').scrollIntoView();
});

// Form Preview
screenshotInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      previewImage.src = ev.target.result;
      imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(e.target.files[0]);
  }
});

// Direction Toggle
directionToggle.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    directionToggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
  }
});

// Custom Tag
setupTag.addEventListener('change', () => {
  if (setupTag.value === 'Custom') {
    customTag.style.display = 'block';
    customTag.focus();
  } else {
    customTag.style.display = 'none';
  }
});

// Mental Slider
mentalSlider.addEventListener('click', (e) => {
  if (e.target.tagName === 'SPAN') {
    mentalSlider.querySelectorAll('span').forEach(s => s.classList.remove('selected'));
    e.target.classList.add('selected');
    mentalValue.value = e.target.dataset.val;
  }
});

// Submit Form
tradeForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const selectedDirection = directionToggle.querySelector('.active').dataset.dir;
  const entry = parseFloat(document.getElementById('entryPrice').value);
  const exit = parseFloat(document.getElementById('exitPrice').value);
  const tag = setupTag.value === 'Custom' ? customTag.value : setupTag.value;
  const mental = parseInt(mentalValue.value);
  const lesson = document.getElementById('lesson').value;
  const screenshot = previewImage.src;

  const pl = (exit - entry) * 2; // MNQ = $2 per point
  const rr = Math.abs((exit - entry) / (entry - (selectedDirection === 'long' ? entry - 10 : entry + 10))); // mock R:R
  const duration = Math.floor(Math.random() * 15) + 3; // mock 3-18 min

  const trade = {
    id: Date.now(),
    date: getCurrentDate(),
    direction: selectedDirection,
    entry,
    exit,
    pl,
    rr: rr.toFixed(1),
    duration: `${duration} min`,
    mental: ['😠', '🙁', '😐', '🙂', '😊'][mental - 1],
    tag,
    lesson,
    screenshot
  };

  saveTrade(trade);
  alert('✅ Trade saved!');
  tradeForm.reset();
  imagePreview.style.display = 'none';
  setupTag.selectedIndex = 0;
  customTag.style.display = 'none';
  mentalSlider.querySelectorAll('span').forEach((s, i) => {
    s.classList.toggle('selected', i === 2); // default to 😐
  });
  mentalValue.value = 3;

  // Go to dashboard
  tabBtns.forEach(b => b.classList.remove('active'));
  tabs.forEach(t => t.classList.remove('active'));
  document.querySelector('[data-tab="dashboard"]').classList.add('active');
  document.querySelector('[data-tab="dashboard"]').scrollIntoView();
});

// Toggle History Views
gridViewBtn.addEventListener('click', () => {
  gridViewBtn.classList.add('active');
  tableViewBtn.classList.remove('active');
  document.getElementById('tradeGrid').style.display = 'grid';
  document.getElementById('tradeTable').style.display = 'none';
});

tableViewBtn.addEventListener('click', () => {
  tableViewBtn.classList.add('active');
  gridViewBtn.classList.remove('active');
  document.getElementById('tradeGrid').style.display = 'none';
  document.getElementById('tradeTable').style.display = 'table';
});

// Export Excel
document.getElementById('exportExcel').addEventListener('click', exportToExcel);

// --- DATA FUNCTIONS ---

function getCurrentDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function loadTrades() {
  window.trades = JSON.parse(localStorage.getItem('mnqTrades')) || [];
}

function saveTrade(trade) {
  window.trades.push(trade);
  localStorage.setItem('mnqTrades', JSON.stringify(window.trades));
}

// --- RENDER FUNCTIONS ---

function renderDashboard() {
  const today = window.trades.find(t => t.date === getCurrentDate());
  const noTrade = document.getElementById('noTradeToday');
  const tradeVisual = document.getElementById('tradeVisual');

  if (today) {
    noTrade.style.display = 'none';
    tradeVisual.style.display = 'block';

    document.getElementById('tradeBadge').innerText = `${today.pl >= 0 ? '✅' : '❌'} $${today.pl}`;
    document.getElementById('tradeBadge').style.color = today.pl >= 0 ? '#27ae60' : '#e74c3c';
    document.getElementById('tradeChart').src = today.screenshot;
    document.getElementById('tradeTag').innerText = today.tag;
    document.getElementById('tradeDirection').innerText = today.direction;
    document.getElementById('tradeEntry').innerText = today.entry;
    document.getElementById('tradeExit').innerText = today.exit;
    document.getElementById('tradePL').innerText = `$${today.pl}`;
    document.getElementById('tradeRR').innerText = today.rr;
    document.getElementById('tradeDuration').innerText = today.duration;
    document.getElementById('tradeMental').innerText = today.mental;

    // Streak (simple last 3)
    const last3 = window.trades.slice(-3);
    const winStreak = last3.every(t => t.pl >= 0) ? last3.length : 0;
    document.getElementById('streakIndicator').innerText = winStreak > 0 ? '🔥'.repeat(winStreak) + ` ${winStreak} Wins in a Row` : '—';

    renderCalendarHeatmap();
  } else {
    noTrade.style.display = 'block';
    tradeVisual.style.display = 'none';
  }
}

function renderHistory() {
  const grid = document.getElementById('tradeGrid');
  const tableBody = document.querySelector('#tradeTable tbody');

  grid.innerHTML = '';
  tableBody.innerHTML = '';

  window.trades.slice().reverse().forEach(trade => {
    // Grid Card
    const card = document.createElement('div');
    card.className = 'trade-card';
    card.innerHTML = `
      <div class="date">${formatDate(trade.date)}</div>
      <div class="pl-badge ${trade.pl >= 0 ? 'green' : 'red'}">${trade.pl >= 0 ? '+' : ''}$${trade.pl}</div>
      <img class="thumb" src="${trade.screenshot}" />
      <div class="tag">${trade.tag}</div>
      <div class="mental">${trade.mental}</div>
    `;
    grid.appendChild(card);

    // Table Row
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(trade.date)}</td>
      <td>${trade.pl >= 0 ? '+' : ''}$${trade.pl}</td>
      <td>${trade.tag}</td>
      <td>${trade.rr}</td>
      <td>${trade.duration}</td>
      <td>${trade.mental}</td>
    `;
    tableBody.appendChild(row);
  });
}

function renderCalendarHeatmap() {
  const ctx = document.getElementById('calendarHeatmap').getContext('2d');
  if (calendarHeatmap) calendarHeatmap.destroy();

  const thisMonthTrades = window.trades.filter(t => t.date.startsWith(getCurrentMonth()));
  const days = 31;
  const data = Array(days).fill(0);
  const colors = Array(days).fill('#333');

  thisMonthTrades.forEach(trade => {
    const day = parseInt(trade.date.split('-')[2]) - 1;
    data[day] = trade.pl;
    colors[day] = trade.pl >= 0 ? '#27ae60' : '#e74c3c';
  });

  calendarHeatmap = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Array.from({length: days}, (_, i) => i + 1),
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `$${ctx.raw}`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, title: { display: true, text: 'Day of Month' } },
        y: { display: false }
      }
    }
  });
}

function renderAnalyses() {
  renderStrategyRadar();
  renderTimeHeatmap();
  renderEquityCurve();
  renderMentalScatter();
}

function renderStrategyRadar() {
  const ctx = document.getElementById('strategyRadar').getContext('2d');
  if (strategyRadar) strategyRadar.destroy();

  const tags = ['VWAP Bounce', 'Liquidity Grab', 'Gap Fill', 'Breakout Retest'];
  const winRates = [];
  const avgPLs = [];

  tags.forEach(tag => {
    const tradesWithTag = window.trades.filter(t => t.tag === tag);
    if (tradesWithTag.length === 0) {
      winRates.push(0);
      avgPLs.push(0);
    } else {
      const wins = tradesWithTag.filter(t => t.pl >= 0).length;
      winRates.push((wins / tradesWithTag.length) * 100);
      const totalPL = tradesWithTag.reduce((sum, t) => sum + t.pl, 0);
      avgPLs.push(totalPL / tradesWithTag.length);
    }
  });

  strategyRadar = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: tags,
      datasets: [
        {
          label: 'Win Rate %',
          data: winRates,
          backgroundColor: 'rgba(40, 167, 69, 0.2)',
          borderColor: '#28a745',
          pointBackgroundColor: '#28a745'
        },
        {
          label: 'Avg P/L',
          data: avgPLs.map(pl => Math.abs(pl)),
          backgroundColor: 'rgba(0, 184, 148, 0.2)',
          borderColor: '#00b894',
          pointBackgroundColor: '#00b894'
        }
      ]
    },
    options: {
      responsive: true,
      scales: { r: { beginAtZero: true } }
    }
  });
}

function renderTimeHeatmap() {
  const ctx = document.getElementById('timeHeatmap').getContext('2d');
  if (timeHeatmap) timeHeatmap.destroy();

  // Mock: 7AM-4PM in 30min blocks = 18 blocks
  const labels = ['7:00', '7:30', '8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'];
  const data = Array(18).fill(0);

  // Distribute trades randomly for demo
  window.trades.slice(-9).forEach((t, i) => {
    const slot = Math.min(Math.floor(i / 2), 17);
    data[slot] += t.pl;
  });

  timeHeatmap = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: data.map(v => v >= 0 ? '#27ae60' : '#e74c3c')
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { display: false }
      }
    }
  });
}

function renderEquityCurve() {
  const ctx = document.getElementById('equityCurve').getContext('2d');
  if (equityCurve) equityCurve.destroy();

  const last30 = window.trades.slice(-30);
  const labels = last30.map(t => formatDate(t.date));
  const data = [];
  let cumulative = 0;
  last30.forEach(t => {
    cumulative += t.pl;
    data.push(cumulative);
  });

  equityCurve = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Cumulative P/L',
        data,
        borderColor: '#00b894',
        backgroundColor: 'rgba(0, 184, 148, 0.1)',
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { grid: { color: '#333' } }
      }
    }
  });
}

function renderMentalScatter() {
  const ctx = document.getElementById('mentalScatter').getContext('2d');
  if (mentalScatter) mentalScatter.destroy();

  const mentalMap = { '😠': 1, '🙁': 2, '😐': 3, '🙂': 4, '😊': 5 };
  const data = window.trades.map(t => ({
    x: mentalMap[t.mental],
    y: t.pl
  }));

  mentalScatter = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Mental vs P/L',
        data,
        backgroundColor: '#00b894',
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Focus Level (1-5)' },
          min: 0.5,
          max: 5.5,
          ticks: { stepSize: 1 }
        },
        y: {
          title: { display: true, text: 'P/L ($)' }
        }
      }
    }
  });
}

function exportToExcel() {
  const ws = XLSX.utils.json_to_sheet(window.trades);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Trades");
  XLSX.writeFile(wb, `MNQ_Journal_${getCurrentMonth()}.xlsx`);
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${m}/${d}`;
}

function setupEventListeners() {
  // Already set up above
}
