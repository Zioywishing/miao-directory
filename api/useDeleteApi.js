import { api, staticPath } from "../config.js";
import path from "path";
import useFsOperateEventCenter from "../hooks/useFsOperateEventCenter.js";
import fs from 'fs'

const fsOperateEventCenter = useFsOperateEventCenter()

function deletePath(targetPath) {
    return new Promise((resolve, reject) => {
        fs.stat(targetPath, (err, stats) => {
            if (err) {
                console.log(err)
                return reject(err);
            }

            if (stats.isFile()) {
                fs.rm(targetPath, { recursive: true }, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            } else if (stats.isDirectory()) {
                fs.rm(targetPath, { recursive: true }, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            } else {
                reject('unknow file');
            }
        });
    });
}

export default function useDeleteApi(app) {
	app.post(api.delete, (req, res) => {
		const decodedPath = decodeURIComponent(req.path).substring(api.delete.length - 1);
		const targetPath = path.join(staticPath, decodedPath);
        const eventId = fsOperateEventCenter.push(deletePath(targetPath))
		res.send({ eventId });
	});
}
