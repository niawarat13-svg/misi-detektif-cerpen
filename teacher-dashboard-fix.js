/* Teacher dashboard fix
 * Separates student answers by student_id.
 * Uses students.name/email instead of the non-existent answers.student_name field.
 * Adds a robust student-selection handler that refreshes the answer panel and scrolls to it.
 * E-Modul is opened as the teacher-only FlipHTML5 flipbook and is not shown as a student product.
 */
(function () {
  function teacherFixEscape(x = '') {
    return String(x).replace(/[&<>\"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  let selectedStudentId = null;

  window.selectTeacherStudent = async function (code, studentId) {
    selectedStudentId = studentId;
    await window.teacherClass(code, studentId);
    setTimeout(() => {
      const panel = document.getElementById('teacher-answer-panel');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  window.teacherClass = async function (code, studentId = null) {
    const cs = await teacherClasses();
    const cls = cs.find(c => c.code === code);
    if (!cls) return alert('Kelas tidak ditemukan.');

    const [st, an, rf, mats] = await Promise.all([
      cloudRows('students'),
      cloudRows('answers'),
      cloudRows('reflections'),
      cloudRows('materials')
    ]);

    const classId = cls.id;
    const sameClass = x => x.class_id === classId || x.class_code === code;
    const students = st.filter(sameClass);
    const answers = an.filter(sameClass);
    const reflections = rf.filter(sameClass);
    const materials = mats.filter(x => x.class_id === classId || x.class_code === code);

    if (studentId) selectedStudentId = studentId;
    if (!students.some(x => x.id === selectedStudentId)) selectedStudentId = null;

    const selected = students.find(x => x.id === selectedStudentId) || null;
    const selectedAnswers = selected ? answers.filter(x => x.student_id === selected.id) : [];

    const studentRows = students.map(x => {
      const progress = new Set(answers.filter(a => a.student_id === x.id).map(a => a.mission_no)).size;
      const active = x.id === selectedStudentId;
      return `<div class="row" style="${active ? 'border:2px solid #2d6a9f;border-radius:12px;padding:10px;' : ''}">
        <div>
          <b>${teacherFixEscape(x.name)}</b>
          <small>${teacherFixEscape(x.email || 'Email belum tersedia')}</small>
          <small>Progress ${progress}/7</small>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <div class="bar"><i style="width:${progress / 7 * 100}%"></i></div>
          <button type="button" class="ghost" style="background:#eaf2f8;color:#17365d" onclick="selectTeacherStudent('${teacherFixEscape(code)}','${teacherFixEscape(x.id)}')">Lihat Jawaban</button>
        </div>
      </div>`;
    }).join('');

    const answerRows = selectedAnswers.length
      ? selectedAnswers.sort((a,b) => a.mission_no - b.mission_no).map(x => `<tr>
          <td>${x.mission_no}. ${teacherFixEscape(x.mission_title)}</td>
          <td>${teacherFixEscape(x.answer)}</td>
          <td>${teacherFixEscape(x.evidence)}</td>
          <td>${teacherFixEscape(x.reason || '-')}</td>
          <td>${x.score ?? '-'}</td>
          <td><button type="button" class="ghost" style="background:#eaf2f8;color:#17365d" onclick="grade('${teacherFixEscape(x.id)}','${teacherFixEscape(code)}','${teacherFixEscape(x.student_id)}')">Nilai</button></td>
        </tr>`).join('')
      : `<tr><td colspan="6" class="empty">${selected ? 'Peserta ini belum mengirim jawaban.' : 'Pilih satu peserta untuk melihat jawaban Misi 1–7.'}</td></tr>`;

    const reflectionRows = reflections.map(x => {
      const s = students.find(stu => stu.id === x.student_id);
      return `<div class="row"><div><b>${teacherFixEscape(s?.name || 'Peserta')}</b><small>${teacherFixEscape(s?.email || '')}</small><small>${teacherFixEscape(x.r1 || '')}</small></div></div>`;
    }).join('');

    const materialRows = materials.length
      ? materials.sort((x,y)=>(x.order_number||0)-(y.order_number||0)).map((x,i) => {
          const isEbook = /e[- ]?modul/i.test(x.title || '') || x.material_type === 'pdf';
          const ebookButton = isEbook
            ? `<a class="ghost" style="display:inline-block;background:#eaf2f8;color:#17365d;text-decoration:none;margin-right:6px" href="https://online.fliphtml5.com/coxld/efcp/" target="_blank" rel="noopener noreferrer">📖 Buka E-Modul ↗</a>`
            : '';
          return `<tr><td>${i+1}</td><td><b>${teacherFixEscape(x.title)}</b><br><small>${teacherFixEscape(x.description||'')}</small></td><td>${teacherFixEscape(materialTypeLabel(x.material_type))}</td><td>${x.is_published?'Terbit':'Draft'}</td><td>${ebookButton}<button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="editMaterial('${teacherFixEscape(x.id)}','${teacherFixEscape(code)}')">Edit</button> <button class="ghost" style="background:#fdecec;color:#a33" onclick="deleteMaterial('${teacherFixEscape(x.id)}','${teacherFixEscape(code)}')">Hapus</button></td></tr>`;
        }).join('')
      : '';

    shell(`<main class="main">
      <div class="kicker">KELAS</div>
      <h2 class="h2">${teacherFixEscape(cls.name || code)}</h2>
      <p class="sub">Kode kelas: <b>${teacherFixEscape(code)}</b></p>

      <section class="card">
        <div class="section-head">
          <div><h3>Peserta</h3><small class="sub">Pilih peserta. Jawaban akan ditampilkan hanya untuk peserta yang dipilih.</small></div>
          <span class="tag">${students.length} peserta</span>
        </div>
        ${studentRows || '<div class="empty">Belum ada peserta.</div>'}
      </section>

      <section id="teacher-answer-panel" class="card">
        <div class="section-head">
          <div>
            <h3>Jawaban Misi</h3>
            <small class="sub">${selected ? `Menampilkan: <b>${teacherFixEscape(selected.name)}</b>${selected.email ? ` • ${teacherFixEscape(selected.email)}` : ''}` : 'Belum ada peserta yang dipilih.'}</small>
          </div>
          <button type="button" class="ghost" style="background:#eaf2f8;color:#17365d" onclick="teacherClass('${teacherFixEscape(code)}', '${teacherFixEscape(selectedStudentId || '')}')">↻ Muat ulang</button>
        </div>
        <div class="tablewrap"><table class="tbl">
          <thead><tr><th>Misi</th><th>Jawaban</th><th>Bukti</th><th>Interpretasi</th><th>Poin</th><th>Aksi</th></tr></thead>
          <tbody>${answerRows}</tbody>
        </table></div>
      </section>

      <section class="card">
        <div class="section-head"><h3>📚 Materi Pembelajaran</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="addMaterial('${teacherFixEscape(code)}')">＋ Tambah Materi</button><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="seedMaterials('${teacherFixEscape(code)}')">Isi Materi Awal</button></div></div>
        ${materials.length ? `<div class="tablewrap"><table class="tbl"><thead><tr><th>No.</th><th>Materi</th><th>Jenis</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${materialRows}</tbody></table></div>` : '<div class="empty">Belum ada materi.</div>'}
      </section>

      <section class="card">
        <div class="section-head"><h3>Refleksi</h3></div>
        ${reflectionRows || '<div class="empty">Belum ada refleksi.</div>'}
      </section>

      <button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="teacherDash()">← Dashboard</button>
    </main>`, 'Kelas Guru');
  };

  const originalGrade = window.grade;
  window.grade = async function (id, code, studentId = null) {
    if (!studentId) studentId = selectedStudentId;
    if (!originalGrade) return;
    const previous = selectedStudentId;
    selectedStudentId = studentId || previous;
    await originalGrade(id, code);
    selectedStudentId = studentId || previous;
    await teacherClass(code, selectedStudentId);
  };
})();
