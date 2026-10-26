(function () {
  'use strict';

  var API = window.IMPERIVM_API;
  var pollSection = document.getElementById('poll');
  var pollBox = document.getElementById('poll-body');
  if (!API || !pollBox) return;

  var LANG = { es: 'es-ES', en: 'en-GB', it: 'it-IT' };
  var lang = LANG[document.documentElement.lang] ? document.documentElement.lang : 'es';
  var T = {
    es: {
      signIn: 'Entrar con Steam',
      loginInvalid: 'No se ha podido entrar con Steam. Prueba otra vez.', loginCancelled: 'Has cancelado la entrada con Steam.', loginExpired: 'La entrada ha caducado. Prueba otra vez.',
      vote: 'Votar', voted: 'Has votado «{option}». El resultado se verá cuando cierre, el {date}.', closes: 'Cierra el {date}.',
      closed: 'Votación cerrada. Resultado:', onlyPatrons: 'Solo pueden votar los patronos.', signInToVote: 'Entra con Steam para votar.',
      votes: '{n} votos', oneVote: '1 voto', noVotes: 'Nadie votó.', voteError: 'No se ha podido votar. Prueba otra vez.', pick: 'Elige una opción.',
      emptyLabel: 'Sin votación abierta', emptyTitle: 'La próxima la decidís vosotros.',
      emptyText: 'Cuando abramos una votación, la anunciaremos en Discord y aparecerá aquí. Votan los patronos con su cuenta de Steam, y la opción que gane es la siguiente función del mod.',
      emptyExample: 'Así se verá', emptyOptions: ['Partidas clasificatorias', 'Nuevos mapas aleatorios', 'Más civilizaciones'],
      emptyDonate: 'Hazte patrono', emptyDiscord: 'Te avisamos en Discord'
    },
    en: {
      signIn: 'Sign in with Steam',
      loginInvalid: 'Could not sign in with Steam. Try again.', loginCancelled: 'You cancelled the Steam sign-in.', loginExpired: 'The sign-in expired. Try again.',
      vote: 'Vote', voted: 'You voted "{option}". The result will show when it closes, on {date}.', closes: 'Closes on {date}.',
      closed: 'Poll closed. Result:', onlyPatrons: 'Only patrons can vote.', signInToVote: 'Sign in with Steam to vote.',
      votes: '{n} votes', oneVote: '1 vote', noVotes: 'Nobody voted.', voteError: 'Could not vote. Try again.', pick: 'Pick an option.',
      emptyLabel: 'No poll open', emptyTitle: 'You decide the next one.',
      emptyText: 'When we open a poll, we will announce it on Discord and it will show up here. Patrons vote with their Steam account, and the winning option is the next feature of the mod.',
      emptyExample: 'What it will look like', emptyOptions: ['Ranked matches', 'New random maps', 'More civilizations'],
      emptyDonate: 'Become a patron', emptyDiscord: 'Get notified on Discord'
    },
    it: {
      signIn: 'Entra con Steam',
      loginInvalid: 'Impossibile entrare con Steam. Riprova.', loginCancelled: 'Hai annullato l\'accesso con Steam.', loginExpired: 'L\'accesso è scaduto. Riprova.',
      vote: 'Vota', voted: 'Hai votato «{option}». Il risultato si vedrà alla chiusura, il {date}.', closes: 'Chiude il {date}.',
      closed: 'Votazione chiusa. Risultato:', onlyPatrons: 'Possono votare solo i patroni.', signInToVote: 'Entra con Steam per votare.',
      votes: '{n} voti', oneVote: '1 voto', noVotes: 'Nessuno ha votato.', voteError: 'Impossibile votare. Riprova.', pick: 'Scegli un\'opzione.',
      emptyLabel: 'Nessuna votazione aperta', emptyTitle: 'La prossima la decidete voi.',
      emptyText: 'Quando apriremo una votazione, la annunceremo su Discord e comparirà qui. Votano i patroni con il loro account Steam, e l\'opzione vincente è la prossima funzione della mod.',
      emptyExample: 'Ecco come sarà', emptyOptions: ['Partite classificate', 'Nuove mappe casuali', 'Più civiltà'],
      emptyDonate: 'Diventa patrono', emptyDiscord: 'Ti avvisiamo su Discord'
    }
  }[lang];

  function fill(text, values) { return text.replace(/\{(\w+)\}/g, function (m, k) { return values[k] != null ? values[k] : m; }); }
  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
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
    back.hash = 'poll';
    return API + '/v1/auth/steam?return=' + encodeURIComponent(back.toString());
  }
  function signInButton() {
    var a = el('a', 'button button--accent', T.signIn);
    a.href = signInUrl();
    return a;
  }

  // Steam sends the browser back with ?login=...; say how it went once and tidy the address.
  var loginResult = (/[?&]login=(\w+)/.exec(location.search) || [])[1];
  if (loginResult && window.history && history.replaceState) {
    history.replaceState(null, '', withoutLogin().toString());
  }
  var loginMessage = { invalid: T.loginInvalid, cancelled: T.loginCancelled, expired: T.loginExpired }[loginResult];

  var signedIn = false;
  refresh();

  // Signing in with Steam is only needed to vote; the patrons' own details are changed on request on Discord.
  function refresh() {
    call('GET', '/v1/me').then(function (me) { signedIn = !!me.signedIn; }, function () { signedIn = false; }).then(loadPoll);
  }

  function showLoginMessage() {
    if (!loginMessage) return;
    pollBox.appendChild(el('p', 'poll__status poll__status--error', loginMessage));
    loginMessage = null;
  }

  function loadPoll() {
    if (!pollBox) return;
    call('GET', '/v1/polls/current').then(function (data) { renderPoll(data.poll); }, function () { pollSection.hidden = true; });
  }

  // No poll open: a preview of what one looks like, so the section invites instead of looking empty.
  function renderPollEmpty() {
    pollSection.hidden = false;
    pollBox.textContent = '';
    showLoginMessage();
    var box = el('div', 'poll-empty');
    var head = el('div', 'poll-empty__head');
    var ns = 'http://www.w3.org/2000/svg';
    var medal = document.createElementNS(ns, 'svg');
    medal.setAttribute('class', 'medal medal--1');
    medal.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#laurel');
    medal.appendChild(use);
    head.appendChild(medal);
    var titles = el('div');
    titles.appendChild(el('p', 'guide-mini', T.emptyLabel));
    titles.appendChild(el('h3', 'poll__question', T.emptyTitle));
    head.appendChild(titles);
    box.appendChild(head);
    box.appendChild(el('p', 'poll-empty__text', T.emptyText));

    var ghost = el('div', 'poll-empty__ghost');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.appendChild(el('span', 'poll-empty__tag', T.emptyExample));
    [58, 29, 13].forEach(function (pct, i) {
      var row = el('div', 'poll-empty__row');
      var top = el('span', 'poll__result-head');
      top.appendChild(el('span', '', T.emptyOptions[i]));
      top.appendChild(el('span', 'poll__count', pct + ' %'));
      row.appendChild(top);
      var bar = el('span', 'poll__bar');
      var fillBar = el('span', 'poll__fill poll-empty__fill');
      fillBar.style.setProperty('--to', pct + '%');
      fillBar.style.animationDelay = (i * 0.25) + 's';
      bar.appendChild(fillBar);
      row.appendChild(bar);
      ghost.appendChild(row);
    });
    box.appendChild(ghost);

    var actions = el('div', 'poll-empty__actions');
    var donate = el('a', 'button button--accent', T.emptyDonate);
    donate.href = '#donate';
    actions.appendChild(donate);
    var discord = el('a', 'guide-link', T.emptyDiscord + ' ↗');
    discord.href = 'https://discord.gg/6kCatX3Zbc';
    discord.target = '_blank';
    discord.rel = 'noopener';
    actions.appendChild(discord);
    box.appendChild(actions);
    pollBox.appendChild(box);
  }

  function renderPoll(poll) {
    if (!poll) { renderPollEmpty(); return; }
    pollSection.hidden = false;
    pollBox.textContent = '';
    showLoginMessage();
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
      var status = el('p', 'poll__status');
      status.setAttribute('role', 'status');
      form.appendChild(submit);
      form.appendChild(status);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var picked = form.querySelector('input:checked');
        if (!picked) { status.textContent = T.pick; status.className = 'poll__status poll__status--error'; return; }
        submit.disabled = true;
        call('POST', '/v1/polls/' + poll.id + '/vote', { option: picked.value }).then(loadPoll, function () {
          status.textContent = T.voteError;
          status.className = 'poll__status poll__status--error';
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
