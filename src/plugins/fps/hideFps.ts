// 引入共享变量
import { fpsElement, animationFrameId, setFpsElement, setAnimationFrameId } from '../fps/shared';

const hideFps = () => {
  // 停止帧率计算
  if (animationFrameId.value !== null) {
    cancelAnimationFrame(animationFrameId.value);
    setAnimationFrameId(null);
  }
  
  // 移除FPS显示元素
  if (fpsElement.value) {
    document.body.removeChild(fpsElement.value);
    setFpsElement(null);
  }
};

export default hideFps; 