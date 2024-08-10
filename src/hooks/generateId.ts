const idList: number[] = [];

/**
 * 生成一个唯一的id
 * @param {any} length 生成id的长度
 * @returns {number}
 */
export default function generateId(length?: number) {
	length || (length = 16);
	let id;
	while (!id || idList.includes(id)) {
		id = Math.ceil(Math.random() * 10 ** 16);
	}
	idList.push(id)
    return id
}
