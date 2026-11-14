(function () {
  'use strict';

  var API = window.IMPERIVM_API;
  var card = document.getElementById('link-card');
  if (!API || !card) return;

  var lang = ['es', 'en', 'it'].indexOf(document.documentElement.lang) >= 0 ? document.documentElement.lang : 'es';
  var T = {
    es: {
      signInText: 'Entra con Steam con la misma cuenta con la que juegas.', signIn: 'Entrar con Steam',
      account: 'Cuenta de Steam', notYou: '¿No es la cuenta con la que juegas? Entra con otra.',
      codeLabel: 'Código del juego', submit: 'Vincular', working: 'Vinculando…',
      short: 'El código tiene 8 caracteres.', alphabet: 'Los códigos no llevan 0, O, 1, I ni L.',
      invalid: 'Ese código no existe. Revisa que lo has copiado bien.',
      expired: 'El código ha caducado: dura 10 minutos. Pide uno nuevo en el juego.',
      mismatch: 'El código se pidió desde otra cuenta de Steam. Entra en la web con la misma cuenta con la que juegas.',
      mismatchHint: 'Si Steam vuelve a entrar con esta cuenta, cierra antes la sesión en steamcommunity.com.',
      switchAccount: 'Entrar con otra cuenta',
      failed: 'No se ha podido vincular. Prueba otra vez dentro de un momento.',
      offline: 'No se puede conectar con el servidor de la liga. Prueba otra vez dentro de un momento.', retry: 'Reintentar',
      doneTitle: 'Juego vinculado.', doneText: 'Vuelve al juego: en unos segundos verás tu cuenta. Ya puedes cerrar esta página.',
      loginInvalid: 'No se ha podido entrar con Steam. Prueba otra vez.', loginCancelled: 'Has cancelado la entrada con Steam.', loginExpired: 'La entrada ha caducado. Prueba otra vez.'
    },
    en: {
      signInText: 'Sign in with Steam using the same account you play with.', signIn: 'Sign in with Steam',
      account: 'Steam account', notYou: 'Not the account you play with? Sign in with another one.',
      codeLabel: 'Code from the game', submit: 'Link', working: 'Linking…',
      short: 'The code has 8 characters.', alphabet: 'Codes never contain 0, O, 1, I or L.',
      invalid: 'That code does not exist. Check that you copied it correctly.',
      expired: 'The code has expired: it lasts 10 minutes. Get a new one in the game.',
      mismatch: 'The code was requested from another Steam account. Sign in on the website with the same account you play with.',
      mismatchHint: 'If Steam signs you in with this account again, sign out of steamcommunity.com first.',
      switchAccount: 'Sign in with another account',
      failed: 'Could not link the game. Try again in a moment.',
      offline: 'Cannot reach the league server. Try again in a moment.', retry: 'Try again',
      doneTitle: 'Game linked.', doneText: 'Go back to the game: your account will show up in a few seconds. You can close this page.',
      loginInvalid: 'Could not sign in with Steam. Try again.', loginCancelled: 'You cancelled the Steam sign-in.', loginExpired: 'The sign-in expired. Try again.'
    },
    it: {
      signInText: 'Entra con Steam con lo stesso account con cui giochi.', signIn: 'Entra con Steam',
      account: 'Account Steam', notYou: 'Non è l\'account con cui giochi? Entra con un altro.',
      codeLabel: 'Codice del gioco', submit: 'Collega', working: 'Collegamento…',
      short: 'Il codice ha 8 caratteri.', alphabet: 'I codici non contengono 0, O, 1, I né L.',
      invalid: 'Questo codice non esiste. Controlla di averlo copiato bene.',
      expired: 'Il codice è scaduto: dura 10 minuti. Chiedine uno nuovo nel gioco.',
      mismatch: 'Il codice è stato richiesto da un altro account Steam. Entra nel sito con lo stesso account con cui giochi.',
      mismatchHint: 'Se Steam ti fa entrare di nuovo con questo account, esci prima da steamcommunity.com.',
      switchAccount: 'Entra con un altro account',
      failed: 'Impossibile collegare il gioco. Riprova tra un momento.',
      offline: 'Impossibile raggiungere il server della lega. Riprova tra un momento.', retry: 'Riprova',
      doneTitle: 'Gioco collegato.', doneText: 'Torna al gioco: tra pochi secondi vedrai il tuo account. Puoi chiudere questa pagina.',
      loginInvalid: 'Impossibile entrare con Steam. Riprova.', loginCancelled: 'Hai annullato l\'accesso con Steam.', loginExpired: 'L\'accesso è scaduto. Riprova.'
    }
  }[lang];

  // The game's codes leave out characters that look alike.
  var NOT_IN_CODE = /[^ABCDEFGHJKMNPQRSTUVWXYZ23456789]/g;
  function cleanCode(value) { return String(value || '').toUpperCase().replace(/[\s-]/g, '').replace(NOT_IN_CODE, '').slice(0, 8); }
  function shown(code) { return code.length > 4 ? code.slice(0, 4) + '-' + code.slice(4) : code; }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function call(method, path, body) {
    var opts = { method: method, credentials: 'include', headers: {} };
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch(API + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) { var err = new Error(data.message || data.error || 'HTTP ' + r.status); err.status = r.status; err.code = data.error; throw err; }
        return data;
      });
    });
  }

  var url = new URL(location.href);
  var code = cleanCode(url.searchParams.get('code'));
  // Steam sends the browser back with ?login=...; say how it went once and tidy the address.
  var loginMessage = { invalid: T.loginInvalid, cancelled: T.loginCancelled, expired: T.loginExpired }[url.searchParams.get('login')];
  if (url.searchParams.has('login') && window.history && history.replaceState) {
    url.searchParams.delete('login');
    history.replaceState(null, '', url.toString());
  }

  /** This page with the code typed so far, so it comes back filled in after signing in with Steam. */
  function here() {
    var back = new URL(location.href);
    back.searchParams.delete('login');
    if (code) back.searchParams.set('code', shown(code)); else back.searchParams.delete('code');
    back.hash = '';
    return back.toString();
  }
  function goSignIn() { location.href = API + '/v1/auth/steam?return=' + encodeURIComponent(here()); }

  function steamButton(label, onClick) {
    var b = el('button', 'button button--accent link-card__steam');
    b.type = 'button';
    var ns = 'http://www.w3.org/2000/svg';
    var icon = document.createElementNS(ns, 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#steam');
    icon.appendChild(use);
    b.appendChild(icon);
    b.appendChild(el('span', '', label));
    b.addEventListener('click', onClick);
    return b;
  }
  function statusLine(text, error) {
    var p = el('p', 'link-card__status' + (error ? ' link-card__status--error' : ''), text || '');
    p.setAttribute('role', error ? 'alert' : 'status');
    return p;
  }
  function switchAccount() {
    // Sign out here first; otherwise Steam would hand back the same session.
    call('POST', '/v1/auth/logout').then(goSignIn, goSignIn);
  }

  function renderSignIn() {
    card.textContent = '';
    if (loginMessage) { card.appendChild(statusLine(loginMessage, true)); loginMessage = null; }
    card.appendChild(el('p', 'link-card__text', T.signInText));
    card.appendChild(steamButton(T.signIn, goSignIn));
  }

  function renderOffline() {
    card.textContent = '';
    card.appendChild(statusLine(T.offline, true));
    var retry = el('button', 'button button--small link-card__retry', T.retry);
    retry.type = 'button';
    retry.addEventListener('click', start);
    card.appendChild(retry);
  }

  function renderDone(me) {
    card.textContent = '';
    card.classList.add('link-card--done');
    var mark = el('span', 'link-card__check');
    mark.setAttribute('aria-hidden', 'true');
    card.appendChild(mark);
    card.appendChild(el('h2', 'link-card__done', T.doneTitle));
    card.appendChild(el('p', 'link-card__text', T.doneText));
    card.appendChild(account(me));
  }

  function account(me) {
    var row = el('div', 'link-card__account');
    if (me.avatar) {
      var img = el('img', 'link-card__avatar');
      img.src = me.avatar; img.alt = ''; img.width = 40; img.height = 40;
      row.appendChild(img);
    }
    var who = el('div');
    who.appendChild(el('span', 'link-card__label', T.account));
    who.appendChild(el('strong', 'link-card__name', me.persona || me.steamid));
    row.appendChild(who);
    return row;
  }

  function renderForm(me) {
    card.textContent = '';
    card.classList.remove('link-card--done');
    card.appendChild(account(me));

    var form = el('form', 'link-form');
    form.noValidate = true;
    var label = el('label', 'link-card__label', T.codeLabel);
    label.htmlFor = 'link-code';
    var input = el('input', 'link-code');
    input.id = 'link-code';
    input.name = 'code';
    input.value = shown(code);
    input.maxLength = 9;
    input.placeholder = 'ABCD-2345';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocapitalize', 'characters');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('inputmode', 'text');
    var submit = el('button', 'button button--accent', T.submit);
    submit.type = 'submit';
    var status = statusLine('');
    var extra = el('div', 'link-card__extra');
    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(submit);
    form.appendChild(status);
    form.appendChild(extra);
    card.appendChild(form);

    var other = el('button', 'link-card__switch', T.notYou);
    other.type = 'button';
    other.addEventListener('click', switchAccount);
    card.appendChild(other);

    function say(text, error) { status.textContent = text; status.className = 'link-card__status' + (error ? ' link-card__status--error' : ''); status.setAttribute('role', error ? 'alert' : 'status'); }

    input.addEventListener('input', function () {
      var typed = input.value.toUpperCase().replace(/[\s-]/g, '');
      code = cleanCode(typed);
      input.value = shown(code);
      if (typed.slice(0, 8) !== code) say(T.alphabet, true); else if (status.textContent === T.alphabet) say('');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      extra.textContent = '';
      code = cleanCode(input.value);
      if (code.length !== 8) { say(T.short, true); input.focus(); return; }
      submit.disabled = true;
      say(T.working);
      call('POST', '/v1/link/confirm', { code: shown(code) }).then(function () {
        renderDone(me);
      }, function (err) {
        submit.disabled = false;
        if (err.code === 'unauthorized') { renderSignIn(); return; }
        if (err.code === 'steam_mismatch') {
          say(T.mismatch, true);
          extra.appendChild(el('p', 'link-card__hint', T.mismatchHint));
          extra.appendChild(steamButton(T.switchAccount, switchAccount));
          return;
        }
        say(err.code === 'invalid_code' ? T.invalid : err.code === 'expired' ? T.expired : T.failed, true);
        if (err.code === 'invalid_code') input.focus();
      });
    });

    if (loginMessage) { say(loginMessage, true); loginMessage = null; }
    if (code.length === 8) submit.focus({ preventScroll: true });
  }

  function start() {
    call('GET', '/v1/me').then(function (me) {
      if (me.signedIn) renderForm(me); else renderSignIn();
    }, renderOffline);
  }
  start();
})();
