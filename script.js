// ==========================================
// 1. SIDEBAR & NAVIGATION LOGIC
// ==========================================
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

// Fungsi toggle menu yang lebih bersih dengan kontrol scroll body
const toggleMenu = (isOpen) => {
  hamburger.classList.toggle('open', isOpen);
  sidebar.classList.toggle('open', isOpen);
  overlay.classList.toggle('show', isOpen);
  // Mencegah scroll di background saat menu terbuka
  document.body.style.overflow = isOpen ? 'hidden' : 'auto';
};

hamburger.addEventListener('click', () => {
  const isOpening = !sidebar.classList.contains('open');
  toggleMenu(isOpening);
});

overlay.addEventListener('click', () => toggleMenu(false));

document.querySelectorAll('.nav-item').forEach(link => {
  link.addEventListener('click', () => toggleMenu(false));
});

// ==========================================
// 2. SCROLL EFFECTS & PROGRESS BAR
// ==========================================
window.addEventListener('scroll', () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  
  const progressEl = document.getElementById("scrollProgress");
  if(progressEl) progressEl.style.width = scrolled + "%";

  const backToTop = document.getElementById('backToTop');
  if (winScroll > 300) {
    backToTop?.classList.add('visible');
  } else {
    backToTop?.classList.remove('visible');
  }

  // Logic Highlight Active Navigation
  const sections = document.querySelectorAll('section[id]');
  const scrollY = window.pageYOffset;
  
  sections.forEach(current => {
    const sectionHeight = current.offsetHeight;
    const sectionTop = current.offsetTop - 150; // Offset agar perpindahan lebih natural
    const sectionId = current.getAttribute('id');
    const navLink = document.querySelector('.nav-item[href*=' + sectionId + ']');
    
    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      navLink?.classList.add('active');
    } else {
      navLink?.classList.remove('active');
    }
  });
});

// Reveal Animation on Scroll (Intersection Observer)
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      // Tambahkan sedikit delay staggered untuk elemen yang muncul bersamaan
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, index * 50);
    }
  });
}, { threshold: 0.15 });

// Daftarkan semua elemen yang ingin di-reveal
document.querySelectorAll('.reveal, .menu-card, .feature-card, .owner-card').forEach(el => {
  revealObserver.observe(el);
});

// ==========================================
// 3. ORDER MODAL & WHATSAPP LOGIC
// ==========================================
const orderModal = document.getElementById('orderModal');

function openOrderModal(name, price, emoji) {
    const modal = document.getElementById('orderModal');
    const waNumber = "6285892787616"; // Nomor WA Mang Edi
    const gofoodLink = "https://share.google/NSqi9vCBxanevL8vu"; 
    
    // Update isi modal sesuai data produk
    document.getElementById('modalTitle').innerText = name;
    document.getElementById('modalPrice').innerText = price;
    document.getElementById('modalEmoji').innerText = emoji;

    // Buat template pesan WhatsApp
    const message = `Halo Mang Edi, saya [nama] mau pesan [berapa] bungkus. Apakah masih tersedia?`;
    
    // Set link tombol
    const waLinkBtn = document.getElementById('waLink');
    const gfLinkBtn = document.getElementById('gfLink');
    
    if(waLinkBtn) waLinkBtn.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
    if(gfLinkBtn) gfLinkBtn.href = gofoodLink;

    // Animasi Muncul Modal
    modal.style.display = 'flex';
    // Small timeout agar transisi CSS terbaca browser
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    document.body.style.overflow = 'hidden'; 
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    modal.classList.remove('show');
    
     
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);
}

// Tutup modal jika klik di luar box (overlay)
window.addEventListener('click', (event) => {
    const modal = document.getElementById('orderModal');
    if (event.target == modal) {
        closeOrderModal();
    }
});

// ==========================================
// 4. RATING & AUTOMATIC STATISTICS LOGIC
// ==========================================
let selectedRating = 0;

// Ambil data ulasan dari LocalStorage
let reviews = JSON.parse(localStorage.getItem('nanas_reviews')) || [
  { name: "Siti Aminah", rating: 5, text: "Nanasnya beneran manis banget!", date: "12 Maret 2026" },
  { name: "Andi Wijaya", rating: 5, text: "Segar dan pengiriman cepat.", date: "5 Maret 2026" },
  { name: "Budi Santoso", rating: 4, text: "Manis, tapi tadi dapet yang ukurannya agak kecil.", date: "1 Maret 2026" }
];

const starBtns = document.querySelectorAll('.star-btn');

starBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedRating = parseInt(btn.getAttribute('data-value'));
    
    // Animasi "Bounce" pada bintang yang diklik
    btn.style.transform = 'scale(1.4)';
    setTimeout(() => btn.style.transform = 'scale(1)', 200);

    starBtns.forEach(b => {
      const val = parseInt(b.getAttribute('data-value'));
      b.classList.toggle('active', val <= selectedRating);
    });
  });
});

function updateRatingStats() {
  const totalReviews = reviews.length;
  if (totalReviews === 0) return;

  let totalPoints = 0;
  let counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  reviews.forEach(r => {
    counts[r.rating]++;
    totalPoints += r.rating;
  });

  // 1. Update Skor Rata-rata
  const avgScore = (totalPoints / totalReviews).toFixed(1);
  const avgNumberEl = document.querySelector('.avg-number');
  if(avgNumberEl) avgNumberEl.textContent = avgScore;

  // 2. Update Progress Bar Fill (dengan animasi lebar)
  const barRows = document.querySelectorAll('.bar-row');
  for (let i = 5; i >= 1; i--) {
    const index = 5 - i; 
    if (barRows[index]) {
      const percentage = (counts[i] / totalReviews) * 100;
      const fill = barRows[index].querySelector('.bar-fill');
      const label = barRows[index].querySelector('.bar-count');
      
      if (fill) {
          fill.style.width = '0%'; // Reset dulu
          setTimeout(() => fill.style.width = percentage + '%', 100);
      }
      if (label) label.textContent = counts[i];
    }
  }
}

function renderReviews() {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;
  
  container.innerHTML = '';
  // Tampilkan ulasan terbaru di atas dengan efek staggered
  [...reviews].reverse().forEach((r, index) => {
    const card = document.createElement('div');
    card.className = 'review-card reveal';
    card.style.transitionDelay = `${index * 0.1}s`; // Muncul satu per satu
    card.innerHTML = `
      <div class="review-header">
        <div class="review-avatar">${r.name.charAt(0).toUpperCase()}</div>
        <div class="review-meta">
          <h4>${r.name}</h4>
          <div class="review-stars">${'⭐'.repeat(r.rating)}</div>
        </div>
      </div>
      <p class="review-text">"${r.text}"</p>
      <div class="review-date">${r.date}</div>
    `;
    container.appendChild(card);
    
    // Trigger visible setelah append
    setTimeout(() => card.classList.add('visible'), 50);
  });

  updateRatingStats();
}

function submitReview() {
  const nameInput = document.getElementById('reviewName');
  const textInput = document.getElementById('reviewText');
  const name = nameInput.value.trim();
  const text = textInput.value.trim();

  if (!name || !selectedRating || !text) { 
    showToast('⚠️ Mohon lengkapi semua data ulasan!'); 
    return; 
  }

  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Simpan data baru ke array
  reviews.push({ name, rating: selectedRating, text, date: dateStr });
  localStorage.setItem('nanas_reviews', JSON.stringify(reviews));

  // Refresh tampilan
  renderReviews();

  // Reset Form
  nameInput.value = '';
  textInput.value = '';
  selectedRating = 0;
  starBtns.forEach(b => b.classList.remove('active'));
  
  showToast('✅ Ulasan Anda telah berhasil dikirim!');
}

// ==========================================
// 5. UTILS & INITIALIZATION
// ==========================================
function showToast(msg) {
  const toast = document.getElementById('toast');
  if(!toast) return;
  
  toast.textContent = msg;
  toast.classList.add('show');
  
  // Hilangkan toast setelah 3 detik
  setTimeout(() => {
      toast.classList.remove('show');
  }, 3000);
}

// Jalankan saat pertama kali halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    renderReviews();
    // Jalankan observer manual sekali untuk mengecek posisi scroll awal
    window.dispatchEvent(new Event('scroll'));
});