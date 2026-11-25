/**
 * Laboratorium Interaktif Roda & Grafik Trigonometri
 * Logika visualisasi kanvas lingkaran satuan, proyeksi gelombang,
 * penjabaran langkah konkret sudut berelasi, dan evaluasi adaptif.
 */

const DEFAULT_KEYS = {
  google: 'AQ.Ab8RN6JxP_WlxsARe9Cqzai8bZSy82F_UTsPOpWFvEG13KSgMA',
  groq: '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'
};

const SPECIAL_ANGLES = [
  0, 30, 45, 60, 90, 120, 135, 150, 180,
  210, 225, 240, 270, 300, 315, 330, 360
];

// Pembantu pembuatan HTML matematika (pecahan bersusun & akar bertopi)
function frac(num, den) {
  return '<span class="frac"><span class="num">' + num + '</span><span class="den">' + den + '</span></span>';
}

function sqrt(val) {
  return '<span class="sqrt"><span class="sqrt-symbol">√</span><span class="sqrt-radicand">' + val + '</span></span>';
}

// Konversi teks matematika biasa (jika berasal dari API) menjadi pecahan vertikal & akar rapi
function formatMathRich(text) {
  if (!text) return '';
  let out = String(text);
  // Hapus delimiter LaTeX $ atau \( \) jika masih terbawa dari model bahasa
  out = out.replace(/\$\$/g, '').replace(/\$/g, '');
  out = out.replace(/\\\(/g, '').replace(/\\\)/g, '');
  out = out.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, function (_, a, b) {
    return frac(a, b);
  });
  out = out.replace(/\\sqrt\{([^}]+)\}/g, function (_, a) {
    return sqrt(a);
  });
  out = out.replace(/√([0-9]+)/g, function (_, n) {
    return sqrt(n);
  });
  // Ubah pola pecahan seperti 1/2, -3/4, 2√3 / 3 menjadi pecahan per (garis mendatar)
  out = out.replace(/([−-]?\d*(?:<span class="sqrt">.*?<\/span>)?)\s*\/\s*(\d+)/g, function (_, num, den) {
    if (!num) return '/' + den;
    return frac(num.trim(), den.trim());
  });
  return out;
}

const EXACT_HTML = {
  0:   { sin: '0',                    cos: '1',                    tan: '0',                    rad: '0' },
  30:  { sin: frac('1', '2'),         cos: frac(sqrt('3'), '2'),   tan: frac(sqrt('3'), '3'),   rad: frac('π', '6') },
  45:  { sin: frac(sqrt('2'), '2'),   cos: frac(sqrt('2'), '2'),   tan: '1',                    rad: frac('π', '4') },
  60:  { sin: frac(sqrt('3'), '2'),   cos: frac('1', '2'),         tan: sqrt('3'),              rad: frac('π', '3') },
  90:  { sin: '1',                    cos: '0',                    tan: 'Tak Terdefinisi',      rad: frac('π', '2') },
  120: { sin: frac(sqrt('3'), '2'),   cos: '−' + frac('1', '2'),   tan: '−' + sqrt('3'),        rad: frac('2π', '3') },
  135: { sin: frac(sqrt('2'), '2'),   cos: '−' + frac(sqrt('2'), '2'), tan: '−1',               rad: frac('3π', '4') },
  150: { sin: frac('1', '2'),         cos: '−' + frac(sqrt('3'), '2'), tan: '−' + frac(sqrt('3'), '3'), rad: frac('5π', '6') },
  180: { sin: '0',                    cos: '−1',                   tan: '0',                    rad: 'π' },
  210: { sin: '−' + frac('1', '2'),   cos: '−' + frac(sqrt('3'), '2'), tan: frac(sqrt('3'), '3'), rad: frac('7π', '6') },
  225: { sin: '−' + frac(sqrt('2'), '2'), cos: '−' + frac(sqrt('2'), '2'), tan: '1',            rad: frac('5π', '4') },
  240: { sin: '−' + frac(sqrt('3'), '2'), cos: '−' + frac('1', '2'), tan: sqrt('3'),            rad: frac('4π', '3') },
  270: { sin: '−1',                   cos: '0',                    tan: 'Tak Terdefinisi',      rad: frac('3π', '2') },
  300: { sin: '−' + frac(sqrt('3'), '2'), cos: frac('1', '2'),     tan: '−' + sqrt('3'),        rad: frac('5π', '3') },
  315: { sin: '−' + frac(sqrt('2'), '2'), cos: frac(sqrt('2'), '2'), tan: '−1',                 rad: frac('7π', '4') },
  330: { sin: '−' + frac('1', '2'),   cos: frac(sqrt('3'), '2'),   tan: '−' + frac(sqrt('3'), '3'), rad: frac('11π', '6') },
  360: { sin: '0',                    cos: '1',                    tan: '0',                    rad: '2π' }
};

const RECIPROCAL_HTML = {
  0:   { csc: 'Tak Terdefinisi',      sec: '1',                      cot: 'Tak Terdefinisi' },
  30:  { csc: '2',                    sec: frac('2' + sqrt('3'), '3'), cot: sqrt('3') },
  45:  { csc: sqrt('2'),              sec: sqrt('2'),                cot: '1' },
  60:  { csc: frac('2' + sqrt('3'), '3'), sec: '2',                  cot: frac(sqrt('3'), '3') },
  90:  { csc: '1',                    sec: 'Tak Terdefinisi',        cot: '0' },
  120: { csc: frac('2' + sqrt('3'), '3'), sec: '−2',                 cot: '−' + frac(sqrt('3'), '3') },
  135: { csc: sqrt('2'),              sec: '−' + sqrt('2'),          cot: '−1' },
  150: { csc: '2',                    sec: '−' + frac('2' + sqrt('3'), '3'), cot: '−' + sqrt('3') },
  180: { csc: 'Tak Terdefinisi',      sec: '−1',                     cot: 'Tak Terdefinisi' },
  210: { csc: '−2',                   sec: '−' + frac('2' + sqrt('3'), '3'), cot: sqrt('3') },
  225: { csc: '−' + sqrt('2'),        sec: '−' + sqrt('2'),          cot: '1' },
  240: { csc: '−' + frac('2' + sqrt('3'), '3'), sec: '−2',           cot: frac(sqrt('3'), '3') },
  270: { csc: '−1',                   sec: 'Tak Terdefinisi',        cot: '0' },
  300: { csc: '−' + frac('2' + sqrt('3'), '3'), sec: '2',            cot: '−' + frac(sqrt('3'), '3') },
  315: { csc: '−' + sqrt('2'),        sec: sqrt('2'),                cot: '−1' },
  330: { csc: '−2',                   sec: frac('2' + sqrt('3'), '3'), cot: '−' + sqrt('3') },
  360: { csc: 'Tak Terdefinisi',      sec: '1',                      cot: 'Tak Terdefinisi' }
};

// State Utama Aplikasi
const state = {
  angleDeg: 30,
  isPlaying: false,
  isDragging: false,
  waveFunc: 'sin',
  layers: {
    sin: true,
    cos: true,
    tan: true,
    triangle: true,
    reciprocal: false
  },
  quizQuestions: [],
  userAnswers: {}
};

// Elemen DOM
const unitCanvas = document.getElementById('unitCircleCanvas');
const unitCtx = unitCanvas.getContext('2d');
const waveCanvas = document.getElementById('waveCanvas');
const waveCtx = waveCanvas.getContext('2d');

const angleSlider = document.getElementById('angleSlider');
const angleInput = document.getElementById('angleInput');

document.addEventListener('DOMContentLoaded', function () {
  const groqInput = document.getElementById('input-groq-key');
  const geminiInput = document.getElementById('input-gemini-key');
  if (groqInput) groqInput.value = DEFAULT_KEYS.groq;
  if (geminiInput) geminiInput.value = DEFAULT_KEYS.google;

  initTabs();
  initSpecialAnglesBar();
  bindEvents();
  updateAllViews();
  loadInitialQuiz();
});

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const target = btn.dataset.tab;
      tabBtns.forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(function (p) {
        p.classList.remove('active');
      });

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const activePanel = document.getElementById('tab-' + target);
      if (activePanel) activePanel.classList.add('active');
      updateAllViews();
    });
  });
}

function initSpecialAnglesBar() {
  const bar = document.getElementById('specialAnglesBar');
  SPECIAL_ANGLES.forEach(function (deg) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'angle-chip';
    btn.textContent = deg + '°';
    btn.dataset.deg = String(deg);
    btn.addEventListener('click', function () {
      stopAnimation();
      setAngle(deg);
    });
    bar.appendChild(btn);
  });
}

function bindEvents() {
  angleSlider.addEventListener('input', function (e) {
    stopAnimation();
    setAngle(parseFloat(e.target.value));
  });

  angleInput.addEventListener('change', function (e) {
    stopAnimation();
    const min = parseFloat(angleSlider.min);
    const max = parseFloat(angleSlider.max);
    let val = parseFloat(e.target.value);
    if (Number.isNaN(val)) val = 0;
    val = Math.max(min, Math.min(max, Math.round(val)));
    setAngle(val);
  });

  document.getElementById('btn-dec').addEventListener('click', function () {
    stopAnimation();
    setAngle(state.angleDeg - 1);
  });

  document.getElementById('btn-inc').addEventListener('click', function () {
    stopAnimation();
    setAngle(state.angleDeg + 1);
  });

  document.getElementById('chk-extended').addEventListener('change', function (e) {
    if (e.target.checked) {
      angleSlider.min = -180;
      angleSlider.max = 720;
    } else {
      angleSlider.min = 0;
      angleSlider.max = 360;
      setAngle(normalizeAngle(state.angleDeg));
    }
    updateAllViews();
  });

  document.getElementById('select-wave-func').addEventListener('change', function (e) {
    state.waveFunc = e.target.value;
    drawWaveCanvas();
  });

  ['sin', 'cos', 'tan', 'triangle', 'reciprocal'].forEach(function (key) {
    document.getElementById('layer-' + key).addEventListener('change', function (e) {
      state.layers[key] = e.target.checked;
      document.getElementById('reciprocal-box').classList.toggle('hidden', !state.layers.reciprocal);
      drawUnitCircle();
    });
  });

  document.getElementById('btn-play').addEventListener('click', function () {
    if (state.isPlaying) {
      stopAnimation();
    } else {
      startAnimation();
    }
  });

  const handlePointer = function (clientX, clientY) {
    const rect = unitCanvas.getBoundingClientRect();
    const scaleX = unitCanvas.width / rect.width;
    const scaleY = unitCanvas.height / rect.height;
    const cx = unitCanvas.width / 2;
    const cy = unitCanvas.height / 2;

    const dx = (clientX - rect.left) * scaleX - cx;
    const dy = cy - (clientY - rect.top) * scaleY;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (deg < 0) deg += 360;

    if (document.getElementById('chk-snap').checked) {
      for (let i = 0; i < SPECIAL_ANGLES.length; i++) {
        const s = SPECIAL_ANGLES[i];
        if (Math.abs(deg - s) <= 3) {
          deg = s;
          break;
        }
      }
    }
    setAngle(Math.round(deg));
  };

  unitCanvas.addEventListener('pointerdown', function (e) {
    stopAnimation();
    state.isDragging = true;
    unitCanvas.setPointerCapture(e.pointerId);
    handlePointer(e.clientX, e.clientY);
  });

  unitCanvas.addEventListener('pointermove', function (e) {
    if (!state.isDragging) return;
    handlePointer(e.clientX, e.clientY);
  });

  unitCanvas.addEventListener('pointerup', function (e) {
    state.isDragging = false;
    unitCanvas.releasePointerCapture(e.pointerId);
  });

  document.getElementById('btn-reshuffle').addEventListener('click', handleReshuffleQuiz);
}

function startAnimation() {
  state.isPlaying = true;
  document.getElementById('icon-play').textContent = 'pause';
  document.getElementById('label-play').textContent = 'Jeda Rotasi';
  requestAnimationFrame(animationLoop);
}

function stopAnimation() {
  state.isPlaying = false;
  document.getElementById('icon-play').textContent = 'play_arrow';
  document.getElementById('label-play').textContent = 'Putar Otomatis';
}

function animationLoop() {
  if (!state.isPlaying) return;
  const speed = parseFloat(document.getElementById('select-speed').value) || 0.9;
  const min = parseFloat(angleSlider.min);
  const max = parseFloat(angleSlider.max);
  let next = state.angleDeg + speed;
  if (next > max) next = min;
  setAngle(next, true);
  requestAnimationFrame(animationLoop);
}

function setAngle(deg, isSmooth) {
  const min = parseFloat(angleSlider.min);
  const max = parseFloat(angleSlider.max);
  const clamped = Math.max(min, Math.min(max, deg));
  state.angleDeg = isSmooth ? clamped : Math.round(clamped);

  angleSlider.value = Math.round(state.angleDeg);
  angleInput.value = Math.round(state.angleDeg);
  updateAllViews();
}

function normalizeAngle(deg) {
  let n = Math.round(deg) % 360;
  if (n < 0) n += 360;
  return n;
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function formatRadianHtml(deg) {
  const rounded = Math.round(deg);
  if (rounded === 0) return '0 rad';
  if (EXACT_HTML[rounded]) return EXACT_HTML[rounded].rad + ' rad';

  const sign = rounded < 0 ? '−' : '';
  const absDeg = Math.abs(rounded);
  const divisor = gcd(absDeg, 180);
  const num = absDeg / divisor;
  const den = 180 / divisor;
  const numStr = (num === 1 ? '' : String(num)) + 'π';
  if (den === 1) return sign + numStr + ' rad';
  return sign + frac(numStr, String(den)) + ' rad';
}

function formatNumber(num) {
  return num.toFixed(4).replace('.', ',');
}

function updateAllViews() {
  const deg = Math.round(state.angleDeg);
  const norm = normalizeAngle(deg);
  const rad = (state.angleDeg * Math.PI) / 180;

  const sinVal = Math.sin(rad);
  const cosVal = Math.cos(rad);
  const isUndefinedTan = norm === 90 || norm === 270;
  const tanVal = isUndefinedTan ? null : Math.tan(rad);

  document.querySelectorAll('.angle-chip').forEach(function (chip) {
    chip.classList.toggle('active', parseInt(chip.dataset.deg, 10) === norm);
  });

  // Pembacaan Utama dengan Pecahan Vertikal
  document.getElementById('disp-deg').textContent = deg + '°';
  document.getElementById('disp-rad').innerHTML = formatRadianHtml(deg);
  document.getElementById('disp-coord').textContent =
    '(' + cosVal.toFixed(3).replace('.', ',') + ' ; ' + sinVal.toFixed(3).replace('.', ',') + ')';

  // Penentuan Kuadran
  const qInfo = getQuadrantInfo(norm);
  document.getElementById('quadrant-badge').textContent = qInfo.title;
  document.getElementById('quadrant-desc').textContent = qInfo.desc;

  document.querySelectorAll('.data-table tbody tr').forEach(function (tr) {
    tr.classList.toggle('active-row', parseInt(tr.dataset.q, 10) === qInfo.num);
  });

  // Nilai Eksak (Pecahan Vertikal & Akar) serta Desimal
  const exact = EXACT_HTML[norm];
  document.getElementById('val-sin-exact').innerHTML = exact ? exact.sin : sinVal.toFixed(3).replace('.', ',');
  document.getElementById('val-cos-exact').innerHTML = exact ? exact.cos : cosVal.toFixed(3).replace('.', ',');
  document.getElementById('val-tan-exact').innerHTML = isUndefinedTan
    ? 'Tak Terdefinisi'
    : (exact ? exact.tan : tanVal.toFixed(3).replace('.', ','));

  document.getElementById('val-sin-dec').textContent = formatNumber(sinVal);
  document.getElementById('val-cos-dec').textContent = formatNumber(cosVal);
  document.getElementById('val-tan-dec').textContent = isUndefinedTan ? '∞ (Asimtot)' : formatNumber(tanVal);

  updateSignTag('sign-sin', sinVal);
  updateSignTag('sign-cos', cosVal);
  if (isUndefinedTan) {
    const el = document.getElementById('sign-tan');
    el.textContent = 'Tak Terdefinisi';
    el.className = 'sign-tag zero';
  } else {
    updateSignTag('sign-tan', tanVal);
  }

  // Rasio Kebalikan
  const recip = RECIPROCAL_HTML[norm];
  if (recip) {
    document.getElementById('val-csc').innerHTML = recip.csc;
    document.getElementById('val-sec').innerHTML = recip.sec;
    document.getElementById('val-cot').innerHTML = recip.cot;
  } else {
    document.getElementById('val-csc').textContent = Math.abs(sinVal) < 1e-6 ? 'Tak Terdefinisi' : formatNumber(1 / sinVal);
    document.getElementById('val-sec').textContent = Math.abs(cosVal) < 1e-6 ? 'Tak Terdefinisi' : formatNumber(1 / cosVal);
    document.getElementById('val-cot').textContent = Math.abs(sinVal) < 1e-6 ? 'Tak Terdefinisi' : formatNumber(cosVal / sinVal);
  }

  // Perbarui Panel Sudut Berelasi & Identitas (Langkah Konkret & Lengkap)
  updateRelasiPanel(deg, norm, sinVal, cosVal, tanVal, isUndefinedTan);

  drawUnitCircle();
  drawWaveCanvas();
}

function updateSignTag(id, val) {
  const el = document.getElementById(id);
  if (Math.abs(val) < 1e-6) {
    el.textContent = 'Nol (0)';
    el.className = 'sign-tag zero';
  } else if (val > 0) {
    el.textContent = 'Positif (+)';
    el.className = 'sign-tag pos';
  } else {
    el.textContent = 'Negatif (−)';
    el.className = 'sign-tag neg';
  }
}

function getQuadrantInfo(norm) {
  if (norm === 0 || norm === 90 || norm === 180 || norm === 270 || norm === 360) {
    return {
      num: 0,
      title: 'Sudut Pembatas Sumbu',
      desc: 'Sudut ' + norm + '° terletak tepat pada sumbu koordinat Kartesius sehingga salah satu komponen absis atau ordinatnya bernilai nol.'
    };
  }
  if (norm > 0 && norm < 90) {
    return {
      num: 1,
      title: 'Kuadran I',
      desc: 'Pada Kuadran I (0° < θ < 90°), koordinat x > 0 dan y > 0 sehingga sin(θ), cos(θ), dan tan(θ) seluruhnya bernilai positif.'
    };
  }
  if (norm > 90 && norm < 180) {
    return {
      num: 2,
      title: 'Kuadran II',
      desc: 'Pada Kuadran II (90° < θ < 180°), absis x < 0 dan ordinat y > 0. Hanya sin(θ) dan csc(θ) yang bernilai positif.'
    };
  }
  if (norm > 180 && norm < 270) {
    return {
      num: 3,
      title: 'Kuadran III',
      desc: 'Pada Kuadran III (180° < θ < 270°), baik x < 0 maupun y < 0. Hasil bagi y dibagi x bernilai positif sehingga tan(θ) dan cot(θ) positif.'
    };
  }
  return {
    num: 4,
    title: 'Kuadran IV',
    desc: 'Pada Kuadran IV (270° < θ < 360°), absis x > 0 dan ordinat y < 0. Hanya cos(θ) dan sec(θ) yang bernilai positif.'
  };
}

function updateRelasiPanel(deg, norm, sinVal, cosVal, tanVal, isUndefinedTan) {
  document.getElementById('rel-active-deg').textContent = deg + '°';

  let refAlpha = norm;
  let formulaX = 'θ = α';
  let explainX = 'Sudut berada langsung pada Kuadran I (0° sampai 90°).';
  let quadrantRule = 'Semua perbandingan trigonometri (sin, cos, tan) bertanda positif (+).';
  let signSinStr = '+';
  let signCosStr = '+';
  let signTanStr = '+';
  let refCalcStep = 'Karena ' + norm + '° sudah berada di antara 0° dan 90°, sudut referensinya langsung α = ' + norm + '°.';

  if (norm > 90 && norm <= 180) {
    refAlpha = 180 - norm;
    formulaX = '180° − ' + refAlpha + '°';
    explainX = 'Kuadran II memakai patokan sumbu-X (180° − α) sehingga nama fungsi tetap.';
    quadrantRule = 'Pada Kuadran II, hanya sin(θ) bertanda positif (+), sedangkan cos(θ) dan tan(θ) bertanda negatif (−).';
    signSinStr = '+';
    signCosStr = '−';
    signTanStr = '−';
    refCalcStep = 'α = 180° − ' + norm + '° = <strong>' + refAlpha + '°</strong> (jarak sudut ' + norm + '° menuju sumbu-X negatif di 180°).';
  } else if (norm > 180 && norm <= 270) {
    refAlpha = norm - 180;
    formulaX = '180° + ' + refAlpha + '°';
    explainX = 'Kuadran III memakai patokan sumbu-X (180° + α) sehingga nama fungsi tetap.';
    quadrantRule = 'Pada Kuadran III, hanya tan(θ) bertanda positif (+), sedangkan sin(θ) dan cos(θ) bertanda negatif (−).';
    signSinStr = '−';
    signCosStr = '−';
    signTanStr = '+';
    refCalcStep = 'α = ' + norm + '° − 180° = <strong>' + refAlpha + '°</strong> (kelebihan sudut ' + norm + '° melewati sumbu-X negatif di 180°).';
  } else if (norm > 270 && norm < 360) {
    refAlpha = 360 - norm;
    formulaX = '360° − ' + refAlpha + '°';
    explainX = 'Kuadran IV memakai patokan sumbu-X (360° − α) sehingga nama fungsi tetap.';
    quadrantRule = 'Pada Kuadran IV, hanya cos(θ) bertanda positif (+), sedangkan sin(θ) dan tan(θ) bertanda negatif (−).';
    signSinStr = '−';
    signCosStr = '+';
    signTanStr = '−';
    refCalcStep = 'α = 360° − ' + norm + '° = <strong>' + refAlpha + '°</strong> (sisa sudut ' + norm + '° menuju satu putaran penuh di 360°).';
  }

  document.getElementById('rel-ref-angle').textContent = refAlpha + '°';
  document.getElementById('rel-formula-x').textContent = formulaX;
  document.getElementById('rel-explain-x').textContent = explainX;

  const refExact = EXACT_HTML[refAlpha];
  const refSinDisplay = refExact ? refExact.sin : formatNumber(Math.abs(sinVal));
  const refCosDisplay = refExact ? refExact.cos : formatNumber(Math.abs(cosVal));
  const refTanDisplay = isUndefinedTan
    ? 'Tak Terdefinisi'
    : (refExact ? refExact.tan : formatNumber(Math.abs(tanVal)));

  const finalSinDisplay = EXACT_HTML[norm] ? EXACT_HTML[norm].sin : formatNumber(sinVal);
  const finalCosDisplay = EXACT_HTML[norm] ? EXACT_HTML[norm].cos : formatNumber(cosVal);
  const finalTanDisplay = isUndefinedTan
    ? 'Tak Terdefinisi'
    : (EXACT_HTML[norm] ? EXACT_HTML[norm].tan : formatNumber(tanVal));

  const putaran = Math.floor(deg / 360);
  let normDesc = 'Sudut ' + deg + '° sudah berada pada rentang utama 0° sampai 360°.';
  if (deg >= 360) {
    normDesc = 'Sudut ' + deg + '° = (' + putaran + ' × 360°) + ' + norm + '°, sehingga posisinya berimpit dengan <strong>' + norm + '°</strong>.';
  } else if (deg < 0) {
    normDesc = 'Sudut negatif ' + deg + '° diputar searah jarum jam, sehingga ' + deg + '° + 360° = <strong>' + norm + '°</strong>.';
  }

  const stepsList = document.getElementById('rel-steps-list');
  stepsList.innerHTML =
    '<li>' +
      '<strong>Langkah 1 — Menentukan Posisi Sudut Standar (0° s.d. 360°):</strong><br>' +
      normDesc +
    '</li>' +
    '<li>' +
      '<strong>Langkah 2 — Menghitung Sudut Referensi Lancip (α) terhadap Sumbu-X:</strong><br>' +
      refCalcStep +
    '</li>' +
    '<li>' +
      '<strong>Langkah 3 — Menentukan Tanda Positif atau Negatif sesuai Kuadran:</strong><br>' +
      quadrantRule +
    '</li>' +
    '<li>' +
      '<strong>Langkah 4 — Substitusi Nilai Sudut Referensi α = ' + refAlpha + '°:</strong>' +
      '<div class="step-calc-line">• <strong>sin(' + norm + '°)</strong> = ' + signSinStr + 'sin(' + refAlpha + '°) = ' + (signSinStr === '−' && refSinDisplay !== '0' ? '−' : '') + refSinDisplay + ' = <strong>' + finalSinDisplay + '</strong> (' + formatNumber(sinVal) + ')</div>' +
      '<div class="step-calc-line">• <strong>cos(' + norm + '°)</strong> = ' + signCosStr + 'cos(' + refAlpha + '°) = ' + (signCosStr === '−' && refCosDisplay !== '0' ? '−' : '') + refCosDisplay + ' = <strong>' + finalCosDisplay + '</strong> (' + formatNumber(cosVal) + ')</div>' +
      '<div class="step-calc-line">• <strong>tan(' + norm + '°)</strong> = ' + (isUndefinedTan ? 'Tak Terdefinisi (karena pembagi cos(' + norm + '°) = 0)' : signTanStr + 'tan(' + refAlpha + '°) = ' + (signTanStr === '−' && refTanDisplay !== '0' ? '−' : '') + refTanDisplay + ' = <strong>' + finalTanDisplay + '</strong> (' + formatNumber(tanVal) + ')') + '</div>' +
    '</li>';

  // Pembuktian Numerik Identitas dengan Pecahan Vertikal
  const s2 = sinVal * sinVal;
  const c2 = cosVal * cosVal;
  document.getElementById('id-pythagoras-calc').innerHTML =
    '<div><strong>Substitusi nilai untuk θ = ' + deg + '°:</strong></div>' +
    '<div>= (' + formatNumber(sinVal) + ')<sup>2</sup> + (' + formatNumber(cosVal) + ')<sup>2</sup></div>' +
    '<div>= ' + formatNumber(s2) + ' + ' + formatNumber(c2) + ' = <strong>' + formatNumber(s2 + c2) + '</strong> (Terbukti)</div>';

  if (isUndefinedTan) {
    document.getElementById('id-tan-calc').innerHTML =
      '<div><strong>Substitusi nilai untuk θ = ' + deg + '°:</strong></div>' +
      '<div>tan(' + deg + '°) = ' + frac(formatNumber(sinVal), '0,0000') + ' = <strong>Tak Terdefinisi</strong> (penyebut bernilai nol)</div>';
  } else {
    document.getElementById('id-tan-calc').innerHTML =
      '<div><strong>Substitusi nilai untuk θ = ' + deg + '°:</strong></div>' +
      '<div>tan(' + deg + '°) = ' + frac(formatNumber(sinVal), formatNumber(cosVal)) + ' = <strong>' + formatNumber(tanVal) + '</strong></div>';
  }

  document.getElementById('id-neg-calc').innerHTML =
    '<div>• sin(−' + deg + '°) = −(' + formatNumber(sinVal) + ') = <strong>' + formatNumber(-sinVal) + '</strong></div>' +
    '<div>• cos(−' + deg + '°) = <strong>' + formatNumber(cosVal) + '</strong> (nilai tetap karena simetri sumbu-X)</div>';
}

// ==========================================
// VISUALISASI KANVAS 1: RODA TRIGONOMETRI
// ==========================================
function drawUnitCircle() {
  const w = unitCanvas.width;
  const h = unitCanvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const R = 148;

  unitCtx.clearRect(0, 0, w, h);

  unitCtx.strokeStyle = '#ece7dc';
  unitCtx.lineWidth = 1;
  for (let offset = -R; offset <= R; offset += R / 2) {
    unitCtx.beginPath();
    unitCtx.moveTo(cx + offset, 20);
    unitCtx.lineTo(cx + offset, h - 20);
    unitCtx.stroke();

    unitCtx.beginPath();
    unitCtx.moveTo(20, cy + offset);
    unitCtx.lineTo(w - 20, cy + offset);
    unitCtx.stroke();
  }

  unitCtx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  unitCtx.fillStyle = '#9aa5b1';
  unitCtx.textAlign = 'center';
  unitCtx.fillText('KUADRAN I (Semua +)', cx + R * 0.68, cy - R * 0.72);
  unitCtx.fillText('KUADRAN II (Sin +)', cx - R * 0.68, cy - R * 0.72);
  unitCtx.fillText('KUADRAN III (Tan +)', cx - R * 0.68, cy + R * 0.78);
  unitCtx.fillText('KUADRAN IV (Cos +)', cx + R * 0.68, cy + R * 0.78);

  unitCtx.strokeStyle = '#7b8794';
  unitCtx.lineWidth = 1.5;
  unitCtx.beginPath();
  unitCtx.moveTo(22, cy);
  unitCtx.lineTo(w - 22, cy);
  unitCtx.moveTo(cx, 22);
  unitCtx.lineTo(cx, h - 22);
  unitCtx.stroke();

  unitCtx.fillStyle = '#52606d';
  unitCtx.font = '700 12px "JetBrains Mono", monospace';
  unitCtx.fillText('X (cos)', w - 34, cy - 8);
  unitCtx.fillText('Y (sin)', cx + 30, 26);

  unitCtx.strokeStyle = '#1b4965';
  unitCtx.lineWidth = 2.2;
  unitCtx.beginPath();
  unitCtx.arc(cx, cy, R, 0, Math.PI * 2);
  unitCtx.stroke();

  const rad = (state.angleDeg * Math.PI) / 180;
  const px = cx + R * Math.cos(rad);
  const py = cy - R * Math.sin(rad);

  if (state.layers.triangle) {
    unitCtx.fillStyle = 'rgba(27, 73, 101, 0.09)';
    unitCtx.beginPath();
    unitCtx.moveTo(cx, cy);
    unitCtx.lineTo(px, cy);
    unitCtx.lineTo(px, py);
    unitCtx.closePath();
    unitCtx.fill();

    if (Math.abs(px - cx) > 14 && Math.abs(py - cy) > 14) {
      const sx = px > cx ? -10 : 10;
      const sy = py < cy ? 10 : -10;
      unitCtx.strokeStyle = '#52606d';
      unitCtx.lineWidth = 1.2;
      unitCtx.beginPath();
      unitCtx.moveTo(px + sx, cy);
      unitCtx.lineTo(px + sx, cy + sy);
      unitCtx.lineTo(px, cy + sy);
      unitCtx.stroke();
    }
  }

  unitCtx.strokeStyle = '#1b4965';
  unitCtx.lineWidth = 2;
  unitCtx.beginPath();
  const arcR = 30;
  if (state.angleDeg >= 0) {
    unitCtx.arc(cx, cy, arcR, 0, -rad, true);
  } else {
    unitCtx.arc(cx, cy, arcR, 0, -rad, false);
  }
  unitCtx.stroke();

  if (state.layers.cos) {
    unitCtx.strokeStyle = '#be123c';
    unitCtx.lineWidth = 4;
    unitCtx.beginPath();
    unitCtx.moveTo(cx, cy);
    unitCtx.lineTo(px, cy);
    unitCtx.stroke();
  }

  if (state.layers.sin) {
    unitCtx.strokeStyle = '#0f766e';
    unitCtx.lineWidth = 4;
    unitCtx.beginPath();
    unitCtx.moveTo(px, cy);
    unitCtx.lineTo(px, py);
    unitCtx.stroke();
  }

  const norm = normalizeAngle(Math.round(state.angleDeg));
  if (state.layers.tan && norm !== 90 && norm !== 270) {
    const tanVal = Math.tan(rad);
    const clampedTan = Math.max(-2.2, Math.min(2.2, tanVal));
    const tx = cx + R;
    const ty = cy - R * clampedTan;

    unitCtx.save();
    unitCtx.setLineDash([4, 4]);
    unitCtx.strokeStyle = '#b45309';
    unitCtx.lineWidth = 1.4;
    unitCtx.beginPath();
    unitCtx.moveTo(cx, cy);
    unitCtx.lineTo(tx, ty);
    unitCtx.stroke();
    unitCtx.restore();

    unitCtx.strokeStyle = '#b45309';
    unitCtx.lineWidth = 3.5;
    unitCtx.beginPath();
    unitCtx.moveTo(tx, cy);
    unitCtx.lineTo(tx, ty);
    unitCtx.stroke();
  }

  unitCtx.strokeStyle = '#1c242b';
  unitCtx.lineWidth = 2.4;
  unitCtx.beginPath();
  unitCtx.moveTo(cx, cy);
  unitCtx.lineTo(px, py);
  unitCtx.stroke();

  unitCtx.fillStyle = '#ffffff';
  unitCtx.strokeStyle = '#1b4965';
  unitCtx.lineWidth = 3.5;
  unitCtx.beginPath();
  unitCtx.arc(px, py, 8, 0, Math.PI * 2);
  unitCtx.fill();
  unitCtx.stroke();

  unitCtx.fillStyle = '#1c242b';
  unitCtx.font = '700 12px "Plus Jakarta Sans", sans-serif';
  unitCtx.fillText('P', px + (px >= cx ? 14 : -14), py + (py <= cy ? -10 : 16));
}

// ==========================================
// VISUALISASI KANVAS 2: GRAFIK GELOMBANG
// ==========================================
function drawWaveCanvas() {
  const w = waveCanvas.width;
  const h = waveCanvas.height;
  const padLeft = 42;
  const padRight = 18;
  const cy = h / 2;
  const plotW = w - padLeft - padRight;
  const amp = 115;

  waveCtx.clearRect(0, 0, w, h);

  waveCtx.strokeStyle = '#ece7dc';
  waveCtx.lineWidth = 1;
  [-1, 0, 1].forEach(function (val) {
    const y = cy - val * amp;
    waveCtx.beginPath();
    waveCtx.moveTo(padLeft, y);
    waveCtx.lineTo(w - padRight, y);
    waveCtx.stroke();

    waveCtx.fillStyle = '#7b8794';
    waveCtx.font = '600 11px "JetBrains Mono", monospace';
    waveCtx.textAlign = 'right';
    waveCtx.fillText(val.toString(), padLeft - 8, y + 4);
  });

  [0, 90, 180, 270, 360].forEach(function (deg) {
    const x = padLeft + (deg / 360) * plotW;
    waveCtx.strokeStyle = '#ece7dc';
    waveCtx.beginPath();
    waveCtx.moveTo(x, 24);
    waveCtx.lineTo(x, h - 24);
    waveCtx.stroke();

    waveCtx.fillStyle = '#7b8794';
    waveCtx.font = '600 11px "JetBrains Mono", monospace';
    waveCtx.textAlign = 'center';
    waveCtx.fillText(deg + '°', x, h - 8);
  });

  waveCtx.strokeStyle = '#7b8794';
  waveCtx.lineWidth = 1.4;
  waveCtx.beginPath();
  waveCtx.moveTo(padLeft, cy);
  waveCtx.lineTo(w - padRight, cy);
  waveCtx.stroke();

  const mode = state.waveFunc;

  if (mode === 'all' || mode === 'sin') {
    plotTrigCurve(function (r) { return Math.sin(r); }, '#0f766e', padLeft, plotW, cy, amp);
  }
  if (mode === 'all' || mode === 'cos') {
    plotTrigCurve(function (r) { return Math.cos(r); }, '#be123c', padLeft, plotW, cy, amp);
  }
  if (mode === 'all' || mode === 'tan') {
    plotTanCurve(padLeft, plotW, cy, amp);
  }

  const norm = normalizeAngle(Math.round(state.angleDeg));
  const curX = padLeft + (norm / 360) * plotW;
  const rad = (norm * Math.PI) / 180;

  waveCtx.save();
  waveCtx.setLineDash([4, 4]);
  waveCtx.strokeStyle = '#1b4965';
  waveCtx.lineWidth = 1.5;
  waveCtx.beginPath();
  waveCtx.moveTo(curX, 24);
  waveCtx.lineTo(curX, h - 24);
  waveCtx.stroke();
  waveCtx.restore();

  if (mode === 'all' || mode === 'sin') {
    drawMarkerDot(curX, cy - Math.sin(rad) * amp, '#0f766e');
  }
  if (mode === 'all' || mode === 'cos') {
    drawMarkerDot(curX, cy - Math.cos(rad) * amp, '#be123c');
  }
  if ((mode === 'all' || mode === 'tan') && norm !== 90 && norm !== 270) {
    const tVal = Math.tan(rad);
    if (Math.abs(tVal) <= 1.65) {
      drawMarkerDot(curX, cy - tVal * amp, '#b45309');
    }
  }
}

function plotTrigCurve(fn, color, padLeft, plotW, cy, amp) {
  waveCtx.strokeStyle = color;
  waveCtx.lineWidth = 2.6;
  waveCtx.beginPath();
  for (let deg = 0; deg <= 360; deg += 2) {
    const x = padLeft + (deg / 360) * plotW;
    const y = cy - fn((deg * Math.PI) / 180) * amp;
    if (deg === 0) waveCtx.moveTo(x, y);
    else waveCtx.lineTo(x, y);
  }
  waveCtx.stroke();
}

function plotTanCurve(padLeft, plotW, cy, amp) {
  waveCtx.strokeStyle = '#b45309';
  waveCtx.lineWidth = 2.2;
  waveCtx.beginPath();
  let penDown = false;
  for (let deg = 0; deg <= 360; deg += 1) {
    if (Math.abs(deg - 90) < 2 || Math.abs(deg - 270) < 2) {
      penDown = false;
      continue;
    }
    const t = Math.tan((deg * Math.PI) / 180);
    if (Math.abs(t) > 1.65) {
      penDown = false;
      continue;
    }
    const x = padLeft + (deg / 360) * plotW;
    const y = cy - t * amp;
    if (!penDown) {
      waveCtx.moveTo(x, y);
      penDown = true;
    } else {
      waveCtx.lineTo(x, y);
    }
  }
  waveCtx.stroke();
}

function drawMarkerDot(x, y, color) {
  waveCtx.fillStyle = color;
  waveCtx.strokeStyle = '#ffffff';
  waveCtx.lineWidth = 2;
  waveCtx.beginPath();
  waveCtx.arc(x, y, 5.5, 0, Math.PI * 2);
  waveCtx.fill();
  waveCtx.stroke();
}

// ==========================================
// PANEL 3: EVALUASI PEMAHAMAN (LANGKAH KONKRET & PECAHAN VERTIKAL)
// ==========================================
const LOCAL_BANK = [
  {
    topic: 'Sudut Istimewa',
    prompt: 'Diketahui titik P berada pada lingkaran satuan dengan sudut θ = 150°. Berapakah nilai eksak dari cos(150°)?',
    options: [
      frac('1', '2'),
      '−' + frac('1', '2'),
      '−' + frac(sqrt('3'), '2'),
      frac(sqrt('3'), '2')
    ],
    answerIndex: 2,
    steps: [
      '<strong>Identifikasi Kuadran:</strong> Sudut 150° berada di antara 90° dan 180°, sehingga terletak di <strong>Kuadran II</strong>.',
      '<strong>Tentukan Tanda Fungsi:</strong> Pada Kuadran II, sumbu-X bernilai negatif sehingga nilai <strong>cos(150°) bertanda negatif (−)</strong>.',
      '<strong>Hitung Sudut Referensi (α):</strong> Gunakan relasi sumbu-X: α = 180° − 150° = <strong>30°</strong>.',
      '<strong>Substitusi Nilai Eksak:</strong> cos(150°) = −cos(30°) = <strong>−' + frac(sqrt('3'), '2') + '</strong>.'
    ]
  },
  {
    topic: 'Analisis Kuadran',
    prompt: 'Jika diketahui sin(θ) < 0 dan tan(θ) > 0, pada kuadran manakah terminal sudut θ berada?',
    options: ['Kuadran I', 'Kuadran II', 'Kuadran III', 'Kuadran IV'],
    answerIndex: 2,
    steps: [
      '<strong>Analisis Syarat Pertama — sin(θ) < 0:</strong> Nilai sinus (koordinat y) bernilai negatif hanya pada <strong>Kuadran III</strong> atau <strong>Kuadran IV</strong>.',
      '<strong>Analisis Syarat Kedua — tan(θ) > 0:</strong> Nilai tangen (perbandingan y per x) bernilai positif hanya pada <strong>Kuadran I</strong> atau <strong>Kuadran III</strong>.',
      '<strong>Irisan Kedua Syarat:</strong> Kuadran yang memenuhi kedua kondisi secara bersamaan adalah <strong>Kuadran III</strong>.'
    ]
  },
  {
    topic: 'Sudut Berelasi',
    prompt: 'Bentuk perbandingan trigonometri yang senilai dengan sin(240°) adalah...',
    options: ['−sin(60°)', 'sin(60°)', '−cos(60°)', 'cos(30°)'],
    answerIndex: 0,
    steps: [
      '<strong>Identifikasi Kuadran:</strong> Sudut 240° berada di antara 180° dan 270°, sehingga terletak di <strong>Kuadran III</strong>.',
      '<strong>Uraikan dengan Relasi Sumbu-X:</strong> Tuliskan 240° sebagai <strong>180° + 60°</strong>, sehingga sudut referensinya adalah α = 60°.',
      '<strong>Terapkan Tanda Kuadran III:</strong> Pada Kuadran III, nilai sinus bertanda negatif (−), maka sin(240°) = sin(180° + 60°) = <strong>−sin(60°)</strong>.'
    ]
  },
  {
    topic: 'Nilai Tangen',
    prompt: 'Manakah pernyataan yang tepat mengenai nilai tan(90°) dan tan(270°) pada lingkaran satuan?',
    options: [
      'Keduanya bernilai 0',
      'Keduanya bernilai 1',
      'Tidak terdefinisi karena penyebut cos(θ) = 0',
      'Bernilai −1 pada Kuadran IV'
    ],
    answerIndex: 2,
    steps: [
      '<strong>Gunakan Definisi Perbandingan Tangen:</strong> tan(θ) = ' + frac('sin(θ)', 'cos(θ)') + '.',
      '<strong>Evaluasi pada Sudut 90° dan 270°:</strong> Pada kedua sudut pembatas sumbu-Y tersebut, koordinat absis x = cos(θ) = <strong>0</strong>.',
      '<strong>Kesimpulan Matematis:</strong> Karena pembagian bilangan dengan nol (' + frac('1', '0') + ' dan ' + frac('−1', '0') + ') tidak memiliki hasil riil, maka nilai tan(90°) dan tan(270°) <strong>tidak terdefinisi</strong>.'
    ]
  },
  {
    topic: 'Konversi Radian & Koordinat',
    prompt: 'Sebuah lengan mekanik berputar sebesar ' + frac('5π', '4') + ' radian dari sumbu-X positif. Posisi koordinat ujung lengan pada lingkaran satuan adalah...',
    options: [
      '(' + frac(sqrt('2'), '2') + ' , ' + frac(sqrt('2'), '2') + ')',
      '(−' + frac(sqrt('2'), '2') + ' , −' + frac(sqrt('2'), '2') + ')',
      '(−' + frac(sqrt('2'), '2') + ' , ' + frac(sqrt('2'), '2') + ')',
      '(' + frac(sqrt('2'), '2') + ' , −' + frac(sqrt('2'), '2') + ')'
    ],
    answerIndex: 1,
    steps: [
      '<strong>Konversi Radian ke Derajat:</strong> ' + frac('5π', '4') + ' × ' + frac('180°', 'π') + ' = 5 × 45° = <strong>225°</strong>.',
      '<strong>Identifikasi Kuadran:</strong> Sudut 225° berada di <strong>Kuadran III</strong> dengan sudut referensi α = 225° − 180° = <strong>45°</strong>.',
      '<strong>Hitung Absis (x) dan Ordinat (y):</strong> Di Kuadran III keduanya negatif, sehingga x = cos(225°) = −' + frac(sqrt('2'), '2') + ' dan y = sin(225°) = −' + frac(sqrt('2'), '2') + '.'
    ]
  },
  {
    topic: 'Identitas Pythagoras',
    prompt: 'Jika θ berada di Kuadran IV dan diketahui cos(θ) = ' + frac('3', '5') + ', berapakah nilai dari sin(θ)?',
    options: [
      frac('4', '5'),
      '−' + frac('4', '5'),
      frac('3', '4'),
      '−' + frac('3', '4')
    ],
    answerIndex: 1,
    steps: [
      '<strong>Gunakan Identitas Pythagoras:</strong> sin<sup>2</sup>(θ) + cos<sup>2</sup>(θ) = 1.',
      '<strong>Substitusi Nilai cos(θ):</strong> sin<sup>2</sup>(θ) + (' + frac('3', '5') + ')<sup>2</sup> = 1  ⇒  sin<sup>2</sup>(θ) = 1 − ' + frac('9', '25') + ' = ' + frac('16', '25') + '.',
      '<strong>Tarik Akar Kuadrat:</strong> sin(θ) = ±' + sqrt(frac('16', '25')) + ' = ±' + frac('4', '5') + '.',
      '<strong>Sesuaikan Tanda Kuadran IV:</strong> Karena θ di Kuadran IV (sumbu-Y negatif), maka diambil nilai negatif yaitu <strong>sin(θ) = −' + frac('4', '5') + '</strong>.'
    ]
  },
  {
    topic: 'Rasio Kebalikan',
    prompt: 'Berapakah nilai eksak dari sec(300°)?',
    options: [
      '2',
      '−2',
      frac('2' + sqrt('3'), '3'),
      '−' + frac('2' + sqrt('3'), '3')
    ],
    answerIndex: 0,
    steps: [
      '<strong>Gunakan Definisi Secan:</strong> sec(300°) = ' + frac('1', 'cos(300°)') + '.',
      '<strong>Hitung Nilai cos(300°):</strong> Sudut 300° berada di Kuadran IV (cosinus positif) dengan sudut referensi α = 360° − 300° = 60°, maka cos(300°) = +cos(60°) = ' + frac('1', '2') + '.',
      '<strong>Selesaikan Pembagian Pecahan:</strong> sec(300°) = ' + frac('1', '1/2') + ' = 1 × ' + frac('2', '1') + ' = <strong>2</strong>.'
    ]
  }
];

function loadInitialQuiz() {
  state.quizQuestions = LOCAL_BANK.slice(0, 5);
  state.userAnswers = {};
  renderQuiz();
}

function renderQuiz() {
  const container = document.getElementById('quiz-container');
  container.innerHTML = '';

  state.quizQuestions.forEach(function (q, idx) {
    const card = document.createElement('article');
    card.className = 'question-card';

    const letters = ['A', 'B', 'C', 'D'];
    let optionsHtml = '';
    for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
      optionsHtml +=
        '<button type="button" class="option-btn" data-q="' + idx + '" data-opt="' + optIdx + '">' +
          '<span class="opt-letter">' + letters[optIdx] + '</span>' +
          '<span>' + formatMathRich(q.options[optIdx]) + '</span>' +
        '</button>';
    }

    let stepsHtml = '';
    if (Array.isArray(q.steps) && q.steps.length > 0) {
      stepsHtml = '<ol class="exp-steps">';
      for (let s = 0; s < q.steps.length; s++) {
        stepsHtml += '<li>' + formatMathRich(q.steps[s]) + '</li>';
      }
      stepsHtml += '</ol>';
    } else if (q.explanation) {
      stepsHtml = '<p style="margin-top:6px;">' + formatMathRich(q.explanation) + '</p>';
    }

    card.innerHTML =
      '<div class="q-meta">' +
        '<span class="q-number">Butir Soal ' + (idx + 1) + '</span>' +
        '<span class="q-topic">' + q.topic + '</span>' +
      '</div>' +
      '<p class="q-prompt">' + formatMathRich(q.prompt) + '</p>' +
      '<div class="options-grid">' + optionsHtml + '</div>' +
      '<div id="exp-' + idx + '" class="q-explanation hidden">' +
        '<strong>Pembahasan Langkah demi Langkah:</strong>' +
        stepsHtml +
      '</div>';

    container.appendChild(card);
  });

  container.querySelectorAll('.option-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const qIdx = parseInt(btn.dataset.q, 10);
      const optIdx = parseInt(btn.dataset.opt, 10);
      handleAnswerSelection(qIdx, optIdx);
    });
  });

  updateScorePanel();
}

function handleAnswerSelection(qIdx, optIdx) {
  if (state.userAnswers[qIdx] !== undefined) return;
  state.userAnswers[qIdx] = optIdx;

  const question = state.quizQuestions[qIdx];
  const buttons = document.querySelectorAll('.option-btn[data-q="' + qIdx + '"]');

  buttons.forEach(function (btn, idx) {
    btn.disabled = true;
    if (idx === question.answerIndex) {
      btn.classList.add('correct');
    } else if (idx === optIdx) {
      btn.classList.add('wrong');
    }
  });

  const expEl = document.getElementById('exp-' + qIdx);
  if (expEl) expEl.classList.remove('hidden');
  updateScorePanel();
}

function updateScorePanel() {
  const total = state.quizQuestions.length;
  let correctCount = 0;
  let answeredCount = 0;

  state.quizQuestions.forEach(function (q, idx) {
    if (state.userAnswers[idx] !== undefined) {
      answeredCount++;
      if (state.userAnswers[idx] === q.answerIndex) correctCount++;
    }
  });

  document.getElementById('score-value').textContent = String(correctCount);
  document.getElementById('score-total').textContent = '/ ' + total;

  const feedback = document.getElementById('score-feedback');
  if (answeredCount === 0) {
    feedback.textContent = 'Silakan pilih jawaban pada setiap butir soal untuk melihat pembahasan langkah demi langkah dan perolehan skor.';
  } else if (answeredCount < total) {
    feedback.textContent = 'Telah dijawab ' + answeredCount + ' dari ' + total + ' butir soal. Lanjutkan hingga seluruh soal selesai.';
  } else {
    const pct = Math.round((correctCount / total) * 100);
    feedback.textContent = 'Evaluasi selesai. Skor akhir Anda ' + pct + '% (' + correctCount + ' benar dari ' + total + ' butir soal).';
  }
}

async function handleReshuffleQuiz() {
  const btn = document.getElementById('btn-reshuffle');
  const statusText = document.getElementById('quiz-status-text');
  const provider = document.getElementById('select-provider').value;
  const difficulty = document.getElementById('select-difficulty').value;

  btn.disabled = true;
  statusText.textContent = 'Sedang menyusun paket 5 butir soal baru sesuai tingkat kesulitan yang dipilih...';

  try {
    let generated = null;
    if (provider === 'groq') {
      const key = document.getElementById('input-groq-key').value.trim();
      generated = await fetchQuestionsFromGroq(key, difficulty);
    } else if (provider === 'gemini') {
      const key = document.getElementById('input-gemini-key').value.trim();
      generated = await fetchQuestionsFromGemini(key, difficulty);
    }

    if (Array.isArray(generated) && generated.length >= 5) {
      state.quizQuestions = generated.slice(0, 5);
      state.userAnswers = {};
      renderQuiz();
      statusText.textContent =
        'Paket soal baru berhasil disusun (' + difficulty.toUpperCase() + ') melalui layanan ' + provider.toUpperCase() + '.';
    } else {
      throw new Error('Format soal tidak sesuai, beralih ke generator algoritmik lokal.');
    }
  } catch (err) {
    state.quizQuestions = buildAlgorithmicQuestions(difficulty);
    state.userAnswers = {};
    renderQuiz();
    statusText.textContent =
      'Paket soal baru berhasil diacak menggunakan generator algoritmik lokal (' + difficulty.toUpperCase() + ').';
  } finally {
    btn.disabled = false;
  }
}

function buildPromptForGenerator(difficulty) {
  return (
    'Buat tepat 5 soal pilihan ganda matematika SMA materi Roda Trigonometri (Lingkaran Satuan, sin, cos, tan, kuadran, sudut berelasi) dalam Bahasa Indonesia baku dan formal.\n' +
    'Tingkat kesulitan: ' + difficulty + '.\n' +
    'ATURAN PENULISAN: Jangan gunakan simbol LaTeX seperti $ atau \\frac. Tulis pecahan biasa seperti 1/2 atau √3/2.\n' +
    'Keluarkan HANYA array JSON valid tanpa markdown dengan struktur:\n' +
    '[{"topic":"Nama Topik","prompt":"Pertanyaan jelas","options":["Opsi A","Opsi B","Opsi C","Opsi D"],"answerIndex":0,"steps":["Langkah 1: ...","Langkah 2: ...","Langkah 3: ..."]}]'
  );
}

async function fetchQuestionsFromGroq(apiKey, difficulty) {
  if (!apiKey) throw new Error('Kunci API Groq kosong');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      temperature: 0.75,
      messages: [
        {
          role: 'system',
          content: 'Anda adalah dosen matematika profesional. Keluarkan JSON array valid saja tanpa simbol LaTeX.'
        },
        { role: 'user', content: buildPromptForGenerator(difficulty) }
      ]
    })
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const raw = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  return parseJsonArray(raw);
}

async function fetchQuestionsFromGemini(apiKey, difficulty) {
  if (!apiKey) throw new Error('Kunci API Google kosong');
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' +
    encodeURIComponent(apiKey);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPromptForGenerator(difficulty) }] }],
      generationConfig: { temperature: 0.75 }
    })
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const raw =
    (data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text) ||
    '';
  return parseJsonArray(raw);
}

function parseJsonArray(rawText) {
  const start = rawText.indexOf('[');
  const end = rawText.lastIndexOf(']');
  if (start === -1 || end === -1) return null;
  const parsed = JSON.parse(rawText.slice(start, end + 1));
  return parsed.filter(function (item) {
    return (
      item &&
      typeof item.prompt === 'string' &&
      Array.isArray(item.options) &&
      item.options.length === 4 &&
      typeof item.answerIndex === 'number'
    );
  });
}

// Generator Soal Algoritmik Luring dengan Langkah Konkret
function buildAlgorithmicQuestions(difficulty) {
  const pool = LOCAL_BANK.slice().sort(function () { return Math.random() - 0.5; });
  const dynamicAngles = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];
  const pick = dynamicAngles[Math.floor(Math.random() * dynamicAngles.length)];
  const funcs = ['sin', 'cos', 'tan'];
  const fn = funcs[Math.floor(Math.random() * funcs.length)];
  const correctVal = EXACT_HTML[pick][fn];

  const allValues = [
    frac('1', '2'),
    '−' + frac('1', '2'),
    frac(sqrt('2'), '2'),
    '−' + frac(sqrt('2'), '2'),
    frac(sqrt('3'), '2'),
    '−' + frac(sqrt('3'), '2'),
    '1',
    '−1',
    sqrt('3'),
    '−' + sqrt('3'),
    frac(sqrt('3'), '3'),
    '−' + frac(sqrt('3'), '3')
  ];

  const distractors = allValues
    .filter(function (v) { return v !== correctVal; })
    .sort(function () { return Math.random() - 0.5; })
    .slice(0, 3);

  const options = [correctVal].concat(distractors).sort(function () { return Math.random() - 0.5; });
  const qInfo = getQuadrantInfo(pick);

  let refAlpha = pick;
  let relasiText = 'Sudut berada langsung di Kuadran I sehingga α = ' + pick + '°.';
  if (pick > 90 && pick < 180) {
    refAlpha = 180 - pick;
    relasiText = 'Gunakan relasi Kuadran II: α = 180° − ' + pick + '° = ' + refAlpha + '°.';
  } else if (pick > 180 && pick < 270) {
    refAlpha = pick - 180;
    relasiText = 'Gunakan relasi Kuadran III: α = ' + pick + '° − 180° = ' + refAlpha + '°.';
  } else if (pick > 270 && pick < 360) {
    refAlpha = 360 - pick;
    relasiText = 'Gunakan relasi Kuadran IV: α = 360° − ' + pick + '° = ' + refAlpha + '°.';
  }

  const labelTopik = difficulty === 'dasar' ? 'Sudut Istimewa' : 'Lingkaran Satuan';
  const dynamicQ = {
    topic: 'Evaluasi ' + labelTopik,
    prompt: 'Berdasarkan posisi titik pada roda trigonometri untuk sudut θ = ' + pick + '°, berapakah nilai eksak dari ' + fn + '(' + pick + '°)?',
    options: options,
    answerIndex: options.indexOf(correctVal),
    steps: [
      '<strong>Identifikasi Posisi Kuadran:</strong> Sudut ' + pick + '° terletak pada <strong>' + qInfo.title + '</strong>.',
      '<strong>Tentukan Sudut Referensi (α):</strong> ' + relasiText,
      '<strong>Nilai Akhir:</strong> Sesuai aturan tanda pada ' + qInfo.title + ', diperoleh ' + fn + '(' + pick + '°) = <strong>' + correctVal + '</strong>.'
    ]
  };

  return [dynamicQ].concat(pool.slice(0, 4));
}