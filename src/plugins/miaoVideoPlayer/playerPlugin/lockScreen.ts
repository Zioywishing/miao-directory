import { BasePlugin } from 'xgplayer'
import './lockScreen.scss'

interface LockPluginConfig {
    lockText: string
    unlockText: string
}

export default class LockPlugin extends BasePlugin {
    static get pluginName() {
        return 'lockPlugin'
    }

    static get defaultConfig(): LockPluginConfig {
        return {
            lockText: '锁定',
            unlockText: '解锁'
        }
    }

    private locked: boolean
    private lockDiv: HTMLDivElement | null = null
    private overlayDiv: HTMLDivElement | null = null

    private lockOpenSVG: string = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M336 208v-95a80 80 0 0 0-160 0v95" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></path>
            <rect x="96" y="208" width="320" height="272" rx="48" ry="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></rect>
        </svg>`

    private lockClosedSVG: string = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M336 112a80 80 0 0 0-160 0v96" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></path>
            <rect x="96" y="208" width="320" height="272" rx="48" ry="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></rect>
        </svg>`

    constructor(args: any) {
        super(args)
        this.locked = false
    }

    afterCreate() {
        this.createLockDiv()
        this.createOverlayDiv()
        this.bindEvents()
    }

    private createLockDiv() {
        this.lockDiv = document.createElement('div')
        this.lockDiv.innerHTML = this.lockClosedSVG
        this.lockDiv.className = 'lock-div'
        this.player.root !== null && this.player.root.appendChild(this.lockDiv)
    }

    private createOverlayDiv() {
        this.overlayDiv = document.createElement('div')
        this.overlayDiv.className = 'overlay-div'
        this.player.root !== null &&
            this.player.root.appendChild(this.overlayDiv)
    }

    private bindEvents() {
        this.lockDiv!.addEventListener('click', this.toggleLock.bind(this))
        this.player.root !== null &&
            this.player.root.addEventListener(
                'click',
                this.preventClick.bind(this),
                true
            )
    }

    private toggleLock() {
        if (this.lockDiv && this.overlayDiv) {
            this.locked = !this.locked
            this.lockDiv.innerHTML = this.locked
                ? this.lockOpenSVG
                : this.lockClosedSVG
            this.overlayDiv.style.display = this.locked ? 'block' : 'none'
            this.player.controls &&
                (this.locked
                    ? this.player.controls.hide()
                    : this.player.controls.show())
            this.player.root !== null &&
                this.player.root.classList.toggle('locked', this.locked)
        }
    }

    private preventClick(event: MouseEvent) {
        if (
            this.locked &&
            event.target instanceof HTMLElement &&
            !event.target.classList.contains('lock-div')
        ) {
            event.stopPropagation()
            event.preventDefault()
        }
    }

    destroy() {
        if (this.lockDiv) {
            this.lockDiv.removeEventListener(
                'click',
                this.toggleLock.bind(this)
            )
            this.player.root !== null &&
                this.player.root.removeEventListener(
                    'click',
                    this.preventClick.bind(this),
                    true
                )
            this.player.root !== null &&
                this.player.root.removeChild(this.lockDiv)
        }
        if (this.overlayDiv) {
            this.player.root !== null &&
                this.player.root.removeChild(this.overlayDiv)
        }
    }
}
