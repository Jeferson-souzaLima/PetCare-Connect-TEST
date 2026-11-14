# Ambiente de teste local (MySQL no Docker)

Banco **só de estrutura**, sem nenhum registro da produção, para testar a API e o seed de
demonstração sem risco. Tudo roda na sua máquina; nada aqui escreve na produção.

| Peça | Onde |
|---|---|
| MySQL 8.0 local com SSL (porta 3307, só nesta máquina) | `database/teste/docker-compose.yml` |
| Importador da estrutura (recusa arquivo com registros) | `database/teste/importar-estrutura.js` |
| Variáveis da API no teste | `backend/petcare-api-v1/.env.teste.example` |
| Conferência do ambiente | `npm run teste:verificar` (no backend) |

Os scripts de teste param se `PETCARE_AMBIENTE` não for `teste`, se o banco não for local, se o
nome do banco não tiver "teste" ou se o bucket do R2 não terminar em `-teste`.

## 1. Instalar (uma vez, no Windows)

1. Instale o **Docker Desktop** (https://www.docker.com/products/docker-desktop/) e abra o programa.
2. Tenha o **Node.js 20.6 ou mais novo** (`node --version`).

## 2. Exportar a estrutura da produção (Jeferson)

Somente a estrutura (`--no-data`): nenhum registro sai da produção. A senha é pedida na tela,
não fica no comando. No PowerShell, dentro da pasta do repositório:

```powershell
cd database\teste
docker run --rm -it -v "${PWD}:/saida" mysql:8.0 mysqldump `
  -h HOST_DO_AIVEN -P PORTA -u USUARIO -p --ssl-mode=REQUIRED `
  --no-data --routines --triggers --single-transaction --set-gtid-purged=OFF `
  --result-file=/saida/estrutura.sql NOME_DO_BANCO
```

- Use `--result-file` (como acima) e não `> estrutura.sql`: no PowerShell o `>` grava em UTF-16 e
  estraga o arquivo.
- Não use `--databases`: o importador recusa arquivo com `CREATE DATABASE`/`USE`.
- Alternativa: MySQL Workbench → *Server → Data Export* → **Dump Structure Only**, sem
  *Include Create Schema*.
- `estrutura.sql` fica fora do Git (`.gitignore`). Confira que o arquivo não tem nenhum `INSERT INTO`.

## 3. Subir o MySQL local

```powershell
cd database\teste
copy .env.example .env      # troque as duas senhas (senhas locais, não as da produção)
docker compose up -d
docker compose ps           # "mysql" precisa aparecer como healthy
```

Na primeira vez o Docker baixa a imagem e cria `database/teste/certificados/` (certificado local
para o SSL que a API exige).

## 4. Importar a estrutura

Na raiz do repositório:

```powershell
node database\teste\importar-estrutura.js database\teste\estrutura.sql
```

O script recusa o arquivo se ele tiver registros e, no fim, confere que todas as tabelas estão
vazias (`Pronto: N tabelas no banco de teste local, todas vazias.`). Pode rodar de novo: as
tabelas do teste são recriadas.

## 5. Ligar a API no banco de teste

```powershell
cd backend\petcare-api-v1
copy .env.teste.example .env.teste
# Em .env.teste: DB_PASSWORD = o mesmo MYSQL_PASSWORD de database\teste\.env,
# um JWT_SECRET só do teste, SMTP de teste e as chaves do bucket petcare-media-teste.
npm run teste:verificar     # mostra "Conectado ao banco de teste ... (SSL: TLS_...)" e a contagem
npm run teste:api           # API em http://localhost:3000 usando o banco de teste
```

`.env.teste` tem todas as variáveis do `.env.example`, para nenhuma vir do `.env` de produção.

Para o site usar essa API: em `frontend\.env.local` coloque `VITE_API_URL=http://localhost:3000` e
rode `npm run dev` no frontend.

## Zerar ou desligar

```powershell
cd database\teste
docker compose stop          # desliga, mantém o banco
docker compose down -v       # apaga o banco de teste LOCAL (a produção não é afetada)
```
