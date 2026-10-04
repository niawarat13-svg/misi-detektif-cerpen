// Menyesuaikan alur pembelajaran dengan tujuan pembelajaran:
// langkah membuat infografik digital dihapus; presentasi & refleksi menjadi langkah 4.
(function(){
  function fixLearningFlow(){
    document.querySelectorAll('#app .check').forEach(function(box){
      var items=Array.from(box.children);
      items.forEach(function(item){
        var text=(item.textContent||'').trim().toLowerCase();
        if(text.includes('buat infografik digital')) item.remove();
      });
      Array.from(box.children).forEach(function(item,index){
        var text=(item.textContent||'').replace(/^\s*\d+\.\s*/, '').trim();
        item.textContent=(index+1)+'. '+text;
      });
    });
  }

  var observer=new MutationObserver(fixLearningFlow);
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  fixLearningFlow();
})();
