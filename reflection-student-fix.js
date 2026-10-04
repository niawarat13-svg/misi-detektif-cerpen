// Refleksi Pembelajaran: tampilkan identitas siswa secara individual pada Dashboard Guru.
(function(){
  const originalTeacherClass = window.teacherClass;
  if (typeof originalTeacherClass !== 'function') return;

  function e(x=''){
    return String(x).replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  }

  async function refreshReflectionIdentity(){
    try {
      const [reflections, students] = await Promise.all([
        cloudRows('reflections'),
        cloudRows('students')
      ]);
      const byId = new Map((students || []).map(s => [s.id, s]));
      const heading = [...document.querySelectorAll('#app h3')].find(h =>
        (h.textContent || '').trim().toLowerCase().includes('refleksi')
      );
      if (!heading) return;
      const section = heading.closest('section.card');
      if (!section) return;
      const body = reflections.length ? reflections.map(r => {
        const s = byId.get(r.student_id) || {};
        const name = r.student_name || s.name || 'Siswa';
        const email = r.student_email || s.email || '';
        const cls = r.class_label || s.class_label || '';
        return `<div class="row" style="display:block;padding:16px 0">
          <div><b>${e(name)}</b></div>
          <small style="display:block;margin-top:4px;color:#64748b">${e(email)}${cls ? ` • ${e(cls)}` : ''}</small>
          <div style="margin-top:10px;line-height:1.6">
            ${r.r1 ? `<p><b>Refleksi:</b> ${e(r.r1)}</p>` : ''}
            ${r.r2 ? `<p><b>Pemahaman:</b> ${e(r.r2)}</p>` : ''}
            ${r.r3 ? `<p><b>Kesulitan:</b> ${e(r.r3)}</p>` : ''}
            ${r.r5 ? `<p><b>Catatan:</b> ${e(r.r5)}</p>` : ''}
          </div>
        </div>`;
      }).join('') : '<div class="empty">Belum ada refleksi pembelajaran.</div>';

      const existing = [...section.children].find(el => !el.classList.contains('section-head'));
      if (existing) existing.outerHTML = body;
    } catch (err) {
      console.error('reflection-student-fix:', err);
    }
  }

  window.teacherClass = async function(code){
    await originalTeacherClass(code);
    await refreshReflectionIdentity();
  };
})();
