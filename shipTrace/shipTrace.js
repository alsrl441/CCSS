// 좌표 자동 완성 로직
const coordInput = document.getElementById('coord-input');
const fullCoordDisplay = document.getElementById('full-coord');

function updateFullCoord() {
    let val = coordInput.value.trim();
    if (!val) {
        fullCoordDisplay.innerText = "52SBD ----- -----";
        return;
    }

    // 공백이나 쉼표로 구분
    let parts = val.split(/[\s,]+/);
    let x = parts[0] || "";
    let y = parts[1] || "";

    let fullX = x.padEnd(3, '0').slice(0, 3) + "00";
    let fullY = y.padEnd(3, '0').slice(0, 3) + "00";
    
    fullCoordDisplay.innerText = `52SBD ${fullX} ${fullY}`;
}

coordInput.addEventListener('input', updateFullCoord);

// 거리 단위 변환 로직
const distValue = document.getElementById('dist-value');
const distUnit = document.getElementById('dist-unit');
const distConvert = document.getElementById('dist-convert');

function updateDistance() {
    let val = parseFloat(distValue.value);
    let unit = distUnit.value;

    if (isNaN(val)) {
        distConvert.innerText = "-- NM / -- km";
        return;
    }

    let km, nm, m;

    if (unit === 'km') {
        km = val;
        nm = val * 0.539957;
        m = val * 0.621371;
    } else if (unit === 'NM') {
        nm = val;
        km = val * 1.852;
        m = val * 1.15078;
    } else if (unit === 'M') {
        m = val;
        km = val * 1.60934;
        nm = val * 0.868976;
    }

    // 현재 선택한 단위를 제외한 나머지 두 개 표시
    if (unit === 'km') distConvert.innerText = `${nm.toFixed(2)}NM / ${m.toFixed(2)}M`;
    else if (unit === 'NM') distConvert.innerText = `${km.toFixed(2)}km / ${m.toFixed(2)}M`;
    else if (unit === 'M') distConvert.innerText = `${nm.toFixed(2)}NM / ${km.toFixed(2)}km`;
}

distValue.addEventListener('input', updateDistance);
distUnit.addEventListener('change', updateDistance);

// 현재 시간 입력 함수
function setCurrentTime(targetId) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById(targetId).value = `${hours}:${minutes}`;
}

// 폼 초기화
function resetForm() {
    if (confirm("입력 중인 내용을 초기화할까요?")) {
        document.getElementById('trace-form').reset();
        updateFullCoord();
        updateDistance();
    }
}

// 로그 저장 및 표시
let traceLogs = [];

function saveTraceLog() {
    const site = document.getElementById('radar-site').value;
    const num = document.getElementById('trace-num').value;
    
    // 필수값 체크 없음 (사용자 요청)
    const traceNo = num ? `${site}-${num}` : "미지정";

    const log = {
        time: new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        traceNo: traceNo,
        coord: fullCoordDisplay.innerText,
        specs: document.getElementById('ship-specs').value || "정보 없음",
        inquirer: document.getElementById('inquirer').value || "직접 식별",
        status: document.getElementById('end-reason').value
    };

    traceLogs.unshift(log);
    renderLogs();
    alert("로그가 저장되었습니다.");
}

function renderLogs() {
    const list = document.getElementById('log-list');
    if (traceLogs.length === 0) {
        list.innerHTML = '<tr><td colspan="5" class="text-muted py-4">저장된 로그가 없습니다.</td></tr>';
        return;
    }

    list.innerHTML = traceLogs.map(log => `
        <tr>
            <td>${log.time}</td>
            <td><strong>${log.traceNo}</strong></td>
            <td style="font-family: var(--font-mono); color: #0d6efd;">${log.coord}</td>
            <td style="text-align: left;">${log.specs} <span class="badge-status">${log.status}</span></td>
            <td>${log.inquirer}</td>
        </tr>
    `).join('');
}

// 텍스트 복사 기능 (보고용)
function copyToClipboard() {
    const site = document.getElementById('radar-site').value;
    const num = document.getElementById('trace-num').value;
    const distStr = distValue.value ? `${distValue.value}${distUnit.value} (${distConvert.innerText})` : "미상";
    
    const text = `
[선박 추적 보고]
- 추적번호: ${num ? site+'-'+num : "미지정"}
- 현재위치: ${fullCoordDisplay.innerText}
- 이동방향: ${document.getElementById('move-dir').value || "미상"}
- 거리: ${distStr}
- 문의자: ${document.getElementById('inquirer').value || "직접 식별(없음)"}
- 식별제원: ${document.getElementById('ship-specs').value || "식별 중"}
- 방위/고각: ${document.getElementById('az-el-input').value || "미상"}
- 현재상태: ${document.getElementById('end-reason').value}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
        alert("보고용 텍스트가 복사되었습니다.");
    });
}

renderLogs();
