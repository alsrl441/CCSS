function initDatabase() {
    const DB_NAME = "IMS_database";

    // 1. 우선 버전을 명시하지 않고 열어서 현재 버전을 확인함
    const request = indexedDB.open(DB_NAME);

    request.onsuccess = (e) => {
        const db = e.target.result;
        const currentVersion = db.version;
        
        // 필요한 스토어 목록
        const requiredStores = ["menu", "workSchedule", "members", "identified_ships", "unidentified_ships"];
        const missingStores = requiredStores.filter(s => !db.objectStoreNames.contains(s));

        // 마이그레이션 대상 확인
        const needsMigration = db.objectStoreNames.contains("ship");

        // 만약 스토어가 하나라도 없거나 마이그레이션이 필요하면 버전을 올려서 다시 열기
        if (missingStores.length > 0 || needsMigration) {
            console.log(`Database update needed. Missing: ${missingStores.join(", ")}, Migration: ${needsMigration}`);
            db.close();
            upgradeDatabase(DB_NAME, currentVersion + 1);
        } else {
            console.log(`Database is up to date (Version: ${currentVersion}).`);
            db.close();
        }
    };

    request.onerror = (e) => {
        console.error("Database open error:", e.target.error);
    };
}

function upgradeDatabase(name, version) {
    const request = indexedDB.open(name, version);

    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        if (!db.objectStoreNames.contains("menu")) {
            db.createObjectStore("menu", { keyPath: "date" });
        }
        if (!db.objectStoreNames.contains("workSchedule")) {
            db.createObjectStore("workSchedule", { keyPath: "date" });
        }
        if (!db.objectStoreNames.contains("members")) {
            db.createObjectStore("members", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("identified_ships")) {
            db.createObjectStore("identified_ships");
        }
        if (!db.objectStoreNames.contains("unidentified_ships")) {
            db.createObjectStore("unidentified_ships");
        }

        // 마이그레이션 로직
        if (db.objectStoreNames.contains("ship")) {
            console.log("Migrating data from 'ship' to new stores...");
            // onupgradeneeded 안에서는 transaction을 직접 열 필요 없이 e.target.transaction을 사용
            const tx = e.target.transaction;
            const oldStore = tx.objectStore("ship");
            const identifiedStore = tx.objectStore("identified_ships");
            const unidentifiedStore = tx.objectStore("unidentified_ships");

            oldStore.openCursor().onsuccess = (ev) => {
                const cursor = ev.target.result;
                if (cursor) {
                    const data = cursor.value;
                    const targetStore = (data.name === "식별불가") ? unidentifiedStore : identifiedStore;
                    targetStore.put(data, cursor.key);
                    cursor.continue();
                } else {
                    console.log("Migration complete. Deleting old 'ship' store.");
                    db.deleteObjectStore("ship");
                }
            };
        }
    };

    request.onsuccess = (e) => {
        e.target.result.close();
    };
}

function updateClock() {
    const now = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const day = days[now.getDay()];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.innerText = `${year}-${month}-${date}(${day}) ${hours}:${minutes}:${seconds}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    setInterval(updateClock, 1000);
    updateClock();
});
