import VirtualDirectory, { VirtualFile } from "@/class/VirtualDirectory";
import {
	getOption,
	getResponse,
	miaoFetchConfig,
	deleteOption,
	uploadOption,
	queryOption,
	renameOption,
	cutOption,
	mkdirOption,
	getFileOption
} from "@/types/fetch";
import Config from "@/config";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export const useMiaoFetch = (option?: miaoFetchConfig) => {
	const retry = option?.retry ?? 0;
	const controller = new AbortController();
	let flag = true;
	return {
		miaoFetch: async (config: AxiosRequestConfig<any>): Promise<AxiosResponse<any, any>> => {
			let counter = 0;
			let response: any;
			let errList = [];
			while (flag && counter <= retry) {
				try {
					response = await axios({
						...config,
						signal: controller.signal
					});
					return response;
				} catch (_e) {
					errList.push(_e);
					counter += 1;
				}
			}
			throw errList;
		},
		/**
		 * 强制终止miaoFetch
		 */
		abortMiaoFetch: () => {
			flag = false;
			controller.abort();
		}
	};
};

const miaoFetchApi = {
	/**
	 * 获取对应文件夹下的数据
	 */
	async get(vDirectory: VirtualDirectory, option?: getOption): Promise<getResponse> {
		const { baseUrl, api } = Config;
		const url = `${baseUrl}${api.get}${vDirectory.path}`;
		const retry = option?.retry ?? 0;

		const { miaoFetch } = useMiaoFetch({
			retry
		});
		const response = await miaoFetch({
			url
		});
		return response.data;
	},

	/**
	 * 获取对应文件下的数据
	 */
	getFile(vFile: VirtualFile, option?: getFileOption) {
		// const { baseUrl, api } = Config
		const url = vFile.url;
		const retry = option?.retry ?? 0;
		const axiosOption = option?.axiosOption ?? {};

		const { miaoFetch, abortMiaoFetch: abort } = useMiaoFetch({
			retry
		});
		const response = miaoFetch({
			url,
			responseType: "arraybuffer",
			onDownloadProgress(progressEvent) {
				option && option.onProcess && option.onProcess(progressEvent.total ? progressEvent.loaded / progressEvent.total : -1);
			},
			...axiosOption
		});
		return {
			response: new Promise<Uint8Array>(async resolve => {
				resolve(new Uint8Array((await response).data));
			}),
			abort
		};
	},

	/**
	 * 上传单个文件到对应文件夹, 后续要将data类型改成buffer以支持分片上传
	 * 正常上传文件请使用uploadQueue
	 */
	upload(data: File, targetVDir: VirtualDirectory, option?: uploadOption) {
		const { baseUrl, api } = Config;
		const url = `${baseUrl}${api.upload}${targetVDir.path}`;
		const retry = option?.retry ?? 0;
		const { miaoFetch, abortMiaoFetch } = useMiaoFetch({
			retry
		});
		const sizeTotal = data.size;

		const opType = option?.type ?? "write";

		const formData = new FormData();

		formData.append("file", data);
		// 必须这样传，不然中文乱码
		formData.append("fileName", data.name);
		formData.append("operateType", opType);

		return {
			abort: () => abortMiaoFetch(),
			response: new Promise<{
				message: "success" | "failed";
				error?: string;
			}>(async resolve => {
				const response = await miaoFetch({
					url,
					method: "post",
					data: formData,
					onUploadProgress(progressEvent) {
						option && option.onProcess && option.onProcess(progressEvent.loaded / sizeTotal);
					}
				});
				resolve(response.data);
			})
		};
	},

	/**
	 * 在目标文件夹下创建新的文件夹
	 */
	mkdir(targetVDir: VirtualDirectory, newFolderName: string, option?: mkdirOption) {
		const { baseUrl, api } = Config;
		const url = `${baseUrl}${api.mkdir}${targetVDir.path}`;
		const { miaoFetch } = useMiaoFetch({
			retry: option?.retry ?? 0
		});

		return new Promise<{
			message: "success" | "failed";
			error?: string;
		}>(async resolve => {
			const response = await miaoFetch({
				url,
				method: "post",
				data: {
					folderName: newFolderName
				}
			});
			resolve(response.data);
		});
	},
	/**
	 * 在目标文件夹下创建新的空文件，实际上是通过upload空文件实现
	 */
	mkFile(targetVDir: VirtualDirectory, newFileName: string, option?: uploadOption) {
		const emptyBlob = new Blob([]);
		const emptyFile = new File([emptyBlob], newFileName, {
			type: "text/plain"
		});
		return this.upload(emptyFile, targetVDir, option);
	},

	/**
	 * 删除对应的文件或文件夹，若为文件夹会递归删除
	 */
	delete(target: VirtualFile | VirtualDirectory, option?: deleteOption) {
		const { baseUrl, api } = Config;
		const url = `${baseUrl}${api.delete}${target.path}`;
		const retry = option?.retry ?? 0;
		const { miaoFetch } = useMiaoFetch({
			retry
		});

		return {
			response: new Promise<{
				eventId: number;
			}>(async resolve => {
				const response = await miaoFetch({
					url,
					method: "post"
				});
				resolve(response.data);
			})
		};
	},
	/**
	 * 重命名对应的文件或文件夹
	 */
	rename(target: VirtualFile | VirtualDirectory, newName: string, option?: renameOption) {
		const { baseUrl, api } = Config;
		const url = `${baseUrl}${api.rename}${target.path}`;
		const retry = option?.retry ?? 0;
		const { miaoFetch } = useMiaoFetch({
			retry
		});

		return {
			response: new Promise<{
				eventId: number;
			}>(async resolve => {
				const response = await miaoFetch({
					url,
					method: "post",
					data: { newName }
				});
				resolve(response.data);
			})
		};
	},
	/**
	 * 剪切文件或文件夹
	 */
	cut(target: VirtualFile | VirtualDirectory, to: VirtualDirectory, option?: cutOption) {
		const newPath = to.path;
		const { baseUrl, api } = Config;
		const url = `${baseUrl}${api.cut}${target.path}`;
		const retry = option?.retry ?? 0;
		const { miaoFetch } = useMiaoFetch({
			retry
		});
		return {
			response: new Promise<{
				eventId: number;
			}>(async resolve => {
				const response = await miaoFetch({
					url,
					method: "post",
					data: { newPath }
				});
				resolve(response.data);
			})
		};
	},

	/**
	 * 查询服务端操作事件的进展
	 */
	query(eventId: number, option?: queryOption) {
		const { baseUrl, api } = Config;
		const url = `${baseUrl}${api.query}`;
		const retry = option?.retry ?? 0;
		const { miaoFetch } = useMiaoFetch({
			retry
		});
		return {
			response: new Promise<{
				status: "process" | "success" | "failed";
				error?: unknown;
			}>(async resolve => {
				const response = await miaoFetch({
					url,
					method: "get",
					params: {
						id: eventId
					}
				});
				resolve(response.data);
			})
		};
	}
};

export default function useMiaoFetchApi() {
	return miaoFetchApi;
}
