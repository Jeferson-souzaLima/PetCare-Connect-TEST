# Proposta: cidade e UF na resposta do login

Status: **aguardando aprovação**. Esta proposta não altera a autenticação.

## Problema

A nova home mostra a cidade do cliente no cabeçalho (`rotuloLocalizacao` usa
`usuario.cidade` e `usuario.uf`). Mas o `POST /auth/login` devolve só `id`,
`nome`, `email` e `tipo`. A cidade só entra na sessão quando o cliente abre o
Perfil ou o Carrinho, que chamam `GET /usuarios/me`. Sem isso, a home mostra
"Perto de você" (se ele autorizou a localização) ou "Definir localização".

## Correção proposta

No `authController.login`, no ramo de cliente/administrador, incluir só os dois
campos `cidade` e `uf` no objeto `usuario` da resposta. O `SELECT * FROM usuarios`
já lê essas colunas, então não há consulta nova, mudança no banco ou no token.

### Muda a resposta do /auth/login? Sim, de forma aditiva

Cliente, antes:

```json
{ "mensagem": "Login realizado com sucesso!", "token": "…",
  "usuario": { "id": 3, "nome": "Mariana", "email": "…", "tipo": "cliente" } }
```

Cliente, depois:

```json
{ "mensagem": "Login realizado com sucesso!", "token": "…",
  "usuario": { "id": 3, "nome": "Mariana", "email": "…", "tipo": "cliente",
               "cidade": "Cotia", "uf": "SP" } }
```

- Cliente sem endereço: `"cidade": null, "uf": null`.
- Lojista: **não muda**.
- O token JWT **não muda** (mesmo conteúdo: `id`, `tipo`).
- Status HTTP, mensagens de erro, rate limit e a regra de e-mail não confirmado
  **não mudam**.
- O frontend já grava `data.usuario` na sessão (`LoginPage` → `login()`), então a
  home passa a mostrar a cidade logo após entrar, sem mudança no frontend.

### Dados pessoais

Entram só cidade e UF; CEP, rua, número, telefone e coordenadas continuam fora,
o que está coberto pelo teste. Hoje a sessão já guarda o endereço completo
depois que o cliente abre o Perfil ou o Carrinho. Esta proposta não muda isso.

### Limitações

Quem já está logado só passa a ver a cidade no próximo login, ou ao abrir o
Perfil ou o Carrinho, como hoje.

## Validação feita (numa cópia isolada, sem tocar a branch)

- Teste novo `Tests/loginCidadeUf.test.js` com 3 casos: cliente recebe cidade/UF
  e nada mais do endereço, cliente sem endereço recebe null, resposta do lojista
  igual. Antes da mudança: 2 falhas. Depois: 3/3.
- Suíte completa do backend com a mudança: 196/196.

## Como aplicar, depois de aprovado

```bash
git apply docs/propostas/2026-11-11-cidade-uf-no-login.patch
cd backend/petcare-api-v1 && npm test
```

## Patch

```diff
diff --git a/backend/petcare-api-v1/Controllers/authController.js b/backend/petcare-api-v1/Controllers/authController.js
index 5cd8260..48ec792 100644
--- a/backend/petcare-api-v1/Controllers/authController.js
+++ b/backend/petcare-api-v1/Controllers/authController.js
@@ -127,7 +127,10 @@ exports.login = (req, res) => {
                         id: usuario.id,
                         nome: usuario.nome,
                         email: usuario.email,
-                        tipo: tipoUsuario
+                        tipo: tipoUsuario,
+                        // Só cidade e UF: a home mostra a cidade sem depender do perfil.
+                        cidade: usuario.cidade ?? null,
+                        uf: usuario.uf ?? null
                     }
                 });
             }
diff --git a/backend/petcare-api-v1/Tests/loginCidadeUf.test.js b/backend/petcare-api-v1/Tests/loginCidadeUf.test.js
new file mode 100644
index 0000000..df0fcf8
--- /dev/null
+++ b/backend/petcare-api-v1/Tests/loginCidadeUf.test.js
@@ -0,0 +1,62 @@
+const assert = require('node:assert/strict');
+const test = require('node:test');
+const bcrypt = require('bcrypt');
+const { simularBanco } = require('./apoioAcesso');
+
+const db = require('../db');
+const authController = require('../Controllers/authController');
+
+/*
+ * A home mostra a cidade do cliente: o login devolve cidade e UF (só esses dois
+ * campos do endereço), para não depender de abrir o perfil antes.
+ */
+const SENHA = 'senha-certa-123';
+const HASH = bcrypt.hashSync(SENHA, 4);
+const CONTAS = {
+    'cliente@exemplo.com': { id: 3, nome: 'C', email: 'cliente@exemplo.com', senha_hash: HASH, tipo: 'cliente', email_verificado: 1, cidade: 'Cotia', uf: 'SP', cep: '06700000', logradouro: 'Rua X', numero: '10', latitude: -23.6, longitude: -46.9, telefone: '11999999999' },
+    'semendereco@exemplo.com': { id: 4, nome: 'S', email: 'semendereco@exemplo.com', senha_hash: HASH, tipo: 'cliente', email_verificado: 1, cidade: null, uf: null },
+    'loja@exemplo.com': { id: 5, nome: 'L', email: 'loja@exemplo.com', senha_hash: HASH, tipo: 'lojista', email_verificado: 1, cidade: 'Cotia', uf: 'SP' }
+};
+
+function banco(t) {
+    return simularBanco(t, db, [
+        [/FROM usuarios WHERE email = \?/, (v) => (CONTAS[v[0]] ? [CONTAS[v[0]]] : [])],
+        [/FROM lojas WHERE usuario_id/, [{ id: 9 }]],
+        [/^\s*UPDATE usuarios/, { affectedRows: 1 }]
+    ]);
+}
+
+function login(email) {
+    return new Promise((resolve) => {
+        const res = {
+            statusCode: 200,
+            status(code) { this.statusCode = code; return this; },
+            json(corpo) { resolve({ status: this.statusCode, body: corpo }); return this; }
+        };
+        authController.login({ body: { email, senha: SENHA } }, res);
+    });
+}
+
+test('login do cliente devolve cidade e UF, sem o resto do endereço', async (t) => {
+    banco(t);
+    const r = await login('cliente@exemplo.com');
+    assert.equal(r.status, 200);
+    assert.equal(r.body.usuario.cidade, 'Cotia');
+    assert.equal(r.body.usuario.uf, 'SP');
+    for (const campo of ['cep', 'logradouro', 'numero', 'latitude', 'longitude', 'telefone', 'senha_hash']) {
+        assert.equal(r.body.usuario[campo], undefined, campo);
+    }
+});
+
+test('cliente sem endereço recebe cidade e UF nulas', async (t) => {
+    banco(t);
+    const r = await login('semendereco@exemplo.com');
+    assert.equal(r.body.usuario.cidade, null);
+    assert.equal(r.body.usuario.uf, null);
+});
+
+test('login do lojista não muda', async (t) => {
+    banco(t);
+    const r = await login('loja@exemplo.com');
+    assert.deepEqual(Object.keys(r.body.usuario).sort(), ['email', 'id', 'loja_id', 'nome', 'tipo']);
+});
```
