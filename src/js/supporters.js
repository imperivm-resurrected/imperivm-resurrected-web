(function () {
  'use strict';

  var box = document.getElementById('supporters');
  var ul = document.getElementById('supporters-list');
  if (!box || !ul || !window.IMPERIVM_API) return;

  fetch(window.IMPERIVM_API + '/v1/patrons').then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (data) {
    (data.patrons || []).forEach(function (entry) {
      if (!entry || !entry.name) return;
      var li = document.createElement('li');
      var span = document.createElement('span');
      span.textContent = entry.name;
      li.appendChild(span);
      ul.appendChild(li);
    });
    if (ul.children.length) box.hidden = false;
  }).catch(function () { });
})();
