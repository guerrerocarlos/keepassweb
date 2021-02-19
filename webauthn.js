
const randomStringFromServer = "youmnowwhatthisis109210921"

function bufferToString(buf) {
  return String.fromCharCode(...new Uint8Array(buf));
  // return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function stringToUint8Array(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
}


async function login(credentialId) {

  const publicKeyCredentialRequestOptions = {
    challenge: Uint8Array.from(
      randomStringFromServer, c => c.charCodeAt(0)),
    allowCredentials: [{
      id: credentialId,
      // Uint8Array.from(
      //   loginParams.credentialId, c => c.charCodeAt(0)),
      type: 'public-key',
      transports: ['usb', 'ble', 'nfc'],
    }],
    userVerification: "discouraged",
    timeout: 60000,
  }

  const credential = await navigator.credentials.get({
    publicKey: publicKeyCredentialRequestOptions
  })

  return credential
}

async function register() {

  if (localStorage.getItem('yubikeyCredentialId')) {
    return localStorage.getItem('yubikeyCredentialId')
  }

  const publicKeyCredentialCreationOptions = {
    challenge: Uint8Array.from(
      randomStringFromServer, c => c.charCodeAt(0)),
    rp: {
      name: "KeePassWeb",
      id: location.host,
    },
    user: {
      id: Uint8Array.from(
        "UZSL85T9AFC", c => c.charCodeAt(0)),
      name: "lee@webauthn.guide",
      displayName: "Lee",
    },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    authenticatorSelection: {
      // authenticatorAttachment: "cross-platform",
      userVerification: "discouraged",
    },
    timeout: 60000,
    attestation: "none"
  };

  const credential = await navigator.credentials.create({
    publicKey: publicKeyCredentialCreationOptions
  })

  console.log('id', credential.id)
  console.log({ credential })

  const utf8Decoder = new TextDecoder('utf-8');
  const decodedClientData = utf8Decoder.decode(
    credential.response.clientDataJSON)

  // parse the string as an object
  const clientDataObj = JSON.parse(decodedClientData);

  console.log({ clientDataObj })

  const decodedAttestationObj = CBOR.decode(
    credential.response.attestationObject);

  console.log({ decodedAttestationObj });

  const { authData } = decodedAttestationObj;

  // get the length of the credential ID
  const dataView = new DataView(
    new ArrayBuffer(2));
  const idLenBytes = authData.slice(53, 55);
  idLenBytes.forEach(
    (value, index) => dataView.setUint8(
      index, value));
  const credentialIdLength = dataView.getUint16();

  // get the credential ID
  const credentialId = authData.slice(
    55, 55 + credentialIdLength);

  // get the public key object
  const publicKeyBytes = authData.slice(
    55 + credentialIdLength);

  // the publicKeyBytes are encoded again as CBOR
  const publicKeyObject = CBOR.decode(
    publicKeyBytes.buffer);
  console.log({ publicKeyObject })
  console.log({ credentialId })

  console.log('CREDENTIAL ID:', bufferToString(credentialId))
  console.log("encoded>", encodeURI(bufferToString(credentialId)))


  // document.getElementById("credentialId").value = encodeURI(bufferToString(credentialId))
  console.log(credentialId.toString())

  return credentialId
}

window.register = register
window.login = login


  // .then((finalResult) => {
  //   console.log({ finalResult })

  //   const utf8Decoder = new TextDecoder('utf-8');
  //   const decodedClientData = utf8Decoder.decode(
  //     finalResult.credential.response.clientDataJSON)

  //   // parse the string as an object
  //   const clientDataObj = JSON.parse(decodedClientData);

  //   console.log({ clientDataObj })

  // })

    // login({
    //   savedCredentialId: ```vþþÂLu´>¹q%ýpÙ=Cá+Óò}úý¦ðn.Å=ü¶ÆädrúC­w ÛêÜ(êCµ´Èº\nJ```
    // })


    // TODO use finalResult.credential.id as the cipher from the Yubikey 
    // And define the challenge as the initial user password 
