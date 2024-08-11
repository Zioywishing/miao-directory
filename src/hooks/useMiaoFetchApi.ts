import VirtualDirectory from "@/class/VirtualDirectory";
import { getOption, getResponse, miaoFetchConfig, uploadOption } from "@/types/fetch";
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
	 * 上传单个文件到对应文件夹
	 */
	upload(file: File, targetVDir: VirtualDirectory, option?: uploadOption) {
		const { baseUrl, api } = Config;
		const url = `${baseUrl}${api.upload}${targetVDir.path}`;
		const retry = option?.retry ?? 0;
		const { miaoFetch, abortMiaoFetch } = useMiaoFetch({
			retry
		});
		const sizeTotal = file.size

		const opType = option?.type ?? 'write'

		const data = new FormData()

		data.append('file', file)
		data.append('oprateType', opType)

		return {
			abort: () => abortMiaoFetch(),
			status: new Promise(async (resolve)=>{
				const response = await miaoFetch({
					url,
					method: 'post',
					data: data,
					onUploadProgress(progressEvent) {
						option && option.onProcess && option.onProcess(progressEvent.loaded / sizeTotal)
					},
				})
				resolve(response.data)
			})
		};
	}
};

export default function useMiaoFetchApi() {
	return miaoFetchApi;
}
