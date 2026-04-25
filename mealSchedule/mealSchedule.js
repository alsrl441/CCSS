const STORE_NAME = "mealSchedule";

async function initMealSchedule() {
    const weekPicker = document.getElementById('week-picker');
    const displayEl = document.getElementById('weekly-meal-display');
    const mealModal = document.getElementById('meal-modal');
    const btnAddMeal = document.getElementById('btn-add-meal');
    const closeModal = document.querySelector('.close-modal');
    const mealForm = document.getElementById('meal-form');
    const btnDeleteMeal = document.getElementById('btn-delete-meal');
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');

    let currentAnchorDate = new Date();

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const getSunday = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    };

    if (!weekPicker.value) {
        weekPicker.value = formatDate(currentAnchorDate);
    }

    const renderWeeklySchedule = async () => {
        const selectedDate = new Date(weekPicker.value);
        const sunday = getSunday(selectedDate);
        const allMenus = await window.getDBData(STORE_NAME);
        
        let html = `
            <table class="meal-table weekly">
                <thead>
                    <tr>
                        <th style="width: 10%;">구분</th>
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

        const mealTypes = [
            { id: 'breakfast', label: '아침' },
            { id: 'brunch', label: '브런치' },
            { id: 'lunch', label: '점심' },
            { id: 'dinner', label: '저녁' }
        ];

        mealTypes.forEach(type => {
            html += `<tr><td class="meal-type-label">${type.label}</td>`;
            for (let i = 0; i < 7; i++) {
                const d = new Date(sunday);
                d.setDate(sunday.getDate() + i);
                const dateStr = formatDate(d);
                const menu = allMenus.find(m => m.date === dateStr);
                const isSunday = i === 0;
                
                let content = '-';
                if (menu) {
                    if (type.id === 'brunch') {
                        content = isSunday ? (menu.brunch || '-') : 'X';
                    } else if (type.id === 'breakfast') {
                        content = isSunday ? 'X' : (menu.breakfast || '-');
                    } else if (type.id === 'lunch') {
                        content = isSunday ? 'X' : (menu.lunch || '-');
                    } else {
                        content = menu.dinner || '-';
                    }
                } else {
                    if (type.id === 'brunch' && !isSunday) content = 'X';
                    if (isSunday && (type.id === 'breakfast' || type.id === 'lunch')) content = 'X';
                }

                const cellClass = isSunday ? 'sunday' : (i === 6 ? 'saturday' : '');
                html += `
                    <td class="clickable-cell ${cellClass}" data-date="${dateStr}">
                        <div class="meal-text">${content}</div>
                    </td>
                `;
            }
            html += '</tr>';
        });

        // 날짜 표시줄 추가 (헤더 아래 또는 푸터)
        html += '<tr class="date-row"><td>날짜</td>';
        for (let i = 0; i < 7; i++) {
            const d = new Date(sunday);
            d.setDate(sunday.getDate() + i);
            html += `<td class="text-center small">${d.getMonth() + 1}/${d.getDate()}</td>`;
        }
        html += '</tr>';

        html += '</tbody></table>';
        displayEl.innerHTML = html;

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
        openMealModal(weekPicker.value);
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
        renderWeeklySchedule();
    });

    btnDeleteMeal.addEventListener('click', async () => {
        if (confirm('정말 삭제하시겠습니까?')) {
            const date = document.getElementById('meal-date').value;
            await window.deleteDBData(STORE_NAME, date);
            mealModal.classList.add('hidden');
            renderWeeklySchedule();
        }
    });

    weekPicker.addEventListener('change', renderWeeklySchedule);

    prevWeekBtn.addEventListener('click', () => {
        const d = new Date(weekPicker.value);
        d.setDate(d.getDate() - 7);
        weekPicker.value = formatDate(d);
        renderWeeklySchedule();
    });

    nextWeekBtn.addEventListener('click', () => {
        const d = new Date(weekPicker.value);
        d.setDate(d.getDate() + 7);
        weekPicker.value = formatDate(d);
        renderWeeklySchedule();
    });

    renderWeeklySchedule();
}

document.addEventListener('DOMContentLoaded', initMealSchedule);
