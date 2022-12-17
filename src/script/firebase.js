const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDoc,
} = require("firebase/firestore");
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  sendPasswordResetEmail,
  browserLocalPersistence,
} = require("firebase/auth");
var cryptoClient;

const firebaseConfig = {
  apiKey: "AIzaSyC76OMroLGyIaQVBqPhCG_YfYqEVezGBg4",
  authDomain: "roam-6dd73.firebaseapp.com",
  projectId: "roam-6dd73",
  storageBucket: "roam-6dd73.appspot.com",
  messagingSenderId: "66052610782",
  appId: "1:66052610782:web:43c90942a051060057404f",
  measurementId: "G-XKGLCSBQ1H",
};
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

function firebaseLogin(email, password) {
  if (!password || !email) {
    return;
  }
  return new Promise((resolve, reject) => {
    setPersistence(auth, browserLocalPersistence).then(() => {
      signInWithEmailAndPassword(auth, email, password)
        .then((uc) => {
          localStorage.setItem("authPass", password);
          localStorage.setItem("authMail", email);
          $("#modalHolder").html("");
          localStorage.setItem("useFirebase", true);
          cryptoClient = startCrypto();
          backupAccounts();

          if (typeof lpage === "function") {
            lpage();
          }

          resolve(true);
        })
        .catch(() => {
          $("#userpass").addClass("shake-horizontal");
          $("#userpass").val("");
        });
    });
  });
}

function backupAccounts() {
  if (localStorage.getItem("CloudSync") == "true") {
    setDoc(doc(db, "/accounts/" + auth.currentUser.uid), {
      backupTime: Date.now(),
      rbxAccounts: JSON.parse(localStorage.getItem("accounts")),
    });
  }
}

function logOutFirebase() {
  localStorage.removeItem("authPass");
  localStorage.removeItem("authMail");
  location.reload();
}

function restorePassword(mail, btn) {
  if (!mail) {
    return;
  }
  $(btn).prop("disabled", true);
  $("#modalHolder").load("modals/login/mailSent.html");
  $("#modalHolder").show();
  localStorage.removeItem("authPass");
  localStorage.removeItem("authMail");
  sendPasswordResetEmail(auth, mail).catch((r) => {});
}

function noUseFirebase() {
  localStorage.setItem("useFirebase", false);
  $("#modalHolder").html("");
  $('.sidebar .icon[data-page="home"]').click();
  cryptoClient = startCrypto();
}

function firebaseCreate(mail, pass, reppass) {
  if (pass != reppass) {
    alert("Passwords must match");
    return;
  }
  createUserWithEmailAndPassword(auth, mail, pass)
    .then((userCredential) => {
      // Signed in
      localStorage.setItem("authPass", pass);
      localStorage.setItem("authMail", mail);
      localStorage.setItem("useFirebase", true);
      location.reload();
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      // ..
    });
}

async function getCloudAccounts() {
  const docSnap = await getDoc(doc(db, "/accounts/" + auth.currentUser.uid));
  const cloudAcc = docSnap.data();
  if (!cloudAcc.rbxAccounts) {
    return;
  }
  Object.entries(cloudAcc.rbxAccounts).forEach(([key, element]) => {
    $("#userCard-" + element.UserID + " .cloud").fadeIn("fast");
  });
}
