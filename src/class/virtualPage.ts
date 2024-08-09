import { ref, Ref } from "vue";

export default class VirtualPage {
	constructor() {
		this.visible = ref<boolean>(true);
		this.title = ref<string>("");
		this.uid = Math.ceil(Math.random() * 10000000000000);
	}
	visible: Ref<boolean>;
	title: Ref<string>;
	uid: number;

	switchShow() {
		// @ts-ignore 你只要知道这是对的就行了
		this.visible = !this.visible;
	}

	setTitle(newTitle: string) {
		// @ts-ignore 你只要知道这是对的就行了
		this.title = newTitle;
	}
}
