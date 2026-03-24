// TimeLens 柔性干预 Content Script
import './content.css';

// 确保只注入一次
if (!(window as any).__TIMELENS_INJECTED) {
  (window as any).__TIMELENS_INJECTED = true;

  // 当前干预类型
  let currentInterventionType = 'domain';
  let restTimer: number | null = null;

  // 创建遮罩层容器
  const createOverlay = (message: string, type: string) => {
    // 检查是否已存在
    if (document.getElementById('timelens-intervention-overlay')) return;
    
    currentInterventionType = type;

    const overlay = document.createElement('div');
    overlay.id = 'timelens-intervention-overlay';
    
    // 应用内联样式以确保不受宿主网站样式污染 (同时使用 shadow DOM 可以更好隔离，这里为简单直观直接用内联)
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: '999999999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      opacity: '0',
      transition: 'opacity 0.8s ease-in-out' // 柔性渐显
    });

    // 提示卡片 HTML
    overlay.innerHTML = `
      <div style="
        background: white;
        padding: 40px;
        border-radius: 24px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        text-align: center;
        max-width: 400px;
        border: 1px solid #f0f0f0;
        transform: translateY(20px);
        transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      " id="timelens-card">
        <div style="font-size: 48px; margin-bottom: 16px;">🌱</div>
        <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 24px; font-weight: 700;">该休息一下了</h2>
        <p style="color: #4B5563; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
          ${message}
        </p>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button id="tl-btn-rest" style="
            background: #10B981;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          ">休息 5 分钟</button>
          <button id="tl-btn-extend" style="
            background: #F3F4F6;
            color: #4B5563;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          ">再延长 30 分钟</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // 触发动画
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      const card = document.getElementById('timelens-card');
      if (card) card.style.transform = 'translateY(0)';
    });

    // 绑定事件
    const btnRest = document.getElementById('tl-btn-rest');
    const btnExtend = document.getElementById('tl-btn-extend');

    if (btnRest) {
      btnRest.addEventListener('mouseenter', () => btnRest.style.backgroundColor = '#059669');
      btnRest.addEventListener('mouseleave', () => btnRest.style.backgroundColor = '#10B981');
      btnRest.addEventListener('click', handleRest);
    }

    if (btnExtend) {
      btnExtend.addEventListener('mouseenter', () => btnExtend.style.backgroundColor = '#E5E7EB');
      btnExtend.addEventListener('mouseleave', () => btnExtend.style.backgroundColor = '#F3F4F6');
      btnExtend.addEventListener('click', handleExtend);
    }
  };

  const removeOverlay = () => {
    if (restTimer) {
      clearInterval(restTimer);
      restTimer = null;
    }
    const overlay = document.getElementById('timelens-intervention-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 800);
    }
  };

  // UI 更新：进入休息状态
  const startRestUI = (timeLeft: number) => {
    const btnRest = document.getElementById('tl-btn-rest');
    const btnExtend = document.getElementById('tl-btn-extend');
    
    if (btnRest) {
      btnRest.style.opacity = '0.7';
      btnRest.style.cursor = 'not-allowed';
      // 移除原有的悬停变色事件（简单处理，直接改背景）
      btnRest.style.backgroundColor = '#10B981'; 
    }
    
    if (btnExtend) {
      btnExtend.style.opacity = '0.5';
      btnExtend.style.pointerEvents = 'none';
    }

    if (restTimer) clearInterval(restTimer);

    let currentLeft = timeLeft;
    
    const updateBtnText = () => {
      if (btnRest) {
        const m = Math.floor(currentLeft / 60);
        const s = (currentLeft % 60).toString().padStart(2, '0');
        btnRest.innerText = `休息中... (${m}:${s})`;
      }
    };

    updateBtnText();

    restTimer = window.setInterval(() => {
      currentLeft--;
      updateBtnText();

      if (currentLeft <= 0) {
        if (restTimer) clearInterval(restTimer);
        removeOverlay();
        // 倒计时结束，通知后台
        chrome.runtime.sendMessage({ action: 'REST_COMPLETED', type: currentInterventionType });
      }
    }, 1000);
  };

  // 处理休息按钮点击
  const handleRest = () => {
    // 立即向后台发送开始休息的信号
    chrome.runtime.sendMessage({ action: 'START_REST', type: currentInterventionType }, (response) => {
      if (response && response.status === 'rest_started') {
        // 如果是单站干预，自己负责倒计时
        if (currentInterventionType === 'domain') {
          startRestUI(300);
        }
        // 如果是全局，后台会广播 SYNC_REST_TIMER 消息，这里就不重复开始了
      }
    });
  };

  // 处理延长按钮点击
  const handleExtend = () => {
    removeOverlay();
    // 通知后台延长了时间
    chrome.runtime.sendMessage({ action: 'EXTEND_TIME', minutes: 30, type: currentInterventionType });
  };

  // 监听来自后台的指令
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'BLUR_PAGE') {
      console.log(`[TimeLens Content] Received BLUR_PAGE (${request.type}) instruction`);
      createOverlay(request.message, request.type);
      sendResponse({ status: 'blurred' });
    } else if (request.action === 'REMOVE_BLUR') {
      removeOverlay();
      sendResponse({ status: 'cleared' });
    } else if (request.action === 'REST_IN_PROGRESS') {
      // 当页面被刷新或新开时，如果正处于休息中，直接显示遮罩并同步剩余时间
      console.log(`[TimeLens Content] Resuming rest state: ${request.timeLeft}s left`);
      const msg = request.type === 'global' ? '全局休息中...请让眼睛离开屏幕。' : '休息时间还没结束，请继续远离屏幕。';
      createOverlay(msg, request.type);
      startRestUI(request.timeLeft);
      sendResponse({ status: 'rest_resumed' });
    } else if (request.action === 'SYNC_REST_TIMER') {
      // 收到全局倒计时同步指令
      console.log(`[TimeLens Content] Syncing global rest timer: ${request.timeLeft}s`);
      startRestUI(request.timeLeft);
      sendResponse({ status: 'timer_synced' });
    }
    return true;
  });
}
