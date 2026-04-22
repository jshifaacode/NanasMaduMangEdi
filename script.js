// ============================================================
// 🔑 SETUP JSONBIN — CUKUP ISI 2 NILAI INI SAJA
//
// CARA DAPAT API KEY & BIN ID (5 menit):
// 1. Buka https://jsonbin.io → klik "Sign Up" → daftar gratis
// 2. Setelah login, klik "API Keys" di sidebar → copy "Secret Key"
//    → paste di JSONBIN_API_KEY di bawah
// 3. Klik "Create Bin" → isi dengan: {"reviews":[]}
//    → klik Create → copy ID bin-nya (format: angka panjang)
//    → paste di JSONBIN_BIN_ID di bawah
// 4. Selesai! Rating langsung realtime di semua device.
// ============================================================

var JSONBIN_API_KEY = "$2a$10$ahcd47k6TFkc90ZZM6gNeuuc7InIHupnpoih/t9kBH79PtXITRsR.";  // ← paste Secret Key dari jsonbin.io
var JSONBIN_BIN_ID  = "69e8268136566621a8dab1d5";           // ← paste Bin ID dari jsonbin.io

// Interval polling realtime (5 detik sekali cek data terbaru)
var POLL_INTERVAL = 5000;

// ============================================================
// JANGAN UBAH APA PUN DI BAWAH INI
// ============================================================

var reviews       = [];
var selectedRating = 0;
var pollingTimer  = null;

// ==========================================
// 1. SIDEBAR & NAVIGATION
// ==========================================
var hamburger = document.getElementById('hamburger');
var sidebar   = document.getElementById('sidebar');
var overlay   = document.getElementById('overlay');

function toggleMenu(isOpen) {
  hamburger.classList.toggle('open', isOpen);
  sidebar.classList.toggle('open', isOpen);
  overlay.classList.toggle('show', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : 'auto';
}

hamburger.addEventListener('click', function() {
  toggleMenu(!sidebar.classList.contains('open'));
});
overlay.addEventListener('click', function() { toggleMenu(false); });
document.querySelectorAll('.nav-item').forEach(function(link) {
  link.addEventListener('click', function() { toggleMenu(false); });
});

// ==========================================
// 2. SCROLL EFFECTS & PROGRESS BAR
// ==========================================
window.addEventListener('scroll', function() {
  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  var height    = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  var scrolled  = (winScroll / height) * 100;

  var progressEl = document.getElementById('scrollProgress');
  if (progressEl) progressEl.style.width = scrolled + '%';

  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    if (winScroll > 300) backToTop.classList.add('visible');
    else backToTop.classList.remove('visible');
  }

  var sections = document.querySelectorAll('section[id]');
  var scrollY  = window.pageYOffset;
  sections.forEach(function(current) {
    var sectionTop  = current.offsetTop - 150;
    var sectionBot  = sectionTop + current.offsetHeight;
    var sectionId   = current.getAttribute('id');
    var navLink     = document.querySelector('.nav-item[href*=' + sectionId + ']');
    if (navLink) {
      if (scrollY > sectionTop && scrollY <= sectionBot) navLink.classList.add('active');
      else navLink.classList.remove('active');
    }
  });
});

// Reveal on scroll
var revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry, index) {
    if (entry.isIntersecting) {
      setTimeout(function() {
        entry.target.classList.add('visible');
      }, index * 50);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal, .menu-card, .feature-card, .owner-card').forEach(function(el) {
  revealObserver.observe(el);
});

// ==========================================
// 3. ORDER MODAL
// ==========================================
function openOrderModal(name, price, emoji) {
  var modal      = document.getElementById('orderModal');
  var waNumber   = '6285892787616';
  var gofoodLink = 'https://share.google/NSqi9vCBxanevL8vu';
  var message    = 'Halo Mang Edi, saya [nama] mau pesan [berapa] bungkus. Apakah masih tersedia?';

  document.getElementById('modalTitle').innerText = name;
  document.getElementById('modalPrice').innerText = price;
  document.getElementById('modalEmoji').innerText = emoji;

  var waBtn = document.getElementById('waLink');
  var gfBtn = document.getElementById('gfLink');
  if (waBtn) waBtn.href = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(message);
  if (gfBtn) gfBtn.href = gofoodLink;

  modal.style.display = 'flex';
  setTimeout(function() { modal.classList.add('show'); }, 10);
  document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
  var modal = document.getElementById('orderModal');
  modal.classList.remove('show');
  setTimeout(function() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }, 300);
}

window.addEventListener('click', function(e) {
  var modal = document.getElementById('orderModal');
  if (e.target === modal) closeOrderModal();
});

// ==========================================
// 4. JSONBIN — AMBIL & SIMPAN DATA
// ==========================================
function fetchReviews(callback) {
  fetch('https://api.jsonbin.io/v3/b/' + JSONBIN_BIN_ID + '/latest', {
    headers: {
      'X-Master-Key': JSONBIN_API_KEY
    }
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    var fetched = (data.record && data.record.reviews) ? data.record.reviews : [];
    callback(null, fetched);
  })
  .catch(function(err) {
    callback(err, null);
  });
}

function saveReviews(newReviewsArray, onSuccess, onError) {
  fetch('https://api.jsonbin.io/v3/b/' + JSONBIN_BIN_ID, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_API_KEY
    },
    body: JSON.stringify({ reviews: newReviewsArray })
  })
  .then(function(res) { return res.json(); })
  .then(function() { if (onSuccess) onSuccess(); })
  .catch(function(err) { if (onError) onError(err); });
}

// ==========================================
// 5. REALTIME POLLING — cek tiap 5 detik
// ==========================================
function startPolling() {
  // Langsung fetch pertama kali
  loadAndRender();

  // Lalu cek setiap POLL_INTERVAL ms
  pollingTimer = setInterval(function() {
    fetchReviews(function(err, fetched) {
      if (err) return;
      // Hanya re-render kalau ada perubahan jumlah ulasan
      if (fetched.length !== reviews.length) {
        reviews = fetched;
        renderReviews();
      }
    });
  }, POLL_INTERVAL);
}

function loadAndRender() {
  var container = document.getElementById('reviewsContainer');
  if (container) {
    container.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:24px 0;grid-column:1/-1">⏳ Memuat ulasan...</p>';
  }

  fetchReviews(function(err, fetched) {
    if (err) {
      showToast('❌ Gagal memuat ulasan. Cek API Key & Bin ID.');
      if (container) {
        container.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:24px 0;grid-column:1/-1">⚠️ Gagal memuat. Periksa konfigurasi JSONBin.</p>';
      }
      return;
    }
    reviews = fetched;
    renderReviews();
  });
}

// ==========================================
// 6. RENDER ULASAN & STATISTIK
// ==========================================
function renderReviews() {
  var container = document.getElementById('reviewsContainer');
  if (!container) return;

  container.innerHTML = '';

  if (reviews.length === 0) {
    container.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:24px 0;grid-column:1/-1">Belum ada ulasan. Jadilah yang pertama! 🍍</p>';
    updateRatingStats();
    return;
  }

  var reversed = reviews.slice().reverse();
  reversed.forEach(function(r, index) {
    var card = document.createElement('div');
    card.className = 'review-card reveal';
    card.style.transitionDelay = (index * 0.08) + 's';
    card.innerHTML =
      '<div class="review-header">' +
        '<div class="review-avatar">' + r.name.charAt(0).toUpperCase() + '</div>' +
        '<div class="review-meta">' +
          '<h4>' + escapeHtml(r.name) + '</h4>' +
          '<div class="review-stars">' + '⭐'.repeat(r.rating) + '</div>' +
        '</div>' +
      '</div>' +
      '<p class="review-text">"' + escapeHtml(r.text) + '"</p>' +
      '<div class="review-date">' + escapeHtml(r.date) + '</div>';
    container.appendChild(card);
    setTimeout(function() { card.classList.add('visible'); }, 50 + index * 80);
  });

  updateRatingStats();
}

function updateRatingStats() {
  var total      = reviews.length;
  var avgEl      = document.getElementById('avgNumber');
  var counts     = { 5: 0, 4: 0, 3: 0 };

  if (total === 0) {
    if (avgEl) avgEl.textContent = '—';
    [5, 4, 3].forEach(function(s) {
      var bar   = document.getElementById('bar' + s);
      var count = document.getElementById('count' + s);
      if (bar)   bar.style.width = '0%';
      if (count) count.textContent = '0';
    });
    return;
  }

  var totalPts = 0;
  reviews.forEach(function(r) {
    totalPts += r.rating;
    if (counts[r.rating] !== undefined) counts[r.rating]++;
  });

  if (avgEl) avgEl.textContent = (totalPts / total).toFixed(1);

  [5, 4, 3].forEach(function(s) {
    var pct   = ((counts[s] || 0) / total) * 100;
    var bar   = document.getElementById('bar' + s);
    var count = document.getElementById('count' + s);
    if (bar)   { bar.style.width = '0%'; setTimeout(function() { bar.style.width = pct + '%'; }, 100); }
    if (count) count.textContent = counts[s] || 0;
  });
}

// ==========================================
// 7. SUBMIT ULASAN BARU
// ==========================================
function submitReview() {
  var nameInput = document.getElementById('reviewName');
  var textInput = document.getElementById('reviewText');
  var name      = nameInput.value.trim();
  var text      = textInput.value.trim();

  if (!name || !selectedRating || !text) {
    showToast('⚠️ Mohon lengkapi semua data ulasan!');
    return;
  }

  var dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  var submitBtn = document.getElementById('submitBtn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Mengirim...'; }

  // Ambil data terbaru dulu sebelum simpan, supaya tidak overwrite ulasan orang lain
  fetchReviews(function(err, latest) {
    var updatedList = err ? reviews.slice() : latest.slice();
    updatedList.push({ name: name, rating: selectedRating, text: text, date: dateStr });

    saveReviews(updatedList,
      function() {
        // Sukses
        reviews = updatedList;
        renderReviews();
        nameInput.value = '';
        textInput.value = '';
        selectedRating  = 0;
        document.querySelectorAll('.star-btn').forEach(function(b) { b.classList.remove('active'); });
        showToast('✅ Ulasan berhasil dikirim!');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Kirim Ulasan Sekarang'; }
      },
      function() {
        showToast('❌ Gagal mengirim. Cek koneksi & konfigurasi.');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Kirim Ulasan Sekarang'; }
      }
    );
  });
}

// ==========================================
// 8. BINTANG INTERAKTIF
// ==========================================
document.querySelectorAll('.star-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    selectedRating = parseInt(btn.getAttribute('data-value'));
    btn.style.transform = 'scale(1.4)';
    setTimeout(function() { btn.style.transform = 'scale(1)'; }, 200);
    document.querySelectorAll('.star-btn').forEach(function(b) {
      b.classList.toggle('active', parseInt(b.getAttribute('data-value')) <= selectedRating);
    });
  });
});

// ==========================================
// 9. UTILS
// ==========================================
function showToast(msg) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ==========================================
// 10. INIT
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  startPolling();
  window.dispatchEvent(new Event('scroll'));
});
