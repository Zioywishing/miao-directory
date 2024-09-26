<template>
    <!-- <div class="test"></div> -->
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import Player from "xgplayer/es/player";
const props = defineProps({
    player: {
        type: Player,
        required: true
    },
    root: {
        type: Element,
        required: true
    }
})

onMounted(() => {
    props
})

</script>

<style lang="scss" scoped>
.test {
    width: 50px;
    height: 50px;
    background-color: aliceblue;
    position: absolute;
    right: 0;
}
</style>