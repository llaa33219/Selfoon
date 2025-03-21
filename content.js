(function() {
  let currentUrl = location.href;
  let wsFeaturesInitialized = false;
  let nonWsObserverInitialized = false;
  let ws_mainObserver = null;
  let ws_modalObserver = null;
  let ws_stabilityTimer = null;
  let ws_paused = false;
  const stabilityDelay = 3000;

  // 기존 ws 기능이 실행 중인 경우 깨끗하게 해제
  function cleanupWsFeatures() {
    if (ws_mainObserver) {
      ws_mainObserver.disconnect();
      ws_mainObserver = null;
    }
    if (ws_modalObserver) {
      ws_modalObserver.disconnect();
      ws_modalObserver = null;
    }
    if (ws_stabilityTimer) {
      clearTimeout(ws_stabilityTimer);
      ws_stabilityTimer = null;
    }
    wsFeaturesInitialized = false;
  }

  // /ws 페이지에서 기존 기능 실행 (엔진 컨테이너 이동, 드래그 바 추가 등)
  function runWsFeatures() {
    if (wsFeaturesInitialized) return;
    wsFeaturesInitialized = true;

    function onStable() {
      if (ws_paused) return;
      if (ws_mainObserver) {
        ws_mainObserver.disconnect();
        ws_mainObserver = null;
      }
      // [1] .engineContainer 요소 이동 (하위 모든 요소 포함)
      const engineContainer = document.querySelector('.engineContainer');
      if (engineContainer) {
        engineContainer.remove();
        const target = document.getElementById('common_srch');
        if (target) {
          target.insertAdjacentElement('afterend', engineContainer);
        } else {
          document.body.appendChild(engineContainer);
        }
      }
      // [2] 드래그 바 추가 및 이벤트 처리
      const resizeTarget = document.querySelector('.css-1pdevvj.edkozyk0');
      if (resizeTarget && engineContainer) {
        if (!document.getElementById('resizeBar')) {
          const resizeBar = document.createElement('div');
          resizeBar.id = 'resizeBar';
          resizeTarget.parentNode.insertBefore(resizeBar, resizeTarget);
  
          let isResizing = false;
          let startY = 0;
          let startHeight = 0;
  
          resizeBar.addEventListener('mousedown', function(e) {
            isResizing = true;
            startY = e.clientY;
            startHeight = engineContainer.offsetHeight;
            e.preventDefault();
          });
  
          document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            const dy = e.clientY - startY;
            const newHeight = startHeight + dy;
            if (newHeight > 100) { // 최소 높이 100px
              engineContainer.style.height = newHeight + 'px';
            }
          });
  
          document.addEventListener('mouseup', function() {
            if (isResizing) {
              isResizing = false;
            }
          });
  
          // 터치 이벤트 처리 (모바일)
          resizeBar.addEventListener('touchstart', function(e) {
            if (e.touches.length > 0) {
              isResizing = true;
              startY = e.touches[0].clientY;
              startHeight = engineContainer.offsetHeight;
              e.preventDefault();
            }
          });
  
          document.addEventListener('touchmove', function(e) {
            if (!isResizing || e.touches.length === 0) return;
            const dy = e.touches[0].clientY - startY;
            const newHeight = startHeight + dy;
            if (newHeight > 100) {
              engineContainer.style.height = newHeight + 'px';
            }
          });
  
          document.addEventListener('touchend', function() {
            if (isResizing) {
              isResizing = false;
            }
          });
        }
      }
    }

    function startMainObserver() {
      ws_paused = false;
      ws_mainObserver = new MutationObserver(function() {
        // 모달 요소 감지: .entry-modal-confirm 존재 시 (display가 none이 아니면)
        const modal = document.querySelector('.entry-modal-confirm');
        if (modal && window.getComputedStyle(modal).display !== 'none') {
          pauseMonitoring();
          return;
        }
        if (ws_stabilityTimer) clearTimeout(ws_stabilityTimer);
        ws_stabilityTimer = setTimeout(onStable, stabilityDelay);
      });
      ws_mainObserver.observe(document.body, { childList: true, subtree: true });
      if (document.head) {
        ws_mainObserver.observe(document.head, { childList: true, subtree: true });
      }
      if (ws_stabilityTimer) clearTimeout(ws_stabilityTimer);
      ws_stabilityTimer = setTimeout(onStable, stabilityDelay);
    }
  
    function pauseMonitoring() {
      ws_paused = true;
      if (ws_mainObserver) {
        ws_mainObserver.disconnect();
        ws_mainObserver = null;
      }
      if (ws_stabilityTimer) {
        clearTimeout(ws_stabilityTimer);
        ws_stabilityTimer = null;
      }
      ws_modalObserver = new MutationObserver(function() {
        const modal = document.querySelector('.entry-modal-confirm');
        if (!modal || window.getComputedStyle(modal).display === 'none') {
          setTimeout(function() {
            if (ws_modalObserver) {
              ws_modalObserver.disconnect();
              ws_modalObserver = null;
            }
            startMainObserver();
          }, stabilityDelay);
        }
      });
      ws_modalObserver.observe(document.body, { childList: true, subtree: true });
      if (document.head) {
        ws_modalObserver.observe(document.head, { childList: true, subtree: true });
      }
    }
  
    startMainObserver();
  }

  // non-/ws 페이지: 작품 공유하기 링크를 감지하여 위에 작품 만들기 링크 추가
  let nonWsObserver = null;
  function runNonWsFeatures() {
    if (nonWsObserverInitialized) return;
    nonWsObserverInitialized = true;
    function insertWsLink() {
      // 이미 추가된 경우 중복 방지
      if (document.querySelector('a.main_category_link[href="/ws"]')) return;
      // 대상 요소: <li><a class="main_category_link" href="/project/list/popular">작품 공유하기</a></li>
      const targetLink = document.querySelector('a.main_category_link[href="/project/list/popular"]');
      if (targetLink) {
        const targetLi = targetLink.closest('li');
        if (targetLi) {
          const newLi = document.createElement('li');
          newLi.innerHTML = '<a class="main_category_link" href="/ws">작품 만들기</a>';
          targetLi.parentNode.insertBefore(newLi, targetLi);
        }
      }
    }
    nonWsObserver = new MutationObserver(function() {
      insertWsLink();
    });
    nonWsObserver.observe(document.body, { childList: true, subtree: true });
    insertWsLink();
  }

  function cleanupNonWsFeatures() {
    if (nonWsObserver) {
      nonWsObserver.disconnect();
      nonWsObserver = null;
    }
    nonWsObserverInitialized = false;
  }

  // URL에 따라 ws 기능과 non-ws 기능을 분기 실행
  function runBasedOnUrl() {
    if (location.pathname.startsWith('/ws')) {
      cleanupNonWsFeatures();
      runWsFeatures();
    } else {
      cleanupWsFeatures();
      runNonWsFeatures();
    }
  }

  // URL 변경 감지 (SPA 내 이동 대응)
  function onUrlChange() {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      // 초기화 플래그 리셋 후 다시 실행
      wsFeaturesInitialized = false;
      nonWsObserverInitialized = false;
      runBasedOnUrl();
    }
  }

  // history API를 오버라이드하여 pushState/replaceState 시 URL 변경 감지
  (function(history) {
    const pushState = history.pushState;
    history.pushState = function(state) {
      if (typeof history.onpushstate == "function") {
        history.onpushstate({ state: state });
      }
      const ret = pushState.apply(history, arguments);
      onUrlChange();
      return ret;
    }
    const replaceState = history.replaceState;
    history.replaceState = function(state) {
      if (typeof history.onreplacestate == "function") {
        history.onreplacestate({ state: state });
      }
      const ret = replaceState.apply(history, arguments);
      onUrlChange();
      return ret;
    }
  })(window.history);

  window.addEventListener('popstate', onUrlChange);

  // 초기 실행
  runBasedOnUrl();
})();
