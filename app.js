// App State
let selectedCategory = 'Entrance';
let currentSearchTerm = '';
let editingSongId = null; // Track if we're editing a song
let currentFilter = 'all'; // Track current category filter

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // Always clear login on fresh load
    setLoggedIn(false);
    
    // Always show login screen
    showLoginScreen();
});

// Show login screen
function showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const app = document.getElementById('app');
    loginScreen.classList.remove('hidden');
    app.style.display = 'none';
    
    // Setup login handlers
    const loginBtn = document.getElementById('loginBtn');
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginError = document.getElementById('loginError');
    
    const handleLogin = () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const userData = verifyCredentials(username, password);
        if (userData) {
            setLoggedIn(true, userData.username, userData.role, userData.displayName);
            hideLoginScreen();
            initApp();
        } else {
            loginError.style.display = 'block';
            passwordInput.value = '';
            usernameInput.focus();
        }
    };
    
    loginBtn.onclick = handleLogin;
    usernameInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    };
    passwordInput.onkeypress = (e) => {
        if (e.key === 'Enter') handleLogin();
    };
    
    usernameInput.focus();
}

// Hide login screen
function hideLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const app = document.getElementById('app');
    loginScreen.classList.add('hidden');
    app.style.display = 'block';
}

// Initialize app after login
async function initApp() {
    await initDB();
    setupEventListeners();
    await loadDashboard();
    displayUserInfo();
    
    // Setup realtime sync
    setupRealtimeSync(handleRealtimeUpdate);
}

// Handle realtime updates
async function handleRealtimeUpdate(payload) {
    console.log('Song updated in realtime:', payload);
    
    // Show a subtle notification
    showRealtimeNotification();
    
    // Refresh the current view
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        const tabId = activeTab.id;
        if (tabId === 'home') {
            await loadDashboard();
        } else if (tabId === 'browse') {
            await loadSongs();
        } else if (tabId === 'search') {
            await handleSearch();
        }
    }
}

// Show realtime notification
function showRealtimeNotification() {
    // Check if notification already exists
    if (document.getElementById('realtimeNotification')) return;
    
    const notification = document.createElement('div');
    notification.id = 'realtimeNotification';
    notification.style.cssText = `
        position: fixed;
        top: 70px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1001;
        font-size: 0.875rem;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = '🔄 Songs updated';
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    // Apply role-based UI restrictions
    applyRoleRestrictions();
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Category selection
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => selectCategory(chip));
    });

    // Form submission
    document.getElementById('addSongForm').addEventListener('submit', handleAddSong);
    document.getElementById('clearForm').addEventListener('click', clearForm);
    document.getElementById('discardEdit').addEventListener('click', discardEdit);

    // Title duplicate check
    const titleInput = document.getElementById('songTitle');
    if (titleInput) {
        titleInput.addEventListener('input', checkDuplicateTitle);
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keyup', handleSearch);
    }
    const clearSearchBtn = document.getElementById('clearSearch');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                handleSearch();
            }
        });
    }

    // Modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('songDetailModal').addEventListener('click', (e) => {
        if (e.target.id === 'songDetailModal') closeModal();
    });

    // Category filter
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => filterByCategory(chip));
    });
    
    // Initialize category selects with dynamic categories
    updateCategorySelects();
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });

    if (tabName === 'home') {
        loadDashboard();
    } else if (tabName === 'browse') {
        loadSongs();
    } else if (tabName === 'search') {
        handleSearch();
    }
}

// Load dashboard
async function loadDashboard() {
    try {
        // Show loading state
        const totalSongsEl = document.getElementById('totalSongs');
        const totalCategoriesEl = document.getElementById('totalCategories');
        totalSongsEl.textContent = '...';
        
        const songs = await getAllSongs();
        
        // Update total songs count
        totalSongsEl.textContent = songs.length;
        
        // Update categories count
        const categories = getAllCategories();
        totalCategoriesEl.textContent = Object.keys(categories).length;
        
        // Load recent songs (last 5)
        const recentSongs = songs
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        const recentContainer = document.getElementById('recentSongs');
        const noRecentMsg = document.getElementById('noRecentSongs');
        
        if (recentSongs.length === 0) {
            recentContainer.innerHTML = '';
            noRecentMsg.style.display = 'block';
        } else {
            noRecentMsg.style.display = 'none';
            recentContainer.innerHTML = recentSongs.map(song => createSongCard(song)).join('');
            
            // Add click listeners
            document.querySelectorAll('#recentSongs .song-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-btn')) {
                        showSongDetail(parseInt(card.dataset.id));
                    }
                });
            });

            // Add delete listeners
            document.querySelectorAll('#recentSongs .delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleDeleteSong(parseInt(btn.dataset.id));
                });
            });
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        // Show error state
        document.getElementById('totalSongs').textContent = '0';
    }
}

// Category selection
function selectCategory(chip) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    selectedCategory = chip.dataset.category;
}

// Check for duplicate song title
async function checkDuplicateTitle() {
    const titleInput = document.getElementById('songTitle');
    const duplicateWarning = document.getElementById('duplicateWarning');
    const title = titleInput.value.trim();
    
    if (!title || editingSongId) {
        // Don't check if empty or editing existing song
        duplicateWarning.style.display = 'none';
        return false;
    }
    
    try {
        const songs = await getAllSongs();
        const duplicate = songs.find(song => 
            song.title.toLowerCase() === title.toLowerCase()
        );
        
        if (duplicate) {
            duplicateWarning.style.display = 'block';
            return true;
        } else {
            duplicateWarning.style.display = 'none';
            return false;
        }
    } catch (error) {
        console.error('Error checking duplicate:', error);
        return false;
    }
}

// Load and display songs
async function loadSongs() {
    try {
        let songs = await getAllSongs();
        
        // Filter by category if not "all"
        if (currentFilter !== 'all') {
            songs = songs.filter(song => song.category === currentFilter);
        }
        
        const container = document.getElementById('songsList');
        const emptyState = document.getElementById('emptyState');
        
        if (songs.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            if (currentFilter !== 'all') {
                emptyState.innerHTML = `
                    <div class="empty-icon">🎵</div>
                    <h2>No ${currentFilter} songs</h2>
                    <p>Add songs in this category to see them here</p>
                `;
            } else {
                emptyState.innerHTML = `
                    <div class="empty-icon">🎵</div>
                    <h2>No songs yet</h2>
                    <p>Tap the + icon to add your first devotional song</p>
                `;
            }
        } else {
            emptyState.style.display = 'none';
            container.innerHTML = songs.map(song => createSongCard(song)).join('');
            
            // Add click listeners
            document.querySelectorAll('.song-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-btn')) {
                        showSongDetail(parseInt(card.dataset.id));
                    }
                });
            });

            // Add delete listeners
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleDeleteSong(parseInt(btn.dataset.id));
                });
            });
        }
    } catch (error) {
        console.error('Error loading songs:', error);
        alert('Failed to load songs');
    }
}

// Create song card HTML
function createSongCard(song) {
    const deleteBtn = isAdmin() ? `<button class="delete-btn" data-id="${song.id}" title="Delete">🗑️</button>` : '';
    return `
        <div class="song-card" data-id="${song.id}">
            <div class="song-card-header">
                <div>
                    <div class="song-title">${escapeHtml(song.title)}</div>
                </div>
                ${deleteBtn}
            </div>
        </div>
    `;
}

// Handle add song
async function handleAddSong(e) {
    e.preventDefault();
    
    const title = document.getElementById('songTitle').value.trim();
    const lyrics = document.getElementById('songLyrics').value.trim();
    const author = document.getElementById('songAuthor').value.trim();
    const tags = document.getElementById('songTags').value.trim();
    
    if (!title || !lyrics) {
        alert('Please fill in title and lyrics');
        return;
    }
    
    // Check for duplicate only when adding new song (not editing)
    if (!editingSongId) {
        const isDuplicate = await checkDuplicateTitle();
        if (isDuplicate) {
            alert('⚠️ A song with this title already exists. Please use a different title.');
            return;
        }
    }
    
    const song = {
        title,
        lyrics,
        author,
        category: selectedCategory,
        tags
    };
    
    try {
        if (editingSongId) {
            // Update existing song - preserve createdAt
            const existingSong = await getSongById(editingSongId);
            song.createdAt = existingSong.createdAt;
            await updateSong(editingSongId, song);
            alert('Song updated successfully!');
            editingSongId = null;
        } else {
            // Add new song
            await addSong(song);
            alert('Song added successfully!');
        }
        clearForm();
        switchTab('home');
    } catch (error) {
        console.error('Error saving song:', error);
        alert('Failed to save song: ' + error.message);
    }
}

// Update form title based on mode
function updateFormTitle() {
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.querySelector('#addSongForm button[type="submit"]');
    const discardBtn = document.getElementById('discardEdit');
    
    if (editingSongId) {
        formTitle.textContent = '✏️ Edit Song';
        submitBtn.innerHTML = '💾 Update Song';
        if (discardBtn) discardBtn.style.display = 'inline-block';
    } else {
        formTitle.textContent = '➕ Add New Song';
        submitBtn.innerHTML = '💾 Save Song';
        if (discardBtn) discardBtn.style.display = 'none';
    }
}

// Clear form
function clearForm() {
    document.getElementById('addSongForm').reset();
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    document.querySelector('[data-category="Entrance"]').classList.add('selected');
    selectedCategory = 'Entrance';
}

// Discard edit and return to browse
function discardEdit() {
    editingSongId = null;
    clearForm();
    updateFormTitle();
    switchTab('browse');
}

// Handle search
async function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    const clearBtn = document.getElementById('clearSearch');
    const resultsContainer = document.getElementById('searchResults');
    const emptyState = document.getElementById('searchEmptyState');
    
    clearBtn.style.display = searchTerm ? 'block' : 'none';
    
    if (!searchTerm) {
        resultsContainer.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    try {
        const results = await searchSongs(searchTerm);
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '';
            emptyState.innerHTML = `
                <div class="empty-icon">😔</div>
                <h2>No songs found</h2>
                <p>Try a different search term</p>
            `;
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            resultsContainer.innerHTML = results.map(song => createSongCard(song)).join('');
            
            // Add click listeners
            document.querySelectorAll('#searchResults .song-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-btn')) {
                        showSongDetail(parseInt(card.dataset.id));
                    }
                });
            });

            // Add delete listeners
            document.querySelectorAll('#searchResults .delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleDeleteSong(parseInt(btn.dataset.id));
                });
            });
        }
    } catch (error) {
        console.error('Error searching songs:', error);
        alert('Search failed');
    }
}

// Show song detail modal
async function showSongDetail(id) {
    try {
        const song = await getSongById(id);
        if (!song) return;
        
        const modal = document.getElementById('songDetailModal');
        const detailContainer = document.getElementById('songDetail');
        
        const tagsHTML = song.tags 
            ? song.tags.split(',').map(tag => 
                `<span class="tag-badge">${escapeHtml(tag.trim())}</span>`
              ).join('')
            : '';
        
        detailContainer.innerHTML = `
            <div class="song-detail-header">
                <h2 class="song-detail-title">${escapeHtml(song.title)}</h2>
                ${song.author ? `<p class="song-detail-author">By ${escapeHtml(song.author)}</p>` : ''}
                ${song.category ? `<span class="category-badge">${escapeHtml(song.category)}</span>` : ''}
                ${tagsHTML ? `<div class="tags-container">${tagsHTML}</div>` : ''}
            </div>
            
            <div class="lyrics-section">
                <div class="lyrics-label">Lyrics</div>
                <div class="lyrics-text">${escapeHtml(song.lyrics)}</div>
            </div>
            
            <div class="detail-actions">
                <button class="btn btn-edit" onclick="editSong(${song.id})">✏️ Edit</button>
                <button class="btn btn-share" onclick="shareSong(${song.id})">📤 Share</button>
                <button class="btn btn-delete" onclick="handleDeleteSongFromDetail(${song.id})">🗑️ Delete</button>
            </div>
            
            ${song.createdAt ? `<p class="timestamp">Added on ${new Date(song.createdAt).toLocaleDateString()}</p>` : ''}
        `;
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Error showing song detail:', error);
        alert('Failed to load song details');
    }
}

// Close modal
function closeModal() {
    document.getElementById('songDetailModal').classList.remove('active');
}

// Share song
async function shareSong(id) {
    try {
        const song = await getSongById(id);
        if (!song) return;
        
        const text = `${song.title}\n${song.author ? `By ${song.author}\n` : ''}\n${song.lyrics}`;
        
        if (navigator.share) {
            await navigator.share({
                title: song.title,
                text: text
            });
        } else {
            await navigator.clipboard.writeText(text);
            alert('Song lyrics copied to clipboard!');
        }
    } catch (error) {
        console.error('Error sharing:', error);
    }
}

// Handle delete song
async function handleDeleteSong(id) {
    const song = await getSongById(id);
    if (!song) return;
    
    if (confirm(`Are you sure you want to delete "${song.title}"?`)) {
        try {
            await deleteSong(id);
            loadDashboard();
            loadSongs();
            handleSearch();
        } catch (error) {
            console.error('Error deleting song:', error);
            alert('Failed to delete song');
        }
    }
}

// Handle delete from detail modal
async function handleDeleteSongFromDetail(id) {
    await handleDeleteSong(id);
    closeModal();
}

// Edit song
async function editSong(id) {
    try {
        const song = await getSongById(id);
        if (!song) return;
        
        // Populate form with song data
        document.getElementById('songTitle').value = song.title;
        document.getElementById('songLyrics').value = song.lyrics;
        document.getElementById('songAuthor').value = song.author || '';
        document.getElementById('songTags').value = song.tags || '';
        
        // Select category
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        const categoryChip = document.querySelector(`[data-category="${song.category}"]`);
        if (categoryChip) {
            categoryChip.classList.add('selected');
            selectedCategory = song.category;
        }
        
        // Set editing mode
        editingSongId = id;
        updateFormTitle();
        
        // Close modal and switch to add tab
        closeModal();
        switchTab('add');
        
        // Scroll to top
        window.scrollTo(0, 0);
    } catch (error) {
        console.error('Error loading song for edit:', error);
        alert('Failed to load song for editing');
    }
}

// Filter by category
function filterByCategory(chip) {
    // Update active state
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    
    // Update filter
    currentFilter = chip.dataset.filter;
    
    // Reload songs with filter
    loadSongs();
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// ========== CATEGORIES MANAGEMENT ==========

// Get all categories (default + custom)
function getAllCategories() {
    const defaultCategories = {
        'Entrance': { ml: 'പ്രവേശനം', color: '#FF6B6B' },
        'Offering': { ml: 'കാഴ്ചവയ്പ്പ്', color: '#4ECDC4' },
        'Eucharist': { ml: 'ദിവ്യകാരുണ്യം', color: '#95E1D3' },
        'Mary': { ml: 'മാതാവ്', color: '#F38181' },
        'Worship': { ml: 'ആരാധന', color: '#AA96DA' },
        'Christmas': { ml: 'ക്രിസ്തുമസ്', color: '#FCBAD3' },
        'HolyWeek': { ml: 'വിശുദ്ധവാരം', color: '#FFD93D' },
        'Wedding': { ml: 'വിവാഹം', color: '#6BCB77' },
        'Easter': { ml: 'ഈസ്റ്റർ', color: '#FFB6D9' },
        'HolySpirit': { ml: 'പരിശുദ്ധാത്മാവ്', color: '#D4A5A5' },
        'Thanksgiving': { ml: 'നന്ദി / സ്തുതി', color: '#9BB7D4' }
    };
    
    // Get custom categories from localStorage
    const customCategoriesJson = localStorage.getItem('divinebeats_custom_categories');
    const customCategories = customCategoriesJson ? JSON.parse(customCategoriesJson) : {};
    
    return { ...defaultCategories, ...customCategories };
}

// Open categories modal
function openCategoriesModal() {
    const modal = document.getElementById('categoriesModal');
    modal.classList.add('active');
    loadCategoriesList();
}

// Close categories modal
function closeCategoriesModal() {
    const modal = document.getElementById('categoriesModal');
    modal.classList.remove('active');
    
    // Clear form
    document.getElementById('newCategoryNameEn').value = '';
    document.getElementById('newCategoryNameMl').value = '';
    document.getElementById('newCategoryColor').value = '#8B4513';
}

// Load categories list in modal
function loadCategoriesList() {
    const categoryList = document.getElementById('categoryList');
    const categories = getAllCategories();
    const categoriesArray = Object.entries(categories);
    
    if (categoriesArray.length === 0) {
        categoryList.innerHTML = '<p style="text-align:center;color:#888;">No categories found</p>';
        return;
    }
    
    categoryList.innerHTML = categoriesArray.map(([key, data]) => `
        <div class="category-item" style="border-left-color: ${data.color}">
            <div class="category-name">
                ${escapeHtml(data.ml)}
                <small>${escapeHtml(key)}</small>
            </div>
            <div class="category-actions">
                ${!isDefaultCategory(key) ? `<button class="btn-icon" onclick="deleteCategory('${key}')" title="Delete">🗑️</button>` : ''}
            </div>
        </div>
    `).join('');
    
    // Update category count
    document.getElementById('totalCategories').textContent = categoriesArray.length;
}

// Check if category is default (cannot be deleted)
function isDefaultCategory(key) {
    const defaultKeys = ['Entrance', 'Offering', 'Eucharist', 'Mary', 'Worship', 'Christmas', 'HolyWeek', 'Wedding', 'Easter', 'HolySpirit', 'Thanksgiving'];
    return defaultKeys.includes(key);
}

// Add new category
function addNewCategory() {
    const nameEn = document.getElementById('newCategoryNameEn').value.trim();
    const nameMl = document.getElementById('newCategoryNameMl').value.trim();
    const color = document.getElementById('newCategoryColor').value.trim();
    
    if (!nameEn || !nameMl) {
        alert('Please provide both English and Malayalam names');
        return;
    }
    
    // Validate color (basic check)
    if (!color.startsWith('#') || (color.length !== 4 && color.length !== 7)) {
        alert('Please provide a valid color code (e.g., #FF5733)');
        return;
    }
    
    // Check if category already exists
    const categories = getAllCategories();
    if (categories[nameEn]) {
        alert('Category with this English name already exists');
        return;
    }
    
    // Get custom categories from localStorage
    const customCategoriesJson = localStorage.getItem('divinebeats_custom_categories');
    const customCategories = customCategoriesJson ? JSON.parse(customCategoriesJson) : {};
    
    // Add new category
    customCategories[nameEn] = { ml: nameMl, color: color };
    
    // Save to localStorage
    localStorage.setItem('divinebeats_custom_categories', JSON.stringify(customCategories));
    
    // Reload categories list
    loadCategoriesList();
    
    // Clear form
    document.getElementById('newCategoryNameEn').value = '';
    document.getElementById('newCategoryNameMl').value = '';
    document.getElementById('newCategoryColor').value = '#8B4513';
    
    // Update category select options
    updateCategorySelects();
    
    alert('Category added successfully! ✅');
}

// Delete custom category
function deleteCategory(key) {
    if (isDefaultCategory(key)) {
        alert('Cannot delete default categories');
        return;
    }
    
    if (!confirm(`Delete category "${key}"?`)) {
        return;
    }
    
    // Get custom categories
    const customCategoriesJson = localStorage.getItem('divinebeats_custom_categories');
    const customCategories = customCategoriesJson ? JSON.parse(customCategoriesJson) : {};
    
    // Remove category
    delete customCategories[key];
    
    // Save to localStorage
    localStorage.setItem('divinebeats_custom_categories', JSON.stringify(customCategories));
    
    // Reload categories list
    loadCategoriesList();
    
    // Update category select options
    updateCategorySelects();
    
    alert('Category deleted successfully! 🗑️');
}

// Update category select dropdowns in Add/Edit forms
function updateCategorySelects() {
    const categories = getAllCategories();
    const categoriesArray = Object.entries(categories);
    
    // Update Add Song form (only if element exists)
    const addCategorySelect = document.getElementById('songCategory');
    if (addCategorySelect) {
        const currentAddValue = addCategorySelect.value;
        addCategorySelect.innerHTML = categoriesArray.map(([key, data]) => 
            `<option value="${key}">${data.ml} (${key})</option>`
        ).join('');
        if (currentAddValue) addCategorySelect.value = currentAddValue;
    }
    
    // Update Browse tab filter chips (only if element exists)
    const filterChips = document.getElementById('filterChips');
    if (filterChips) {
        filterChips.innerHTML = `
            <button class="filter-chip all-chip ${currentFilter === 'all' ? 'active' : ''}" data-category="all">All</button>
            ${categoriesArray.map(([key]) => 
                `<button class="filter-chip ${key.toLowerCase()}-chip ${currentFilter === key ? 'active' : ''}" data-category="${key}">${getCategoryDisplayName(key)}</button>`
            ).join('')}
        `;
        
        // Re-attach event listeners to filter chips
        filterChips.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                filterChips.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const category = chip.getAttribute('data-category');
                filterByCategory(category);
            });
        });
    }
}

// Update getCategoryDisplayName to use dynamic categories
function getCategoryDisplayName(category) {
    const categories = getAllCategories();
    return categories[category]?.ml || category;
}

// Apply role-based UI restrictions
function applyRoleRestrictions() {
    const role = getUserRole();
    const isUserAdmin = isAdmin();
    
    // Hide Add Song tab for regular users
    const addTabBtn = document.querySelector('.tab-btn[data-tab="add"]');
    if (addTabBtn) {
        addTabBtn.style.display = isUserAdmin ? 'flex' : 'none';
    }
    
    // Hide categories management for regular users
    const categoriesCard = document.getElementById('categoriesCard');
    if (categoriesCard) {
        categoriesCard.style.cursor = isUserAdmin ? 'pointer' : 'default';
        if (!isUserAdmin) {
            categoriesCard.onclick = null;
        }
    }
}

// Display user info in header
function displayUserInfo() {
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl) {
        const displayName = getDisplayName();
        const role = getUserRole();
        userInfoEl.textContent = `Logged in as ${displayName} (${role})`;
    }
}