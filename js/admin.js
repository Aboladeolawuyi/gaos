const loginBox = document.getElementById("loginBox");
const uploadBox = document.getElementById("uploadBox");
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const logoutBtn = document.getElementById("logoutBtn");
const photoForm = document.getElementById("photoForm");
const photoStatus = document.getElementById("photoStatus");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const adminPhotosList = document.getElementById("adminPhotosList");
const adminReviewsList = document.getElementById("adminReviewsList");
const refreshReviewsBtn = document.getElementById("refreshReviewsBtn");

async function checkSession() {
  const { data } = await gaosSupabase.auth.getSession();
  const loggedIn = !!data.session;
  loginBox.style.display = loggedIn ? "none" : "block";
  uploadBox.style.display = loggedIn ? "block" : "none";
  if (loggedIn) {
    loadAdminPhotos();
    loadAdminReviews();
  }
}

loginForm?.addEventListener("submit", async e => {
  e.preventDefault();
  loginStatus.textContent = "Logging in...";
  const fd = new FormData(loginForm);
  const { error } = await gaosSupabase.auth.signInWithPassword({
    email: fd.get("email"),
    password: fd.get("password")
  });
  if (error) {
    loginStatus.textContent = error.message;
    return;
  }
  loginStatus.textContent = "Login successful.";
  loginForm.reset();
  checkSession();
});

logoutBtn?.addEventListener("click", async () => {
  await gaosSupabase.auth.signOut();
  checkSession();
});

photoInput?.addEventListener("change", () => {
  const file = photoInput.files?.[0];
  if (!file) return;
  photoPreview.src = URL.createObjectURL(file);
  photoPreview.style.display = "block";
});

photoForm?.addEventListener("submit", async e => {
  e.preventDefault();
  photoStatus.textContent = "Uploading photo...";

  const { data: sessionData } = await gaosSupabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) {
    photoStatus.textContent = "You must login first.";
    return;
  }

  const fd = new FormData(photoForm);
  const file = fd.get("photo");
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  const filePath = `${user.id}/${safeName}`;

  const { error: uploadError } = await gaosSupabase.storage
    .from("live-site-photos")
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    photoStatus.textContent = uploadError.message;
    return;
  }

  const { data: publicData } = gaosSupabase.storage
    .from("live-site-photos")
    .getPublicUrl(filePath);

  const record = {
    title: fd.get("title")?.trim(),
    survey_type: fd.get("survey_type")?.trim(),
    location: fd.get("location")?.trim(),
    caption: fd.get("caption")?.trim(),
    image_url: publicData.publicUrl,
    storage_path: filePath,
    is_public: fd.get("is_public") === "on",
    uploaded_by: user.id
  };

  const { error: dbError } = await gaosSupabase.from("live_site_photos").insert(record);
  if (dbError) {
    photoStatus.textContent = dbError.message;
    return;
  }

  photoStatus.textContent = "Photo uploaded successfully.";
  photoForm.reset();
  photoPreview.style.display = "none";
  loadAdminPhotos();
});

async function loadAdminPhotos() {
  const { data, error } = await gaosSupabase
    .from("live_site_photos")
    .select("title,survey_type,location,image_url,captured_at,is_public")
    .order("captured_at", { ascending: false })
    .limit(10);

  if (error) {
    adminPhotosList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    return;
  }
  if (!data?.length) {
    adminPhotosList.innerHTML = `<div class="empty-state">No photo uploaded yet.</div>`;
    return;
  }

  adminPhotosList.innerHTML = data.map(item => `
    <div class="admin-photo-row">
      <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title || 'Site photo')}">
      <div>
        <strong>${escapeHtml(item.title || 'Untitled photo')}</strong><br>
        <small>${escapeHtml(item.survey_type || '')} • ${escapeHtml(item.location || '')} • ${item.is_public ? "Public" : "Private"}</small>
      </div>
    </div>
  `).join("");
}

async function loadAdminReviews() {
  if (!adminReviewsList) return;
  adminReviewsList.innerHTML = `<div class="empty-state">Loading reviews...</div>`;

  const { data, error } = await gaosSupabase
    .from("reviews")
    .select("id,name,email,project_type,rating,message,is_public,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    adminReviewsList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    return;
  }

  if (!data?.length) {
    adminReviewsList.innerHTML = `<div class="empty-state">No review has been submitted yet.</div>`;
    return;
  }

  adminReviewsList.innerHTML = data.map(review => `
    <article class="admin-review-card" data-review-id="${review.id}">
      <div class="admin-review-top">
        <div>
          <div class="stars admin-stars">${renderStars(review.rating)}</div>
          <h3>${escapeHtml(review.name)}</h3>
          <p class="muted-small">${escapeHtml(review.email)} • ${escapeHtml(review.project_type || 'General Review')} • ${formatDate(review.created_at)}</p>
        </div>
        <label class="switch-wrap" title="Show or hide this review on the homepage">
          <input type="checkbox" class="review-visibility-toggle" data-id="${review.id}" ${review.is_public ? 'checked' : ''}>
          <span class="switch-slider"></span>
          <span class="switch-label">${review.is_public ? 'Approved' : 'Hidden'}</span>
        </label>
      </div>
      <p class="admin-review-message">“${escapeHtml(review.message)}”</p>
      <p class="review-action-status" id="reviewStatus-${review.id}"></p>
    </article>
  `).join("");

  document.querySelectorAll(".review-visibility-toggle").forEach(toggle => {
    toggle.addEventListener("change", updateReviewVisibility);
  });
}

async function updateReviewVisibility(e) {
  const toggle = e.target;
  const id = toggle.dataset.id;
  const isPublic = toggle.checked;
  const card = toggle.closest(".admin-review-card");
  const label = card?.querySelector(".switch-label");
  const status = document.getElementById(`reviewStatus-${id}`);

  toggle.disabled = true;
  if (status) status.textContent = "Updating review visibility...";

  const { error } = await gaosSupabase
    .from("reviews")
    .update({ is_public: isPublic })
    .eq("id", id);

  toggle.disabled = false;

  if (error) {
    toggle.checked = !isPublic;
    if (status) status.textContent = error.message;
    return;
  }

  if (label) label.textContent = isPublic ? "Approved" : "Hidden";
  if (status) status.textContent = isPublic ? "Review approved and visible on homepage." : "Review hidden from homepage.";
}

refreshReviewsBtn?.addEventListener("click", loadAdminReviews);

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[char]));
}

function renderStars(rating = 5) {
  const n = Math.max(1, Math.min(5, Number(rating) || 5));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

checkSession();
