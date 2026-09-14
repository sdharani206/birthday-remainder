// ======================================================
// FIREBASE IMPORT
// ======================================================

import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ======================================================
// FIRESTORE COLLECTION
// ======================================================

const birthdayCollection = collection(db, "birthdays");


// ======================================================
// VARIABLES
// ======================================================

let birthdays = [];
let activeFilter = "all";


// ======================================================
// HTML ELEMENTS
// ======================================================

const birthdayForm = document.getElementById("birthdayForm");
const birthdayList = document.getElementById("birthdayList");
const birthdayCount = document.getElementById("birthdayCount");
const searchInput = document.getElementById("search");
const cancelButton = document.getElementById("cancelButton");
const saveButton = document.getElementById("saveButton");
const formTitle = document.getElementById("formTitle");
const formBadge = document.getElementById("formBadge");


// Notification elements

const reminderDays =
    document.getElementById("reminderDays");

const enableNotificationButton =
    document.getElementById("enableNotification");


// ======================================================
// PAGE LOAD
// ======================================================

loadBirthdays();


// ======================================================
// ADD / UPDATE BIRTHDAY
// ======================================================

birthdayForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const birthdayId =
        document.getElementById("birthdayId").value;

    const name =
        document.getElementById("name").value.trim();

    const date =
        document.getElementById("date").value;

    const relation =
        document.getElementById("relation").value.trim();

    const email =
        document.getElementById("email").value.trim();


    // Basic validation

    if (!name || !date) {

        showToast(
            "Please enter name and date of birth.",
            "error"
        );

        return;
    }


    try {

        // ==================================================
        // UPDATE EXISTING BIRTHDAY
        // ==================================================

        if (birthdayId) {

            const birthdayRef =
                doc(db, "birthdays", birthdayId);


            await updateDoc(birthdayRef, {

                name: name,
                date: date,
                relation: relation,
                email: email

            });


            showToast(
                "Birthday updated successfully! 🎉",
                "success"
            );

        }


        // ==================================================
        // ADD NEW BIRTHDAY
        // ==================================================

        else {

            await addDoc(birthdayCollection, {

                name: name,
                date: date,
                relation: relation,
                email: email,
                createdAt: new Date().toISOString()

            });


            showToast(
                "Birthday added successfully! 🎂",
                "success"
            );

        }


        resetForm();

        await loadBirthdays();

    }

    catch (error) {

        console.error(
            "Firestore Error:",
            error
        );


        showToast(
            "Unable to save birthday. Check the browser console.",
            "error"
        );

    }

});


// ======================================================
// LOAD BIRTHDAYS
// ======================================================

async function loadBirthdays() {

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


        console.log(
            "Birthdays loaded:",
            birthdays
        );


        displayBirthdays();


        // Check reminders

        checkBirthdayReminders();

    }

    catch (error) {

        console.error(
            "Error loading birthdays:",
            error
        );


        birthdayList.innerHTML = `
            <div class="no-birthday">
                <h3>Unable to load birthdays</h3>
                <p>Please check your Firebase configuration.</p>
            </div>
        `;

    }

}


// ======================================================
// DISPLAY BIRTHDAYS
// ======================================================

function displayBirthdays() {

    let filteredBirthdays =
        [...birthdays];


    // ==================================================
    // SEARCH
    // ==================================================

    const searchValue =
        searchInput.value
            .toLowerCase()
            .trim();


    if (searchValue) {

        filteredBirthdays =
            filteredBirthdays.filter((birthday) => {

                return birthday.name
                    .toLowerCase()
                    .includes(searchValue);

            });

    }


    // ==================================================
    // DATE FILTER
    // ==================================================

    if (activeFilter === "today") {

        filteredBirthdays =
            filteredBirthdays.filter((birthday) => {

                return getDaysUntilBirthday(
                    birthday.date
                ) === 0;

            });

    }


    else if (activeFilter === "week") {

        filteredBirthdays =
            filteredBirthdays.filter((birthday) => {

                const days =
                    getDaysUntilBirthday(
                        birthday.date
                    );

                return days >= 0 && days <= 7;

            });

    }


    else if (activeFilter === "month") {

        filteredBirthdays =
            filteredBirthdays.filter((birthday) => {

                const birthdayDate =
                    new Date(birthday.date);

                const today =
                    new Date();

                return (
                    birthdayDate.getMonth() ===
                    today.getMonth()
                );

            });

    }


    // ==================================================
    // SORT
    // ==================================================

    filteredBirthdays.sort((a, b) => {

        return (
            getDaysUntilBirthday(a.date) -
            getDaysUntilBirthday(b.date)
        );

    });


    // Update count

    birthdayCount.textContent =
        filteredBirthdays.length;


    // ==================================================
    // EMPTY
    // ==================================================

    if (filteredBirthdays.length === 0) {

        birthdayList.innerHTML = `
            <div class="no-birthday">

                <div style="font-size: 45px;">
                    🎂
                </div>

                <h3>No birthdays found</h3>

                <p>
                    Add a birthday to get started!
                </p>

            </div>
        `;

        return;

    }


    birthdayList.innerHTML = "";


    // ==================================================
    // CREATE CARDS
    // ==================================================

    filteredBirthdays.forEach((birthday) => {

        const days =
            getDaysUntilBirthday(
                birthday.date
            );


        let daysText = "";

        let daysClass = "upcoming";


        if (days === 0) {

            daysText =
                "🎉 Birthday is TODAY!";

            daysClass = "today";

        }

        else if (days === 1) {

            daysText =
                "🎈 Birthday is tomorrow!";

        }

        else {

            daysText =
                `⏳ ${days} days remaining`;

        }


        const card =
            document.createElement("div");


        card.className =
            "birthday-card";


        card.innerHTML = `

            <h3>
                🎂 ${escapeHTML(birthday.name)}
            </h3>

            <p>
                <strong>📅 Birthday:</strong>
                ${formatDate(birthday.date)}
            </p>

            <p>
                <strong>💫 Relation:</strong>
                ${escapeHTML(
                    birthday.relation ||
                    "Not specified"
                )}
            </p>

            <p>
                <strong>✉️ Email:</strong>
                ${escapeHTML(
                    birthday.email ||
                    "Not specified"
                )}
            </p>

            <p class="days ${daysClass}">
                ${daysText}
            </p>

            <div class="actions">

                <button
                    type="button"
                    class="edit-btn"
                    onclick="editBirthday('${birthday.id}')"
                >
                    ✏️ Edit
                </button>

                <button
                    type="button"
                    class="delete-btn"
                    onclick="deleteBirthday('${birthday.id}')"
                >
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

    const today =
        new Date();


    const birthDate =
        new Date(dateString);


    let birthday =
        new Date(

            today.getFullYear(),

            birthDate.getMonth(),

            birthDate.getDate()

        );


    if (birthday < today) {

        birthday.setFullYear(
            today.getFullYear() + 1
        );

    }


    today.setHours(
        0,
        0,
        0,
        0
    );


    birthday.setHours(
        0,
        0,
        0,
        0
    );


    const difference =
        birthday - today;


    return Math.ceil(
        difference /
        (1000 * 60 * 60 * 24)
    );

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(dateString) {

    const date =
        new Date(dateString);


    return date.toLocaleDateString(
        "en-IN",
        {

            day: "2-digit",

            month: "long",

            year: "numeric"

        }
    );

}


// ======================================================
// EDIT
// ======================================================

window.editBirthday =
    function (id) {

        const birthday =
            birthdays.find(
                (item) =>
                    item.id === id
            );


        if (!birthday) {

            showToast(
                "Birthday not found.",
                "error"
            );

            return;

        }


        document.getElementById(
            "birthdayId"
        ).value = birthday.id;


        document.getElementById(
            "name"
        ).value = birthday.name;


        document.getElementById(
            "date"
        ).value = birthday.date;


        document.getElementById(
            "relation"
        ).value =
            birthday.relation || "";


        document.getElementById(
            "email"
        ).value =
            birthday.email || "";


        formTitle.textContent =
            "Edit Birthday";


        formBadge.textContent =
            "Editing";


        saveButton.innerHTML =
            `<span class="btn-icon">💾</span> Update Birthday`;


        cancelButton.style.display =
            "inline-block";


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    };


// ======================================================
// DELETE
// ======================================================

window.deleteBirthday =
    async function (id) {

        const birthday =
            birthdays.find(
                (item) =>
                    item.id === id
            );


        if (!birthday) {

            return;

        }


        const confirmation =
            confirm(
                `Delete ${birthday.name}'s birthday?`
            );


        if (!confirmation) {

            return;

        }


        try {

            const birthdayRef =
                doc(
                    db,
                    "birthdays",
                    id
                );


            await deleteDoc(
                birthdayRef
            );


            showToast(
                "Birthday deleted successfully.",
                "success"
            );


            await loadBirthdays();

        }

        catch (error) {

            console.error(
                "Delete error:",
                error
            );


            showToast(
                "Unable to delete birthday.",
                "error"
            );

        }

    };


// ======================================================
// CANCEL EDIT
// ======================================================

cancelButton.addEventListener(
    "click",
    function () {

        resetForm();

    }
);


// ======================================================
// RESET FORM
// ======================================================

function resetForm() {

    birthdayForm.reset();


    document.getElementById(
        "birthdayId"
    ).value = "";


    formTitle.textContent =
        "Add Birthday";


    formBadge.textContent =
        "New";


    saveButton.innerHTML =
        `<span class="btn-icon">➕</span> Add Birthday`;


    cancelButton.style.display =
        "none";

}


// ======================================================
// SEARCH
// ======================================================

searchInput.addEventListener(
    "input",
    function () {

        displayBirthdays();

    }
);


// ======================================================
// FILTER TABS
// ======================================================

const filterTabs =
    document.querySelectorAll(
        ".filter-tab"
    );


filterTabs.forEach((tab) => {

    tab.addEventListener(
        "click",
        function () {

            filterTabs.forEach(
                (item) => {

                    item.classList.remove(
                        "active"
                    );

                }
            );


            this.classList.add(
                "active"
            );


            activeFilter =
                this.dataset.filter;


            displayBirthdays();

        }
    );

});


// ======================================================
// 🔔 ENABLE NOTIFICATIONS
// ======================================================

if (enableNotificationButton) {

    enableNotificationButton.addEventListener(
        "click",
        async function () {

            if (!("Notification" in window)) {

                alert(
                    "Your browser does not support notifications."
                );

                return;

            }


            const permission =
                await Notification.requestPermission();


            if (permission === "granted") {

                showToast(
                    "Notifications enabled! 🔔",
                    "success"
                );


                new Notification(
                    "Birthday Reminder 🎂",
                    {
                        body:
                            "Birthday notifications are now enabled!"
                    }
                );


                checkBirthdayReminders();

            }

            else {

                showToast(
                    "Notification permission was not allowed.",
                    "error"
                );

            }

        }
    );

}


// ======================================================
// 🔔 CHECK BIRTHDAY REMINDERS
// ======================================================

function checkBirthdayReminders() {

    if (!("Notification" in window)) {

        return;

    }


    if (Notification.permission !== "granted") {

        return;

    }


    if (!reminderDays) {

        return;

    }


    const selectedDays =
        Number(reminderDays.value);


    birthdays.forEach((birthday) => {

        const days =
            getDaysUntilBirthday(
                birthday.date
            );


        if (days === selectedDays) {

            sendBirthdayNotification(
                birthday,
                days
            );

        }

    });

}


// ======================================================
// SEND NOTIFICATION
// ======================================================

function sendBirthdayNotification(
    birthday,
    days
) {

    const storageKey =
        `birthday-reminder-${birthday.id}-${new Date().getFullYear()}-${days}`;


    // Prevent duplicate notification

    if (localStorage.getItem(storageKey)) {

        return;

    }


    let message = "";


    if (days === 1) {

        message =
            `${birthday.name}'s birthday is tomorrow! 🎂`;

    }

    else {

        message =
            `${birthday.name}'s birthday is in ${days} days! 🎉`;

    }


    new Notification(
        "Birthday Reminder 🔔",
        {
            body: message,
            icon: "🎂"
        }
    );


    // Remember that notification was shown

    localStorage.setItem(
        storageKey,
        "true"
    );

}


// ======================================================
// TOAST
// ======================================================

function showToast(
    message,
    type = "success"
) {

    const container =
        document.getElementById(
            "toastContainer"
        );


    if (!container) {

        alert(message);

        return;

    }


    const toast =
        document.createElement("div");


    toast.className =
        `toast ${type}`;


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    setTimeout(() => {

        toast.classList.add(
            "show"
        );

    }, 10);


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );


        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3000);

}


// ======================================================
// HTML SECURITY
// ======================================================

function escapeHTML(value) {

    if (!value) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}