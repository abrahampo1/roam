var { ipcRenderer } = require("electron");
const noblox = require("noblox.js");

var selectedPlaceID = localStorage.getItem("PlaceID") || 3016661674;
var selectedAccount = [];

function AddRobloxAccount() {
  return new Promise((resolve, reject) => {
    ipcRenderer.send("AddRobloxAccount");
    ipcRenderer.on("RobloxAccountCookie", async (sender, data) => {
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
  let universeId = await webGet(
    `https://apis.roblox.com/universes/v1/places/${placeID}/universe`
  );

  universeId = universeId.universeId;

  let placeDetails = await webGet(
    `https://games.roblox.com/v1/games?universeIds=${universeId}`
  );

  placeDetails = placeDetails.data[0];

  let thumbnail = await webGet(
    `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=150x150&format=Png&isCircular=false`
  );

  thumbnail = thumbnail.data[0].imageUrl;

  placeDetails.thumbnail = thumbnail;

  $(".gameInfo #gameTitle").text(placeDetails.name);
  $(".gameInfo #gamePlayers").text(placeDetails.playing);
  $(".gameInfo #gameThumbnail").attr("src", placeDetails.thumbnail);

  selectedPlaceID = placeID;
}

async function LaunchAccount() {
  for (key in selectedAccount) {
    let a = selectedAccount[key];
    $(".game #join").fadeIn("fast");
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
      }, 2500);
    });
  });
}

async function robloxBlock(account, blockUserID) {
  let cuser = await noblox.setCookie(cryptoClient.decrypt(account.cookie));
  console.log(`Logged in as ${cuser.UserName} [${cuser.UserID}]`);
  let xcsrf = await noblox.getGeneralToken();
  ipcRenderer.send("BlockRobloxUser", {
    cookie: cryptoClient.decrypt(account.cookie),
    token: xcsrf,
    uid: blockUserID,
  });
}
