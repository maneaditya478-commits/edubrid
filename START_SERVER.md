# How to Start the EduBridge Website

## Quick Start Options

### Option 1: Using Python (if installed)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Option 2: Using Node.js (if installed)
```bash
# Install http-server globally (one time)
npm install -g http-server

# Start server
http-server -p 8000
```

### Option 3: Using VS Code Live Server Extension
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 4: Using PHP (if installed)
```bash
php -S localhost:8000
```

## After Starting Server

1. Open your browser
2. Navigate to: `http://localhost:8000`
3. Open `index.html` from the server
4. Dark mode toggle should work properly

## Notes

- **Why a server is needed**: The website uses localStorage and service workers which work better with HTTP/HTTPS protocol
- **Dark mode** is saved in localStorage and persists across page refreshes
- All pages share the same theme preference


