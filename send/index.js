function base64ToArrayBuffer(b64) {
  console.log("base64ToArrayBuffer>>", b64);

  var byteString = atob(b64);
  var byteArray = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }

  return byteArray;
}

function _base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

const base64Arraybuffer = async (data) => {
  const base64url = await new Promise((r) => {
    const reader = new FileReader();
    reader.onload = () => r(reader.result);
    reader.readAsDataURL(new Blob([data]));
  });
  return base64url.split(",", 2)[1];
};

function pemToArrayBufferPublic(pem) {
  var b64Lines = removeLines(pem);
  var b64Prefix = b64Lines.replace("-----BEGIN PUBLIC KEY-----", "");
  var b64Final = b64Prefix.replace("-----END PUBLIC KEY-----", "");

  return base64ToArrayBuffer(b64Final);
}
function pemToArrayBufferPrivate(pem) {
  var b64Lines = removeLines(pem);
  var b64Prefix = b64Lines.replace("-----BEGIN RSA PRIVATE KEY-----", "");
  var b64Final = b64Prefix.replace("-----END RSA PRIVATE KEY-----", "");

  return base64ToArrayBuffer(b64Final);
}

function arrayBufferToString(str) {
  var byteArray = new Uint8Array(str);
  var byteString = "";
  for (var i = 0; i < byteArray.byteLength; i++) {
    byteString += String.fromCodePoint(byteArray[i]);
  }
  return byteString;
}

function removeLines(str) {
  return str.replace("\n", "");
}

let pair = {};

async function main() {
  let params = new URLSearchParams(document.location.search);
  console.log("params", params);

  if (!params.get("pub")) {
    pair = await generateKeyPair();
    params.set("pub", pair.pub);
    document.location.search = params.toString();
    localStorage.setItem(pair.pub, pair.priv);
  } else {
    pair.pub = params.get("pub");
    pair.priv = localStorage.getItem(pair.pub);
  }

  console.log("pair", pair);

  document.getElementById("priv").innerText = pair.priv;
  document.getElementById("pub").innerText = pair.pub;
  document.getElementById("content").innerText = "Hello World";

}

let ciphertext

async function encrypt() {

  let importedPubKey = await window.crypto.subtle.importKey(
    "spki",
    pemToArrayBufferPublic(pair.pub),
    {
      name: "RSA-OAEP",
      hash: { name: "SHA-256" },
    },
    false,
    ["encrypt"]
  );

  console.log(importedPubKey);

  const encoder = new TextEncoder();
  ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    importedPubKey, //from generateKey or importKey above
    encoder.encode(document.getElementById("content").value) //ArrayBuffer of data you want to sign
  );

  console.log("END");

  console.log("ciphertext", ciphertext);

  let readableCiphertext = await base64Arraybuffer(
    new Uint8Array(ciphertext).buffer
  );

  console.log("readableCiphertext", readableCiphertext);

  document.getElementById("ciphertext").innerText = readableCiphertext;

  // if (!params.get("ciphertext")) {
  //   params.set("ciphertext", readableCiphertext);
  //   console.log("readableCiphertext to search:", params.toString());
  //   let params2 = new URLSearchParams(params.toString());
  //   console.log("readableCiphertext2", params2.get("ciphertext"));
  // }
}

function buf2hex(buffer) {
  // buffer is an ArrayBuffer
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
    .join("");
}

async function decrypt() {
  if (pair.priv) {

    let cipherPayload = document.getElementById("ciphertext").innerText

    console.log("cypherPayload", cipherPayload)

    let ciphetext = btoa(cipherPayload)

    console.log("ciphetext", ciphetext)

    let importedPrivKey = await window.crypto.subtle.importKey(
      "pkcs8",
      pemToArrayBufferPrivate(pair.priv),
      {
        name: "RSA-OAEP",
        hash: { name: "SHA-256" },
      },
      false,
      ["decrypt"]
    );

    let recovered = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      importedPrivKey, //from generateKey or importKey above
      ciphertext //ArrayBuffer of data you want to sign
    );

    console.log("recovered", recovered);

    let cipherresult = String.fromCharCode(...new Uint8Array(recovered));

    document.getElementById("recovered").innerText = cipherresult;
  }
}

document.getElementById("content").addEventListener("keyup", encrypt)
document.getElementById("ciphertext").addEventListener("change", decrypt)

main().then(encrypt).then(decrypt)
