// Refleksi Pembelajaran: tampilkan daftar nama terlebih dahulu, lalu refleksi siswa secara individual.
(function(){
  const originalTeacherClass = window.teacherClass;
  if (typeof originalTeacherClass !== 'function') return;

  function e(x=''){
    return String(x).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function safeText(x=''){
    return e(x).replace(/\n/g,'<br>');
  }

  window.openClassReflection = async function(id, code){
    try{
      const rows = await cloudRows('reflections');
      const r = (rows || []).find(x => String(x.id) === String(id));
      if(!r) return alert('Refleksi siswa tidak ditemukan.');
      const name = r.student_name || 'Siswa';
      const content = [
        ['Unsur yang paling saya pahami', r.r1],
        ['Unsur yang masih sulit', r.r2],
        ['Bukti teks membantu saya karena', r.r3],
        ['Bagian website yang paling membantu', r.r5]
      ];
      const details = content.map(([label, value]) =>
        '<div style="padding:14px 0;border-bottom:1px solid #e2e8f0"><b>'+label+'</b><p style="margin:8px 0 0;line-height:1.6">'+safeText(value || 'Belum diisi')+'</p></div>'
      ).join('');
      const heading = document.querySelector('#app [data-reflection-heading]');
      const section = heading ? heading.closest('section.card') : [...document.querySelectorAll('#app section.card')].find(s => (s.textContent||'').includes('Hasil Refleksi Kelas'));
      if(!section) return alert('Bagian Hasil Refleksi Kelas tidak ditemukan.');
      const body = section.querySelector('[data-reflection-body]');
      if(body){
        body.innerHTML = '<h4 style="margin:12px 0 4px">'+e(name)+'</h4>'+details+'<button class="ghost" style="margin-top:14px;background:#eaf2f8;color:#17365d" onclick="showClassReflectionList(\''+e(code)+'\')">← Kembali ke daftar siswa</button>';
      }else{
        section.innerHTML = '<div class="section-head"><h3>Hasil Refleksi Kelas</h3></div><h4>'+e(name)+'</h4>'+details+'<button class="ghost" style="margin-top:14px;background:#eaf2f8;color:#17365d" onclick="showClassReflectionList(\''+e(code)+'\')">← Kembali ke daftar siswa</button>';
      }
    }catch(err){console.error('openClassReflection:',err);alert('Refleksi belum dapat ditampilkan.');}
  };

  window.showClassReflectionList = async function(code){
    await refreshReflectionIdentity(code);
  };

  async function refreshReflectionIdentity(code){
    try{
      const [reflections, students] = await Promise.all([cloudRows('reflections'),cloudRows('students')]);
      const byId = new Map((students || []).map(s => [s.id, s]));
      const cls = (await teacherClasses()).find(c => c.code === code);
      const filtered = (reflections || []).filter(r =>
        (r.class_code && r.class_code === code) || (cls && r.class_id === cls.id) ||
        (!r.class_code && !r.class_id && byId.get(r.student_id)?.class_code === code)
      );
      const heading = [...document.querySelectorAll('#app h3')].find(h =>
        (h.textContent || '').trim().toLowerCase().includes('refleksi')
      );
      if (!heading) return;
      const section = heading.closest('section.card');
      if (!section) return;
      const body = filtered.length ? filtered.map(r => {
        const s = byId.get(r.student_id) || {};
        const name = r.student_name || s.name || 'Siswa';
        return '<div class="row"><div><b>'+e(name)+'</b><small>Refleksi pembelajaran telah dikirim</small></div><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="openClassReflection(\''+e(r.id)+'\',\''+e(code)+'\')">Lihat Refleksi</button></div>';
      }).join('') : '<div class="empty">Belum ada refleksi pembelajaran untuk kelas ini.</div>';

      section.innerHTML = '<div class="section-head"><div><h3>Hasil Refleksi Kelas</h3><small class="sub">Pilih nama siswa untuk membaca refleksinya.</small></div><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="showClassReflectionList(\''+e(code)+'\')">↻ Muat ulang</button></div><div data-reflection-body>'+body+'</div>';
    }catch(err){console.error('reflection-student-fix:',err);}
  }

  window.teacherClass = async function(code){
    await originalTeacherClass(code);
    await refreshReflectionIdentity(code);
  };
})();