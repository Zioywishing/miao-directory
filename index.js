import express from "express";
import os from "os";
import cors from "cors";
import fs from "fs";
import Config from "./config.js";
import useGetApi from "./api/useGetApi.js";
import useUploadApi from "./api/useUploadApi.js";
import useDeleteApi from "./api/useDeleteApi.js";
import useQueryApi from "./api/useQueryApi.js";
import useRenameApi from "./api/useRenameApi.js";
import useCutApi from "./api/useCutApi.js";

const { staticPath, port, api } = Config;

if (!fs.existsSync(staticPath)) {
	fs.mkdirSync(staticPath);
}

const app = express();
app.use(cors());

useGetApi(app);
useUploadApi(app);
useDeleteApi(app);
useQueryApi(app);
useRenameApi(app);
useCutApi(app);

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
			iface.family === "IPv6" ? console.log(`http://[${iface.address}]:${port}${api.get}`) : console.log(`http://${iface.address}:${port}${api.get}`);
		}
	}
});
