// keep the sidebar pinned; a tall sidebar scrolls up just until its bottom is visible
(function () {
  var side = document.querySelector('.side');
  function fit() { if (side) side.style.top = Math.min(72, window.innerHeight - side.offsetHeight - 20) + 'px'; }
  window.fitSide = fit;
  fit(); window.addEventListener('resize', fit); window.addEventListener('load', fit);
})();
