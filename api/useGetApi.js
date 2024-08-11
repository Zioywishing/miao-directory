import express from "express";
import path from "path";
import fs from "fs";
import { staticPath, api_get } from "../config.js";

export default function useGetApi(app) {
    // 不存在文件与文件夹同名的问题
	app.use(api_get, (req, res, next) => {
		const decodedPath = decodeURIComponent(req.path);
		const directoryPath = path.join(staticPath, decodedPath);
		fs.stat(directoryPath, (err, stats) => {
			if (err) {
				console.log(err, directoryPath);
				// return res.status(500).json({ error: "Unable to access path" });
				return next();
			}

			if (stats.isDirectory()) {
				fs.readdir(directoryPath, (err, files) => {
					if (err) {
						console.log(err, directoryPath);
						return res.status(500).json({ error: "Unable to scan directory" });
					}
					const fileDetails = files.map(file => {
						const filePath = path.join(directoryPath, file);
						const stats = fs.statSync(filePath);
						return {
							name: file,
							size: stats.isDirectory() ? undefined : stats.size,
							type: stats.isDirectory() ? "directory" : "file",
							stats: {
								atimeMs: stats.atimeMs,
								birthtimeMs: stats.birthtimeMs,
								ctimeMs: stats.ctimeMs,
								mtimeMs: stats.mtimeMs
							}
						};
					});
					res.json(fileDetails);
				});
			} else {
				next();
			}
		});
	});

	app.use(api_get, express.static(staticPath));
}
