// Menyesuaikan alur pembelajaran dengan tujuan pembelajaran:
// langkah membuat infografik digital dihapus; presentasi & refleksi menjadi langkah 4.
(function(){
  function fixLearningFlow(){
    document.querySelectorAll('#app .check').forEach(function(box){
      var items=Array.from(box.children);

      // Hapus langkah infografik hanya jika memang masih ada.
      items.forEach(function(item){
        var text=(item.textContent||'').trim().toLowerCase();
        if(text.includes('buat infografik digital')) item.remove();
      });

      // Normalisasi nomor langkah, tetapi jangan menulis DOM jika teksnya
      // sudah benar. Ini mencegah MutationObserver memicu dirinya sendiri
      // tanpa henti dan membuat halaman Chrome menjadi "Page Unresponsive".
      Array.from(box.children).forEach(function(item,index){
        var raw=(item.textContent||'').replace(/^\s*\d+\.\s*/, '').trim();
        var next=(index+1)+'. '+raw;
        if(item.textContent.trim() !== next){
          item.textContent=next;
        }
      });
    });
  }

  var target=document.getElementById('app')||document.body;
  var observer=new MutationObserver(fixLearningFlow);
  observer.observe(target,{childList:true,subtree:true});
  fixLearningFlow();
})();
