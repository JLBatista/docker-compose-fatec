# Aula 09 – Orquestração de Containers com Docker Compose

Atividade da disciplina **Integração e Entrega Contínua** (Prof. Rafael Miranda).

Este repositório contém os três exemplos da aula e um pipeline no **GitHub Actions** com os jobs **Build** e **Test** usando o Docker Compose.

| Pasta | O que sobe | Comunicação entre serviços |
|---|---|---|
| [`exemplo1/`](exemplo1) | `calculadora-app` (Dockerfile local) + `servico-vizinho` (alpine) | `ping servico-vizinho` |
| [`exemplo2/`](exemplo2) | Frontend (Nginx) + Backend (Node.js) + Banco (PostgreSQL) | Nginx → `backend:3000` → `database:5432` |
| [`exemplo3/`](exemplo3) | WordPress + MariaDB | WordPress → `db` |

Em nenhum caso é usado endereço IP: os containers se encontram pelo **nome do serviço** na rede interna que o Compose cria.

---

## Exemplo 1 – Aplicação + serviço vizinho

`exemplo1/docker-compose.yml`

- **calculadora-app**: faz o build a partir do `Dockerfile` local (app Node.js com funções de soma e subtração e testes).
- **servico-vizinho**: imagem `alpine` com `sleep infinity` para ficar ativo.

```bash
cd exemplo1
docker compose up -d --build
docker compose exec calculadora-app ping -c 4 servico-vizinho
docker compose exec calculadora-app npm test
docker compose down
```

Resultado:

```
PING servico-vizinho (172.18.0.2): 56 data bytes
64 bytes from 172.18.0.2: seq=0 ttl=64 time=1.225 ms
...
4 packets transmitted, 4 packets received, 0% packet loss

# pass 2
# fail 0
```

---

## Exemplo 2 – Frontend + Backend + Banco de Dados

```
exemplo2/
├── docker-compose.yml
├── frontend/   → Nginx servindo a página e repassando /api/ para o backend
│   ├── Dockerfile
│   ├── nginx.conf
│   └── index.html
└── backend/    → API Node.js de tarefas (GET e POST /api/tarefas)
    ├── Dockerfile
    ├── package.json
    └── server.js
```

Conceitos da aula aplicados no `docker-compose.yml`:

- **build**: frontend e backend são construídos a partir dos seus Dockerfiles.
- **image**: o banco usa a imagem pronta `postgres:16-alpine`.
- **ports**: só o frontend é exposto (`8080:80`); backend e banco ficam apenas na rede interna.
- **environment**: credenciais do banco passadas por variáveis de ambiente.
- **depends_on** com **healthcheck**: o backend só sobe quando o banco está pronto, e o frontend só sobe quando a API está respondendo.
- **volumes**: `./dados:/var/lib/postgresql/data`, então os dados continuam salvos depois de um `docker compose down`.

```bash
cd exemplo2
docker compose up -d --build --wait
# abrir http://localhost:8080 no navegador
curl -X POST http://localhost:8080/api/tarefas -H "Content-Type: application/json" -d '{"titulo":"Estudar Docker Compose"}'
curl http://localhost:8080/api/tarefas
docker compose down
```

Resultado (inclusive após `docker compose down` e `up` de novo, comprovando a persistência pelo volume):

```
[{"id":1,"titulo":"Estudar Docker Compose"}]
```

---

## Exemplo 3 – WordPress + MariaDB

`exemplo3/docker-compose.yml`

- **wordpress**: imagem oficial `wordpress:latest`, porta `8000:80`.
- **db**: imagem oficial `mariadb:10.6`.
- O WordPress depende do banco (`depends_on`) e se conecta a ele pelo nome `db`.
- Volumes nomeados (`wordpress_data` e `db_data`) para persistir os dados.

```bash
cd exemplo3
docker compose up -d
# abrir http://localhost:8000 → tela de instalação do WordPress
docker compose down
```

---

## Pipeline de CI/CD (GitHub Actions)

Arquivo: [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Roda a cada push na `main`.

### Job `build`
1. Login no Docker Hub (`vars.DOCKER_USER` e `secrets.DOCKER_PASS`).
2. `docker compose build` do Exemplo 1 e do Exemplo 2 (frontend e backend construídos juntos, garantindo a paridade de versões).
3. `docker compose push` envia as imagens para o Docker Hub:
   - `altafini/calculadora-app`
   - `altafini/tarefas-frontend`
   - `altafini/tarefas-backend`

### Job `test` (só roda se o build passar)
1. **Exemplo 1**: `docker compose up` com as imagens do Docker Hub, `ping` pelo nome do serviço e `npm test` dentro do container.
2. **Exemplo 2**: teste de integração real: sobe Front + API + Postgres, cria uma tarefa pelo frontend e confere se ela voltou do banco.
3. **Exemplo 3**: sobe WordPress + MariaDB e verifica se o site responde.
4. `docker compose down` ao final de cada exemplo (ambiente descartável).

---

## Comandos essenciais usados

| Comando | Para quê |
|---|---|
| `docker compose up -d` | Sobe o ambiente em background |
| `docker compose down` | Para e remove os containers |
| `docker compose ps` | Mostra o status dos serviços |
| `docker compose logs -f` | Acompanha os logs de todos os containers |
| `docker compose build` | Cria todas as imagens |
| `docker compose push` | Envia todas as imagens para o Docker Hub |
