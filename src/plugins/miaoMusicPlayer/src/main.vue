<template>
    <div class="miaoMusic-main">
        <div class="fd" v-if="false">
            {{ fakeData }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import apType from '../types/ap'

const props = defineProps<{
    ap: apType
}>()

const fakeData = ref(new Array(10000).fill('我会一直盯着你'))
console.log(props.ap)
</script>

<style lang="scss" scoped>
.miaoMusic-main {
    padding-bottom: 88px;
}
</style>
