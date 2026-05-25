// ========================================
// PAGINATION VARIABLES
// ========================================
let currentPage = 1;
const rowsPerPage = 10;

async function placeOrder() {

    const customerName = document.getElementById("customerName").value;
    const customerPhone = document.getElementById("customerPhone").value;
    const selectedProduct = document.getElementById("product").value;
    const quantity = parseInt(document.getElementById("quantity").value);

    if (!customerName || !customerPhone || !selectedProduct || !quantity) {
        alert("Please fill all fields");
        return;
    }

    try {

        const res = await fetch("https://oms-dashboard.onrender.com/order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: customerName,
                phone: customerPhone,
                product: selectedProduct,
                quantity: parseInt(quantity)
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Order placed successfully");

            document.getElementById("customerName").value = "";
            document.getElementById("customerPhone").value = "";
            document.getElementById("quantity").value = "";

        } else {
            alert(data.error || "Failed to place order");
        }

    } catch (err) {
        console.error(err);
        alert("Server error");
    }
}

// ================================
// LOW STOCK ALERTS
// ================================

fetch('/low-stock-products')
.then(res => res.json())
.then(data => {

    const container = document.getElementById("lowStockAlerts");

    if (!container) return;

    if (!data.alerts || data.alerts.length === 0) {

        container.innerHTML = `
            <div class="alert alert-success">
                All products are sufficiently stocked.
            </div>
        `;

        return;
    }

    let html = "";

    data.alerts.forEach(alert => {

        html += `
            <div class="alert alert-danger mb-2">
                ${alert}
            </div>
        `;
    });

    container.innerHTML = html;
});

   function addProduct() {

    const name = document.getElementById("productName").value;
    const stock = parseInt(document.getElementById("productStock").value);
    const price = parseFloat(document.getElementById("productPrice").value);

    fetch('/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            stock: stock,
            price: price
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(" Product Added Successfully");
        location.reload();
    });
}

// ========================================
// PRODUCTS MANAGEMENT
// ========================================

// Product list load karne ke liye
function loadProducts() {
    const table = document.getElementById("productsTable");

    // Agar products page nahi hai to function stop
    if (!table) return;

    fetch('/api/products')
        .then(response => response.json())
        .then(products => {
            let html = "";

            products.forEach(product => {
                html += `
                    <tr>
                        <td>${product.id}</td>
                        <td>${product.name}</td>
                        <td>${product.stock}</td>
                        <td>₹${product.price}</td>
       <td>
    <button
        class="btn btn-warning btn-sm me-2"
        onclick="editProduct(${product.id}, '${product.name}', ${product.stock}, ${product.price})">
        Edit
    </button>

    <button
        class="btn btn-danger btn-sm"
        onclick="deleteProduct(${product.id})">
        Delete
    </button>
</td>
                `;
            });

            table.innerHTML = html;
        })
        .catch(error => {
            console.error("Error loading products:", error);
        });
}

// Product delete karne ke liye
function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) {
        return;
    }

    fetch(`/api/products/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        alert("🗑️ Product Deleted Successfully");
        loadProducts();
    });
}

// Page load hote hi products load karo

document.addEventListener("DOMContentLoaded", function () {
    loadProducts();
    loadLowStockAlerts();
    loadInventorySummary();
    loadDashboardAnalytics();
});

function editProduct(id, currentName, currentStock, currentPrice) {

    const name = prompt("Enter Product Name", currentName);
    if (name === null) return;

    const stock = prompt("Enter Stock", currentStock);
    if (stock === null) return;

    const price = prompt("Enter Price", currentPrice);
    if (price === null) return;

    fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            stock: parseInt(stock),
            price: parseFloat(price)
        })
    })
    .then(response => response.json())
    .then(data => {
        alert("✏️ Product Updated Successfully");
        loadProducts();
    });
}


// Low stock alerts load karne ke liye

function loadLowStockAlerts() {
    const container = document.getElementById("lowStockAlerts");
    if (!container) return;

    fetch('/api/products')
        .then(response => response.json())
        .then(products => {
            const lowStockProducts = products.filter(product => product.stock <= 20);

            if (lowStockProducts.length === 0) {
                container.innerHTML = `
                    <div class="alert alert-success mb-0">
                        All products are sufficiently stocked.
                    </div>
                `;
                return;
            }

            let html = '';

            lowStockProducts.forEach(product => {
                html += `
                    <div class="low-stock-row">
                        <span class="low-stock-name">${product.name}</span>
                        <span class="low-stock-badge">
                            Only ${product.stock} left
                        </span>
                    </div>
                `;
            });

            container.innerHTML = html;
        });
}


// ========================================
// ORDER MANAGEMENT
// ========================================

// Order approve karne ke liye
function approveOrder(id) {
    fetch(`/order/${id}/approve`, {
        method: 'PUT'
    })
    .then(async response => {
        const data = await response.json();

        if (!response.ok) {
            alert("❌ " + (data.error || "Unable to approve order"));
            return;
        }

        alert("✅ Order Approved Successfully");
        location.reload();
    })
    .catch(error => {
        console.error(error);
        alert("Something went wrong.");
    });
}


// Order reject karne ke liye
function rejectOrder(id) {
    fetch(`/order/${id}/reject`, {
        method: 'PUT'
    })
    .then(async response => {
        const data = await response.json();

        if (!response.ok) {
            alert("❌ " + (data.error || "Unable to reject order"));
            return;
        }

        alert("❌ Order Rejected Successfully");
        location.reload();
    })
    .catch(error => {
        console.error(error);
        alert("Something went wrong.");
    });
}

// Inventory update karne ke liye

function loadInventorySummary() {
    fetch('/api/products')
        .then(response => response.json())
        .then(products => {

            // Products count
            const totalProducts = products.length;

            // Total stock units
            const totalStock = products.reduce(
                (sum, product) => sum + product.stock,
                0
            );

            // Low stock products (<= 20)
            const lowStock = products.filter(
                product => product.stock <= 20
            ).length;

            // Total inventory value
            const totalValue = products.reduce(
                (sum, product) => sum + (product.stock * product.price),
                0
            );

            // Update UI
            document.getElementById("totalProductsCount").innerText = totalProducts;
            document.getElementById("totalStockCount").innerText = totalStock;
            document.getElementById("lowStockCount").innerText = lowStock;
            document.getElementById("inventoryValue").innerText =
                "₹" + totalValue.toLocaleString('en-IN');
        });
}


// Dashboard Analytics ke liye charts load karne ke liye

function loadDashboardAnalytics() {
    const revenueElement = document.getElementById("totalRevenue");
    const topProductElement = document.getElementById("topProduct");
    const customersElement = document.getElementById("totalCustomers");
    const topCustomerElement = document.getElementById("topCustomer");

    // Agar dashboard page par elements nahi hain
    if (!revenueElement || !topProductElement) return;

    Promise.all([
        fetch('/orders').then(res => res.json()),
        fetch('/api/products').then(res => res.json())
    ])
    .then(([orders, products]) => {

        // Global orders store karo
        allOrders = orders;

        renderOrdersTable(allOrders);

        // Date filter apply karo
        // setTodayOrders();

        // Approved orders only
        const approvedOrders = orders.filter(order =>
            (order.status || order.Status || "Pending") === "Approved"
        );

        // =====================================
        // 1. Total Revenue
        // =====================================
        let totalRevenue = 0;

        approvedOrders.forEach(order => {
            const productName = (order.product || order.Product || "").toLowerCase();

            const product = products.find(p =>
                (p.name || "").toLowerCase() === productName
            );

            if (product) {
                const qty = order.quantity || order.Quantity || 0;
                totalRevenue += qty * product.price;
            }
        });

        revenueElement.innerText =
            "₹" + totalRevenue.toLocaleString('en-IN');

        // =====================================
        // 2. Top Selling Product
        // =====================================
        const productSales = {};

        approvedOrders.forEach(order => {
            const name = order.product || order.Product || "Unknown";
            const qty = order.quantity || order.Quantity || 0;

            if (!productSales[name]) {
                productSales[name] = 0;
            }

            productSales[name] += qty;
        });

        let topProduct = "N/A";
        let maxQty = 0;

        for (const product in productSales) {
            if (productSales[product] > maxQty) {
                maxQty = productSales[product];
                topProduct = product;
            }
        }

        topProductElement.innerText = topProduct;

        // =====================================
        // 3. Total Customers
        // =====================================
        if (customersElement) {
            const uniqueCustomers = new Set();

            orders.forEach(order => {
                const customer =
                    order.userName ||
                    order.UserName ||
                    "";

                if (customer.trim() !== "") {
                    uniqueCustomers.add(
                        customer.trim().toLowerCase()
                    );
                }
            });

            customersElement.innerText =
                uniqueCustomers.size;
        }

        // =====================================
        // 4. Top Customer
        // =====================================
        if (topCustomerElement) {
            const customerOrders = {};

            approvedOrders.forEach(order => {
                const customer =
                    order.userName ||
                    order.UserName ||
                    "Unknown";

                const qty =
                    order.quantity ||
                    order.Quantity ||
                    0;

                if (!customerOrders[customer]) {
                    customerOrders[customer] = 0;
                }

                customerOrders[customer] += qty;
            });

            let bestCustomer = "N/A";
            let maxQuantity = 0;

            for (const customer in customerOrders) {
                if (customerOrders[customer] > maxQuantity) {
                    maxQuantity = customerOrders[customer];
                    bestCustomer = customer;
                }
            }

            topCustomerElement.innerText = bestCustomer;
        }

        // =====================================
        // 5. Pie Chart Refresh
        // =====================================
        const chartCanvas = document.getElementById("orderChart");

        if (chartCanvas) {
            let approvedCount = 0;
            let rejectedCount = 0;
            let pendingCount = 0;

            orders.forEach(order => {
                const status =
                    order.status ||
                    order.Status ||
                    "Pending";

                if (status === "Approved") {
                    approvedCount++;
                } else if (status === "Rejected") {
                    rejectedCount++;
                } else {
                    pendingCount++;
                }
            });

            if (window.orderChartInstance) {
                window.orderChartInstance.destroy();
            }

            window.orderChartInstance = new Chart(chartCanvas, {
                type: "pie",
                data: {
                    labels: ["Approved", "Rejected", "Pending"],
                    datasets: [{
                        data: [
                            approvedCount,
                            rejectedCount,
                            pendingCount
                        ],
                        backgroundColor: [
                            "#198754",
                            "#dc3545",
                            "#ffc107"
                        ],
                        borderColor: "#ffffff",
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            labels: {
                                color: "#ffffff"
                            }
                        }
                    }
                }
            });
        }
    })
    .catch(error => {
        console.error("Dashboard analytics error:", error);
    });
}

// Filtering orders by status

// Set today's date and filter orders
function setTodayOrders() {
    const dateInput = document.getElementById("orderDateFilter");
    if (!dateInput) return;

    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;

    filterOrdersByDate();
}

// Filter orders by selected date
function filterOrdersByDate() {

    const dateInput = document.getElementById("orderDateFilter");

    if (!dateInput) return;

    const selectedDate = dateInput.value;

    // Agar date select nahi hai
    if (!selectedDate) {
        renderOrdersTable(allOrders);
        return;
    }

    const filteredOrders = allOrders.filter(order => {

        const rawDate =
            order.CreatedAt ||
            order.createdAt ||
            order.UpdatedAt ||
            order.updatedAt;

        // Agar date nahi mili to order show karo
        if (!rawDate) return true;

        const orderDate = new Date(rawDate)
            .toISOString()
            .split("T")[0];

        return orderDate === selectedDate;
    });

    renderOrdersTable(filteredOrders);
}



// ================================
// renderOrdersTable() FUNCTION


// Update Dashboard Cards According to Filtered Orders
// ==========================
const totalOrdersElement = document.getElementById("totalOrders");
const pendingElement = document.getElementById("pendingOrders");
const approvedElement = document.getElementById("approvedOrders");
const rejectedElement = document.getElementById("rejectedOrders");

if (totalOrdersElement) {
    totalOrdersElement.innerText = orders.length;
}

if (pendingElement) {
    pendingElement.innerText =
        orders.filter(order =>
            (order.status || order.Status || "Pending") === "Pending"
        ).length;
}

if (approvedElement) {
    approvedElement.innerText =
        orders.filter(order =>
            (order.status || order.Status || "Pending") === "Approved"
        ).length;
}

if (rejectedElement) {
    rejectedElement.innerText =
        orders.filter(order =>
            (order.status || order.Status || "Pending") === "Rejected"
        ).length;
}

// ========================================
// UPDATE ANALYTICS CARDS BASED ON FILTERED ORDERS
// ========================================

Promise.all([
    fetch('/api/products').then(res => res.json())
])
.then(([products]) => {

    // Sirf approved orders
    const approvedOrders = orders.filter(
        order => (order.status || order.Status) === "Approved"
    );

    // ==========================
    // Total Revenue
    // ==========================
    let totalRevenue = 0;

    approvedOrders.forEach(order => {
        const product = products.find(
            p => p.name.toLowerCase() === (order.product || order.Product).toLowerCase()
        );

        if (product) {
            totalRevenue += (order.quantity || order.Quantity) * product.price;
        }
    });

    const revenueElement = document.getElementById("totalRevenue");
    if (revenueElement) {
        revenueElement.innerText =
            "₹" + totalRevenue.toLocaleString('en-IN');
    }

    // ==========================
    // Top Selling Product
    // ==========================
    const productSales = {};

    approvedOrders.forEach(order => {
        const productName = order.product || order.Product;

        if (!productSales[productName]) {
            productSales[productName] = 0;
        }

        productSales[productName] +=
            (order.quantity || order.Quantity);
    });

    let topProduct = "N/A";
    let maxQty = 0;

    for (const product in productSales) {
        if (productSales[product] > maxQty) {
            maxQty = productSales[product];
            topProduct = product;
        }
    }

    const topProductElement = document.getElementById("topProduct");
    if (topProductElement) {
        topProductElement.innerText = topProduct;
    }

    // ==========================
    // Total Customers
    // ==========================
    const uniqueCustomers = new Set();

    orders.forEach(order => {
        const userName = order.userName || order.UserName;
        if (userName && userName.trim() !== "") {
            uniqueCustomers.add(userName.trim().toLowerCase());
        }
    });

    const customersElement = document.getElementById("totalCustomers");
    if (customersElement) {
        customersElement.innerText = uniqueCustomers.size;
    }

    // ==========================
    // Top Customer
    // ==========================
    const customerOrders = {};

    approvedOrders.forEach(order => {
        const customer = order.userName || order.UserName;

        if (!customerOrders[customer]) {
            customerOrders[customer] = 0;
        }

        customerOrders[customer] +=
            (order.quantity || order.Quantity);
    });

    let bestCustomer = "N/A";
    let maxQuantity = 0;

    for (const customer in customerOrders) {
        if (customerOrders[customer] > maxQuantity) {
            maxQuantity = customerOrders[customer];
            bestCustomer = customer;
        }
    }

    const topCustomerElement = document.getElementById("topCustomer");
    if (topCustomerElement) {
        topCustomerElement.innerText = bestCustomer;
    }
});

    const tableBody = document.getElementById("orderTable");
    if (!tableBody) return;

    // PAGINATION
const start =
    (currentPage - 1) * rowsPerPage;

const end =
    start + rowsPerPage;

orders = orders.slice(start, end);

    let html = "";

    orders.forEach(order => {
        // Different field names support
        const orderId = order.id || order.ID;
        const userName = order.userName || order.UserName || "-";
        const productName = order.product || order.Product || "-";
        const phoneNumber =
            order.phoneNumber ||
            order.PhoneNumber ||
            order.phone ||
            order.Phone ||
            "-";
        const quantity = order.quantity || order.Quantity || 0;
        const status = order.status || order.Status || "Pending";

        let statusBadge = "";
        let actionButtons = "";

        // Pending
        if (status === "Pending") {
            statusBadge =
                `<span class="badge bg-warning text-dark">Pending</span>`;

            actionButtons = `
                <button class="btn btn-success btn-sm me-1"
                    onclick="approveOrder(${orderId})">
                    Approve
                </button>

                <button class="btn btn-danger btn-sm me-1"
                    onclick="rejectOrder(${orderId})">
                    Reject
                </button>

                <button class="btn btn-danger btn-sm"
                    onclick="deleteOrder(${orderId})">
                    Delete
                </button>
            `;
        }

        // Approved
        else if (status === "Approved") {
            statusBadge =
                `<span class="badge bg-success">Approved</span>`;

            actionButtons = `
                No Action
                <button class="btn btn-danger btn-sm ms-2"
                    onclick="deleteOrder(${orderId})">
                    Delete
                </button>
            `;
        }

        // Rejected
        else if (status === "Rejected") {
            statusBadge =
                `<span class="badge bg-danger">Rejected</span>`;

            actionButtons = `
                No Action
                <button class="btn btn-danger btn-sm ms-2"
                    onclick="deleteOrder(${orderId})">
                    Delete
                </button>
            `;
        }

        // Row
        html += `
            <tr>
                <td>${userName}</td>
                <td>${productName}</td>
                <td>${phoneNumber}</td>
                <td>${quantity}</td>
                <td>${statusBadge}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;



 


// ========================================
// SEARCH ORDERS
// ========================================
function searchOrders() {
    const searchInput = document.getElementById("orderSearch");
    if (!searchInput) return;

    const keyword = searchInput.value.toLowerCase().trim();

    const filteredOrders = allOrders.filter(order => {
        const userName = (order.userName || order.UserName || "").toLowerCase();
        const product = (order.product || order.Product || "").toLowerCase();
        const phone = (
            order.phoneNumber ||
            order.PhoneNumber ||
            order.phone ||
            order.Phone ||
            ""
        ).toString().toLowerCase();

        return (
            userName.includes(keyword) ||
            product.includes(keyword) ||
            phone.includes(keyword)
        );
    });

    renderOrdersTable(filteredOrders);
}



// ========================================
// RENDER PAGINATION
// ========================================
function renderPagination(totalRows) {
    const paginationContainer =
        document.getElementById("paginationContainer");

    if (!paginationContainer) return;

    const totalPages = Math.ceil(totalRows / rowsPerPage);

    // Agar sirf 1 page hai to pagination hide kar do
    if (totalPages <= 1) {
        paginationContainer.innerHTML = "";
        return;
    }

    let html = `
        <nav class="mt-4">
            <ul class="pagination justify-content-center">
    `;

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <button
                    class="page-link"
                    onclick="goToPage(${i})">
                    ${i}
                </button>
            </li>
        `;
    }

    html += `
            </ul>
        </nav>
    `;

    paginationContainer.innerHTML = html;
}

// ========================================
// GO TO PAGE
// ========================================
function goToPage(page) {

    currentPage = page;

    const searchInput =
        document.getElementById("orderSearch");

    // Search active
    if (
        searchInput &&
        searchInput.value.trim() !== ""
    ) {
        searchOrders();
        return;
    }

    // Normal render
    renderOrdersTable(allOrders);
}


// ========================================
// APPLY SORTING
// ========================================
function applySorting() {
    const sortSelect = document.getElementById("orderSort");
    if (!sortSelect) return;

    const sortValue = sortSelect.value;

    // Current visible orders ka copy lo
    let orders = [...allOrders];

    // Date filter apply karo
    const dateInput = document.getElementById("orderDateFilter");
    if (dateInput && dateInput.value) {
        const selectedDate = dateInput.value;

        orders = orders.filter(order => {
            const rawDate = order.CreatedAt || order.createdAt;
            if (!rawDate) return true;

            const orderDate =
                new Date(rawDate).toISOString().split("T")[0];

            return orderDate === selectedDate;
        });
    }

    // Search filter apply karo
    const searchInput = document.getElementById("orderSearch");
    if (searchInput && searchInput.value.trim() !== "") {
        const keyword = searchInput.value.toLowerCase().trim();

        orders = orders.filter(order => {
            const user =
                (order.userName || order.UserName || "")
                    .toLowerCase();

            const product =
                (order.product || order.Product || "")
                    .toLowerCase();

            const phone =
                (
                    order.phoneNumber ||
                    order.PhoneNumber ||
                    ""
                )
                    .toString()
                    .toLowerCase();

            return (
                user.includes(keyword) ||
                product.includes(keyword) ||
                phone.includes(keyword)
            );
        });
    }

    // Sorting logic
    switch (sortValue) {
        case "newest":
            orders.sort((a, b) =>
                new Date(b.CreatedAt || b.createdAt) -
                new Date(a.CreatedAt || a.createdAt)
            );
            break;

        case "oldest":
            orders.sort((a, b) =>
                new Date(a.CreatedAt || a.createdAt) -
                new Date(b.CreatedAt || b.createdAt)
            );
            break;

        case "qtyHigh":
            orders.sort((a, b) =>
                (b.quantity || b.Quantity || 0) -
                (a.quantity || a.Quantity || 0)
            );
            break;

        case "qtyLow":
            orders.sort((a, b) =>
                (a.quantity || a.Quantity || 0) -
                (b.quantity || b.Quantity || 0)
            );
            break;

        case "nameAZ":
            orders.sort((a, b) =>
                (a.userName || a.UserName || "")
                    .localeCompare(
                        b.userName || b.UserName || ""
                    )
            );
            break;
    }

    // Final render
    currentPage = 1;
    renderOrdersTable(orders);
}