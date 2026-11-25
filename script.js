const hamburger = document.querySelector(".hamburger");
const nav = document.querySelector("nav");
const overlay = document.querySelector(".overlay");

let lastScrollY = window.scrollY;
let isScrollingDown = false;

function setMobileNavOpen(open) {
    if (!nav || !hamburger) return;
    nav.classList.toggle("active", open);
    document.body.classList.toggle("nav-open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    if (open) {
        hamburger.style.display = "none";
    } else {
        hamburger.style.display = "";
    }
}

if (hamburger && nav && overlay) {
    hamburger.addEventListener("click", () => {
        setMobileNavOpen(!nav.classList.contains("active"));
    });

    overlay.addEventListener("click", () => {
        setMobileNavOpen(false);
    });

    document.body.addEventListener("click", (event) => {
        if (
            nav.classList.contains("active") &&
            !nav.contains(event.target) &&
            event.target !== hamburger
        ) {
            setMobileNavOpen(false);
        }
    });

    window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;
        if (!nav.classList.contains("active")) {
            if (currentScrollY > lastScrollY && !isScrollingDown) {
                hamburger.classList.add("hide");
                isScrollingDown = true;
            } else if (currentScrollY < lastScrollY && isScrollingDown) {
                hamburger.classList.remove("hide");
                isScrollingDown = false;
            }
        }
        lastScrollY = currentScrollY;
    });
}

// --- Interactive Book Logic (3 spreads on desktop/tablet, 6 single pages on phone) ---
const TOTAL_SPREADS = 3;
const TOTAL_PAGES = 6;
const phoneQuery = window.matchMedia("(max-width: 600px)");

let currentPage = 0; // 0..5 (spread = Math.floor(currentPage / 2))
let isFlipping = false;

const bookStage = document.getElementById("bookStage");
const phoneBookCover = document.getElementById("phoneBookCover");
const openBookBtn = document.getElementById("openBookBtn");
const closeCoverBtn = document.getElementById("closeCoverBtn");
const bookEl = document.getElementById("book");
const leftPage = document.getElementById("leftPage");
const rightPage = document.getElementById("rightPage");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const prevEdgeBtn = document.getElementById("prevEdgeBtn");
const nextEdgeBtn = document.getElementById("nextEdgeBtn");
const pageCounter = document.getElementById("pageCounter");
const flipSheet = document.getElementById("flipSheet");
const chapterTabs = Array.from(document.querySelectorAll(".chapter-tab[data-target]"));
const spreadArticles = Array.from(document.querySelectorAll(".spread-content"));

function isPhoneMode() {
    return phoneQuery.matches;
}

function updateBookDOM(targetPage) {
    currentPage = Math.max(0, Math.min(TOTAL_PAGES - 1, targetPage));
    const spreadIndex = Math.floor(currentPage / 2);
    const activeSide = currentPage % 2 === 0 ? "left" : "right";
    const singlePage = isPhoneMode();

    if (leftPage && rightPage) {
        leftPage.classList.toggle("is-phone-hidden", singlePage && activeSide !== "left");
        rightPage.classList.toggle("is-phone-hidden", singlePage && activeSide !== "right");
    }

    spreadArticles.forEach((article) => {
        const articleSpread = Number(article.getAttribute("data-spread"));
        const articleSide = article.getAttribute("data-side");
        const isCurrent = singlePage
            ? articleSpread === spreadIndex && articleSide === activeSide
            : articleSpread === spreadIndex;

        if (isCurrent) {
            article.removeAttribute("hidden");
            requestAnimationFrame(() => {
                article.classList.add("is-active");
            });
        } else {
            article.classList.remove("is-active");
            article.setAttribute("hidden", "");
        }
    });

    chapterTabs.forEach((tab) => {
        const idx = Number(tab.getAttribute("data-target"));
        const active = idx === spreadIndex;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-pressed", String(active));
    });

    if (pageCounter) {
        pageCounter.textContent = `Page ${currentPage + 1} of ${TOTAL_PAGES}`;
    }

    const atStart = singlePage ? currentPage === 0 : spreadIndex === 0;
    const atEnd = singlePage ? currentPage === TOTAL_PAGES - 1 : spreadIndex === TOTAL_SPREADS - 1;

    if (prevBtn) prevBtn.disabled = atStart;
    if (prevEdgeBtn) prevEdgeBtn.disabled = atStart;
    if (nextBtn) nextBtn.disabled = atEnd;
    if (nextEdgeBtn) nextEdgeBtn.disabled = atEnd;
}

function navigateToPage(targetPage) {
    const singlePage = isPhoneMode();
    const clampedPage = Math.max(0, Math.min(TOTAL_PAGES - 1, targetPage));
    const normalizedTarget = singlePage ? clampedPage : Math.floor(clampedPage / 2) * 2;
    const currentNormalized = singlePage ? currentPage : Math.floor(currentPage / 2) * 2;

    if (normalizedTarget === currentNormalized || isFlipping) {
        return;
    }

    const direction = normalizedTarget > currentNormalized ? "forward" : "backward";
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!flipSheet || prefersReducedMotion) {
        updateBookDOM(normalizedTarget);
        return;
    }

    isFlipping = true;
    const animClass = direction === "forward" ? "is-flipping-forward" : "is-flipping-backward";
    flipSheet.classList.remove("is-flipping-forward", "is-flipping-backward");
    void flipSheet.offsetWidth;
    flipSheet.classList.add(animClass);

    window.setTimeout(() => {
        updateBookDOM(normalizedTarget);
    }, 190);

    window.setTimeout(() => {
        flipSheet.classList.remove(animClass);
        isFlipping = false;
    }, 460);
}

function stepBook(delta) {
    const step = isPhoneMode() ? delta : delta * 2;
    navigateToPage(currentPage + step);
}

function openPhoneCover() {
    if (!bookStage || !isPhoneMode()) return;
    if (
        !bookStage.classList.contains("is-phone-cover-closed") ||
        bookStage.classList.contains("is-phone-cover-opening")
    ) {
        return;
    }

    updateBookDOM(0);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bookStage.classList.remove("is-phone-cover-closed");

    if (prefersReducedMotion) {
        return;
    }

    bookStage.classList.add("is-phone-cover-opening");
    window.setTimeout(() => {
        bookStage.classList.remove("is-phone-cover-opening");
    }, 520);
}

function closePhoneCover() {
    if (!bookStage || !isPhoneMode()) return;
    bookStage.classList.remove("is-phone-cover-opening");
    bookStage.classList.add("is-phone-cover-closed");
}

if (openBookBtn) {
    openBookBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openPhoneCover();
    });
}

if (phoneBookCover) {
    phoneBookCover.addEventListener("click", openPhoneCover);
}

if (closeCoverBtn) {
    closeCoverBtn.addEventListener("click", closePhoneCover);
}

if (prevBtn) prevBtn.addEventListener("click", () => stepBook(-1));
if (prevEdgeBtn) prevEdgeBtn.addEventListener("click", () => stepBook(-1));
if (nextBtn) nextBtn.addEventListener("click", () => stepBook(1));
if (nextEdgeBtn) nextEdgeBtn.addEventListener("click", () => stepBook(1));

chapterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const targetSpread = Number(tab.getAttribute("data-target"));
        navigateToPage(targetSpread * 2);
    });
});

// Touch swipe support on phone book
if (bookEl) {
    let touchStartX = 0;
    let touchStartY = 0;

    bookEl.addEventListener(
        "touchstart",
        (event) => {
            if (event.touches.length !== 1) return;
            touchStartX = event.touches[0].clientX;
            touchStartY = event.touches[0].clientY;
        },
        { passive: true }
    );

    bookEl.addEventListener(
        "touchend",
        (event) => {
            if (!isPhoneMode() || event.changedTouches.length !== 1) return;
            const dx = event.changedTouches[0].clientX - touchStartX;
            const dy = event.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
                stepBook(dx < 0 ? 1 : -1);
            }
        },
        { passive: true }
    );
}

if (typeof phoneQuery.addEventListener === "function") {
    phoneQuery.addEventListener("change", () => {
        updateBookDOM(currentPage);
    });
} else {
    window.addEventListener("resize", () => {
        updateBookDOM(currentPage);
    });
}

updateBookDOM(0);

// --- Collage Lightbox ---
const collageTrigger = document.getElementById("collageTrigger");
const lightbox = document.getElementById("lightbox");
const lightboxBackdrop = document.getElementById("lightboxBackdrop");
const lightboxClose = document.getElementById("lightboxClose");

function openLightbox() {
    if (!lightbox) return;
    lightbox.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    if (lightboxClose) lightboxClose.focus();
}

function closeLightbox() {
    if (!lightbox) return;
    lightbox.setAttribute("hidden", "");
    document.body.style.overflow = "";
    if (collageTrigger) collageTrigger.focus();
}

if (collageTrigger && lightbox) {
    collageTrigger.addEventListener("click", openLightbox);
}
if (lightboxBackdrop) {
    lightboxBackdrop.addEventListener("click", closeLightbox);
}
if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
}

document.addEventListener("keydown", (event) => {
    const lightboxOpen = lightbox && !lightbox.hasAttribute("hidden");
    if (event.key === "Escape" && lightboxOpen) {
        closeLightbox();
        return;
    }
    if (!lightboxOpen) {
        if (event.key === "ArrowRight") {
            stepBook(1);
        } else if (event.key === "ArrowLeft") {
            stepBook(-1);
        }
    }
});
