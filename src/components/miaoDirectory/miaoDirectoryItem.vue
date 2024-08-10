<template>
	<div class="miao-item" draggable="true" ref="itemRef" @dragstart="handleDragStart">
		<div class="item-main">
			<Icon class="item-main-icon"></Icon>
			<div class="item-main-info">
				<div class="item-main-info-name">
					{{ name }}
				</div>
				<div class="item-main-info-date" v-if="time">
					{{ time }}
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import VirtualDirectory, { VirtualFile } from '@/class/virtualDirectory';
import { DocumentText, FileTray, Help, Images, LogoChrome, LogoCss3, LogoJavascript, LogoVue, MusicalNotes, PlayCircle } from '@vicons/ionicons5';
import { computed, ref } from 'vue';
import dateFormatter from '@/hooks/dateFormatter';
import useDataBus from '@/hooks/useDataBus';

const dataBus = useDataBus()

const props = defineProps<{
  item: VirtualDirectory | VirtualFile
  name?: string
}>()

const name = props.name ?? props.item.name

const time = computed(()=>{
    return dateFormatter(new Date(props.item.stats.mtimeMs), "yyyy-MM-dd hh:mm:ss");
})

const Icon = computed(()=>{
    try{
        if(props.item.type === 'directory') {
            return FileTray
        } else if(props.item.type === 'file') {
            const aft = props.item.name.split('.').at(-1)?.toLowerCase()
            if(!aft){
                throw(1)
            }else if(['txt', 'doc', 'docs', 'docx', 'xls', 'xlsx'].includes(aft)){
                return DocumentText
            }else if(['mp3', 'wav', 'ape', 'acc', 'ogg', 'flac'].includes(aft)){
                return MusicalNotes
            }else if(['.xbm','.tif','pjp','.svgz','jpg','jpeg','ico','tiff','.gif','svg','.jfif','.webp','.png','.bmp','pjpeg','.avif'].includes(aft)){
                return Images
            }else if(['mp4', 'm2v', 'mkv'].includes(aft)){
                return PlayCircle
            }else if(['js', 'jsx', 'ts', 'tsx'].includes(aft)){
                return LogoJavascript
            }else if(['html'].includes(aft)){
                return LogoChrome
            }else if(['css', 'scss', 'less'].includes(aft)){
                return LogoCss3
            }else if(['vue'].includes(aft)){
                return LogoVue
            }
            return DocumentText
        }
    }catch{
        return Help
    }
})

const itemRef = ref()

const handleDragStart = () => {
    dataBus.set('dragData', props.item)
}

</script>

<style lang="scss" scoped>
.miao-item {
    cursor: pointer;
    width: 100%;
    min-width: 250px;
    // aspect-ratio: 66/9;
    height: 50px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 10px 0;
    .item-main {
        position: relative;
        width: calc(100% - 15px);
        height: 95%;
        background-color: rgb(255, 255, 255);
        border-radius: 7px;
        display: flex;
        align-items: center;
        transition: background-color 0.3s;
        .item-main-icon {
            margin-left: 10px;
            height: 80%;
        }
        .item-main-info {
            margin-left: 5px;
            height: 100%;
            display: flex;
            flex-direction: column;
            &-name {
                user-select: none;
            }
            &-date {
                user-select: none;
                font-size: small;
            }
        }
        &:hover, &:active {
            background-color: #d2d2d2;
        }
        
    }
}
</style>
