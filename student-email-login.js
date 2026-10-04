window.studentJoin=function(){shell('<main class="main narrow"><section class="card"><div class="kicker">MODE SISWA</div><h2 class="h2">Masuk ke Kelas</h2><p class="sub">Masukkan kode kelas, nama, dan email.</p><div class="form"><label>Kode Kelas<input id="code"></label><label>Nama Siswa<input id="name"></label><label>Email<input id="email" type="email"></label><label>Kelas<input id="cls" value="XI/F"></label></div><button class="btn full" onclick="joinStudent()">Masuk Kelas →</button></section></main>','Mode Siswa')};
window.joinStudent=async function(){
 const code=document.getElementById('code').value.trim().toUpperCase();
 const name=document.getElementById('name').value.trim();
 const email=document.getElementById('email').value.trim().toLowerCase();
 const cls=document.getElementById('cls').value.trim()||'XI/F';
 if(!code||!name||!email)return alert('Kode kelas, nama, dan email wajib diisi.');
 if(!/^\\S+@\\S+\\.\\S+$/.test(email))return alert('Format email tidak valid.');
 if(!db)return alert('Mode online belum tersedia.');
 let auth=await db.auth.getSession();
 if(!auth.data.session){const r=await db.auth.signInAnonymously({options:{data:{display_name:name}}});if(r.error)return alert('Gagal membuat sesi siswa: '+r.error.message);}
 const r=await db.rpc('join_class_by_code',{p_code:code,p_email:email,p_name:name,p_class_label:cls,p_group_name:null});
 if(r.error)return alert('Kode kelas atau proses masuk bermasalah: '+r.error.message);
 const row=r.data&&r.data[0];
 if(!row)return alert('Siswa belum berhasil didaftarkan.');
 S.role='student';S.student={id:row.student_id,class_id:row.class_id,class_code:row.class_code,name:row.student_name||name,email:row.student_email||email,class_label:row.class_label||cls};
 sessionStorage.setItem('role','student');sessionStorage.setItem('student',JSON.stringify(S.student));
 renderStudent();
};