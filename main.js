const electron = require('electron');
const Configstore = require('configstore');
const url = require('url');
const path = require('path');
const Git = require('nodegit');
const { app, BrowserWindow, Menu, ipcMain, globalShortcut } = electron;
let win;
require('./mainRepo');
global.Git = Git;
global.GitResetDefault = Git.Reset.default;
global.GitResetReset = Git.Reset.reset;

let sender = null;
ipcMain.on('connection', (event) => {
    sender = event.sender;
});

ipcMain.on('update_menu', () => {
    createMenu();
});

ipcMain.on('win-minimize', () => {
    if (win) {
        win.minimize();
    }
});

ipcMain.on('win-maximize', () => {
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
});

ipcMain.on('win-close', () => {
    if (win) {
        win.close();
    }
});

const store = new Configstore('c-git');

function createMenu () {
    const items = [];
    let index = 1;
    for (const name in store.all) {
        const item = store.all[name];
        if (index > 5) {
            break;
        }
        items.push({
            id: `2${index}`,
            lastOpenTime: item.lastOpenTime,
            label: item.dir,
            click: openRepo.bind(this, item)
        });
        index ++;
    }
    
    function openRepo (item) {
        sender.send('open_repo', item);
    }
    
    items.sort((a, b) => {
        if (a.lastOpenTime === undefined) {
            return 1;
        }
        if (b.lastOpenTime === undefined) {
            return -1;
        }
        if (a.lastOpenTime > b.lastOpenTime) {
            return -1;
        }
        if (a.lastOpenTime <= b.lastOpenTime) {
            return 1;
        }
    });
    
    const template = [
        {
            label: 'File',
            submenu: [
                { id: 1, label: 'open', click () {
                    sender.send('menu_open');
                }},
                { id: 4, label: 'create', click () {
                    sender.send('menu_create');
                }},
                { id: 5, label: 'clone', click () {
                    sender.send('menu_clone');
                }},
                { id: 2, label: 'open recent', submenu: items},
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
                    click () { sender.send('menu_about'); }
                }
            ]
        }
    ];
    
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

createMenu();

function createWindow () {
    // 创建一个窗口.
    win = new BrowserWindow({
        width: 1500,
        height: 800,
        icon: './src/images/logo.ico',
        webPreferences: {
            nodeIntegrationInWorker: true
        },
        frame: false,
        backgroundColor: '#333'
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
