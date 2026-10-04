// Menyesuaikan alur pembelajaran dengan tujuan pembelajaran.
// - Menghapus langkah "Buat infografik digital".
// - Menormalkan nomor langkah menjadi 1–4.
// - Menghapus tampilan Produk/Produk Digital karena pembelajaran tidak menghasilkan produk akhir.
(function(){
  function cleanLearningUI(){
    var app=document.getElementById('app')||document.body;

    // Alur pembelajaran siswa.
    document.querySelectorAll('#app .check').forEach(function(box){
      Array.from(box.children).forEach(function(item){
        var text=(item.textContent||'').trim().toLowerCase();
        if(text.includes('buat infografik digital')) item.remove();
      });

      Array.from(box.children).forEach(function(item,index){
        var raw=(item.textContent||'').replace(/^\s*\d+\.\s*/, '').trim();
        var next=(index+1)+'. '+raw;
        if(item.textContent.trim() !== next){
          item.textContent=next;
        }
      });
    });

    // Dashboard guru: hapus kartu statistik "Produk".
    document.querySelectorAll('#app .stat').forEach(function(stat){
      var text=(stat.textContent||'').trim().toLowerCase();
      if(text.startsWith('produk')) stat.remove();
    });

    // Hapus kartu/section "Produk Digital" jika masih dirender oleh kode lama.
    document.querySelectorAll('#app .card, #app section').forEach(function(el){
      var heading=el.querySelector('h2,h3');
      var text=(heading?.textContent||'').trim().toLowerCase();
      if(text === 'produk digital' || text === 'buat produk digital') el.remove();
    });

    // Hapus tombol/tautan yang secara eksplisit mengarah ke produk akhir.
    document.querySelectorAll('#app button, #app a').forEach(function(el){
      var text=(el.textContent||'').trim().toLowerCase();
      if(text.includes('buat produk digital') || text === 'produk digital' || text.includes('kirim produk')) el.remove();
    });
  }

  var target=document.getElementById('app')||document.body;
  var observer=new MutationObserver(cleanLearningUI);
  observer.observe(target,{childList:true,subtree:true});
  cleanLearningUI();
})();
