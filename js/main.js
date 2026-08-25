/* THE COTE — boot */
(function () {
  'use strict';
  function start() { UI.init(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
