import { App, Component, createApp } from "vue";
import { BasePlugin } from "xgplayer";
import fakeApp from "./fakeRoot.vue";

const useXGPlayerVueFrame = (App: Component) => {
	return class XGPlayerVueFrame extends BasePlugin {
		static get pluginName() {
			return "xgplayerVueFrame";
		}

		private root: HTMLDivElement | null = null;
		private app: App<Element> | null = null;

		constructor(args: any) {
			super(args);
		}

		afterCreate() {
			console.log({fakeApp})
			this.createVueFrame();
		}

		private createVueFrame() {
			this.root = document.createElement("div");
			this.app = createApp(fakeApp, { player: this.player, root: this.root, App })
			this.app.mount(this.root);
			// this.app.mount(this.player.root);
		}

		destroy() {
			this.app?.unmount()
		}
	};
};

export default useXGPlayerVueFrame;
