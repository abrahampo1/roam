var CryptoJS = require("crypto-js");

var CryptoPassword;
var CryptoSetup = localStorage.getItem("CryptoSetup") || false;

if (!CryptoSetup) {
  $("#modalHolder").load("modals/crypto/setup.html");
}

if (!CryptoPassword && CryptoSetup) {
  $("#modalHolder").load("modals/crypto/auth.html");
}

function loginCrypto(input) {
  let pass = input.val();
  if (
    CryptoJS.AES.decrypt(CryptoSetup, pass).toString(CryptoJS.enc.Utf8) ==
    "works"
  ) {
    CryptoPassword = pass;
    $("#modalHolder").fadeOut("fast", () => {
      $("#modalHolder").html("");
    });
  }
}

function Crypt(text) {
  if (CryptoPassword) {
    return CryptoJS.AES.encrypt(text, CryptoPassword).toString();
  } else {
    $("#modalHolder").load("modals/crypto/auth.html");
  }
}

function Decrypt(text) {
  if (CryptoPassword == null) {
    $("#modalHolder").load("modals/crypto/auth.html");
  } else {
    return CryptoJS.AES.decrypt(text, CryptoPassword).toString(
      CryptoJS.enc.Utf8
    );
  }
}

function setupCrypto(password) {
  localStorage.setItem("CryptoSetup", CryptoJS.AES.encrypt("works", password));
  CryptoPassword = password;
  $("#modalHolder").load("modals/crypto/success.html");
}
