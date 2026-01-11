// Reserved for animations and interactions
console.log("GAOS Kinematics Concept Ltd website loaded");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
  menuToggle.classList.toggle("active");
  navLinks.classList.toggle("active");
});
const slides = document.querySelectorAll(".hero-slide");
let currentSlide = 0;
const slideInterval = 1500; // 1.5 seconds

function showNextSlide() {
  slides[currentSlide].classList.remove("active");
  currentSlide = (currentSlide + 1) % slides.length;
  slides[currentSlide].classList.add("active");
}

// Start slider
setInterval(showNextSlide, slideInterval);

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
const statBoxes = document.querySelectorAll(".stat-box");

function animateCounter(box) {
  const counter = box.querySelector(".counter");
  if (!counter) return;

  const target = +box.getAttribute("data-target");
  let start = 0;
  const duration = 2000; // total animation time (ms)
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // ease-out animation
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(eased * target);

    counter.textContent = value + (target >= 10 ? "+" : "");

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      counter.textContent = target + (target >= 10 ? "+" : "");
    }
  }

  requestAnimationFrame(update);
}

// Scroll animation
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

statBoxes.forEach(box => observer.observe(box));