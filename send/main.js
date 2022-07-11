// let pair = {};
// let params = new URLSearchParams(document.location.search);

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
    document.getElementById("description1").innerHTML = "1. Disposable Private Key created and stored in this browser session 🔑</br>2. You are now ready to receive information in a cryptographically secure way"
    document.getElementById("description2").innerHTML = "3. Share the following URL with the person that will send you the information:"
    document.getElementById("description3").innerHTML = "4. Tell that person that your ID is: 🚀⭕️💋👧🏼🔥😢🌎"

    // document.getElementById("description3").innerHTML = "2. <i>Wait</i> and open the url with the secrets."
  } else {
    document.getElementById("secretTextarea").classList.remove("hidden")
  }

  // if (params.get("ciphertext")) {
  //   document.getElementById("ciphertext").value = params.get("ciphertext");
  // }

  console.log("pair", pair);

  if(document.location.hash) {
    console.log("GOT HASH:", document.location.hash)

    let result = await decrypt(document.location.hash.replace("#", ""))

    if(result) {
      document.getElementById("plaintext").value = result
      document.getElementById("plaintext").disabled = true
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

  document.getElementById("plaintext").addEventListener("keyup", async () => {
    let plaintext = document.getElementById("plaintext").value
    let ciphertext = await encrypt(plaintext)
    document.location.hash = ciphertext
    console.log("ENCRIPTED:", ciphertext)
    document.getElementById("shareableUrl").innerText = document.location.href
  })


}

main()