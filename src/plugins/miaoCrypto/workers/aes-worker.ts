import aesJs from 'aes-js'

self.onmessage = async function (event) {
    const data = event.data.data as Uint8Array
    const key = event.data.key as Uint8Array
    var aesCtr = new aesJs.ModeOfOperation.ctr(key, new aesJs.Counter(7058))
    const encryptData = aesCtr.encrypt(data)
    self.postMessage(encryptData)
}
