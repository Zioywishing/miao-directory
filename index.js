import express from "express";
import os from "os";
import cors from "cors";
import fs from "fs";
import useGetApi from "./api/useGetApi.js";
import Config from "./config.js";
import useUploadApi from "./api/useUploadApi.js";


const { staticPath, port, api_get } = Config;

if (!fs.existsSync(staticPath)) {
	fs.mkdirSync(staticPath);
}


const app = express();
app.use(cors());

useGetApi(app);
useUploadApi(app);

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
			iface.family === "IPv6" ? console.log(`http://[${iface.address}]:${port}${api_get}`) : console.log(`http://${iface.address}:${port}${api_get}`);
		}
	}
});
