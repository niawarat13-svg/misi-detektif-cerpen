const CFG = window.APP_CONFIG || {};
const hasCloud = !!(CFG.SUPABASE_URL && CFG.SUPABASE_PUBLISHABLE_KEY);
const db = hasCloud && window.supabase ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_PUBLISHABLE_KEY) : null;

const lesson = {
  name:'Misi Detektif Unsur Intrinsik Cerpen',
  story:'Mengucap Syukur',
  author:'Rara Julia',
  grade:'XI/F',
  material:'Analisis Unsur Intrinsik Cerpen',
  target:'Peserta Didik Kelas XI/F',
  finalProduct:'Presentasi Temuan Analisis Cerpen'
};
const missions = [
{id:1,title:'Tema',sub:'Temukan Gagasan Utama',time:5,questions:['Apa tema yang tergambar dalam kutipan/cerita?','Masalah apa yang dialami Ayudia?','Bagaimana hubungan kutipan dengan keseluruhan cerita?','Tuliskan satu bukti lain yang mendukung tema.'],hint:'Perhatikan persoalan yang paling sering muncul dan perubahan tokoh.'},
{id:2,title:'Alur',sub:'Susun Jejak Peristiwa',time:8,questions:['Susun peristiwa sesuai urutan cerita.','Jenis alur apa yang digunakan?','Apa bukti bahwa cerita bergerak kronologis?','Apakah informasi masa lalu mengubah jenis alur utama?'],hint:'Cari penanda waktu seperti “keesokan harinya”, “hari ke empat”, dan “5 bulan sejak ...”.'},
{id:3,title:'Latar',sub:'Temukan Tempat dan Suasana',time:5,questions:['Apa latar waktu dalam kutipan?','Apa latar tempatnya?','Bagaimana suasana yang tergambar?','Temukan latar sosial dalam keseluruhan cerpen.'],hint:'Tanyakan kapan, di mana, dalam suasana apa, dan dalam lingkungan sosial apa.'},
{id:4,title:'Tokoh & Penokohan',sub:'Kenali Tokoh',time:8,questions:['Siapa tokoh yang ditampilkan?','Bagaimana karakter tokoh tersebut?','Tindakan/dialog apa yang menunjukkan karakter itu?','Bagaimana perubahan karakter Ayudia dari awal hingga akhir?'],hint:'Perhatikan tindakan, dialog, pikiran, dan reaksi tokoh lain.'},
{id:5,title:'Sudut Pandang',sub:'Siapa yang Menceritakan?',time:5,questions:['Sudut pandang apa yang digunakan?','Kata ganti apa yang menjadi petunjuk?','Apakah pengarang terlibat sebagai tokoh?','Apa pengaruh sudut pandang tersebut?'],hint:'Perhatikan penggunaan aku/kami atau nama tokoh/ia/dia.'},
{id:6,title:'Amanat',sub:'Temukan Pesan Cerita',time:5,questions:['Apa amanat yang dapat diambil?','Bagaimana pengalaman Ayudia mengubah cara pandangnya?','Apa hubungan kegiatan sosial dengan rasa syukur?','Tuliskan satu tindakan nyata berdasarkan amanat cerpen.'],hint:'Hubungkan konflik, tindakan tokoh, penyelesaian, dan akibatnya.'},
{id:7,title:'Gaya Bahasa',sub:'Pecahkan Kode Bahasa',time:8,questions:['Gaya bahasa apa yang digunakan?','Apa kata penanda gaya bahasa tersebut?','Apa yang dibandingkan atau dimaksudkan?','Apa makna kutipan tersebut?'],hint:'Bedakan metafora dan simile berdasarkan ciri kebahasaan dan konteks kutipan.'}
];

const S = { role:null, teacherUser:null, student:null };

function esc(x=''){ return String(x).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function getLocal(k,d=[]){ try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d));}catch{return d;} }
function putLocal(k,v){localStorage.setItem(k,JSON.stringify(v));}
function shell(content,title=''){
  document.getElementById('app').innerHTML=`<div class="shell"><header class="top"><div class="brand" onclick="home()"><div class="logo">🔎</div><div><b>Misi Detektif</b><small>Unsur Intrinsik Cerpen</small></div></div><div class="top-actions">${title?`<span class="tag">${esc(title)}</span>`:''}<button class="ghost" onclick="home()">Beranda</button></div></header>${content}<footer class="footer">Game-Based Learning Bahasa Indonesia • Kelas XI/F</footer></div>`;
}
function home(){
  S.role=null;
  S.teacherUser=null;
  S.student=null;
  sessionStorage.clear();
  renderHome();
}
function renderHome(){
 shell(`<main class="main"><div class="hero"><section class="panel"><div class="eyebrow">GAME-BASED LEARNING • WEBSITE</div><h1>CERPEN</h1><p class="lead">Cerdas Eksplorasi Rangkaian Peristiwa, Pahami Esensi & Nilai Cerita</p><div class="meta"><div><span>Materi</span><b>${lesson.material}</b></div><div><span>Sasaran</span><b>${lesson.target}</b></div></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" onclick="studentJoin()">🎒 Masuk sebagai Siswa</button><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="teacherLogin()">🧑‍🏫 Masuk sebagai Guru</button></div><div class="note" style="margin-top:16px">${hasCloud?'☁️ Mode online: data disimpan di Supabase.':'🧪 Mode demo: data tersimpan di perangkat ini. Hubungkan Supabase untuk penggunaan lintas perangkat.'}</div></section><aside class="map-card"><div class="map-title">🗺️ Peta Misi</div>${missions.map((m,i)=>`<div class="step"><i>${i+1}</i><div><b>${esc(m.title)}</b><small>${esc(m.sub)}</small></div></div>`).join('')}</aside></div></main>`);
}

async function studentJoin(){
 shell(`<main class="main narrow"><section class="card"><div class="kicker">MODE SISWA</div><h2 class="h2">Masuk ke Kelas</h2><p class="sub">Masukkan kode kelas dan identitas kelompok.</p><div class="form"><label>Kode Kelas<input id="code" placeholder="Contoh: XI01ABC"></label><label>Nama Siswa/Kelompok<input id="name" placeholder="Contoh: Kelompok 1"></label><label>Kelas<input id="cls" value="XI/F"></label></div><div class="note">${hasCloud?'Mode online: Anda akan masuk sebagai pengguna anonim dan data tersimpan di database.':'Mode demo: data akan tersimpan pada browser perangkat ini.'}</div><button class="btn full" onclick="joinStudent()">Masuk Kelas →</button></section></main>`,'Mode Siswa');
}
async function joinStudent(){
 const code=document.getElementById('code').value.trim().toUpperCase(); const name=document.getElementById('name').value.trim(); const cls=document.getElementById('cls').value.trim()||'XI/F';
 if(!code||!name)return alert('Kode kelas dan nama wajib diisi.');
 if(db){
   let auth = await db.auth.getSession();
   if(!auth.data.session){ const {error}=await db.auth.signInAnonymously({options:{data:{display_name:name}}}); if(error)return alert('Gagal masuk sebagai siswa: '+error.message); }
   const {data,error}=await db.rpc('join_class_by_code',{p_code:code,p_name:name,p_class_label:cls,p_group_name:name});
   if(error)return alert('Kode kelas atau proses masuk bermasalah: '+error.message);
   S.role='student'; S.student={id:data?.[0]?.student_id,class_id:data?.[0]?.class_id,class_code:data?.[0]?.class_code,name,group_name:name,class_label:cls};
 } else {
   let cs=getLocal('md_classes',[]), c=cs.find(x=>x.code===code); if(!c){c={id:'c_'+Date.now(),name:'Kelas Demo XI/F',code,teacher_name:'Guru Demo'};cs.push(c);putLocal('md_classes',cs);}
   let st=getLocal('md_students',[]), s=st.find(x=>x.class_id===c.id&&x.name===name); if(!s){s={id:'s_'+Date.now(),class_id:c.id,class_code:code,name,group_name:name,class_label:cls};st.push(s);putLocal('md_students',st);} S.role='student';S.student=s;
 }
 sessionStorage.setItem('role','student');sessionStorage.setItem('student',JSON.stringify(S.student));renderStudent();
}

async function studentAnswers(){
 if(db){ const {data,error}=await db.from('answers').select('*').eq('student_id',S.student.id); if(error)throw error; return data||[]; }
 return getLocal('md_answers',[]).filter(a=>a.student_id===S.student.id);
}
async function renderStudent(){
 const a=await studentAnswers(); const done=new Set(a.filter(x=>x.status==='submitted'||x.status==='reviewed').map(x=>x.mission_no));
 shell(`<main class="main"><div class="welcome"><div><div class="kicker">MODE SISWA</div><h2 class="h2">Halo, ${esc(S.student.name)} 👋</h2><p class="sub">${esc(S.student.class_label)} • Kode ${esc(S.student.class_code)}</p></div><div class="stat"><span>Progress</span><b>${done.size}/7</b></div></div><div class="grid2"><section class="card"><div class="section-head"><h3>Peta Misi</h3><span class="tag">${done.size}/7 selesai</span></div><div>${missions.map(m=>{const ok=done.has(m.id),open=m.id===1||done.has(m.id-1);return `<button class="mission ${ok?'done':''} ${open?'':'locked'}" onclick="${open?`mission(${m.id})`:'locked()'}"><div class="num">${m.id}</div><div><strong>Misi ${m.id} — ${esc(m.title)}</strong><small>${esc(m.sub)}</small></div><b>${ok?'✓':open?'→':'🔒'}</b></button>`}).join('')}</div></section><aside class="card"><div class="section-head"><h3>Alur Belajar</h3></div><div class="check"><div>1. Pelajari materi</div><div>2. Baca cerpen</div><div>3. Selesaikan Misi 1–7</div><div>4. Buat infografik digital</div><div>5. Presentasi & refleksi</div></div><button class="btn full" style="margin-top:14px" onclick="materials()">📚 Materi</button><button class="ghost full" style="margin-top:9px;background:#eaf2f8;color:#17365d" onclick="story()">📖 Baca Cerpen</button>${done.size===7?`<button class="btn full" style="margin-top:9px" onclick="presentation()">🎤 Presentasi Temuan</button>`:''}</aside></div></main>`,'Mode Siswa');
}
function locked(){alert('Selesaikan misi sebelumnya terlebih dahulu.');}
async function materials(){
 const rows=await cloudRows('materials');
 const mine=db?rows.filter(x=>x.class_id===S.student.class_id&&x.is_published):rows.filter(x=>x.class_id===S.student.class_id&&x.is_published!==false);
 const fallback=[['Tema','Gagasan utama atau pokok persoalan cerita.'],['Alur','Rangkaian peristiwa yang membangun perkembangan cerita.'],['Latar','Tempat, waktu, suasana, dan lingkungan sosial.'],['Tokoh & Penokohan','Tokoh dan karakter yang ditampilkan.'],['Sudut Pandang','Posisi pencerita dalam menyampaikan cerita.'],['Amanat','Pesan atau nilai kehidupan dari cerita.'],['Gaya Bahasa','Cara khas pengarang menyampaikan makna, termasuk majas.']];
 const cards=mine.length?mine.map((m,i)=>`<article class="mat"><div class="num">${i+1}</div><span class="tag">${esc(materialTypeLabel(m.material_type))}</span><h3>${esc(m.title)}</h3><p>${esc(m.description||'')}</p>${m.media_url?`<a class="ghost" style="display:inline-block;background:#eaf2f8;color:#17365d;text-decoration:none" href="${esc(m.media_url)}" target="_blank">Buka Materi ↗</a>`:''}${m.content?`<button class="ghost" style="display:inline-block;margin-left:6px;background:#f5f7f9;color:#17365d" onclick="viewMaterial('${esc(m.id)}')">Baca</button>`:''}</article>`).join('') : fallback.map((x,i)=>`<article class="mat"><div class="num">${i+1}</div><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('');
 shell(`<main class="main"><div class="kicker">MATERI</div><h2 class="h2">Materi Pembelajaran</h2><p class="sub">Pelajari materi yang dipublikasikan guru sebelum menyelesaikan misi.</p><div class="materials" style="margin:18px 0">${cards}</div><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="renderStudent()">← Kembali</button></main>`,'Materi');
}
function materialTypeLabel(t){return ({text:'Teks',image:'Infografik',video:'Video',pdf:'E-Modul/PDF',link:'Tautan'})[t]||'Materi';}
async function viewMaterial(id){const rows=await cloudRows('materials'),m=rows.find(x=>x.id===id);if(!m)return;let body=`<div class="kicker">${esc(materialTypeLabel(m.material_type))}</div><h2 class="h2">${esc(m.title)}</h2><p class="sub">${esc(m.description||'')}</p>`;if(m.content)body+=`<div class="material-content">${esc(m.content).replace(/\n/g,'<br>')}</div>`;if(m.media_url)body+=`<p style="margin-top:18px"><a class="btn" href="${esc(m.media_url)}" target="_blank">Buka Media/Materi ↗</a></p>`;body+=`<button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="materials()">← Kembali ke Materi</button>`;shell(`<main class="main narrow"><section class="card">${body}</section></main>`,'Materi');}
function story(){const ps=window.STORY_TEXT||window.STORY||[];const title=ps[0]||lesson.story, author=ps[1]||('Karya: '+lesson.author),date=ps[2]||''; const body=ps.slice(3);shell(`<main class="main story-wrap"><div class="story-top"><div><div class="kicker">BAHAN BACAAN</div><h2 class="h2">${esc(title)}</h2><p class="sub">${esc(author)} ${date?`• ${esc(date)}`:''}</p></div><div class="story-tools"><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="storyFont(-1)">A−</button><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="storyFont(1)">A+</button><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="window.print()">🖨️ Cetak</button></div></div><div class="story-note">📖 Bacalah teks berikut dengan teliti. Saat mengerjakan misi, kembali ke bagian cerita yang relevan untuk menemukan <b>bukti teks</b>.</div><article id="storyText" class="card story-text">${body.map((p,i)=>`<p data-story-p="${i}">${esc(p)}</p>`).join('')}</article><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="renderStudent()">← Kembali</button><button class="btn" onclick="mission(1)">🔎 Mulai Misi 1</button></div></main>`,'Cerpen');}
function storyFont(delta){const el=document.getElementById('storyText');if(!el)return;const cur=parseFloat(getComputedStyle(el).fontSize)||18;el.style.fontSize=Math.min(26,Math.max(15,cur+delta))+'px';}

async function mission(id){
 const m=missions.find(x=>x.id===id); const old=(await studentAnswers()).find(x=>x.mission_no===id)||{};
 shell(`<main class="main"><div class="mission-head"><div><div class="kicker">MISI ${id} DARI 7</div><h2 class="h2">${m.title} — ${m.sub}</h2><p class="sub">${m.questions[0]}</p></div><div class="timer">⏱️ ${m.time} menit</div></div><div class="rule">UNSUR → BUKTI TEKS → ALASAN/INTERPRETASI</div><section class="card"><div class="quote"><b>Fokus misi:</b><p>${m.questions.join(' • ')}</p></div><div class="form"><label>Unsur / Jawaban<textarea id="ans" rows="4">${esc(old.answer||'')}</textarea></label><label>Bukti Teks<textarea id="evi" rows="5">${esc(old.evidence||'')}</textarea></label><label>Alasan / Interpretasi<textarea id="rea" rows="5">${esc(old.reason||'')}</textarea></label></div><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end"><button class="hint-btn" onclick='hint(${JSON.stringify(m.hint)})'>💡 Gunakan Hint</button><button class="btn" onclick="sendAnswer(${id})">Simpan & Kirim →</button></div></section></main>`,'Misi '+id);
}
function hint(text){alert('💡 HINT\n\n'+text+'\n\nGunakan sebagai petunjuk, bukan sebagai jawaban langsung.');}
async function sendAnswer(id){
 const answer=document.getElementById('ans').value.trim(), evidence=document.getElementById('evi').value.trim(), reason=document.getElementById('rea').value.trim();
 if(!answer||!evidence||!reason)return alert('Isi unsur, bukti teks, dan alasan/interpretasi terlebih dahulu.');
 const m=missions.find(x=>x.id===id);
 if(db){const {error}=await db.rpc('submit_answer',{p_mission_no:id,p_mission_title:m.title,p_answer:answer,p_evidence:evidence,p_reason:reason,p_hint_used:false});if(error)return alert('Gagal menyimpan jawaban: '+error.message);} else {let a=getLocal('md_answers',[]),old=a.find(x=>x.student_id===S.student.id&&x.mission_no===id),row={id:old?.id||'a_'+Date.now(),student_id:S.student.id,class_id:S.student.class_id,class_code:S.student.class_code,student_name:S.student.name,mission_no:id,mission_title:m.title,answer,evidence,reason,score:old?.score??null,feedback:old?.feedback||'',status:'submitted',updated_at:new Date().toISOString()};a=old?a.map(x=>x.id===old.id?row:x):[...a,row];putLocal('md_answers',a);}
 alert(`Misi ${id} berhasil dikirim.`); id<7?renderStudent():renderResult();
}
async function renderResult(){
  const a=await studentAnswers();
  const total=a.reduce((s,x)=>s+(Number(x.score)||0),0);

  shell(`
    <main class="main">

      <div class="welcome">
        <div>
          <div class="kicker">HASIL PERMAINAN</div>
          <h2 class="h2">Misi selesai 🎉</h2>
          <p class="sub">
            ${esc(S.student.name)} • ${a.length}/7 misi terkirim
          </p>
        </div>

        <div class="stat">
          <span>Poin</span>
          <b>${total}</b>
        </div>
      </div>

      <section class="card">
        <h3>Temuan Analisis</h3>

        <p>
          Seluruh Misi 1–7 telah selesai.
          Gunakan hasil misi untuk mempresentasikan
          temuan analisis unsur intrinsik cerpen.
        </p>

        <div class="check">
          <div>✓ Identifikasi unsur intrinsik</div>
          <div>✓ Bukti/kutipan dari cerpen</div>
          <div>✓ Interpretasi hasil analisis</div>
          <div>✓ Presentasi temuan</div>
          <div>✓ Refleksi pembelajaran</div>
        </div>

        <button class="btn full" onclick="presentation()">
          🎤 Presentasi Temuan
        </button>
      </section>

    </main>
  `,'Hasil');
}
async function finalProduct(){const old=(await cloudRows('products')).find(x=>x.student_id===S.student.id)||getLocal('md_products',[]).find(x=>x.student_id===S.student.id);shell(`<main class="main"><div class="kicker">TANTANGAN AKHIR</div><h2 class="h2">Buat Produk Digital</h2><p class="sub">Pindahkan hasil analisis dari tujuh misi ke Canva/PowerPoint.</p><div class="grid2"><section class="card"><h3>Isi wajib</h3><div class="check"><div>✓ Judul & pengarang</div><div>✓ Ringkasan</div><div>✓ Tema + bukti</div><div>✓ Alur + bukti</div><div>✓ Latar</div><div>✓ Tokoh & penokohan</div><div>✓ Sudut pandang</div><div>✓ Amanat</div><div>✓ Gaya bahasa + makna</div><div>✓ Kesimpulan</div></div></section><section class="card"><label>Judul Produk<input id="pt" value="${esc(old?.title||'Analisis Unsur Intrinsik Cerpen')}" /></label><label style="margin-top:12px">Link Canva/PowerPoint<input id="pu" value="${esc(old?.url||'')}" placeholder="https://..." /></label><label style="margin-top:12px">Catatan<textarea id="pn" rows="5">${esc(old?.note||'')}</textarea></label><button class="btn full" onclick="saveProduct()">Kirim Produk →</button></section></div></main>`,'Produk Digital');}
async function cloudRows(table){if(db){const {data,error}=await db.from(table).select('*');if(error)throw error;return data||[];}return {products:getLocal('md_products',[]),reflections:getLocal('md_reflections',[]),classes:getLocal('md_classes',[]),students:getLocal('md_students',[]),answers:getLocal('md_answers',[]),materials:getLocal('md_materials',[])}[table]||[];}
async function saveProduct(){const title=document.getElementById('pt').value.trim(),url=document.getElementById('pu').value.trim(),note=document.getElementById('pn').value.trim();if(!title||!url)return alert('Judul produk dan link produk wajib diisi.');if(db){const {error}=await db.rpc('submit_product',{p_title:title,p_url:url,p_note:note});if(error)return alert('Gagal menyimpan produk: '+error.message);}else{let a=getLocal('md_products',[]),old=a.find(x=>x.student_id===S.student.id),row={id:old?.id||'p_'+Date.now(),student_id:S.student.id,class_id:S.student.class_id,class_code:S.student.class_code,student_name:S.student.name,title,url,note,status:'submitted'};a=old?a.map(x=>x.id===old.id?row:x):[...a,row];putLocal('md_products',a);}alert('Produk digital berhasil dikirim.');renderReflection();}
async function renderReflection(){const rs=await cloudRows('reflections');const old=rs.find(x=>x.student_id===S.student.id);shell(`<main class="main"><div class="kicker">REFLEKSI</div><h2 class="h2">Bagaimana pengalaman belajarmu?</h2><p class="sub">Isi refleksi setelah menyelesaikan permainan.</p><section class="card"><div class="form"><label>Unsur yang paling saya pahami<textarea id="r1" rows="3">${esc(old?.r1||'')}</textarea></label><label>Unsur yang masih sulit<textarea id="r2" rows="3">${esc(old?.r2||'')}</textarea></label><label>Bukti teks membantu saya karena<textarea id="r3" rows="3">${esc(old?.r3||'')}</textarea></label><label>Peran saya dalam kelompok<textarea id="r4" rows="3">${esc(old?.r4||'')}</textarea></label><label>Bagian website yang paling membantu<textarea id="r5" rows="3">${esc(old?.r5||'')}</textarea></label></div><button class="btn" onclick="saveReflection()">Kirim Refleksi</button></section></main>`,'Refleksi');}
async function saveReflection(){const vals={r1:document.getElementById('r1').value,r2:document.getElementById('r2').value,r3:document.getElementById('r3').value,r4:document.getElementById('r4').value,r5:document.getElementById('r5').value,};if(db){const {error}=await db.rpc('submit_reflection',vals);if(error)return alert('Gagal menyimpan refleksi: '+error.message);}else{let a=getLocal('md_reflections',[]),old=a.find(x=>x.student_id===S.student.id),row={id:old?.id||'r_'+Date.now(),student_id:S.student.id,class_id:S.student.class_id,class_code:S.student.class_code,student_name:S.student.name,...vals};a=old?a.map(x=>x.id===old.id?row:x):[...a,row];putLocal('md_reflections',a);}alert('Refleksi tersimpan. Terima kasih!');renderStudent();}
async function presentation(){
  const answers = await studentAnswers();

  if(!answers.length){
    return alert('Belum ada temuan yang dapat dipresentasikan.');
  }

  const rows = answers.map((a,i)=>`
    <article class="card" style="margin-bottom:12px">
      <div class="kicker">MISI ${i+1}</div>

      <h3>Temuan Analisis</h3>

      <p>
        <b>Unsur yang ditemukan:</b><br>
        ${esc(a.answer || '-')}
      </p>

      <p>
        <b>Kutipan/Bukti dari Cerpen:</b><br>
        ${esc(a.evidence || '-')}
      </p>

      <p>
        <b>Interpretasi:</b><br>
        ${esc(a.reason || '-')}
      </p>
    </article>
  `).join('');

  shell(`
    <main class="main narrow">

      <section class="card">
        <div class="kicker">TANTANGAN AKHIR</div>

        <h2 class="h2">Presentasi Temuan Analisis Cerpen</h2>

        <p class="sub">
          Gunakan hasil Misi 1–7 untuk mempresentasikan
          temuan analisis unsur intrinsik cerpen di kelas.
        </p>

        <div class="note">
          <b>Dalam presentasi, jelaskan:</b>
          <ol>
            <li>Unsur intrinsik yang ditemukan.</li>
            <li>Kutipan dari cerpen sebagai bukti.</li>
            <li>Interpretasi berdasarkan kutipan tersebut.</li>
          </ol>
        </div>
      </section>

      <section>
        ${rows}
      </section>

      <section class="card">
        <h3>Panduan Presentasi</h3>

        <p>
          Sampaikan hasil temuan secara runtut. Jelaskan unsur
          intrinsik yang ditemukan, tunjukkan kutipan yang menjadi
          bukti, kemudian jelaskan interpretasi terhadap kutipan tersebut.
        </p>

        <p>
          Setelah selesai melakukan presentasi di kelas,
          lanjutkan ke bagian refleksi pembelajaran.
        </p>

        <button class="btn full"
                onclick="renderReflection()">
          Lanjut ke Refleksi
        </button>
      </section>

    </main>
  `,'Presentasi Temuan');
}
function teacherLogin(){shell(`<main class="main narrow"><section class="card"><div class="kicker">MODE GURU</div><h2 class="h2">Dashboard Guru</h2><p class="sub">Gunakan email dan password untuk akun guru.</p><div class="form"><label>Email<input id="te" type="email" placeholder="guru@sekolah.sch.id"></label><label>Password<input id="tp" type="password" placeholder="••••••••"></label></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" onclick="teacherSignIn()">Masuk</button><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="teacherSignUp()">Daftar akun guru</button></div><div class="note" style="margin-top:14px">Untuk mode demo tanpa Supabase, gunakan nama guru pada halaman demo. Untuk produksi, akun guru menggunakan Supabase Auth.</div></section></main>`,'Mode Guru');}
async function teacherSignIn(){if(!db){const name=prompt('Nama Guru:','Guru Bahasa Indonesia');if(!name)return;S.role='teacher';S.teacherUser={id:'t_'+Date.now(),user_metadata:{name}};sessionStorage.setItem('role','teacher');sessionStorage.setItem('teacher',JSON.stringify(S.teacherUser));return teacherDash();}const email=document.getElementById('te').value.trim(),password=document.getElementById('tp').value;if(!email||!password)return alert('Email dan password wajib diisi.');const {data,error}=await db.auth.signInWithPassword({email,password});if(error)return alert('Login gagal: '+error.message);S.teacherUser=data.user;sessionStorage.setItem('role','teacher');sessionStorage.setItem('teacher',JSON.stringify(data.user));teacherDash();}
async function teacherSignUp(){if(!db)return alert('Mode demo tidak memerlukan pendaftaran.');const email=document.getElementById('te').value.trim(),password=document.getElementById('tp').value,name=prompt('Nama Guru:','Guru Bahasa Indonesia');if(!email||!password||!name)return alert('Nama, email, dan password wajib diisi.');if(password.length<6)return alert('Gunakan password minimal 6 karakter.');const {data,error}=await db.auth.signUp({email,password,options:{data:{name}}});if(error)return alert('Pendaftaran gagal: '+error.message);alert('Akun dibuat. Jika project Supabase meminta verifikasi email, cek kotak masuk lalu login kembali.');}
async function teacherDash(){const classes=await teacherClasses();const students=await cloudRows('students');const answers=await cloudRows('answers');const products=await cloudRows('products');shell(`<main class="main"><div class="welcome"><div><div class="kicker">MODE GURU</div><h2 class="h2">Dashboard Pembelajaran</h2><p class="sub">Kelola kelas dan pantau tujuh misi.</p></div><button class="btn" onclick="createClass()">＋ Buat Kelas</button></div><div class="stats"><div class="stat"><span>Kelas</span><b>${classes.length}</b></div><div class="stat"><span>Peserta</span><b>${students.length}</b></div><div class="stat"><span>Jawaban</span><b>${answers.length}</b></div><div class="stat"><span>Produk</span><b>${products.length}</b></div></div><section class="card"><div class="section-head"><h3>Kelas</h3><span class="tag">Guru: ${esc(S.teacherUser?.user_metadata?.name||S.teacherUser?.name||'')}</span></div>${classes.length?classes.map(c=>`<div class="row"><div><b>${esc(c.name)}</b><small>Kode: ${esc(c.code)}</small></div><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="teacherClass('${esc(c.code)}')">Kelola →</button></div>`).join(''):'<div class="empty">Belum ada kelas.</div>'}</section></main>`,'Dashboard Guru');}
async function teacherClasses(){if(db){const {data,error}=await db.from('classes').select('*').order('created_at',{ascending:false});if(error)throw error;return data||[];}return getLocal('md_classes',[]);}
async function createClass(){const name=prompt('Nama kelas:','Bahasa Indonesia XI/F — Cerpen');if(!name)return;const code=(prompt('Kode kelas:','XI'+Math.random().toString(36).slice(2,6).toUpperCase())||'').trim().toUpperCase();if(!code)return;if(db){const {error}=await db.from('classes').insert({name,code,teacher_id:S.teacherUser.id});if(error)return alert('Gagal membuat kelas: '+error.message);}else{let cs=getLocal('md_classes',[]);cs.push({id:'c_'+Date.now(),name,code,teacher_name:S.teacherUser?.name||'Guru'});putLocal('md_classes',cs);}alert('Kelas dibuat. Kode: '+code);teacherDash();}

async function addMaterial(code, existing=null){
 const m=existing||{};
 const title=prompt('Judul materi:',m.title||'');if(!title)return;
 const description=prompt('Deskripsi singkat:',m.description||'')??'';
 const typeInput=prompt('Jenis materi (Teks/Gambar/Video/PDF/Link):',m.material_type||'text')||'text';
const typeMap={
  'teks':'text',
  'text':'text',
  'gambar':'image',
  'image':'image',
  'video':'video',
  'pdf':'pdf',
  'link':'link'
};
const type=typeMap[typeInput.trim().toLowerCase()]||'text';
 const content=prompt('Isi materi (boleh dikosongkan):',m.content||'')??'';
 const media=prompt('URL media/PDF/video/link (boleh dikosongkan):',m.media_url||'')??'';
 const order=Number(prompt('Urutan materi:',m.order_number||1)||1);
 const published=confirm('Publikasikan materi sekarang?');
 const cs=await teacherClasses(),cls=cs.find(x=>x.code===code);if(!cls)return alert('Kelas tidak ditemukan.');
 const row={class_id:cls.id,title,description,content,material_type:type,media_url:media,order_number:order,is_published:published};
 if(db){let q;if(existing){q=await db.from('materials').update({...row,updated_at:new Date().toISOString()}).eq('id',existing.id).eq('class_id',cls.id);}else{q=await db.from('materials').insert(row);}if(q.error)return alert('Gagal menyimpan materi: '+q.error.message);}else{let arr=getLocal('md_materials',[]);if(existing){arr=arr.map(x=>x.id===existing.id?{...x,...row,updated_at:new Date().toISOString()}:x);}else{arr.push({id:'m_'+Date.now(),...row,class_code:code,created_at:new Date().toISOString(),updated_at:new Date().toISOString()});}putLocal('md_materials',arr);}alert(existing?'Materi diperbarui.':'Materi ditambahkan.');teacherClass(code);
}
async function editMaterial(id,code){const rows=await cloudRows('materials'),m=rows.find(x=>x.id===id);if(m)await addMaterial(code,m);}
async function deleteMaterial(id,code){if(!confirm('Hapus materi ini?'))return;if(db){const {error}=await db.from('materials').delete().eq('id',id);if(error)return alert('Gagal menghapus materi: '+error.message);}else{putLocal('md_materials',getLocal('md_materials',[]).filter(x=>x.id!==id));}alert('Materi dihapus.');teacherClass(code);}
async function seedMaterials(code){
 const cs=await teacherClasses(),cls=cs.find(x=>x.code===code);if(!cls)return;
 const base=[['Pengertian Cerpen','Memahami pengertian, ciri, dan karakteristik cerita pendek.','text',''],['Unsur Intrinsik Cerpen','Memahami tujuh unsur intrinsik yang dianalisis dalam permainan.','text',''],['Tema','Gagasan utama atau pokok persoalan yang menjiwai keseluruhan cerita.','text',''],['Alur','Rangkaian peristiwa yang saling berhubungan serta perkembangan konflik dalam cerita.','text',''],['Latar','Latar tempat, waktu, suasana, dan lingkungan sosial budaya dalam cerita.','text',''],['Tokoh & Penokohan','Tokoh dan cara pengarang menggambarkan wataknya melalui tindakan, dialog, pikiran, dan reaksi.','text',''],['Sudut Pandang, Amanat, dan Gaya Bahasa','Materi ringkas untuk menganalisis posisi pencerita, pesan cerita, serta penggunaan majas.','text',''],['E-Modul Misi Detektif Unsur Intrinsik Cerpen','E-modul visual yang memuat alur pembelajaran, peta misi, tugas, asesmen, dan refleksi.','pdf','E-Modul_Misi_Detektif_Unsur_Intrinsik_Cerpen.pdf'],['Flyer Tujuh Unsur Intrinsik Cerpen','Infografik ringkas untuk membantu mengingat tujuh unsur intrinsik.','image','Flyer_Unsur_Intrinsik_Cerpen.png']];
 if(!confirm('Tambahkan 7 materi dasar ke kelas ini?'))return;
 if(db){const existing=await db.from('materials').select('title').eq('class_id',cls.id);if(existing.error)return alert(existing.error.message);const titles=new Set((existing.data||[]).map(x=>x.title));const rows=base.filter(x=>!titles.has(x[0])).map((x,i)=>({class_id:cls.id,title:x[0],description:x[1],content:x[1],material_type:x[2],media_url:x[3],order_number:i+1,is_published:true}));if(rows.length){const {error}=await db.from('materials').insert(rows);if(error)return alert('Gagal membuat materi: '+error.message);}}else{let arr=getLocal('md_materials',[]);const titles=new Set(arr.filter(x=>x.class_id===cls.id).map(x=>x.title));base.forEach((x,i)=>{if(!titles.has(x[0]))arr.push({id:'m_'+Date.now()+'_'+i,class_id:cls.id,class_code:code,title:x[0],description:x[1],content:x[1],material_type:x[2],media_url:x[3],order_number:i+1,is_published:true,created_at:new Date().toISOString(),updated_at:new Date().toISOString()});});putLocal('md_materials',arr);}alert('Materi dasar berhasil ditambahkan.');teacherClass(code);
}
async function teacherClass(code){const cs=await teacherClasses(),cls=cs.find(c=>c.code===code);const [st,an,pr,rf,mats]=await Promise.all([cloudRows('students'),cloudRows('answers'),cloudRows('products'),cloudRows('reflections'),cloudRows('materials')]);const s=st.filter(x=>x.class_code===code),a=an.filter(x=>x.class_code===code),p=pr.filter(x=>x.class_code===code),r=rf.filter(x=>x.class_code===code),m=mats.filter(x=>x.class_id===cls?.id||x.class_code===code);shell(`<main class="main"><div class="kicker">KELAS</div><h2 class="h2">${esc(cls?.name||code)}</h2><p class="sub">Kode kelas: <b>${esc(code)}</b></p><div class="grid2"><section class="card"><div class="section-head"><h3>Peserta</h3><span class="tag">${s.length}</span></div>${s.length?s.map(x=>{const d=new Set(a.filter(z=>z.student_id===x.id).map(z=>z.mission_no)).size;return `<div class="row"><div><b>${esc(x.name)}</b><small>Progress ${d}/7</small></div><div class="bar"><i style="width:${d/7*100}%"></i></div></div>`}).join(''):'<div class="empty">Belum ada peserta.</div>'}</section><section class="card"><div class="section-head"><h3>Produk Digital</h3></div>${p.length?p.map(x=>`<div class="row"><div><b>${esc(x.title)}</b><small>${esc(x.student_name)}</small></div><a class="ghost" style="background:#eaf2f8;color:#17365d;text-decoration:none" href="${esc(x.url)}" target="_blank">Buka ↗</a></div>`).join(''):'<div class="empty">Belum ada produk.</div>'}</section></div><section class="card"><div class="section-head"><div><h3>📚 Materi Pembelajaran</h3><small class="sub">Materi yang tampil di dashboard siswa.</small></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="addMaterial('${esc(code)}')">＋ Tambah Materi</button><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="seedMaterials('${esc(code)}')">Isi Materi Awal</button></div></div>${m.length?`<div class="tablewrap"><table class="tbl"><thead><tr><th>No.</th><th>Materi</th><th>Jenis</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${m.sort((x,y)=>(x.order_number||0)-(y.order_number||0)).map((x,i)=>`<tr><td>${i+1}</td><td><b>${esc(x.title)}</b><br><small>${esc(x.description||'')}</small></td><td>${esc(materialTypeLabel(x.material_type))}</td><td>${x.is_published?'Terbit':'Draft'}</td><td><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="editMaterial('${esc(x.id)}','${esc(code)}')">Edit</button> <button class="ghost" style="background:#fdecec;color:#a33" onclick="deleteMaterial('${esc(x.id)}','${esc(code)}')">Hapus</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Belum ada materi. Klik <b>Isi Materi Awal</b> untuk membuat materi awal, atau tambah materi satu per satu.</div>'}</section><section class="card"><div class="section-head"><h3>Jawaban Misi</h3><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="teacherClass('${esc(code)}')">↻ Muat ulang</button></div><div class="tablewrap"><table class="tbl"><thead><tr><th>Peserta</th><th>Misi</th><th>Jawaban</th><th>Bukti</th><th>Poin</th><th>Aksi</th></tr></thead><tbody>${a.length?a.map(x=>`<tr><td>${esc(x.student_name)}</td><td>${x.mission_no}. ${esc(x.mission_title)}</td><td>${esc(x.answer)}</td><td>${esc(x.evidence)}</td><td>${x.score??'-'}</td><td><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="grade('${esc(x.id)}','${esc(code)}')">Nilai</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">Belum ada jawaban.</td></tr>'}</tbody></table></div></section><section class="card"><div class="section-head"><h3>Refleksi</h3></div>${r.length?r.map(x=>`<div class="row"><div><b>${esc(x.student_name)}</b><small>${esc(x.r1||'')}</small></div></div>`).join(''):'<div class="empty">Belum ada refleksi.</div>'}</section><button class="ghost" style="background:#eaf2f8;color:#17365d" onclick="teacherDash()">← Dashboard</button></main>`,'Kelas Guru');}
async function grade(id,code){let a=await cloudRows('answers'),x=a.find(y=>y.id===id);if(!x)return;const score=prompt('Poin 0–3:',x.score??3);if(score===null)return;const fb=prompt('Feedback guru:',x.feedback||'');if(db){const {error}=await db.rpc('review_answer',{p_answer_id:id,p_score:Number(score),p_feedback:fb});if(error)return alert('Gagal menilai: '+error.message);}else{let arr=getLocal('md_answers',[]);arr=arr.map(y=>y.id===id?{...y,score:Number(score),feedback:fb,status:'reviewed'}:y);putLocal('md_answers',arr);}alert('Penilaian tersimpan.');teacherClass(code);}

async function boot(){
  const role=sessionStorage.getItem('role');
  if(db){const {data}=await db.auth.getSession();if(role==='teacher'&&data.session){S.role='teacher';S.teacherUser=data.session.user;return teacherDash();}if(role==='student'&&data.session){const students=await cloudRows('students');const s=students.find(x=>x.user_id===data.session.user.id);if(s){S.role='student';S.student={...s,class_code:(await db.from('classes').select('code').eq('id',s.class_id).single()).data?.code||''};return renderStudent();}}}
  if(role==='teacher'){S.role='teacher';S.teacherUser=JSON.parse(sessionStorage.getItem('teacher')||'null');if(S.teacherUser)return teacherDash();}
  if(role==='student'){S.role='student';S.student=JSON.parse(sessionStorage.getItem('student')||'null');if(S.student)return renderStudent();}
  renderHome();
}
boot();
