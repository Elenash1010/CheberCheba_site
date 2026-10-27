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

  openButton.addEventListener('click', () => programDialog.showModal());
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
