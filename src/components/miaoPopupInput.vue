<template>
  <miao-mask v-model:show="showMask">
    <n-card class="popup-card" :title="popupConfig?.title" size="medium">
      {{ popupConfig?.content }}
      <n-input class="popup-input" v-model:value="inputValue" type="text" v-bind="popupConfig?.inputProps"
        v-if="popupConfig?.inputProps" />
      <div class="popup-button-container">
        <n-button class="popup-button-container-button" v-for="option in popupConfig?.options" :key="option.label"
          :type="option.type" @click="_resolve && _resolve(option.key)">{{ option.label }}</n-button>
      </div>
    </n-card>
  </miao-mask>
</template>
<script lang="ts" setup>
import { ref, nextTick } from "vue";
import { NCard, NInput, NButton } from "naive-ui";
import miaoMask from "./miaoMask.vue";
import { InputProps } from "naive-ui";

const showMask = ref(false);
const inputValue = ref<string>("");
const _resolve = ref()

type popupConfigType = {
  title: string
  content?: string
  inputValue?: string,
  inputProps?: InputProps
  options: {
    label: string
    key: unknown
    type: 'default' | 'tertiary' | 'primary' | 'success' | 'info' | 'warning' | 'error'
  }[]
}

const popupConfig = ref<popupConfigType>()

const popup = async (config: popupConfigType) => {
  popupConfig.value = config
  inputValue.value = config.inputValue ?? ''
  showMask.value = true
  const key = await new Promise((resolve: (key: unknown) => unknown) => {
    _resolve.value = resolve
  })
  const text = inputValue.value
  showMask.value = false;
  nextTick(() => {
    inputValue.value = ''
    _resolve.value = undefined
  })
  return {
    text,
    key
  };
};

defineExpose({ popup });
</script>

<style scoped lang="scss">
.popup-card {
  width: 80%;

  .popup-input {
    margin-bottom: 10px;
  }

  .popup-button-container {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: flex-end;

    .popup-button-container-button {
      &:not(:last-child) {
        margin-right: 5px;
      }
    }
  }
}
</style>
