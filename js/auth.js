/* Contas locais: cadastro e login guardados no próprio navegador (localStorage).
   A senha nunca é salva: guardamos só um hash PBKDF2-SHA256 com "sal" aleatório.
   Atenção: não há servidor. É um controle de acesso simples, não segurança de verdade. */
(function () {
  'use strict';
  const USERS = 'excel-do-zero-users', SESSION = 'excel-do-zero-session', ITER = 150000;
  const read = (k, d) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const norm = (e) => String(e).trim().toLowerCase();

  async function hash(password, salt, iter) {
    if (!window.crypto || !crypto.subtle) throw new Error('Seu navegador bloqueou a criptografia. Abra o site por https:// ou localhost.');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    return b64(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
  }

  const Auth = {
    user() { const id = read(SESSION, null); const u = id && read(USERS, {})[id]; return u ? { id, name: u.name } : null; },
    async register(name, email, password) {
      name = String(name).trim(); const id = norm(email);
      if (name.length < 2) throw new Error('Digite seu nome.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) throw new Error('Digite um e-mail válido.');
      if (password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
      const users = read(USERS, {});
      if (users[id]) throw new Error('Já existe uma conta com este e-mail. Use “Entrar”.');
      const salt = crypto.getRandomValues(new Uint8Array(16));
      users[id] = { name, salt: b64(salt), iter: ITER, hash: await hash(password, salt, ITER), created: Date.now() };
      if (!write(USERS, users)) throw new Error('Não consegui salvar a conta (o navegador bloqueou o armazenamento).');
      write(SESSION, id); return { id, name };
    },
    async login(email, password) {
      const id = norm(email); const u = read(USERS, {})[id];
      const h = u ? await hash(password, unb64(u.salt), u.iter) : null;
      if (!u || h !== u.hash) throw new Error('E-mail ou senha incorretos.');
      write(SESSION, id); return { id, name: u.name };
    },
    logout() { try { localStorage.removeItem(SESSION); } catch (e) { /* ignora */ } }
  };
  window.Auth = Auth;
})();
