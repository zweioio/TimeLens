// TimeLens 柔性干预 Content Script
import { createRoot, type Root } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  EXTEND_OPTIONS_MINUTES,
  MAX_BLUR_PX,
  REST_DURATION_SECONDS
} from '../constants/intervention';
import { formatCountdown } from '../lib/format';
import './content.css';

type InterventionType = 'domain' | 'global';

interface InterventionCardProps {
  message: string;
  isRestingActive: boolean;
  isRestPaused: boolean;
  remainingRestTime: number;
  onRest: () => void;
  onTogglePauseRest: () => void;
  onExtend: (minutes: number) => void;
}

const InterventionCard = ({
  message,
  isRestingActive,
  isRestPaused,
  remainingRestTime,
  onRest,
  onTogglePauseRest,
  onExtend
}: InterventionCardProps) => {
  const primaryText = !isRestingActive
    ? '开始休息 10 分钟'
    : isRestPaused
      ? '休息已暂停'
      : `正在休息... (${formatCountdown(remainingRestTime)})`;

  return (
    <Card
      id="timelens-card"
      className="w-[min(92vw,420px)] rounded-[28px] border-white/70 bg-white/95 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
    >
      <CardHeader className="items-center pb-4">
        <div className="mb-1 text-[44px] leading-none">🌱</div>
        <CardTitle className="text-[26px] font-bold text-[#111827]">该休息一下了</CardTitle>
        <CardDescription className="max-w-[320px] text-sm leading-6 text-muted-foreground">
          {message}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-3">
          <Button
            className="h-11 w-full rounded-xl"
            disabled={isRestingActive}
            onClick={onRest}
          >
            {primaryText}
          </Button>

          {isRestingActive ? (
            <Button
              variant={isRestPaused ? 'default' : 'secondary'}
              className="h-11 w-full rounded-xl"
              onClick={onTogglePauseRest}
            >
              {isRestPaused ? '恢复休息' : '暂停休息'}
            </Button>
          ) : null}
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">如果需要紧急处理，可以选择延长：</p>
          <div className="grid grid-cols-3 gap-2">
            {EXTEND_OPTIONS_MINUTES.map((minutes) => (
              <Button
                key={minutes}
                variant="outline"
                className="rounded-xl px-0 text-xs"
                disabled={isRestingActive && !isRestPaused}
                onClick={() => onExtend(minutes)}
              >
                + {minutes} 分钟
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

if (!(window as any).__TIMELENS_INJECTED) {
  (window as any).__TIMELENS_INJECTED = true;

  let currentInterventionType: InterventionType = 'domain';
  let restTimer: number | null = null;
  let isRestPaused = false;
  let remainingRestTime = 0;
  let isRestingActive = false;
  let currentMessage = '';
  let overlayHost: HTMLDivElement | null = null;
  let overlayRoot: Root | null = null;
  let showCard = false;

  const ensureOverlayHost = () => {
    if (!overlayHost) {
      overlayHost = document.createElement('div');
      overlayHost.id = 'timelens-intervention-overlay';
      overlayHost.className = 'timelens-overlay';
      document.body.appendChild(overlayHost);
      overlayRoot = createRoot(overlayHost);
    }

    Object.assign(overlayHost.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '999999999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    });
  };

  const renderOverlay = () => {
    if (!overlayRoot) return;

    overlayRoot.render(
      showCard ? (
        <InterventionCard
          message={currentMessage}
          isRestingActive={isRestingActive}
          isRestPaused={isRestPaused}
          remainingRestTime={remainingRestTime}
          onRest={handleRest}
          onTogglePauseRest={handleTogglePauseRest}
          onExtend={handleExtend}
        />
      ) : (
        <></>
      )
    );
  };

  const createOverlay = (message: string, type: InterventionType) => {
    currentInterventionType = type;
    currentMessage = message;
    showCard = true;
    ensureOverlayHost();

    Object.assign(overlayHost!.style, {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      backdropFilter: `blur(${MAX_BLUR_PX}px)`,
      WebkitBackdropFilter: `blur(${MAX_BLUR_PX}px)`,
      opacity: '1',
      transition: 'opacity 0.8s ease-in-out, backdrop-filter 10s linear'
    });

    renderOverlay();
  };

  const createPreBlurOverlay = () => {
    if (overlayHost) return;

    ensureOverlayHost();
    showCard = false;
    renderOverlay();

    Object.assign(overlayHost!.style, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      backdropFilter: 'blur(0px)',
      WebkitBackdropFilter: 'blur(0px)',
      opacity: '1',
      transition: 'backdrop-filter 10s linear, background-color 10s linear, opacity 0.8s ease-in-out'
    });

    requestAnimationFrame(() => {
      if (!overlayHost) return;
      overlayHost.style.backdropFilter = `blur(${MAX_BLUR_PX}px)`;
      (overlayHost.style as any).WebkitBackdropFilter = `blur(${MAX_BLUR_PX}px)`;
      overlayHost.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    });
  };

  const removeOverlay = () => {
    if (restTimer) {
      clearInterval(restTimer);
      restTimer = null;
    }

    isRestPaused = false;
    remainingRestTime = 0;
    isRestingActive = false;
    showCard = false;
    renderOverlay();

    if (overlayHost) {
      overlayHost.style.opacity = '0';

      window.setTimeout(() => {
        overlayRoot?.unmount();
        overlayRoot = null;
        overlayHost?.remove();
        overlayHost = null;
      }, 800);
    }
  };

  const startRestUI = (timeLeft: number) => {
    remainingRestTime = timeLeft;
    isRestPaused = false;
    isRestingActive = true;
    showCard = true;
    renderOverlay();

    if (restTimer) clearInterval(restTimer);

    restTimer = window.setInterval(() => {
      if (!isRestPaused) {
        remainingRestTime--;
        renderOverlay();

        if (remainingRestTime <= 0) {
          if (restTimer) clearInterval(restTimer);
          removeOverlay();
          chrome.runtime.sendMessage({ action: 'REST_COMPLETED', type: currentInterventionType });
        }
      }
    }, 1000);
  };

  function handleTogglePauseRest() {
    isRestPaused = !isRestPaused;
    renderOverlay();

    chrome.runtime.sendMessage({
      action: 'TOGGLE_PAUSE_REST',
      isPaused: isRestPaused,
      type: currentInterventionType
    });
  }

  function handleRest() {
    chrome.runtime.sendMessage(
      { action: 'START_REST', type: currentInterventionType },
      (response) => {
        if (response && response.status === 'rest_started') {
          startRestUI(REST_DURATION_SECONDS);
        }
      }
    );
  }

  function handleExtend(minutes: number) {
    removeOverlay();
    chrome.runtime.sendMessage({ action: 'EXTEND_TIME', minutes, type: currentInterventionType });
  }

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'PRE_BLUR_WARNING') {
      console.log('[TimeLens Content] Pre-blur warning received, starting 10s transition');
      createPreBlurOverlay();
      sendResponse({ status: 'pre_blur_started' });
    } else if (request.action === 'BLUR_PAGE') {
      console.log(`[TimeLens Content] Received BLUR_PAGE (${request.type}) instruction`);
      createOverlay(request.message, request.type);
      sendResponse({ status: 'blurred' });
    } else if (request.action === 'REMOVE_BLUR') {
      removeOverlay();
      sendResponse({ status: 'cleared' });
    } else if (request.action === 'REST_IN_PROGRESS') {
      console.log(`[TimeLens Content] Resuming rest state: ${request.timeLeft}s left`);
      const msg =
        request.type === 'global'
          ? '全局休息中...请让眼睛离开屏幕。'
          : '休息时间还没结束，请继续远离屏幕。';
      createOverlay(msg, request.type);
      startRestUI(request.timeLeft);
      sendResponse({ status: 'rest_resumed' });
    } else if (request.action === 'SYNC_REST_TIMER') {
      console.log(
        `[TimeLens Content] Syncing global rest timer: ${request.timeLeft}s, paused: ${request.isPaused}`
      );

      if (overlayHost) {
        isRestingActive = true;

        if (request.isPaused !== undefined) {
          isRestPaused = request.isPaused;
        }

        if (typeof request.timeLeft === 'number' && (!isRestPaused || request.isPaused !== undefined)) {
          remainingRestTime = request.timeLeft;
        }

        renderOverlay();
      }

      sendResponse({ status: 'timer_synced' });
    }
    return true;
  });
}
