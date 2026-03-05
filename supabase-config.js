// Supabase Configuration
const SUPABASE_URL = 'https://tmgrjuvupmnuvqedrcgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtZ3JqdXZ1cG1udXZxZWRyY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2OTIxOTYsImV4cCI6MjA4ODI2ODE5Nn0.Bk89aMAaluOjPo6QPR4BrcHo7Zsinmcd3KsGStP3gqI';

// Passcode for choir team access
const APP_PASSCODE = 'Choir2026'; // Change this to your preferred passcode

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('divinebeats_auth') === 'true';
}

// Set logged in status
function setLoggedIn(status) {
    if (status) {
        localStorage.setItem('divinebeats_auth', 'true');
    } else {
        localStorage.removeItem('divinebeats_auth');
    }
}

// Verify passcode
function verifyPasscode(inputPasscode) {
    return inputPasscode === APP_PASSCODE;
}
