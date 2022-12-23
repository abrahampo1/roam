var { ipcRenderer } = require("electron");
window.$ = window.jQuery = require("jquery");
var exec = require("child_process").exec;
const fs = require("fs");
const os = require("os");
const { DownloaderHelper } = require("node-downloader-helper");

const defaultSettings = {
  autoupdate: true,
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

function close_app() {
  ipcRenderer.send("close");
}

function minimize_app() {
  ipcRenderer.send("minimize");
}

function load_page(page) {
  logEvent(analytics, "page_load", { name: page });
  $("#app").load("pages/" + page + ".html");
  $("#app").addClass("fade-in");
  $("#app").on("animationend", () => {
    $("#app").removeClass("fade-in");
  });
}

$(".icon[data-page]").each((i, e) => {
  if ($(e).hasClass("disabled")) {
    return;
  }
  $(e).on("click", (el) => {
    let page = $(e).data("page");
    $(".icon.selected").removeClass("selected");
    $(e).addClass("selected");
    load_page(page);
  });
});

function webGet(url) {
  return new Promise((resolve, reject) => {
    ipcRenderer.send("RobloxRequest", {
      uid: account.UserID,
      cookie: cryptoClient.decrypt(account.cookie),
      url: `https://accountsettings.roblox.com/v1/users/${userid}/unblock`,
      method: "GET",
      cb: "webRequest",
    });
    $.ajax({
      type: "GET",
      url: url,
      success: function (response) {
        resolve(response);
      },
    });
  });
}

function copyText(text, icon) {
  navigator.clipboard.writeText(text);
  $(icon).attr("icon", "material-symbols:check-small-rounded");
  setTimeout(() => {
    $(icon).attr("icon", "material-symbols:content-copy-outline");
  }, 1000);
}

window.onload = async () => {
  log("info", "Roam Loaded");
  logEvent(analytics, 'App Loaded');
  //First Load Account
  if (
    (!localStorage.getItem("useFirebase") ||
      localStorage.getItem("useFirebase") == "true") &&
    !(localStorage.getItem("authMail") && localStorage.getItem("authPass"))
  ) {
    $("#preload .modal").fadeOut();
    $("#modalHolder ").load("modals/login/create.html");
    $("#fakebackground").fadeOut();
  }

  if (
    localStorage.getItem("authMail") &&
    localStorage.getItem("authPass") &&
    localStorage.getItem("useFirebase") == "true"
  ) {
    firebaseLogin(
      localStorage.getItem("authMail"),
      localStorage.getItem("authPass")
    ).then(() => {
      cryptoClient = startCrypto();
      setTimeout(() => {
        $("#preload .modal").fadeOut();
        $("#fakebackground").fadeOut();
      }, 100);
    });
  }

  if (localStorage.getItem("useFirebase") == "false") {
    setTimeout(() => {
      $("#preload .modal").fadeOut();
    }, 200);
    setTimeout(() => {
      $("#fakebackground").fadeOut();
    }, 740);
    cryptoClient = startCrypto();
  }
};

const isRunning = (query, cb) => {
  let platform = process.platform;
  let cmd = "";
  switch (platform) {
    case "win32":
      cmd = `tasklist`;
      break;
    case "darwin":
      cmd = `ps -ax | grep ${query}`;
      break;
    case "linux":
      cmd = `ps -A`;
      break;
    default:
      break;
  }
  exec(cmd, (err, stdout, stderr) => {
    cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
  });
};

ipcRenderer.on("updateIncoming", () => {
  $("#update").fadeIn("fast");
});

function log(type, message) {
  let logs = JSON.parse(localStorage.getItem("logs")) || [];

  logs.push({
    type: type,
    message: message,
    date: Date.now(),
  });

  localStorage.setItem("logs", JSON.stringify(logs));
}
