let salesData = [];
let salesChart;
let categoryChart;
let currentTheme = localStorage.getItem("theme") || "dark";

setupCSVUpload();

document.addEventListener("DOMContentLoaded", () => {
    applySavedTheme();
});

// Load CSV
Papa.parse("data/sales-data.csv", {
    download: true,
    header: true,
    complete: function(results) {
        salesData = results.data.filter(row => row.order_id);

        populateCategoryFilter(salesData);
        displayTable(salesData);
        updateDashboard(salesData);
        createCharts(salesData);
        generateInsights(salesData);
        generateTopCustomers(salesData);
        setupFilters();
        setupThemeToggle();
    }
});

function setupThemeToggle() {
    const themeToggle = document.getElementById("themeToggle");

    themeToggle.addEventListener("click", () => {
        currentTheme = currentTheme === "dark" ? "light" : "dark";
        localStorage.setItem("theme", currentTheme);

        applySavedTheme();
        createCharts(getFilteredData());
    });
}

function applySavedTheme() {
    const themeToggle = document.getElementById("themeToggle");

    if (currentTheme === "light") {
        document.body.classList.add("light-mode");

        if (themeToggle) {
            themeToggle.innerText = "🌙 Dark Mode";
        }
    } else {
        document.body.classList.remove("light-mode");

        if (themeToggle) {
            themeToggle.innerText = "☀️ Light Mode";
        }
    }
}

function getFilteredData() {
    const selectedCategory = document.getElementById("categoryFilter").value;
    const searchKeyword = document.getElementById("searchInput").value.toLowerCase();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    return salesData.filter(row => {
        const rowDate = new Date(row.date);

        const matchCategory =
            selectedCategory === "All" || row.category === selectedCategory;

        const matchSearch =
            row.customer.toLowerCase().includes(searchKeyword) ||
            row.product.toLowerCase().includes(searchKeyword);

        const matchStartDate =
            !startDate || rowDate >= new Date(startDate);

        const matchEndDate =
            !endDate || rowDate <= new Date(endDate);

        return matchCategory && matchSearch && matchStartDate && matchEndDate;
    });
}

function populateCategoryFilter(data) {
    const categoryFilter = document.getElementById("categoryFilter");
    const categories = [...new Set(data.map(row => row.category))];

    categoryFilter.innerHTML = `<option value="All">All Categories</option>`;

    categories.forEach(category => {
        categoryFilter.innerHTML += `
            <option value="${category}">${category}</option>
        `;
    });
}

function setupFilters() {
    document.getElementById("categoryFilter").addEventListener("change", applyFilters);
    document.getElementById("searchInput").addEventListener("input", applyFilters);
    document.getElementById("startDate").addEventListener("change", applyFilters);
    document.getElementById("endDate").addEventListener("change", applyFilters);
}

function applyFilters() {
    const filteredData = getFilteredData();

    displayTable(filteredData);
    updateDashboard(filteredData);
    createCharts(filteredData);
    generateInsights(filteredData);
    generateTopCustomers(filteredData);
}

function displayTable(data) {
    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";

    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">No data found</td>
            </tr>
        `;
        return;
    }

    data.forEach(row => {
        tableBody.innerHTML += `
            <tr>
                <td>${row.order_id}</td>
                <td>${row.date}</td>
                <td>${row.customer}</td>
                <td>${row.product}</td>
                <td>${row.category}</td>
                <td>Rp ${Number(row.amount).toLocaleString()}</td>
            </tr>
        `;
    });
}

function updateDashboard(data) {
    let totalRevenue = 0;
    const customers = new Set();
    const productCount = {};

    data.forEach(row => {
        totalRevenue += Number(row.amount);
        customers.add(row.customer);

        productCount[row.product] =
            (productCount[row.product] || 0) + 1;
    });

    let topProduct = "-";
    let maxCount = 0;

    for (let product in productCount) {
        if (productCount[product] > maxCount) {
            maxCount = productCount[product];
            topProduct = product;
        }
    }

    document.getElementById("totalRevenue").innerText =
        "Rp " + totalRevenue.toLocaleString();

    document.getElementById("totalOrders").innerText = data.length;
    document.getElementById("totalCustomers").innerText = customers.size;
    document.getElementById("topProduct").innerText = topProduct;
}

function createCharts(data) {
    if (salesChart) salesChart.destroy();
    if (categoryChart) categoryChart.destroy();

    const textColor = currentTheme === "light" ? "#111827" : "#e5e7eb";
    const gridColor = currentTheme === "light"
        ? "rgba(0,0,0,0.08)"
        : "rgba(255,255,255,0.05)";

    const monthlySales = {};

    data.forEach(row => {
        const month = new Date(row.date).toLocaleString("default", {
            month: "short"
        });

        monthlySales[month] =
            (monthlySales[month] || 0) + Number(row.amount);
    });

    salesChart = new Chart(document.getElementById("salesChart"), {
        type: "bar",
        data: {
            labels: Object.keys(monthlySales),
            datasets: [{
                label: "Sales",
                data: Object.values(monthlySales),
                backgroundColor: "rgba(56, 189, 248, 0.65)",
                borderColor: "rgba(56, 189, 248, 1)",
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            animation: { duration: 700 },
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                y: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });

    const categoryData = {};

    data.forEach(row => {
        categoryData[row.category] =
            (categoryData[row.category] || 0) + 1;
    });

    categoryChart = new Chart(document.getElementById("categoryChart"), {
        type: "doughnut",
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: [
                    "rgba(56, 189, 248, 0.85)",
                    "rgba(244, 114, 182, 0.85)",
                    "rgba(251, 191, 36, 0.85)"
                ],
                borderColor: currentTheme === "light" ? "#ffffff" : "#0f172a",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            animation: { duration: 700 },
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

function generateInsights(data) {
    const insightList = document.getElementById("insightList");
    insightList.innerHTML = "";

    if (data.length === 0) {
        insightList.innerHTML = `
            <div class="insight-item">
                No insight available because no data matches the selected filter.
            </div>
        `;
        return;
    }

    const totalRevenue = data.reduce((sum, row) => {
        return sum + Number(row.amount);
    }, 0);

    const categoryRevenue = {};

    data.forEach(row => {
        categoryRevenue[row.category] =
            (categoryRevenue[row.category] || 0) + Number(row.amount);
    });

    let bestCategory = "";
    let highestRevenue = 0;

    for (let category in categoryRevenue) {
        if (categoryRevenue[category] > highestRevenue) {
            highestRevenue = categoryRevenue[category];
            bestCategory = category;
        }
    }

    const monthlySales = {};

    data.forEach(row => {
        const month = new Date(row.date).toLocaleString("default", {
            month: "long"
        });

        monthlySales[month] =
            (monthlySales[month] || 0) + Number(row.amount);
    });

    let bestMonth = "";
    let bestMonthRevenue = 0;

    for (let month in monthlySales) {
        if (monthlySales[month] > bestMonthRevenue) {
            bestMonthRevenue = monthlySales[month];
            bestMonth = month;
        }
    }

    const insights = [
        `Total revenue reached Rp ${totalRevenue.toLocaleString()}.`,
        `${bestCategory} generated the highest revenue.`,
        `${bestMonth} was the strongest sales month.`,
        `The dashboard currently contains ${data.length} transactions.`
    ];

    insights.forEach(text => {
        insightList.innerHTML += `
            <div class="insight-item">
                ${text}
            </div>
        `;
    });
}

function setupCSVUpload() {

    const csvUpload = document.getElementById("csvUpload");

    csvUpload.addEventListener("change", function(event) {

        const file = event.target.files[0];

        if (!file) return;

        Papa.parse(file, {

            header: true,

            skipEmptyLines: true,

            complete: function(results) {

                salesData = results.data.filter(row => row.order_id);

                populateCategoryFilter(salesData);

                displayTable(salesData);

                updateDashboard(salesData);

                createCharts(salesData);

                generateInsights(salesData);

            }

        });

    });

}

function generateTopCustomers(data) {

    const topCustomersList =
        document.getElementById("topCustomersList");

    topCustomersList.innerHTML = "";

    if(data.length === 0) {
        return;
    }

    // Calculate Revenue Per Customer
    const customerRevenue = {};

    data.forEach(row => {

        customerRevenue[row.customer] =
            (customerRevenue[row.customer] || 0)
            + Number(row.amount);

    });

    // Convert to array
    const sortedCustomers =
        Object.entries(customerRevenue)

        .sort((a, b) => b[1] - a[1])

        .slice(0, 5);

    // Render
    sortedCustomers.forEach((customer, index) => {

        const [name, revenue] = customer;

        topCustomersList.innerHTML += `
            <div class="customer-rank">

                <div class="customer-name">
                    #${index + 1} ${name}
                </div>

                <div class="customer-revenue">
                    Rp ${revenue.toLocaleString()}
                </div>

            </div>
        `;
    });

}

// Export Dashboard to PDF
document.getElementById("exportPDF").addEventListener("click", exportDashboardPDF);

async function exportDashboardPDF() {

    const dashboard =
        document.querySelector(".main-content");

    const canvas =
        await html2canvas(dashboard, {
            scale: 2
        });

    const imgData =
        canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;

    const pdf =
        new jsPDF("p", "mm", "a4");

    const pdfWidth =
        pdf.internal.pageSize.getWidth();

    const pdfHeight =
        (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        pdfWidth,
        pdfHeight
    );

    pdf.save("dashboard-report.pdf");
}
 // Sidebar Navigation
document.querySelectorAll(".sidebar ul li").forEach(item => {
    item.addEventListener("click", () => {
        const targetId = item.getAttribute("data-target");
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

        document.querySelectorAll(".sidebar ul li").forEach(li => {
            li.classList.remove("active");
        });

        item.classList.add("active");
    });
});