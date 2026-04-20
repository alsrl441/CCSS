const DB_NAME = "IMS_database";

window.getDB = function() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

window.ensureStore = function(storeName, keyPath = null) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);
        
        request.onsuccess = (e) => {
            const db = e.target.result;
            if (db.objectStoreNames.contains(storeName)) {
                db.close();
                resolve();
                return;
            }
            
            const version = db.version;
            db.close();
            
            const upgradeReq = indexedDB.open(DB_NAME, version + 1);
            upgradeReq.onupgradeneeded = (ev) => {
                const upDb = ev.target.result;
                if (!upDb.objectStoreNames.contains(storeName)) {
                    const options = keyPath ? { keyPath } : {};
                    upDb.createObjectStore(storeName, options);
                    console.log(`[Database] Store '${storeName}' created.`);
                }
            };
            upgradeReq.onsuccess = (ev) => {
                ev.target.result.close();
                resolve();
            };
            upgradeReq.onerror = (ev) => reject(ev.target.error);
            upgradeReq.onblocked = () => {
                console.warn("Database upgrade blocked. Please close other tabs.");
                reject("blocked");
            };
        };
        request.onerror = (e) => reject(e.target.error);
    });
};

window.getDBData = async function(storeName) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => {
            db.close();
            resolve(request.result);
        };
        request.onerror = () => {
            db.close();
            reject(request.error);
        };
    });
};

window.putDBData = async function(storeName, data) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const request = store.put(data);
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
    });
};

window.deleteDBData = async function(storeName, key) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const request = store.delete(key);
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
    });
};

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
    setInterval(updateClock, 1000);
    updateClock();
});
