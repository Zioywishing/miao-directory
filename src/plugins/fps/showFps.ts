import { fpsElement, setFpsElement, setAnimationFrameId } from '../fps/shared';

// const frameArr = new Array<number>(0)
let lastTime: number = 0

const createFpsElement = () => {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.top = '10px';
    el.style.left = '10px';
    el.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    el.style.pointerEvents = 'none';
    el.style.userSelect = 'none';
    el.style.color = 'green';
    el.style.padding = '5px 10px';
    el.style.borderRadius = '4px';
    el.style.fontFamily = 'monospace';
    el.style.fontSize = '14px';
    el.style.zIndex = '9999';
    document.body.appendChild(el);
    return el;
};

const calculateFps = () => {
    // const range = 1000
    // const curr = new Date()
    // frameArr.push(curr.getTime())
    // while (frameArr[0] < curr.getTime() - range) {
    //     frameArr.shift()
    // }
    // const fps = Math.floor(frameArr.length / range * 1000)
    // if (fpsElement.value) {
    //     fpsElement.value.textContent = `FPS: ${fps}`;
    // }
    // const id = requestAnimationFrame(calculateFps);
    // setAnimationFrameId(id);
    const curr = new Date()
    const fps = Math.floor(1000 / (curr.getTime() - lastTime))
    if (fpsElement.value && lastTime !== 0) {
        fpsElement.value.textContent = `FPS: ${fps}`;
    }
    lastTime = curr.getTime()
    const id = requestAnimationFrame(calculateFps);
    setAnimationFrameId(id);
};

const showFps = () => {
    if (fpsElement.value) return;

    const el = createFpsElement();
    setFpsElement(el);

    const id = requestAnimationFrame(calculateFps);
    setAnimationFrameId(id);
};

export default showFps; 