import { BasePlugin } from "xgplayer";
import "./lockScreen.scss";
import MobilePlugin from "xgplayer/es/plugins/mobile";

export default class LockPlugin extends BasePlugin {
	static get pluginName() {
		return "lockPlugin";
	}

	private locked: boolean;
	private lockDiv: HTMLDivElement = document.createElement("div");
	private overlayDiv: HTMLDivElement = document.createElement("div");

	private lockOpenSVG: string = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M336 208v-95a80 80 0 0 0-160 0v95" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></path>
            <rect x="96" y="208" width="320" height="272" rx="48" ry="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></rect>
        </svg>`;

	private lockClosedSVG: string = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M336 112a80 80 0 0 0-160 0v96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></path>
            <rect x="96" y="208" width="320" height="272" rx="48" ry="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></rect>
        </svg>`;

	constructor(args: any) {
		super(args);
		this.locked = false;
	}

	afterCreate() {
		this.initLockDiv();
		this.initOverlayDiv();
		this.bindEvents();
	}

	private initLockDiv() {
		this.lockDiv.innerHTML = this.lockClosedSVG;
		this.lockDiv.className = "lock-div";
		this.player.root !== null && this.player.root.appendChild(this.lockDiv);
	}

	private initOverlayDiv() {
		this.overlayDiv.className = "overlay-div";
		this.player.root !== null && this.player.root.appendChild(this.overlayDiv);
		this.overlayDiv.addEventListener('mousedown', (e) => {
			e.preventDefault();
		});
		this.overlayDiv.addEventListener('mousemove', (e) => {
			e.preventDefault();
		});
	}

	private bindEvents() {
		this.lockDiv!.addEventListener("click", this.toggleLock.bind(this));
		this.player.root !== null && this.player.root.addEventListener("click", this.preventClick.bind(this), true);
		this.player.usePluginHooks("progress", "dragstart", () => {
			if (this.locked) {
				return false;
			}
			return true;
		});
        // 阻止进度条默认行为
        for(const event of ['dragstart', 'drag', 'dragend']) {
            this.player.usePluginHooks("progress", event, () => {
                if (this.locked) {
                    return false;
                }
                return true;
            });
        }
	}

	private toggleLock() {
        const mobile = this.getPlugin('mobile') as MobilePlugin | undefined
		// mobile?.disableGesture()
		if (this.lockDiv && this.overlayDiv) {
			this.locked = !this.locked;
			this.lockDiv.innerHTML = this.locked ? this.lockOpenSVG : this.lockClosedSVG;
			this.overlayDiv.style.display = this.locked ? "block" : "none";
			this.player.controls && (this.locked ? this.player.controls.hide() : this.player.controls.show());
			this.player.root !== null && this.player.root.classList.toggle("xgplayer-locked", this.locked);
            this.locked ? mobile?.disableGesture() : mobile?.enableGesture()
		}
	}

	private preventClick(event: MouseEvent) {
		if (this.locked && event.target instanceof HTMLElement && !event.target.classList.contains("lock-div")) {
			event.stopPropagation();
			event.preventDefault();
		}
	}

	destroy() {
		if (this.lockDiv) {
			this.lockDiv.removeEventListener("click", this.toggleLock.bind(this));
			this.player.root !== null && this.player.root.removeEventListener("click", this.preventClick.bind(this), true);
			this.player.root !== null && this.player.root.removeChild(this.lockDiv);
		}
		if (this.overlayDiv) {
			this.player.root !== null && this.player.root.removeChild(this.overlayDiv);
		}
	}
}
