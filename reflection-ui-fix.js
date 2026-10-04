// Menyederhanakan refleksi siswa: pertanyaan tentang peran dalam kelompok tidak ditampilkan.
(function(){
  function removeRoleField(){
    document.querySelectorAll('#app label').forEach(function(label){
      var text=(label.textContent||'').trim().toLowerCase();
      if(text.startsWith('peran saya dalam kelompok')) label.remove();
    });
  }

  var observer=new MutationObserver(removeRoleField);
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  removeRoleField();

  // Tetap kompatibel dengan struktur database lama: r4 dikirim kosong.
  window.saveReflection=async function(){
    var vals={
      r1:document.getElementById('r1')?.value||'',
      r2:document.getElementById('r2')?.value||'',
      r3:document.getElementById('r3')?.value||'',
      r4:'',
      r5:document.getElementById('r5')?.value||''
    };
    if(db){
      var result=await db.rpc('submit_reflection',vals);
      if(result.error)return alert('Gagal menyimpan refleksi: '+result.error.message);
    }else{
      var a=getLocal('md_reflections',[]),old=a.find(function(x){return x.student_id===S.student.id;}),row={
        id:old?.id||'r_'+Date.now(),student_id:S.student.id,class_id:S.student.class_id,
        class_code:S.student.class_code,student_name:S.student.name,...vals
      };
      a=old?a.map(function(x){return x.id===old.id?row:x;}):a.concat([row]);
      putLocal('md_reflections',a);
    }
    alert('Refleksi tersimpan. Terima kasih!');
    renderStudent();
  };
})();
