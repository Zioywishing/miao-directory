
/**
 * 生成一个id，不唯一的几率比因为我代码烂的几率低
 * @param length 生成id的长度
 * @returns {number}
 */
export default function generateId(length) {
	length || (length = 16);
	let id = Math.ceil(Math.random() * 10 ** 16);
    return id
}
