const DB_NAME = 'myDB';
const STORE_NAME = 'ship';
let db;

function initDB() {
    const request = indexedDB.open(DB_NAME);

    request.onsuccess = (e) => {
        db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            const version = db.version;
            db.close();
            const upgradeRequest = indexedDB.open(DB_NAME, version + 1);
            upgradeRequest.onupgradeneeded = (ev) => {
                const upgradeDb = ev.target.result;
                upgradeDb.createObjectStore(STORE_NAME);
            };
            upgradeRequest.onsuccess = (ev) => {
                db = ev.target.result;
            };
        }
    };

    request.onerror = (e) => {
        console.error("[IndexedDB] 초기 연결 실패:", e.target.error);
    };
}
initDB();

// --- 모드 전환 로직 ---
function toggleTraceMode() {
    const mode = document.querySelector('input[name="trace-mode"]:checked').value;
    const directSection = document.getElementById('section-direct');
    const inquirySection = document.getElementById('section-inquiry');
    
    if (mode === 'direct') {
        directSection.style.display = 'block';
        inquirySection.style.display = 'none';
    } else {
        directSection.style.display = 'none';
        inquirySection.style.display = 'block';
    }
}

// --- 위치 및 문의 정보 관련 로직 ---
const distValue = document.getElementById('dist-value');
const distUnit = document.getElementById('dist-unit');
const distKmDisplay = document.getElementById('dist-km-display');
const radarStationSelect = document.getElementById('radar-station-select');
const traceNumInput = document.getElementById('trace-num');

// 추적 번호 입력창 활성/비활성 제어
function toggleTraceNum() {
    if (radarStationSelect && radarStationSelect.value === "-") {
        traceNumInput.disabled = true;
        traceNumInput.value = "";
    } else if (traceNumInput) {
        traceNumInput.disabled = false;
    }
}
if (radarStationSelect) {
    radarStationSelect.addEventListener('change', toggleTraceNum);
    toggleTraceNum(); // 초기 상태 설정
}

// 거리 계산 로직 (1해리 = 1.852km, 1마일 = 1.609km)
function updateDistance() {
    if (!distValue || !distKmDisplay) return;
    let val = parseFloat(distValue.value);
    let unit = distUnit.value;
    if (isNaN(val)) {
        distKmDisplay.innerText = "-- km";
        return;
    }
    let km;
    if (unit === 'km') { km = val; }
    else if (unit === 'NM') { km = val * 1.852; }
    else if (unit === 'M') { km = val * 1.609; }

    distKmDisplay.innerText = `${km.toFixed(2)} km`;
}
if (distValue) distValue.addEventListener('input', updateDistance);
if (distUnit) distUnit.addEventListener('change', updateDistance);
// ------------------------------------------

let identificationDate = new Date().toISOString().split('T')[0];

function setCurrentTime(targetId) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById(targetId).value = `${hours}:${minutes}`;
}

// 어선법 위반 여부 토글
function toggleViolationDetail() {
    const violationSelect = document.getElementById('violation-select');
    const detailInput = document.getElementById('violation-detail');
    if (!violationSelect || !detailInput) return;
    
    detailInput.disabled = (violationSelect.value === "X");
    if (violationSelect.value === "X") detailInput.value = "";
}

function resetForm() {
    if (confirm("입력 중인 내용을 초기화할까요?")) {
        document.getElementById('trace-form').reset();
        toggleTraceMode();
        toggleViolationDetail();
        toggleTraceNum();
        updateDistance();
    }
}

async function saveTraceLog() {
    if (!db) {
        alert("데이터베이스가 아직 준비되지 않았습니다.");
        return;
    }

    const mode = document.querySelector('input[name="trace-mode"]:checked').value;
    
    // 필수 입력 체크
    if (mode === 'direct') {
        const camera = document.getElementById('camera-num').value;
        const worker = document.getElementById('worker').value.trim();
        if (!camera) { alert("식별 카메라를 선택해주세요."); return; }
        if (!worker) { alert("근무자 관등성명을 입력해주세요."); return; }
    } else {
        const telephonee = document.getElementById('telephonee').value.trim();
        if (!telephonee) { alert("수화자 관등성명을 입력해주세요."); return; }
    }

    // 데이터 수집
    const shipName = document.getElementById('ship-name').value.trim() || "식별불가";
    const tonnage = document.getElementById('ship-tonnage').value.trim() || "식별불가";
    const shipType = document.getElementById('ship-type').value.trim() || "식별불가";
    const crewCount = document.getElementById('crew-count').value.trim() || "식별불가";
    
    const violationStatus = document.getElementById('violation-select').value;
    const violationDetail = document.getElementById('violation-detail').value.trim();
    const fullViolationText = (violationStatus === "O") ? `O (${violationDetail || "내용없음"})` : "X";

    const distText = distKmDisplay.innerText.replace(' km', '');
    const distanceKmValue = distText === "--" ? "-" : distText;

    const tagString = document.getElementById('tags').value;
    const tags = tagString ? tagString.split('\n').map(t => t.trim()).filter(t => t) : [];

    const newHistory = {
        mode: mode,
        date: identificationDate,
        timestamp: new Date().getTime(),
        
        // 공통/식별 정보
        shipName: shipName,
        tonnage: tonnage,
        shipType: shipType,
        crewCount: crewCount,
        violation: fullViolationText,
        
        // 직접 식별 전용
        cameraNum: mode === 'direct' ? document.getElementById('camera-num').value : "-",
        worker: mode === 'direct' ? document.getElementById('worker').value.trim() : "-",
        firstTime: mode === 'direct' ? document.getElementById('first-time').value : "-",
        firstAzEl: mode === 'direct' ? document.getElementById('first-az-el').value : "-",
        firstPos: mode === 'direct' ? document.getElementById('first-pos').value : "-",
        lastTime: mode === 'direct' ? document.getElementById('last-time').value : "-",
        lastAzEl: mode === 'direct' ? document.getElementById('last-az-el').value : "-",
        lastPos: mode === 'direct' ? document.getElementById('last-pos').value : "-",
        movementPath: mode === 'direct' ? document.getElementById('movement-path').value : "-",
        
        // 문의 식별 전용
        coord: mode === 'inquiry' ? document.getElementById('coord-input').value.trim() : "-",
        raderStation: mode === 'inquiry' ? document.getElementById('radar-station-select').value : "-",
        traceNumber: mode === 'inquiry' ? document.getElementById('trace-num').value.trim() : "-",
        direction: mode === 'inquiry' ? document.getElementById('move-dir').value : "-",
        distance: mode === 'inquiry' ? distanceKmValue : "-",
        firstOutport: mode === 'inquiry' ? document.getElementById('departure').value : "-",
        telephonee: mode === 'inquiry' ? document.getElementById('telephonee').value.trim() : "-",
        handoverDetails: mode === 'inquiry' ? document.getElementById('handover-details').value : "-",

        shipImage: "Images/no-image.jpg",
        pathImage: "Images/no-image.jpg"
    };

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    // 기존 로직과 동일하게 선명 기준으로 업데이트 또는 신규 추가
    const request = store.openCursor();
    let existingShip = null;
    let existingKey = null;

    request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
            if (cursor.value.name === shipName && shipName !== "식별불가") {
                existingShip = cursor.value;
                existingKey = cursor.key;
            } else {
                cursor.continue();
                return;
            }
        }

        if (existingShip) {
            if (tonnage !== "식별불가") existingShip.tonnage = tonnage;
            if (shipType !== "식별불가") existingShip.type = shipType;
            
            if (!Array.isArray(existingShip.tags)) existingShip.tags = [];
            tags.forEach(t => {
                if (!existingShip.tags.includes(t)) existingShip.tags.push(t);
            });

            if (!existingShip.history) existingShip.history = [];
            existingShip.history.push(newHistory);
            store.put(existingShip, existingKey);
        } else {
            const newShip = {
                name: shipName,
                tonnage: tonnage,
                type: shipType,
                tags: tags,
                history: [newHistory]
            };
            store.add(newShip, Date.now().toString());
        }
    };

    tx.oncomplete = () => {
        alert("추적 기록이 성공적으로 DB에 등록되었습니다.");
        document.getElementById('trace-form').reset();
        toggleTraceMode();
        toggleViolationDetail();
        toggleTraceNum();
        updateDistance();
    };

    tx.onerror = (e) => {
        console.error("저장 실패:", e.target.error);
        alert("저장 중 오류가 발생했습니다.");
    };
}

