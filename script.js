document.addEventListener("DOMContentLoaded", () => {
    // ================= DOM ELEMENTS =================
    const calInput = document.getElementById('cal-input');
    const protInput = document.getElementById('prot-input');
    const addBtn = document.getElementById('add-btn');
    const optionBulking = document.getElementById('option-bulking');
    const optionCutting = document.getElementById('option-cutting');
    
    const progBarCal = document.getElementById('prog-bar-cal');
    const progBarProt = document.getElementById('prog-bar-prot');
    const progTextCal = document.getElementById('prog-text-cal');
    const progTextProt = document.getElementById('prog-text-prot');
    const targetDisplayCal = document.getElementById('target-display-cal');
    const targetDisplayProt = document.getElementById('target-display-prot');
    const btnCustomTarget = document.getElementById('btn-custom-target');
    const btnCalcTDEE = document.getElementById('btn-calc-tdee');

    // Add Menu Modal
    const presetSelect = document.getElementById('preset-select');
    const btnOpenModal = document.getElementById('btn-open-modal'); 
    const btnDeletePreset = document.getElementById('btn-delete-preset');
    const menuModal = document.getElementById('menu-modal');
    const modalName = document.getElementById('modal-name');
    const modalCal = document.getElementById('modal-cal');
    const modalProt = document.getElementById('modal-prot');
    const modalBtnCancel = document.getElementById('modal-btn-cancel');
    const modalBtnConfirm = document.getElementById('modal-btn-confirm');
    const modalBtnSaveEat = document.getElementById('modal-btn-save-eat');

    // Edit History Modal
    const editHistoryModal = document.getElementById('edit-history-modal');
    const editHistoryDateDisplay = document.getElementById('edit-history-date-display');
    const editHistoryCal = document.getElementById('edit-history-cal');
    const editHistoryProt = document.getElementById('edit-history-prot');
    const editHistoryTarget = document.getElementById('edit-history-target'); // New input
    const btnCancelEditHistory = document.getElementById('btn-cancel-edit-history');
    const btnSaveEditHistory = document.getElementById('btn-save-edit-history');

    // TDEE Modal
    const tdeeModal = document.getElementById('tdee-modal');
    const tdeeGender = document.getElementById('tdee-gender');
    const tdeeWeight = document.getElementById('tdee-weight');
    const tdeeHeight = document.getElementById('tdee-height');
    const tdeeAge = document.getElementById('tdee-age');
    const tdeeActivity = document.getElementById('tdee-activity');
    const btnCancelTDEE = document.getElementById('btn-cancel-tdee');
    const btnConfirmTDEE = document.getElementById('btn-confirm-tdee');

    const toastContainer = document.getElementById('toast-container');
    const weightInput = document.getElementById('weight-input');
    const btnLogWeight = document.getElementById('btn-log-weight');
    const todayWeightDisplay = document.getElementById('today-weight-display');

    const mainPage = document.getElementById('main-page');
    const historyPage = document.getElementById('history-page');
    const summaryPage = document.getElementById('summary-page');
    const todayLogsContainer = document.getElementById('today-logs-container');
    const pastHistoryContainer = document.getElementById('past-history-container');
    const btnLoadMore = document.getElementById('btn-load-more'); 
    
    const btnHistory = document.getElementById('history-detailed');
    const btnSummary = document.getElementById('summary-btn');
    const btnReset = document.getElementById('reset-btn');
    const btnTheme = document.getElementById('theme-toggle-btn');
    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const importFile = document.getElementById('import-file');
    const backBtn = document.getElementById('back-btn');
    const backSumBtn = document.getElementById('back-from-summary');

    const prevWeekBtn = document.getElementById('prev-week-btn');
    const nextWeekBtn = document.getElementById('next-week-btn');
    const weekRangeText = document.getElementById('week-range-text');
    const chartBtns = document.querySelectorAll('.chart-btn');

    // ================= STATE VARIABLES =================
    let todayLogs = []; 
    let weightLogs = []; 
    let presets = [];    
    
    let tdeeBase = 2400; // Base TDEE before phase adjustment
    let targetCal = 2400;
    let targetProt = 130;
    let currentPhase = 'maintenance'; 
    
    let currentWeekOffset = 0;
    let historyVisibleCount = 7; 
    let calorieChart = null;
    let weightChart = null;
    const TDEE_BASE = 2400; 
    let editingHistoryDate = null; 

    // ================= HELPER FUNCTIONS =================
    function getTodayStr() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth()+1).padStart(2,'0');
        const day = String(d.getDate()).padStart(2,'0');
        return `${y}-${m}-${day}`;
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr);
        if (isNaN(date)) return dateStr;
        return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    function calculateExpression(expressionString) {
        if (!expressionString) return NaN;
        const cleanedString = expressionString.toString().replace(/[^0-9+\-*/.]/g, '');
        try {
            return Function(`'use strict'; return (${cleanedString})`)();
        } catch (e) {
            return NaN;
        }
    }

    function calculateTotals() {
        let c=0, p=0;
        todayLogs.forEach(l => { c += l.cal; p += l.prot; });
        return { cal: c, prot: p };
    }

    function saveData() {
        const data = {
            date: getTodayStr(),
            logs: todayLogs,
            weightLogs: weightLogs,
            presets: presets,
            targetCal, targetProt, currentPhase, tdeeBase
        };
        localStorage.setItem('calTrackerUltimate', JSON.stringify(data));
    }

    function loadData() {
        const raw = localStorage.getItem('calTrackerUltimate');
        const today = getTodayStr();
        if(raw) {
            const data = JSON.parse(raw);
            // Handle new day
            if(data.date && data.date !== today) {
                archiveData(data);
                todayLogs = [];
            } else {
                todayLogs = data.logs || [];
            }
            weightLogs = data.weightLogs || [];
            presets = data.presets || [];
            tdeeBase = data.tdeeBase || 2400;
            targetCal = data.targetCal || 2400;
            targetProt = data.targetProt || 130;
            currentPhase = data.currentPhase || 'maintenance';
        }
        updateUI();
        updatePresetDropdown();
        updateWeightDisplay();
    }

    function archiveData(oldData) {
        let history = JSON.parse(localStorage.getItem('calTrackerHistory')) || [];
        let c=0, p=0;
        (oldData.logs||[]).forEach(l => { c+=l.cal; p+=l.prot; });
        
        if(c>0 || p>0) {
            // Check if entry already exists to avoid dupes on page refresh issues
            const existingIdx = history.findIndex(h => h.date === oldData.date);
            
            const historyEntry = {
                date: oldData.date,
                totalCal: c, 
                totalProt: p,
                phase: oldData.currentPhase,
                // Important: Store the Target used on that day
                targetCal: oldData.targetCal || 2400,
                targetProt: oldData.targetProt || 130
            };

            if(existingIdx !== -1) {
                history[existingIdx] = historyEntry;
            } else {
                history.unshift(historyEntry);
            }
            
            // Limit history size if needed
            if(history.length > 365) history = history.slice(0,365);
            
            localStorage.setItem('calTrackerHistory', JSON.stringify(history));
        }
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ================= UI UPDATES =================
    function updateUI() {
        const totals = calculateTotals();
        const calPct = Math.min((totals.cal / targetCal) * 100, 100);
        const protPct = Math.min((totals.prot / targetProt) * 100, 100);
        
        progBarCal.style.width = `${calPct}%`;
        progBarProt.style.width = `${protPct}%`;
        
        progTextCal.textContent = `${totals.cal} / ${targetCal}`;
        progTextProt.textContent = `${totals.prot} / ${targetProt}`;
        
        targetDisplayCal.textContent = `Target Cal: ${targetCal}`;
        targetDisplayProt.textContent = `Target Prot: ${targetProt}g`;

        // Update Phase Button Texts based on TDEE Base
        optionBulking.innerHTML = `Bulking (${tdeeBase + 400})`; // +400 Surplus
        optionCutting.innerHTML = `Cutting (${tdeeBase - 500})`; // -500 Deficit

        // Update Button Styles
        optionBulking.style.borderColor = '';
        optionCutting.style.borderColor = '';
        if(currentPhase === 'bulking') optionBulking.style.borderColor = '#27ae60';
        else if(currentPhase === 'cutting') optionCutting.style.borderColor = '#e74c3c';

        saveData();
    }

    function updateWeightDisplay() {
        const todayEntry = weightLogs.find(w => w.date === getTodayStr());
        todayWeightDisplay.textContent = todayEntry ? `Today's Logged Weight: ${todayEntry.weight} kg` : "";
    }

    // ================= EVENT HANDLERS =================
    
    // --- MANUAL EDIT TARGETS ---
    btnCustomTarget.addEventListener('click', () => {
        const newCal = prompt("Enter Custom Calorie Target:", targetCal);
        const newProt = prompt("Enter Custom Protein Target:", targetProt);
        if(newCal && newProt) {
            targetCal = parseInt(newCal);
            targetProt = parseInt(newProt);
            currentPhase = 'custom';
            updateUI();
            showToast("Custom targets updated!");
        }
    });

    // --- TDEE CALCULATOR ---
    btnCalcTDEE.addEventListener('click', () => {
        tdeeModal.style.display = 'flex';
    });

    btnCancelTDEE.addEventListener('click', () => {
        tdeeModal.style.display = 'none';
    });

    btnConfirmTDEE.addEventListener('click', () => {
        const weight = parseFloat(tdeeWeight.value);
        const height = parseFloat(tdeeHeight.value);
        const age = parseFloat(tdeeAge.value);
        const gender = tdeeGender.value;
        const activity = parseFloat(tdeeActivity.value);

        if(!weight || !height || !age) {
            showToast("Please fill all fields.", "error");
            return;
        }

        // Mifflin-St Jeor Equation
        let bmr = (10 * weight) + (6.25 * height) - (5 * age);
        bmr += (gender === 'male') ? 5 : -161;

        const tdee = Math.round(bmr * activity);

        tdeeBase = tdee; // Update Base TDEE
        targetCal = tdee; // Set current target to Maintenance
        targetProt = Math.round(weight * 2); // Auto protein: ~2g per kg
        currentPhase = 'maintenance';
        
        updateUI();
        showToast(`Target set! TDEE: ${tdee} kcal`);
        tdeeModal.style.display = 'none';
    });

    // --- ADD MENU MODAL ---
    function updatePresetDropdown() {
        presetSelect.innerHTML = '<option value="">-- Select Food --</option>';
        presets.forEach((p, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = `${p.name} (${p.cal}kcal, ${p.prot}g)`;
            presetSelect.appendChild(opt);
        });
    }

    btnOpenModal.addEventListener('click', () => {
        menuModal.style.display = 'flex';
        if(calInput.value) modalCal.value = calInput.value;
        if(protInput.value) modalProt.value = protInput.value;
        modalName.focus();
    });

    modalBtnCancel.addEventListener('click', () => {
        menuModal.style.display = 'none';
        modalName.value = ''; modalCal.value = ''; modalProt.value = '';
    });

    modalBtnConfirm.addEventListener('click', () => savePreset(false));
    modalBtnSaveEat.addEventListener('click', () => savePreset(true));

    function savePreset(addImmediately) {
        const name = modalName.value;
        const c = calculateExpression(modalCal.value);
        const p = calculateExpression(modalProt.value);

        if(!name || isNaN(c) || isNaN(p)) {
            showToast("Please fill in all fields correctly.", "error");
            return;
        }

        presets.push({ name, cal: c, prot: p });
        updatePresetDropdown();
        
        if (addImmediately) {
            todayLogs.push({ id: Date.now(), cal: c, prot: p });
            updateUI();
            showToast(`Added ${name} to daily log!`);
        } else {
            showToast(`Menu ${name} saved!`);
        }
        
        saveData();
        menuModal.style.display = 'none';
        modalName.value = ''; modalCal.value = ''; modalProt.value = '';
    }

    presetSelect.addEventListener('change', (e) => {
        const idx = e.target.value;
        if(idx !== "") {
            calInput.value = presets[idx].cal;
            protInput.value = presets[idx].prot;
        }
    });

    btnDeletePreset.addEventListener('click', () => {
        const idx = presetSelect.value;
        if(idx !== "" && confirm("Delete this preset?")) {
            presets.splice(idx, 1);
            updatePresetDropdown();
            calInput.value = ''; protInput.value = '';
            saveData();
            showToast("Menu deleted.");
        }
    });

    // --- WEIGHT LOGGING ---
    btnLogWeight.addEventListener('click', () => {
        const w = parseFloat(weightInput.value);
        if(w > 0) {
            const today = getTodayStr();
            weightLogs = weightLogs.filter(l => l.date !== today);
            weightLogs.push({ date: today, weight: w });
            weightLogs.sort((a,b) => new Date(a.date) - new Date(b.date));
            updateWeightDisplay();
            weightInput.value = '';
            saveData();
            showToast("Weight logged successfully!");
        }
    });

    // --- ADD BUTTON ---
    addBtn.addEventListener('click', () => {
        const c = calculateExpression(calInput.value);
        const p = calculateExpression(protInput.value);
        
        if((!isNaN(c) && c > 0) || (!isNaN(p) && p > 0)) {
            todayLogs.push({ id: Date.now(), cal: c||0, prot: p||0 });
            calInput.value = ''; protInput.value = '';
            updateUI();
            showToast("Entry added!");
        } else {
            showToast("Please enter valid numbers", "error");
        }
    });

    // --- EDIT HISTORY MODAL LOGIC ---
    window.openEditHistoryModal = function(date, oldCal, oldProt, oldTarget) {
        editingHistoryDate = date; 
        editHistoryDateDisplay.textContent = `Editing Date: ${formatDate(date)}`;
        editHistoryCal.value = oldCal;
        editHistoryProt.value = oldProt;
        
        // Find target from history or use TDEE base fallback
        let history = JSON.parse(localStorage.getItem('calTrackerHistory')) || [];
        const entry = history.find(h => h.date === date);
        const currentTarget = entry && entry.targetCal ? entry.targetCal : 2400;
        editHistoryTarget.value = currentTarget;

        editHistoryModal.style.display = 'flex';
        editHistoryCal.focus();
    };

    btnCancelEditHistory.addEventListener('click', () => {
        editHistoryModal.style.display = 'none';
        editingHistoryDate = null;
    });

    btnSaveEditHistory.addEventListener('click', () => {
        if (!editingHistoryDate) return;

        const newCal = calculateExpression(editHistoryCal.value);
        const newProt = calculateExpression(editHistoryProt.value);
        const newTarget = calculateExpression(editHistoryTarget.value);

        if (!isNaN(newCal) && !isNaN(newProt) && !isNaN(newTarget)) {
            let history = JSON.parse(localStorage.getItem('calTrackerHistory')) || [];
            const idx = history.findIndex(h => h.date === editingHistoryDate);
            
            if (idx !== -1) {
                history[idx].totalCal = newCal;
                history[idx].totalProt = newProt;
                history[idx].targetCal = newTarget; // Update stored target
                localStorage.setItem('calTrackerHistory', JSON.stringify(history));
                
                renderHistoryPage();
                showToast("History updated successfully!");
                editHistoryModal.style.display = 'none';
                editingHistoryDate = null;
            }
        } else {
            showToast("Invalid number format.", "error");
        }
    });

    // --- RENDER HISTORY PAGE ---
    function renderHistoryPage() {
        todayLogsContainer.innerHTML = '';
        [...todayLogs].reverse().forEach(log => {
            const div = document.createElement('div');
            div.className = 'log-item';
            div.innerHTML = `<span><b>${log.cal}</b> kcal, <b>${log.prot}</b>g</span> <button class="delete-btn" onclick="deleteLog(${log.id})">Del</button>`;
            todayLogsContainer.appendChild(div);
        });

        const history = JSON.parse(localStorage.getItem('calTrackerHistory')) || [];
        pastHistoryContainer.innerHTML = '';
        
        if (history.length === 0) {
            pastHistoryContainer.innerHTML = '<p style="text-align: center; color: #888;">No past history found.</p>';
            btnLoadMore.style.display = 'none';
            return;
        }

        const visibleHistory = history.slice(0, historyVisibleCount);
        
        visibleHistory.forEach(day => {
            // Retrieve stored target or default to 2400 if missing (old data)
            let targetC = day.targetCal || 2400; 
            const targetP = day.targetProt || 130;

            const calDiff = day.totalCal - targetC;
            let calDiffHtml = calDiff > 0 ? `<span class="stat-bad">+${calDiff}</span>` : (calDiff < 0 ? `<span class="stat-good">${calDiff}</span>` : `<span class="stat-neutral">0</span>`);
            let protStatusHtml = day.totalProt >= targetP ? `<span class="stat-good">✔ Reach (+${day.totalProt - targetP})</span>` : `<span class="stat-bad">✘ Miss (${day.totalProt - targetP})</span>`;

            const prettyDate = formatDate(day.date);

            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-header">
                    <span>${prettyDate}</span>
                    <div>
                        <button class="edit-btn" onclick="openEditHistoryModal('${day.date}', ${day.totalCal}, ${day.totalProt})">✎</button>
                        <button class="delete-btn" onclick="deleteHistory('${day.date}')">🗑</button>
                    </div>
                </div>
                <div class="history-details" style="margin-top:5px; display:flex; justify-content:space-between; font-weight:bold;">
                    <span>${day.totalCal} kcal</span>
                    <span>${day.totalProt} g Protein</span>
                </div>
                <div class="history-details" style="font-size:0.85em; margin-top:5px;"><span>Diff: ${calDiffHtml} kcal</span><span>Prot: ${protStatusHtml}</span></div>
                <div style="font-size: 0.75em; color: #888; text-align: right; margin-top: 2px;">Mode: ${day.phase || 'Unknown'} (Target: ${targetC})</div>
            `;
            pastHistoryContainer.appendChild(div);
        });

        if (historyVisibleCount >= history.length) {
            btnLoadMore.style.display = 'none';
        } else {
            btnLoadMore.style.display = 'block';
        }
    }

    btnLoadMore.addEventListener('click', () => {
        historyVisibleCount += 7;
        renderHistoryPage();
    });

    window.deleteLog = function(id) {
        todayLogs = todayLogs.filter(l => l.id !== id);
        updateUI(); renderHistoryPage();
        showToast("Log deleted.", "error");
    };

    window.deleteHistory = function(date) {
        if(confirm(`Delete history for ${date}?`)) {
            let history = JSON.parse(localStorage.getItem('calTrackerHistory')) || [];
            history = history.filter(h => h.date !== date);
            localStorage.setItem('calTrackerHistory', JSON.stringify(history));
            renderHistoryPage();
            showToast("History deleted.", "error");
        }
    };

    // --- RENDER SUMMARY PAGE (FIXED WEEKLY & WEIGHT) ---
    function renderSummary() {
        const history = JSON.parse(localStorage.getItem('calTrackerHistory')) || [];
        
        // --- 1. GENERATE DATE RANGE (Fixed 7 Days) ---
        const days = [];
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - (currentWeekOffset * 7)); // Shift by weeks
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date(endDate);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
            days.push(dateStr);
        }

        // --- 2. MAP DATA TO DATES ---
        const labels = [];
        const dataCal = [];
        const dataWeight = [];
        let deficitSum = 0;

        // Check Today's data
        const currentTotals = calculateTotals();
        const todayStr = getTodayStr();

        days.forEach(dateStr => {
            // Label
            const dateObj = new Date(dateStr);
            labels.push(`${dateObj.getDate()} ${dateObj.toLocaleDateString('en-GB', { month: 'short' })}`);

            // Calorie Data
            let cal = 0;
            if (dateStr === todayStr) {
                cal = currentTotals.cal;
            } else {
                const h = history.find(item => item.date === dateStr);
                if (h) cal = h.totalCal;
            }
            dataCal.push(cal);

            // Weight Data
            const w = weightLogs.find(item => item.date === dateStr);
            dataWeight.push(w ? w.weight : null); // null allows Chart.js to span gaps

            // Deficit Calculation (Only count days with logs)
            if (cal > 0) {
                deficitSum += (TDEE_BASE - cal);
            }
        });

        // --- 3. UI UPDATES ---
        weekRangeText.textContent = `${formatDate(days[0])}  to  ${formatDate(days[6])}`;
        nextWeekBtn.disabled = (currentWeekOffset === 0);

        const kg = deficitSum / 7700;
        document.getElementById('fat-loss-val').textContent = `${kg > 0 ? '-' : '+'}${Math.abs(kg).toFixed(2)} kg`;

        // Theme Check
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#ecf0f1' : '#333';
        const gridColor = isDark ? '#444' : '#ddd';

        // --- 4. RENDER CHARTS ---
        const ctxC = document.getElementById('weeklyChart').getContext('2d');
        if(calorieChart) calorieChart.destroy();
        
        calorieChart = new Chart(ctxC, {
            type: document.querySelector('.chart-btn.active').dataset.type,
            data: {
                labels: labels,
                datasets: [{ 
                    label: 'Calories', 
                    data: dataCal, 
                    backgroundColor: 'rgba(52, 152, 219, 0.6)', 
                    borderColor: 'rgba(52, 152, 219, 1)', 
                    borderWidth: 1 
                }]
            },
            options: { 
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { ticks: { color: textColor }, grid: { color: gridColor }, beginAtZero: true }
                },
                plugins: { legend: { labels: { color: textColor } } }
            }
        });

        const ctxW = document.getElementById('weightChart').getContext('2d');
        if(weightChart) weightChart.destroy();
        
        weightChart = new Chart(ctxW, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ 
                    label: 'Weight (kg)', 
                    data: dataWeight, 
                    borderColor: '#9b59b6', 
                    backgroundColor: 'rgba(155, 89, 182, 0.2)', 
                    tension: 0.3, 
                    fill: true,
                    spanGaps: true // Connect points even if some days are missing
                }]
            },
            options: { 
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { ticks: { color: textColor }, grid: { color: gridColor } }
                },
                plugins: { legend: { labels: { color: textColor } } }
            }
        });
    }

    // --- OTHER EVENT LISTENERS ---
    
    // Dynamic Bulking/Cutting
    optionBulking.addEventListener('click', () => { 
        targetCal = tdeeBase + 400; 
        currentPhase = 'bulking'; 
        updateUI(); 
        showToast(`Switched to Bulking (${targetCal} kcal)`); 
    });
    
    optionCutting.addEventListener('click', () => { 
        targetCal = tdeeBase - 500; 
        currentPhase = 'cutting'; 
        updateUI(); 
        showToast(`Switched to Cutting (${targetCal} kcal)`); 
    });

    btnHistory.addEventListener('click', () => { 
        mainPage.style.display='none'; 
        summaryPage.style.display='none'; 
        historyPage.style.display='block'; 
        historyVisibleCount = 7; 
        renderHistoryPage(); 
    });
    
    btnSummary.addEventListener('click', () => { mainPage.style.display='none'; historyPage.style.display='none'; summaryPage.style.display='block'; renderSummary(); });
    
    [backBtn, backSumBtn].forEach(b => b.addEventListener('click', () => {
        historyPage.style.display='none'; summaryPage.style.display='none'; mainPage.style.display='block';
    }));

    btnReset.addEventListener('click', () => {
        if(confirm("Clear TODAY's data?")) { todayLogs=[]; updateUI(); showToast("Today's data reset."); }
    });
    
    // Theme Toggle Fixed
    document.getElementById('theme-toggle-btn').addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        this.textContent = isDark ? 'Light' : 'Dark'; // Update Button Text
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        if(summaryPage.style.display === 'block') renderSummary(); 
    });

    // Press Enter to Submit
    function handleMainEnter(e) { if (e.key === 'Enter') addBtn.click(); }
    calInput.addEventListener('keypress', handleMainEnter);
    protInput.addEventListener('keypress', handleMainEnter);

    function handleModalEnter(e) { if (e.key === 'Enter') modalBtnSaveEat.click(); }
    document.getElementById('modal-name').addEventListener('keypress', handleModalEnter);
    document.getElementById('modal-cal').addEventListener('keypress', handleModalEnter);
    document.getElementById('modal-prot').addEventListener('keypress', handleModalEnter);

    // Chart Switcher
    chartBtns.forEach(b => b.addEventListener('click', (e) => {
        chartBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        renderSummary();
    }));

    prevWeekBtn.addEventListener('click', () => {
        currentWeekOffset++;
        renderSummary();
    });

    nextWeekBtn.addEventListener('click', () => {
        if (currentWeekOffset > 0) {
            currentWeekOffset--;
            renderSummary();
        }
    });

    // Data Export/Import
    btnExport.addEventListener('click', () => {
        const exportObj = {
            current: JSON.parse(localStorage.getItem('calTrackerUltimate') || '{}'),
            history: JSON.parse(localStorage.getItem('calTrackerHistory') || '[]')
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", "calorie_backup_" + getTodayStr() + ".json");
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        showToast("Data exported!");
    });

    btnImport.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if(imported.current) localStorage.setItem('calTrackerUltimate', JSON.stringify(imported.current));
                if(imported.history) localStorage.setItem('calTrackerHistory', JSON.stringify(imported.history));
                alert("Data Imported Successfully! Reloading...");
                location.reload();
            } catch(err) { showToast("Invalid File Format", "error"); }
        };
        reader.readAsText(file);
    });

    // Init
    loadData();
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle-btn').textContent = 'Light';
    }
});