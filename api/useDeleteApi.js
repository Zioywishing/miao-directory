import { api, staticPath } from "../config.js";
import path from "path";
import useFsOprateEventCenter from "../hooks/useFsOprateEventCenter.js";
import fs from 'fs'

const fsOprateEventCenter = useFsOprateEventCenter()

function deletePath(targetPath) {
    return new Promise((resolve, reject) => {
        fs.stat(targetPath, (err, stats) => {
            if (err) {
                console.log(err)
                return reject(err); // 如果获取状态失败，返回错误
            }

            if (stats.isFile()) {
                // 如果是文件，直接删除
                fs.unlink(targetPath, (err) => {
                    if (err) return reject(err);
                    resolve(); // 删除成功
                });
                // console.log('delete file')
            } else if (stats.isDirectory()) {
                // 如果是文件夹，递归删除
                fs.rmdir(targetPath, { recursive: true }, (err) => {
                    if (err) return reject(err);
                    resolve(); // 删除成功
                });
                // console.log('delete directory')
            } else {
                // console.log('unknow file')
                // 其他类型（如符号链接等），可以根据需要处理
                reject('unknow file'); // 这里选择不处理其他类型
            }
        });
    });
}

export default function useDeleteApi(app) {
	app.post(api.delete, (req, res) => {
		const decodedPath = decodeURIComponent(req.path).substring(api.delete.length - 1);
		const targetPath = path.join(staticPath, decodedPath);
        const eventId = fsOprateEventCenter.push(deletePath(targetPath))
		res.send({ eventId });
	});
}
