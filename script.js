import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc
} from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// Firebase collection
const birthdayCollection = collection(db, "birthdays");

// Store birthdays in memory
let birthdays = [];

// Active filter
let activeFilter = "all";

// Get form elements
const birthdayForm = document.getElementById("birthdayForm");
const cancelButton = document.getElementById("cancelButton");

// Load birthdays when page opens
loadBirthdays();


// ======================================================
// TOAST NOTIFICATIONS
// ======================================================

function showToast(message, type = "success") {

    const container =
        document.getElementById("toastContainer");

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
        success: "✅",
        error: "❌",
        info: "ℹ️",
        warning: "⚠️"
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
        removeToast(toast);
    });

    setTimeout(() => {
        removeToast(toast);
    }, 3500);

}

function removeToast(toast) {

    if (!toast || !toast.parentNode) {
        return;
    }

    toast.classList.add("hide");

    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 380);

}


// ======================================================
// CONFETTI ANIMATION
// ======================================================

function launchConfetti() {

    const canvas =
        document.getElementById("confettiCanvas");

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = [
        "#6c5ce7", "#fd79a8", "#00b894",
        "#fdcb6e", "#0984e3", "#e74c3c",
        "#a29bfe", "#55efc4"
    ];

    for (let i = 0; i < 120; i++) {

        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 8 + 4,
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 4 - 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotSpeed: Math.random() * 8 - 4,
            shape: Math.random() > 0.5 ? "rect" : "circle"
        });

    }

    let frame = 0;

    function animate() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p) => {

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.85;

            if (p.shape === "rect") {
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();

            p.y += p.speedY;
            p.x += p.speedX;
            p.rotation += p.rotSpeed;
            p.speedX += 0.02;

        });

        frame++;

        if (frame < 180) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

    }

    animate();

}


// ======================================================
// ADD / UPDATE BIRTHDAY
// ======================================================

birthdayForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const id = document.getElementById("birthdayId").value;
    const name = document.getElementById("name").value.trim();
    const date = document.getElementById("date").value;
    const relation = document.getElementById("relation").value.trim();
    const email = document.getElementById("email").value.trim();

    try {

        if (id) {

            const birthdayRef = doc(db, "birthdays", id);

            await updateDoc(birthdayRef, {
                name: name,
                date: date,
                relation: relation,
                email: email
            });

            showToast("Birthday updated successfully!", "success");

        } else {

            await addDoc(birthdayCollection, {
                name: name,
                date: date,
                relation: relation,
                email: email,
                createdAt: new Date()
            });

            showToast("Birthday added successfully!", "success");

        }

        // Clear form
        birthdayForm.reset();
        resetFormState();

        // Reload data
        loadBirthdays();

    } catch (error) {

        console.error(error);
        showToast("Something went wrong. Please try again.", "error");

    }

});


// ======================================================
// CANCEL EDIT
// ======================================================

cancelButton.addEventListener("click", function () {

    birthdayForm.reset();
    resetFormState();

});

function resetFormState() {

    document.getElementById("birthdayId").value = "";
    document.getElementById("formTitle").textContent = "Add Birthday";
    document.getElementById("formBadge").textContent = "New";
    document.getElementById("saveButton").innerHTML =
        '<span class="btn-icon">➕</span> Add Birthday';
    document.getElementById("cancelButton").style.display = "none";

}


// ======================================================
// LOAD BIRTHDAYS
// ======================================================

async function loadBirthdays() {

    const birthdayList =
        document.getElementById("birthdayList");

    birthdayList.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading birthdays...</p>
        </div>
    `;

    try {

        const snapshot =
            await getDocs(birthdayCollection);

        birthdays = [];

        snapshot.forEach((document) => {

            birthdays.push({
                id: document.id,
                ...document.data()
            });

        });

        // Update count
        document.getElementById("birthdayCount").textContent =
            birthdays.length;

        // Check for today's birthdays and launch confetti
        const todayBdays =
            birthdays.filter(b => getDaysUntilBirthday(b.date) === 0);

        if (todayBdays.length > 0) {
            launchConfetti();
        }

        filterAndDisplay();

    } catch (error) {

        console.error(error);

        birthdayList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⚠️</span>
                <h3>Unable to load birthdays</h3>
                <p>Check your internet connection and try again.</p>
            </div>
        `;

    }

}


// ======================================================
// FILTER
// ======================================================

function filterAndDisplay() {

    let filtered = [...birthdays];

    // Search filter
    const searchValue =
        document.getElementById("search").value
            .toLowerCase().trim();

    if (searchValue) {
        filtered = filtered.filter((b) =>
            b.name.toLowerCase().includes(searchValue)
        );
    }

    // Tab filter
    if (activeFilter === "today") {
        filtered = filtered.filter(b => getDaysUntilBirthday(b.date) === 0);
    } else if (activeFilter === "week") {
        filtered = filtered.filter(b => {
            const days = getDaysUntilBirthday(b.date);
            return days >= 0 && days <= 7;
        });
    } else if (activeFilter === "month") {
        filtered = filtered.filter(b => {
            const days = getDaysUntilBirthday(b.date);
            return days >= 0 && days <= 30;
        });
    }

    displayBirthdays(filtered);

}

// Filter tab clicks
document.querySelectorAll(".filter-tab").forEach((tab) => {

    tab.addEventListener("click", function () {

        document.querySelectorAll(".filter-tab")
            .forEach(t => t.classList.remove("active"));

        this.classList.add("active");

        activeFilter = this.getAttribute("data-filter");

        filterAndDisplay();

    });

});

// Search input
document.getElementById("search").addEventListener("input", function () {
    filterAndDisplay();
});


// ======================================================
// DISPLAY BIRTHDAYS
// ======================================================

function displayBirthdays(data) {

    const birthdayList =
        document.getElementById("birthdayList");

    if (data.length === 0) {

        birthdayList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🎈</span>
                <h3>No birthdays found</h3>
                <p>Add your first birthday above or try a different filter.</p>
            </div>
        `;

        return;

    }

    // Sort by upcoming date
    data.sort((a, b) =>
        getDaysUntilBirthday(a.date) -
        getDaysUntilBirthday(b.date)
    );

    birthdayList.innerHTML = "";

    data.forEach((birthday, index) => {

        const days = getDaysUntilBirthday(birthday.date);
        let badgeText = "";
        let badgeClass = "days-upcoming";
        let cardClass = "birthday-card";

        if (days === 0) {
            badgeText = "🎉 It's TODAY!";
            badgeClass = "days-today";
            cardClass = "birthday-card today-card";
        } else if (days === 1) {
            badgeText = "⏳ Tomorrow";
            badgeClass = "days-tomorrow";
        } else {
            badgeText = `⏳ ${days} days remaining`;
        }

        const initial =
            (birthday.name || "?").charAt(0).toUpperCase();

        const relationText =
            birthday.relation || "Not specified";

        const emailText =
            birthday.email || "Not specified";

        const card = document.createElement("div");
        card.className = cardClass;
        card.style.animationDelay = `${index * 0.06}s`;

        card.innerHTML = `
            <div class="card-top">
                <div>
                    <h3>${escapeHTML(birthday.name)}</h3>
                    <span class="card-relation">${escapeHTML(relationText)}</span>
                </div>
                <div class="card-avatar">${initial}</div>
            </div>
            <div class="card-body">
                <div class="card-info">
                    <span>📅</span>
                    <span>${formatDate(birthday.date)}</span>
                </div>
                <div class="card-info">
                    <span>✉️</span>
                    <span>${escapeHTML(emailText)}</span>
                </div>
                <div class="day-badge ${badgeClass}">
                    ${badgeText}
                </div>
            </div>
            <div class="card-actions">
                <button class="card-btn edit-btn"
                    onclick="editBirthday('${birthday.id}')">
                    ✏️ Edit
                </button>
                <button class="card-btn delete-btn"
                    onclick="deleteBirthday('${birthday.id}')">
                    🗑️ Delete
                </button>
            </div>
        `;

        birthdayList.appendChild(card);

    });

}


// ======================================================
// CALCULATE DAYS UNTIL BIRTHDAY
// ======================================================

function getDaysUntilBirthday(dateString) {

    const today = new Date();
    const birthDate = new Date(dateString);

    // Birthday in current year
    let birthday = new Date(
        today.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
    );

    // If birthday already passed, calculate for next year
    if (birthday < today) {
        birthday.setFullYear(today.getFullYear() + 1);
    }

    // Remove time difference
    today.setHours(0, 0, 0, 0);
    birthday.setHours(0, 0, 0, 0);

    const difference = birthday - today;

    return Math.ceil(
        difference / (1000 * 60 * 60 * 24)
    );

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

}


// ======================================================
// EDIT BIRTHDAY
// ======================================================

window.editBirthday = function (id) {

    const birthday =
        birthdays.find(item => item.id === id);

    if (!birthday) {
        return;
    }

    document.getElementById("birthdayId").value = birthday.id;
    document.getElementById("name").value = birthday.name;
    document.getElementById("date").value = birthday.date;
    document.getElementById("relation").value = birthday.relation || "";
    document.getElementById("email").value = birthday.email || "";

    document.getElementById("formTitle").textContent = "Edit Birthday";
    document.getElementById("formBadge").textContent = "Edit";
    document.getElementById("saveButton").innerHTML =
        '<span class="btn-icon">💾</span> Update Birthday';
    document.getElementById("cancelButton").style.display = "inline-flex";

    // Scroll to form smoothly
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

};


// ======================================================
// DELETE BIRTHDAY
// ======================================================

window.deleteBirthday = async function (id) {

    const confirmation =
        confirm("Are you sure you want to delete this birthday?");

    if (!confirmation) {
        return;
    }

    try {

        await deleteDoc(doc(db, "birthdays", id));

        showToast("Birthday deleted successfully!", "success");

        loadBirthdays();

    } catch (error) {

        console.error(error);
        showToast("Unable to delete birthday.", "error");

    }

};


// ======================================================
// HTML SECURITY
// ======================================================

function escapeHTML(value) {

    if (!value) {
        return "";
    }

    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
