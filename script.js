// Kullanıcıları tutan obje (localStorage ile basit)
const usersKey = 'diabandUsers';
let users = JSON.parse(localStorage.getItem(usersKey)) || [];

let currentUser = null;

function show(id) {
  ['welcome','register','login','app'].forEach(x => {
    document.getElementById(x).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
}

function register() {
  const tc = document.getElementById('regTc').value.trim();
  const name = document.getElementById('regName').value.trim();
  const pass = document.getElementById('regPass').value.trim();
  const patientPhone = document.getElementById('regPatientPhone').value.trim();
  const relName = document.getElementById('regRelName').value.trim();
  const relPhone = document.getElementById('regRelPhone').value.trim();

  if(tc.length !== 11 || !/^\d+$/.test(tc)) { alert('Geçerli 11 haneli TC giriniz!'); return; }
  if(pass.length !== 4 || !/^\d+$/.test(pass)) { alert('4 haneli rakamsal şifre giriniz!'); return; }
  if(!name || !patientPhone || !relName || !relPhone) {
    alert('Tüm alanları doldurun!'); return;
  }
  if(users.find(u => u.tc === tc)) {
    alert('Bu TC zaten kayıtlı!'); return;
  }

  users.push({tc,name,pass,patientPhone,relName,relPhone, meds: []});
  localStorage.setItem(usersKey, JSON.stringify(users));
  alert('Kayıt başarılı! Giriş yapabilirsiniz.');
  show('login');
}

// Login ile kullanıcının bilgilerini formda göster
function loginTcChanged() {
  const tc = document.getElementById('loginTc').value.trim();
  const user = users.find(u => u.tc === tc);
  if(user) {
    document.getElementById('loginName').value = user.name;
    document.getElementById('loginPass').value = user.pass;
    document.getElementById('loginPatientPhone').value = user.patientPhone;
    document.getElementById('loginRelName').value = user.relName;
    document.getElementById('loginRelPhone').value = user.relPhone;
  } else {
    ['loginName','loginPass','loginPatientPhone','loginRelName','loginRelPhone'].forEach(id => {
      document.getElementById(id).value = '';
    });
  }
}

function login() {
  const tc = document.getElementById('loginTc').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const user = users.find(u => u.tc === tc && u.pass === pass);
  if(!user) { alert('TC veya şifre hatalı!'); return; }
  currentUser = user;
  showApp();
}

function updateUser() {
  if(!currentUser) { alert('Önce giriş yapın!'); return; }
  const name = document.getElementById('loginName').value.trim();
  const patientPhone = document.getElementById('loginPatientPhone').value.trim();
  const relName = document.getElementById('loginRelName').value.trim();
  const relPhone = document.getElementById('loginRelPhone').value.trim();
  if(!name || !patientPhone || !relName || !relPhone) {
    alert('Tüm alanları doldurun!'); return;
  }
  currentUser.name = name;
  currentUser.patientPhone = patientPhone;
  currentUser.relName = relName;
  currentUser.relPhone = relPhone;
  // Güncelle localStorage
  users = users.map(u => u.tc === currentUser.tc ? currentUser : u);
  localStorage.setItem(usersKey, JSON.stringify(users));
  alert('Bilgiler güncellendi!');
  showApp();
}

function logout() {
  currentUser = null;
  show('welcome');
}

function showApp() {
  if(!currentUser) return;
  show('app');
  document.getElementById('userName').innerText = currentUser.name;
  document.getElementById('uTc').innerText = currentUser.tc;
  document.getElementById('uPatientPhone').innerText = currentUser.patientPhone;
  document.getElementById('uRelName').innerText = currentUser.relName;
  document.getElementById('uRelPhone').innerText = currentUser.relPhone;
  loadIlaclar();
  drawChart();
}

// Acil yakını arama
function acilAra() {
  let no = document.getElementById('acilTelefon').value.trim();
  if(!no.match(/^0\d{10}$/)) {
    alert('Geçerli 11 haneli telefon numarası giriniz (0 ile başlayacak).');
    return;
  }
  window.location.href = `tel:${no}`;
}

// Kandaki glikoz durumu
function glikozDurumu() {
  const val = parseFloat(document.getElementById('glikozMiktar').value);
  const sonuc = document.getElementById('glikozSonuc');
  if(isNaN(val)) {
    sonuc.innerText = 'Lütfen geçerli sayı girin!';
    sonuc.className = 'status sagliksiz';
    return;
  }
  if(val < 70) {
    sonuc.innerText = 'Hipoglisemi (düşük glikoz)';
    sonuc.className = 'status sagliksiz';
  } else if(val <= 140) {
    sonuc.innerText = 'Normal glikoz';
    sonuc.className = 'status saglikli';
  } else {
    sonuc.innerText = 'Hiperglisemi (yüksek glikoz)';
    sonuc.className = 'status sagliksiz';
  }
}

// HbA1c’den ortalama glikoz hesaplama
function hba1cHesapla() {
  const hba1c = parseFloat(document.getElementById('hba1cDegeri').value);
  const sonuc = document.getElementById('hba1cSonuc');
  if(isNaN(hba1c) || hba1c <= 0) {
    sonuc.innerText = 'Geçerli HbA1c değeri girin!';
    sonuc.className = 'status sagliksiz';
    return;
  }
  // Ortalama glikoz (mg/dL) = (28.7 × HbA1c) – 46.7
  const ortalama = (28.7 * hba1c) - 46.7;
  sonuc.innerText = `Ortalama Glikoz: ${ortalama.toFixed(1)} mg/dL`;
  sonuc.className = 'status saglikli';
}

// İlaç ekle
function ilacEkle() {
  if(!currentUser) { alert('Giriş yapın!'); return; }
  const ilac = document.getElementById('ilacAdi').value.trim();
  const saat = document.getElementById('ilacSaati').value;
  if(!ilac || !saat) {
    alert('İlaç adı ve saat giriniz!');
    return;
  }
  currentUser.meds.push({ilac, saat});
  users = users.map(u => u.tc === currentUser.tc ? currentUser : u);
  localStorage.setItem(usersKey, JSON.stringify(users));
  document.getElementById('ilacAdi').value = '';
  document.getElementById('ilacSaati').value = '';
  loadIlaclar();
}

function loadIlaclar() {
  if(!currentUser) return;
  const list = document.getElementById('ilacListesi');
  list.innerHTML = '';
  currentUser.meds.forEach(({ilac, saat}, i) => {
    const li = document.createElement('li');
    li.textContent = `${saat} - ${ilac}`;
    list.appendChild(li);
  });
}

// İdrar rengi değerlendirme
function degerlendirIdrar() {
  const val = document.getElementById('idrarRengi').value;
  const sonuc = document.getElementById('idrarSonuc');
  if(val === 'koyu') {
    sonuc.innerText = 'Dehidrasyon belirtisi olabilir.';
    sonuc.className = 'status sagliksiz';
  } else if(val === 'kirmizi') {
    sonuc.innerText = 'Kanama veya enfeksiyon belirtisi olabilir.';
    sonuc.className = 'status sagliksiz';
  } else if(val === 'normal') {
    sonuc.innerText = 'İdrar rengi normal.';
    sonuc.className = 'status saglikli';
  } else {
    sonuc.innerText = '';
  }
}

// Hesap makinesi
function calcCalculate() {
  const expr = document.getElementById('calcDisplay').value;
  try {
    // Basit ve güvensiz eval, sadece örnek amaçlı
    const res = eval(expr);
    document.getElementById('calcDisplay').value = res;
  } catch {
    alert('Geçersiz işlem!');
  }
}

function calcClear() {
  document.getElementById('calcDisplay').value = '';
}

// Zamanlayıcı
let timerId = null;
let timeLeft = 0;

function baslatTimer() {
  const saniye = parseInt(document.getElementById('timerInput').value);
  if(isNaN(saniye) || saniye <= 0) {
    alert('Geçerli süre giriniz!');
    return;
  }
  if(timerId) clearInterval(timerId);
  timeLeft = saniye;
  updateTimerDisplay();
  timerId = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if(timeLeft <= 0) {
      clearInterval(timerId);
      alert('Zamanlayıcı bitti!');
    }
  }, 1000);
}

function sifirlaTimer() {
  if(timerId) clearInterval(timerId);
  timeLeft = 0;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const d = document.getElementById('timerDisplay');
  d.innerText = `Kalan: ${timeLeft} saniye`;
}

// Glikoz verileri ve grafik
let glikozVerileri = [];

function veriEkle() {
  const now = new Date();
  const val = Math.floor(70 + Math.random()*100); // 70-170 arası glikoz
  glikozVerileri.push({t: now, v: val});
  if(glikozVerileri.length > 20) glikozVerileri.shift();
  drawChart();
}

let chart = null;

function drawChart() {
  const ctx = document.getElementById('glikozChart').getContext('2d');
  const labels = glikozVerileri.map(d => d.t.toLocaleTimeString());
  const data = glikozVerileri.map(d => d.v);
  if(chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Glikoz (mg/dL)',
          data,
          borderColor: '#00ffff',
          backgroundColor: 'rgba(0,255,255,0.3)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true }
        },
        plugins: {
          legend: {
            labels: { color: '#00ffff' }
          }
        }
      }
    });
  }
}

// QR Kod Okuma
let qrReader = null;
function toggleQRReader() {
  const readerDiv = document.getElementById('qr-reader');
  const resultDiv = document.getElementById('qr-result');

  if(readerDiv.classList.contains('hidden')) {
    readerDiv.classList.remove('hidden');
    if(!qrReader) {
      qrReader = new Html5Qrcode("qr-reader");
    }
    qrReader.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: 250
      },
      (decodedText, decodedResult) => {
        resultDiv.innerText = `QR Kod İçeriği: ${decodedText}`;
        // Örnek: Mesaj gönderme için kod ekleyebilirsiniz
        qrReader.stop();
        readerDiv.classList.add('hidden');
      },
      (errorMessage) => {
        // console.log(`QR error: ${errorMessage}`);
      }
    ).catch(err => {
      alert(`QR Okuyucu başlatılamadı: ${err}`);
    });
  } else {
    qrReader.stop();
    readerDiv.classList.add('hidden');
  }
}
