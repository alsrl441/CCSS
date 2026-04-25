const STORE_NAME = "mealSchedule";

async function initMealSchedule() {
    const monthPicker = document.getElementById('month-picker');
    const displayEl = document.getElementById('monthly-meal-display');
    const mealModal = document.getElementById('meal-modal');
    const btnAddMeal = document.getElementById('btn-add-meal');
    const closeModal = document.querySelector('.close-modal');
    const mealForm = document.getElementById('meal-form');
    const btnDeleteMeal = document.getElementById('btn-delete-meal');

    const now = new Date();
    if (!monthPicker.value) {
        monthPicker.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const renderCalendar = async () => {
        const [year, month] = monthPicker.value.split('-').map(Number);
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const allMenus = await window.getDBData(STORE_NAME);
        
        let html = `
            <table class="meal-table">
                <thead>
                    <tr>
                        <th class="sunday">일</th>
                        <th>월</th>
                        <th>화</th>
                        <th>수</th>
                        <th>목</th>
                        <th>금</th>
                        <th class="saturday">토</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let dateCounter = 1;
        for (let i = 0; i < 6; i++) {
            html += '<tr>';
            for (let j = 0; j < 7; j++) {
                if ((i === 0 && j < startDayOfWeek) || dateCounter > daysInMonth) {
                    html += '<td></td>';
                } else {
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dateCounter).padStart(2, '0')}`;
                    const menu = allMenus.find(m => m.date === dateStr);
                    const dayOfWeek = new Date(year, month - 1, dateCounter).getDay();
                    const dayClass = dayOfWeek === 0 ? 'sunday' : (dayOfWeek === 6 ? 'saturday' : '');
                    
                    html += `
                        <td class="clickable-cell" data-date="${dateStr}">
                            <span class="date-num ${dayClass}">${dateCounter}</span>
                            <div class="meal-content">
                    `;

                    if (menu) {
                        if (dayOfWeek === 0 && menu.brunch) {
                            html += `<div class="meal-item"><span class="meal-label">브런치</span><span class="meal-text">${menu.brunch}</span></div>`;
                        } else {
                            if (menu.breakfast) html += `<div class="meal-item"><span class="meal-label">조</span><span class="meal-text">${menu.breakfast}</span></div>`;
                            if (menu.lunch) html += `<div class="meal-item"><span class="meal-label">중</span><span class="meal-text">${menu.lunch}</span></div>`;
                        }
                        if (menu.dinner) html += `<div class="meal-item"><span class="meal-label">석</span><span class="meal-text">${menu.dinner}</span></div>`;
                    }

                    html += `
                            </div>
                        </td>
                    `;
                    dateCounter++;
                }
            }
            html += '</tr>';
            if (dateCounter > daysInMonth) break;
        }

        html += '</tbody></table>';
        displayEl.innerHTML = html;

        // 셀 클릭 이벤트 추가
        document.querySelectorAll('.clickable-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                openMealModal(cell.dataset.date);
            });
        });
    };

    const openMealModal = async (dateStr) => {
        const menu = (await window.getDBData(STORE_NAME)).find(m => m.date === dateStr);
        document.getElementById('meal-date').value = dateStr;
        document.getElementById('meal-brunch').value = menu?.brunch || "";
        document.getElementById('meal-breakfast').value = menu?.breakfast || "";
        document.getElementById('meal-lunch').value = menu?.lunch || "";
        document.getElementById('meal-dinner').value = menu?.dinner || "";
        
        btnDeleteMeal.style.display = menu ? 'inline-block' : 'none';
        mealModal.classList.remove('hidden');
    };

    btnAddMeal.addEventListener('click', () => {
        const todayStr = new Date().toISOString().split('T')[0];
        openMealModal(todayStr);
    });

    closeModal.addEventListener('click', () => {
        mealModal.classList.add('hidden');
    });

    mealForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = document.getElementById('meal-date').value;
        const data = {
            date,
            brunch: document.getElementById('meal-brunch').value,
            breakfast: document.getElementById('meal-breakfast').value,
            lunch: document.getElementById('meal-lunch').value,
            dinner: document.getElementById('meal-dinner').value
        };
        
        await window.putDBData(STORE_NAME, data);
        mealModal.classList.add('hidden');
        renderCalendar();
    });

    btnDeleteMeal.addEventListener('click', async () => {
        if (confirm('정말 삭제하시겠습니까?')) {
            const date = document.getElementById('meal-date').value;
            await window.deleteDBData(STORE_NAME, date);
            mealModal.classList.add('hidden');
            renderCalendar();
        }
    });

    monthPicker.addEventListener('change', renderCalendar);
    renderCalendar();
}

document.addEventListener('DOMContentLoaded', initMealSchedule);
