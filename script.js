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


const birthdayCollection = collection(db, "birthdays");

let birthdays = [];
let activeFilter = "all";

const birthdayForm = document.getElementById("birthdayForm");
const formSection = document.getElementById("formSection");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");

const AVATAR_GRADIENTS = [
    "linear-gradient(135deg, #8b5cf6, #a78bfa)",
    "linear-gradient(135deg, #ec4899, #f472b6)",
    "linear-gradient(135deg, #0ea5e9, #38bdf8)",
    "linear-gradient(135deg, #10b981, #34d399)",
    "linear-gradient(135deg, #f59e0b, #fbbf24)",
    "linear-gradient(135deg, #6366f1, #818cf8)",
    "linear-gradient(135deg, #ef4444, #f87171)",
    "linear-gradient(135deg, #14b8a6, #2dd4bf)",
    "linear-gradient(135deg, #d946ef, #e879f9)",
    "linear-gradient(135deg, #3b82f6, #60a5fa)",
];

function getAvatarGradient(name) {
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
        sum += name.charCodeAt(i);
    }
    return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
}

function getAgeOnNextBirthday(dateString) {
    const birthDate = new Date(dateString);
    const today = new Date();
    let year = today.getFullYear();
    const bd = new Date(year, birthDate.getMonth(), birthDate.getDate());
    if (bd < today) year++;
    return year - birthDate.getFullYear();
}


// ======================================================
// TOAST NOTIFICATIONS
// ======================================================

function showToast(message, type = "success") {

    const container =
        document.getElementById("toastContainer");

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
        success: "\u2705",
        error: "\u274C",
        info: "\u2139\uFE0F",
        warning: "\u26A0\uFE0F"
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    toast.querySelector(".toast-close")
        .addEventListener("click", () => removeToast(toast));

    setTimeout(() => removeToast(toast), 4000);

}

function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add("hide");
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 350);
}


// ======================================================
// CONFETTI
// ======================================================

function launchConfetti() {

    const canvas = document.getElementById("confettiCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = [
        "#8b5cf6", "#ec4899", "#10b981",
        "#f59e0b", "#0ea5e9", "#ef4444",
        "#a78bfa", "#34d399", "#f472b6"
    ];

    for (let i = 0; i < 130; i++) {
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
// FORM TOGGLE
// ======================================================

function openForm() {
    formSection.classList.add("open");
    setTimeout(() => {
        document.getElementById("name").focus();
    }, 100);
}

function closeForm() {
    birthdayForm.reset();
    formSection.classList.remove("open");
    resetFormState();
}

document.getElementById("navAddBtn")
    .addEventListener("click", () => {
        resetFormState();
        openForm();
    });

document.getElementById("fabBtn")
    .addEventListener("click", () => {
        resetFormState();
        openForm();
    });

document.getElementById("formCloseBtn")
    .addEventListener("click", closeForm);

cancelButton.addEventListener("click", closeForm);

function resetFormState() {
    document.getElementById("birthdayId").value = "";
    document.getElementById("formTitle").textContent = "Add Birthday";
    saveButton.disabled = false;
    saveButton.innerHTML =
        '<span class="btn-icon">\u2795</span> Add Birthday';
    cancelButton.style.display = "none";
    document.querySelector(".form-heading-icon").textContent = "\u2795";
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

    if (!name || !date) {
        showToast("Please fill in Name and Date of Birth.", "warning");
        return;
    }

    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="btn-icon">\u23F3</span> Saving...';

    try {

        if (id) {

            const birthdayRef = doc(db, "birthdays", id);
            await updateDoc(birthdayRef, {
                name, date, relation, email
            });
            showToast("Birthday updated successfully!", "success");

        } else {

            await addDoc(birthdayCollection, {
                name, date, relation, email,
                createdAt: new Date()
            });
            showToast("Birthday added successfully!", "success");

        }

        closeForm();
        loadBirthdays();

    } catch (error) {

        console.error(error);

        const message =
            error.code === "permission-denied"
                ? "Firestore permission denied. Check your rules."
                : error.code === "unavailable"
                    ? "No internet connection."
                    : error.message || "Something went wrong.";

        showToast("Could not save: " + message, "error");

        saveButton.disabled = false;
        saveButton.innerHTML = id
            ? '<span class="btn-icon">\uD83D\uDCBE</span> Update Birthday'
            : '<span class="btn-icon">\u2795</span> Add Birthday';

    }

});


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

        const snapshot = await getDocs(birthdayCollection);

        birthdays = [];
        snapshot.forEach((document) => {
            birthdays.push({
                id: document.id,
                ...document.data()
            });
        });

        updateStats();
        updateListTitle();

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
                <span class="empty-icon">\u26A0\uFE0F</span>
                <h3>Unable to load birthdays</h3>
                <p>Check your internet connection and try again.</p>
            </div>
        `;

    }

}


// ======================================================
// STATS
// ======================================================

function updateStats() {

    const total = birthdays.length;
    const today = birthdays.filter(b => getDaysUntilBirthday(b.date) === 0).length;
    const week = birthdays.filter(b => {
        const d = getDaysUntilBirthday(b.date);
        return d >= 0 && d <= 7;
    }).length;
    const month = birthdays.filter(b => {
        const d = getDaysUntilBirthday(b.date);
        return d >= 0 && d <= 30;
    }).length;

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statToday").textContent = today;
    document.getElementById("statWeek").textContent = week;
    document.getElementById("statMonth").textContent = month;
    document.getElementById("birthdayCount").textContent = total;

}

// Stat card clicks apply filter and scroll to list
document.querySelectorAll(".stat-card").forEach((card) => {
    card.addEventListener("click", () => {
        const filter = card.getAttribute("data-filter");

        document.querySelectorAll(".filter-tab")
            .forEach(t => t.classList.remove("active"));
        document.querySelector(`.filter-tab[data-filter="${filter}"]`)
            .classList.add("active");

        activeFilter = filter;
        moveTabIndicator();
        updateListTitle();
        filterAndDisplay();

        document.getElementById("birthdaySection")
            .scrollIntoView({ behavior: "smooth", block: "start" });
    });
});


// ======================================================
// FILTER
// ======================================================

function moveTabIndicator() {

    const activeTab =
        document.querySelector(".filter-tab.active");
    const indicator =
        document.getElementById("tabIndicator");

    if (!activeTab || !indicator) return;

    indicator.style.width = activeTab.offsetWidth + "px";
    indicator.style.transform =
        `translateX(${activeTab.offsetLeft}px)`;

}

function filterAndDisplay() {

    let filtered = [...birthdays];

    const searchValue =
        document.getElementById("search").value
            .toLowerCase().trim();

    if (searchValue) {
        filtered = filtered.filter((b) =>
            b.name.toLowerCase().includes(searchValue)
        );
    }

    if (activeFilter === "today") {
        filtered = filtered.filter(b =>
            getDaysUntilBirthday(b.date) === 0
        );
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

function updateListTitle() {
    const titles = {
        all: "Upcoming Birthdays",
        today: "Birthdays Today",
        week: "This Week",
        month: "This Month"
    };
    document.getElementById("listTitle").textContent =
        titles[activeFilter] || "Upcoming Birthdays";
}

document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
        document.querySelectorAll(".filter-tab")
            .forEach(t => t.classList.remove("active"));
        this.classList.add("active");
        activeFilter = this.getAttribute("data-filter");
        moveTabIndicator();
        updateListTitle();
        filterAndDisplay();
    });
});

moveTabIndicator();
window.addEventListener("resize", moveTabIndicator);

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

        const isFiltered = activeFilter !== "all" ||
            document.getElementById("search").value.trim();

        birthdayList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">${isFiltered ? "\uD83D\uDD0D" : "\uD83C\uDF88"}</span>
                <h3>${isFiltered ? "No matches found" : "No birthdays yet!"}</h3>
                <p>${isFiltered
                    ? "Try a different search or filter."
                    : "Tap the Add Birthday button to get started."}</p>
            </div>
        `;
        return;

    }

    data.sort((a, b) =>
        getDaysUntilBirthday(a.date) -
        getDaysUntilBirthday(b.date)
    );

    birthdayList.innerHTML = "";

    data.forEach((birthday, index) => {

        const days = getDaysUntilBirthday(birthday.date);
        let chipText = "";
        let chipClass = "days-upcoming";

        if (days === 0) {
            chipText = "\uD83C\uDF89 It's TODAY!";
            chipClass = "days-today";
        } else if (days === 1) {
            chipText = "\u23F3 Tomorrow";
            chipClass = "days-tomorrow";
        } else {
            chipText = `\u23F3 ${days} days left`;
        }

        const initial =
            (birthday.name || "?").charAt(0).toUpperCase();

        const relationText =
            birthday.relation || "Not specified";

        const age = getAgeOnNextBirthday(birthday.date);

        const card = document.createElement("div");
        card.className = "birthday-card";
        card.style.animationDelay = `${index * 0.06}s`;

        card.innerHTML = `
            <div class="card-top">
                <div class="card-avatar"
                    style="background: ${getAvatarGradient(birthday.name)}">
                    ${initial}
                </div>
                <div class="card-name">
                    <h3>${escapeHTML(birthday.name)}</h3>
                    <span class="card-relation">${escapeHTML(relationText)}</span>
                </div>
            </div>
            <div class="card-meta">
                <div class="card-meta-item">
                    \uD83D\uDCC5 ${formatDate(birthday.date)}
                </div>
                <div class="card-meta-item">
                    \uD83C\uDF82 Turning ${age}
                </div>
            </div>
            <div class="card-countdown">
                <span class="countdown-chip ${chipClass}">${chipText}</span>
            </div>
            <div class="card-actions">
                <button class="card-btn edit-btn"
                    onclick="editBirthday('${birthday.id}')">
                    \u270F\uFE0F Edit
                </button>
                <button class="card-btn delete-btn"
                    onclick="deleteBirthday('${birthday.id}')">
                    \uD83D\uDDD1\uFE0F Delete
                </button>
            </div>
        `;

        birthdayList.appendChild(card);

    });

}


// ======================================================
// DAYS UNTIL BIRTHDAY
// ======================================================

function getDaysUntilBirthday(dateString) {

    const today = new Date();
    const birthDate = new Date(dateString);

    let birthday = new Date(
        today.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
    );

    if (birthday < today) {
        birthday.setFullYear(today.getFullYear() + 1);
    }

    today.setHours(0, 0, 0, 0);
    birthday.setHours(0, 0, 0, 0);

    const difference = birthday - today;
    return Math.ceil(difference / (1000 * 60 * 60 * 24));

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

    const birthday = birthdays.find(item => item.id === id);
    if (!birthday) return;

    document.getElementById("birthdayId").value = birthday.id;
    document.getElementById("name").value = birthday.name;
    document.getElementById("date").value = birthday.date;
    document.getElementById("relation").value = birthday.relation || "";
    document.getElementById("email").value = birthday.email || "";

    document.getElementById("formTitle").textContent = "Edit Birthday";
    document.querySelector(".form-heading-icon").textContent = "\u270F\uFE0F";
    saveButton.disabled = false;
    saveButton.innerHTML =
        '<span class="btn-icon">\uD83D\uDCBE</span> Update Birthday';
    cancelButton.style.display = "inline-flex";

    openForm();
    window.scrollTo({ top: 0, behavior: "smooth" });

};


// ======================================================
// DELETE BIRTHDAY
// ======================================================

window.deleteBirthday = async function (id) {

    const confirmation =
        confirm("Are you sure you want to delete this birthday?");
    if (!confirmation) return;

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
    if (!value) return "";
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
