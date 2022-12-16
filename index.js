const { app, BrowserWindow, ipcMain } = require("electron");
const { LaunchGame } = require("robloxlauncherapi");
const { exec } = require("child_process");
let ContentWindow;

function createWindow() {
  let mainWindow = new BrowserWindow({
    width: 900,
    height: 500,
    resizable: false,
    autoHideMenuBar: true,
    maximizable: false,
    minimizable: false,
    closable: true,
    title: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("src/index.html");

  ipcMain.on("close", () => {
    mainWindow.close();
  });

  return mainWindow;
}

app.whenReady().then(() => {
  ContentWindow = createWindow();
});

ipcMain.on("AddRobloxAccount", () => {
  let accountWindow = new BrowserWindow({
    height: 900,
    width: 900,
  });

  accountWindow.loadURL("https://www.roblox.com/login");

  accountWindow.webContents.session
    .clearStorageData({ storages: ["cookies"] })
    .then(() => {})
    .catch((error) => {
      console.error("Failed to clear cookies: ", error);
    });
  accountWindow.once("ready-to-show", () => {
    accountWindow.on("page-title-updated", (data) => {
      accountWindow.webContents.session.cookies.get({}).then((cookies) => {
        cookies.forEach((cookie) => {
          if (cookie.name == ".ROBLOSECURITY") {
            ContentWindow.webContents.send("RobloxAccountCookie", cookie.value);
            accountWindow.close();
          }
        });
      });
    });
  });
});

ipcMain.on("LaunchGame", (sender, data) => {
  LaunchGame(data.cookie, data.placeId, data.followPlayer)
    .then((r) => {
      ContentWindow.webContents.send("LauncherLink", r);
    })
    .catch((r) => {
      console.log(r);
    });
});
