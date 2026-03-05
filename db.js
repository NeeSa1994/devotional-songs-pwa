// Database operations using Supabase

// Initialize (no-op for Supabase, kept for compatibility)
async function initDB() {
    console.log('Using Supabase database');
    return Promise.resolve();
}

// Add a new song
async function addSong(song) {
    try {
        const songData = {
            title: song.title,
            lyrics: song.lyrics,
            author: song.author || '',
            category: song.category || 'Entrance',
            tags: song.tags || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('songs')
            .insert([songData])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error adding song:', error);
        throw error;
    }
}

// Get all songs
async function getAllSongs() {
    try {
        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Convert Supabase format to app format
        return data.map(song => ({
            id: song.id,
            title: song.title,
            lyrics: song.lyrics,
            author: song.author,
            category: song.category,
            tags: song.tags,
            createdAt: song.created_at,
            updatedAt: song.updated_at
        }));
    } catch (error) {
        console.error('Error getting songs:', error);
        throw error;
    }
}

// Get song by ID
async function getSongById(id) {
    try {
        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        
        return {
            id: data.id,
            title: data.title,
            lyrics: data.lyrics,
            author: data.author,
            category: data.category,
            tags: data.tags,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    } catch (error) {
        console.error('Error getting song:', error);
        throw error;
    }
}

// Search songs
async function searchSongs(searchTerm) {
    try {
        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .or(`title.ilike.%${searchTerm}%,lyrics.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,tags.ilike.%${searchTerm}%`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data.map(song => ({
            id: song.id,
            title: song.title,
            lyrics: song.lyrics,
            author: song.author,
            category: song.category,
            tags: song.tags,
            createdAt: song.created_at,
            updatedAt: song.updated_at
        }));
    } catch (error) {
        console.error('Error searching songs:', error);
        throw error;
    }
}

// Update song
async function updateSong(id, song) {
    try {
        const updateData = {
            title: song.title,
            lyrics: song.lyrics,
            author: song.author || '',
            category: song.category,
            tags: song.tags || '',
            updated_at: new Date().toISOString()
        };

        // Keep created_at if provided
        if (song.createdAt) {
            updateData.created_at = song.createdAt;
        }

        const { data, error } = await supabase
            .from('songs')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error updating song:', error);
        throw error;
    }
}

// Delete song
async function deleteSong(id) {
    try {
        const { error } = await supabase
            .from('songs')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting song:', error);
        throw error;
    }
}
