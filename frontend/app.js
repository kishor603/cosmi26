const API_URL = 'http://127.0.0.1:8000/api/students';

let allStudents = [];

// DOM Elements
const loadingState = document.getElementById('loading-state');
const dashboardContent = document.getElementById('dashboard-content');
const heatmapContent = document.getElementById('heatmap-content');
const searchInput = document.getElementById('search-input');
const riskFilter = document.getElementById('risk-filter');
const tableBody = document.getElementById('student-table-body');
const sectionCardsContainer = document.getElementById('section-cards-container');
const sectionCardsContainer10 = document.getElementById('section-cards-container-10');
let activeSectionFilter = null;
const navDashboard = document.getElementById('nav-dashboard');
const navHeatmap = document.getElementById('nav-heatmap');
const navLogout = document.getElementById('nav-logout');

// Modals
const btnNewPrediction = document.getElementById('btn-new-prediction');
const inputModal = document.getElementById('input-modal');
const closeInputModal = document.getElementById('close-input-modal');
const assessmentForm = document.getElementById('assessment-form');
const assessmentResult = document.getElementById('assessment-result');

// Example Buttons
const btnExAttendance = document.getElementById('btn-ex-attendance');
const btnExSibling = document.getElementById('btn-ex-sibling');
const btnExSafe = document.getElementById('btn-ex-safe');

const actionModal = document.getElementById('action-modal');
const closeActionModal = document.getElementById('close-action-modal');

// Action Modal Elements
const actionName = document.getElementById('action-student-name');
const actionRiskScore = document.getElementById('action-risk-score');
const actionTopFactors = document.getElementById('action-top-factors');
const playbookRecs = document.getElementById('playbook-recommendations');
const commsEnglish = document.getElementById('comms-english');
const commsHindi = document.getElementById('comms-hindi');
const cohortBars = document.getElementById('cohort-bars');
const interventionLog = document.getElementById('intervention-log');
const logForm = document.getElementById('log-intervention-form');
const elTotal = document.getElementById('total-students');
const elHighCount = document.getElementById('high-risk-count');
const elHighPct = document.getElementById('high-risk-pct');
const elMediumCount = document.getElementById('medium-risk-count');
const elMediumPct = document.getElementById('medium-risk-pct');
const elLowCount = document.getElementById('low-risk-count');
const elLowPct = document.getElementById('low-risk-pct');
const elRiskBadge = document.getElementById('risk-badge');

async function fetchStudentData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (data.students) {
            allStudents = data.students;
            initDashboard();
        } else {
            showError();
        }
    } catch (error) {
        console.error("Dashboard Render Error:", error);
        showError();
    }
}

function initDashboard() {
    loadingState.style.display = 'none';
    dashboardContent.style.display = 'block';
    
    
    updateSummaryCards();
    updateSectionCards();
    renderTable(allStudents);
    
    searchInput.addEventListener('input', handleFilters);
    riskFilter.addEventListener('change', handleFilters);
}

function showError() {
    loadingState.innerHTML = '<p style="color:red">Failed to load data. Ensure backend is running.</p>';
}

function updateSummaryCards() {
    const total = allStudents.length;
    let high = 0, medium = 0, low = 0;
    
    allStudents.forEach(s => {
        if (s.risk_level === 'High') high++;
        else if (s.risk_level === 'Medium') medium++;
        else low++;
    });
    
    elTotal.innerText = total.toLocaleString();
    elHighCount.innerText = high.toLocaleString();
    elMediumCount.innerText = medium.toLocaleString();
    elLowCount.innerText = low.toLocaleString();
    
    elHighPct.innerText = total ? ((high / total) * 100).toFixed(1) + '%' : '0%';
    elMediumPct.innerText = total ? ((medium / total) * 100).toFixed(1) + '%' : '0%';
    elLowPct.innerText = total ? ((low / total) * 100).toFixed(1) + '%' : '0%';
    
    if (elRiskBadge) {
        elRiskBadge.innerText = high > 99 ? '99+' : high;
        elRiskBadge.style.display = high > 0 ? 'flex' : 'none';
    }
}

function updateSectionCards() {
    if (!sectionCardsContainer) return;
    
    const sections = ['9A', '9B', '9C', '9D', '9E'];
    sectionCardsContainer.innerHTML = '';
    
    sections.forEach(secName => {
        const secStudents = allStudents.filter(s => s.name.includes(`(${secName})`));
        const total = secStudents.length;
        if (total === 0) return; // Only render if data exists
        
        const highRisk = secStudents.filter(s => s.risk_level === 'High').length;
        const mediumRisk = secStudents.filter(s => s.risk_level === 'Medium').length;
        
        let healthColor = 'var(--primary-color)';
        if (highRisk > (total * 0.15)) healthColor = 'var(--risk-high)';
        else if (highRisk > (total * 0.05)) healthColor = 'var(--warning-color)';
        
        const card = document.createElement('div');
        card.style.cssText = `flex: 1 1 180px; background: white; border-radius: 8px; padding: 15px; border-top: 4px solid ${healthColor}; box-shadow: 0 4px 6px rgba(0,0,0,0.05); min-width: 150px; cursor: pointer; transition: transform 0.2s;`;
        card.className = "section-card";
        card.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 15px;">Section ${secName}</h4>
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Total Enrolled: <strong>${total}</strong></div>
            <div style="font-size: 12px; color: var(--risk-high);">High Risk: <strong>${highRisk}</strong> (${((highRisk/total)*100).toFixed(1)}%)</div>
            <div style="font-size: 12px; color: var(--warning-color);">Medium Risk: <strong>${mediumRisk}</strong></div>
            <div style="margin-top: 10px; font-size: 11px; color: var(--primary-color); font-weight: bold; text-align: right;">View Roster &rarr;</div>
        `;
        
        card.addEventListener('click', () => {
            if (activeSectionFilter === secName) {
                 activeSectionFilter = null;
                 card.style.transform = "scale(1)";
                 card.style.border = "";
            } else {
                 activeSectionFilter = secName;
                 document.querySelectorAll('.section-card').forEach(c => { 
                     c.style.transform = "scale(1)";
                     c.style.borderLeft = "none";
                     c.style.borderRight = "none";
                     c.style.borderBottom = "none";
                 });
                 card.style.transform = "scale(1.05)";
                 card.style.border = "2px solid var(--primary-color)";
                 card.style.borderTop = `4px solid ${healthColor}`;
            }
            handleFilters();
            // Scroll to table smoothly
            document.querySelector('.roster-section').scrollIntoView({ behavior: 'smooth' });
        });
        
        sectionCardsContainer.appendChild(card);
    });
    
    // 10th Standard Sections
    if (!sectionCardsContainer10) return;
    const sections10 = ['10A', '10B', '10C', '10D', '10E'];
    sectionCardsContainer10.innerHTML = '';
    
    sections10.forEach(secName => {
        const secStudents = allStudents.filter(s => s.name.includes(`(${secName})`));
        const total = secStudents.length;
        if (total === 0) return; // Only render if data exists
        
        const highRisk = secStudents.filter(s => s.risk_level === 'High').length;
        const mediumRisk = secStudents.filter(s => s.risk_level === 'Medium').length;
        
        let healthColor = 'var(--primary-color)';
        if (highRisk > (total * 0.15)) healthColor = 'var(--risk-high)';
        else if (highRisk > (total * 0.05)) healthColor = 'var(--warning-color)';
        
        const card = document.createElement('div');
        card.style.cssText = `flex: 1 1 180px; background: white; border-radius: 8px; padding: 15px; border-top: 4px solid ${healthColor}; box-shadow: 0 4px 6px rgba(0,0,0,0.05); min-width: 150px; cursor: pointer; transition: transform 0.2s;`;
        card.className = "section-card";
        card.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 15px;">Section ${secName}</h4>
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Total Enrolled: <strong>${total}</strong></div>
            <div style="font-size: 12px; color: var(--risk-high);">High Risk: <strong>${highRisk}</strong> (${((highRisk/total)*100).toFixed(1)}%)</div>
            <div style="font-size: 12px; color: var(--warning-color);">Medium Risk: <strong>${mediumRisk}</strong></div>
            <div style="margin-top: 10px; font-size: 11px; color: var(--primary-color); font-weight: bold; text-align: right;">View Roster &rarr;</div>
        `;
        
        card.addEventListener('click', () => {
            if (activeSectionFilter === secName) {
                 activeSectionFilter = null;
                 card.style.transform = "scale(1)";
                 card.style.border = "";
            } else {
                 activeSectionFilter = secName;
                 document.querySelectorAll('.section-card').forEach(c => { 
                     c.style.transform = "scale(1)";
                     c.style.borderLeft = "none";
                     c.style.borderRight = "none";
                     c.style.borderBottom = "none";
                 });
                 card.style.transform = "scale(1.05)";
                 card.style.border = "2px solid var(--primary-color)";
                 card.style.borderTop = `4px solid ${healthColor}`;
            }
            handleFilters();
            // Scroll to table smoothly
            document.querySelector('.roster-section').scrollIntoView({ behavior: 'smooth' });
        });
        
        sectionCardsContainer10.appendChild(card);
    });
}

function renderTable(studentsToRender) {
    tableBody.innerHTML = '';
    
    if (studentsToRender.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 30px;">No students match criteria.</td></tr>`;
        return;
    }
    
    studentsToRender.forEach(student => {
        const tr = document.createElement('tr');
        
        // Added styling for low mid-day meals and attendance
        const attendanceStyle = student.attendance < 75 ? 'color: var(--risk-high); font-weight: bold;' : '';
        const mealStyle = student.mid_day_meal < 75 ? 'color: var(--risk-high); font-weight: bold;' : '';
        const distStyle = student.distance > 8 ? 'color: var(--risk-high);' : '';
        const sibStyle = student.sibling_dropout ? 'color: var(--risk-high); font-weight: bold;' : '';
        
        tr.innerHTML = `
            <td><strong>${student.id}</strong></td>
            <td>${student.name}</td>
            <td style="${attendanceStyle}">${student.attendance.toFixed(1)}%</td>
            <td>${student.grade.toFixed(1)}</td>
            <td style="${mealStyle}">${student.mid_day_meal.toFixed(1)}%</td>
            <td>${student.guardian_inv || 'N/A'}/5</td>
            <td style="${distStyle}">${student.distance ? student.distance.toFixed(1) : 'N/A'}</td>
            <td style="${sibStyle}">${student.sibling_dropout ? 'Yes' : 'No'}</td>
            <td><strong>${student.risk_score.toFixed(1)}%</strong></td>
            <td><span class="risk-pill ${student.risk_level}">${student.risk_level}</span></td>
            <td><button class="action-btn" onclick="openActionModal('${student.id}')">View Plan</button></td>
        `;
        tableBody.appendChild(tr);
    });
}

function handleFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const riskLevel = riskFilter.value;
    
    const filtered = allStudents.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm) || s.id.toLowerCase().includes(searchTerm);
        const matchesRisk = riskLevel === 'All' || s.risk_level === riskLevel;
        const matchesSection = activeSectionFilter ? s.name.includes(`(${activeSectionFilter})`) : true;
        
        return matchesSearch && matchesRisk && matchesSection;
    });
    
    filtered.sort((a, b) => {
        const aId = parseInt(a.id.replace('STU', '')) || 9999;
        const bId = parseInt(b.id.replace('STU', '')) || 9999;
        
        const aIsExample = aId >= 1 && aId <= 10;
        const bIsExample = bId >= 1 && bId <= 10;
        
        if (aIsExample && !bIsExample) return -1;
        if (!aIsExample && bIsExample) return 1;
        if (aIsExample && bIsExample) return aId - bId;
        
        return b.risk_score - a.risk_score;
    });
    
    renderTable(filtered);
}

// Map Nav Setup
navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    navDashboard.classList.add('active');
    navHeatmap.classList.remove('active');
    dashboardContent.style.display = 'block';
    heatmapContent.style.display = 'none';
});

navHeatmap.addEventListener('click', (e) => {
    e.preventDefault();
    navHeatmap.classList.add('active');
    navDashboard.classList.remove('active');
    dashboardContent.style.display = 'none';
    heatmapContent.style.display = 'block';
    loadHeatmapData();
});

async function loadHeatmapData() {
    // Simulated fetch call to local JSON for Heatmap Demo
    const container = document.querySelector('#heatmap-content .stat-card');
    container.innerHTML = `<div style="text-align:center;">
          <div class="spinner" style="margin: 0 auto 15px auto;"></div>
          <p>Generating Heatmap Coordinates...</p>
    </div>`;
    
    setTimeout(async () => {
         try {
             const res = await fetch('http://127.0.0.1:8000/district_heatmap.json');
             const mapData = await res.json();
             
             let html = `<div style="width: 100%; height: 100%; display: flex; flex-wrap: wrap; gap: 10px; padding: 20px; overflow-y: auto;">`;
             mapData.schools.forEach(sch => {
                  const color = sch.high_risk_percentage > 20 ? 'rgba(238, 93, 80, 0.8)' : (sch.high_risk_percentage > 10 ? 'rgba(255, 181, 71, 0.8)' : 'rgba(5, 205, 153, 0.8)');
                  html += `<div style="flex: 1 1 200px; padding: 15px; border-radius: 8px; background: ${color}; color: #000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <strong>${sch.name}</strong><br>
                      <em>ID: ${sch.school_id}</em><br>
                      Total: ${sch.total_students}<br>
                      At Risk: ${sch.high_risk_count} (${sch.high_risk_percentage}%)
                  </div>`;
             });
             html += `</div>`;
             container.innerHTML = html;
         } catch (e) {
             // Fallback if not physically served by python HTTP server locally
             container.innerHTML = `<p style="color:var(--risk-high)">Error Loading Map Data</p>`;
         }
    }, 1000);
}

// Modal Handlers
btnNewPrediction.addEventListener('click', () => {
    inputModal.style.display = 'flex';
});

closeInputModal.addEventListener('click', () => {
    inputModal.style.display = 'none';
    assessmentResult.style.display = 'none';
});

closeActionModal.addEventListener('click', () => {
    actionModal.style.display = 'none';
});

// Example Data Prefills
btnExAttendance.addEventListener('click', () => {
    document.getElementById('input-attendance').value = 45;
    document.getElementById('input-exams').value = 60;
    document.getElementById('input-meals').value = 90;
    document.getElementById('input-guardian').value = 3;
    document.getElementById('input-distance').value = 2;
    document.getElementById('input-sibling').value = 0;
});

btnExSibling.addEventListener('click', () => {
    document.getElementById('input-attendance').value = 85;
    document.getElementById('input-exams').value = 70;
    document.getElementById('input-meals').value = 85;
    document.getElementById('input-guardian').value = 2;
    document.getElementById('input-distance').value = 5;
    document.getElementById('input-sibling').value = 1;
});

btnExSafe.addEventListener('click', () => {
    document.getElementById('input-attendance').value = 98;
    document.getElementById('input-exams').value = 88;
    document.getElementById('input-meals').value = 100;
    document.getElementById('input-guardian').value = 5;
    document.getElementById('input-distance').value = 1;
    document.getElementById('input-sibling').value = 0;
});

// Admin Input API Logic
assessmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const payload = {
        attendance_rate: parseFloat(document.getElementById('input-attendance').value),
        exam_score: parseFloat(document.getElementById('input-exams').value),
        mid_day_meal_consistency: parseFloat(document.getElementById('input-meals').value),
        guardian_involvement_score: parseInt(document.getElementById('input-guardian').value),
        distance_from_school_km: parseFloat(document.getElementById('input-distance').value),
        sibling_dropout_history: parseInt(document.getElementById('input-sibling').value)
    };
    
    assessmentResult.style.display = 'block';
    assessmentResult.innerHTML = '<div class="spinner" style="width: 20px; height: 20px; margin: 0 auto; border-width: 2px;"></div>';
    
    try {
        const response = await fetch(`${API_URL.replace('/students', '/predict')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        let factorsHtml = '<ul style="margin-top: 10px; padding-left: 20px; font-size: 14px; color: #555;">';
        if (data.top_contributing_factors) {
             data.top_contributing_factors.forEach(f => {
                  factorsHtml += `<li><strong>${f.factor}</strong> (Impact Match: ${f.direction}${f.weight})</li>`;
             });
        }
        factorsHtml += '</ul>';
        
        assessmentResult.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px;">
                 <div>
                      <h4 style="margin: 0; color: #333;">Calculated Risk Score</h4>
                      <div style="font-size: 28px; font-weight: bold; margin-top: 5px;" class="text-${data.risk_level.toLowerCase()}">${data.risk_score_percentage}%</div>
                 </div>
                 <span class="risk-pill ${data.risk_level}">${data.risk_level} Risk</span>
            </div>
            <h4 style="margin: 0 0 5px 0; color: #333;">Explainable Evidence Base:</h4>
            ${factorsHtml}
            <button type="button" id="save-new-student-btn" class="action-btn" style="width: 100%; margin-top: 15px; border-color: var(--risk-low); color: var(--risk-low);">+ Add Student to Roster</button>
        `;
        
        document.getElementById('save-new-student-btn').addEventListener('click', () => {
            const newStudent = {
                id: 'NEW' + Math.floor(Math.random() * 10000),
                name: 'Newly Assessed Student',
                attendance: payload.attendance_rate,
                grade: payload.exam_score,
                mid_day_meal: payload.mid_day_meal_consistency,
                guardian_inv: payload.guardian_involvement_score,
                distance: payload.distance_from_school_km,
                risk_score: data.risk_score_percentage,
                risk_level: data.risk_level,
                top_factors: data.top_contributing_factors ? data.top_contributing_factors.map(f => f.factor) : [],
                sibling_dropout: payload.sibling_dropout_history
            };
            allStudents.unshift(newStudent); // Add to top of the list
            
            // Close modal and refresh UI
            inputModal.style.display = 'none';
            assessmentResult.style.display = 'none';
            document.getElementById('assessment-form').reset();
            updateSummaryCards();
            handleFilters();
        });
    } catch (error) {
         assessmentResult.innerHTML = '<p style="color:red">Failed to run model.</p>';
    }
});

// Advanced Action Modal Logic
let currentActiveStudentId = null;

async function openActionModal(studentId) {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;
    
    currentActiveStudentId = studentId;
    
    actionName.innerText = `Student Analysis: ${student.name} (${student.id})`;
    actionRiskScore.innerText = `${student.risk_score}%`;
    actionRiskScore.style.color = student.risk_level === 'High' ? 'var(--risk-high)' : (student.risk_level === 'Medium' ? 'var(--risk-medium)' : 'var(--risk-low)');
    
    // Setup Top Factors XAI
    actionTopFactors.innerHTML = '';
    let primaryFactor = "Attendance"; // default
    
    if (student.top_factors && student.top_factors.length > 0) {
         primaryFactor = student.top_factors[0];
         student.top_factors.forEach(factor => {
              const li = document.createElement('li');
              li.innerText = factor;
              actionTopFactors.appendChild(li);
         });
    } else {
         actionTopFactors.innerHTML = '<li style="color:#666">No massive deviations found.</li>';
    }
    
    // Comprehensive Student Details
    cohortBars.innerHTML = `
         <div style="background: #f8f9fe; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
             <h4 style="margin:0 0 10px 0;">Raw Profile Indicators</h4>
             <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
                 <div><strong>Attendance:</strong> ${student.attendance.toFixed(1)}%</div>
                 <div><strong>Exams:</strong> ${student.grade.toFixed(1)}/100</div>
                 <div><strong>Mid-Day Meals:</strong> ${student.mid_day_meal.toFixed(1)}%</div>
                 <div><strong>Guardian Inv.:</strong> ${student.guardian_inv || 'N/A'}/5</div>
                 <div><strong>Distance:</strong> ${student.distance ? student.distance.toFixed(1) : 'N/A'} km</div>
                 <div><strong>Sibling Dropout:</strong> ${student.sibling_dropout ? 'Yes' : 'No'}</div>
             </div>
         </div>
         
         <h4>Cohort Deviation Mapping</h4>
         <div style="font-size: 11px; margin-bottom: 3px;">Attendance (${student.attendance.toFixed(1)}%)</div>
         <div class="chart-bar-container"><div class="chart-bar-fill" style="width: ${Math.min(100, student.attendance)}%; background: ${student.attendance < 75 ? 'var(--risk-high)' : 'var(--primary-color)'};"></div></div>
         
         <div style="font-size: 11px; margin-top: 10px; margin-bottom: 3px;">Exams (${student.grade.toFixed(1)})</div>
         <div class="chart-bar-container"><div class="chart-bar-fill" style="width: ${Math.min(100, student.grade)}%; background: ${student.grade < 50 ? 'var(--risk-high)' : 'var(--primary-color)'};"></div></div>
         
         <div style="font-size: 11px; margin-top: 10px; margin-bottom: 3px;">Meals (${student.mid_day_meal.toFixed(1)}%)</div>
         <div class="chart-bar-container"><div class="chart-bar-fill" style="width: ${Math.min(100, student.mid_day_meal)}%; background: ${student.mid_day_meal < 75 ? 'var(--risk-high)' : 'var(--primary-color)'};"></div></div>
    `;
    
    // Reset playbook and comms
    playbookRecs.innerHTML = '<div class="spinner" style="width:20px; height:20px; border-width: 2px;"></div>';
    commsEnglish.innerText = 'Drafting...';
    commsHindi.innerText = 'तैयार हो रहा है...';
    
    // Fetch Comms
    fetch(`${API_URL.replace('/students', '/generate_communication')}/${student.id}?primary_factor=${encodeURIComponent(primaryFactor)}`)
         .then(res => res.json())
         .then(data => {
              commsEnglish.innerText = data.english_draft;
              commsHindi.innerText = data.hindi_draft;
         })
         .catch(e => {
              commsEnglish.innerText = "Error generating draft.";
              commsHindi.innerText = "त्रुटि";
         });
         
    // Re-run mock predict to get Playbook Recs (Using student existing data)
    fetch(`${API_URL.replace('/students', '/predict')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
             attendance_rate: student.attendance,
             exam_score: student.grade,
             mid_day_meal_consistency: student.mid_day_meal,
             guardian_involvement_score: 3, // Mock fallback
             distance_from_school_km: 2, // Mock fallback
             sibling_dropout_history: student.sibling_dropout || 0
        })
    })
    .then(res => res.json())
    .then(data => {
         playbookRecs.innerHTML = '';
         if (data.recommended_interventions && data.recommended_interventions.length > 0) {
              data.recommended_interventions.forEach(inv => {
                   playbookRecs.innerHTML += `
                        <div class="playbook-item">
                             <div><strong>${inv.title}</strong></div>
                             <div class="efficacy-badge efficacy-${inv.efficacy}">${inv.efficacy} Efficacy</div>
                        </div>
                   `;
              });
         } else {
              playbookRecs.innerHTML = '<p>No specific playbooks required at this risk level.</p>';
         }
    });
    
    refreshInterventions(student.id);

    // Reset Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.tab-btn[data-tab="tab-xai"]').classList.add('active');
    document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
    document.getElementById('tab-xai').style.display = 'block';

    actionModal.style.display = 'flex';
}

function refreshInterventions(studentId) {
    interventionLog.innerHTML = '<p style="color:#666; font-size:12px; font-style:italic;">Loading database history...</p>';
    fetch(`${API_URL.replace('/students', '/interventions')}/${studentId}`)
        .then(res => res.json())
        .then(data => {
            interventionLog.innerHTML = '';
            if (data.interventions && data.interventions.length > 0) {
                data.interventions.forEach(i => {
                    interventionLog.innerHTML += `
                        <div style="border-left: 2px solid var(--primary-color); padding-left: 10px; margin-bottom: 10px;">
                            <div style="font-size: 11px; color: #666;">${i.date} (by ${i.logged_by})</div>
                            <div style="font-weight: 600; font-size: 14px;">${i.type}</div>
                            ${i.notes ? `<div style="font-size: 13px; color: #555; margin-top: 3px;">"${i.notes}"</div>` : ''}
                        </div>
                    `;
                });
            } else {
                interventionLog.innerHTML = '<p style="color:#666; font-size:12px; font-style:italic;">No 30-day outcomes logged yet.</p>';
            }
        });
}

// Interventions Logging Submit
logForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentActiveStudentId) return;
    
    const payload = {
         type: document.getElementById('log-type').value,
         notes: document.getElementById('log-notes').value,
         date: new Date().toISOString().split('T')[0],
         logged_by: "Administrator Profile"
    };
    
    fetch(`${API_URL.replace('/students', '/interventions')}/${currentActiveStudentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(() => {
         document.getElementById('log-type').value = '';
         document.getElementById('log-notes').value = '';
         refreshInterventions(currentActiveStudentId);
    });
});

// Tab Navigation logic
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
         // UI Active State
         document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
         btn.classList.add('active');
         
         // Content swap
         const targetId = btn.getAttribute('data-tab');
         document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
         document.getElementById(targetId).style.display = 'block';
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // Only fetch data if on index.html and session is valid
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        fetchStudentData();
    }
});
