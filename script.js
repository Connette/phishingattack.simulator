// --- STATE MANAGEMENT ---
function getState() {
    const state = localStorage.getItem('phishingSimulatorState');
    return state ? JSON.parse(state) : { attempts: 0, fails: 0, avoided: 0, darkMode: false, compromised: [] };
}

function saveState(newState) {
    localStorage.setItem('phishingSimulatorState', JSON.stringify(newState));
}

// --- DARK MODE TOGGLE ---
function initDarkMode() {
    const state = getState();
    const body = document.body;
    const toggle = document.getElementById('toggleDark');

    if (state.darkMode) {
        body.classList.add('dark');
        if (toggle) toggle.checked = true;
    }

    if (toggle) {
        toggle.addEventListener('change', () => {
            const currentState = getState();
            currentState.darkMode = toggle.checked;
            body.classList.toggle('dark', toggle.checked);
            saveState(currentState);
        });
    }
}

// --- DASHBOARD FUNCTIONS ---
function updateDashboard() {
    const state = getState();
    const attemptsEl = document.getElementById('attempts');
    const failsEl = document.getElementById('fails');
    const avoidedEl = document.getElementById('avoided');

    if (attemptsEl) attemptsEl.textContent = state.attempts;
    // Fails is now strictly proportionate to the entries in compromised
    if (failsEl) failsEl.textContent = state.compromised.length; 
    if (avoidedEl) avoidedEl.textContent = state.avoided;
    
    loadTheftData(); 
}

function loadTheftData() {
    const state = getState();
    const list = document.getElementById('compromisedList');
    if (!list) return;

    if (state.compromised.length === 0) {
        list.innerHTML = '<li style="text-align:center; opacity: 0.7;">No credentials compromised yet. Keep up the good work!</li>';
    } else {
        let header = `
            <li class="theft-header">
                <span class="theft-col username-col">Username</span>
                <span class="theft-col password-col">Password</span>
                <span class="theft-col time-col">Time of Theft</span>
            </li>
        `;
        
        const theftItems = state.compromised.slice().reverse().map((item) => {
            const date = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date(item.timestamp).toLocaleDateString();
            return `
                <li class="theft-item">
                    <span class="theft-col username-col"><strong>${item.username}</strong></span>
                    <span class="theft-col password-col"><strong>${item.password}</strong></span>
                    <span class="theft-col time-col">${date}</span>
                </li>
            `;
        });
        list.innerHTML = header + theftItems.join('');
    }
}

function resetStatistics() {
    if (confirm('Are you sure you want to reset all statistics, including compromised credentials? This cannot be undone.')) {
        const state = getState();
        state.attempts = 0;
        state.fails = 0;
        state.avoided = 0;
        state.compromised = []; 
        saveState(state);
        updateDashboard();
        alert('Statistics and compromised data have been reset!');
    }
}

// --- LOGOUT FUNCTION (With Verification) ---
function logout() {
    if (window.confirm("Are you sure you want to log out? Any unsaved progress will be lost.")) {
        window.location.href = 'welcome.html';
    }
}

// --- SUBMIT PHISH (Strictly recording failure only on credential entry) ---
function submitPhish() {
    const usernameInput = document.getElementById('email'); 
    const passwordInput = document.getElementById('password');
    const result = document.getElementById('resultMsg');
    let state = getState();
    
    // Logic: ONLY "Fell for Attack" if input is NOT empty
    if (usernameInput.value.trim() === "" || passwordInput.value.trim() === "") {
        // SUCCESS (Avoided by leaving fields blank)
        result.textContent = "✅ Success! You avoided the attack by NOT entering credentials.";
        result.className = "result good";
        state.avoided++;
    } else {
        // FAILURE (Credentials Entered)
        result.textContent = "⚠️ Failed! You fell for the phishing attack by entering credentials.";
        result.className = "result bad";
        
        // This ensures proportionate numbers: 1 list entry = 1 fail
        state.fails++; 

        state.compromised.push({
            username: usernameInput.value,
            password: passwordInput.value,
            timestamp: new Date().toISOString()
        });
        
        usernameInput.value = "";
        passwordInput.value = "";

        result.innerHTML += `
            <div style="margin-top: 15px;">
                <a href="dashboard.html" class="login-btn">Return to Dashboard</a>
            </div>
        `;
    }

    saveState(state);
    updateDashboard(); 
    
    if (usernameInput) usernameInput.disabled = true;
    if (passwordInput) passwordInput.disabled = true;
    const submitButton = document.querySelector('.login-btn');
    if (submitButton) submitButton.style.display = 'none';
}

function ignorePhish() {
    const result = document.getElementById('resultMsg');
    let state = getState();
    result.textContent = "✅ Excellent! You successfully identified and ignored the phishing attempt.";
    result.className = "result good";
    state.avoided++;
    saveState(state);
    updateDashboard();
}

// --- SIMULATION NAVIGATION ---
function startAnalysisScenario(type) {
    const state = getState();
    state.attempts++;
    saveState(state); 
    localStorage.setItem('currentPhishTemplate', type);
    window.location.href = 'analysis.html#scenario-' + type;
}

function loadTemplate(type) {
    const state = getState();
    state.attempts++;
    saveState(state);
    localStorage.setItem('currentPhishTemplate', type);
    window.location.href = 'simulation.html';
}

function loadReceiveTemplate(type) {
    const state = getState();
    state.attempts++;
    saveState(state);
    localStorage.setItem('currentPhishTemplate', type);
    window.location.href = 'receive.html';
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    updateDashboard(); 
});
