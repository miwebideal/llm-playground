// Aplica el tema antes de que Angular cargue para evitar el parpadeo.
(function () {
    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) { /* sin storage */ }
    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
})();
