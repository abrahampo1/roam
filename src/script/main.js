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
