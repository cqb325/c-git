const electron = require('electron');
const { app, BrowserWindow, Menu, ipcMain, globalShortcut } = electron;
let win;
const Git = require('nodegit');
require('./mainRepo');
global.Git = Git;
global.GitResetDefault = Git.Reset.default;
global.GitResetReset = Git.Reset.reset;

let sender = null;
ipcMain.on('connection', (event) => {
    sender = event.sender;
});

const template = [
    {
        label: 'File',
        submenu: [
            { id: 1, label: 'open'},
            { id: 2, label: 'open recent'},
            { type: 'separator' },
            { id: 3, label: 'welcome',  click () {
                sender.send('menu_welcome');
            }},
            { role: 'quit' }
        ]
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { role: 'toggledevtools' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    {
        role: 'window',
        submenu: [
            { role: 'minimize' },
            { role: 'close' }
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'about',
                click () { }
            }
        ]
    }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

function createWindow () {
    // 创建一个窗口.
    win = new BrowserWindow({
        width: 1500,
        height: 800,
        icon: './src/images/logo.png',
        webPreferences: {
            nodeIntegrationInWorker: true
        }
    });

    // 然后加载应用的 index.html。
    // win.loadURL(url.format({
    //     pathname: path.join(__dirname, './dist/index.html'),
    //     protocol: 'file:',
    //     slashes: true
    // }));

    win.loadURL('http://localhost:3333/index.html');

    win.on('closed', () => {
        // 取消引用 window 对象，如果你的应用支持多窗口的话，
        // 通常会把多个 window 对象存放在一个数组里面，
        // 与此同时，你应该删除相应的元素。
        win = null;
    });

    console.log('start');
}

app.on('ready', createWindow);

app.on('will-quit', () => {
});

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
  
app.on('activate', () => {
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (win === null) {
        createWindow();
    }
});
