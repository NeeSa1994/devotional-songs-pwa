# Devotional Songs - Progressive Web App

A PWA for storing, searching, and managing Christian devotional songs with offline support.

## Features

- ✅ **Add Songs**: Store songs with title, lyrics, author, category, and tags
- 🔍 **Search**: Search songs by title, lyrics, author, or tags
- 📱 **Installable**: Can be installed as an app on any device
- 💾 **Offline Storage**: All data stored locally using IndexedDB
- 📤 **Share**: Share song lyrics with others
- 🗑️ **Delete**: Remove songs you no longer need
- 🌐 **Cross-platform**: Works on Windows, Mac, Android, iOS

## Quick Start

### Option 1: Run Locally (Development)

1. **Install a simple HTTP server:**
```bash
npm install -g http-server
```

2. **Navigate to the project folder:**
```bash
cd C:\Users\vellne01\Documents\MyApps\devotional-songs-pwa
```

3. **Start the server:**
```bash
http-server -p 8080
```

4. **Open in browser:**
```
http://localhost:8080
```

### Option 2: Open Directly (Simple)

Just double-click `index.html` - it will work but some features like Service Worker won't be available.

### Option 3: Use VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"

## Installing on Your Phone

### Android/iOS:

1. Open the app in Chrome (Android) or Safari (iOS)
2. Tap the menu (⋮ or share icon)
3. Select "Add to Home Screen" or "Install App"
4. The app icon will appear on your home screen!

## Technology Stack

- **HTML5**: Structure
- **CSS3**: Styling
- **JavaScript**: Logic
- **IndexedDB**: Local database
- **Service Workers**: Offline support
- **Web App Manifest**: Installability

## Categories

- Worship
- Praise
- Prayer
- Thanksgiving
- Christmas
- Easter
- Sunday School
- Youth
- Other

## Browser Support

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Data Storage

- All data stored locally in your browser using IndexedDB
- No server or internet required after initial load
- Data persists even when offline
- Data is private to your browser

## Development

To modify the app:
1. Edit the files in your code editor
2. Refresh the browser to see changes
3. For Service Worker changes, do a hard refresh (Ctrl+Shift+R)

## License

MIT License - Free to use and modify
