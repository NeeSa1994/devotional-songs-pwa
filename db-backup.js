// IndexedDB Database Management
const DB_NAME = 'DevotionalSongsDB';
const DB_VERSION = 1;
const STORE_NAME = 'songs';

let db;

// Initialize database
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                
                objectStore.createIndex('title', 'title', { unique: false });
                objectStore.createIndex('author', 'author', { unique: false });
                objectStore.createIndex('category', 'category', { unique: false });
                objectStore.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };
    });
}

// Add a song
function addSong(song) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        song.createdAt = new Date().toISOString();
        const request = store.add(song);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Get all songs
function getAllSongs() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('createdAt');
        const request = index.openCursor(null, 'prev');
        
        const songs = [];
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                songs.push(cursor.value);
                cursor.continue();
            } else {
                resolve(songs);
            }
        };
        
        request.onerror = () => reject(request.error);
    });
}

// Get song by ID
function getSongById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Search songs
function searchSongs(searchTerm) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const allSongs = request.result;
            const term = searchTerm.toLowerCase();
            
            const results = allSongs.filter(song => 
                song.title.toLowerCase().includes(term) ||
                song.lyrics.toLowerCase().includes(term) ||
                (song.author && song.author.toLowerCase().includes(term)) ||
                (song.tags && song.tags.toLowerCase().includes(term))
            );
            
            resolve(results);
        };
        
        request.onerror = () => reject(request.error);
    });
}

// Delete song
function deleteSong(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Update song
function updateSong(id, song) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // Set id and updatedAt
        song.id = id;
        song.updatedAt = new Date().toISOString();
        
        // Ensure createdAt exists (should be passed from handleAddSong)
        if (!song.createdAt) {
            song.createdAt = new Date().toISOString();
        }
        
        const request = store.put(song);
        
        request.onsuccess = () => {
            console.log('Song updated successfully', song);
            resolve();
        };
        request.onerror = () => {
            console.error('Error updating song:', request.error);
            reject(request.error);
        };
    });
}
