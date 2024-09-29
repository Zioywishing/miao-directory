import { createApp, Reactive } from "vue";
import aplayerListNew from "../src/aplayerListNew.vue";
import apType, { audioType } from "../types/ap";

type aplayerMiaoOption = {
    onDragItemStart?: () => void
    onDragItemEnd?: () => void
    onPlayVideo?: (element: audioType) => void
}

/**
 * 对aplayer进行一些自定义的风格优化
 */
const useAplayerMiao = (ap: Reactive<apType>, options?: aplayerMiaoOption) => {
	const container = ap.container as HTMLDivElement;

	// 隐藏旧版歌单
	const old_listDom = container.querySelector(".aplayer-list") as HTMLDivElement;
	old_listDom.style.display = "none";

	// 新版歌单
	const new_list_dom = document.createElement("div");
	new_list_dom.classList.add("aplayer-list");
	new_list_dom.style.maxHeight = ap.options.listMaxHeight;

	ap.on("listadd", () => {
		ap.list.audios.forEach(v => {
			!v.id && (v.id = Math.random());
		});
	});
	ap.on("listshow", () => {
		new_list_dom.classList.remove("aplayer-list-hide");
	});
	ap.on("listhide", () => {
		new_list_dom.classList.add("aplayer-list-hide");
	});

	container.appendChild(new_list_dom);
	const app = createApp(aplayerListNew, { ap, ...(options ?? {}) });
	app.mount(new_list_dom);

	// console.log({ap})

	ap.on("destroy", () => {
		app.unmount();
	});
	return app;
};

export default useAplayerMiao;
