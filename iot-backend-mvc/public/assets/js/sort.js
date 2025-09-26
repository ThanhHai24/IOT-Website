document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("thead th").forEach(th => {
            th.addEventListener("click", () => {
            let newOrder;

            if (th.classList.contains("asc")) {
                resetOthers(th);
                th.classList.remove("asc");
                th.classList.add("desc");
                newOrder = "desc";
            } else if (th.classList.contains("desc")) {
                resetOthers(th);
                th.classList.remove("desc");
                th.classList.add("asc");
                newOrder = "asc";
            } else {
                resetOthers(th);
                th.classList.remove("inactive");
                th.classList.add("asc");
                newOrder = "asc";
            }

            // Lấy field từ data-sort attribute
            const field = th.dataset.sort || "measured_at";

            // Gọi API loadTable với sort + order mới
            loadTable({
                search: searchInput.value,
                field: dataTypeSelect.value,
                sort: field,
                order: newOrder
            });
            });
        });

        function resetOthers(activeTh) {
            document.querySelectorAll("thead th").forEach(col => {
            if (col !== activeTh) {
                col.classList.remove("asc", "desc");
                col.classList.add("inactive");
            }
            });
        }
        });