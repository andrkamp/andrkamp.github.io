// ----- Tabs -----
// Clicking a tab shows its panel and hides the others.
// Arrow keys, Home and End move between tabs (keyboard accessible).
// The URL hash (#games, #videos, #code, #articles, #acknowledgements, #feedback) remembers the open tab.
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));

  function selectTab(tab, moveFocus) {
    tabs.forEach(function (t) {
      var selected = (t === tab);
      t.setAttribute('aria-selected', selected ? 'true' : 'false');
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
    });
    if (moveFocus) { tab.focus(); }
    history.replaceState(null, '', '#' + tab.id.replace('tab-', ''));
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') { next = tabs[(i + 1) % tabs.length]; }
      else if (e.key === 'ArrowLeft') { next = tabs[(i - 1 + tabs.length) % tabs.length]; }
      else if (e.key === 'Home') { next = tabs[0]; }
      else if (e.key === 'End') { next = tabs[tabs.length - 1]; }
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  // Open the tab named in the URL, e.g. ak-game15.com/#articles
  var fromHash = document.getElementById('tab-' + location.hash.slice(1));
  if (fromHash && tabs.indexOf(fromHash) !== -1) { selectTab(fromHash, false); }
})();
