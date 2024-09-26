<template>
    <miao-drop-handler @on-virtual-files="handleDropVFiles">
        <div class="miaoMusic-container">
            <div ref="aplayer" />
        </div>
    </miao-drop-handler>
</template>

<script setup lang="ts">
import miaoDropHandler from '@/components/miaoDropHandler.vue'
import { VirtualFile } from '@/class/VirtualDirectory';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import 'APlayer/dist/APlayer.min.css';
// @ts-ignore
import APlayer from 'APlayer';
import config from '@/config';


const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
    required: true
});

const MusicList = computed(() => currentFiles.value.map(v => ({
    url: `${config.baseUrl}${v.url}`,
    name: v.name,
    artist: '???',
})));

const handleDropVFiles = (files: VirtualFile[]) => {
    currentFiles.value = [...currentFiles.value, ...files];
};

const aplayer = ref<any>(null);

let ap: any

onMounted(() => {
    currentFiles.value = [...currentFiles.value.reverse()]
    const aplayerOption = {
        container: aplayer.value,
        audio: MusicList.value,
        autoplay: true,
    }
    ap = new APlayer(aplayerOption);
});

onUnmounted(() => {
    ap.destroy()
})
</script>

<style scoped lang="scss">
.miaoMusic-container {
    width: 100%;
    height: 100%;
}
</style>
<style lang="scss">
.aplayer {
    height: calc(100% - 10px);
    display: flex;
    flex-direction: column;
    // .aplayer-list {
    //     max-height: none !important;
    //     height: fit-content;
    //     min-height: 0;
    //     ol {
    //         max-height: none !important;
    //         height: fit-content;
    //     }
    // }
}
</style>