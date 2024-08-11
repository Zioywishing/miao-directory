import express from "express";
import os from "os";
import path from "path";
import cors from "cors";
import fs from "fs";

if (!fs.existsSync("./static")) {
	fs.mkdirSync("./static");
}

const staticPath = path.join("./static");
const port = 17705;

const prev = `/${"get"}`;
const app = express();
app.use(cors());

// 不存在文件与文件夹同名的问题
app.use(prev, (req, res, next) => {
    const decodedPath = decodeURIComponent(req.path);
	const directoryPath = path.join(staticPath, decodedPath);
	fs.stat(directoryPath, (err, stats) => {
		if (err) {
			console.log(err, directoryPath);
			// return res.status(500).json({ error: "Unable to access path" });
            return next()
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

app.use(prev, express.static(staticPath));

app.listen(port, "::", () => {
	const interfaces = os.networkInterfaces();
	console.log(`服务器正在以下地址运行：`);
	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name]) {
			iface.family === "IPv6" ? console.log(`http://[${iface.address}]:${port}`) : console.log(`http://${iface.address}:${port}`);
		}
	}
	console.log(`以下地址访问文件/文件夹：`);
	for (const name of Object.keys(interfaces)) {
		for (const iface of interfaces[name]) {
			iface.family === "IPv6" ? console.log(`http://[${iface.address}]:${port}${prev}`) : console.log(`http://${iface.address}:${port}${prev}`);
		}
	}
});
