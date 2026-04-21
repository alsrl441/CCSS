// STORE 이름은 shipTrace.js 내에서만 쓰이므로 변수명 충돌 방지를 위해 지역 변수로 유지하거나 var 사용
var STORE_IDENTIFIED = 'identified_ships';
var STORE_UNIDENTIFIED = 'unidentified_ships';
var db;

function initDB() {
    // script.js에 선언된 전역 DB_NAME 사용
    const request = indexedDB.open(DB_NAME);

    request.onupgradeneeded = (e) => {
        const upgradeDb = e.target.result;
        if (!upgradeDb.objectStoreNames.contains(STORE_IDENTIFIED)) {
            upgradeDb.createObjectStore(STORE_IDENTIFIED);
        }
        if (!upgradeDb.objectStoreNames.contains(STORE_UNIDENTIFIED)) {
            upgradeDb.createObjectStore(STORE_UNIDENTIFIED);
        }
    };

    request.onsuccess = (e) => {
        db = e.target.result;
        // 런타임에 스토어가 없는 경우를 대비한 체크
        if (!db.objectStoreNames.contains(STORE_IDENTIFIED) || !db.objectStoreNames.contains(STORE_UNIDENTIFIED)) {
            const version = db.version;
            db.close();
            const upgradeRequest = indexedDB.open(DB_NAME, version + 1);
            upgradeRequest.onupgradeneeded = (ev) => {
                const upDb = ev.target.result;
                if (!upDb.objectStoreNames.contains(STORE_IDENTIFIED)) upDb.createObjectStore(STORE_IDENTIFIED);
                if (!upDb.objectStoreNames.contains(STORE_UNIDENTIFIED)) upDb.createObjectStore(STORE_UNIDENTIFIED);
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

function toggleTraceMode() {
    const modeEl = document.querySelector('input[name="trace-mode"]:checked');
    if (!modeEl) return;
    
    const mode = modeEl.value;
    const inquirySection = document.getElementById('section-inquiry');
    
    if (!inquirySection) return;

    if (mode === 'inquiry') {
        inquirySection.style.setProperty('display', 'block', 'important');
    } else {
        inquirySection.style.setProperty('display', 'none', 'important');
    }
}
window.toggleTraceMode = toggleTraceMode;

// 이미지 압축 및 리사이징 함수
function compressImage(file, maxWidth = 800, maxHeight = 600) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // 비율 유지하며 리사이징
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // JPEG 0.7 화질로 압축 (용량 최적화)
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
        };
    });
}

// 이미지 드래그 앤 드롭 및 미리보기 핸들러
function setupImageHandlers() {
    const zones = [
        { dropZone: 'ship-drop-zone', input: 'ship-image-path', preview: 'ship-preview' },
        { dropZone: 'path-drop-zone', input: 'path-image-path', preview: 'path-preview' }
    ];

    zones.forEach(zone => {
        const dropZone = document.getElementById(zone.dropZone);
        const input = document.getElementById(zone.input);
        const preview = document.getElementById(zone.preview);

        if (!dropZone || !input || !preview) return;

        // 드래그 이벤트 처리
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    // 이미지 압축 후 저장
                    const compressedData = await compressImage(file);
                    input.value = compressedData; // 압축된 데이터(Base64) 저장
                    preview.src = compressedData; // 미리보기 업데이트
                }
            }
        });

        // 경로 입력창 변경 시 미리보기 업데이트
        input.addEventListener('input', () => {
            const path = input.value.trim();
            if (path) {
                // 데이터 URL인지 파일 경로인지 확인
                if (path.startsWith('data:image')) {
                    preview.src = path;
                } else {
                    preview.src = `../shipDB/identified/${path}`;
                }
            } else {
                preview.src = `../shipDB/identified/Images/no-image.jpg`;
            }
        });
    });
}

// 이벤트 리스너 등록 및 초기화
document.addEventListener('DOMContentLoaded', () => {
    const modeRadios = document.querySelectorAll('input[name="trace-mode"]');
    modeRadios.forEach(radio => {
        radio.addEventListener('change', toggleTraceMode);
    });
    
    // 초기 실행
    toggleTraceMode();
    setupImageHandlers(); // 이미지 핸들러 초기화
});

const distValue = document.getElementById('dist-value');
const distUnit = document.getElementById('dist-unit');
const distKmDisplay = document.getElementById('dist-km-display');
const radarStationSelect = document.getElementById('radar-station-select');
const traceNumInput = document.getElementById('trace-num');

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
    toggleTraceNum();
}

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

    distKmDisplay.innerText = `${km.toFixed(1)} km`;
}
if (distValue) distValue.addEventListener('input', updateDistance);
if (distUnit) distUnit.addEventListener('change', updateDistance);


function getAutoMovementPath(firstPos, moveDir, lastPos, reason) {
    let reasonText = "";
    
    // 받침 유무에 따른 '으로/로' 처리 (소실용)
    const attachRo = (word) => {
        if (!word || word.endsWith(")")) return word + "(으)로"; // "(최종 위치)" 등 예외처리
        const lastChar = word.charCodeAt(word.length - 1);
        const batchimCode = (lastChar - 0xAC00) % 28;
        // 받침이 있고 'ㄹ'받침이 아닌 경우 '으로', 그 외(받침 없거나 'ㄹ'받침) '로'
        return (batchimCode !== 0 && batchimCode !== 8) ? word + "으로" : word + "로";
    };

    switch (reason) {
        case "소실":
            reasonText = `${attachRo(lastPos)} 소실`;
            break;
        case "입항":
            reasonText = `${lastPos}에 입항`;
            break;
        case "정박":
            reasonText = `${lastPos}에서 정박`;
            break;
        case "정상 활동":
            reasonText = `${lastPos}에서 정상 활동으로 추적 종료`;
            break;
        case "타 선박 문의":
            reasonText = `${lastPos}에서 타 선박 문의로 추적 종료`;
            break;
        default:
            reasonText = `${lastPos}에서 ${reason}`;
    }
    
    return `${firstPos}에서 ${moveDir}하여 ${reasonText}.`;
}

function updateMovementPathPreview() {
    const firstPos = document.getElementById('first-pos').value.trim() || "(최초 위치)";
    const moveDir = document.getElementById('move-dir-common').value.trim() || "(이동 방향)";
    const lastPos = document.getElementById('last-pos').value.trim() || "(최종 위치)";
    const reason = document.getElementById('termination-reason').value;
    
    const previewText = getAutoMovementPath(firstPos, moveDir, lastPos, reason);
    const previewElement = document.getElementById('path-preview-text');
    if (previewElement) {
        previewElement.innerText = previewText;
    }
}

['first-pos', 'move-dir-common', 'last-pos', 'termination-reason'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        const eventType = el.tagName === 'SELECT' ? 'change' : 'input';
        el.addEventListener(eventType, updateMovementPathPreview);
    }
});

updateMovementPathPreview();

function setCurrentTime(targetId) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById(targetId).value = `${hours}:${minutes}`;
}

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
        updateMovementPathPreview();
    }
}

async function saveTraceLog() {
    if (!db) {
        alert("데이터베이스가 아직 준비되지 않았습니다.");
        return;
    }

    const mode = document.querySelector('input[name="trace-mode"]:checked').value;
    
    // 기본 정보
    const shipName = document.getElementById('ship-name').value.trim() || "식별불가";
    const shipType = document.getElementById('ship-type').value.trim() || "";
    const tonnage = document.getElementById('ship-tonnage').value.trim().replace(/t/gi, '') || "";
    const shipNumber = document.getElementById('ship-number').value.trim() || "";
    const shipOwner = document.getElementById('ship-owner').value.trim() || "";
    const shipTel = document.getElementById('ship-tel').value.trim() || "";
    
    // 식별 기록 정보
    const worker = document.getElementById('worker').value.trim() || "미입력";
    const telephonee = document.getElementById('telephonee').value.trim() || "";
    const violationStatus = document.getElementById('violation-select').value;
    const violationDetail = document.getElementById('violation-detail').value.trim();
    const fullViolationText = (violationStatus === "O") ? `O (${violationDetail})` : "X";

    const tagString = document.getElementById('tags').value;
    const tags = tagString ? tagString.split(',').map(t => t.trim()).filter(t => t) : [""];

    const identificationDate = new Date().toISOString().split('T')[0];

    const firstPos = document.getElementById('first-pos').value.trim() || "";
    const moveDirCommon = document.getElementById('move-dir-common').value.trim() || "";
    const lastPos = document.getElementById('last-pos').value.trim() || "";
    const terminationReason = document.getElementById('termination-reason').value;
    
    const autoMovementPath = getAutoMovementPath(firstPos, moveDirCommon, lastPos, terminationReason);

    // 거리 환산 (km로 저장)
    let distKm = "0";
    if (mode === 'inquiry') {
        const val = parseFloat(document.getElementById('dist-value').value);
        const unit = document.getElementById('dist-unit').value;
        if (!isNaN(val)) {
            if (unit === 'km') distKm = val.toFixed(1);
            else if (unit === 'NM') distKm = (val * 1.852).toFixed(1);
            else if (unit === 'M') distKm = (val * 1.609).toFixed(1);
        }
    }

    const newHistory = {
        date: identificationDate,
        coord: mode === 'inquiry' ? document.getElementById('coord-input').value.trim() : "",
        directionAtInquiry: mode === 'inquiry' ? document.getElementById('current-move-dir').value : "",
        distance: distKm + "km",
        traceNumber: mode === 'inquiry' ? (document.getElementById('radar-station-select').value + "-" + document.getElementById('trace-num').value.trim()) : "",
        firstOutport: mode === 'inquiry' ? document.getElementById('departure').value : "",
        firstTime: document.getElementById('first-time').value || "00:00",
        firstAzEl: document.getElementById('first-az-el').value || "",
        firstPos: firstPos,
        lastTime: document.getElementById('last-time').value || "00:00",
        lastAzEl: document.getElementById('last-az-el').value || "",
        lastPos: lastPos,
        tags: tags,
        moveDirOverall: moveDirCommon,
        terminationReason: terminationReason,
        movementPath: autoMovementPath,
        crewCount: document.getElementById('crew-count').value.trim().replace(/명/g, '') || "식별불가",
        externalName: document.getElementById('external-name').value.trim() || "X",
        handoverDetails: mode === 'inquiry' ? (document.getElementById('handover-details').value || "X") : "X",
        shipImage: document.getElementById('ship-image-path').value.trim() || "Images/no-image.jpg",
        pathImage: document.getElementById('path-image-path').value.trim() || "Images/no-image.jpg",
        violation: fullViolationText,
        worker: worker,
        telephonee: telephonee,
        timestamp: new Date().getTime(),
        cameraNum: document.getElementById('camera-num').value
    };

    const isIdentified = (shipName !== "식별불가");
    const targetStoreName = isIdentified ? STORE_IDENTIFIED : STORE_UNIDENTIFIED;
    
    const tx = db.transaction(targetStoreName, "readwrite");
    const store = tx.objectStore(targetStoreName);
    
    const getReq = store.openCursor();
    let existingShip = null;
    let existingKey = null;

    getReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
            if (cursor.value.name === shipName && isIdentified) {
                existingShip = cursor.value;
                existingKey = cursor.key;
            } else {
                cursor.continue();
                return;
            }
        }

        if (existingShip) {
            // 기존 정보 업데이트 (값이 없을 때만)
            if (!existingShip.type) existingShip.type = shipType;
            if (!existingShip.tonnage) existingShip.tonnage = tonnage;
            if (!existingShip.number) existingShip.number = shipNumber;
            if (!existingShip.owner) existingShip.owner = shipOwner;
            if (!existingShip.tel) existingShip.tel = shipTel;

            if (!existingShip.history) existingShip.history = [];
            existingShip.history.unshift(newHistory);
            
            store.put(existingShip, existingKey);
        } else {
            const newShip = {
                id: Date.now().toString(),
                name: shipName,
                type: shipType,
                tonnage: tonnage,
                number: shipNumber,
                owner: shipOwner,
                tel: shipTel,
                history: [newHistory]
            };
            store.add(newShip, newShip.id);
        }
    };

    tx.oncomplete = () => {
        alert("추적 기록이 성공적으로 DB에 등록되었습니다.");
        document.getElementById('trace-form').reset();
        
        // 이미지 미리보기 초기화
        document.getElementById('ship-preview').src = "../shipDB/identified/Images/no-image.jpg";
        document.getElementById('path-preview').src = "../shipDB/identified/Images/no-image.jpg";
        
        toggleTraceMode();
        toggleViolationDetail();
        toggleTraceNum();
        updateDistance();
        updateMovementPathPreview();
    };

    tx.onerror = (e) => {
        console.error("저장 실패:", e.target.error);
        alert("저장 중 오류가 발생했습니다.");
    };
}

