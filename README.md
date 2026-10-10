# Aula 09 – Docker Compose

- **exemplo1**: calculadora + `servico-vizinho` (alpine). Teste: `docker compose exec calculadora-app ping -c 4 servico-vizinho`
- **exemplo2**: Frontend (Nginx) + Backend (Node.js) + PostgreSQL. Acesso em http://localhost:8080
- **exemplo3**: WordPress + MariaDB. Acesso em http://localhost:8000

Para rodar, entre na pasta do exemplo e execute `docker compose up -d --build`.

O pipeline (`.github/workflows/ci.yml`) tem os jobs **build** (`docker compose build` e `push` para o Docker Hub) e **test** (sobe os exemplos com `docker compose up` e testa).
