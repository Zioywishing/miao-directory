<template>
    <div class="miaoMusic-main">
        <NScrollbar>
            <div class="miaoMusic-main-collectionsList">
                <div class="miaoMusic-main-collectionsList-title">自建歌单</div>
                <VueDraggable
                    v-if="collections"
                    v-model="collections"
                    :animation="150"
                    :delay="100"
                    ghostClass="iSDragging">
                    <collection
                        v-for="item in collections"
                        :item="item"
                        @on-play="handleCollectionsPlay(item)"
                        @onenter="handleCollectionEnter(item)"></collection>
                </VueDraggable>
                <n-empty
                    description="空空如也~"
                    size="huge"
                    style="margin-top: 200px"
                    v-if="!data || data?.length === 0">
                    <template #icon>
                        <n-icon>
                            <HandLeftOutline />
                        </n-icon>
                    </template>
                    <template #extra>
                        <n-button
                            size="small"
                            type="primary"
                            @click="emit('newCollection')">
                            立刻创建
                        </n-button>
                    </template>
                </n-empty>
            </div>
        </NScrollbar>
        <Transition name="slide-fade">
            <collectionInfo
                class="miaoMusic-main-collection"
                :collection="currCollection"
                v-if="currCollection"
                @exit="handleCollectionEnter(undefined)"
                @delete-self="handleCollectionDelete()"
                @play-all="handleCollectionsPlay"></collectionInfo>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import apType from '../types/ap'
import collection from './components/collection.vue'
import collectionInfo from './collectionInfo.vue'
import collectionType from '../types/collection'
import { VueDraggable } from 'vue-draggable-plus'
import { NScrollbar, NEmpty, NButton } from 'naive-ui'
import { HandLeftOutline } from '@vicons/ionicons5'

const props = defineProps<{
    ap: apType
}>()

const emit = defineEmits<{
    newCollection: []
}>()

const collections = defineModel<collectionType[]>('data')
const currCollection = ref<collectionType>()
const playCollection = (collection: collectionType, index?: number) => {
    const ap = props.ap
    console.log({ collection, ap })
    // clear有bug
    while (ap.list.audios.length !== 0) {
        ap.list.remove(0)
    }
    ap.list.add(collection.audios)
    index && ap.list.switch(index)
    ap.play()
}

const handleCollectionsPlay = (item: collectionType, index?: number) => {
    playCollection(item, index)
}

const handleCollectionEnter = (item: collectionType | undefined) => {
    currCollection.value = item
}

const handleCollectionDelete = () => {
    collections.value &&
        collections.value.splice(
            collections.value.findIndex((v) => v === currCollection.value),
            1
        )
    currCollection.value = undefined
}
</script>

<style lang="scss" scoped>
.miaoMusic-main {
    position: relative;
    max-height: 100%;
    height: 100%;
    .miaoMusic-main-collectionsList {
        padding: 15px 20px 88px;
        &-title {
            font-size: larger;
            letter-spacing: 1px;
            margin-bottom: 10px;
            user-select: none;
        }
    }
}
.slide-fade-enter-active {
    transition: all 0.15s ease-out;
}

.slide-fade-leave-active {
    transition: all 0.15s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    transform: translateX(200px);
    opacity: 0;
}

.isDragging {
    opacity: 0.5;
}
</style>
