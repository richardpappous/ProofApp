// Scripts injected into the website so the native app and the page can talk.
// They only call functions that already exist in index.html (setView, closeMenu,
// backupObj, b64e, markBackup, bkMsg, renderProgress). If one of those is renamed
// in index.html, update it here too.

export const SITE_URL = 'https://richardpappous.github.io/Subject-Study-Guide/';

// The five sections, in bottom-bar order. `key` must match the site's VIEWS list.
export const TABS = [
  { key: 'practice', title: 'Practice', focusedIcon: 'pencil', unfocusedIcon: 'pencil-outline' },
  { key: 'terms', title: 'Terms', focusedIcon: 'book-open-variant', unfocusedIcon: 'book-open-outline' },
  { key: 'formulas', title: 'Formulas', focusedIcon: 'function-variant', unfocusedIcon: 'function' },
  { key: 'tests', title: 'Tests', focusedIcon: 'clipboard-check', unfocusedIcon: 'clipboard-check-outline' },
  { key: 'progress', title: 'Progress', focusedIcon: 'chart-box', unfocusedIcon: 'chart-box-outline' },
];

// Runs before the page draws, so it starts in the right light/dark mode with no flash.
export const themeScript = (dark) =>
  `document.documentElement.setAttribute('data-theme','${dark ? 'dark' : 'light'}');true;`;

// Runs once the page has loaded.
export const BRIDGE = `(function(){
  if (window.__ssgApp) return; window.__ssgApp = true;
  var post = function (o) { window.ReactNativeWebView.postMessage(JSON.stringify(o)); };

  // The native top bar and bottom bar replace the page's title and section tabs.
  var st = document.createElement('style');
  // (.tabbar is the site's own phone tab bar; the app has a native one instead.)
  st.textContent = 'body>.wrap>header,.views,.tabbar{display:none!important}' +
    'body{padding-bottom:48px!important}' +
    '.nav{margin-top:4px}' +
    'html{-webkit-tap-highlight-color:transparent}';
  document.head.appendChild(st);

  try {
    // Tell the app whenever the section changes, so the bottom bar stays in sync.
    var sv = setView;
    setView = function (v) { sv(v); post({ type: 'view', view: view }); };

    // Backups: WebViews can't download files or use the web clipboard,
    // so hand the data to the phone instead.
    var fname = function (o) {
      return 'study-guide-' + String(o.name || 'progress').replace(/[^\\w-]+/g, '-') + '-' +
        new Date().toISOString().slice(0, 10) + '.json';
    };
    copyBackup = function () {
      post({ type: 'copy', code: 'SSG1:' + b64e(JSON.stringify(backupObj())) });
      BK.code = ''; markBackup();
      bkMsg('Backup code copied. Paste it somewhere safe, like a note or a message to yourself.', 'good');
    };
    saveBackupFile = function () {
      var o = backupObj();
      post({ type: 'file', name: fname(o), text: JSON.stringify(o) });
      BK.code = ''; markBackup();
      bkMsg('Pick where to save or send your backup file.', 'good');
    };
    if (view === 'progress') renderProgress(); // re-bind the backup buttons if they're showing

    // Vibrate on right and wrong answers.
    // (#fb is rebuilt with every new problem, so watch the whole problem card.)
    var card = document.getElementById('pcard');
    if (card) new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.target.id !== 'fb') return;
        var f = m.target.querySelector('.fb');
        if (f && f.classList.contains('good')) post({ type: 'haptic', kind: 'good' });
        else if (f && f.classList.contains('bad')) post({ type: 'haptic', kind: 'bad' });
      });
    }).observe(card, { childList: true, subtree: true });

    // Track the student menu and feedback form so the phone's back button can close them.
    var menu = document.getElementById('whomenu'), sheet = document.getElementById('fbsheet');
    var sendOpen = function () {
      post({ type: 'menu', open: !!(menu && !menu.hidden) || !!(sheet && !sheet.hidden) });
    };
    [menu, sheet].forEach(function (el) {
      if (el) new MutationObserver(sendOpen).observe(el, { attributes: true, attributeFilter: ['hidden'] });
    });

    post({ type: 'ready', view: view });
  } catch (e) {
    post({ type: 'error', message: String(e && e.message || e) });
  }
})();true;`;

// Commands the app sends into the page.
export const goTo = (v) => `setView(${JSON.stringify(v)});true;`;
export const BACK = `var fs = document.getElementById('fbsheet');
if (fs && !fs.hidden) { closeFeedback(); } else if (WM.open) { closeMenu(); } else if (view !== 'practice') { setView('practice'); }true;`;
