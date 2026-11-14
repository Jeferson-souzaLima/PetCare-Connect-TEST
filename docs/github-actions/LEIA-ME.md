# Automações do GitHub (aguardando ativação)

Estes arquivos ficam aqui, e não em `.github/workflows/`, porque o GitHub só aceita arquivos
de automação enviados por quem tem a permissão `workflow`. O dono do repositório ativa assim:

| Arquivo | O que faz |
| --- | --- |
| `testes.yml` | Roda lint, testes e build do backend e do frontend a cada PR e a cada push na main |
| `backup-banco.yml` | Backup diário cifrado do banco para um bucket privado do R2 (guia: `docs/backup-do-banco.md`) |

**Pelo site do GitHub (mais simples):** no repositório, *Add file → Create new file*, nome
`.github/workflows/testes.yml`, cole o conteúdo do arquivo daqui e faça o commit. Repita para
`backup-banco.yml` só depois de cadastrar os segredos do backup.

**Pelo terminal:** copie os arquivos para `.github/workflows/`, faça o commit e o push com uma
conta que tenha a permissão `workflow` (ex.: `gh auth refresh -s workflow`).
