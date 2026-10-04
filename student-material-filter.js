/* Student material filter
 * Hides E-Modul/PDF cards from the student materials page.
 * The teacher dashboard remains unchanged because its materials are rendered as table rows, not .mat cards.
 */
(function () {
  function hideStudentPdfMaterial() {
    document.querySelectorAll('.mat').forEach(function (card) {
      const tag = card.querySelector('.tag');
      if (tag && tag.textContent.trim().toLowerCase() === 'e-modul/pdf') {
        card.remove();
      }
    });
  }

  const observer = new MutationObserver(hideStudentPdfMaterial);
  observer.observe(document.body, { childList: true, subtree: true });
  hideStudentPdfMaterial();
})();
