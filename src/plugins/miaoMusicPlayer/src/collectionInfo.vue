<template>
    <div class="collection-info-container">
        <div class="collection-info-container-top">
            <div
                class="collection-info-container-top-exit"
                @click="emit('exit')">
                <ArrowBackOutline></ArrowBackOutline>
            </div>
            <div class="collection-info-container-top-title">
                <span :tooltip="false" v-if="!isEditing">
                    {{ collection.name }}
                </span>
                <n-input
                    v-if="isEditing"
                    v-model:value="collection.name"></n-input>
            </div>

            <div
                class="collection-info-container-top-delete"
                v-if="isEditing"
                @click="
                    clickDeleteCount !== 2
                        ? clickDeleteCount++
                        : emit('deleteSelf')
                ">
                <TrashOutline></TrashOutline>
                <span>
                    {{
                        clickDeleteCount === 0
                            ? `删除`
                            : clickDeleteCount === 1
                            ? '确认删除'
                            : '再次确认'
                    }}
                </span>
            </div>
        </div>
        <div class="collection-info-container-controller">
            <div
                class="collection-info-container-controller-play"
                @click="emit('playAll', collection)">
                <div class="collection-info-container-controller-play-icon">
                    <CaretForwardOutline></CaretForwardOutline>
                </div>
                <div class="collection-info-container-controller-play-text">
                    {{ `全部播放` }}
                </div>
            </div>
            <div class="collection-info-container-controller-right">
                <div
                    class="collection-info-container-controller-edit"
                    @click="isEditing = !isEditing">
                    <component
                        :is="
                            isEditing ? CheckmarkOutline : CreateOutline
                        "></component>
                </div>
            </div>
        </div>
        <NScrollbar>
            <div class="collection-info-container-audioList">
                <VueDraggable
                    v-model="collection.audios"
                    :animation="150"
                    handle=".collection-info-container-audioList-item-controller-item-drag"
                    ghostClass="iSDragging">
                    <div
                        v-for="(audio, index) in collection.audios"
                        class="collection-info-container-audioList-item">
                        <div
                            class="collection-info-container-audioList-item-index">
                            <div>{{ index + 1 }}</div>
                        </div>
                        <div
                            class="collection-info-container-audioList-item-info">
                            <div
                                v-if="!isEditing"
                                class="collection-info-container-audioList-item-info-name">
                                <NEllipsis :tooltip="false">
                                    {{ audio.name }}
                                </NEllipsis>
                            </div>
                            <n-input
                                v-model:value="audio.name"
                                v-if="isEditing"></n-input>
                        </div>
                        <div
                            class="collection-info-container-audioList-item-controller">
                            <PlayOutline
                                class="collection-info-container-audioList-item-controller-item"
                                v-if="!isEditing"
                                @click="
                                    emit('playAll', collection, index)
                                "></PlayOutline>
                            <TrashOutline
                                class="collection-info-container-audioList-item-controller-item"
                                v-if="isEditing"
                                @click="handleDelete(index)"></TrashOutline>
                            <ReorderFourOutline
                                v-if="isEditing"
                                class="collection-info-container-audioList-item-controller-item collection-info-container-audioList-item-controller-item-drag"></ReorderFourOutline>
                        </div>
                    </div>
                </VueDraggable>
            </div>
        </NScrollbar>
    </div>
</template>

<script setup lang="ts">
import { NScrollbar, NEllipsis, NInput } from 'naive-ui'
import { VueDraggable } from 'vue-draggable-plus'
import {
    ArrowBackOutline,
    CaretForwardOutline,
    ReorderFourOutline,
    PlayOutline,
    CreateOutline,
    CheckmarkOutline,
    TrashOutline
} from '@vicons/ionicons5'
import collectionType from '../types/collection'
import { ref, watch } from 'vue'

const props = defineProps<{
    collection: collectionType
}>()

const isEditing = ref(false)
const clickDeleteCount = ref(0)

watch(isEditing, (v) => v && (clickDeleteCount.value = 0))

const handleDelete = (index: number) => {
    props.collection.audios.splice(index, 1)
}

const emit = defineEmits<{
    exit: []
    deleteSelf: []
    playAll: [collection: collectionType, index?: number]
}>()
</script>

<style lang="scss" scoped>
$ig: linear-gradient(90deg, #a1ee5e 0%, #00e3ae 100%);
.collection-info-container {
    width: 100%;
    height: 100%;
    background-color: #ffffff;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    &-top {
        height: 70px;
        padding: 0 15px;
        background: $ig;
        display: flex;
        align-items: center;
        &-exit {
            width: 30px;
            aspect-ratio: 1;
            color: #063b2a;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            svg {
                width: 25px;
                aspect-ratio: 1;
                transition: width 0.25s ease;
            }
            &:hover {
                svg {
                    width: 30px;
                }
            }
        }
        &-title {
            display: flex;
            margin-left: 10px;
            &-confirm {
                margin-left: 10px;
                width: 32px;
                // color: #ffffff;
            }
            span {
                user-select: none;
                font-size: larger;
            }
        }
        &-delete {
            display: flex;
            height: 25px;
            position: absolute;
            right: 28px;
            color: red;
            user-select: none;
            cursor: pointer;
            & > span {
                position: relative;
                top: 3px;
                margin-left: 3px;
            }
        }
    }
    &-controller {
        height: 50px;
        padding: 0 15px;
        display: flex;
        align-items: center;
        &-play {
            display: flex;
            align-items: center;
            & > div {
                cursor: pointer;
            }
            &-icon {
                height: 30px;
                width: 45px;
                background: $ig;
                border-radius: 10px;
                display: flex;
                justify-content: center;
                align-items: center;
                svg {
                    width: 30px;
                    height: 25px;
                    color: aliceblue;
                }
            }
            &-text {
                user-select: none;
                margin-left: 10px;
                font-size: larger;
            }
        }
        &-right {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            & > div {
                margin: 0 10px;
                cursor: pointer;
                height: 25px;
                width: 25px;
                color: #002911;
            }
        }
    }
    &-audioList {
        flex: 1;
        color: #002911;
        padding-bottom: 88px;
        &-item {
            // padding: 0 20px;
            padding-right: 7px;
            display: flex;
            height: 70px;
            align-items: center;
            &-index {
                width: 50px;
                user-select: none;
                font-size: 24px;
                text-align: right;
                & > div {
                    margin: auto;
                    width: fit-content;
                }
            }
            &-info {
                flex: 1;
                display: flex;
                user-select: none;
                overflow: hidden;
                &-name {
                    overflow: hidden;
                }
            }
            &-controller {
                display: flex;
                align-items: center;
                &-item {
                    width: 30px;
                    cursor: pointer;
                    margin: 0 5px;
                }
            }
        }
    }
}

.isDragging {
    opacity: 0.5;
}
</style>
