<template>
    <miao-drop-handler @on-virtual-files="handleDropVFiles">
        <miao-alertTip-provider ref="miaoMessageRef">
            <div class="miaoMusic-container">
                <NScrollbar>
                    <div class="miaoMusic-main">
                    </div>
                </NScrollbar>
                <div ref="aplayer" />
            </div>
        </miao-alertTip-provider>
    </miao-drop-handler>
</template>

<script setup lang="ts">
import miaoDropHandler from '@/components/miaoDropHandler.vue'
import miaoAlertTipProvider from '@/components/miaoAlertTipProvider.vue'
import useAplayerMiao from './hooks/aplayerMiao';
import { VirtualFile } from '@/class/VirtualDirectory';
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { NScrollbar } from 'naive-ui';
import "./src/APlayer.fix.css"
// @ts-ignore
import APlayer from 'APlayer';
import config from '@/config';
import { difference, uniq } from 'lodash';
import apType from './types/ap';

const miaoMessageRef = ref<InstanceType<typeof miaoAlertTipProvider>>()

const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
});

watch(() => currentFiles.value, (value, oldValue) => {
    const diff = difference(value, oldValue)
    if (diff.length > 0) {
        const _s = `等${diff.length}个资源`
        miaoMessageRef.value?.alertTip(`已添加 ${diff[0].name}${diff.length !== 1 ? _s : ''}`, {
            type: 'success',
            timeout: 3000
        })
        ap.list.add(getMusicList(diff))
    }
})

const getMusicList = (mp3VFiles: VirtualFile[]) => mp3VFiles.map((v, index) => ({
    url: `${config.baseUrl}${v.url}`,
    name: v.name,
    artist: ' ',
    index
}));

const handleDropVFiles = (files: VirtualFile[]) => {
    currentFiles.value = uniq([...currentFiles.value, ...files]);
};

const aplayer = ref<any>(null);

const disableDropReceiver = ref(false)

let ap: apType
let vueApp: any


onMounted(() => {
    currentFiles.value = [...currentFiles.value.reverse()]
    const aplayerOption = {
        container: aplayer.value,
        audio: getMusicList(currentFiles.value),
        autoplay: true,
        volume: 1,
        theme: "#60e8a2"
    }
    ap = reactive<apType>(new APlayer(aplayerOption))
    vueApp = useAplayerMiao(ap, {
        onDragItemStart: () => {
            disableDropReceiver.value = true
        },
        onDragItemEnd: () => {
            disableDropReceiver.value = false
        },
    })
    ap.on('listremove', (...args: any) => {
        const { index } = args[0] as { index: number }
        const _name = ap.list.audios[index].name
        currentFiles.value = currentFiles.value.filter(v => v.name !== _name)
    })
    // console.log({ ap, vueApp })
});

onUnmounted(() => {
    ap.destroy()
})
</script>

<style scoped lang="scss">
.miaoMusic-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    .miaoMusic-main {
        padding-bottom: 88px;
    }
}
</style>
<style lang="scss">
.aplayer {
    display: flex;
    flex-direction: column-reverse;
    position: fixed;
    bottom: 10px;
    width: -webkit-fill-available;
}
</style>