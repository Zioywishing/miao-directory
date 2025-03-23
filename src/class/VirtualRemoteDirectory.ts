import { file, directory } from "@/types/type";
import { VirtualFileBase, VirtualDirectoryBase } from "./VirtualDirectory";
import useMiaoFetchApi from "@/hooks/useMiaoFetchApi";
import config from '@/config'

const miaoFetchApi = useMiaoFetchApi()

/**
 * 轮询事件直到完成
 * @param eventId 事件ID
 * @param maxRetries 最大重试次数
 * @param interval 轮询间隔(毫秒)
 * @returns 事件结果
 */
async function pollEventUntilComplete(eventId: number, maxRetries = 100, interval = 300) {
    let _count = 0;
    while (_count < maxRetries) {
        try {
            const { response } = miaoFetchApi.query(eventId);
            const result = await response;
            if (result.status === 'success' || result.status === 'failed') {
                return result;
            }
            _count++;
            await new Promise(_ => setTimeout(_, interval));
        } catch (error) {
            throw error;
        }
    }
    throw new Error('poll timeout');
}

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
            
            const eventResult = await pollEventUntilComplete(id);
            
            if (eventResult.status === 'success' && this.parent) {
                await this.parent.update(); // 操作成功后更新父目录
            }
            
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
            
            const eventResult = await pollEventUntilComplete(id);
            
            if (eventResult.status === 'success' && this.parent) {
                await this.parent.update(); // 操作成功后更新父目录
            }
            
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
            
            const eventResult = await pollEventUntilComplete(id);
            const success = eventResult.status === 'success';

            if (success) {
                if (_from) await _from.update(); // 更新源目录
                await targetDir.update(); // 更新目标目录
            }

            return success;
        } catch (error) {
            console.error('移动文件失败:', error);
            return false;
        }
    }

    async copyTo(targetDir: VirtualDirectoryBase): Promise<boolean> {
        // 检查目标目录是否已存在同名文件
        const existingFile = targetDir.files.find(file => file.name === this.name);
        if (existingFile) {
            // 存在同名文件，拒绝操作并显示提示
            console.error(`目标目录已存在同名文件: ${this.name}`);
            alert(`复制失败：目标目录已存在同名文件"${this.name}"`);
            return false;
        }

        try {
            const { response } = miaoFetchApi.copy(this, targetDir);
            const id = (await response).eventId;
            
            const eventResult = await pollEventUntilComplete(id);
            const success = eventResult.status === 'success';

            if (success) {
                await targetDir.update(); // 更新目标目录
            }

            return success;
        } catch (error) {
            console.error('复制文件失败:', error);
            return false;
        }
    }
}

export class VirtualRemoteDirectory extends VirtualDirectoryBase {
    constructor(info: directory, parent?: VirtualDirectoryBase) {
        super(info.name, info.stats, parent)
    }

    get url(): string {
        return `${config.api.get}${this.path}`
    }

    updateContent(content: (file | directory)[]) {
        this._isUpdated = true

        const files = content.filter(item => item.type === 'file') as file[];
        const directories = content.filter(item => item.type === 'directory') as directory[];

        this.diffFiles(files);
        this.diffDirectories(directories);
    }

    /**
     * 文件diff算法，类似Vue的diff
     * @param newFiles 新文件列表
     */
    private diffFiles(newFiles: file[]) {
        if (this.files.length === 0) {
            this.files = newFiles.map(file => new VirtualRemoteFile(file, this));
            return;
        }

        const oldFiles = [...this.files];
        const newFilesList: VirtualRemoteFile[] = [];
        
        const oldKeyMap = new Map<string, VirtualRemoteFile>();
        oldFiles.forEach(file => oldKeyMap.set(file.name, file as VirtualRemoteFile));
        
        for (let i = 0; i < newFiles.length; i++) {
            const newFile = newFiles[i];
            const key = newFile.name;
            
            const oldFile = oldKeyMap.get(key);
            
            if (oldFile) {
                oldFile.size = newFile.size;
                oldFile.stats = newFile.stats;
                newFilesList.push(oldFile);
                // 从旧映射中删除，表示已处理
                oldKeyMap.delete(key);
            } else {
                newFilesList.push(new VirtualRemoteFile(newFile, this));
            }
        }
        
        this.files = newFilesList;
    }

    /**
     * 目录diff算法，类似Vue的diff
     * @param newDirs 新目录列表
     */
    private diffDirectories(newDirs: directory[]) {
        if (this.directories.length === 0) {
            this.directories = newDirs.map(dir => new VirtualRemoteDirectory(dir, this));
            return;
        }

        const oldDirs = [...this.directories];
        const newDirsList: VirtualRemoteDirectory[] = [];
        
        const oldKeyMap = new Map<string, VirtualRemoteDirectory>();
        oldDirs.forEach(dir => oldKeyMap.set(dir.name, dir as VirtualRemoteDirectory));
        
        for (let i = 0; i < newDirs.length; i++) {
            const newDir = newDirs[i];
            const key = newDir.name;
            
            const oldDir = oldKeyMap.get(key);
            
            if (oldDir) {
                oldDir.stats = newDir.stats;
                newDirsList.push(oldDir);
                oldKeyMap.delete(key);
            } else {
                newDirsList.push(new VirtualRemoteDirectory(newDir, this));
            }
        }
        
        this.directories = newDirsList;
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
            
            const eventResult = await pollEventUntilComplete(id);
            
            if (eventResult.status === 'success' && this.parent) {
                await this.parent.update(); // 操作成功后更新父目录
            }
            
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
            
            const eventResult = await pollEventUntilComplete(id);
            
            if (eventResult.status === 'success' && this.parent) {
                await this.parent.update(); // 操作成功后更新父目录
            }
            
            return eventResult.status === 'success';
        } catch (error) {
            console.error('重命名目录失败:', error);
            return false;
        }
    }

    async mv(targetDir: VirtualDirectoryBase): Promise<boolean> {
        if (targetDir === this || targetDir.getParents.includes(this)) {
            return false;
        }

        if (this.parent === targetDir) {
            return false; // 已经在目标目录中
        }

        try {
            const _from = this.parent;
            const { response } = miaoFetchApi.cut(this, targetDir);
            const id = (await response).eventId;
            
            const eventResult = await pollEventUntilComplete(id);
            const success = eventResult.status === 'success';

            if (success) {
                if (_from) await _from.update(); // 更新源目录
                await targetDir.update(); // 更新目标目录
            }

            return success;
        } catch (error) {
            console.error('移动目录失败:', error);
            return false;
        }
    }

    async copy(targetDir: VirtualDirectoryBase): Promise<boolean> {
        if (targetDir === this || targetDir.getParents.includes(this)) {
            return false;
        }

        // 检查目标目录是否已存在同名目录
        const existingDir = targetDir.directories.find(dir => dir.name === this.name);
        if (existingDir) {
            // 存在同名目录，拒绝操作并显示提示
            console.error(`目标位置已存在同名目录: ${this.name}`);
            alert(`复制失败：目标位置已存在同名目录"${this.name}"`);
            return false;
        }

        console.log(this.parent, targetDir, this)

        try {
            const { response } = miaoFetchApi.copy(this, targetDir);
            const id = (await response).eventId;
            
            const eventResult = await pollEventUntilComplete(id);
            const success = eventResult.status === 'success';

            if (success) {
                // 不需要更新源目录，因为复制不会改变源目录
                await targetDir.update(); // 更新目标目录
            }

            return success;
        } catch (error) {
            console.error('复制目录失败:', error);
            return false;
        }
    }
}
