const toggleButtons = document.querySelectorAll(".toggle-btn");
const priceCards = document.querySelectorAll(".price-card");
const faqItems = document.querySelectorAll(".faq-item");
const marqueeRows = document.querySelectorAll(".marquee");

const revealItems = document.querySelectorAll(".reveal, .reveal-item");
if (revealItems.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px 15% 0px" }
  );

  revealItems.forEach((item, index) => {
    const localIndex = index % 6;
    const delay = Math.min(localIndex * 0.06, 0.36);
    item.style.setProperty("--delay", `${delay}s`);
    revealObserver.observe(item);
  });
}

toggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    toggleButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    const plan = button.dataset.plan;

    priceCards.forEach((card) => {
      const price = plan === "month" ? card.dataset.monthPrice : card.dataset.framePrice;
      const subText = plan === "month" ? card.dataset.monthText : card.dataset.frameText;
      const priceStrong = card.querySelector(".price strong");
      const priceEm = card.querySelector(".price em");

      if (priceStrong && priceEm) {
        priceStrong.textContent = price;
        priceEm.textContent = subText || "";
      }
    });
  });
});

faqItems.forEach((item) => {
  item.addEventListener("click", () => {
    const panel = item.nextElementSibling;
    if (!panel) return;
    panel.classList.toggle("open");
    const isOpen = panel.classList.contains("open");
    panel.setAttribute("aria-hidden", String(!isOpen));
    item.setAttribute("aria-expanded", String(isOpen));
    item.querySelector(".plus").textContent = isOpen ? "-" : "+";
  });
});

const setupMarqueeRow = (row) => {
  const inner = row.querySelector(".marquee-inner");
  if (!inner) return;
  const tracks = inner.querySelectorAll(".marquee-track");
  if (!tracks.length) return;
  const baseTrack = tracks[0];

  tracks.forEach((track, index) => {
    if (index > 0) track.remove();
  });

  if (!baseTrack.dataset.items) {
    baseTrack.dataset.items = baseTrack.innerHTML;
  }
  baseTrack.innerHTML = baseTrack.dataset.items;

  const rowWidth = row.getBoundingClientRect().width;
  if (!rowWidth) return;

  let safety = 0;
  while (baseTrack.scrollWidth < rowWidth + 100 && safety < 20) {
    baseTrack.innerHTML += baseTrack.dataset.items;
    safety += 1;
  }

  const trackWidth = baseTrack.scrollWidth;
  baseTrack.style.minWidth = `${trackWidth}px`;

  const clone = baseTrack.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  clone.style.minWidth = `${trackWidth}px`;
  inner.appendChild(clone);
  inner.style.width = `${trackWidth * 2}px`;

  row.dataset.marqueeWidth = String(rowWidth);
  row.dataset.marqueeDistance = String(trackWidth);
  return { inner, distance: trackWidth };
};

const marqueeState = new Map();
let marqueeFrame = null;
let marqueeLastTime = 0;
const MARQUEE_SPEED = 70;

const rebuildMarquee = () => {
  marqueeRows.forEach((row) => {
    const rowWidth = row.getBoundingClientRect().width;
    if (!rowWidth) return;
    const previousWidth = Number(row.dataset.marqueeWidth || 0);
    if (previousWidth && Math.abs(rowWidth - previousWidth) < 1) return;

    const config = setupMarqueeRow(row);
    if (!config) return;
    const { inner, distance } = config;
    inner.style.transform = "translate3d(0, 0, 0)";
    inner.style.animation = "none";

    marqueeState.set(row, {
      inner,
      distance,
      offset: 0,
      speed: MARQUEE_SPEED,
    });
  });
};

const animateMarquee = (timestamp) => {
  if (!marqueeLastTime) marqueeLastTime = timestamp;
  const delta = (timestamp - marqueeLastTime) / 1000;
  marqueeLastTime = timestamp;

  marqueeState.forEach((state) => {
    state.offset = (state.offset + state.speed * delta) % state.distance;
    state.inner.style.transform = `translate3d(${-state.offset}px, 0, 0)`;
  });

  marqueeFrame = window.requestAnimationFrame(animateMarquee);
};

const startMarquee = () => {
  if (marqueeFrame || !marqueeRows.length) return;
  marqueeLastTime = 0;
  marqueeFrame = window.requestAnimationFrame(animateMarquee);
};

const scheduleMarqueeBuild = () => {
  window.requestAnimationFrame(() => {
    rebuildMarquee();
    if (!marqueeFrame && marqueeState.size) {
      startMarquee();
    }
  });
};

scheduleMarqueeBuild();

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(scheduleMarqueeBuild);
}

let marqueeResizeTimer = null;
const marqueeObserver = new ResizeObserver(() => {
  window.clearTimeout(marqueeResizeTimer);
  marqueeResizeTimer = window.setTimeout(scheduleMarqueeBuild, 120);
});

marqueeRows.forEach((row) => marqueeObserver.observe(row));
