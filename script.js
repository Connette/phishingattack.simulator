// --- STATE MANAGEMENT (using localStorage to persist state across pages) ---
function getState() {
    const state = localStorage.getItem('phishingSimulatorState');
    return state ? JSON.parse(state) : { attempts: 0, fails: 0, avoided: 0, darkMode: false, compromised: [] };
}

function saveState(newState) {
    localStorage.setItem('phishingSimulatorState', JSON.stringify(newState));
}

// --- DARK MODE TOGGLE (Unchanged) ---
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
    if (failsEl) failsEl.textContent = state.fails;
    if (avoidedEl) avoidedEl.textContent = state.avoided;
    
    loadTheftData(); 
}

// --- REVISED: LOAD THEFT DATA (Scenario column removed) ---
function loadTheftData() {
    const state = getState();
    const list = document.getElementById('compromisedList');
    if (!list) return;

    if (state.compromised.length === 0) {
        list.innerHTML = '<li style="text-align:center; opacity: 0.7;">No credentials compromised yet. Keep up the good work!</li>';
    } else {
        // Create a table-like header with only Username, Password, and Time
        let header = `
            <li class="theft-header">
                <span class="theft-col username-col">Username</span>
                <span class="theft-col password-col">Password</span>
                <span class="theft-col time-col">Time of Theft</span>
            </li>
        `;
        
        // Sort newest entry first
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
        // Combine header and list items
        list.innerHTML = header + theftItems.join('');
    }
}

// --- RESET STATISTICS (Unchanged) ---
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

// --- SIMULATION START FUNCTIONS (Unchanged, still saves key) ---

function startAnalysisScenario(type) {
    const state = getState();
    state.attempts++;
    saveState(state); 
    updateDashboard();

    // Still save the key in case you want to restore scenario tracking later
    localStorage.setItem('currentPhishTemplate', type);
    window.location.href = 'analysis.html#scenario-' + type;
}

function loadTemplate(type) {
    const state = getState();
    state.attempts++;
    saveState(state);
    updateDashboard();

    localStorage.setItem('currentPhishTemplate', type);
    window.location.href = 'simulation.html';
}

function loadReceiveTemplate(type) {
    const state = getState();
    state.attempts++;
    saveState(state);
    updateDashboard();

    localStorage.setItem('currentPhishTemplate', type);
    window.location.href = 'receive.html';
}

// --- submitPhish (The core logic for recording failure) ---
function submitPhish() {
    const usernameInput = document.getElementById('email'); 
    const passwordInput = document.getElementById('password');
    const result = document.getElementById('resultMsg');
    let state = getState();
    
    if (usernameInput.value === "" || passwordInput.value === "") {
        // SUCCESS (Avoided by not entering)
        result.textContent = "✅ Success! You avoided the attack by NOT entering credentials.";
        result.className = "result good";
        state.avoided++;
    } else {
        // FAILURE (Entered Credentials)
        result.textContent = "⚠️ Failed! You fell for the phishing attack by entering credentials.";
        result.className = "result bad";
        
        state.fails++; 

        // RECORD THEFT
        // Still save the scenario key, even though it's not displayed now
        const scenarioCode = localStorage.getItem('currentPhishTemplate'); 
        
        state.compromised.push({
            scenario: scenarioCode, 
            username: usernameInput.value,
            password: passwordInput.value,
            timestamp: new Date().toISOString()
        });
        
        // Clear inputs immediately after 'theft' simulation
        usernameInput.value = "";
        passwordInput.value = "";

        // Provide return link after failure
        result.innerHTML += `
            <div style="margin-top: 15px;">
                <a href="dashboard.html" class="login-btn">Return to Dashboard</a>
            </div>
        `;
    }

    saveState(state);
    updateDashboard(); 
    
    // Disable inputs after submission
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

// --- HELPER FUNCTIONS ---
function setSimEmail() {
    const input = document.getElementById('targetEmailInput').value;
    const target = document.getElementById('simEmailTarget');
    if (input.trim() === "") return;
    target.textContent = input;
    alert(`Simulated email target updated to: ${input}`);
}

function handleEmailLinkClick(e) {
    e.preventDefault();
    let state = getState();
    state.attempts++;
    saveState(state);

    alert("Simulated result: User clicked the suspicious link (a major security failure). This is only a training simulation.");
    localStorage.setItem('currentPhishTemplate', 'email');
    window.location.href = 'simulation.html';
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    updateDashboard(); 

    const simLink = document.getElementById('simEmailLink');
    if (simLink) {
        simLink.addEventListener('click', handleEmailLinkClick);
    }
});

// --- LOGOUT FUNCTION ---
function logout() {
    // Add a confirmation dialog. window.confirm() returns true if the user clicks "OK".
    if (window.confirm("Are you sure you want to log out of the Phishing Attack Simulator?")) {
        // Only navigate to the welcome page if the user confirms
        window.location.href = 'welcome.html';
    }
    // If the user clicks "Cancel" (returns false), the function does nothing, and they remain on the current page.
}

// ... (Rest of script.js remains unchanged) ...