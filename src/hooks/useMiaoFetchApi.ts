import VirtualDirectory, { VirtualFile } from "@/class/VirtualDirectory";
import { getOption, getResponse, miaoFetchConfig, deleteOption, uploadOption, queryOption } from "@/types/fetch";
import Config from "@/config";
import axios, { AxiosRequestConfig } from "axios";

export const useMiaoFetch = (option?: miaoFetchConfig) => {
	const retry = option?.retry ?? 0;
	const controller = new AbortController();
	let flag = true;
	return {
		miaoFetch: async (config: AxiosRequestConfig<any>) => {
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
	 * 上传单个文件到对应文件夹, 后续要将data类型改成buffer以支持分片上传
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
		formData.append("fileName", data.name)
		formData.append("oprateType", opType);

		return {
			abort: () => abortMiaoFetch(),
			response: new Promise<{
				message: 'success' | 'failed'
				error?: string
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
				eventId: number
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
				status: 'process' | 'success' | 'failed',
				error?: unknown
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
