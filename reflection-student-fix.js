// Tampilan hasil angket respons peserta didik pada dashboard guru.
(function(){
 const originalTeacherClass=window.teacherClass;if(typeof originalTeacherClass!=='function')return;
 const items=['Saya tertarik menggunakan media pembelajaran ini.','Tampilan media menarik.','Warna dan gambar dalam media menarik.','Petunjuk penggunaan media mudah dipahami.','Media mudah digunakan.','Materi disajikan secara sistematis.','Bahasa yang digunakan mudah dipahami.','Contoh membantu saya memahami materi.','Gambar dan ilustrasi membantu pembelajaran.','Latihan membantu saya memahami materi.','Media membuat pembelajaran lebih menarik.','Media membantu saya belajar secara mandiri.','Saya lebih aktif ketika menggunakan media.','Media meningkatkan motivasi belajar saya.','Saya ingin menggunakan media ini kembali.'];
 const scale={5:'Sangat Setuju',4:'Setuju',3:'Netral',2:'Tidak Setuju',1:'Sangat Tidak Setuju'};
 const e=x=>String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const safe=x=>e(x||'—').replace(/\n/g,'<br>');
 window.openClassReflection=async function(id,code){
  try{
   const rows=await cloudRows('reflections'),r=(rows||[]).find(x=>String(x.id)===String(id));
   if(!r)return alert('Respons siswa tidak ditemukan.');
   const ratings=r.ratings||{};
   const ratingRows=items.map((t,i)=>{const v=Number(ratings['q'+(i+1)]||0);return '<tr><td style="padding:9px;border-bottom:1px solid #e2e8f0">'+(i+1)+'</td><td style="padding:9px;border-bottom:1px solid #e2e8f0">'+e(t)+'</td><td style="padding:9px;border-bottom:1px solid #e2e8f0"><b>'+(v?e(scale[v]):'Belum dijawab')+'</b>'+(v?' ('+v+')':'')+'</td></tr>';}).join('');
   const openHtml=[['1. Apa kelebihan media pembelajaran ini?',r.open1],['2. Apa kekurangan media pembelajaran ini?',r.open2],['3. Apa saran Anda untuk perbaikan media?',r.open3]].map(([q,v])=>'<div style="padding:12px 0;border-bottom:1px solid #e2e8f0"><b>'+q+'</b><p style="margin:7px 0;line-height:1.6">'+safe(v)+'</p></div>').join('');
   const legacy=[['Unsur yang paling saya pahami',r.r1],['Unsur yang masih sulit',r.r2],['Bukti teks membantu saya karena',r.r3],['Bagian website yang paling membantu',r.r5]].map(([q,v])=>'<div style="padding:10px 0"><b>'+q+'</b><p>'+safe(v)+'</p></div>').join('');
   const hasQuestionnaire=Object.keys(ratings).length>0;
   const content=hasQuestionnaire?'<h3>Angket Pernyataan (15 Butir)</h3><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:9px">No.</th><th style="text-align:left;padding:9px">Pernyataan</th><th style="text-align:left;padding:9px">Jawaban</th></tr></thead><tbody>'+ratingRows+'</tbody></table></div><h3 style="margin-top:24px">Pertanyaan Terbuka</h3>'+openHtml:'<h3>Refleksi Pembelajaran Sebelumnya</h3>'+legacy;
   shell('<main class="main"><div class="kicker">HASIL RESPONS PESERTA DIDIK</div><h2 class="h2">'+e(r.student_name||'Siswa')+'</h2><p class="sub">'+(hasQuestionnaire?'Jawaban angket respons media pembelajaran.':'Jawaban refleksi versi sebelumnya.')+'</p><section class="card">'+content+'</section><button class="ghost" style="margin-top:14px;background:#eaf2f8;color:#17365d" onclick="teacherClass(\''+e(code)+'\')">← Kembali ke kelas</button></main>','Respons Peserta Didik');
  }catch(err){console.error('openClassReflection:',err);alert('Respons belum dapat ditampilkan: '+(err.message||err));}
 };
 window.viewStudentReflection=window.openClassReflection;
 window.showClassReflectionList=async function(code){await refreshReflectionIdentity(code);};
 async function refreshReflectionIdentity(code){
  try{
   const [reflections,students]=await Promise.all([cloudRows('reflections'),cloudRows('students')]);
   const byId=new Map((students||[]).map(s=>[s.id,s]));
   const cls=(await teacherClasses()).find(c=>c.code===code);
   const filtered=(reflections||[]).filter(r=>(r.class_code&&r.class_code===code)||(cls&&r.class_id===cls.id)||(!r.class_code&&!r.class_id&&byId.get(r.student_id)?.class_code===code));
   const heading=[...document.querySelectorAll('#app h3')].find(h=>/Hasil (Refleksi Kelas|Respons Peserta Didik)/i.test((h.textContent||'').trim()));if(!heading)return;
   const section=heading.closest('section.card');if(!section)return;
   const body=filtered.length?filtered.map(r=>{const s=byId.get(r.student_id)||{},name=e(r.student_name||s.name||'Siswa');return '<div class="row"><div><b>'+name+'</b><small>Angket respons telah dikirim</small></div><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="openClassReflection(\''+e(r.id)+'\',\''+e(code)+'\')">Lihat Respons</button></div>';}).join(''):'<div class="empty">Belum ada respons peserta didik untuk kelas ini.</div>';
   section.innerHTML='<div class="section-head"><div><h3>Hasil Respons Peserta Didik</h3><small class="sub">Pilih nama siswa untuk membaca jawaban angket.</small></div><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="showClassReflectionList(\''+e(code)+'\')">↻ Muat ulang</button></div><div data-reflection-body>'+body+'</div>';
  }catch(err){console.error('response-list:',err);}
 }
 window.teacherClass=async function(code){await originalTeacherClass(code);await refreshReflectionIdentity(code);};
})();