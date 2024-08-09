import type { stats, file, directory } from '@/types/type.ts'

class VirtualFile {
    constructor(info: file, parent: VirtualDirectory) {
        this.name = info.name
        this.size = info.size
        this.stats = info.stats
        this.parent = parent
    }
    name: string
    size: number
    stats: stats
    parent: VirtualDirectory
    get path() {
        return `${this.parent.path}${this.name}`
    }
}

class VirtualDirectory {
    constructor(info: directory, parent: VirtualDirectory) {
        this.name = info.name
        this.type = info.type
        this.stats = info.stats
        this.parent = parent ?? undefined
        // 这里要改
        this.content = info.content.map((v) => {
            if (v.type === 'file') {
                return new VirtualFile(v, this)
            } else {
                return new VirtualDirectory(v, this)
            }
        })
    }
    name: string
    content: (VirtualFile | VirtualDirectory)[]
    type: 'directory'
    stats: stats
    parent?: VirtualDirectory

    /**
     * 相对于根目录的路径， 如: "/",  "/123/321/"
     * @returns {string}
     */
    get path(): string {
        if (!this.parent) {
            return '/'
        }
        return `${this.parent.path}${this.name}/`
    }
}
export default VirtualDirectory
