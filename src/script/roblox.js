var { ipcRenderer } = require("electron");
const noblox = require("noblox.js");

var selectedPlaceID = localStorage.getItem("PlaceID") || 3016661674;
var selectedAccount = [];

function AddRobloxAccount() {
  return new Promise((resolve, reject) => {
    ipcRenderer.send("AddRobloxAccount");
    ipcRenderer.on("RobloxAccountCookie", async (sender, data) => {
      logEvent(analytics, "account_added");

      addRobloxAccountWithCookie(data);
    });
  });
}

async function addRobloxAccountWithCookie(cookie, alias = "") {
  let currentUser = await noblox.setCookie(cookie);
  currentUser.cookie = cryptoClient.crypt(cookie);

  let saved_users = JSON.parse(localStorage.getItem("accounts")) || {};

  currentUser.showUserName = true;
  currentUser.Alias = alias;
  saved_users[currentUser.UserID] = currentUser;

  localStorage.setItem("accounts", JSON.stringify(saved_users));
  LoadAccounts();
}

async function LoadPlaceDetails(placeID) {
  if (!placeID) {
    return;
  }

  let universeId = await webGet(
    `https://apis.roblox.com/universes/v1/places/${placeID}/universe`
  );

  universeId = universeId.universeId;

  if (!universeId) {
    return;
  }

  let placeDetails = await webGet(
    `https://games.roblox.com/v1/games?universeIds=${universeId}`
  );

  placeDetails = placeDetails.data[0];

  let thumbnail = await webGet(
    `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=150x150&format=Png&isCircular=false`
  );

  thumbnail = thumbnail.data[0].imageUrl;

  placeDetails.thumbnail = thumbnail;

  log("network", "Loaded Place Details (" + placeID + ")");
  $(".gameInfo #gameTitle").text(placeDetails.name);
  $(".gameInfo #gamePlayers").text(placeDetails.playing);
  $(".gameInfo #gameThumbnail").attr("src", placeDetails.thumbnail);

  selectedPlaceID = placeID;
}

async function LaunchAccount() {
  for (key in selectedAccount) {
    let a = selectedAccount[key];
    $(".game #join").fadeIn("fast");
    log("launch", a.UserName + " has been launched to " + selectedPlaceID);
    logEvent(analytics, "game_launch", { placeId: selectedPlaceID });

    await LaunchPlayer(
      cryptoClient.decrypt(a.cookie),
      selectedPlaceID,
      $("#followPlayer").val()
    );
  }
  $(".game #join").fadeOut("fast");
}

function LaunchPlayer(cookie, placeID, follow) {
  return new Promise((resolve, reject) => {
    ipcRenderer.send("LaunchGame", {
      cookie: cookie,
      placeId: placeID,
      followPlayer: follow,
    });
    ipcRenderer.on("LauncherLink", (sender, link) => {
      let a = document.createElement("a");
      a.href = link;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        resolve(link);
      }, localStorage.getItem("launcherDelay") || 2000);
    });
  });
}

async function blockUser(account, blockUserID) {
  logEvent(analytics, "Block User");

  let cuser = await noblox.setCookie(cryptoClient.decrypt(account.cookie));
  let b = await getBlockedUsers(account);
  if (b.total == 100) {
    log("network", "Max blocked users reached, unblocking the first");
    await unblockUser(account, b.blockedUsers[0].userId);
  }
  console.log(`Logged in as ${cuser.UserName} [${cuser.UserID}]`);
  let xcsrf = await noblox.getGeneralToken();
  ipcRenderer.send("BlockRobloxUser", {
    cookie: cryptoClient.decrypt(account.cookie),
    token: xcsrf,
    uid: blockUserID,
  });
}

function getBlockedUsers(account) {
  return new Promise((resolve, reject) => {
    ipcRenderer.send("RobloxRequest", {
      uid: account.UserID,
      cookie: cryptoClient.decrypt(account.cookie),
      url: "https://accountsettings.roblox.com/v1/users/get-detailed-blocked-users",
      method: "GET",
      cb: "BlockedUsersResult",
    });

    ipcRenderer.once("BlockedUsersResult", (_, response) => {
      resolve(response);
    });
  });
}

function unblockUser(account, userid) {
  logEvent(analytics, "Unblock User");
  return new Promise((resolve, reject) => {
    ipcRenderer.send("RobloxRequest", {
      uid: account.UserID,
      cookie: cryptoClient.decrypt(account.cookie),
      url: `https://accountsettings.roblox.com/v1/users/${userid}/unblock`,
      method: "POST",
      cb: "userHasBeenUnblocked",
    });

    ipcRenderer.once("userHasBeenUnblocked", (_, response) => {
      resolve(response);
    });
  });
}

async function checkRobloxVerified() {
  let saved_users = JSON.parse(localStorage.getItem("accounts")) || {};
  Object.entries(saved_users).forEach(([key, r]) => {
    if (!r.cookie) {
      return;
    }

    if (!cryptoClient) {
      return;
    }
    ipcRenderer.send("RobloxRequest", {
      url: "https://accountsettings.roblox.com/v1/email",
      cookie: cryptoClient.decrypt(r.cookie),
      method: "GET",
      cb: "2FAResult",
      uid: r.UserID,
    });
  });

  ipcRenderer.on("2FAResult", (s, data) => {
    if (!data.verified) {
      return;
    }
    $("#userCard-" + data.uid + " .mail").fadeIn("fast");
    $("#userCard-" + data.uid + " .mail").attr("title", data.emailAddress);
  });
}
localStorage.setItem("autorelaunch", "false");
setInterval(async () => {
  if (localStorage.getItem("autorelaunch") == "true") {
    console.log("Trggering auto relaunch");
    await exec("taskkill /F /IM RobloxPlayerBeta.exe");
    setTimeout(async () => {
      if (localStorage.getItem("autorelaunch") == "false") {
        return;
      }
      let saved_users = JSON.parse(localStorage.getItem("accounts")) || {};

      for (key in Object.values(saved_users)) {
        let a = Object.values(saved_users)[key];
        $(".game #join").fadeIn("fast");
        if (a.relaunch) {
          console.log("launching: " + a.UserName);
          await LaunchPlayer(
            cryptoClient.decrypt(a.cookie),
            selectedPlaceID,
            $("#followPlayer").val()
          );
        }
      }
      $(".game #join").fadeOut("fast");
    }, localStorage.getItem("launcherDelay") || 2000);
  }
}, parseInt(localStorage.getItem("autolauncherDelay")) || 120000 + parseInt(localStorage.getItem("launcherDelay")) || 2000);
