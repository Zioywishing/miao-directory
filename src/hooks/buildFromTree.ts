import VirtualDirectory, { Tree, VirtualFile } from "@/class/VirtualDirectory";

/**
 * 通过VirtualDirectory的.tree重建文件夹树
 * @param {any} data:Tree
 * @returns {any}
 */
const buildFromTree = (data: Tree) => {
    const root = new VirtualDirectory(data)
    root.files = data.files?.map(v=>new VirtualFile(v, root))
    root.directories = data.directories?.map(v=>buildFromTree(v))
    return root
}

export default buildFromTree;