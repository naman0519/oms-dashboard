document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Orders and Products load karo
        const [orders, products] = await Promise.all([
            fetch('/orders').then(res => res.json()),
            fetch('/api/products').then(res => res.json())
        ]);

        // Sirf approved orders consider karenge
        const approvedOrders = orders.filter(order => {
            const status = order.status || order.Status || "Pending";
            return status.toLowerCase() === "approved";
        });

        // =====================================
        // 1. Monthly Revenue (Current Month Total)
        // =====================================
        let monthlyRevenue = 0;

        approvedOrders.forEach(order => {
            const productName = (order.product || order.Product || "").toLowerCase();

            const product = products.find(
                p => (p.name || "").toLowerCase() === productName
            );

            const quantity = Number(order.quantity || order.Quantity || 0);

            if (product) {
                monthlyRevenue += quantity * Number(product.price || 0);
            }
        });

        // Simple single-bar chart
        const ctx = document
            .getElementById("monthlyRevenueChart")
            .getContext("2d");

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Current Month'],
                datasets: [{
                    label: 'Revenue (₹)',
                    data: [monthlyRevenue],
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.1)'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.1)'
                        }
                    }
                }
            }
        });

        // =====================================
        // 2. Top 5 Products
        // =====================================
        const productSales = {};

        approvedOrders.forEach(order => {
            const name = order.product || order.Product || "Unknown Product";
            const quantity = Number(order.quantity || order.Quantity || 0);

            if (!productSales[name]) {
                productSales[name] = 0;
            }

            productSales[name] += quantity;
        });

        const topProducts = Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const topProductsList = document.getElementById("topProductsList");

        if (topProducts.length === 0) {
            topProductsList.innerHTML = "No approved orders yet.";
        } else {
            topProductsList.innerHTML = topProducts
                .map(([name, qty]) =>
                    `<div class="mb-2">${name} - ${qty} units</div>`
                )
                .join('');
        }

        // =====================================
        // 3. Top 5 Customers
        // =====================================
        const customerSales = {};

        approvedOrders.forEach(order => {
            const customer =
                order.userName ||
                order.UserName ||
                order.user ||
                order.User ||
                "Unknown Customer";

            const quantity = Number(order.quantity || order.Quantity || 0);

            if (!customerSales[customer]) {
                customerSales[customer] = 0;
            }

            customerSales[customer] += quantity;
        });

        const topCustomers = Object.entries(customerSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const topCustomersList = document.getElementById("topCustomersList");

        if (topCustomers.length === 0) {
            topCustomersList.innerHTML = "No approved orders yet.";
        } else {
            topCustomersList.innerHTML = topCustomers
                .map(([name, qty]) =>
                    `<div class="mb-2">${name} - ${qty} units</div>`
                )
                .join('');
        }

    } catch (error) {
        console.error("Analytics error:", error);
    }
});