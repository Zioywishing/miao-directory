<template>
  <div class="chat-container">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="progress-container">
        <div class="progress-bar" :style="{ width: loadingProgress + '%' }"></div>
      </div>
      <p class="loading-percentage">{{ loadingProgress }}%</p>
      <p>{{ loadingState }}</p>
    </div>
    <div v-else class="chat-main">
      <div class="chat-history" ref="chatHistoryRef">
        <div v-for="(message, index) in chatHistory" :key="index"
          :class="['message', message.role === 'user' ? 'user-message' : 'ai-message']">
          <div class="message-content" v-if="message.role === 'user'">{{ message.content }}</div>
          <div class="message-content markdown-content" v-else v-html="renderMarkdown(message.content)"></div>
        </div>
        <!-- 实时生成的内容 -->
        <div v-if="generatingMessage" class="message ai-message">
          <div class="message-content markdown-content" v-html="renderMarkdown(currentGeneratedText)"></div>
          <div class="generating-indicator"><span>.</span><span>.</span><span>.</span></div>
        </div>
      </div>
      <div class="chat-input">
        <textarea v-model="userInput" @keydown.enter.prevent="sendMessage" placeholder="输入消息..."
          :disabled="processing"></textarea>
        <button @click="sendMessage" :disabled="processing || !userInput.trim()">
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VirtualDirectory, { VirtualFile } from '@/class/VirtualDirectory';
import { ref, watch, nextTick, onUnmounted } from 'vue';
import MarkdownIt from 'markdown-it';
import { FilesetResolver, LlmInference } from '@mediapipe/tasks-genai';
import VirtualPage from '@/class/VirtualPage';

const currentFiles = defineModel<VirtualFile[]>('currentFiles', {
  required: true
});

const currentDirectories = defineModel<VirtualDirectory[]>(
  'currentDirectories',
  {
    required: true
  }
)

const props = defineProps<{
  view: VirtualPage
}>()

// 初始化MarkdownIt
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

// 状态管理
const loading = ref(true);
const loadingState = ref('正在初始化模型...');
const loadingProgress = ref(0);
const processing = ref(false);
const userInput = ref('');
const chatHistory = ref<{ role: string, content: string }[]>([]);
const chatHistoryRef = ref<HTMLElement | null>(null);
const llmInstance = ref<any>(null);

const generatingMessage = ref(false);
const currentGeneratedText = ref('');

const updateLoadingProgress = (progress: number, state: string) => {
  loadingProgress.value = progress;
  loadingState.value = state;
};

const renderMarkdown = (text: string) => {
  return md.render(text);
};

const initializeModel = async () => {
  if (!currentFiles.value || currentFiles.value.length === 0) {
    loadingState.value = '错误：未找到模型文件';
    return;
  }

  try {
    const modelFile = currentFiles.value[0];
    const modelName = modelFile.name.split('.model.bin')[0] && modelFile.name.split('.model.task')[0];

    updateLoadingProgress(5, '正在加载MediaPipe LLM引擎...');

    const simulateDownloadProgress = () => {
      const totalTime = 2000; // 2秒
      const interval = 100; // 每100毫秒更新一次
      const steps = totalTime / interval;
      const incrementPerStep = 15 / steps; // 从5%到20%

      let currentStep = 0;
      const timer = setInterval(() => {
        if (currentStep >= steps) {
          clearInterval(timer);
          return;
        }

        loadingProgress.value = Math.min(20, 5 + currentStep * incrementPerStep);
        currentStep++;
      }, interval);
    };

    simulateDownloadProgress();

    updateLoadingProgress(20, '正在初始化MediaPipe文件解析器...');
    const genai = await FilesetResolver.forGenAiTasks(
      currentDirectories.value[0]?.url ?? "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm"
    );
    updateLoadingProgress(40, '正在加载模型文件...');

    const simulateModelLoadingProgress = () => {
      const totalTime = 3000; // 3秒
      const interval = 100; // 每100毫秒更新一次
      const steps = totalTime / interval;
      const incrementPerStep = 45 / steps; // 从40%到85%

      let currentStep = 0;
      const timer = setInterval(() => {
        if (currentStep >= steps) {
          clearInterval(timer);
          return;
        }

        loadingProgress.value = Math.min(85, 40 + currentStep * incrementPerStep);
        currentStep++;
      }, interval);
    };

    simulateModelLoadingProgress();

    llmInstance.value = await LlmInference.createFromOptions(genai, {
      baseOptions: {
        modelAssetPath: modelFile.url
      },
      maxTokens: 2048,
      temperature: 0.7
    });

    updateLoadingProgress(90, '初始化对话...');

    await new Promise(resolve => setTimeout(resolve, 500));

    updateLoadingProgress(100, '加载完成！');

    await new Promise(resolve => setTimeout(resolve, 300));

    loading.value = false;
    chatHistory.value.push({
      role: 'assistant',
      content: `您好！我是${modelName}，有什么可以帮助您的？`
    });
  } catch (error) {
    console.error('模型加载失败:', error);
    loadingState.value = `模型加载失败: ${error instanceof Error ? error.message : String(error)}`;
    loadingProgress.value = 0;
  }
};

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || processing.value) return;

  const userMessage = userInput.value.trim();
  userInput.value = '';

  // 添加用户消息到历史
  chatHistory.value.push({
    role: 'user',
    content: userMessage
  });

  processing.value = true;
  generatingMessage.value = true;
  currentGeneratedText.value = '';

  try {
    // 滚动到底部
    await nextTick();
    scrollToBottom();

    // 构建提示词（包含历史对话）
    // const history = chatHistory.value
    //   .map(msg => `${msg.role === 'user' ? '用户' : 'AI'}：${msg.content}`)
    //   .join('\n\n');
    // const prompt = history + '\n\n用户：' + userMessage + '\n\nAI：';

    // 使用MediaPipe生成回复
    llmInstance.value.generateResponse(
      userMessage,
      null, // 不使用LoRA模型
      (partialResult: string, done: boolean) => {
        // 累加部分结果并更新UI
        currentGeneratedText.value += partialResult;
        const banStart = [',', '，']
        for (const ban of banStart) {
          if (currentGeneratedText.value.startsWith(ban)) {
            currentGeneratedText.value = currentGeneratedText.value.slice(1)
          }
        }

        // 滚动到底部以显示最新内容
        nextTick().then(scrollToBottom);

        if (done) {
          // 添加完整回复到历史
          chatHistory.value.push({
            role: 'assistant',
            content: currentGeneratedText.value
          });

          // 重置生成状态
          generatingMessage.value = false;
          processing.value = false;
          currentGeneratedText.value = '';

          nextTick().then(scrollToBottom);
        }
      }
    );
  } catch (error) {
    console.error('生成回复出错:', error);

    // 添加错误信息
    chatHistory.value.push({
      role: 'assistant',
      content: `抱歉，生成回复时出现错误: ${error instanceof Error ? error.message : String(error)}`
    });

    // 重置状态
    generatingMessage.value = false;
    processing.value = false;
    currentGeneratedText.value = '';

    nextTick().then(scrollToBottom);
  }
};

// 滚动到聊天历史底部
const scrollToBottom = () => {
  if (chatHistoryRef.value) {
    chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
  }
};

// 清理资源函数
const cleanupResources = () => {
  // 如果正在进行推理，停止推理过程
  if (processing.value || generatingMessage.value) {
    // 标记处理完成，停止状态更新
    processing.value = false;
    generatingMessage.value = false;
    console.log('组件卸载：已停止正在进行的文本生成');
  }

  // 释放LLM实例资源
  if (llmInstance.value) {
    const releaseResources = async () => {
      try {
        // 调用模型实例的清理方法（如果有）
        if (typeof llmInstance.value.close === 'function') {
          llmInstance.value.close();
        }
        // 置空实例引用
        llmInstance.value = null;
        console.log('组件卸载：已释放模型资源');
      } catch (error) {
        console.error('释放模型资源时出错:', error);
        setTimeout(() => {
          releaseResources();
        }, 1000);
      }
    }
    releaseResources();
  }
};

onMounted(() => {
  props.view.setTitle('LLM Demo')
})

// 在组件卸载时清理资源
onUnmounted(() => {
  cleanupResources();
});

// 监听模型文件变化
watch(() => currentFiles.value, () => {
  if (currentFiles.value && currentFiles.value.length > 0) {
    initializeModel();
  }
}, { immediate: true });
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #f5f5f5;
  overflow: hidden;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.progress-container {
  width: 80%;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #1e88e5, #64b5f6);
  transition: width 0.3s ease;
  border-radius: 10px;
}

.loading-percentage {
  font-size: 18px;
  font-weight: bold;
  color: #1e88e5;
  margin-bottom: 10px;
}

.chat-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  max-width: 85%;
  padding: 10px 16px;
  border-radius: 18px;
  word-break: break-word;
}

.user-message {
  align-self: flex-end;
  background-color: #1e88e5;
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-message {
  align-self: flex-start;
  background-color: #e0e0e0;
  color: #333;
  border-bottom-left-radius: 4px;
}

.markdown-content :deep(p) {
  margin: 0.5em 0;
}

.markdown-content :deep(pre) {
  background-color: #f0f0f0;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-content :deep(code) {
  background-color: #f0f0f0;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  margin: 1em 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #ddd;
  padding: 4px 8px;
}

.markdown-content :deep(blockquote) {
  margin: 0.5em 0;
  padding-left: 1em;
  border-left: 4px solid #ddd;
  color: #555;
}

.generating-indicator {
  display: inline-block;
  margin-left: 5px;
}

.generating-indicator span {
  display: inline-block;
  animation: blink 1.4s infinite both;
}

.generating-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.generating-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0% {
    opacity: 0.2;
  }

  20% {
    opacity: 1;
  }

  100% {
    opacity: 0.2;
  }
}

.chat-input {
  display: flex;
  padding: 10px;
  background-color: white;
  border-top: 1px solid #e0e0e0;
}

.chat-input textarea {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px;
  resize: none;
  height: 60px;
  font-family: inherit;
  font-size: 14px;
}

.chat-input button {
  margin-left: 10px;
  background-color: #1e88e5;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0 20px;
  cursor: pointer;
  font-weight: bold;
}

.chat-input button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>