console.log("Gaos Kinematic Concept Limited website loaded");

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    menuToggle.classList.toggle("active");
    navLinks.classList.toggle("active");
  });
}

const slides = document.querySelectorAll(".hero-slide");
let currentSlide = 0;
const slideInterval = 2500;

function showNextSlide() {
  if (!slides.length) return;
  slides[currentSlide].classList.remove("active");
  currentSlide = (currentSlide + 1) % slides.length;
  slides[currentSlide].classList.add("active");
}
if (slides.length) setInterval(showNextSlide, slideInterval);

const serviceCards = document.querySelectorAll(".service-modern-card");
serviceCards.forEach(card => {
  card.addEventListener("mousemove", e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = (x - centerX) / centerX;
    const deltaY = (y - centerY) / centerY;
    card.style.transform = `rotateX(${deltaY * 5}deg) rotateY(${deltaX * 5}deg) translateY(-8px)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "rotateX(0) rotateY(0) translateY(0)";
  });
});

async function loadLivePhotos() {
  const grid = document.getElementById("livePhotosGrid");
  if (!grid) return;
  const db = window.gaosSupabase;
  if (!db) {
    grid.innerHTML = `<div class="empty-state">Supabase is not connected. Open js/supabase-config.js and add your project URL and anon key.</div>`;
    return;
  }

  const { data, error } = await db
    .from("live_site_photos")
    .select("id,title,survey_type,location,caption,image_url,captured_at")
    .eq("is_public", true)
    .order("captured_at", { ascending: false })
    .limit(9);

  if (error) {
    grid.innerHTML = `<div class="empty-state">Live photos could not load: ${escapeHtml(error.message)}.</div>`;
    return;
  }

  if (!data || data.length === 0) {
    grid.innerHTML = `<div class="empty-state">No live site photo has been uploaded yet.</div>`;
    return;
  }

  grid.innerHTML = data.map(item => `
    <article class="live-photo-card">
      <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title || item.survey_type || 'Live site photo')}" loading="lazy">
      <div class="live-photo-body">
        <span class="badge">${escapeHtml(item.survey_type || 'Survey Field Work')}</span>
        <h3>${escapeHtml(item.title || 'Live Site Update')}</h3>
        <p class="live-location">📍 ${escapeHtml(item.location || 'Location not specified')}</p>
        <p>${escapeHtml(item.caption || '')}</p>
        <small>${formatDate(item.captured_at)}</small>
      </div>
    </article>
  `).join("");
}

async function loadLatestReviews() {
  const wrap = document.getElementById("latestReviews");
  if (!wrap) return;
  const db = window.gaosSupabase;
  if (!db) {
    wrap.innerHTML = `<p class="muted-small">Supabase is not connected yet.</p>`;
    return;
  }

  const { data, error } = await db
    .from("reviews")
    .select("name,project_type,rating,message,created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    wrap.innerHTML = `<p class="muted-small">Approved reviews could not load: ${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    wrap.innerHTML = `<div class="review-empty-box">Approved client reviews will appear here after admin approval.</div>`;
    return;
  }

  wrap.innerHTML = data.map(r => `
    <article class="review-mini-card polished-review">
      <div class="review-card-head">
        <div class="review-avatar">${getInitials(r.name)}</div>
        <div>
          <strong>${escapeHtml(r.name || 'Client')}</strong>
          <small>${escapeHtml(r.project_type || 'Gaos Kinematic Client')}</small>
        </div>
      </div>
      <div class="stars" aria-label="${Number(r.rating || 5)} star rating">${renderStars(r.rating)}</div>
      <p>“${escapeHtml(r.message)}”</p>
      <time>${formatDate(r.created_at)}</time>
    </article>
  `).join("");
}

function setupReviewForm() {
  const form = document.getElementById("reviewForm");
  const status = document.getElementById("reviewStatus");
  if (!form) return;
  const db = window.gaosSupabase;
  if (!db) {
    status.textContent = "Supabase is not connected. Please update js/supabase-config.js.";
    return;
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    status.textContent = "Submitting review...";
    const fd = new FormData(form);
    const payload = {
      name: fd.get("name")?.trim(),
      email: fd.get("email")?.trim(),
      project_type: fd.get("project_type")?.trim(),
      rating: Number(fd.get("rating")),
      message: fd.get("message")?.trim(),
      is_public: false
    };

    const { error } = await db.from("reviews").insert(payload);
    if (error) {
      status.textContent = "Review could not be saved. Please check Supabase settings.";
      return;
    }

    try {
      await fetch(window.GAOS_REVIEW_EMAIL_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${window.GAOS_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(payload)
      });
    } catch (_) {
      console.warn("Email function not reachable. Review was still saved in Supabase.");
    }

    status.textContent = "Thank you. Your review has been submitted successfully.";
    form.reset();
  });
}

function setupContactForm() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("contactStatus");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = fd.get("Full Name") || "Website Visitor";
    const email = fd.get("Email") || "";
    const phone = fd.get("Phone") || "";
    const message = fd.get("Message") || "";
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`);
    window.location.href = `mailto:gaoskinematics@gmail.com?subject=Website Contact Message from ${encodeURIComponent(name)}&body=${body}`;
    if (status) status.textContent = "Your email app has been opened. Please send the message from there.";
    form.reset();
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[char]));
}

function renderStars(rating = 5) {
  const n = Math.max(1, Math.min(5, Number(rating) || 5));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function getInitials(name = "Client") {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("") || "C";
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

document.addEventListener("DOMContentLoaded", () => {
  loadLivePhotos();
  loadLatestReviews();
  setupReviewForm();
  setupContactForm();
});
