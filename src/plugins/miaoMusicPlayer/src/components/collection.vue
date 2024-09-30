<template>
    <div class="collection" @click="emit('onenter')">
        <div class="collection-cover" @click.stop="emit('onPlay')">
            <img
                v-if="item.coverUrl"
                class="collection-cover-img"
                :src="item.coverUrl" />
            <div class="collection-cover-play">
              <Play></Play>
            </div>
        </div>
        <div class="collection-info">
            <div class="collection-info-name">
                <span class="collection-info-name-ellipsis">
                    <span>
                        {{ item.name }}
                    </span>
                </span>
            </div>
            <div class="collection-info-stats">
                <span class="collection-info-stats-time">{{ dateStr }}</span>
                <span class="collection-info-stats-count">
                    {{ `共${item.audios.length}首` }}
                </span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import collectionType from '../../types/collection'
import dateFormatter from '@/hooks/dateFormatter'
import { Play } from '@vicons/ionicons5'

const props = defineProps<{
    item: collectionType
}>()

const emit = defineEmits<{
  onPlay: []
  onenter: []
}>()

const dateStr = computed(() =>
    dateFormatter(new Date(props.item.createTime), 'yyyy-MM-dd')
)
</script>

<style lang="scss" scoped>
.collection {
    height: 50px;
    position: relative;
    display: flex;
    box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12),
        0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
    border-radius: 5px;
    overflow: hidden;
    transition: height 0.25s ease;
    cursor: pointer;
    user-select: none;

    &:not(&:last-child) {
        margin-bottom: 15px;
    }
    .collection-cover {
        width: 50px;
        height: 50px;
        aspect-ratio: 1;
        background-color: #60e8a2;
        margin-right: 5px;
        .collection-cover-play {
            width: 25px;
            height: 15px;
            background-color: #d1d1d1b2;
            position: absolute;
            bottom: 5px;
            left: 5px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 3px;
            svg {
              height: 15px;
              color: #fff;
            }
        }
    }
    .collection-info {
        position: relative;
        width: calc(100% - 60px);
        display: flex;
        flex-direction: column;
        justify-content: center;
        .collection-info-name {
            max-width: 100%;
            overflow: hidden;
            &-ellipsis {
                overflow: hidden;
                white-space: nowrap;
                display: inline-block;
                vertical-align: bottom;
                max-width: 100%;
                text-overflow: ellipsis;
                span {
                    white-space: nowrap;
                    text-wrap: nowrap;
                    text-overflow: ellipsis;
                }
            }
        }
        .collection-info-stats {
            text-wrap: nowrap;
            span {
                font-size: smaller;
            }
            .collection-info-stats-time {
                margin-right: 10px;
            }
        }
    }
}
</style>
