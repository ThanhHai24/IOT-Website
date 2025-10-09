// ======================= Pagination Utils (server-side) =======================
export function buildPageList(curr, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const list = [1];
  if (curr > 3) list.push("...");

  const start = Math.max(2, curr - 1);
  const end = Math.min(total - 1, curr + 1);
  for (let i = start; i <= end; i++) list.push(i);

  if (curr < total - 2) list.push("...");
  list.push(total);
  return list;
}

export function renderPagination({
  containerId,
  prevId,
  nextId,
  pageInfoId,
  pagination,   // { page, limit, total, totalPages }
  onPageChange  // callback khi đổi trang
}) {
  const { page, limit, total, totalPages } = pagination;
  const container = document.getElementById(containerId);
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);
  const pageInfo = document.getElementById(pageInfoId);

  if (!container || !prevBtn || !nextBtn || !pageInfo) {
    console.warn("[Pagination] Missing DOM refs");
    return;
  }

  // cập nhật pageInfo
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  pageInfo.textContent = total > 0
    ? `Display ${start}–${end} / ${total}`
    : "No records";

  // reset container
  container.innerHTML = "";

  // danh sách trang rút gọn
  const pages = buildPageList(page, totalPages);
  pages.forEach(p => {
    if (p === "...") {
      const span = document.createElement("span");
      span.textContent = "…";
      span.className = "dots";
      container.appendChild(span);
    } else {
      const btn = document.createElement("button");
      btn.textContent = p;
      if (p === page) btn.classList.add("active");
      btn.addEventListener("click", () => onPageChange(p));
      container.appendChild(btn);
    }
  });

  // Prev/Next
  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page >= totalPages;

  prevBtn.onclick = () => {
    if (page > 1) onPageChange(page - 1);
  };
  nextBtn.onclick = () => {
    if (page < totalPages) onPageChange(page + 1);
  };
}
