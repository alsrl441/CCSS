// 좌표 자동 완성 로직
const coordX = document.getElementById('coord-x');
const coordY = document.getElementById('coord-y');
const fullCoordDisplay = document.getElementById('full-coord');

function updateFullCoord() {
    let xStr = coordX.value.toString();
    let yStr = coordY.value.toString();
    
    if (xStr === "" && yStr === "") {
        fullCoordDisplay.innerText = "52SBD ----- -----";
        return;
    }

    // 3자리 입력 시 00을 붙여 5자리로 만듦 (예: 456 -> 45600)
    let fullX = xStr.padEnd(3, '0').slice(0, 3) + "00";
    let fullY = yStr.padEnd(3, '0').slice(0, 3) + "00";
    
    fullCoordDisplay.innerText = `52SBD ${fullX} ${fullY}`;
}

coordX.addEventListener('input', updateFullCoord);
coordY.addEventListener('input', updateFullCoord);

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
    }
}

// 로그 저장 및 표시
let traceLogs = [];

function saveTraceLog() {
    const site = document.getElementById('radar-site').value;
    const num = document.getElementById('trace-num').value;
    
    if(!num) {
        alert("추적번호를 입력해주세요.");
        return;
    }

    const log = {
        time: new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        traceNo: `${site}-${num}`,
        coord: fullCoordDisplay.innerText,
        specs: document.getElementById('ship-specs').value || "정보 없음",
        inquirer: document.getElementById('inquirer').value || "미상",
        status: document.getElementById('end-reason').value
    };

    traceLogs.unshift(log); // 최신 로그를 앞으로
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
    
    const text = `
[선박 추적 보고]
- 추적번호: ${site}-${num}
- 현재위치: ${fullCoordDisplay.innerText}
- 이동방향: ${document.getElementById('move-dir').value || "미상"}
- 거리: ${document.getElementById('distance').value || "미상"}
- 문의자: ${document.getElementById('inquirer').value || "미상"}
- 식별제원: ${document.getElementById('ship-specs').value || "식별 중"}
- 현재상태: ${document.getElementById('end-reason').value}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
        alert("보고용 텍스트가 복사되었습니다.");
    });
}

// 초기 실행
renderLogs();
