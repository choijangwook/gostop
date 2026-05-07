document.addEventListener("DOMContentLoaded", () => {
  const shareBtn = document.getElementById("shareBtn");
  const modal = document.getElementById("shareModal");
  const closeBtn = document.getElementById("closeModal");

  // =========================
  // 열기 버튼
  // =========================
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      if (modal) modal.style.display = "block";
    });
  }

  // =========================
  // 닫기 버튼
  // =========================
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (modal) modal.style.display = "none";
    });
  }

  // =========================
  // 바깥 클릭 시 닫기
  // =========================
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
});
