var { ipcRenderer } = require("electron");
window.$ = window.jQuery = require("jquery");

function close_app() {
  console.log("Closing app!");
  ipcRenderer.send("close");
}

function load_page(page) {
  $("#app").load("pages/" + page + ".html");
}

$(".icon[data-page]").each((i, e) => {
  if ($(e).hasClass("disabled")) {
    return
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
    }, 100);
    cryptoClient = startCrypto();
  }
};
