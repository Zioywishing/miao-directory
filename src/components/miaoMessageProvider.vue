<template>
    <div class="miao-message-provider" ref="rootRef">
        <slot></slot>
        <transition-group name="message-fade" tag="div" class="miao-message-provider-container">
            <div class="miao-message" v-for="msg in messageList" :key="msg.id"
                :style="{ maxWidth: maxMessageWidth + 'px' }">
                <n-icon class="miao-message-item" size="18" :color="msg.iconColor">
                    <component :is="msg.icon"></component>
                </n-icon>
                <div class="miao-message-item miao-message-item-content">{{ msg.content }}</div>
            </div>
        </transition-group>
    </div>
</template>

<script setup lang="ts">
import generateId from '@/hooks/generateId';
import { NIcon } from 'naive-ui';
import { computed, onMounted, ref, shallowReactive } from 'vue';
import { InformationCircle, CheckmarkCircle, CloseCircle } from '@vicons/ionicons5'

interface MessageOptions {
    type?: 'info' | 'success' | 'error'
    timeout?: number
    id?: number
}

interface Message {
    icon: any,
    timer: any,
    iconColor: string,
    content: string,
}

const iconMap = {
    'info': { icon: InformationCircle, color: 'blue' },
    'success': { icon: CheckmarkCircle, color: 'green' },
    'error': { icon: CloseCircle, color: 'red' },
}

const messageMap = shallowReactive<Record<string, Message | undefined>>({})
const rootRef = ref<HTMLDivElement>()
const maxMessageWidth = ref<number>(-1)

const messageList = computed(() => {
    return Object.keys(messageMap).map(v => ({
        id: v,
        ...messageMap[v],
    }))
})
const message = (content: string, options?: MessageOptions) => {
    let timer: any
    const { timeout = 0, type = 'info', id = generateId() } = options ?? {}
    if (timeout > 0) {
        messageMap[id]?.timer && clearTimeout(messageMap[id]?.timer)
        timer = setTimeout(() => {
            delete messageMap[id]
        }, timeout)
    }
    messageMap[id] = {
        icon: iconMap[type].icon,
        iconColor: iconMap[type].color,
        content,
        timer
    }
    return (newContent: string, newOptions?: MessageOptions) => {
        newOptions = newOptions ?? {}
        newOptions.id = id
        message(newContent, newOptions)
    }
}

onMounted(async () => {
    // const set = message('test', { timeout: 5000 })
    // setTimeout(() => {
    //     set('miao', { type: 'success' })
    // }, 1000);
    const observer = new ResizeObserver(entries => {
        for (let entry of entries) {
            maxMessageWidth.value = entry.contentRect.width * 0.8;
        }
    });
    if (rootRef.value) {
        observer.observe(rootRef.value);
    }
})


defineExpose({ message });
</script>

<style scoped lang="scss">
.miao-message-provider {
    width: 100%;
    height: 100%;
    position: relative;

    .miao-message-provider-container {
        position: absolute;
        width: 0;
        height: 0;
        left: 50%;
        top: 30px;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow: visible;

        .miao-message {
            display: flex;
            align-items: center;
            width: max-content;
            background-color: rgb(249, 249, 249);
            padding: 5px 10px;
            background-color: rgb(255 255 255);
            box-shadow: 0 3px 6px -4px rgba(0, 0, 0, .12), 0 6px 16px 0 rgba(0, 0, 0, .08), 0 9px 28px 8px rgba(0, 0, 0, .05);
            border-radius: 5px;
            user-select: none;
            margin-top: 10px;

            .miao-message-item {
                margin: 0 5px;
            }

            .miao-message-item-content {
                white-space: pre-wrap;
            }
        }
    }

    .message-fade-move,
    .message-fade-enter-active,
    .message-fade-leave-active {
        transition: all 0.5s ease;
    }

    .message-fade-enter-from,
    .message-fade-leave-to {
        opacity: 0;
        transform: translateX(30px);
    }

    .message-fade-leave-active {
        position: absolute;
    }
}
</style>
