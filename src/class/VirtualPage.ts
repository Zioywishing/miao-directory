import { reactive, shallowRef } from 'vue'
import VirtualDirectory, { VirtualFile } from './VirtualDirectory'
import generateId from '@/hooks/generateId'

export interface VirtualPageOption {
    exitConfirm?: boolean
}

export interface ViewsPushOption {
    index?: number
    VirtualPageOption?: VirtualPageOption
}

const getRandomWebSafeColor = (() => {
    const webSafeColors = [
        '#009900',
        '#999900',
        '#009999',
        '#990099',
        '#0000ee'
    ]
    let counter = 0
    return () => {
        const color = webSafeColors[counter % webSafeColors.length]
        counter += 1
        return color
    }
})()

export default class VirtualPage {
    constructor(
        component: any,
        initObjects?: {
            directories?: VirtualDirectory[]
            files?: VirtualFile[]
            option?: VirtualPageOption
        }
    ) {
        this.component = shallowRef(component)
        this.currentDirectories = initObjects?.directories ?? []
        this.currentFiles = initObjects?.files ?? []
        this.visible = true
        this.id = generateId()
        this.refreshKey = Math.random()
        this.color = getRandomWebSafeColor()
        this.exitConfirm = initObjects?.option?.exitConfirm ?? false
    }
    // 页面使用的组件
    component: any
    // 是否可见
    visible: boolean
    // 当前正在使用的文件夹
    currentDirectories: VirtualDirectory[]
    // 当前正在使用的文件
    currentFiles: VirtualFile[]
    // 区分每一个页面的唯一id
    id: number
    // 当refreshKey改变时需要刷新页面，目前还没接入刷新
    refreshKey: number
    // 为了区分，每个虚拟页面都会分配一个color，这个color会体现在tab上
    color: string
    // 用于展示的title
    _title?: string
    // 关闭时是否需要确认
    exitConfirm: boolean

    get title() {
        if (this._title) {
            return this._title
        }
        return (
            this?.currentDirectories[0]?.name ??
            this?.currentFiles[0]?.name ??
            '未命名标签'
        )
    }

    setTitle(title: string) {
        this._title = title
    }

    // 切换显示状态
    switchShow() {
        this.visible = !this.visible
    }

    // 刷新，不过好像没有用得到的时候吧
    // 事实上也不应该用得到，因为更新应该是响应式的
    refresh() {
        this.refreshKey = Math.random()
    }
}

export class VirtualPages {
    constructor() {
        this._views = reactive<VirtualPage[]>([])
    }
    _views: VirtualPage[]

    get length() {
        return this._views.length
    }

    /**
     * 查询一个页面位于_views中的次序
     * @param {any} id 要查询的页面的id
     * @returns {any}
     */
    getIndex(id: number) {
        for (let i in this._views) {
            if (this._views[i].id === id) {
                return parseInt(i)
            }
        }
        return -1
    }
    /**
     * 根据id得到view
     * @param {any} id 要查询的页面的id
     */
    getView(id: number) {
        for (let v of this._views) {
            if (v.id === id) {
                return v
            }
        }
        return undefined
    }

    /**
     * 推入一个新的页面
     */
    push(
        component: any,
        currentDirectories?: VirtualDirectory[],
        currentFiles?: VirtualFile[],
        option?: ViewsPushOption
    ) {
        const { index = this.length, VirtualPageOption } = option ?? {}
        this._views.splice(
            index,
            0,
            reactive<VirtualPage>(
                new VirtualPage(component, {
                    directories: [...(currentDirectories ?? [])],
                    files: [...(currentFiles ?? [])],
                    option: VirtualPageOption
                })
            )
        )
    }
    /**
     * 根据次序删除一个页面
     */
    deleteView(index: number) {
        this._views.splice(index, 1)
    }
}
