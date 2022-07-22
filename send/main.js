function flushKeys() {
  window.localStorage.clear();
  document.getElementById("flushResults").innerText = "All keys flushed."

  let seconds = 5
  setInterval(() => {
    document.getElementById("flushResults").innerText = `All keys flushed. Restarting in ${seconds} seconds.`
    seconds--
  }, 1000)

  setTimeout(() => {
    document.location.hash = ""
    document.location.search = ""
  }, seconds * 1000)
}

let pair = {};
let params = new URLSearchParams(document.location.search);
console.log("params", params);

async function main() {
  if (!params.get("pub")) {
    pair = await generateKeyPair();
    params.set("pub", pair.pub);
    document.location.search = params.toString();
    localStorage.setItem(pair.pub, pair.priv);
  } else {
    pair.pub = params.get("pub");
    pair.priv = localStorage.getItem(pair.pub);
  }
  

  if(pair.priv) {
    document.getElementById("shareableUrl").href = window.location.href
    document.getElementById("shareableUrl").innerText = window.location.href
  } else {
    document.getElementById("senderUI").classList.remove("hidden")
    document.getElementById("receiverUI").classList.add("hidden")
    document.getElementById("secretTextarea").classList.remove("hidden")
  }

  emojids = document.getElementsByClassName("emoid")
  let hash = await emojiHash(pair.pub, 6)
  for(let i = 0 ; i < emojids.length ; i ++) {
    emojids[i].innerText = hash
  }

  // if (params.get("ciphertext")) {
  //   document.getElementById("ciphertext").value = params.get("ciphertext");
  // }

  console.log("pair", pair);

  if(document.location.hash) {
    console.log("GOT HASH:", document.location.hash)

    let result = await decrypt(document.location.hash.replace("#", ""))

    if(result) {
      document.getElementById("decriptedUI").classList.remove("hidden")
      document.getElementById("receiverUI").classList.add("hidden")

      document.getElementById("decripted").value = result
      document.getElementById("decripted").disabled = true
    } else {
      console.log("Private Key not Found :(")
    }
 
    document.getElementById("secretTextarea").classList.remove("hidden")

  }

  // document.getElementById("priv").innerText = pair.priv;
  // document.getElementById("pub").innerText = pair.pub;
  // document.getElementById("content").innerText = "";

  // if (document.location.hash) {
  //   document.getElementById("ciphertext").value =
  //     document.location.hash.replace("#", "");
  //   // decrypt();
  // }

  // encrypt();

  const encriptNow = async () => {
    let plaintext = document.getElementById("plaintext").value
    let ciphertext = await encrypt(plaintext)
    document.location.hash = ciphertext
    console.log("ENCRIPTED:", ciphertext)
    document.getElementById("shareableUrl").innerText = document.location.href

    shareableUIs = document.getElementsByClassName("shareableUrl")
    for(let i = 0 ; i < shareableUIs.length ; i ++) {
      shareableUIs[i].innerText = document.location.href
    }

  }

  document.getElementById("plaintext").addEventListener("keyup", encriptNow)


}

main()