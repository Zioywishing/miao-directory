import path from "path";
import fs from "fs";
import multer from "multer";
import { api_upload, staticPath } from "../config.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('file');

export default function useUploadApi(app) {
	app.post(api_upload, upload, (req, res) => {
		const decodedPath = decodeURIComponent(req.path).substring(8);
        const savePath = path.join(staticPath, decodedPath, req.file.originalname)
        // 覆盖写or追加写
        const oprateType = req.body.oprateType === 'write' ? 'write' : 'append'
        const data = req.file.buffer
        if (oprateType === 'write') {
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
