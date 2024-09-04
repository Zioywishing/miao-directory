import aesJs from 'aes-js'
import aes_worker from '../workers/aes-worker?worker'

/**
 * 使用worker进行aes加密
 * @param {any} key:string 须保证长度正确
 * @param {any} data:Uint8Array
 * @returns {Uint8Array}
 */
export default (key: string, data: Uint8Array) => {
    const key_u8i = aesJs.utils.utf8.toBytes(key)
    return new Promise<Uint8Array>((resolve) => {
        const aesWorker = new aes_worker()
        aesWorker.onmessage = (event) => {
            resolve(event.data)
        }
        aesWorker.postMessage({ data, key: key_u8i })
    })
}
