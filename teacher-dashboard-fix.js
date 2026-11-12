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


  window.exportQuestionnaireExcel = async function (code) {
    try {
      const loadXlsx = async () => {
        if (window.XLSX) return;
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Pustaka Excel tidak dapat dimuat. Periksa koneksi internet lalu coba lagi.'));
          document.head.appendChild(script);
        });
      };
      await loadXlsx();
      const [classes, allReflections, allStudents] = await Promise.all([
        teacherClasses(), cloudRows('reflections'), cloudRows('students')
      ]);
      const cls = classes.find(x => x.code === code);
      if (!cls) throw new Error('Kelas tidak ditemukan.');
      const sameClass = x => x.class_id === cls.id || x.class_code === code;
      const students = allStudents.filter(sameClass);
      const responses = allReflections.filter(sameClass).filter(x => x.ratings && Object.keys(x.ratings).length);
      if (!responses.length) return alert('Belum ada respons angket yang dapat diekspor.');
      const questions = [
        'Saya tertarik menggunakan media pembelajaran ini.','Tampilan media menarik.','Warna dan gambar dalam media menarik.','Petunjuk penggunaan media mudah dipahami.','Media mudah digunakan.','Materi disajikan secara sistematis.','Bahasa yang digunakan mudah dipahami.','Contoh membantu saya memahami materi.','Gambar dan ilustrasi membantu pembelajaran.','Latihan membantu saya memahami materi.','Media membuat pembelajaran lebih menarik.','Media membantu saya belajar secara mandiri.','Saya lebih aktif ketika menggunakan media.','Media meningkatkan motivasi belajar saya.','Saya ingin menggunakan media ini kembali.'
      ];
      const choiceLabel = {5:'Sangat Setuju',4:'Setuju',3:'Netral',2:'Tidak Setuju',1:'Sangat Tidak Setuju'};
      const studentById = new Map(students.map(s => [s.id,s]));
      const rawHeader = ['No.','Nama Peserta','Email','Kode Kelas','Tanggal Respons'];
      for (let i=0;i<15;i++) rawHeader.push('P'+(i+1)+' - '+questions[i]);
      rawHeader.push('Kelebihan Media','Kekurangan Media','Saran Perbaikan');
      const rawRows = responses.map((r,i) => {
        const student = studentById.get(r.student_id) || {};
        const row = [i+1,r.student_name || student.name || 'Peserta',student.email || '',code,r.created_at || r.updated_at || ''];
        for(let q=1;q<=15;q++) {
          const v=Number((r.ratings||{})['q'+q] || 0);
          row.push(v ? v+' - '+choiceLabel[v] : '');
        }
        row.push(r.open1 || '',r.open2 || '',r.open3 || '');
        return row;
      });
      const summaryHeader=['No.','Pernyataan','Rata-rata','SS + S (%)','Jumlah Jawaban'];
      const summaryRows=questions.map((q,i)=>{
        const vals=responses.map(r=>Number((r.ratings||{})['q'+(i+1)]||0)).filter(v=>v>=1&&v<=5);
        const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
        const positive=vals.length?vals.filter(v=>v>=4).length/vals.length*100:0;
        return [i+1,q,Number(avg.toFixed(2)),Number(positive.toFixed(1)),vals.length];
      });
      const values=responses.flatMap(r=>Object.values(r.ratings||{}).map(Number).filter(v=>v>=1&&v<=5));
      const mean=values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
      const percent=values.length?mean/5*100:0;
      const category=mean>=4.21?'Sangat praktis':mean>=3.41?'Praktis':mean>=2.61?'Cukup praktis':mean>=1.81?'Kurang praktis':mean>0?'Tidak praktis':'Belum ada data';
      const dist=[5,4,3,2,1].map(v=>[choiceLabel[v],values.filter(x=>x===v).length,values.length?Number((values.filter(x=>x===v).length/values.length*100).toFixed(1)):0]);
      const wb=XLSX.utils.book_new();
      const wsData=XLSX.utils.aoa_to_sheet([rawHeader,...rawRows]);
      wsData['!cols']=[{wch:6},{wch:24},{wch:30},{wch:16},{wch:22},...questions.map(()=>({wch:19})),{wch:35},{wch:35},{wch:35}];
      XLSX.utils.book_append_sheet(wb,wsData,'Data Respons');
      const wsSummary=XLSX.utils.aoa_to_sheet([
        ['REKAPITULASI KEPRAKTISAN MEDIA'],
        ['Nama Kelas',cls.name || code],
        ['Kode Kelas',code],
        ['Jumlah Respons',responses.length],
        ['Rata-rata Keseluruhan',Number(mean.toFixed(2))],
        ['Persentase Skor Maksimal (%)',Number(percent.toFixed(1))],
        ['Kategori Kepraktisan',category],
        [],
        summaryHeader,
        ...summaryRows,
        [],
        ['Distribusi Pilihan Jawaban'],
        ['Pilihan','Frekuensi','Persentase (%)'],
        ...dist
      ]);
      wsSummary['!cols']=[{wch:30},{wch:75},{wch:18},{wch:18},{wch:18}];
      XLSX.utils.book_append_sheet(wb,wsSummary,'Rekapitulasi');
      const filename='Angket_Respons_'+String(code).replace(/[^a-z0-9_-]/gi,'_')+'_'+new Date().toISOString().slice(0,10)+'.xlsx';
      XLSX.writeFile(wb,filename);
    } catch (err) {
      console.error('exportQuestionnaireExcel:',err);
      alert('Ekspor Excel gagal: '+(err.message || err));
    }
  };

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
          <button type="button" class="ghost" style="background:#eaf2f8;color:#17365d" onclick="selectTeacherStudent('${teacherFixEscape(code)}','${teacherFixEscape(x.id)}')">Lihat Jawaban</button><button type="button" class="ghost" style="background:#eaf2f8;color:#17365d" onclick="viewStudentSummary('${teacherFixEscape(x.id)}','${teacherFixEscape(code)}')">Lihat Nilai</button>
        </div>
      </div>`;
    }).join('');

    const answerRows = selectedAnswers.length
      ? selectedAnswers.sort((a,b) => a.mission_no - b.mission_no).map(x => `<tr>
          <td>${x.mission_no}. ${teacherFixEscape(x.mission_title)}</td>
          <td>${teacherFixEscape(x.mcq_answer || 'Belum diisi')} <br><small>Skor PG: ${Number(x.mcq_score)||0}/2</small></td>
          <td>${teacherFixEscape(x.answer)}</td>
          <td>${teacherFixEscape(x.evidence)}</td>
          <td>${teacherFixEscape(x.reason || '-')}</td>
          <td>${x.essay_answer_score == null || x.essay_evidence_score == null || x.essay_reason_score == null ? 'Belum dinilai' : (Number(x.essay_answer_score)+Number(x.essay_evidence_score)+Number(x.essay_reason_score))+'/18'}</td>
          <td><button type="button" class="ghost" style="background:#eaf2f8;color:#17365d;margin-bottom:5px" onclick="viewStudentAnswer('${teacherFixEscape(x.id)}','${teacherFixEscape(code)}')">Lihat Hasil</button><br><button type="button" class="ghost" style="background:#eaf2f8;color:#17365d" onclick="grade('${teacherFixEscape(x.id)}','${teacherFixEscape(code)}','${teacherFixEscape(x.student_id)}')">Nilai Esai</button></td>
        </tr>`).join('')
      : `<tr><td colspan="7" class="empty">${selected ? 'Peserta ini belum mengirim jawaban.' : 'Pilih satu peserta untuk melihat jawaban Misi 1–7.'}</td></tr>`;

    const reflectionRows = reflections.map(x => {
      const s = students.find(stu => stu.id === x.student_id);
      const studentName = teacherFixEscape(x.student_name || s?.name || 'Peserta');
      return `<div class="row"><div><b>${studentName}</b><small>${teacherFixEscape(s?.email || '')}</small><small>${x.ratings ? 'Angket respons telah dikirim' : 'Refleksi pembelajaran sebelumnya'}</small></div><button type="button" class="ghost" style="background:#eaf2f8;color:#17365d" onclick="openClassReflection('${teacherFixEscape(x.id)}','${teacherFixEscape(code)}')">Lihat Respons</button></div>`;
    }).join('');

    const questionnaireRows = reflections.filter(x => x.ratings && Object.keys(x.ratings).length);
    const questionLabels = [
      'Saya tertarik menggunakan media pembelajaran ini.','Tampilan media menarik.','Warna dan gambar dalam media menarik.','Petunjuk penggunaan media mudah dipahami.','Media mudah digunakan.','Materi disajikan secara sistematis.','Bahasa yang digunakan mudah dipahami.','Contoh membantu saya memahami materi.','Gambar dan ilustrasi membantu pembelajaran.','Latihan membantu saya memahami materi.','Media membuat pembelajaran lebih menarik.','Media membantu saya belajar secara mandiri.','Saya lebih aktif ketika menggunakan media.','Media meningkatkan motivasi belajar saya.','Saya ingin menggunakan media ini kembali.'
    ];
    const responseCounts = [5,4,3,2,1].map(v => questionnaireRows.reduce((n,r) => n + (Object.values(r.ratings || {}).filter(x => Number(x) === v).length),0));
    const totalAnswers = responseCounts.reduce((a,b)=>a+b,0);
    const totalScore = questionnaireRows.reduce((sum,r)=>sum+Object.values(r.ratings||{}).reduce((a,v)=>a+Number(v||0),0),0);
    const overallMean = totalAnswers ? totalScore/totalAnswers : 0;
    const overallPercent = totalAnswers ? totalScore/(totalAnswers*5)*100 : 0;
    const practicality = overallMean >= 4.21 ? 'Sangat praktis' : overallMean >= 3.41 ? 'Praktis' : overallMean >= 2.61 ? 'Cukup praktis' : overallMean >= 1.81 ? 'Kurang praktis' : overallMean > 0 ? 'Tidak praktis' : 'Belum ada data';
    const itemSummaryRows = questionLabels.map((label,i) => {
      const vals = questionnaireRows.map(r=>Number((r.ratings||{})['q'+(i+1)]||0)).filter(v=>v>=1&&v<=5);
      const avg = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
      const positive = vals.length ? vals.filter(v=>v>=4).length/vals.length*100 : 0;
      return '<tr><td>'+(i+1)+'</td><td>'+teacherFixEscape(label)+'</td><td>'+(avg?avg.toFixed(2):'—')+'</td><td>'+(vals.length?positive.toFixed(1)+'%':'—')+'</td><td>'+vals.length+'</td></tr>';
    }).join('');
    const distributionRows = [5,4,3,2,1].map((v,i)=>'<tr><td>'+['SS','S','N','TS','STS'][i]+'</td><td>'+responseCounts[i]+'</td><td>'+(totalAnswers?(responseCounts[i]/totalAnswers*100).toFixed(1):'0.0')+'%</td></tr>').join('');
    const practicalitySummary = questionnaireRows.length ? `
      <section class="card">
        <div class="section-head"><div><h3>Rekapitulasi Kepraktisan Media</h3><small class="sub">Ringkasan angket respons peserta didik pada kelas ini.</small></div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="tag">${questionnaireRows.length} respons</span><button type="button" class="btn" onclick="exportQuestionnaireExcel('${teacherFixEscape(code)}')">↓ Ekspor Excel</button></div></div>
        <div class="stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">
          <div class="stat card"><small>Rata-rata keseluruhan</small><h2>${overallMean.toFixed(2)} / 5</h2></div>
          <div class="stat card"><small>Persentase skor maksimal</small><h2>${overallPercent.toFixed(1)}%</h2></div>
          <div class="stat card"><small>Kategori kepraktisan</small><h2 style="font-size:20px">${practicality}</h2></div>
        </div>
        <p class="sub" style="margin:12px 0">Kategori berdasarkan rata-rata: 1,00–1,80 tidak praktis; 1,81–2,60 kurang praktis; 2,61–3,40 cukup praktis; 3,41–4,20 praktis; 4,21–5,00 sangat praktis. Persentase positif adalah gabungan jawaban SS dan S.</p>
        <h4>Rata-rata dan respons positif per pernyataan</h4>
        <div class="tablewrap"><table class="tbl"><thead><tr><th>No.</th><th>Pernyataan</th><th>Rata-rata</th><th>SS + S</th><th>Jumlah jawaban</th></tr></thead><tbody>${itemSummaryRows}</tbody></table></div>
        <h4 style="margin-top:18px">Distribusi pilihan jawaban</h4>
        <div class="tablewrap"><table class="tbl"><thead><tr><th>Pilihan</th><th>Frekuensi</th><th>Persentase</th></tr></thead><tbody>${distributionRows}</tbody></table></div>
      </section>` : '';
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
          <thead><tr><th>Misi</th><th>Hasil PG</th><th>Jawaban Esai</th><th>Bukti</th><th>Interpretasi</th><th>Poin Esai /18</th><th>Aksi</th></tr></thead>
          <tbody>${answerRows}</tbody>
        </table></div>
      </section>

      <section class="card">
        <div class="section-head"><h3>📚 Materi Pembelajaran</h3><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="addMaterial('${teacherFixEscape(code)}')">＋ Tambah Materi</button><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="seedMaterials('${teacherFixEscape(code)}')">Isi Materi Awal</button></div></div>
        ${materials.length ? `<div class="tablewrap"><table class="tbl"><thead><tr><th>No.</th><th>Materi</th><th>Jenis</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${materialRows}</tbody></table></div>` : '<div class="empty">Belum ada materi.</div>'}
      </section>

      ${practicalitySummary}
      <section class="card">
        <div class="section-head">
          <div><h3>Hasil Respons Peserta Didik</h3><small class="sub">Pilih nama siswa untuk membaca angket dan refleksi.</small></div>
        </div>
        ${reflectionRows || '<div class="empty">Belum ada respons peserta didik.</div>'}
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
