document.addEventListener("DOMContentLoaded", function () {
    loadSettings();

    // Save Settings Button
    document.getElementById("saveSettingsBtn").addEventListener("click", async function () {
        const data = {
            low_stock_threshold: parseInt(document.getElementById("lowStockThreshold").value),
            auto_approve: document.getElementById("autoApprove").checked,
            notifications_enabled: document.getElementById("notificationsEnabled").checked
        };

        try {
            const response = await fetch("/api/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                alert("Settings saved successfully!");
            } else {
                alert(result.error || "Failed to save settings.");
            }
        } catch (error) {
            console.error(error);
            alert("Something went wrong.");
        }
    });

    // Change Password Button
    document.getElementById("changePasswordForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    // Frontend validation
    if (newPassword !== confirmPassword) {
        alert("New passwords do not match");
        return;
    }

    const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword
        })
    });

    const data = await response.json();

    if (response.ok) {
        alert(data.message || "Password changed successfully");
        document.getElementById("changePasswordForm").reset();
    } else {
        alert(data.error || "Failed to change password");
    }
});
});

// Show / Hide Password
const toggle = document.getElementById("togglePasswords");

if (toggle) {
    toggle.addEventListener("change", function () {
        const type = this.checked ? "text" : "password";

        document.getElementById("currentPassword").type = type;
        document.getElementById("newPassword").type = type;
        document.getElementById("confirmPassword").type = type;
    });
}

// Load Settings from API
async function loadSettings() {
    try {
        const response = await fetch("/api/settings");
        const data = await response.json();

        document.getElementById("lowStockThreshold").value = data.low_stock_threshold;
        document.getElementById("autoApprove").checked = data.auto_approve;
        document.getElementById("notificationsEnabled").checked = data.notifications_enabled;
    } catch (error) {
        console.error("Error loading settings:", error);
    }
}