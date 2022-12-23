const { app, BrowserWindow, ipcMain } = require("electron");
const { LaunchGame, RobloxRequest } = require("robloxlauncherapi");
const { exec } = require("child_process");
const axios = require("axios");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { DownloaderHelper } = require("node-downloader-helper");
var http = require("http");

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
  mainWindow.setIcon(__dirname + "/res/logo.ico");
  mainWindow.loadURL("http://localhost:9000");

  ipcMain.on("close", () => {
    exec(`taskkill /F /IM multiroblox.exe`);
    mainWindow.close();
  });
  ipcMain.on("minimize", () => {
    mainWindow.minimize();
  });

  return mainWindow;
}

ipcMain.on("AddRobloxAccount", () => {
  let accountWindow = new BrowserWindow({
    height: 900,
    width: 900,
  });

  accountWindow.loadURL("https://www.roblox.com/login");
  accountWindow.setIcon(__dirname + "/res/logo.ico");

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

const formUrlEncoded = (x) =>
  Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, "");

ipcMain.on("BlockRobloxUser", (res, data) => {
  RobloxRequest(
    `https://accountsettings.roblox.com/v1/users/${data.uid}/block`,
    data.cookie,
    "POST"
  );
});

ipcMain.on("RobloxRequest", async (res, data) => {
  let cb = await RobloxRequest(data.url, data.cookie, data.method);
  if (!cb.data) {
    return;
  }
  cb.data["uid"] = data.uid;
  ContentWindow.webContents.send(data.cb, cb.data);
});

ipcMain.on("WebGet", (sender, data) => {
  
});

async function checkUpdate() {
  let g = await axios.get(
    "https://api.github.com/repos/abrahampo1/roam/releases/latest"
  );
  console.log(g.data.tag_name);

  if (app.getVersion() < g.data.tag_name) {
    console.log("App needs an update");
    console.log("Searching for my platform " + os.platform());
    let myPackage = g.data.assets.find(
      (a) => a.name == app.getName() + ".Setup." + os.platform() + ".exe"
    );
    fs.rmSync(process.env.APPDATA + "/roam/" + myPackage.name, {
      recursive: true,
      force: true,
    });
    let dl = new DownloaderHelper(
      myPackage.browser_download_url,
      process.env.APPDATA + "/roam"
    );

    dl.on("end", (data) => {
      exec(data.filePath);
      ContentWindow.webContents.send("updateIncoming");
    });
    dl.start();
  }
}

async function multiRoblox() {
  if (!fs.existsSync(process.env.APPDATA + "/roam")) {
    fs.mkdirSync(process.env.APPDATA + "/roam");
  }

  if (!fs.existsSync(process.env.APPDATA + "/roam/multiroblox.exe")) {
    let dl = new DownloaderHelper(
      "https://github.com/abrahampo1/ROAM/raw/master/multiroblox.exe",
      process.env.APPDATA + "/roam"
    );
    await dl.start();
    dl.on("end", (data) => {
      exec(data.filePath);
    });
    return;
  }
  exec(process.env.APPDATA + "/roam/multiroblox.exe");
}

multiRoblox();

//Tricky way to do that btw
ipcMain.on("getVersion", () => {
  ContentWindow.webContents.send("currentVersion", app.getVersion());
});

const defaultSettings = {
  autoupdate: true,
  branch: "master",
};

function ReadGlobalSettings() {
  if (!fs.existsSync(process.env.APPDATA + "/roam/settings.json")) {
    fs.writeFileSync(
      process.env.APPDATA + "/roam/settings.json",
      JSON.stringify(defaultSettings)
    );
    return defaultSettings;
  } else {
    return JSON.parse(
      fs.readFileSync(process.env.APPDATA + "/roam/settings.json")
    );
  }
}

function WriteGlobalSettings(setting, value) {
  let sett = ReadGlobalSettings();
  sett[setting] = value;
  fs.writeFileSync(
    process.env.APPDATA + "/roam/settings.json",
    JSON.stringify(sett)
  );
}

if (ReadGlobalSettings()["autoupdate"]) {
  checkUpdate();
}

const express = require("express");
const Webapp = express();
const port = 9000;

const apppath = path.join(__dirname, "src");
Webapp.use(express.static(apppath));

app.whenReady().then(() => {
  Webapp.listen(port, () => {
    ContentWindow = createWindow();
  });
});
