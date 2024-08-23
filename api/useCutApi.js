import { api, staticPath } from "../config.js";
import path from "path";
import useFsOperateEventCenter from "../hooks/useFsOperateEventCenter.js";
import fs from "fs";
import express from "express";

const fsOperateEventCenter = useFsOperateEventCenter();

function cutPath(targetPath, newPath) {
	return new Promise((resolve, reject) => {
		fs.stat(targetPath, (err, stats) => {
			if (err) {
				console.log(err);
				return reject(err);
			}

			fs.rename(targetPath, newPath, err => {
				if (err) return reject(err);
				resolve();
			});
		});
	});
}

export default function useCutApi(app) {
	app.post(api.cut, express.json(), (req, res) => {
		const decodedPath = decodeURIComponent(req.path).substring(api.cut.length - 1);
		const targetPath = path.join(staticPath, decodedPath);
		const newPath = path.join(staticPath, req.body.newPath, path.basename(targetPath));
		const eventId = fsOperateEventCenter.push(cutPath(targetPath, newPath));
		res.send({ eventId });
	});
}
