var { ipcRenderer } = require("electron");
const noblox = require("noblox.js");
var selectedPlaceID;
var selectedAccount;

function AddRobloxAccount() {
  return new Promise((resolve, reject) => {
    ipcRenderer.send("AddRobloxAccount");
    ipcRenderer.on("RobloxAccountCookie", async (sender, data) => {
      let currentUser = await noblox.setCookie(data);

      currentUser.cookie = Crypt(data);

      let saved_users = JSON.parse(localStorage.getItem("accounts")) || {};

      saved_users[currentUser.UserID] = currentUser;

      localStorage.setItem("accounts", JSON.stringify(saved_users));
      LoadAccounts();
    });
  });
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

function LaunchAccount() {
  ipcRenderer.send("LaunchGame", {
    cookie: Decrypt(selectedAccount.cookie),
    placeId: selectedPlaceID,
    followPlayer: $("#followPlayer").val(),
  });

  $(".game #join").fadeIn("fast");
}

ipcRenderer.on("LauncherLink", (sender, link) => {
  let a = document.createElement("a");
  a.href = link;
  document.body.appendChild(a);
  a.click();
  $(".game #join").fadeOut("fast");
});
