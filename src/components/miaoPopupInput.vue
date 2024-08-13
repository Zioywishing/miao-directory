<template>
  <miao-mask v-model:show="showMask">
    <n-card title="">
      <n-input v-model:value="inputValue" type="text" placeholder="基本的 Input" />
      <n-button @click="_resolve && _resolve(inputValue)">确认</n-button>
    </n-card>
  </miao-mask>
</template>
<script lang="ts" setup>
import { reactive, ref } from "vue";
import { NCard, NInput, NButton } from "naive-ui";
import miaoMask from "./miaoMask.vue";

const showMask = ref(true);
const inputValue = ref<string>("");
const _resolve = ref<(text: string) => void>()

type popupConfig = {
  title: string
  placeholder: string
  options: {
    label
  }
}

const _config = reactive<popupConfig>({
  title: '',
  placeholder: ''
})


const popup = () => {
  showMask.value = true
  return new Promise((resolve: (text: string) => void) => { _resolve.value = resolve }).then((text: string) => {
    showMask.value = false
    return text;
  });
};

defineExpose({ popup });
</script>

<style scoped lang="scss"></style>
