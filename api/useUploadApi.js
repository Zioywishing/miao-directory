import path from "path";
import fs from "fs";
import multer from "multer";
import { api, staticPath } from "../config.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('file');

export default function useUploadApi(app) {
	app.post(api.upload, upload, (req, res) => {
        // 必须这样传，不然中文乱码
        const fileName = req.body.fileName

		const decodedPath = decodeURIComponent(req.path).substring(api.upload.length - 1);
        const savePath = path.join(staticPath, decodedPath, fileName)
        // 覆盖写or追加写
        const operateType = req.body.operateType === 'write' ? 'write' : 'append'
        const data = req.file.buffer
        if (operateType === 'write') {
            // 覆盖写入
            fs.writeFile(savePath, data, (err) => {
                if (err) {
                    return res.status(500).json({ message: 'failed', error: err });
                }
                res.status(200).json({ message: 'success' });
            });
        } else {
            // 追加写入
            fs.appendFile(savePath, data, (err) => {
                if (err) {
                    return res.status(500).json({ message: 'failed', error: err });
                }
                res.status(200).json({ message: 'success' });
            });
        }
	});
}
