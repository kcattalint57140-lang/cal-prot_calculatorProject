document.addEventListener("DOMContentLoaded", () => {
            const calInput = document.getElementById('cal-input');
            const protInput = document.getElementById('prot-input');
            const addBtn = document.getElementById('add-btn');
            const optionBulking = document.getElementById('option-bulking');
            const optionCutting = document.getElementById('option-cutting');
            const themeToggleBtn = document.getElementById('theme-toggle-btn');
            const historyDetailedBtn = document.getElementById('history-detailed');
            const resetBtn = document.getElementById('reset-btn'); 

            const totalCal = document.getElementById('total-cal');
            const totalProt = document.getElementById('total-prot');
            const needMoreCal = document.getElementById('need-more-cal');
            const needMoreProt = document.getElementById('need-more-prot');

            let currentCal = 0;
            let currentProt = 0;
            let targetCal = 2100;
            let targetProt = 130;
            let currentPhase = 'default'; 

            // ==========================================================
            // ฟังก์ชันหลัก: บันทึก, โหลด, และแสดงผล
            // ==========================================================

            function saveData() {
                const data = {
                    currentCal: currentCal,
                    currentProt: currentProt,
                    targetCal: targetCal,
                    targetProt: targetProt,
                    currentPhase: currentPhase,
                };
                localStorage.setItem('calorieTrackerData', JSON.stringify(data));
            }

            function loadData() {
                const storedData = localStorage.getItem('calorieTrackerData');
                if (storedData) {
                    const data = JSON.parse(storedData);
                    currentCal = data.currentCal || 0;
                    currentProt = data.currentProt || 0;
                    targetCal = data.targetCal || 2100;
                    targetProt = data.targetProt || 130;
                    currentPhase = data.currentPhase || 'default';
                }
            }
            
            function updatePhaseButtons() {
                const isDarkMode = document.body.classList.contains('dark-mode');
                
                // กำหนดสีเน้น (Highlight Colors)
                const bulkingActiveBg = '#27ae60'; // สีเขียวสำหรับ Bulking
                const cuttingActiveBg = '#e74c3c'; // สีแดงสำหรับ Cutting

                // กำหนดสีปกติ
                const defaultBg = isDarkMode ? '#383838' : ''; // สีพื้นหลังปกติ (ตามธีม)
                const defaultBorderColor = isDarkMode ? '#f0f0f0' : '#ccc'; // สีขอบปกติ
                const defaultTextColor = isDarkMode ? '#f0f0f0' : 'black'; // สีตัวอักษรปกติ

                // รีเซ็ตปุ่มทั้งหมด
                optionBulking.style.borderColor = defaultBorderColor;
                optionCutting.style.borderColor = defaultBorderColor;
                optionBulking.style.backgroundColor = defaultBg;
                optionCutting.style.backgroundColor = defaultBg;
                optionBulking.style.color = defaultTextColor;
                optionCutting.style.color = defaultTextColor;

                // เน้น Phase ที่กำลังเลือกอยู่
                if (currentPhase === 'bulking') {
                    optionBulking.style.backgroundColor = bulkingActiveBg;
                    optionBulking.style.color = 'white'; 
                    optionBulking.style.borderColor = bulkingActiveBg;
                } else if (currentPhase === 'cutting') {
                    optionCutting.style.backgroundColor = cuttingActiveBg;
                    optionCutting.style.color = 'white'; 
                    optionCutting.style.borderColor = cuttingActiveBg;
                }
            }

            function updateDisplay() {
                totalCal.textContent = `Calorie: ${currentCal} kcal.`;
                totalProt.textContent = `Protein: ${currentProt} g.`;

                const remainingCal = targetCal - currentCal;
                const remainingProt = targetProt - currentProt;

                needMoreCal.textContent = `Calorie: ${remainingCal < 0 ? 0 : remainingCal} kcal.`;
                needMoreProt.textContent = `Protein: ${remainingProt < 0 ? 0 : remainingProt} g.`;
                
                updatePhaseButtons();

                saveData(); 
            }

            // ==========================================================
            // ฟังก์ชันสำหรับรีเซ็ตข้อมูลทั้งหมด
            // ==========================================================
            function resetAllData() {
                currentCal = 0;
                currentProt = 0;
                targetCal = 2100;
                targetProt = 130;
                currentPhase = 'default';
                
                localStorage.removeItem('calorieTrackerData');
                
                updateDisplay(); 
                
                alert("Data has been reset. Starting a new day!");
            }


            // ==========================================================
            // โหลดข้อมูลเมื่อเริ่มต้น
            // ==========================================================
            loadData(); 
            applyTheme(getStoredTheme()); 
            updateDisplay(); 

            // ==========================================================
            // Event Listeners สำหรับการทำงานต่างๆ
            // ==========================================================
            
            // ปุ่ม Bulking
            optionBulking.addEventListener('click', () => {
                targetCal = 2600;
                targetProt = 130;
                currentPhase = 'bulking';
                updateDisplay();
            });
            
            // ปุ่ม Cutting
            optionCutting.addEventListener('click', () => {
                targetCal = 1900;
                targetProt = 130;
                currentPhase = 'cutting';
                updateDisplay();
            });

            // ปุ่ม Add (เพิ่มข้อมูล)
            addBtn.addEventListener('click', () => {
                const calValue = parseInt(calInput.value);
                const protValue = parseInt(protInput.value);

                if (!isNaN(calValue) && !isNaN(protValue) && calValue >= 0 && protValue >= 0) {
                    currentCal += calValue;
                    currentProt += protValue;

                    updateDisplay();

                    calInput.value = '';
                    protInput.value = '';
                }
            });

            // ปุ่ม Reset Data
            resetBtn.addEventListener('click', () => {
                if (confirm("Are you sure you want to reset all calorie and protein data? This action cannot be undone.")) {
                    resetAllData();
                }
            });

            // ปุ่ม History
            historyDetailedBtn.addEventListener('click', () => {
                alert("Development in progress.");
            });

            // ==========================================================
            // ส่วน Theme Toggle
            // ==========================================================
            function applyTheme(theme){
                const body = document.body;
                if (theme === 'dark') {
                    body.classList.add('dark-mode');
                    themeToggleBtn.textContent = 'Light';
                }else {
                body.classList.remove('dark-mode');
                themeToggleBtn.textContent = 'Dark';
                }
                updatePhaseButtons(); 
            }
            function getStoredTheme() {
                return localStorage.getItem('theme') || 'light';
            }
            themeToggleBtn.addEventListener('click', () => {
                const curretTheme = getStoredTheme();
                const newTheme = curretTheme === 'dark' ? 'light' : 'dark';
                applyTheme(newTheme);
                localStorage.setItem('theme', newTheme);
            });
        });