document.addEventListener('DOMContentLoaded', async () => {
    
    const selectEl = document.getElementById('memberSelect');
    const displayEl = document.getElementById('resultDisplay');
    const noDataEl = document.getElementById('noDataMessage');
    const previewEl = document.getElementById('previewDisplay');
    const backBtn = document.getElementById('backToList');
    let timerId = null; 
    let members = [];

    async function loadMembersFromDB() {
        const STORE_NAME = "members";
        try {
            await window.ensureStore(STORE_NAME, "id");
            let data = await window.getDBData(STORE_NAME);
            
            if (!data || data.length === 0) {
                const sampleMember = {
                    "id": "0",
                    "name": "홍길동",
                    "nickName": "ㅎㄱㄷ",
                    "start": "2025-01-01",
                    "end": "2026-06-30",
                    "vacation": "2026-06-01",
                    "promotion": { "pfc2cpl": 0, "cpl2sgt": 0 },
                    "photo": "",
                    "affiliation": "해안복합감시반",
                    "position": "항포구 감시병",
                    "hobby": "취미",
                    "specialty": "특기"
                };
                await window.putDBData(STORE_NAME, sampleMember);
                data = [sampleMember];
            }
            return data;
        } catch (err) {
            console.error("인원 정보 로딩 실패:", err);
            return [];
        }
    }

    members = await loadMembersFromDB();

    if (members && members.length > 0) {
        members.forEach((m, idx) => {
            let opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = `${m.name} (${m.nickName || ''})`;
            selectEl.appendChild(opt);
        });
        renderPreview();
    } else {
        previewEl.innerHTML = '<div class="text-center py-5 text-muted">DB에 등록된 인원 정보가 없습니다.</div>';
    }

    selectEl.addEventListener('change', (e) => {
        handleMemberSelect(e.target.value);
    });

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            selectEl.value = "";
            handleMemberSelect("");
        });
    }

    function handleMemberSelect(val) {
        if (timerId) clearInterval(timerId);

        if (val === "") {
            displayEl.classList.add('hidden');
            noDataEl.classList.remove('hidden');
            previewEl.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            renderPreview();
        } else {
            const user = members[val];
            displayEl.classList.remove('hidden');
            noDataEl.classList.add('hidden');
            previewEl.classList.add('hidden');
            
            updateStaticProfile(user);
            calculateMilitary(user);
            timerId = setInterval(() => calculateMilitary(user), 10);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function renderPreview() {
        previewEl.innerHTML = '';
        members.forEach((user, idx) => {
            const card = document.createElement('div');
            card.className = 'preview-card';
            card.innerHTML = `
                <img src="${user.photo || '../img/default-profile.png'}" class="preview-photo shadow-sm">
                <span class="preview-name">${user.name}</span>
                <div class="preview-info">${user.affiliation || '-'}</div>
                <div class="preview-info text-primary">${user.position || '-'}</div>
            `;
            card.addEventListener('click', () => {
                selectEl.value = idx;
                handleMemberSelect(idx);
            });
            previewEl.appendChild(card);
        });
    }

    function updateStaticProfile(user) {
        document.getElementById('resPhoto').src = user.photo || '../img/default-profile.png';
        document.getElementById('resName').innerText = user.name;
        document.getElementById('resNickName').innerText = user.nickName ? `(${user.nickName})` : '';
        document.getElementById('resAffiliation').innerText = user.affiliation || '정보 없음';
        document.getElementById('resPosition').innerText = user.position || '정보 없음';
        document.getElementById('resHobby').innerText = user.hobby || '정보 없음';
        document.getElementById('resSpecialty').innerText = user.specialty || '정보 없음';
        document.getElementById('resServicePeriod').innerText = `${user.start} ~ ${user.end}`;
    }

    function calculateMilitary(user) {
        const now = new Date();
        const start = new Date(user.start);
        const end = new Date(user.end);
        const vac = user.vacation ? new Date(user.vacation) : null;

        const totalTime = end - start;
        const passedTime = now - start;
        const remainTime = end - now;

        const percent = Math.min(100, Math.max(0, (passedTime / totalTime) * 100)).toFixed(8);
        const remainDays = Math.ceil(remainTime / (1000 * 60 * 60 * 24));

        const startFirstDay = new Date(start.getFullYear(), start.getMonth(), 1);
        const currentMonthCount = (now.getFullYear() - startFirstDay.getFullYear()) * 12 + (now.getMonth() - startFirstDay.getMonth()) + 1;
        
        const pfc2cpl = (user.promotion && user.promotion.pfc2cpl) || 0;
        const cpl2sgt = (user.promotion && user.promotion.cpl2sgt) || 0;

        const pfcThreshold = 3;
        const cplThreshold = 9 - pfc2cpl;
        const sgtThreshold = 15 - pfc2cpl - cpl2sgt;

        let rank = "", hobong = 0, promoMonthOffset = 0;

        if (currentMonthCount <= pfcThreshold) {
            rank = "이병";
            hobong = currentMonthCount;
            promoMonthOffset = pfcThreshold;
        } else if (currentMonthCount <= cplThreshold) {
            rank = "일병";
            hobong = currentMonthCount - pfcThreshold;
            promoMonthOffset = cplThreshold;
        } else if (currentMonthCount <= sgtThreshold) {
            rank = "상병";
            hobong = currentMonthCount - cplThreshold;
            promoMonthOffset = sgtThreshold;
        } else {
            rank = "병장";
            hobong = currentMonthCount - sgtThreshold;
            promoMonthOffset = -1;
        }

        const rankBadge = document.getElementById('resRankTop');
        if (rankBadge) rankBadge.innerText = rank;
        
        const rankStatus = document.getElementById('resRankStatus');
        if (rankStatus) rankStatus.innerText = remainTime > 0 ? `${rank} ${hobong}호봉` : "병장 (전역 완료)";
        
        const percentEl = document.getElementById('resPercent');
        if (percentEl) percentEl.innerText = `${percent}%`;
        
        const progressFill = document.getElementById('progressBarFill');
        if (progressFill) progressFill.style.width = `${percent}%`;
        
        const ddayEl = document.getElementById('resDday');
        if (ddayEl) ddayEl.innerText = remainTime > 0 ? `D-${remainDays}` : "전역 완료";

        let nextPromoDate = null;
        if (promoMonthOffset !== -1) {
            nextPromoDate = new Date(startFirstDay.getFullYear(), startFirstDay.getMonth() + promoMonthOffset, 1);
        }

        const promoInfo = document.getElementById('resPromoInfo');
        if (promoInfo) {
            if (rank === "병장" || !nextPromoDate || remainTime <= 0) {
                promoInfo.innerText = "일정 없음";
            } else {
                const promoDday = Math.ceil((nextPromoDate - now) / (1000 * 60 * 60 * 24));
                promoInfo.innerText = `D-${promoDday} (${nextPromoDate.toLocaleDateString()})`;
            }
        }

        const vacInfo = document.getElementById('resVacInfo');
        if (vacInfo) {
            if (vac && vac > now) {
                const vacDday = Math.ceil((vac - now) / (1000 * 60 * 60 * 24));
                vacInfo.innerText = `D-${vacDday} (${user.vacation})`;
            } else {
                vacInfo.innerText = "일정 없음";
            }
        }
    }
});
