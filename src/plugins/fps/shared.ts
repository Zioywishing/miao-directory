import { shallowRef } from 'vue';

// 使用shallowRef包装状态
export const fpsElement = shallowRef<HTMLDivElement | null>(null);
export const animationFrameId = shallowRef<number | null>(null);

// 更新设置函数
export const setFpsElement = (el: HTMLDivElement | null) => {
  fpsElement.value = el;
};

export const setAnimationFrameId = (id: number | null) => {
  animationFrameId.value = id;
}; 