/* Student email identity layer
 * Keeps the existing game UI and data flow, but changes student entry
 * from anonymous-only identity to: email + class code, without password/OTP.
 * Email is an identifier, not a verified authentication factor.
 */
(function () {
  function studentEmailEscape(x = '') {
    return String(x).replace(/[&<>\"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  window.studentJoin = async function () {
    shell(`<main class="main narrow"><section class="card">
      <div class="kicker">MODE SISWA</div>
      <h2 class="h2">Masuk ke Kelas</h2>
      <p class="sub">Masukkan kode kelas dan identitas siswa.</p>
      <div class="form">
        <label>Kode Kelas<input id="code" placeholder="Contoh: JOS-JIS"></label>
        <label>Nama Siswa<input id="name" placeholder="Contoh: Jekson"></label>
        <label>Email Siswa<input id="email" type="email" autocomplete="email" placeholder="contoh@email.com"></label>
        <label>Kelas<input id="cls" value="XI/F"></label>
      </div>
      <div class="note">Email digunakan sebagai identitas siswa agar data tidak tercatat ganda. Tidak menggunakan password dan tidak menggunakan OTP.</div>
      <button class="btn full" onclick="joinStudent()">Masuk Kelas →</button>
    </section></main>`, 'Mode Siswa');
  };

  window.joinStudent = async function () {
    const code = document.getElementById('code').value.trim().toUpperCase();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const cls = document.getElementById('cls').value.trim() || 'XI/F';

    if (!code || !name || !email) return alert('Kode kelas, nama, dan email wajib diisi.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return alert('Masukkan alamat email yang valid.');

    if (db) {
      let auth = await db.auth.getSession();
      if (!auth.data.session) {
        const { error } = await db.auth.signInAnonymously({
          options: { data: { display_name: name, email_identity: email } }
        });
        if (error) return alert('Gagal membuat sesi siswa: ' + error.message);
      }

      const { data, error } = await db.rpc('join_class_by_code', {
        p_code: code,
        p_name: name,
        p_class_label: cls,
        p_group_name: name,
        p_email: email
      });

      if (error) return alert('Kode kelas atau proses masuk bermasalah: ' + error.message);

      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.student_id || !row?.class_id) return alert('Data siswa berhasil diproses tetapi identitas siswa tidak diterima dari database.');

      S.role = 'student';
      S.student = {
        id: row.student_id,
        class_id: row.class_id,
        class_code: row.class_code,
        name,
        email: row.student_email || email,
        group_name: name,
        class_label: cls
      };
    } else {
      let cs = getLocal('md_classes', []), c = cs.find(x => x.code === code);
      if (!c) {
        c = { id: 'c_' + Date.now(), name: 'Kelas Demo XI/F', code, teacher_name: 'Guru Demo' };
        cs.push(c); putLocal('md_classes', cs);
      }
      let st = getLocal('md_students', []);
      let s = st.find(x => x.class_id === c.id && String(x.email || '').toLowerCase() === email);
      if (!s) {
        s = { id: 's_' + Date.now(), class_id: c.id, class_code: code, name, email, group_name: name, class_label: cls };
        st.push(s);
      } else {
        s.name = name; s.group_name = name; s.class_label = cls;
      }
      putLocal('md_students', st);
      S.role = 'student';
      S.student = s;
    }

    sessionStorage.setItem('role', 'student');
    sessionStorage.setItem('student', JSON.stringify(S.student));
    renderStudent();
  };
})();
