// Utility: safely query a DOM element
function getEl(selector) {
    const el = document.querySelector(selector);
    if (!el) {
        console.error(`❌ Element not found: ${selector}`);
    }
    return el;
}

// Utility: convert HH:MM → total minutes
function parseTime(str) {
    if (!/^\d{1,2}:\d{2}$/.test(str)) return null; // invalid format
    const [h, m] = str.split(":").map(Number);
    if (h > 23 || m > 59) return null;
    return h * 60 + m;
}

// Toggle between Full Day and Half Day
function toggle_card(card) {
    try {
        const isFull = card === "fullday";

        const fullDiv = getEl('.fullday');
        const halfDiv = getEl('.halfday');
        const tabSpans = document.querySelectorAll('.toggle_shift span');

        if (!fullDiv || !halfDiv || !tabSpans.length) return;

        fullDiv.classList.toggle('active', isFull);
        halfDiv.classList.toggle('active', !isFull);

        const input = getEl(`.${isFull ? 'fullday' : 'halfday'}-input`);
        input?.focus();

        // Remove & add active tab styling
        tabSpans.forEach(span => span.classList.remove('active'));
        const tabToActivate = document.querySelector(`.toggle_shift span[onclick*="${card}"]`);
        tabToActivate?.classList.add('active');

    } catch (err) {
        console.error("❌ toggle_card error:", err);
    }
}

// Core break-time calculation
function calculateBreak(day_shift) {
    try {
        const input = getEl(`.${day_shift}-input`);
        const resultDiv = getEl(`.${day_shift}-result`);

        if (!input || !resultDiv) return;

        const timeStr = input.value.trim();
        const currentTimerMins = parseTime(timeStr);

        // Input validation
        if (currentTimerMins === null) {
            resultDiv.innerText = "⛔ Invalid time. Use HH:MM format.";
            return;
        }

        // Shift durations reduced to one clean source of truth
        const shiftTargets = {
            fullday: 7 * 60 + 5,
            halfday: 4 * 60 + 5
        };

        const targetTimerMins = shiftTargets[day_shift] ?? null;
        if (targetTimerMins === null) {
            resultDiv.innerText = "⛔ Unknown shift type.";
            return;
        }

        const now = new Date();
        const currentClockMins = now.getHours() * 60 + now.getMinutes();
        const targetClockMins = 16 * 60; // 4 PM cutoff

        const timerRemaining = targetTimerMins - currentTimerMins;
        const realTimeRemaining = targetClockMins - currentClockMins;
        const breakTime = realTimeRemaining - timerRemaining;

        // Calculate end-of-shift time
        const endMins = currentClockMins + timerRemaining;

        if (timerRemaining <= 0) {
            if (day_shift === "halfday") {
                resultDiv.innerText = "All done! You’re free to go home… run before someone stops you. 😁✨";
                return;
            }
            resultDiv.innerText = "You’re free to relax now… take every break your heart wants. 😁";
            return;
        }

        const endHour = Math.floor(endMins / 60);
        const endMin = endMins % 60;

        const formattedTime = new Date();
        formattedTime.setHours(endHour);
        formattedTime.setMinutes(endMin);

        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        const timeString = formattedTime.toLocaleTimeString([], options);

        // Generate break message
        let message = "";
        if (day_shift === "fullday") {
            if (breakTime < 0) {
                const overTimeMins = Math.abs(breakTime);
                message = `😟 You're behind by ${Math.floor(overTimeMins / 60)} hrs and ${overTimeMins % 60} mins.`;
            } else if (breakTime > 60) {
                message = `🥳 Long break! ${fmt(breakTime)}.`;
            } else if (breakTime < 30) {
                message = `😟 Short break: ${fmt(breakTime)}.`;
            } else {
                message = `😄 You can take a break of ${fmt(breakTime)}.`;
            }
        }

        const targetText = day_shift === "fullday" ? "7 hrs 5 mins" : "4 hrs 5 mins";
        resultDiv.innerText = `${message}\n⏰ You'll reach ${targetText} at ${timeString}`;

    } catch (err) {
        console.error("❌ calculateBreak error:", err);
    }
}

// Helper: format minutes → "X hrs Y mins"
function fmt(mins) {
    mins = Math.abs(mins);
    return `${Math.floor(mins / 60)} hrs ${mins % 60} mins`;
}

// Enter key submission
function handleKeyPress(event, type) {
    if (event.key === "Enter") {
        calculateBreak(type);
    }
}
