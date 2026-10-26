(function () {
  'use strict';

  var API = window.IMPERIVM_API;
  var meBox = document.getElementById('me-body');
  var pollSection = document.getElementById('poll');
  var pollBox = document.getElementById('poll-body');
  if (!API || !meBox) return;

  var LANG = { es: 'es-ES', en: 'en-GB', it: 'it-IT' };
  var lang = LANG[document.documentElement.lang] ? document.documentElement.lang : 'es';
  var T = {
    es: {
      signIn: 'Entrar con Steam', signOut: 'Salir', intro: 'Entra con tu cuenta de Steam para cambiar tu nombre, tu frase o si se ve tu importe en la tabla.',
      who: 'Has entrado como {who}.', notPatron: 'No encontramos donaciones con esta cuenta de Steam. Si has donado, escríbenos por Discord con tu perfil y la añadimos.',
      place: 'Puesto {place} · {total} en total', notOnRoll: 'Ahora mismo no sales en la tabla.', name: 'Nombre en la tabla', quote: 'Tu frase (opcional)',
      public: 'Salir en la tabla', showAmount: 'Mostrar mi importe', save: 'Guardar', saved: 'Guardado.', saveError: 'No se ha podido guardar. Prueba otra vez.',
      loginInvalid: 'No se ha podido entrar con Steam. Prueba otra vez.', loginCancelled: 'Has cancelado la entrada con Steam.', loginExpired: 'La entrada ha caducado. Prueba otra vez.',
      unavailable: 'Ahora mismo no se puede entrar. Prueba dentro de un rato.',
      vote: 'Votar', voted: 'Has votado «{option}». El resultado se verá cuando cierre, el {date}.', closes: 'Cierra el {date}.',
      closed: 'Votación cerrada. Resultado:', onlyPatrons: 'Solo pueden votar los patronos.', signInToVote: 'Entra con Steam para votar.',
      votes: '{n} votos', oneVote: '1 voto', noVotes: 'Nadie votó.', voteError: 'No se ha podido votar. Prueba otra vez.', pick: 'Elige una opción.'
    },
    en: {
      signIn: 'Sign in with Steam', signOut: 'Sign out', intro: 'Sign in with your Steam account to change your name, your quote or whether your amount shows on the roll.',
      who: 'Signed in as {who}.', notPatron: 'We found no donations for this Steam account. If you donated, write to us on Discord with your profile and we will add it.',
      place: 'Place {place} · {total} in total', notOnRoll: 'You are not on the roll right now.', name: 'Name on the roll', quote: 'Your quote (optional)',
      public: 'Show me on the roll', showAmount: 'Show my amount', save: 'Save', saved: 'Saved.', saveError: 'Could not save. Try again.',
      loginInvalid: 'Could not sign in with Steam. Try again.', loginCancelled: 'You cancelled the Steam sign-in.', loginExpired: 'The sign-in expired. Try again.',
      unavailable: 'Signing in is not available right now. Try again in a while.',
      vote: 'Vote', voted: 'You voted "{option}". The result will show when it closes, on {date}.', closes: 'Closes on {date}.',
      closed: 'Poll closed. Result:', onlyPatrons: 'Only patrons can vote.', signInToVote: 'Sign in with Steam to vote.',
      votes: '{n} votes', oneVote: '1 vote', noVotes: 'Nobody voted.', voteError: 'Could not vote. Try again.', pick: 'Pick an option.'
    },
    it: {
      signIn: 'Entra con Steam', signOut: 'Esci', intro: 'Entra con il tuo account Steam per cambiare il tuo nome, la tua frase o se si vede il tuo importo nell\'albo.',
      who: 'Sei entrato come {who}.', notPatron: 'Non troviamo donazioni con questo account Steam. Se hai donato, scrivici su Discord con il tuo profilo e lo aggiungiamo.',
      place: 'Posto {place} · {total} in totale', notOnRoll: 'Al momento non compari nell\'albo.', name: 'Nome nell\'albo', quote: 'La tua frase (facoltativa)',
      public: 'Comparire nell\'albo', showAmount: 'Mostrare il mio importo', save: 'Salva', saved: 'Salvato.', saveError: 'Impossibile salvare. Riprova.',
      loginInvalid: 'Impossibile entrare con Steam. Riprova.', loginCancelled: 'Hai annullato l\'accesso con Steam.', loginExpired: 'L\'accesso è scaduto. Riprova.',
      unavailable: 'Al momento non si può entrare. Riprova tra un po\'.',
      vote: 'Vota', voted: 'Hai votato «{option}». Il risultato si vedrà alla chiusura, il {date}.', closes: 'Chiude il {date}.',
      closed: 'Votazione chiusa. Risultato:', onlyPatrons: 'Possono votare solo i patroni.', signInToVote: 'Entra con Steam per votare.',
      votes: '{n} voti', oneVote: '1 voto', noVotes: 'Nessuno ha votato.', voteError: 'Impossibile votare. Riprova.', pick: 'Scegli un\'opzione.'
    }
  }[lang];

  function fill(text, values) { return text.replace(/\{(\w+)\}/g, function (m, k) { return values[k] != null ? values[k] : m; }); }
  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function money(n) {
    try { return new Intl.NumberFormat(LANG[lang], { style: 'currency', currency: 'EUR', maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n); } catch (e) { return n + ' €'; }
  }
  function date(ms) { return new Date(ms).toLocaleString(LANG[lang], { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); }
  function call(method, path, body) {
    var opts = { method: method, credentials: 'include', headers: {} };
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch(API + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) { var err = new Error(data.error || 'HTTP ' + r.status); err.status = r.status; throw err; }
        return data;
      });
    });
  }
  function withoutLogin() {
    var u = new URL(location.href);
    u.searchParams.delete('login');
    return u;
  }
  function signInUrl() {
    var back = withoutLogin();
    back.hash = 'me';
    return API + '/v1/auth/steam?return=' + encodeURIComponent(back.toString());
  }
  function signInButton() {
    var a = el('a', 'button button--accent', T.signIn);
    a.href = signInUrl();
    return a;
  }
  function done(box) {
    Array.prototype.forEach.call(box.querySelectorAll('[data-skeleton]'), function (n) { n.parentNode.removeChild(n); });
    box.removeAttribute('aria-busy');
  }

  // Steam sends the browser back with ?login=...; say how it went once and tidy the address.
  var loginResult = (/[?&]login=(\w+)/.exec(location.search) || [])[1];
  if (loginResult && window.history && history.replaceState) {
    history.replaceState(null, '', withoutLogin().toString());
  }
  var loginMessage = { invalid: T.loginInvalid, cancelled: T.loginCancelled, expired: T.loginExpired }[loginResult];

  var signedIn = false;
  refresh();

  function refresh() {
    call('GET', '/v1/me').then(function (me) {
      signedIn = !!me.signedIn;
      renderMe(me);
    }, function () {
      done(meBox);
      meBox.textContent = '';
      meBox.appendChild(el('p', 'me__text', T.unavailable));
    }).then(loadPoll);
  }

  function renderMe(me) {
    done(meBox);
    meBox.textContent = '';
    if (loginMessage) { meBox.appendChild(el('p', 'me__status me__status--error', loginMessage)); loginMessage = null; }
    if (!me.signedIn) {
      meBox.appendChild(el('p', 'me__text', T.intro));
      meBox.appendChild(signInButton());
      return;
    }
    var who = el('p', 'me__who');
    if (me.avatar) {
      var img = el('img', 'me__avatar');
      img.src = me.avatar; img.alt = ''; img.width = 40; img.height = 40;
      who.appendChild(img);
    }
    who.appendChild(el('span', '', fill(T.who, { who: me.persona || me.steamid })));
    meBox.appendChild(who);

    if (!me.patron) {
      meBox.appendChild(el('p', 'me__text', T.notPatron));
    } else {
      var p = me.patron;
      meBox.appendChild(el('p', 'me__place', p.place ? fill(T.place, { place: p.place, total: money(p.total) }) : T.notOnRoll));
      var form = el('form', 'me__form');
      var name = field(form, T.name, 'input', p.name, 60, true);
      var quote = field(form, T.quote, 'input', p.quote || '', 160, false);
      var pub = check(form, T.public, p.public);
      var show = check(form, T.showAmount, p.showAmount);
      var save = el('button', 'button button--accent', T.save);
      save.type = 'submit';
      var status = el('p', 'me__status');
      status.setAttribute('role', 'status');
      form.appendChild(save);
      form.appendChild(status);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        save.disabled = true;
        call('PATCH', '/v1/me/patron', { name: name.value, quote: quote.value, public: pub.checked, showAmount: show.checked }).then(function () {
          status.textContent = T.saved;
          status.className = 'me__status';
        }, function () {
          status.textContent = T.saveError;
          status.className = 'me__status me__status--error';
        }).then(function () { save.disabled = false; });
      });
      meBox.appendChild(form);
    }
    var out = el('button', 'me__signout', T.signOut);
    out.type = 'button';
    out.addEventListener('click', function () { call('POST', '/v1/auth/logout').then(refresh, refresh); });
    meBox.appendChild(out);
  }

  function field(form, label, tag, value, max, required) {
    var l = el('label', 'me__field');
    l.appendChild(el('span', '', label));
    var input = el(tag);
    input.value = value; input.maxLength = max; input.required = required;
    l.appendChild(input);
    form.appendChild(l);
    return input;
  }
  function check(form, label, checked) {
    var l = el('label', 'me__check');
    var input = el('input');
    input.type = 'checkbox'; input.checked = !!checked;
    l.appendChild(input);
    l.appendChild(el('span', '', label));
    form.appendChild(l);
    return input;
  }

  function loadPoll() {
    if (!pollBox) return;
    call('GET', '/v1/polls/current').then(function (data) { renderPoll(data.poll); }, function () { pollSection.hidden = true; });
  }

  function renderPoll(poll) {
    if (!poll) { pollSection.hidden = true; return; }
    pollSection.hidden = false;
    pollBox.textContent = '';
    pollBox.appendChild(el('h3', 'poll__question', poll.question[lang] || poll.question.es));
    var label = function (o) { return o.label[lang] || o.label.es; };

    if (!poll.open) {
      pollBox.appendChild(el('p', 'poll__note', T.closed));
      var total = 0;
      poll.options.forEach(function (o) { total += poll.results[o.id] || 0; });
      if (!total) { pollBox.appendChild(el('p', 'poll__note', T.noVotes)); return; }
      var best = Math.max.apply(null, poll.options.map(function (o) { return poll.results[o.id] || 0; }));
      var list = el('ul', 'poll__results');
      poll.options.forEach(function (o) {
        var n = poll.results[o.id] || 0;
        var li = el('li', 'poll__result' + (n === best ? ' poll__result--winner' : ''));
        var head = el('span', 'poll__result-head');
        head.appendChild(el('span', '', label(o)));
        head.appendChild(el('span', 'poll__count', n === 1 ? T.oneVote : fill(T.votes, { n: n })));
        li.appendChild(head);
        var bar = el('span', 'poll__bar');
        var fillBar = el('span', 'poll__fill');
        fillBar.style.width = Math.round(n / total * 100) + '%';
        bar.appendChild(fillBar);
        li.appendChild(bar);
        list.appendChild(li);
      });
      pollBox.appendChild(list);
      return;
    }

    if (poll.myVote) {
      var mine = poll.options.filter(function (o) { return o.id === poll.myVote; })[0];
      pollBox.appendChild(el('p', 'poll__note poll__note--strong', fill(T.voted, { option: mine ? label(mine) : poll.myVote, date: date(poll.closesAt) })));
      return;
    }

    var form = el('form', 'poll__form');
    poll.options.forEach(function (o) {
      var l = el('label', 'poll__option');
      var input = el('input');
      input.type = 'radio'; input.name = 'poll-option'; input.value = o.id; input.disabled = !poll.canVote;
      l.appendChild(input);
      l.appendChild(el('span', '', label(o)));
      form.appendChild(l);
    });
    var note = el('p', 'poll__note', fill(T.closes, { date: date(poll.closesAt) }));
    form.appendChild(note);
    if (poll.canVote) {
      var submit = el('button', 'button button--accent', T.vote);
      submit.type = 'submit';
      var status = el('p', 'me__status');
      status.setAttribute('role', 'status');
      form.appendChild(submit);
      form.appendChild(status);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var picked = form.querySelector('input:checked');
        if (!picked) { status.textContent = T.pick; status.className = 'me__status me__status--error'; return; }
        submit.disabled = true;
        call('POST', '/v1/polls/' + poll.id + '/vote', { option: picked.value }).then(loadPoll, function () {
          status.textContent = T.voteError;
          status.className = 'me__status me__status--error';
          submit.disabled = false;
        });
      });
    } else if (!signedIn) {
      form.appendChild(el('p', 'poll__note', T.signInToVote));
      form.appendChild(signInButton());
    } else {
      form.appendChild(el('p', 'poll__note', T.onlyPatrons));
    }
    pollBox.appendChild(form);
  }
})();
