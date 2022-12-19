const { ModuleWalker } = require("@electron/rebuild/lib/src/module-walker");
var { ipcRenderer } = require("electron");
window.$ = window.jQuery = require("jquery");
var exec = require("child_process").exec;

function close_app() {
  ipcRenderer.send("close");
}

function minimize_app() {
  ipcRenderer.send("minimize");
}

function load_page(page) {
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
  //First Load Account
  if (
    (!localStorage.getItem("useFirebase") ||
      localStorage.getItem("useFirebase") == "true") &&
    !(localStorage.getItem("authMail") && localStorage.getItem("authPass"))
  ) {
    $("#preload .modal").fadeOut();
    $("#modalHolder ").load("modals/login/auth.html");
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
      setTimeout(() => {
        $("#preload .modal").fadeOut();
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

isRunning("multiroblox.exe", (status) => {
  if (!status) {
    exec(
      process.env.APPDATA + "/roam/multiroblox.exe",
      (error, stdout, stderr) => {
        if (error) {
          alert("MULTIROBLOX ERROR, REPORT ON DISCORD: " + error);
        }
      }
    );
  }
});

ipcRenderer.on("updateIncoming", () => {
  $("#update").fadeIn("fast");
});
