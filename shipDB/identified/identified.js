const TARGET_STORE_NAME = "identified_ships";

// 이 페이지에서 사용할 데이터 양식 정의
const defaultShipData = {
    id: "SHIP-001",
    name: "Unknown Vessel",
    type: "Cargo",
    lastSeen: new Date().toISOString(),
    status: "Identified"
};

async function initIdentifiedShips() {
    try {
        // 1. 스토어 존재 여부 확인 및 생성 (keyPath를 id로 설정)
        await window.ensureStore(TARGET_STORE_NAME, "id");
        
        // 2. 데이터 읽어오기
        let ships = await window.getDBData(TARGET_STORE_NAME);
        
        // 3. 데이터가 없으면 기본 양식으로 초기 데이터 삽입 (선택 사항)
        if (ships.length === 0) {
            console.log("초기 데이터가 없어 기본 양식을 생성합니다.");
            await window.putDBData(TARGET_STORE_NAME, defaultShipData);
            ships = [defaultShipData];
        }
        
        console.log("로드된 선박 데이터:", ships);
        renderShips(ships);
    } catch (err) {
        console.error("초기화 중 오류 발생:", err);
    }
}

function renderShips(ships) {
    // 화면에 데이터를 표시하는 로직 (HTML 구조에 맞게 구현)
    const listContainer = document.getElementById('ship-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = ships.map(ship => `
        <div class="ship-item">
            <strong>${ship.name}</strong> (${ship.id}) - ${ship.type}
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', initIdentifiedShips);
