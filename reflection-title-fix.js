// Menetapkan judul refleksi pada dashboard guru agar lebih jelas secara pedagogis.
(function(){
  function renameReflectionHeading(){
    document.querySelectorAll('#app h3').forEach(function(h){
      if((h.textContent||'').trim().toLowerCase()==='refleksi'){
        h.textContent='Refleksi Pembelajaran';
      }
    });
  }
  var observer=new MutationObserver(renameReflectionHeading);
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  renameReflectionHeading();
})();
