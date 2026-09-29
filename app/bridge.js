// Scripts injected into the website so the native app and the page can talk.
// They only call functions that already exist in index.html (setView, closeMenu,
// backupObj, b64e, markBackup, bkMsg, renderProgress). If one of those is renamed
// in index.html, update it here too.

export const SITE_URL = 'https://richardpappous.github.io/ProofApp/';

// The five sections, in bottom-bar order. `key` must match the site's VIEWS list.
export const TABS = [
  { key: 'practice', title: 'Practice', focusedIcon: 'pencil', unfocusedIcon: 'pencil-outline' },
  { key: 'terms', title: 'Terms', focusedIcon: 'book-open-variant', unfocusedIcon: 'book-open-outline' },
  { key: 'formulas', title: 'Formulas', focusedIcon: 'function-variant', unfocusedIcon: 'function' },
  { key: 'tests', title: 'Tests', focusedIcon: 'clipboard-check', unfocusedIcon: 'clipboard-check-outline' },
  { key: 'progress', title: 'Progress', focusedIcon: 'chart-box', unfocusedIcon: 'chart-box-outline' },
];

// Runs before the page draws, so it starts in the right light/dark mode with no flash.
// If the student picked Light or Dark in the site's Theme menu, that choice wins over the phone's setting.
export const themeScript = (dark) =>
  `(function(){var t=null;try{t=localStorage.getItem('ssg-theme')}catch(e){}
  if(t!=='light'&&t!=='dark')document.documentElement.setAttribute('data-theme','${dark ? 'dark' : 'light'}');})();true;`;

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
    // On subjects people make, the Formulas tab becomes "Add".
    var isAdd = function () { return typeof isCustom === 'function' && isCustom(subj); };
    var ss = setSubj;
    setSubj = function (id) { ss(id); post({ type: 'subject', add: isAdd() }); };
    // Theme menu (Auto / Light / Dark): tell the app so its own bars match the page.
    if (typeof setTheme === 'function') {
      var st2 = setTheme;
      setTheme = function (t) { st2(t); post({ type: 'theme', pref: t }); };
      post({ type: 'theme', pref: themePref });
    }

    // Backups: WebViews can't download files or use the web clipboard,
    // so hand the data to the phone instead.
    var fname = function (o) {
      return 'proof-backup-' + String(o.name || 'progress').replace(/[^\\w-]+/g, '-') + '-' +
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

    // The site's general copy/save helpers (used for sharing custom subjects).
    if (typeof copyText === 'function') copyText = function (text, ok) { post({ type: 'copy', code: text, label: 'Copied' }); ok(); };
    if (typeof downloadFile === 'function') downloadFile = function (name, text) { post({ type: 'file', name: name, text: text }); return true; };

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

    // Track the menu and pop-up panels so the phone's back button closes them instead of leaving the app.
    var panels = ['whomenu', 'fbsheet', 'cmgr', 'frsheet', 'ptsheet'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var sendOpen = function () {
      post({ type: 'menu', open: panels.some(function (el) { return !el.hidden; }) });
    };
    panels.forEach(function (el) {
      new MutationObserver(sendOpen).observe(el, { attributes: true, attributeFilter: ['hidden'] });
    });

    post({ type: 'ready', view: view, add: isAdd() });
  } catch (e) {
    post({ type: 'error', message: String(e && e.message || e) });
  }
})();true;`;

// Commands the app sends into the page.
export const goTo = (v) => `setView(${JSON.stringify(v)});true;`;
// appBack() (in index.html) closes whichever panel or menu is open and returns true if it did.
export const BACK = `if (!(typeof appBack === 'function' && appBack())) {
  if (WM.open) { closeMenu(); } else if (view !== 'practice') { setView('practice'); }
}true;`;
