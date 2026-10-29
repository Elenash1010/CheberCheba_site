const cookieNotice = document.querySelector('.cookie-notice');
const cookieConsentKey = 'chebercheba-cookie-consent-v1';
if (cookieNotice) {
  let accepted = false;
  try {
    accepted = localStorage.getItem(cookieConsentKey) === 'accepted';
  } catch {
    // Keep the notice usable when browser storage is unavailable.
  }
  cookieNotice.hidden = accepted;
  cookieNotice.querySelector('.cookie-notice__accept')?.addEventListener('click', () => {
    try {
      localStorage.setItem(cookieConsentKey, 'accepted');
    } catch {
      // Dismiss for this page even when browser storage is unavailable.
    }
    cookieNotice.hidden = true;
  });
}

// Fit the complete program, including its ticket action, into the viewport.
const fitProgramDialog = (dialog) => {
  if (!dialog.open) return;
  const content = dialog.querySelector('.program');
  if (!content) return;
  content.style.zoom = '1';
  const styles = getComputedStyle(dialog);
  const available = Math.max(1, (window.visualViewport?.height || window.innerHeight) - 24
    - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom)
    - parseFloat(styles.borderTopWidth) - parseFloat(styles.borderBottomWidth));
  let scale = 1;
  for (let pass = 0; pass < 10; pass += 1) {
    const height = content.getBoundingClientRect().height;
    if (height <= available) break;
    scale *= Math.min(.98, available / height);
    content.style.zoom = String(scale);
  }
};
const refitOpenProgram = () => {
  document.querySelectorAll('.program-dialog[open]').forEach(fitProgramDialog);
};
window.addEventListener('resize', refitOpenProgram);
window.visualViewport?.addEventListener('resize', refitOpenProgram);
document.fonts?.ready.then(refitOpenProgram);

const menuButton = document.querySelector('.mobilemenu');
const navigation = document.querySelector('.links');

const setNavigationExpanded = (isExpanded) => {
  menuButton.setAttribute('aria-expanded', String(isExpanded));
  menuButton.setAttribute('aria-label', isExpanded ? 'Закрыть меню' : 'Открыть меню');
};

menuButton.addEventListener('click', () => {
  const isExpanded = navigation.classList.toggle('show');
  setNavigationExpanded(isExpanded);
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    navigation.classList.remove('show');
    setNavigationExpanded(false);
  }
});

document.querySelectorAll('.program-dialog').forEach((programDialog) => {
  const programId = programDialog.id.replace('program-', '');
  const openButton = document.querySelector(`[data-open-program="${programId}"]`);

  openButton.addEventListener('click', () => {
    programDialog.showModal();
    fitProgramDialog(programDialog);
  });
  programDialog.querySelectorAll('img').forEach((image) => {
    image.addEventListener('load', () => fitProgramDialog(programDialog));
  });
  programDialog.querySelector('.program-dialog-close').addEventListener('click', () => programDialog.close());
  programDialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      programDialog.close();
    }
  });
  programDialog.addEventListener('click', (event) => {
    if (event.target === programDialog) {
      programDialog.close();
    }
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navigation.classList.contains('show')) {
    navigation.classList.remove('show');
    setNavigationExpanded(false);
    menuButton.focus();
  }
});

// Purchase consent hints share the top layer with program dialogs.
document.querySelectorAll('a.btn[href="https://ticketcode.ru/organizer/cheber"]').forEach((button, index) => {
  const hint = document.createElement('div');
  hint.className = 'booking-consent';
  hint.id = `booking-consent-${index + 1}`;
  hint.setAttribute('popover', 'manual');
  hint.innerHTML = 'Переходя по ссылке я принимаю условия <a href="Agreement.pdf" target="_blank" rel="noopener noreferrer">пользовательского соглашения</a><br/>и <a href="Politika_konfidentsialnosti.pdf" target="_blank" rel="noopener noreferrer">политики конфиденциальности</a>';
  button.after(hint);
  button.setAttribute('aria-describedby', hint.id);
  let hideTimer;
  const hide = () => {
    clearTimeout(hideTimer);
    if (hint.matches(':popover-open')) hint.hidePopover();
  };
  const position = () => {
    const rect = button.getBoundingClientRect();
    const width = hint.offsetWidth;
    const height = hint.offsetHeight;
    const viewportHeight = window.innerHeight;
    const below = rect.bottom + 10;
    const top = below + height <= viewportHeight - 12 ? below : rect.top - height - 10;
    hint.style.left = `${Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12))}px`;
    hint.style.top = `${Math.max(12, Math.min(top, viewportHeight - height - 12))}px`;
  };
  const show = () => {
    clearTimeout(hideTimer);
    if (!hint.matches(':popover-open')) hint.showPopover();
    position();
  };
  const scheduleHide = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (!button.matches(':hover') && !hint.matches(':hover') && document.activeElement !== button && !hint.contains(document.activeElement)) hide();
    }, 180);
  };
  button.addEventListener('pointerenter', show);
  button.addEventListener('pointerleave', scheduleHide);
  button.addEventListener('focus', show);
  button.addEventListener('blur', scheduleHide);
  button.addEventListener('click', hide);
  hint.addEventListener('pointerenter', () => clearTimeout(hideTimer));
  hint.addEventListener('pointerleave', scheduleHide);
  hint.addEventListener('focusin', show);
  hint.addEventListener('focusout', scheduleHide);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') hide(); });
  window.addEventListener('resize', hide);
  document.addEventListener('scroll', hide, true);
  button.closest('dialog')?.addEventListener('close', hide);
});
