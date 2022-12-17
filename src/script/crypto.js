var CryptoJS = require("crypto-js");

var CryptoPassword;
var CryptoSetup = localStorage.getItem("CryptoSetup") || false;

function startCrypto() {
  if (!CryptoSetup) {
    $("#modalHolder").load("modals/crypto/setup.html");
  }

  if (!CryptoPassword && CryptoSetup) {
    $("#modalHolder").load("modals/crypto/auth.html");
  }

  let CRYPTO = {};

  CRYPTO.login = function loginCrypto(input) {
    let pass = input.val();

    if (
      CryptoJS.AES.decrypt(CryptoSetup, pass).toString(CryptoJS.enc.Utf8) ==
      "works"
    ) {
      CryptoPassword = pass;
      $("#modalHolder").fadeOut("fast", () => {
        $("#modalHolder").html("");
      });
      $('.sidebar .icon[data-page="home"]').click();
    } else {
      $(input).val("");
      $(input).addClass("shake-horizontal");
      setTimeout(() => {
        $(input).removeClass("shake-horizontal");
      }, 300);
    }
  };

  CRYPTO.crypt = function Crypt(text) {
    if (CryptoPassword) {
      return CryptoJS.AES.encrypt(text, CryptoPassword).toString();
    } else {
      $("#modalHolder").load("modals/crypto/auth.html");
    }
  };

  CRYPTO.decrypt = function Decrypt(text) {
    if (CryptoPassword == null) {
      $("#modalHolder").load("modals/crypto/auth.html");
    } else {
      return CryptoJS.AES.decrypt(text, CryptoPassword).toString(
        CryptoJS.enc.Utf8
      );
    }
  };

  CRYPTO.setupCrypto = function setupCrypto(password) {
    localStorage.setItem(
      "CryptoSetup",
      CryptoJS.AES.encrypt("works", password)
    );
    CryptoPassword = password;
    $("#modalHolder").load("modals/crypto/success.html");
  };

  return CRYPTO;
}
