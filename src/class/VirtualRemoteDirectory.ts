import { file, directory } from "@/types/type";
import { VirtualFileBase, VirtualDirectoryBase } from "./VirtualDirectory";
import useMiaoFetchApi from "@/hooks/useMiaoFetchApi";
import config from '@/config'

const miaoFetchApi = useMiaoFetchApi()

export class VirtualRemoteFile extends VirtualFileBase {
    constructor(info: file, parent: VirtualDirectoryBase) {
        super(info.name, info.size, info.stats, parent)
    }

    get url() {
        return `${config.api.get}${this.parent.path}${this.name}`
    }

    async delete(): Promise<boolean> {
        try {
            const { response } = miaoFetchApi.delete(this, {
                retry: 5
            });
            const id = (await response).eventId;
            const { response: res } = miaoFetchApi.query(id);
            const eventResult = await res;
            return eventResult.status === 'success';
        } catch (error) {
            console.error('删除文件失败:', error);
            return false;
        }
    }

    async rename(newName: string): Promise<boolean> {
        if (!newName) {
            return false;
        }

        try {
            const { response } = miaoFetchApi.rename(this, newName, {
                retry: 5
            });
            const id = (await response).eventId;
            const { response: res } = miaoFetchApi.query(id);
            const eventResult = await res;
            return eventResult.status === 'success';
        } catch (error) {
            console.error('重命名文件失败:', error);
            return false;
        }
    }

    async moveTo(targetDir: VirtualDirectoryBase): Promise<boolean> {
        if (this.parent === targetDir) {
            return false; // 已经在目标目录中
        }

        try {
            const _from = this.parent;
            const { response } = miaoFetchApi.cut(this, targetDir);
            const id = (await response).eventId;
            const { response: res } = miaoFetchApi.query(id);
            const eventResult = await res;
            const success = eventResult.status === 'success';

            if (success) {
                _from.update();
            }

            return success;
        } catch (error) {
            console.error('移动文件失败:', error);
            return false;
        }
    }
}

export class VirtualRemoteDirectory extends VirtualDirectoryBase {
    constructor(info: directory, parent?: VirtualDirectoryBase) {
        super(info.name, info.stats, parent)
    }

    get url(): string {
        return `${config.api.get}${this.path}/`
    }

    updateContent(content: (file | directory)[]) {
        this._isUpdated = true

        // 创建名称到内容项的映射，O(n)
        const contentMap = new Map<string, file | directory>();
        content.forEach(item => contentMap.set(item.name, item));

        // 使用Set存储所有内容项的名称，用于O(1)查找，O(n)
        const itemNamesSet = new Set(content.map(v => v.name));

        // 删除不再存在的文件和目录，O(m)
        this.files = this.files.filter(file => itemNamesSet.has(file.name));
        this.directories = this.directories.filter(dir => itemNamesSet.has(dir.name));

        // 创建现有文件和目录的名称集合，O(m)
        const existingFileNames = new Set(this.files.map(file => file.name));
        const existingDirNames = new Set(this.directories.map(dir => dir.name));

        // 添加新文件和目录，O(n)
        content.forEach(item => {
            // 如果是文件且不存在于现有文件中
            if (item.type === 'file' && !existingFileNames.has(item.name)) {
                const nvf = new VirtualRemoteFile(item as file, this);
                this.files.push(nvf);
            }
            // 如果是目录且不存在于现有目录中
            else if (item.type === 'directory' && !existingDirNames.has(item.name)) {
                const nvd = new VirtualRemoteDirectory(item as directory, this);
                this.directories.push(nvd);
            }
        });
    }

    async update(): Promise<void> {
        const data: (file | directory)[] = await miaoFetchApi.get(this)
        this.updateContent(data)
    }

    async delete(): Promise<boolean> {
        try {
            const { response } = miaoFetchApi.delete(this, {
                retry: 5
            });
            const id = (await response).eventId;
            const { response: res } = miaoFetchApi.query(id);
            const eventResult = await res;
            return eventResult.status === 'success';
        } catch (error) {
            console.error('删除目录失败:', error);
            return false;
        }
    }

    async rename(newName: string): Promise<boolean> {
        if (!newName) {
            return false;
        }

        try {
            const { response } = miaoFetchApi.rename(this, newName, {
                retry: 5
            });
            const id = (await response).eventId;
            const { response: res } = miaoFetchApi.query(id);
            const eventResult = await res;
            return eventResult.status === 'success';
        } catch (error) {
            console.error('重命名目录失败:', error);
            return false;
        }
    }

    async mv(targetDir: VirtualDirectoryBase): Promise<boolean> {
        // 不能移动到自己或自己的子目录
        if (targetDir === this || this.getParents.includes(targetDir as VirtualDirectoryBase)) {
            return false;
        }

        if (this.parent === targetDir) {
            return false; // 已经在目标目录中
        }

        try {
            const _from = this.parent;
            const { response } = miaoFetchApi.cut(this, targetDir);
            const id = (await response).eventId;
            const { response: res } = miaoFetchApi.query(id);
            const eventResult = await res;
            const success = eventResult.status === 'success';

            if (success && _from) {
                _from.update();
            }

            return success;
        } catch (error) {
            console.error('移动目录失败:', error);
            return false;
        }
    }
}
