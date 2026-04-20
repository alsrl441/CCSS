const STORE_NAME = "menu";

// 하위 로직에서 관리하는 데이터 양식
const initialMenuTemplate = {
    "date": "0000-00-00",
    "breakfast": "정보 없음",
    "lunch": "정보 없음",
    "dinner": "정보 없음",
    "brunch": "정보 없음"
};

const mealTypeEl = document.getElementById('meal-type');
const menuDisplayEl = document.getElementById('menu-display');
const searchDateInput = document.getElementById('search-date');
const searchMealSelect = document.getElementById('search-meal');

// 날짜 포맷 헬퍼
const getFormattedDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

async function getMenuData(dateStr) {
    try {
        const allMenus = await window.getDBData(STORE_NAME);
        return allMenus.find(m => m.date === dateStr) || null;
    } catch (err) {
        console.error("Menu fetch error:", err);
        return null;
    }
}

function updateMealOptions(dateStr) {
    if (!searchMealSelect) return;
    const date = new Date(dateStr);
    const isSunday = date.getDay() === 0;
    const currentVal = searchMealSelect.value;
    
    searchMealSelect.innerHTML = '';
    
    if (isSunday) {
        searchMealSelect.add(new Option("브런치", "brunch"));
        searchMealSelect.add(new Option("저녁", "dinner"));
    } else {
        searchMealSelect.add(new Option("아침", "breakfast"));
        searchMealSelect.add(new Option("점심", "lunch"));
        searchMealSelect.add(new Option("저녁", "dinner"));
    }

    const hasValue = Array.from(searchMealSelect.options).some(opt => opt.value === currentVal);
    if (hasValue) searchMealSelect.value = currentVal;
}

async function setAutoMenu() {
    const now = new Date();
    const timeVal = now.getHours() * 100 + now.getMinutes();
    const todayStr = getFormattedDate(now);
    const tomorrowObj = new Date(now.getTime() + 86400000);
    const tomorrowStr = getFormattedDate(tomorrowObj);

    let targetDateStr = todayStr;
    let mealKey = "";
    let displayLabel = "";
    const isSunday = now.getDay() === 0;

    if (isSunday) {
        if (timeVal < 1130) { displayLabel = "오늘 브런치"; mealKey = "brunch"; }
        else if (timeVal < 1830) { displayLabel = "오늘 저녁"; mealKey = "dinner"; }
        else { 
            const nextIsSunday = tomorrowObj.getDay() === 0;
            displayLabel = "내일 " + (nextIsSunday ? "브런치" : "아침");
            mealKey = nextIsSunday ? "brunch" : "breakfast";
            targetDateStr = tomorrowStr;
        }
    } else {
        if (timeVal < 800) { displayLabel = "오늘 아침"; mealKey = "breakfast"; }
        else if (timeVal < 1230) { displayLabel = "오늘 점심"; mealKey = "lunch"; }
        else if (timeVal < 1830) { displayLabel = "오늘 저녁"; mealKey = "dinner"; }
        else { 
            const nextIsSunday = tomorrowObj.getDay() === 0;
            displayLabel = "내일 " + (nextIsSunday ? "브런치" : "아침");
            mealKey = nextIsSunday ? "brunch" : "breakfast";
            targetDateStr = tomorrowStr;
        }
    }

    if (searchDateInput) {
        searchDateInput.value = targetDateStr;
        updateMealOptions(targetDateStr);
    }
    
    const menuData = await getMenuData(targetDateStr);
    if (menuData) {
        if (mealTypeEl) mealTypeEl.innerText = displayLabel;
        if (menuDisplayEl) menuDisplayEl.innerText = menuData[mealKey] || "식단 정보가 없습니다.";
    } else {
        if (mealTypeEl) mealTypeEl.innerText = "정보 없음";
        if (menuDisplayEl) menuDisplayEl.innerText = "식단 정보가 없습니다.";
    }

    if (searchMealSelect) searchMealSelect.value = mealKey;
}

async function searchMenu() {
    if (!searchDateInput || !searchMealSelect) return;
    const dateStr = searchDateInput.value;
    updateMealOptions(dateStr);
    
    const mealKey = searchMealSelect.value;
    const menuData = await getMenuData(dateStr);
    
    const mealNames = { breakfast: "아침", lunch: "점심", dinner: "저녁", brunch: "브런치" };
    if (mealTypeEl) mealTypeEl.innerText = `${dateStr} ${mealNames[mealKey] || ""}`;
    
    const menuText = menuData?.[mealKey] ? menuData[mealKey].replace(/, /g, '\n').replace(/,/g, '\n') : "식단 정보가 없습니다.";
    if (menuDisplayEl) menuDisplayEl.innerText = menuText;
}

async function initMenu() {
    await window.ensureStore(STORE_NAME, "date");
    
    // 초기 템플릿 확인 및 삽입 로직 (데이터가 아예 없을 때만)
    const currentData = await window.getDBData(STORE_NAME);
    if (currentData.length === 0) {
        await window.putDBData(STORE_NAME, initialMenuTemplate);
        console.log("초기 식단 템플릿 삽입됨.");
    }

    if (mealTypeEl) {
        mealTypeEl.addEventListener('click', () => {
            const ui = document.getElementById('menu-search-ui');
            if (ui) ui.classList.toggle('hidden');
        });
    }

    if (searchDateInput) searchDateInput.addEventListener('change', searchMenu);
    if (searchMealSelect) searchMealSelect.addEventListener('change', searchMenu);

    await setAutoMenu();
}

document.addEventListener('DOMContentLoaded', initMenu);
