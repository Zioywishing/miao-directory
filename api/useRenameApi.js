import { api, staticPath } from "../config.js";
import path from "path";
import useFsOprateEventCenter from "../hooks/useFsOprateEventCenter.js";
import fs from "fs";
import express from "express";

const fsOprateEventCenter = useFsOprateEventCenter();

function renamePath(targetPath, newName) {
	return new Promise((resolve, reject) => {
		fs.stat(targetPath, (err, stats) => {
			if (err) {
				console.log(err);
				return reject(err);
			}

			const newTargetPath = path.join(path.dirname(targetPath), newName);
			fs.rename(targetPath, newTargetPath, err => {
				if (err) return reject(err);
				resolve();
			});
		});
	});
}

export default function useRenameApi(app) {
	app.post(api.rename, express.json(), (req, res) => {
		const decodedPath = decodeURIComponent(req.path).substring(api.rename.length - 1);
		const targetPath = path.join(staticPath, decodedPath);
		const newName = req.body.newName;
		const eventId = fsOprateEventCenter.push(renamePath(targetPath, newName));
		res.send({ eventId });
	});
}
