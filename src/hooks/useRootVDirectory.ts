import VirtualDirectory from "@/class/VirtualDirectory";
import { reactive } from "vue";

const root = reactive(
    new VirtualDirectory({
        name: '根目录',
        stats: {
            atimeMs: 0,
            birthtimeMs: 0,
            ctimeMs: 0,
            mtimeMs: 0
        }
    })
)
export default function useRootVDirectory() {
    return root;
}