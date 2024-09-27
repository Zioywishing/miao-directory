export type audioType = {
    url: string
    artist: string
    cover?: string
    name: string
    theme?: string
    id?: number
    index: number
}

type apType = {
    list: {
        audios: audioType[]
        index: number
        switch: (index: number) => void
        remove: (index: number) => void
        add: (audios: audioType[]) => void
        refreshAudioIndex: () => void
    }
    container: HTMLDivElement
    on: (event: string, callback: () => void) => void
    options: {
        audio: audioType[],
        autoplay: boolean,
        "volume": number,
        "theme": string,
        "mini": boolean,
        "fixed": boolean,
        "mutex": boolean,
        "lrcType": number,
        "preload": "auto",
        "loop": "all",
        "order": "list",
        "listMaxHeight": string,
        "storageName": "aplayer-setting"
    },
    destroy: () => {}
}

export default apType