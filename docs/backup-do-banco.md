# Backup do banco de produção

Todo dia, às 03:17 (Brasília), o GitHub Actions faz um `mysqldump` do banco, compacta, **cifra**
(AES-256) e guarda num bucket **privado** do Cloudflare R2. Backups com mais de 30 dias são apagados.
Código: `backend/petcare-api-v1/scripts/backupBanco.js` · agendamento: `docs/github-actions/backup-banco.yml`
(precisa ser copiado para `.github/workflows/`; ver `docs/github-actions/LEIA-ME.md`).

O backup do plano do Aiven continua valendo; este é uma segunda cópia, fora do Aiven.

## Ativar (uma vez, Jeferson)

0. Copie `docs/github-actions/backup-banco.yml` para `.github/workflows/` (passo a passo em `docs/github-actions/LEIA-ME.md`).
1. **Usuário só de leitura** no MySQL (console do Aiven ou cliente SQL), com senha própria:
   ```sql
   CREATE USER 'backup'@'%' IDENTIFIED BY '<senha forte>';
   GRANT SELECT, SHOW VIEW, TRIGGER, EVENT, LOCK TABLES ON <nome_do_banco>.* TO 'backup'@'%';
   ```
2. **Bucket privado** no R2 (ex.: `petcare-backups`), sem acesso público, e um token de API do R2
   com leitura e escrita **só nesse bucket**.
3. **Senha do backup:** gere com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   e guarde também num gerenciador de senhas dos sócios. Sem ela, nenhum backup abre.
4. No GitHub: *Settings → Secrets and variables → Actions → New repository secret*, um para cada:
   `BACKUP_DB_HOST`, `BACKUP_DB_PORT`, `BACKUP_DB_USER`, `BACKUP_DB_PASSWORD`, `BACKUP_DB_NAME`,
   `BACKUP_DB_SSL_CA` (conteúdo do `ca.pem` do Aiven), `BACKUP_SENHA`, `BACKUP_R2_BUCKET`,
   `BACKUP_R2_ENDPOINT`, `BACKUP_R2_ACCESS_KEY_ID`, `BACKUP_R2_SECRET_ACCESS_KEY`.
5. Em *Actions → Backup do banco → Run workflow*, rode uma vez e confira a mensagem "Backup enviado".

Nunca coloque esses valores em chat, e-mail ou commit.

## Testar a restauração (todo mês)

Backup só vale se abrir. Com as mesmas variáveis num `.env.backup` local (fora do Git):

```powershell
cd backend\petcare-api-v1
node --env-file=.env.backup scripts/backupBanco.js --restaurar banco/<arquivo>.sql.gz.enc restaurado.sql
```

Importe o `restaurado.sql` no **banco de teste local** (`docs/ambiente-de-teste.md`), confira as
tabelas e os totais, e apague o arquivo depois: ele contém dados reais de clientes.

## Se o backup falhar

O GitHub avisa por e-mail quem tem acesso ao repositório. Causas comuns: senha do usuário trocada,
token do R2 vencido ou IP bloqueado no Aiven (se houver lista de IPs permitidos, o GitHub Actions
não tem IP fixo: nesse caso rode o mesmo script num cron do Render).
