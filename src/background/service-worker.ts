import { StorageManager } from '../utils/storage';
import { TagDatabase } from '../utils/tags';
import {
  DOMAIN_INTERVENTION_THRESHOLD,
  GLOBAL_FATIGUE_THRESHOLD,
  PRE_BLUR_SECONDS,
  REST_DURATION_SECONDS
} from '../constants/intervention';

// --- 状态管理 ---
interface ActiveTabState {
  tabId: number | null;
  domain: string | null;
  startTime: number;
}

let currentTab: ActiveTabState = {
  tabId: null,
  domain: null,
  startTime: Date.now()
};

// 记录各个网站的当日累计时长 (用于触发干预)
// 在真实应用中，这部分数据会在每天零点清空，或从 Storage 中恢复
const todayDomainDurations: Record<string, number> = {};

// 记录全局连续用眼时长（不区分网站，只要处于活跃状态就累加）
let globalContinuousDuration = 0;
let isGlobalResting = false; // 是否正处于全局强制休息状态
let globalRestEndTime = 0; // 全局休息结束的时间戳
let isGlobalRestPaused = false; // 全局休息是否暂停
let remainingGlobalRestTime = 0; // 暂停时记录剩余时间

const domainRestEndTimes: Record<string, number> = {}; // 记录各个单站休息结束的时间戳
const domainRestPausedState: Record<string, { isPaused: boolean, remainingTime: number }> = {}; // 单站暂停状态

// 记录是否已经发送过预警，防止重复发送
let globalPreBlurSent = false;
const domainPreBlurSent: Record<string, boolean> = {};

// 使用 Alarms API 代替 setInterval 以符合 Manifest V3 规范
// (Service Worker 可能会被浏览器休眠，alarms 可以在休眠时唤醒)
const ALARM_NAME = 'timelens_tracker_alarm';

// --- 核心方法 ---

/**
 * 提取 URL 中的域名
 */
function extractDomain(url?: string): string | null {
  if (!url || !url.startsWith('http')) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase().replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

/**
 * 结束并记录上一段访问
 */
async function finalizeCurrentVisit() {
  const { domain, startTime } = currentTab;
  if (!domain) return;

  const endTime = Date.now();
  const duration = Math.floor((endTime - startTime) / 1000);

  if (duration > 0) {
    await StorageManager.logVisit(domain, duration, startTime, endTime);
    
    // 更新当日累计时长
    if (!todayDomainDurations[domain]) {
      todayDomainDurations[domain] = 0;
    }
    todayDomainDurations[domain] += duration;
    
    // 更新全局连续用眼时长
    globalContinuousDuration += duration;

    // 调试日志：获取并打印标签信息
    const { tags } = TagDatabase.getTags(domain);
    console.log(`[TimeLens] Logged ${duration}s for ${domain} [${tags.join(', ')}]. Total today: ${todayDomainDurations[domain]}s. Global Continuous: ${globalContinuousDuration}s`);
  }
}

/**
 * 向所有打开的网页广播消息
 */
async function broadcastMessage(message: any) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && tab.url.startsWith('http')) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (e) {
          // 忽略未注入 Content Script 的页面
        }
      }
    }
  } catch (e) {
    console.error('[TimeLens] broadcastMessage error', e);
  }
}

/**
 * 检查是否需要触发柔性干预 (分级处理)
 */
async function checkIntervention(domain: string, tabId: number) {
  const now = Date.now();

  // 0. 检查是否正在处于休息倒计时中（恢复被刷新的页面状态）
  if (globalRestEndTime > now || isGlobalRestPaused) {
    try {
      await chrome.tabs.sendMessage(tabId, { 
        action: 'REST_IN_PROGRESS', 
        type: 'global',
        timeLeft: isGlobalRestPaused ? remainingGlobalRestTime : Math.ceil((globalRestEndTime - now) / 1000)
      });
    } catch (e) {}
    return;
  }
  
  const domainState = domainRestPausedState[domain] || { isPaused: false, remainingTime: 0 };
  if ((domainRestEndTimes[domain] && domainRestEndTimes[domain] > now) || domainState.isPaused) {
    try {
      await chrome.tabs.sendMessage(tabId, { 
        action: 'REST_IN_PROGRESS', 
        type: 'domain',
        timeLeft: domainState.isPaused ? domainState.remainingTime : Math.ceil((domainRestEndTimes[domain] - now) / 1000)
      });
    } catch (e) {}
    return;
  }

  // 1. 全局疲劳预警与检查 (最高优先级)
  if (globalContinuousDuration >= GLOBAL_FATIGUE_THRESHOLD - PRE_BLUR_SECONDS && globalContinuousDuration < GLOBAL_FATIGUE_THRESHOLD) {
    if (!globalPreBlurSent) {
      console.log(`[TimeLens] Global pre-blur warning at ${globalContinuousDuration}s`);
      await broadcastMessage({ action: 'PRE_BLUR_WARNING', type: 'global' });
      globalPreBlurSent = true;
    }
  } else if (globalContinuousDuration >= GLOBAL_FATIGUE_THRESHOLD) {
    console.log(`[TimeLens] Global fatigue threshold reached (${globalContinuousDuration}s), triggering global intervention...`);
    isGlobalResting = true;
    globalPreBlurSent = false; // 重置
    await broadcastMessage({ 
      action: 'BLUR_PAGE', 
      type: 'global',
      message: '你已连续用眼过久。为了保护视力，请强制休息 10 分钟。'
    });
    return; // 全局触发后不再判断单站
  }

  // 2. 如果当前处于全局休息状态，新开页面直接变模糊
  if (isGlobalResting) {
    try {
      await chrome.tabs.sendMessage(tabId, { 
        action: 'BLUR_PAGE', 
        type: 'global',
        message: '全局休息中...请让眼睛离开屏幕。'
      });
    } catch (e) {}
    return;
  }

  // 3. 单域限制预警与检查
  // 如果是白名单 (默认 Tools/Work 豁免，具体可根据 PRD 优化，这里暂做简单示范)
  const { tags } = TagDatabase.getTags(domain);
  if (tags.includes('Work') || tags.includes('Tools')) return;

  const totalDuration = todayDomainDurations[domain] || 0;
  
  if (totalDuration >= DOMAIN_INTERVENTION_THRESHOLD - PRE_BLUR_SECONDS && totalDuration < DOMAIN_INTERVENTION_THRESHOLD) {
    if (!domainPreBlurSent[domain]) {
      console.log(`[TimeLens] Domain pre-blur warning for ${domain} at ${totalDuration}s`);
      try {
        await chrome.tabs.sendMessage(tabId, { action: 'PRE_BLUR_WARNING', type: 'domain' });
        domainPreBlurSent[domain] = true;
      } catch (e) {}
    }
  } else if (totalDuration >= DOMAIN_INTERVENTION_THRESHOLD) {
    console.log(`[TimeLens] Domain threshold reached for ${domain}, triggering domain intervention...`);
    domainPreBlurSent[domain] = false; // 重置
    try {
      // 向当前标签页发送模糊页面的消息
      await chrome.tabs.sendMessage(tabId, { 
        action: 'BLUR_PAGE', 
        type: 'domain',
        message: `你已在 ${domain} 停留过久。灵感需要留白，去喝杯水吧。`
      });
    } catch (e) {
      console.warn('[TimeLens] Failed to send BLUR_PAGE. Content script may not be loaded.', e);
      // 如果 Content script 未加载，尝试注入
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['dist/content/content.js']
        });
        await chrome.tabs.sendMessage(tabId, { 
          action: 'BLUR_PAGE', 
          type: 'domain',
          message: `你已在 ${domain} 停留过久。灵感需要留白，去喝杯水吧。`
        });
      } catch (err) {
        console.error('Still failed to inject content script:', err);
      }
    }
  }
}

/**
 * 切换到新的标签页或域名
 */
async function switchActiveTab(tabId: number, url?: string) {
  const newDomain = extractDomain(url);
  
  // 如果域名没变（例如在同一网站内跳转），或者由于某种原因 URL 没拿到，就不切断当前计时
  if (newDomain === currentTab.domain && currentTab.tabId === tabId) {
    return;
  }

  // 1. 结算并保存旧的访问记录
  await finalizeCurrentVisit();

  // 2. 开启新的计时
  currentTab = {
    tabId,
    domain: newDomain,
    startTime: Date.now()
  };

  if (newDomain) {
    console.log(`[TimeLens] Started tracking: ${newDomain}`);
    // 每次切换标签页时，检查一次是否需要触发干预
    await checkIntervention(newDomain, tabId);
  } else {
    console.log(`[TimeLens] Tracking paused (system page or invalid URL)`);
  }
}

/**
 * 初始化 / 恢复当前激活的标签页
 */
async function syncCurrentActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      await switchActiveTab(tab.id, tab.url);
    }
  } catch (error) {
    console.error('[TimeLens] 无法同步当前激活标签页:', error);
  }
}

// --- 事件监听 ---

// 1. 监听标签页切换
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  await switchActiveTab(activeInfo.tabId, tab.url);
});

// 2. 监听当前标签页的 URL 更新（例如页面刷新、单页应用路由跳转）
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // 只有当这是当前正在激活的标签页，且 URL 发生变化时才处理
  if (tabId === currentTab.tabId && changeInfo.url) {
    await switchActiveTab(tabId, changeInfo.url);
  }
});

// 3. 监听浏览器窗口焦点变化（处理切出浏览器、切走系统焦点等）
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // 浏览器失去了焦点 (用户切到了其他桌面应用)
    console.log('[TimeLens] Browser lost focus, pausing tracking...');
    await finalizeCurrentVisit();
    currentTab = { tabId: null, domain: null, startTime: Date.now() };
  } else {
    // 浏览器重新获得焦点，重新获取当前 tab
    console.log('[TimeLens] Browser gained focus, resuming tracking...');
    await syncCurrentActiveTab();
  }
});

// --- 保活与心跳机制 ---

// Manifest V3 的 Service Worker 会在空闲时休眠
// 使用 alarms 配合事件保持心跳，确保异常关闭时也能尽可能保留数据
chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('[TimeLens] Heartbeat check.');
    const now = Date.now();
    
    // 定时触发，更新当前时间（可选：也可以在这里定期做增量保存，防止浏览器崩溃丢失太多数据）
    if (currentTab.domain && currentTab.tabId !== null) {
       const duration = Math.floor((now - currentTab.startTime) / 1000);
       if (duration > 60) {
         await finalizeCurrentVisit();
         currentTab.startTime = Date.now(); // 结算完后重置开始时间，继续当前域名的追踪
         
         // 结算后检查是否超时
         await checkIntervention(currentTab.domain, currentTab.tabId);
       }
    }

    // 全局同步休息倒计时状态 (确保其他页面没有被漏掉)
    if (isGlobalResting && globalRestEndTime > now) {
       const timeLeft = Math.ceil((globalRestEndTime - now) / 1000);
       await broadcastMessage({ 
         action: 'SYNC_REST_TIMER', 
         timeLeft 
       });
    } else if (isGlobalResting && globalRestEndTime > 0 && globalRestEndTime <= now) {
       // 全局休息结束
       isGlobalResting = false;
       globalContinuousDuration = 0;
       globalRestEndTime = 0;
       await broadcastMessage({ action: 'REMOVE_BLUR' });
    }
  }
});

// 监听来自 Content Script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTEND_TIME') {
    console.log(`[TimeLens] User extended time for ${request.minutes} minutes`);
    
    if (request.type === 'global') {
      // 全局延长
      globalContinuousDuration -= (request.minutes * 60);
      if (globalContinuousDuration < 0) globalContinuousDuration = 0;
      isGlobalResting = false;
      globalRestEndTime = 0;
      isGlobalRestPaused = false;
      globalPreBlurSent = false;
      // 广播解除模糊
      broadcastMessage({ action: 'REMOVE_BLUR' });
    } else {
      // 单站延长
      if (currentTab.domain) {
        todayDomainDurations[currentTab.domain] -= (request.minutes * 60);
        if (todayDomainDurations[currentTab.domain] < 0) {
          todayDomainDurations[currentTab.domain] = 0;
        }
        domainRestEndTimes[currentTab.domain] = 0;
        domainPreBlurSent[currentTab.domain] = false;
        if (domainRestPausedState[currentTab.domain]) {
          domainRestPausedState[currentTab.domain].isPaused = false;
        }
      }
    }
    sendResponse({ status: 'extended' });
  } else if (request.action === 'START_REST') {
    console.log('[TimeLens] User started resting');
    const restSeconds = REST_DURATION_SECONDS;
    const endTime = Date.now() + restSeconds * 1000;

    if (request.type === 'global') {
      globalRestEndTime = endTime;
      isGlobalRestPaused = false;
      // 广播给所有页面，同步倒计时
      broadcastMessage({ action: 'SYNC_REST_TIMER', timeLeft: restSeconds, isPaused: false });
    } else {
      if (currentTab.domain) {
        domainRestEndTimes[currentTab.domain] = endTime;
        domainRestPausedState[currentTab.domain] = { isPaused: false, remainingTime: restSeconds };
      }
    }
    sendResponse({ status: 'rest_started', endTime });
  } else if (request.action === 'TOGGLE_PAUSE_REST') {
    console.log(`[TimeLens] User toggled rest pause: ${request.isPaused}`);
    const now = Date.now();
    
    if (request.type === 'global') {
      isGlobalRestPaused = request.isPaused;
      if (isGlobalRestPaused) {
        // 记录暂停时的剩余时间
        remainingGlobalRestTime = Math.ceil((globalRestEndTime - now) / 1000);
      } else {
        // 恢复时，基于剩余时间重新计算结束时间戳
        globalRestEndTime = now + remainingGlobalRestTime * 1000;
      }
      // 广播暂停状态给所有页面
      broadcastMessage({ 
        action: 'SYNC_REST_TIMER', 
        timeLeft: isGlobalRestPaused ? remainingGlobalRestTime : Math.ceil((globalRestEndTime - now) / 1000),
        isPaused: isGlobalRestPaused 
      });
    } else {
      if (currentTab.domain) {
        if (!domainRestPausedState[currentTab.domain]) {
          domainRestPausedState[currentTab.domain] = { isPaused: false, remainingTime: 0 };
        }
        domainRestPausedState[currentTab.domain].isPaused = request.isPaused;
        
        if (request.isPaused) {
          domainRestPausedState[currentTab.domain].remainingTime = Math.ceil((domainRestEndTimes[currentTab.domain] - now) / 1000);
        } else {
          domainRestEndTimes[currentTab.domain] = now + domainRestPausedState[currentTab.domain].remainingTime * 1000;
        }
      }
    }
    sendResponse({ status: 'pause_toggled' });
  } else if (request.action === 'REST_COMPLETED') {
    console.log('[TimeLens] User completed rest');
    
    if (request.type === 'global') {
      globalContinuousDuration = 0; // 重置全局疲劳
      isGlobalResting = false;
      globalRestEndTime = 0;
      globalPreBlurSent = false;
      broadcastMessage({ action: 'REMOVE_BLUR' });
    } else {
      // 单站休息完成
      if (currentTab.domain) {
         todayDomainDurations[currentTab.domain] -= (60 * 60); // 奖励1小时
         domainRestEndTimes[currentTab.domain] = 0;
         domainPreBlurSent[currentTab.domain] = false;
      }
    }
    sendResponse({ status: 'rest_recorded' });
  }
});

// --- 初始化入口 ---
syncCurrentActiveTab();

// 监听扩展图标点击，打开侧边栏
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));
