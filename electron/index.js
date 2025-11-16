const { app, BrowserWindow, Menu } = require('electron');

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false, // Security best practice
            contextIsolation: true,
        }
    });

    mainWindow.loadFile('index.html'); // Load your main page

    // Create a menu template
    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                { label: 'Open', click: () => console.log('Open clicked') },
                { label: 'Save', click: () => console.log('Save clicked') },
                { type: 'separator' },
                { label: 'Exit', role: 'quit' }
            ]
        },
        {
            label: 'Menu',
            submenu: [
            { label: 'Home', click: () => mainWindow.loadFile('index.html') },
            { label: 'student', click: () => mainWindow.loadFile('student.html') },
            { label: 'faculty', click: () => mainWindow.loadFile('faculty.html') },
             { label: 'main', click: () => mainWindow.loadFile('staff.html') },
                
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { label: 'Undo', role: 'undo' },
                { label: 'Redo', role: 'redo' },
                { type: 'separator' },
                { label: 'Cut', role: 'cut' },
                { label: 'Copy', role: 'copy' },
                { label: 'Paste', role: 'paste' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                { label: 'About', click: () => console.log('About clicked') }
            ]
        }
    ];

    // Set the application menu
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    // Context Menu (Right Click)
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Home', click: () => mainWindow.loadFile('index.html') },
        { label: 'student', click: () => mainWindow.loadFile('student.html') },
        { label: 'faculty', click: () => mainWindow.loadFile('faculty.html') },
        { label: 'main', click: () => mainWindow.loadFile('staff.html') },
      
        { type: 'separator' },
        { label: 'Cut', role: 'cut' },
        { label: 'Copy', role: 'copy' },
        { label: 'Paste', role: 'paste' }
    ]);

    // Show the context menu when right-clicking
    mainWindow.webContents.on('context-menu', (event, params) => {
        contextMenu.popup();
    });

    // macOS-specific behavior: recreate the window when the app is activated
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            mainWindow = new BrowserWindow({
                width: 800,
                height: 600,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                }
            });
            mainWindow.loadFile('Main.html');
        }
    });
});

// Handle closing behavior
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});