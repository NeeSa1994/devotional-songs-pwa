// Supabase Configuration
const SUPABASE_URL = 'https://tmgrjuvupmnuvqedrcgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ3JqdXZ1cG1udXZxZWRyY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTIxOTYsImV4cCI6MjA4ODI2ODE5Nn0.Bk89aMAaluOjPo6QPR4BrcHo7Zsinmcd3KsGStP3gqI';

// User credentials with roles
const USERS = {
    'admin': { password: 'Admin2026', role: 'admin', displayName: 'Administrator' },
    'user': { password: 'User2026', role: 'user', displayName: 'User' }
};

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('divinebeats_auth') === 'true';
}

// Get user role
function getUserRole() {
    return localStorage.getItem('divinebeats_role') || 'user';
}

// Get username
function getUsername() {
    return localStorage.getItem('divinebeats_username') || '';
}

// Get display name
function getDisplayName() {
    return localStorage.getItem('divinebeats_displayname') || 'User';
}

// Check if user is admin
function isAdmin() {
    return getUserRole() === 'admin';
}

// Set logged in status with role
function setLoggedIn(status, username = '', role = 'user', displayName = 'User') {
    if (status) {
        localStorage.setItem('divinebeats_auth', 'true');
        localStorage.setItem('divinebeats_username', username);
        localStorage.setItem('divinebeats_role', role);
        localStorage.setItem('divinebeats_displayname', displayName);
    } else {
        localStorage.removeItem('divinebeats_auth');
        localStorage.removeItem('divinebeats_username');
        localStorage.removeItem('divinebeats_role');
        localStorage.removeItem('divinebeats_displayname');
    }
}

// Verify username and password, return user data
function verifyCredentials(username, password) {
    const user = USERS[username.toLowerCase()];
    if (user && user.password === password) {
        return { username: username.toLowerCase(), role: user.role, displayName: user.displayName };
    }
    return null;
}
