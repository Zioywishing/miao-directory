<template>
    <Teleport :to="player.root">
        <App v-bind="pick(toRaw(props), ['player', 'root'])"></App>
    </Teleport>
</template>

<script setup lang="ts">
import { onMounted, Component, toRaw } from "vue";
import Player from "xgplayer/es/player";
import { pick } from "lodash";
const props = defineProps({
    player: {
        type: Player,
        required: true
    },
    root: {
        type: Element,
        required: true
    },
    App: {
        type: Object as () => Component,
        required: true
    }
})

onMounted(() => {
    console.log(props)
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