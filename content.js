(function() {
  let stabilityTimer = null;
  const stabilityDelay = 3000; // 3초 동안 변화가 없으면 안정 상태로 판단
  let mainObserver = null;
  let paused = false;
  let modalObserver = null;

  function onStable() {
    if (paused) return;
    if (mainObserver) {
      mainObserver.disconnect();
      mainObserver = null;
    }

    // [1] .engineContainer 요소 이동 (그 하위 모든 요소 포함)
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
    // .css-1pdevvj.edkozyk0 요소 위에 드래그 바 추가하여 해당 바를 드래그하면 .engineContainer의 높이를 조정함
    const resizeTarget = document.querySelector('.css-1pdevvj.edkozyk0');
    if (resizeTarget && engineContainer) {
      if (!document.getElementById('resizeBar')) {
        const resizeBar = document.createElement('div');
        resizeBar.id = 'resizeBar';
        resizeTarget.parentNode.insertBefore(resizeBar, resizeTarget);

        let isResizing = false;
        let startY = 0;
        let startHeight = 0;

        // 마우스 이벤트 처리
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
    paused = false;
    mainObserver = new MutationObserver(function() {
      // 모달 요소 감지: .entry-modal-confirm가 존재하며 display가 none이 아닌 경우
      const modal = document.querySelector('.entry-modal-confirm');
      if (modal && window.getComputedStyle(modal).display !== 'none') {
        pauseMonitoring();
        return;
      }
      if (stabilityTimer) clearTimeout(stabilityTimer);
      stabilityTimer = setTimeout(onStable, stabilityDelay);
    });

    mainObserver.observe(document.body, { childList: true, subtree: true });
    if (document.head) {
      mainObserver.observe(document.head, { childList: true, subtree: true });
    }
    if (stabilityTimer) clearTimeout(stabilityTimer);
    stabilityTimer = setTimeout(onStable, stabilityDelay);
  }

  function pauseMonitoring() {
    paused = true;
    if (mainObserver) {
      mainObserver.disconnect();
      mainObserver = null;
    }
    if (stabilityTimer) {
      clearTimeout(stabilityTimer);
      stabilityTimer = null;
    }
    // 모달 요소가 사라지거나 display:none이 될 때까지 감지
    modalObserver = new MutationObserver(function() {
      const modal = document.querySelector('.entry-modal-confirm');
      if (!modal || window.getComputedStyle(modal).display === 'none') {
        // 모달이 사라진 후, head와 body의 변화를 감지하기 위해 stabilityDelay 후 재시작
        setTimeout(function() {
          if (modalObserver) {
            modalObserver.disconnect();
            modalObserver = null;
          }
          startMainObserver();
        }, stabilityDelay);
      }
    });
    modalObserver.observe(document.body, { childList: true, subtree: true });
    if (document.head) {
      modalObserver.observe(document.head, { childList: true, subtree: true });
    }
  }

  // 초기 시작
  startMainObserver();
})();
