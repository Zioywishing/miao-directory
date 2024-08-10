import config from "@/config";

const { uploadSizeLimit } = config;

export type dropHandlerHooks = {
	/**
	 * 仅返回小于config.ts中大小限制的文件，不会返回文件夹
	 */
	onDropFiles?: (files: File[]) => void;
	/**
	 * 当拖动时
	 */
	onOver?: () => void;
	/**
	 * 当进入时
	 */
	onEnter?: () => void;

	/**
	 * 当离开时
	 */
	onLeave?: () => void;

	/**
	 * 离开或是放下时都会触发
	 * @returns {any}
	 */
	onEnd?: () => void;
};

const isFile = (file: File) =>
	new Promise(resolve => {
		const reader = new FileReader();
		reader.onload = () => {
			resolve(true);
			reader.abort();
		};
		reader.onerror = () => {
			resolve(false);
			reader.abort();
		};
		reader.readAsText(file);
	});

/**
 * 只保留文件，移去文件夹
 * @param {File[]} files
 */
const filesFilter = async (files: File[]) => {
	let index = 0;
	while (index < files.length) {
		const currentFile = files[index];
		const _isFile = await isFile(currentFile);
		if (_isFile) {
			index += 1;
			continue;
		} else {
			files.splice(index, 1);
			continue;
		}
	}
};

export default function dropHandler(dom: HTMLDivElement, hooks?: dropHandlerHooks) {
	dom.addEventListener(
		"dragenter",
		function (e) {
			e.preventDefault();
			e.stopPropagation();
			hooks?.onEnter && hooks?.onEnter();
		},
		false
	);

	dom.addEventListener(
		"dragover",
		function (e) {
			e.preventDefault();
			e.stopPropagation();
			hooks?.onOver && hooks?.onOver();
		},
		false
	);

	dom.addEventListener(
		"dragleave",
		function (e) {
			e.preventDefault();
			e.stopPropagation();
			hooks?.onLeave && hooks?.onLeave();
			hooks?.onEnd && hooks.onEnd();
		},
		false
	);

	dom.addEventListener(
		"drop",
		async function (e) {
			// console.log(e, e.dataTransfer?.types);
			e.preventDefault();
			e.stopPropagation();
			const files = [...(e.dataTransfer?.files ?? [])].filter(file => file.size < uploadSizeLimit);
			await filesFilter(files);
			hooks?.onDropFiles && hooks.onDropFiles(files);
			hooks?.onEnd && hooks.onEnd();
		},
		false
	);
}
