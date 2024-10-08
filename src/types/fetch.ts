import { AxiosRequestConfig } from "axios";
import { directory, file } from "./type";

export type miaoFetchConfig = {
    retry?: number
    axiosOption?: AxiosRequestConfig<any>
}

export type getOption = {} & miaoFetchConfig;

export type getFileOption = {
	/**
	 * 下载进度回调函数
	 * @param {any} percent 进度百分比，float类型, 0-1
	 */
	onProcess?: (percent: number) => void;
} & miaoFetchConfig;

export type getResponse = (file | directory)[];

export type uploadOption = {
	/**
	 * 上传进度回调函数
	 * @param {any} percent 进度百分比，float类型, 0-1
	 */
	onProcess?: (percent: number) => void;
	/**
	 * 上传文件执行的操作
	 * write即为覆盖写
	 * append即为增量写
	 */
	type?: "write" | "append";
} & miaoFetchConfig;

export type deleteOption = {} & miaoFetchConfig;
export type renameOption = {} & miaoFetchConfig;
export type cutOption = {} & miaoFetchConfig
export type mkdirOption = {} & miaoFetchConfig
export type queryOption = {} & miaoFetchConfig;
