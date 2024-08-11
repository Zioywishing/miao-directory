<template>
	<transition name="transition">
		<div class="mask-body" ref="maskBodyRef" v-show="showMask">
      <div @click="e=>e.stopPropagation()">
        <slot> {{}} </slot>
      </div>
		</div>
	</transition>
</template>
<script lang="ts" setup>
import { ref } from 'vue';

const maskBodyRef = ref<HTMLDivElement>()

const showMask = defineModel<boolean | number>('show', { default: false, required: true })

</script>
<style lang="scss" scoped>
.mask-body {
    height: 100%;
    width: 100%;
    position: absolute;
    top:0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 7058214053994319;
    &-show {
        display: flex;
        transition: opacity 0.3s 0.01s;
        opacity: 1;
    }
    &-hide {
        opacity: 0;
        transition: display 0.01s 0.3s;
        display: none;
    }
}
.transition-enter-active,
.transition-leave-active {
  transition: opacity 0.3s ease;
}

.transition-enter-from,
.transition-leave-to {
  opacity: 0;
}
</style>
