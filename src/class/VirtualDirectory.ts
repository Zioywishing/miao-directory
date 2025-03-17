import generateId from '@/utils/generateId'
import type { stats, file, directory } from '@/types/type.ts'


// const vDirectoryMap = new Map<string, VirtualDirectory>()
// const vFileMap = new Map<string, VirtualFile>()

export interface Tree {
   name: string
   type: 'directory'
   path: string
   stats: stats
   files: {
      name: string
      type: 'file'
      size: number
      stats: stats
      url: string
   }[]
   directories: Tree[]
}

export abstract class VirtualFileBase {
   name: string
   type: 'file' = 'file'
   size: number
   stats: stats
   parent: VirtualDirectoryBase
   id: number
   storage: { [key: string]: any } = {}

   constructor(name: string, size: number, stats: stats, parent: VirtualDirectoryBase) {
      this.name = name
      this.size = size
      this.stats = stats
      this.parent = parent
      this.id = generateId()
   }

   get path() {
      return `${this.parent.path}${this.name}`
   }

   abstract get url(): string;
   
   /**
    * 删除文件
    * @returns {Promise<boolean>} 删除是否成功
    */
   abstract delete(): Promise<boolean>;
   
   /**
    * 重命名文件
    * @param {string} newName 新文件名
    * @returns {Promise<boolean>} 重命名是否成功
    */
   abstract rename(newName: string): Promise<boolean>;
   
   /**
    * 移动文件到目标目录
    * @param {VirtualDirectoryBase} targetDir 目标目录
    * @returns {Promise<boolean>} 移动是否成功
    */
   abstract moveTo(targetDir: VirtualDirectoryBase): Promise<boolean>;
}

export abstract class VirtualDirectoryBase {
   // 文件夹名
   name: string
   // 子文件
   files: VirtualFileBase[] = []
   // 子目录
   directories: VirtualDirectoryBase[] = []
   // 没啥意义，标注一下就是了
   type: 'directory' = 'directory'
   // 文件夹创建时间等杂项属性
   stats: stats
   // 父文件夹
   parent?: VirtualDirectoryBase

   _isUpdated: boolean = false

   id: number

   // 用来存储一些标记信息啥的
   storage: { [key: string]: any } = {}

   constructor(name: string, stats: stats, parent?: VirtualDirectoryBase) {
      this.name = name
      this.stats = stats
      this.parent = parent
      this.id = generateId()
   }

   /**
    * 获取相对于根目录的路径的层数
    * 用于目录下文件定位
    * @returns {string}
    */
   get layer(): number {
      return this.parent ? this.parent.layer + 1 : 0
   }
   
   /**
    * 相对于根目录的路径， 如: "/",  "/123/321/"
    * 用于目录下文件定位
    * @returns {string}
    */
   get path(): string {
      if (!this.parent) {
         return '/'
      }
      return `${this.parent.path}${this.name}/`
   }

   abstract get url(): string;

   /**
    * 获取从根目录开始的按顺序的文件夹
    * @returns {VirtualDirectoryBase[]}
    */
   get getParents(): VirtualDirectoryBase[] {
      if (!this.parent) {
         return [this]
      }
      return [...this.parent.getParents, this]
   }

   /**
    * 获取当前文件夹是否已经请求过至少一次数据
    */
   get isUpdated() {
      return this._isUpdated
   }

   /**
    * 获取 layer 级父文件夹, 如getParent(1)就返回父级
    * @param {number} layer 需要跳转的层数
    * @returns {VirtualDirectoryBase}
    */
   getParent(layer: number): VirtualDirectoryBase {
      if (layer <= 0 || !this.parent) {
         return this
      }
      return this.parent.getParent(layer - 1)
   }

   get tree(): Tree {
      return {
         name: this.name,
         type: this.type,
         path: this.path,
         stats: this.stats,
         files:
            this.files?.map((v) => ({
               name: v.name,
               type: v.type,
               size: v.size,
               stats: v.stats,
               url: v.url
            })) ?? [],
         directories: this.directories?.map((v) => v.tree) ?? []
      }
   }

   hasChild(item: VirtualDirectoryBase | VirtualFileBase): boolean {
      if (item.type === 'directory') {
         return this.directories?.includes(item as VirtualDirectoryBase) ?? false
      } else {
         return this.files?.includes(item as VirtualFileBase) ?? false
      }
   }

   abstract updateContent(content: (file | directory)[]): void;
   abstract update(): Promise<void>;
   
   /**
    * 删除目录
    * @returns {Promise<boolean>} 删除是否成功
    */
   abstract delete(): Promise<boolean>;
   
   /**
    * 重命名目录
    * @param {string} newName 新目录名
    * @returns {Promise<boolean>} 重命名是否成功
    */
   abstract rename(newName: string): Promise<boolean>;
   
   /**
    * 移动目录到目标目录
    * @param {VirtualDirectoryBase} targetDir 目标目录
    * @returns {Promise<boolean>} 移动是否成功
    */
   abstract mv(targetDir: VirtualDirectoryBase): Promise<boolean>;
}

export abstract class VirtualFile extends VirtualFileBase {}
export abstract class VirtualDirectory extends VirtualDirectoryBase {}

export default VirtualDirectory
