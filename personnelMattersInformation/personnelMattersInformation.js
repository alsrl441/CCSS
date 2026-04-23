document.addEventListener('DOMContentLoaded', async () => {
    
    const selectEl = document.getElementById('memberSelect');
    const displayEl = document.getElementById('resultDisplay');
    const noDataEl = document.getElementById('noDataMessage');
    const previewEl = document.getElementById('previewDisplay');
    
    const addBtn = document.getElementById('addMemberBtn');
    const editBtn = document.getElementById('editMemberBtn');
    const deleteBtn = document.getElementById('deleteMemberBtn');
    const saveBtn = document.getElementById('saveMemberBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    
    const photoInput = document.getElementById('photoInput');
    const resPhoto = document.getElementById('resPhoto');
    const photoOverlay = document.getElementById('photoOverlay');
    
    let timerId = null; 
    let members = [];
    let currentPhotoBase64 = "";
    let isAdding = false;
    const STORE_NAME = "members";

    async function init() {
        members = await loadMembersFromDB();
        refreshUI();
    }

    async function loadMembersFromDB() {
        try {
            await window.ensureStore(STORE_NAME, "id");
            let data = await window.getDBData(STORE_NAME);
            if (!data || data.length === 0) {
                const sampleMember = {
                    "id": Date.now().toString(),
                    "name": "홍길동",
                    "nickName": "ㅎㄱㄷ",
                    "start": "2025-07-15",
                    "end": "2027-01-14",
                    "vacation": [],
                    "pfcDate": "2025-10-01",
                    "cplDate": "2026-04-01",
                    "sgtDate": "2026-10-01",
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

    function refreshUI() {
        selectEl.innerHTML = '<option value="">인원을 선택하세요</option>';
        members.forEach((m, idx) => {
            let opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = m.name;
            selectEl.appendChild(opt);
        });
        handleMemberSelect("");
    }

    selectEl.addEventListener('change', (e) => {
        handleMemberSelect(e.target.value);
    });

    function handleMemberSelect(val) {
        if (timerId) clearInterval(timerId);
        toggleEditMode(false);

        if (val === "") {
            displayEl.classList.add('hidden');
            noDataEl.classList.remove('hidden');
            previewEl.classList.remove('hidden');
            renderPreview();
            timerId = setInterval(updateAllPreviews, 10);
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
                <div class="preview-text">
                    <div class="preview-header-row">
                        <div class="preview-name">${user.name}</div>
                        <div id="preview-percent-${idx}" class="preview-percent-text">0.00000000%</div>
                    </div>
                    <div class="preview-progress-container">
                        <div id="preview-bar-${idx}" class="preview-progress-fill" style="width: 0%"></div>
                    </div>
                </div>
            `;
            card.addEventListener('click', () => {
                selectEl.value = idx;
                handleMemberSelect(idx);
            });
            previewEl.appendChild(card);
        });

        const addCard = document.createElement('div');
        addCard.className = 'preview-card preview-card-add';
        addCard.innerHTML = `
            <i class="fas fa-plus"></i>
            <span>인원 추가</span>
        `;
        addCard.addEventListener('click', () => {
            startAddMember();
        });
        previewEl.appendChild(addCard);

        updateAllPreviews();
    }

    function toggleEditMode(isEdit) {
        const viewElements = document.querySelectorAll('.view-mode');
        const editElements = document.querySelectorAll('.edit-mode');
        
        if (isEdit) {
            viewElements.forEach(el => el.classList.add('hidden'));
            editElements.forEach(el => el.classList.remove('hidden'));
            photoOverlay.classList.remove('hidden');
        } else {
            viewElements.forEach(el => el.classList.remove('hidden'));
            editElements.forEach(el => el.classList.add('hidden'));
            photoOverlay.classList.add('hidden');
            isAdding = false;
        }
    }

    function updateStaticProfile(user) {
        document.getElementById('resName').textContent = user.name;
        document.getElementById('resNickName').textContent = user.nickName || "";
        document.getElementById('resAffiliation').textContent = user.affiliation || "-";
        document.getElementById('resPosition').textContent = user.position || "-";
        document.getElementById('resHobby').textContent = user.hobby || "-";
        document.getElementById('resSpecialty').textContent = user.specialty || "-";
        document.getElementById('resStartDate').textContent = user.start;
        document.getElementById('resEndDate').textContent = user.end;
        document.getElementById('resPfcDate').textContent = user.pfcDate || "-";
        document.getElementById('resCplDate').textContent = user.cplDate || "-";
        document.getElementById('resSgtDate').textContent = user.sgtDate || "-";
        resPhoto.src = user.photo || "../img/default-profile.png";
        currentPhotoBase64 = user.photo || "";

        // Fill inputs for editing
        document.getElementById('editName').value = user.name;
        document.getElementById('editNickName').value = user.nickName || "";
        document.getElementById('editAffiliation').value = user.affiliation || "";
        document.getElementById('editPosition').value = user.position || "";
        document.getElementById('editHobby').value = user.hobby || "";
        document.getElementById('editSpecialty').value = user.specialty || "";
        document.getElementById('editStartDate').value = user.start;
        document.getElementById('editEndDate').value = user.end;
        document.getElementById('editPfcDate').value = user.pfcDate || "";
        document.getElementById('editCplDate').value = user.cplDate || "";
        document.getElementById('editSgtDate').value = user.sgtDate || "";
    }

    function startAddMember() {
        isAdding = true;
        selectEl.value = "";
        handleMemberSelect("");
        
        displayEl.classList.remove('hidden');
        noDataEl.classList.add('hidden');
        previewEl.classList.add('hidden');
        
        // Clear all inputs
        document.querySelectorAll('.edit-mode input').forEach(input => input.value = "");
        resPhoto.src = "../img/default-profile.png";
        currentPhotoBase64 = "";
        
        toggleEditMode(true);
        document.getElementById('editName').focus();
    }

    editBtn.addEventListener('click', () => {
        toggleEditMode(true);
    });

    cancelBtn.addEventListener('click', () => {
        if (isAdding) {
            handleMemberSelect("");
        } else {
            toggleEditMode(false);
        }
    });

    addBtn.addEventListener('click', startAddMember);

    saveBtn.addEventListener('click', async () => {
        const name = document.getElementById('editName').value.trim();
        if (!name) return alert("이름을 입력하세요.");

        const userIdx = selectEl.value;
        const id = isAdding ? Date.now().toString() : members[userIdx].id;

        const updatedUser = {
            id,
            name,
            nickName: document.getElementById('editNickName').value.trim(),
            affiliation: document.getElementById('editAffiliation').value.trim(),
            position: document.getElementById('editPosition').value.trim(),
            hobby: document.getElementById('editHobby').value.trim(),
            specialty: document.getElementById('editSpecialty').value.trim(),
            start: document.getElementById('editStartDate').value,
            end: document.getElementById('editEndDate').value,
            pfcDate: document.getElementById('editPfcDate').value,
            cplDate: document.getElementById('editCplDate').value,
            sgtDate: document.getElementById('editSgtDate').value,
            photo: currentPhotoBase64,
            vacation: isAdding ? [] : members[userIdx].vacation
        };

        try {
            await window.putDBData(STORE_NAME, updatedUser);
            members = await loadMembersFromDB();
            refreshUI();
            
            // Re-select saved member
            const newIdx = members.findIndex(m => m.id === id);
            selectEl.value = newIdx;
            handleMemberSelect(newIdx);
        } catch (err) {
            alert("저장 실패: " + err);
        }
    });

    deleteBtn.addEventListener('click', async () => {
        const idx = selectEl.value;
        if (idx === "" || !confirm("정말 삭제하시겠습니까?")) return;

        try {
            const db = await window.getDB();
            const tx = db.transaction(STORE_NAME, "readwrite");
            tx.objectStore(STORE_NAME).delete(members[idx].id);
            tx.oncomplete = async () => {
                db.close();
                members = await loadMembersFromDB();
                refreshUI();
            };
        } catch (err) {
            alert("삭제 실패");
        }
    });

    // Photo selection
    photoOverlay.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (rev) => {
            currentPhotoBase64 = rev.target.result;
            resPhoto.src = currentPhotoBase64;
        };
        reader.readAsDataURL(file);
    });

    function calculateMilitary(user) {
        if (!user.start || !user.end) return;
        const now = new Date();
        const start = new Date(user.start);
        const end = new Date(user.end);

        const totalMs = end - start;
        const elapsedMs = now - start;
        let percent = (elapsedMs / totalMs) * 100;

        if (percent < 0) percent = 0;
        if (percent > 100) percent = 100;

        document.getElementById('resPercent').textContent = percent.toFixed(8) + "%";
        document.getElementById('progressBarFill').style.width = percent + "%";

        const remainMs = end - now;
        const dday = Math.ceil(remainMs / (1000 * 60 * 60 * 24));
        document.getElementById('resDday').textContent = dday > 0 ? `D-${dday}` : (dday === 0 ? "D-Day" : `전역 후 ${Math.abs(dday)}일`);
    }

    function updateAllPreviews() {
        members.forEach((user, idx) => {
            const start = new Date(user.start);
            const end = new Date(user.end);
            const now = new Date();
            const total = end - start;
            const elapsed = now - start;
            let p = (elapsed / total) * 100;
            if (p < 0) p = 0; if (p > 100) p = 100;

            const pText = document.getElementById(`preview-percent-${idx}`);
            const pBar = document.getElementById(`preview-bar-${idx}`);
            if (pText) pText.textContent = p.toFixed(8) + "%";
            if (pBar) pBar.style.width = p + "%";
        });
    }

    init();
});
