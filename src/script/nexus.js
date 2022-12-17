const WebSocketServer = require("ws");
const notifier = require("node-notifier");
const wss = new WebSocketServer.Server({ port: 5242 });
var NexusStart = true;

let Nexus = {};
let NexusAccounts = [];
let NexusSelected = [];

setTimeout(() => {
  NexusStart = false;
}, 5000);

wss.on("connection", (ws, req) => {
  console.log("Client has been connected");

  let urldata = new URL(req.url, "https://roam.com");

  Nexus[urldata.searchParams.get("id")] = ws;
  let find = NexusAccounts.findIndex(
    (elem) => elem.id == urldata.searchParams.get("id")
  );

  if (localStorage.getItem("autoExecuteNexus") == "true" && !NexusStart) {
    setTimeout(() => {
      console.log("AutoExecution triggered");
      ws.send("execute " + localStorage.getItem("luaEditor"));
    }, 2000);
  }

  if (find < 0) {
    NexusAccounts.push({
      name: urldata.searchParams.get("name"),
      id: urldata.searchParams.get("id"),
    });
  }

  ws.on("message", (data) => {
    $("#userCard-" + urldata.searchParams.get("id") + " .nexus").fadeIn();

    NexusSelected.forEach((element) => {
      if (urldata.searchParams.get("id") == element.id) {
        $(".nexusBlock").fadeOut("fast");
      }
    });

    let command = JSON.parse(data);

    if (command.Payload) {
      functionParser(command.Name, command.Payload.Content);
      $(".nexus .logs").append(
        `<p style="margin:0">[${urldata.searchParams.get(
          "name"
        )}]> ${JSON.stringify(command.Payload.Content)}</p>`
      );
      $(".nexus").animate({ scrollTop: 9999 });
    }
  });

  ws.on("close", () => {
    $("#userCard-" + urldata.searchParams.get("id") + " .nexus").fadeOut();
    NexusSelected.forEach((element) => {
      if (urldata.searchParams.get("id") == element.id) {
        $(".nexusBlock").fadeIn();
      }
    });
  });

  if (NexusSelected.length == 0) {
    NexusSelected.push(NexusAccounts[0]);
  }
});

function executeNexus(code) {
  if (NexusAccounts.length == 0) {
    return;
  }
  if (NexusSelected.length == 0) {
    Nexus[NexusAccounts[0].id].send("execute " + code);
  } else {
    NexusSelected.forEach((uid) => {
      Nexus[uid.id].send("execute " + code);
    });
  }
}

function functionParser(command, payload) {
  console.log(command, payload);
  switch (command) {
    case "alert":
      alert(payload);
      break;
    case "notify":
      notifier.notify({
        title: "Nexus",
        message: payload,
        appID: "RoAM",
      });
      break;
    case "close":
      CloseRoblox();
      break;
    case "rejoin":
      CloseRoblox();
      var uid = payload.uid;
      var waitTime = payload.wait;
      setTimeout(() => {
        let accounts = JSON.parse(localStorage.getItem("accounts")) || {};
        if (accounts[uid]) {
          selectedAccount = accounts[uid];
        }
        LaunchAccount();
      }, waitTime);
      break;

    case "blockUser":
      var uid = payload.uid;
      var block = payload.block;
      robloxBlock(JSON.parse(localStorage.getItem("accounts"))[uid], block);
      break;
    default:
      break;
  }
}

function CloseRoblox() {
  exec(`taskkill /F /IM RobloxPlayerBeta.exe`);
}
