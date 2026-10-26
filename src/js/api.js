// Where the donations API lives: the local Worker while developing, the real one everywhere else.
window.IMPERIVM_API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:8787' : 'https://api.imperivmresurrected.com';
