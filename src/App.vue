<script setup lang="ts">
import { NBreadcrumbItem, NBreadcrumb } from 'naive-ui'
import type { stats, file, directory } from '@/types/type.ts'
import VirtualDirectory from '@/class/virtualDirectory';
// import test from './hooks/test.ts';

const testData: string[] = ['111', '222', '333']

</script>

<template>
  <n-breadcrumb separator=">">
    <n-breadcrumb-item v-for="(title, index) in testData">
      {{ title }}
    </n-breadcrumb-item>
  </n-breadcrumb>
    <div>miao</div>
</template>

<style scoped></style>
