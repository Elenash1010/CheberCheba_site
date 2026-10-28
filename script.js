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
