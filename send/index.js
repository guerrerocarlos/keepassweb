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

  if(document.location.hash) {
    document.getElementById("ciphertext").value = document.location.hash.replace("#", "")
    decrypt()
  }

}

let ciphertext
let readableCiphertext

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

  console.log("ciphertext", typeof ciphertext, ciphertext);

  readableCiphertext = stringify(new Uint8Array(ciphertext), base64Encoding) // btoa(ciphertext.toString()) 
  // await base64Arraybuffer(
  //   new Uint8Array(ciphertext).buffer
  // );

  
  console.log("readableCiphertext", readableCiphertext);
  
  document.getElementById("ciphertext").innerText = readableCiphertext
  document.location.hash = readableCiphertext

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

function base64ToBytesArr2(str) {
  const abc = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"]; // base64 alphabet
  let result = [];

  for(let i=0; i<str.length/4; i++) {
    let chunk = [...str.slice(4*i,4*i+4)]
    let bin = chunk.map(x=> abc.indexOf(x).toString(2).padStart(6,0)).join(''); 
    let bytes = bin.match(/.{1,8}/g).map(x=> +('0b'+x));
    result.push(...bytes.slice(0,3 - (str[4*i+2]=="=") - (str[4*i+3]=="=")));
  }
  return result;
}

const base64Encoding = {
  chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
  bits: 6
}

function stringify(
  data,
  encoding,
  opts = {}
) {
  const { pad = true } = opts
  const mask = (1 << encoding.bits) - 1
  let out = ''

  let bits = 0 // Number of bits currently in the buffer
  let buffer = 0 // Bits waiting to be written out, MSB first
  for (let i = 0; i < data.length; ++i) {
    // Slurp data into the buffer:
    buffer = (buffer << 8) | (0xff & data[i])
    bits += 8

    // Write out as much as we can:
    while (bits > encoding.bits) {
      bits -= encoding.bits
      out += encoding.chars[mask & (buffer >> bits)]
    }
  }

  // Partial character:
  if (bits) {
    out += encoding.chars[mask & (buffer << (encoding.bits - bits))]
  }

  // Add padding characters until we hit a byte boundary:
  if (pad) {
    while ((out.length * encoding.bits) & 7) {
      out += '='
    }
  }

  return out
}

function parse(
  string,
  encoding,
  opts = {}
) {
  // Build the character lookup table:
  if (!encoding.codes) {
    encoding.codes = {}
    for (let i = 0; i < encoding.chars.length; ++i) {
      encoding.codes[encoding.chars[i]] = i
    }
  }

  // The string must have a whole number of bytes:
  // if (!opts.loose && (string.length * encoding.bits) & 7) {
  //   throw new SyntaxError('Invalid padding')
  // }

  // Count the padding bytes:
  let end = string.length
  while (string[end - 1] === '=') {
    --end

    // If we get a whole number of bytes, there is too much padding:
    if (!opts.loose && !(((string.length - end) * encoding.bits) & 7)) {
      throw new SyntaxError('Invalid padding')
    }
  }

  // Allocate the output:
  const out = new (opts.out ?? Uint8Array)(
    ((end * encoding.bits) / 8) | 0
  )

  // Parse the data:
  let bits = 0 // Number of bits currently in the buffer
  let buffer = 0 // Bits waiting to be written out, MSB first
  let written = 0 // Next byte to write
  for (let i = 0; i < end; ++i) {
    // Read one character from the string:
    const value = encoding.codes[string[i]]
    if (value === undefined) {
      throw new SyntaxError('Invalid character ' + string[i])
    }

    // Append the bits to the buffer:
    buffer = (buffer << encoding.bits) | value
    bits += encoding.bits

    // Write out some bits if the buffer has a byte's worth:
    if (bits >= 8) {
      bits -= 8
      out[written++] = 0xff & (buffer >> bits)
    }
  }

  // Verify that we have received just enough bits:
  if (bits >= encoding.bits || 0xff & (buffer << (8 - bits))) {
    throw new SyntaxError('Unexpected end of data')
  }

  return out
}

async function decrypt() {
  if (pair.priv) {

    let cipherPayload = document.getElementById("ciphertext").value

    console.log("cypherPayload1", cipherPayload)
    console.log("cypherPayload2", readableCiphertext)

    // TODO: recover from base64
    ciphertext = parse(cipherPayload, base64Encoding)

    console.log("ciphetext", ciphertext)

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

    document.getElementById("recovered").value = cipherresult;

  }
}

document.getElementById("content").addEventListener("keyup", encrypt)
document.getElementById("ciphertext").addEventListener("change", decrypt)

main()