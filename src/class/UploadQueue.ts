import generateId from "@/hooks/generateId";
import useMiaoFetchApi from "@/hooks/useMiaoFetchApi";
import VirtualDirectory from "./VirtualDirectory";

const miaoFetchApi = useMiaoFetchApi();

export class UploadQueueItem {
	constructor(
		file: File,
		targetDirectory: VirtualDirectory,
		config?: {
			onSuccess?: () => void;
			onFailed?: () => void;
		}
	) {
		this.file = file;
		this.targetDirectory = targetDirectory;
		this.uid = generateId();
		this.status = "waiting";
		this.process = 0;
		this.onSuccess = config && config.onSuccess;
		this.onFailed = config && config.onFailed;
	}
	uid: number;
	file: File;
	targetDirectory: VirtualDirectory;
	status: "waiting" | "uploading" | "success" | "failed";
	process: number;
	failedReason: unknown | undefined;

	onSuccess?: () => void;
	onFailed?: () => void;

	_abort: (() => void | undefined) | undefined;
	_status: Promise<any> | undefined;

	/**
	 * 开始上传文件
	 */
	startUpload() {
		if (this.status === "uploading") {
			return;
		}
		const { abort, status } = miaoFetchApi.upload(this.file, this.targetDirectory, {
			onProcess: percent => {
				this.process = percent;
			}
		});
		this._abort = abort;
		this._status = status;
		this.status = "uploading";
		status
			.then(() => {
				this.status = "success";
				this.onSuccess && this.onSuccess();
				this._abort = undefined;
				this._status = undefined;
			})
			.catch(e => {
				this.status = "failed";
				this.failedReason = e;
				this.onFailed && this.onFailed();
			});
	}

	/**
	 * 终止上传文件
	 */
	abortUpload() {
		this._abort && this._abort();
		this.status = "failed";
		this.failedReason = "abort";
	}
}

export default class UploadQueue {
	constructor() {
		this.uid = generateId();
		this.queue = [];
		this.mode = "serial";
	}
	uid: number;
	queue: UploadQueueItem[];
	current: UploadQueueItem | undefined;

	// 未来再去实现，目前就是串行的
	// 好像也不用去实现
	mode: "serial" | "parallel";
	get status() {
		for (let item of this.queue) {
			if (item.status === "uploading") {
				return "busy";
			}
		}
		return "free";
	}

	/**
	 * 获取下一个需要被上传的item
	 */
	get nextUplpadItem() {
		for (let item of this.queue) {
			if (item.status === "waiting") {
				return item;
			}
		}
	}

	/**
	 * 开始串行的上传循环
	 */
	loop() {
		if (this.status === "busy") {
			return;
		}
		if (this.nextUplpadItem) {
			this.nextUplpadItem.startUpload();
		}
	}

	/**
	 * 向上传文件队列输送一批新的文件
	 * @param {any} files 需要上传的文件
	 * @param {any} targetDirectory 目标文件夹
	 * @param {any} option 每个文件上传完成以后都会触发一遍的回调函数
	 * @returns {any}
	 */
	push(
		files: File[],
		targetDirectory: VirtualDirectory,
		option?: {
			/**
			 * 每个文件上传完成以后都会触发一遍的回调函数
			 */
			onFinish?: () => void;
			/**
			 * 是否立即开始上传，若否则按队列顺序一个一个上传
			 */
			immediately?: boolean;
		}
	) {
		const onFinish = option?.onFinish;
		const immediately = option?.immediately ?? false;
		const uploadQueue = files.map(file => {
			return new UploadQueueItem(file, targetDirectory, {
				onSuccess: () => {
					this.loop();
					onFinish && onFinish();
				},
				onFailed: () => {
					this.loop();
				}
			});
		});
		this.queue.push(...uploadQueue);
		if (!immediately) {
			this.loop();
		} else {
			uploadQueue.forEach(item => {
				item.startUpload();
			});
		}
		return uploadQueue;
	}
}
