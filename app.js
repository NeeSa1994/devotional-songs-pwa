// App State
let selectedCategory = 'Entrance';
let currentSearchTerm = '';
let editingSongId = null; // Track if we're editing a song
let currentFilter = 'all'; // Track current category filter

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    setupEventListeners();
    loadDashboard();
});

// Setup event listeners
function setupEventListeners() {
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
        const songs = await getAllSongs();
        
        // Update total songs count
        document.getElementById('totalSongs').textContent = songs.length;
        
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
    }
}

// Category selection
function selectCategory(chip) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    selectedCategory = chip.dataset.category;
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

// Map English category names to Malayalam
function getCategoryDisplayName(category) {
    const categoryMap = {
        'Entrance': 'പ്രവേശനം',
        'Offering': 'കാഴ്ചവയ്പ്പ്',
        'Eucharist': 'ദിവ്യകാരുണ്യം',
        'Mary': 'മാതാവ്',
        'Worship': 'ആരാധന',
        'Christmas': 'ക്രിസ്തുമസ്',
        'HolyWeek': 'വിശുദ്ധവാരം',
        'Wedding': 'വിവാഹം',
        'Easter': 'ഈസ്റ്റർ',
        'HolySpirit': 'പരിശുദ്ധാത്മാവ്',
        'Thanksgiving': 'നന്ദി / സ്തുതി'
    };
    return categoryMap[category] || category;
}

// Create song card HTML
function createSongCard(song) {
    return `
        <div class="song-card" data-id="${song.id}">
            <div class="song-card-header">
                <div>
                    <div class="song-title">${escapeHtml(song.title)}</div>
                    ${song.author ? `<div class="song-author">By ${escapeHtml(song.author)}</div>` : ''}
                    ${song.category ? `<span class="category-badge">${escapeHtml(getCategoryDisplayName(song.category))}</span>` : ''}
                </div>
                <button class="delete-btn" data-id="${song.id}" title="Delete">🗑️</button>
            </div>
            <div class="song-preview">${escapeHtml(song.lyrics)}</div>
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
    
    if (editingSongId) {
        formTitle.textContent = '✏️ Edit Song';
        submitBtn.innerHTML = '💾 Update Song';
    } else {
        formTitle.textContent = '➕ Add New Song';
        submitBtn.innerHTML = '💾 Save Song';
    }
}

// Clear form
function clearForm() {
    document.getElementById('addSongForm').reset();
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    document.querySelector('[data-category="Entrance"]').classList.add('selected');
    selectedCategory = 'Entrance';
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
