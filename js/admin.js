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

async function checkSession() {
  const { data } = await gaosSupabase.auth.getSession();
  const loggedIn = !!data.session;
  loginBox.style.display = loggedIn ? "none" : "block";
  uploadBox.style.display = loggedIn ? "block" : "none";
  if (loggedIn) loadAdminPhotos();
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
    adminPhotosList.innerHTML = `<div class="empty-state">${error.message}</div>`;
    return;
  }
  if (!data?.length) {
    adminPhotosList.innerHTML = `<div class="empty-state">No photo uploaded yet.</div>`;
    return;
  }

  adminPhotosList.innerHTML = data.map(item => `
    <div class="admin-photo-row">
      <img src="${item.image_url}" alt="${item.title}">
      <div>
        <strong>${item.title}</strong><br>
        <small>${item.survey_type} • ${item.location} • ${item.is_public ? "Public" : "Private"}</small>
      </div>
    </div>
  `).join("");
}

checkSession();
