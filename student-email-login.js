/* Student email identity layer
 * Student entry uses: email + class code, without password/OTP.
 * Email is an identity field, while Supabase Anonymous Auth provides
 * the authenticated session required by the database RLS policies.
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
        <label>Kode Kelas<input id="code" placeholder="Contoh: JOS-JIS" autocomplete="off"></label>
        <label>Nama Siswa<input id="name" placeholder="Contoh: Jekson" autocomplete="name"></label>
        <label>Email Siswa<input id="email" type="email" autocomplete="email" placeholder="contoh@email.com"></label>
        <label>Kelas<input id="cls" value="XI/F"></label>
      </div>
      <div class="note">Email digunakan sebagai identitas siswa agar data tidak tercatat ganda. Tidak menggunakan password dan tidak menggunakan OTP.</div>
      <button id="joinBtn" class="btn full" onclick="joinStudent()">Masuk Kelas →</button>
    </section></main>`, 'Mode Siswa');
  };

  window.joinStudent = async function () {
    const codeEl = document.getElementById('code');
    const nameEl = document.getElementById('name');
    const emailEl = document.getElementById('email');
    const clsEl = document.getElementById('cls');
    const button = document.getElementById('joinBtn');

    const code = codeEl?.value.trim().toUpperCase();
    const name = nameEl?.value.trim();
    const email = emailEl?.value.trim().toLowerCase();
    const cls = clsEl?.value.trim() || 'XI/F';

    if (!code || !name || !email) {
      return alert('Kode kelas, nama, dan email wajib diisi.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return alert('Masukkan alamat email yang valid.');
    }

    if (button) {
      button.disabled = true;
      button.textContent = 'Memproses...';
    }

    try {
      if (db) {
        // The database RLS uses auth.uid(). Keep the student-facing flow
        // passwordless by using Supabase Anonymous Auth only as the session.
        let { data: sessionData } = await db.auth.getSession();
        let session = sessionData?.session || null;
        let user = session?.user || null;

        // If an old/invalid or non-anonymous session is present, replace it
        // with a fresh anonymous session. No password or OTP is involved.
        if (!session || (user && user.is_anonymous === false)) {
          if (session) await db.auth.signOut();

          const { data: anonData, error: authError } = await db.auth.signInAnonymously({
            options: { data: { display_name: name, email_identity: email } }
          });

          if (authError) {
            throw new Error('Sesi siswa gagal dibuat. Pastikan Anonymous Sign-Ins di Supabase sudah aktif. Detail: ' + authError.message);
          }

          session = anonData?.session || null;
          user = anonData?.user || null;
        }

        if (!session || !user) {
          throw new Error('Sesi siswa tidak tersedia. Silakan muat ulang halaman lalu coba lagi.');
        }

        const { data, error } = await db.rpc('join_class_by_code', {
          p_code: code,
          p_name: name,
          p_class_label: cls,
          p_group_name: name,
          p_email: email
        });

        if (error) {
          const msg = String(error.message || '');
          if (msg.includes('KODE_KELAS_TIDAK_DITEMUKAN')) {
            throw new Error(`Kode kelas "${code}" tidak ditemukan. Periksa kembali kode dari guru.`);
          }
          if (msg.includes('AUTH_REQUIRED')) {
            throw new Error('Sesi siswa belum aktif. Silakan muat ulang halaman lalu coba lagi.');
          }
          throw new Error('Proses masuk kelas gagal: ' + msg);
        }

        const row = Array.isArray(data) ? data[0] : data;
        if (!row?.student_id || !row?.class_id) {
          throw new Error('Data siswa tidak lengkap dari database. Silakan coba lagi.');
        }

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
      await renderStudent();
    } catch (err) {
      console.error('joinStudent error:', err);
      alert(err?.message || 'Tidak dapat masuk ke kelas. Silakan coba lagi.');
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = 'Masuk Kelas →';
      }
    }
  };
})();
