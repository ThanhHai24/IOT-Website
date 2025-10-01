// ======================= Pagination core =======================
        function createTablePager({
        tbodyId,
        paginationId,
        prevId,
        nextId,
        pageInfoId,
        rowsPerPage = 10
        }){
        const tbody = document.getElementById(tbodyId);
        const pagination = document.getElementById(paginationId);
        const prevBtn = document.getElementById(prevId);
        const nextBtn = document.getElementById(nextId);
        const pageInfo = document.getElementById(pageInfoId);

        if (!tbody || !pagination || !prevBtn || !nextBtn || !pageInfo) {
            console.warn('[Pager] Missing required element(s).');
            return null;
        }

        let rows = Array.from(tbody.querySelectorAll('tr'));
        let currentPage = 1;

        function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

        function buildPageList(curr, total){
            // Trường hợp ít trang: hiển thị tất cả
            if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);

            const list = [1];
            if (curr > 3) list.push('...');

            const start = Math.max(2, curr - 1);
            const end   = Math.min(total - 1, curr + 1);
            for (let i = start; i <= end; i++) list.push(i);

            if (curr < total - 2) list.push('...');
            list.push(total);
            return list;
        }

        function drawPagination(pageCount){
            pagination.innerHTML = '';

            const pages = buildPageList(currentPage, pageCount);
            pages.forEach(p => {
            if (p === '...'){
                const span = document.createElement('span');
                span.textContent = '…';
                span.className = 'dots';
                pagination.appendChild(span);
            } else {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.textContent = p;
                if (p === currentPage) btn.classList.add('active');
                btn.addEventListener('click', () => renderPage(p));
                pagination.appendChild(btn);
            }
            });
        }

        function renderPage(page){
            rows = Array.from(tbody.querySelectorAll('tr')); // đề phòng thêm/xóa dòng động
            const totalRows = rows.length;
            const pageCount = Math.max(1, Math.ceil(totalRows / rowsPerPage));
            currentPage = clamp(page, 1, pageCount);

            const start = (currentPage - 1) * rowsPerPage;
            const end = Math.min(start + rowsPerPage, totalRows);

            rows.forEach((tr, i) => {
            tr.style.display = (i >= start && i < end) ? '' : 'none';
            });

            // Cập nhật thanh số trang + nút prev/next
            drawPagination(pageCount);
            prevBtn.disabled = currentPage === 1;
            nextBtn.disabled = currentPage === pageCount;

            // Cập nhật "Hiển thị a–b / n"
            pageInfo.textContent = totalRows
            ? `Hiển thị ${start + 1}–${end} / ${totalRows}`
            : 'Không có dữ liệu';
        }

        // Sự kiện Prev/Next
        prevBtn.addEventListener('click', () => renderPage(currentPage - 1));
        nextBtn.addEventListener('click', () => renderPage(currentPage + 1));

        // API public
        const api = {
            refresh(){ renderPage(1); },
            goTo(p){ renderPage(Number(p) || 1); },
            setRowsPerPage(n){
            rowsPerPage = Math.max(1, Number(n) || rowsPerPage);
            renderPage(1);
            },
            get currentPage(){ return currentPage; },
            get totalRows(){ return tbody.querySelectorAll('tr').length; }
        };

        // Khởi tạo
        renderPage(1);
        return api;
        }

        // ======================= Init for your table =======================
        // Gọi sau khi DOM sẵn sàng (đặt script cuối body là được)
        const sensorPager = createTablePager({
        tbodyId: 'DataTable',
        paginationId: 'pagination',
        prevId: 'prevPage',
        nextId: 'nextPage',
        pageInfoId: 'pageInfo',
        rowsPerPage: 10   // đổi ở chỗ khác bằng sensorPager.setRowsPerPage(20)
        });

        // Ví dụ dùng API (nếu cần):
        // sensorPager.setRowsPerPage(20);
        // sensorPager.goTo(3);
        // sensorPager.refresh(); // khi bạn thay đổi tbody (thêm/xóa hàng)
