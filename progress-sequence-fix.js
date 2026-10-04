// Menjaga progres misi tetap berurutan.
// Jika ada data lama (misalnya Misi 7 pernah dikerjakan saat pengujian),
// Misi tersebut tidak dianggap selesai sebelum Misi 1–6 diselesaikan berurutan.
(function(){
  var originalStudentAnswers = window.studentAnswers;
  if(typeof originalStudentAnswers !== 'function') return;

  window.studentAnswers = async function(){
    var answers = await originalStudentAnswers();
    var submitted = new Set((answers||[])
      .filter(function(x){return x.status==='submitted'||x.status==='reviewed';})
      .map(function(x){return Number(x.mission_no);}));

    var sequential = new Set();
    for(var i=1;i<=7;i++){
      if(submitted.has(i)) sequential.add(i);
      else break;
    }

    // Hanya jawaban sampai misi terakhir yang benar-benar berurutan yang dipakai
    // untuk menghitung progres dan membuka misi berikutnya.
    return (answers||[]).filter(function(x){
      return sequential.has(Number(x.mission_no));
    });
  };
})();
