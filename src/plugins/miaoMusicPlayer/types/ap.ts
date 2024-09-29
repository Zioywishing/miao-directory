export type audioType = {
    url: string
    artist?: string
    cover?: string
    name: string
    theme?: string
    id?: number
    index: number
}

type apType = {
    paused: boolean
    list: {
        audios: audioType[]
        index: number
        switch: (index: number) => void
        remove: (index: number) => void
        add: (audios: audioType[]) => void
        refreshAudioIndex: () => void
        hide: () => void
    }
    container: HTMLDivElement
    on: (event: string, callback: () => void) => void
    options: {
        audio: audioType[]
        autoplay: boolean
        volume: number
        theme: string
        mini: boolean
        fixed: boolean
        mutex: boolean
        lrcType: number
        preload: 'auto'
        loop: 'all' | 'one' | 'none'
        order: 'list' | 'random'
        listMaxHeight: string
        storageName: 'aplayer-setting'
    }
    destroy: () => {}
    pause: () => void
    play: () => void
}

export default apType