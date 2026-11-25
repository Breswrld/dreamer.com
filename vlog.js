const video = document.getElementById("networkingVideo");
const chapterButtons = Array.from(document.querySelectorAll(".vlog-chapter-btn"));

function updateActiveChapter(currentTime) {
    if (chapterButtons.length === 0) return;

    let activeButton = chapterButtons[0];
    for (const button of chapterButtons) {
        const time = Number(button.dataset.time || 0);
        if (currentTime >= time) {
            activeButton = button;
        }
    }

    for (const button of chapterButtons) {
        button.classList.toggle("is-active", button === activeButton);
    }
}

chapterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        if (!video) return;
        const seconds = Number(button.dataset.time || 0);
        video.currentTime = seconds;
        updateActiveChapter(seconds);
        video.play().catch(() => {});
    });
});

if (video) {
    video.addEventListener("timeupdate", () => {
        updateActiveChapter(video.currentTime);
    });
}
