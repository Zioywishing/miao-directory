<template>
  <n-scrollbar>
    <div class="miao-markdown-container-miaomiaomiao" v-html="renderedMarkdown"></div>
    <div style="height: 50px; width: 100%;"></div>
  </n-scrollbar>
</template>

<script setup lang="ts">
import { NScrollbar } from 'naive-ui';
import { VirtualFile } from '@/class/VirtualDirectory'
import { onMounted, ref } from 'vue'
import MarkdownIt from 'markdown-it'
import useMiaoFetchApi from '@/hooks/useMiaoFetchApi';


    const decoder = new TextDecoder('utf-8');

const miaoFetchApi = useMiaoFetchApi()

const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
  required: true
})

const markdownSrc = ref<string>()
const renderedMarkdown = ref<string>('')

const md = new MarkdownIt()

onMounted(async () => {
  markdownSrc.value = currentFiles.value[0].url
  const text = decoder.decode(await(miaoFetchApi.getFile(currentFiles.value[0])).response)
  renderedMarkdown.value = md.render(text)
})
</script>

<style lang="scss">
.miao-markdown-container-miaomiaomiao {
  width: 95%;
  margin: 20px;

  table,
  td,
  th {
    border: 1px solid #ddd;
    text-align: left;
  }

  table {
    border-collapse: collapse;
    margin-bottom: 20px;
  }

  th,
  td {
    padding: 15px;
  }

  tr:nth-child(even) {
    background-color: #f2f2f2
  }

  th {
    background-color: #04AA6D;
    color: white;
  }
}
</style>