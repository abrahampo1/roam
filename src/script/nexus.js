const WebSocketServer = require("ws");
const notifier = require("node-notifier");
const wss = new WebSocketServer.Server({ port: 5242 });
var NexusStart = true;

let Nexus = {};
let NexusAccounts = [];
let NexusSelected = [];
let NexusProcesses = {};
let NexusID = 0;

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
        $(".nexus").removeClass("block");
      }
    });

    let command = JSON.parse(data);

    if (command.Payload) {
      if (NexusProcesses["n" + command.Name]) {
        NexusProcesses["n" + command.Name](
          command.Payload.Content,
          urldata.searchParams.get("id")
        );
        return;
      }

      functionParser(command.Name, command.Payload.Content);
      let p = $(`<p style="margin:0"> </p>`);
      $(p).text(
        `[${urldata.searchParams.get("name")}]>` +
          JSON.stringify(command.Payload.Content)
      );
      $(".nexus .logs").append(p);
      $(".nexus").animate({ scrollTop: 9999 });
    }
  });

  ws.on("close", () => {
    $("#userCard-" + urldata.searchParams.get("id") + " .nexus").fadeOut();
    NexusSelected.forEach((element) => {
      if (urldata.searchParams.get("id") == element.id) {
        $(".nexus").addClass("block");
      }
    });
  });

  if (NexusSelected.length == 0) {
    NexusSelected.push(NexusAccounts[0]);
  }
});

function executeNexus(code, id) {
  return new Promise(function (resolve, reject) {
    code = "local nid = '" + NexusID + "';" + code;
    if (NexusAccounts.length == 0) {
      return;
    }
    if (id) {
      Nexus[id].send("execute " + code);
      NexusProcesses["n" + NexusID] = function (data, id) {
        data = JSON.parse(data);
        data.id = id;
        resolve(data);
      };
    } else if (NexusSelected.length == 0) {
      Nexus[NexusAccounts[0].id].send("execute " + code);
      NexusProcesses["n" + NexusID] = function (data, id) {
        data = JSON.parse(data);
        data.id = id;
        resolve(data);
      };
    } else {
      NexusSelected.forEach((uid) => {
        Nexus[uid.id].send("execute " + code);
        NexusProcesses["n" + NexusID] = function (data, id) {
          data = JSON.parse(data);
          data.id = id;
          resolve(data);
        };
      });
    }
    NexusID++;
  });
}

function functionParser(command, payload) {
  switch (command) {
    case "alert":
      alert(payload);
      break;
    case "execute":
      executeNexus(editor.getValue())
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
          selectedAccount = [];
          selectedAccount.push(accounts[uid]);
        }
        LaunchAccount();
      }, waitTime);
      break;

    case "blockUser":
      var uid = payload.uid;
      var block = payload.block;
      blockUser(JSON.parse(localStorage.getItem("accounts"))[uid], block);
      break;
    default:
      break;
  }
}

function CloseRoblox() {
  exec(`taskkill /F /IM RobloxPlayerBeta.exe`);
}
