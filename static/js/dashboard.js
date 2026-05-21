// ===============================
// GLOBAL VARIABLES
// ===============================
let allOrders = [];
let orderChart = null;


// ===============================
// LOAD ORDERS
// ===============================
fetch('/orders')
    .then(res => res.json())
    .then(data => {

        // Normalize field names
        allOrders = data.map(order => ({
            ID: order.ID || order.id,
            UserName: order.UserName || order.userName || "",
            Product: order.Product || order.product || "",
            PhoneNumber: order.PhoneNumber || order.phoneNumber || "",
            Quantity: order.Quantity || order.quantity || 0,
            Status: order.Status || order.status || "Pending"
        }));

        // Initial Render
        renderDashboard();

        // Search Event
        const searchInput = document.getElementById("orderSearch");
        if (searchInput) {
            searchInput.addEventListener("input", renderDashboard);
        }

        // Sort Event
        const sortSelect = document.getElementById("orderSort");
        if (sortSelect) {
            sortSelect.addEventListener("change", renderDashboard);
        }
    })
    .catch(error => {
        console.error("Error loading orders:", error);
    });


// ===============================
// RENDER DASHBOARD
// ===============================
function renderDashboard() {

    // Search Value
    const searchElement = document.getElementById("orderSearch");
    const search = searchElement
        ? searchElement.value.toLowerCase().trim()
        : "";

    // Sort Value
    const sortElement = document.getElementById("orderSort");
    const sortValue = sortElement ? sortElement.value : "";

    // Filter Orders
    let filteredOrders = allOrders.filter(order =>
        order.UserName.toLowerCase().includes(search) ||
        order.Product.toLowerCase().includes(search) ||
        order.PhoneNumber.toLowerCase().includes(search)
    );

    // Apply Sorting
    switch (sortValue) {
        case "newest":
            filteredOrders.sort((a, b) => b.ID - a.ID);
            break;

        case "oldest":
            filteredOrders.sort((a, b) => a.ID - b.ID);
            break;

        case "qtyHigh":
            filteredOrders.sort((a, b) => b.Quantity - a.Quantity);
            break;

        case "qtyLow":
            filteredOrders.sort((a, b) => a.Quantity - b.Quantity);
            break;

        case "nameAZ":
            filteredOrders.sort((a, b) =>
                a.UserName.localeCompare(b.UserName)
            );
            break;
    }

    // Update Dashboard Counts (based on ALL orders)
    updateCounts(allOrders);

    // Render Orders Table
    renderTable(filteredOrders);

    // Render Chart (based on ALL orders)
    renderChart(allOrders);
}


// ===============================
// UPDATE DASHBOARD COUNTS
// ===============================
function updateCounts(orders) {

    const totalOrders = orders.length;
    const pending = orders.filter(o => o.Status === "Pending").length;
    const approved = orders.filter(o => o.Status === "Approved").length;
    const rejected = orders.filter(o => o.Status === "Rejected").length;

    const totalOrdersEl = document.getElementById("totalOrders");
    const pendingEl = document.getElementById("pendingOrders");
    const approvedEl = document.getElementById("approvedOrders");
    const rejectedEl = document.getElementById("rejectedOrders");

    if (totalOrdersEl) totalOrdersEl.innerText = totalOrders;
    if (pendingEl) pendingEl.innerText = pending;
    if (approvedEl) approvedEl.innerText = approved;
    if (rejectedEl) rejectedEl.innerText = rejected;
}


// ===============================
// RENDER TABLE
// ===============================
function renderTable(orders) {

    const tableBody = document.getElementById("orderTable");
    if (!tableBody) return;

    let table = "";

    if (orders.length === 0) {
        table = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    No orders found
                </td>
            </tr>
        `;
    } else {
        orders.forEach(order => {
            table += `
                <tr>
                    <td>${order.UserName || "N/A"}</td>
                    <td>${order.Product || "N/A"}</td>
                    <td>${order.PhoneNumber || "N/A"}</td>
                    <td>${order.Quantity}</td>
                    <td>
                        ${
                            order.Status === "Approved"
                                ? '<span class="badge bg-success px-3 py-2">Approved</span>'
                                : order.Status === "Rejected"
                                ? '<span class="badge bg-danger px-3 py-2">Rejected</span>'
                                : '<span class="badge bg-warning text-dark px-3 py-2">Pending</span>'
                        }
                    </td>
                    <td>
                        ${
                            order.Status === "Pending"
                                ? `
                                    <button onclick="approve(${order.ID})"
                                            class="btn btn-success btn-sm me-1">
                                        Approve
                                    </button>

                                    <button onclick="reject(${order.ID})"
                                            class="btn btn-danger btn-sm me-1">
                                        Reject
                                    </button>
                                  `
                                : '<span class="text-muted">No Action</span>'
                        }

                        <button onclick="deleteOrder(${order.ID})"
                                class="btn btn-danger btn-sm px-3 fw-bold shadow">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    tableBody.innerHTML = table;
}


// ===============================
// RENDER CHART
// ===============================
function renderChart(orders) {

    const chartCanvas = document.getElementById("orderChart");
    if (!chartCanvas) return;

    const approved = orders.filter(o => o.Status === "Approved").length;
    const rejected = orders.filter(o => o.Status === "Rejected").length;
    const pending = orders.filter(o => o.Status === "Pending").length;

    // Destroy existing chart before creating new one
    if (orderChart) {
        orderChart.destroy();
    }

    orderChart = new Chart(chartCanvas, {
        type: "pie",
        data: {
            labels: ["Approved", "Rejected", "Pending"],
            datasets: [{
                label: "Orders",
                data: [approved, rejected, pending],
                backgroundColor: [
                    "#198754", // Green
                    "#dc3545", // Red
                    "#ffc107"  // Yellow
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}


// ===============================
// APPROVE ORDER
// ===============================
function approve(id) {
    fetch(`/order/${id}/approve`, {
        method: "PUT"
    })
        .then(() => {
            showToast("✅ Order Approved", "success");
            setTimeout(() => location.reload(), 1000);
        });
}


// ===============================
// REJECT ORDER
// ===============================
function reject(id) {
    fetch(`/order/${id}/reject`, {
        method: "PUT"
    })
        .then(() => {
            showToast("❌ Order Rejected", "danger");
            setTimeout(() => location.reload(), 1000);
        });
}


// ===============================
// DELETE ORDER
// ===============================
function deleteOrder(id) {

    if (!confirm("Are you sure you want to delete this order?")) {
        return;
    }

    fetch(`/order/${id}`, {
        method: "DELETE"
    })
        .then(() => {
            showToast("🗑️ Order Deleted", "warning");
            setTimeout(() => location.reload(), 1000);
        });
}


// ===============================
// TOAST MESSAGE
// ===============================
function showToast(message, type) {

    const toastElement = document.getElementById("liveToast");
    const toastMessage = document.getElementById("toastMessage");

    if (!toastElement || !toastMessage) return;

    toastMessage.innerText = message;

    toastElement.className =
        `toast align-items-center text-bg-${type} border-0`;

    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}


// ===============================
// OPTIONAL FUNCTIONS
// (HTML me already referenced)
// ===============================
function applySorting() {
    renderDashboard();
}

function searchOrders() {
    renderDashboard();
}

function filterOrdersByDate() {
    // Future enhancement
    renderDashboard();
}

function setTodayOrders() {
    // Future enhancement
    renderDashboard();
}