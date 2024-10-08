<template>
    <miao-drop-handler @on-virtual-files="handleDropVirtualFiles">
        <div class="miaoCrypto-container">
            <div class="miaoCrypto-container-encrypt miaoCrypto-container-item">

                <n-scrollbar style="max-height: 100%">
                    <div v-for="item of workItemList" :key="item.id" class="miaoCrypto-container-item-item">
                        <div class="miaoCrypto-container-item-percentBar" :style="{
                            zIndex: 0,
                            width: item.getBufferProgress !== -1 ? `${item.getBufferProgress * 100}%` : `0%`,
                            backgroundColor: 'blue'
                        }"></div>
                        <div class="miaoCrypto-container-item-percentBar" :style="{
                            zIndex: 1,
                            width: item.status === 'finish' ? `100%` : `0%`,
                            backgroundColor: 'green'
                        }"></div>
                        <span class="miaoCrypto-container-item-content">{{ item.name }}{{ item.status }}</span>
                    </div>
                </n-scrollbar>
            </div>
            <!-- <div class="miaoCrypto-container-decrypt miaoCrypto-container-item"></div> -->
        </div>
    </miao-drop-handler>
</template>

<script setup lang="ts">
import { NScrollbar } from 'naive-ui'
import { onUnmounted, ref, shallowReactive } from 'vue'
import aes_ctr_worker from './hooks/AES'
import { VirtualFile } from '@/class/VirtualDirectory'
import miaoDropHandler from '@/components/miaoDropHandler.vue'
import { reactive } from 'vue'
import useMiaoFetchApi from '@/hooks/useMiaoFetchApi'
import { onMounted } from 'vue'
import { computed } from 'vue'

const miaoFetchApi = useMiaoFetchApi()

interface workItem {
    id: number
    status: 'wait' | 'process' | 'finish' | 'error'
    buffer?: Uint8Array
    getBuffer: () => Promise<Uint8Array>
    getBufferProgress: number
    getBufferAbort?: () => void
    isGettingBuffer: boolean
    name: string
}

class Work {
    constructor(func: (key: string, data: Uint8Array) => Promise<Uint8Array>) {
        this.queue = []
        this.func = func
        this.abortLoop = false
    }
    queue: workItem[]
    func: (key: string, data: Uint8Array) => Promise<Uint8Array>
    abortLoop: boolean
    get isBusy() {
        return this.queue.filter((v) => v.status === 'process').length > 0
    }
    async funcLoop() {
        if (this.isBusy || this.abortLoop) {
            return
        }
        const currentItem = this.queue.filter((v) => v.status === 'wait')[0]
        if (currentItem === undefined || currentItem.buffer === undefined) {
            return
        }
        currentItem.status = 'process'
        try {
            currentItem.buffer = await this.func(key.value, currentItem.buffer)
            currentItem.status = 'finish'
        } catch (e) {
            currentItem.status = 'error'
        }
        this.funcLoop()
    }
    async getBufferLoop() {
        const _list = this.queue.filter(
            (v) => v.isGettingBuffer === false && v.buffer === undefined
        )
        if (_list.length === 0 || this.abortLoop) {
            return
        }
        const item = _list[0]
        item.isGettingBuffer = true
        try {
            item.buffer = await item.getBuffer()
        } catch(e) {
            item.status = 'error'
        }
        item.isGettingBuffer = false
        this.funcLoop()
        this.getBufferLoop()
    }
    push(itemList: workItem[]) {
        this.queue.push(...itemList)
        this.getBufferLoop()
    }
    pushVFiles(itemList: VirtualFile[]) {
        this.push(
            itemList.map((v) => {
                const item: workItem = shallowReactive({
                    id: Math.random(),
                    status: 'wait',
                    name: v.name,
                    getBuffer: () => {
                        const { response, abort } = miaoFetchApi.getFile(v, {
                            onProcess(percent) {
                                item.getBufferProgress = percent
                            }
                        })
                        item.getBufferAbort = abort
                        return response
                    },
                    isGettingBuffer: false,
                    getBufferProgress: 0
                })
                return item
            })
        )
    }
}

const encryptWork = reactive(new Work(aes_ctr_worker))
// const decryptWork = reactive(new Work(aes_ctr_worker))

const workItemList = computed(() => [
    ...encryptWork.queue
    // ...decryptWork.queue
])

const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
})

const key = ref('ABlockIs16Bytes!')

const handleDropVirtualFiles = (vFiles: VirtualFile[]) => {
    encryptWork.pushVFiles(vFiles)
}

onMounted(() => {
    encryptWork.pushVFiles(currentFiles.value)
})

onUnmounted(() => {
    encryptWork.abortLoop = true
    encryptWork.queue.forEach(item => {
        item.getBufferAbort && item.getBufferAbort()
    })
})
</script>

<style scoped lang="scss">
.miaoCrypto-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    &-item {
        max-height: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;

        &-item {
            margin: 10px auto;
            width: 95%;
            height: 40px;
            background-color: #fff;
            box-shadow: 0 0 15px -7px rgba(0, 0, 0, 0.1725490196),
                0 0 3px 1px #43434359;
            border-radius: 5px;
            position: relative;

            .miaoCrypto-container-item-percentBar {
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                border-radius: 5px;
            }

            .miaoCrypto-container-item-content {
                position: relative;
                z-index: 3
            }
        }
    }
}
</style>
