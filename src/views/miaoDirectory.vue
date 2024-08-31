<template>
  <miao-drop-handler @on-virtual-directory="handleDropVDirectory" @on-files="handleDropFiles"
    @on-virtual-files="handleDropVirtualFiles">
    <div class="miao-directory-item-container" ref="rootDomRef">
      <!-- 顶部面包屑导航和工具栏 -->
      <miao-directory-top :color="props.color" :current-directory="currentDirectory" @back="handleBack"
        :open-menu-option="topBarMenuOption" @reload="handleReload" @exit="emit('exit')" :index="index"
        @set-current-directory="setCurrentDirectory" @search="handleSearch" @menu-select="handleTopBarMenuSelect" />

      <!-- 文件和文件夹列表 -->
      <miao-directory-items ref='miaoDirectoryItemRef' :color="props.color" :showData_directory="showData_directory"
        :showData_files="showData_files" :selected-item="selectedItem.value" :index="index"
        @item-click="handleItemClick" @item-download="handleItemDownload" @item-delete="handleItemDelete"
        @item-drag-start="handleItemDragStart" @item-rename="handleItemRename" @item-select="handleItemSelect" />

      <!-- 底部工具栏 -->
      <miao-directory-bottom :index="index" @add-new-item="handleAddNewItem" v-if="false"
        @pick-files-upload="handlePickFilesUpload" />

      <miao-mask v-model:show="showModel"></miao-mask>
      <miao-popup-input ref="popupInput"></miao-popup-input>
    </div>
  </miao-drop-handler>
</template>

<script setup lang="ts">
import { computed, h, nextTick, onMounted, reactive, ref } from 'vue'
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory'
import Config from '@/config'
import useMiaoFetchApi from '@/hooks/useMiaoFetchApi'
import useDataBus from '@/hooks/useDataBus'
import useUploadQueue from '@/hooks/useUploadQueue'
import useVirtualPages from '@/hooks/useVirtualPages'
import { filePicker } from '@/hooks/miaoTools'
import { uniq } from 'lodash'

// 导入子组件
import MiaoDirectoryTop from '@/components/miaoDirectory/miaoDirectoryTop.vue'
import MiaoDirectoryItems from '@/components/miaoDirectory/miaoDirectoryItemsContainer.vue'
import MiaoDirectoryBottom from '@/components/miaoDirectory/miaoDirectoryBottom.vue'
import MiaoMask from '@/components/miaoMask.vue'
import MiaoPopupInput from '@/components/miaoPopupInput.vue'
import MiaoDropHandler from '@/components/miaoDropHandler.vue'
import { NIcon } from 'naive-ui'
import {
  CloseOutline, SearchOutline, FilterOutline, CheckmarkDoneOutline,
  DocumentText, ExtensionPuzzleOutline,
  FileTray,
  AddOutline,
  CloudUploadOutline
} from '@vicons/ionicons5'
import usePluginCenter from '@/hooks/usePluginCenter'

const { baseUrl, api } = Config
const dataBus = useDataBus()
const views = useVirtualPages()
const uploadQueue = useUploadQueue()
const miaoFetchApi = useMiaoFetchApi()
const pluginCenter = usePluginCenter()

const props = defineProps<{
  color: string
  id: number
}>()

const emit = defineEmits<{
  exit: []
}>()

const popupInput = ref<InstanceType<typeof MiaoPopupInput>>()
// 是否显示模态框
const showModel = ref(0)
const searchText = ref<string>('')
const showDirs = ref<boolean>(true)
const showFiles = ref<boolean>(true)
const miaoDirectoryItemRef = ref()

class SelectedItem {
  constructor() {
    this._selectedItem = []
  }
  _selectedItem: (VirtualDirectory | VirtualFile)[]
  push(item: VirtualDirectory | VirtualFile) {
    this._selectedItem = [item, ...this._selectedItem]
  }
  remove(item: VirtualDirectory | VirtualFile) {
    this._selectedItem = this._selectedItem.filter((v) => v !== item)
  }
  clear() {
    this._selectedItem = []
  }
  // 保证内容仍然存在于dir中且各个元素不重复
  get value() {
    const _filterList = [
      ...(currentDirectory.value?.directories ?? []),
      ...(currentDirectory.value?.files ?? []),
    ]
    return uniq(this._selectedItem).filter((v) => {
      if (currentDirectory.value === undefined) {
        return false
      }
      // @ts-ignore
      return _filterList.includes(v)
    })
  }
}
// 已选择的item，用于多选功能
const selectedItem = reactive(new SelectedItem())

const currentDirectories = defineModel<VirtualDirectory[]>('currentDirectories', {
  required: true,
})

// 目前展示的Dir
const currentDirectory = computed(() => {
  return currentDirectories.value[0]
})

// 当前组件在views中的序号
const index = computed(() => {
  return views.getIndex(props.id)
})

// 用于展示的数据，后续会增加排序等操作
const showData_directory = computed<VirtualDirectory[]>(() => {
  if (showDirs.value === false) {
    return []
  }
  let data = currentDirectory.value?.directories
    ? [...currentDirectory.value?.directories]
    : []
  if (searchText.value !== '') {
    data = data.filter(vd => vd.name.includes(searchText.value))
  }
  return data
})
const showData_files = computed<VirtualFile[]>(() => {
  if (showFiles.value === false) {
    return []
  }
  let data = currentDirectory.value?.files ? [...currentDirectory.value?.files] : []
  if (searchText.value !== '') {
    data = data.filter(vd => vd.name.includes(searchText.value))
  }
  return data
})

const topBarMenuOption = computed(() => {
  return [
    {
      label: '新建',
      key: 'create',
      icon: renderIcon(AddOutline)
    },
    {
      label: '上传',
      key: 'upload',
      icon: renderIcon(CloudUploadOutline)
    },
    {
      label: '搜索',
      key: 'search',
      icon: renderIcon(SearchOutline)
    },
    searchText.value !== '' ? {
      label: '重置搜索',
      key: 'searchReset',
      icon: renderIcon(SearchOutline)
    } : undefined,
    selectedItem.value.length !== 0 ? {
      label: '重置多选',
      key: 'selectedItemReset',
      icon: renderIcon(CheckmarkDoneOutline)
    } : undefined,
    {
      label: '筛选',
      key: 'filter',
      children: [
        {
          label: `${showDirs.value ? '隐藏' : '显示'}文件夹`,
          key: 'showDirs',
          icon: renderIcon(FileTray)
        },
        {
          label: `${showFiles.value ? '隐藏' : '显示'}文件`,
          key: 'showFiles',
          icon: renderIcon(DocumentText)
        },
      ],
      icon: renderIcon(FilterOutline)
    },
    {
      label: '插件',
      key: 'plugin',
      children: [
        ...pluginCenter.getUsablePlugin([currentDirectories.value[0]], []).map(v => ({
          label: `${v.name}`,
          key: `plugin:${v.key}`
        })),
      ],
      icon: renderIcon(ExtensionPuzzleOutline)
    },
    {
      label: '关闭',
      key: 'close',
      icon: renderIcon(CloseOutline)
    },
  ].filter(v => v !== undefined)
})

const renderIcon = (icon: any) => {
  return () => {
    return h(NIcon, null, {
      default: () => h(icon)
    })
  }
}

// 设置显示的dir
const setCurrentDirectory = async (virtualDirectory: VirtualDirectory) => {
  // 若没有缓存数据则同步刷新，有缓存数据则异步刷新
  if (virtualDirectory.files === undefined || virtualDirectory.directories === undefined) {
    await virtualDirectory.update()
  } else {
    virtualDirectory.update()
  }
  if (currentDirectories.value[0] !== virtualDirectory) {
    selectedItem.clear()
    handleSearchReset()
    nextTick(() => {
      miaoDirectoryItemRef.value.scrollTo({
        top: 0,
        behavior: "instant"
      })
    })
  }
  currentDirectories.value[0] = virtualDirectory
}

const reload = () => {
  setCurrentDirectory(currentDirectory.value)
}

const openUrl = (
  href: string,
  config?: {
    download?: string
    target?: string
  },
) => {
  let { target, download } = config ?? {}
  const a = document.createElement('a')
  a.setAttribute('href', href)
  a.setAttribute('target', target ?? '_blank')
  download && a.setAttribute('download', download)
  a.click()
}

const handleTopBarMenuSelect = (key: string) => {
  if (key === 'close') {
    emit('exit')
  } else if (key === 'search') {
    handleSearch()
  } else if (key === 'upload') {
    handlePickFilesUpload()
  } else if (key === 'create') {
    handleAddNewItem()
  } else if (key === 'searchReset') {
    handleSearchReset()
  } else if (key === 'selectedItemReset') {
    selectedItem.clear()
  } else if (key === 'showDirs') {
    showDirs.value = !showDirs.value
  } else if (key === 'showFiles') {
    showFiles.value = !showFiles.value
  } else if (key.startsWith('plugin:')) {
    const pluginName = key.split(':')[1]
    pluginCenter.usePlugin(pluginName, [currentDirectory.value], [])
  }
}

const handleBack = () => {
  if (currentDirectory.value?.parent) {
    setCurrentDirectory(currentDirectory.value.parent)
  }
}

const handleReload = () => {
  reload()
}

const handleItemClick = (item: VirtualDirectory | VirtualFile) => {
  if (selectedItem.value.length > 0) {
    handleItemSelect(item)
  } else {
    if (item.type === 'file') {
      openUrl(`${baseUrl}${api.get}${item.path}`)
    } else if (item.type === 'directory') {
      setCurrentDirectory(item)
    }
  }
}

const handleItemDownload = (item: VirtualFile) => {
  openUrl(`${baseUrl}${api.get}${item.path}`, {
    download: item.name,
  })
}

const handleItemDelete = async (_item: VirtualDirectory | VirtualFile) => {
  for (let item of uniq([...selectedItem.value, _item])) {
    ; (async () => {
      const { response } = miaoFetchApi.delete(item, {
        retry: 5,
      })
      // todo: 将删除事件统一用一个事件管理中心管理
      const id = (await response).eventId
      const { response: res } = miaoFetchApi.query(id)
      const eventResult = await res
      if (eventResult.status === 'success') {
        reload()
      }
    })()
  }
}

const handleItemRename = async (item: VirtualDirectory | VirtualFile) => {
  const popupRes = await popupInput.value?.popup({
    title: '重命名',
    inputValue: item.name,
    inputProps: {
      placeholder: item.name,
    },
    options: [
      {
        label: '取消',
        key: false,
        type: 'error',
      },
      {
        label: '确认',
        key: true,
        type: 'success',
      },
    ],
  })
  if (popupRes?.key === false) {
    return
  }
  const newName = popupRes?.text
  if (!newName) {
    return
  }
  const { response } = miaoFetchApi.rename(item, newName, {
    retry: 5,
  })
  const id = (await response).eventId
  const { response: res } = miaoFetchApi.query(id)
  const eventResult = await res
  if (eventResult.status === 'success') {
    reload()
  }
}

const handleItemDragStart = async (
  _event: DragEvent,
  item: VirtualDirectory | VirtualFile,
) => {
  const items = uniq([item, ...selectedItem.value])
  dataBus.set('dragData_vFiles', items.filter((v) => v.type === 'file'))
  dataBus.set('dragData_vDirectory', items.filter((v) => v.type === 'directory'))
  // selectedItem.clear()
}

const handleDropFiles = async (files: File[]) => {
  currentDirectory.value &&
    uploadQueue.push(files, currentDirectory.value, {
      onFinish() {
        reload()
      },
    })
}

const handleDropVDirectory = async (vDirs: VirtualDirectory[]) => {
  // 不能移到自己或自己的子文件夹内
  for (let vDir of vDirs) {
    if (currentDirectory.value.getParents.includes(vDir)) {
      return
    }
    if (vDir.parent === currentDirectory.value) {
      return
    }
  }
  for (let dir of vDirs) {
    ; (async () => {
      const _from = dir.parent
      const { response } = miaoFetchApi.cut(dir, currentDirectory.value)
      const id = (await response).eventId
      const { response: res } = miaoFetchApi.query(id)
      const eventResult = await res
      if (eventResult.status === 'success') {
        reload()
        _from && _from.update()
      }
    })()
  }
}

const handleDropVirtualFiles = (files: VirtualFile[]) => {
  if (files[0].parent === currentDirectory.value) {
    return
  }
  for (let file of files) {
    ; (async () => {
      const _from = file.parent
      const { response } = miaoFetchApi.cut(file, currentDirectory.value)
      const id = (await response).eventId
      const { response: res } = miaoFetchApi.query(id)
      const eventResult = await res
      if (eventResult.status === 'success') {
        reload()
        _from.update()
      }
    })()
  }
}

const handlePickFilesUpload = async () => {
  const files = await filePicker({
    multiple: true,
  })
  const _currDir = currentDirectory.value
  uploadQueue.push(files, _currDir, {
    onFinish() {
      _currDir.update()
    },
  })
}

const handleAddNewItem = async () => {
  const popupRes = await popupInput.value?.popup({
    title: '新建文件/文件夹',
    inputProps: {
      placeholder: '',
    },
    options: [
      {
        label: '取消',
        key: 'cancel',
        type: 'error',
      },
      {
        label: '文件',
        key: 'file',
        type: 'success',
      },
      {
        label: '文件夹',
        key: 'dir',
        type: 'success',
      },
    ],
  })
  // todo: 上传前如重名文件夹等等的错误提前检查
  if (popupRes?.key === 'cancel' || popupRes?.text === '') {
    return
  }
  const _currDir = currentDirectory.value
  const name = popupRes?.text
  if (!name) {
    return
  }
  // @ts-ignore
  const opType: 'file' | 'dir' = popupRes?.key
  if (opType === 'dir') {
    const res = await miaoFetchApi.mkdir(currentDirectory.value, name)
    if (res.message === 'success') {
      _currDir.update()
    }
  } else {
    const { response } = miaoFetchApi.mkFile(currentDirectory.value, name)
    const res = await response
    if (res.message === 'success') {
      _currDir.update()
    }
  }
}

const handleItemSelect = (item: VirtualDirectory | VirtualFile) => {
  if (!selectedItem.value.includes(item)) {
    selectedItem.push(item)
  } else {
    selectedItem.remove(item)
  }
}

const handleSearch = async () => {
  const popupRes = await popupInput.value?.popup({
    title: '搜索当前文件夹',
    inputValue: searchText.value,
    inputProps: {
      placeholder: '',
    },
    options: [
      {
        label: '取消',
        key: 'cancel',
        type: 'default',
      },
      {
        label: '重置',
        key: 'reset',
        type: 'default',
      },
      {
        label: '搜索',
        key: 'search',
        type: 'success',
      },
    ],
  })
  if (!popupRes) {
    return
  }
  if (popupRes.key === 'search') {
    searchText.value = popupRes.text
  } else if (popupRes.key === 'reset') {
    handleSearchReset()
  }
}

const handleSearchReset = () => {
  searchText.value = ''
}
onMounted(async () => {
  await setCurrentDirectory(currentDirectory.value)
})
</script>

<style scoped lang="scss">
$top-height: 30px;
$bottom-bar-height: 60px;

.miao-directory-item-container {
  position: relative;
  height: 100%;
  width: inherit;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 170px;
}
</style>