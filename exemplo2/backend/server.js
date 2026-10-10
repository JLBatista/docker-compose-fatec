const http = require('http');
const { Pool } = require('pg');

// O host do banco é o NOME DO SERVIÇO no docker-compose ("database"), não um IP
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Tenta conectar algumas vezes, caso o banco ainda esteja inicializando
async function iniciarBanco(tentativas = 10) {
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS tarefas (id SERIAL PRIMARY KEY, titulo TEXT NOT NULL)');
  } catch (erro) {
    if (tentativas <= 1) throw erro;
    console.log('Banco ainda não está pronto, tentando de novo...');
    await new Promise((r) => setTimeout(r, 2000));
    return iniciarBanco(tentativas - 1);
  }
}

function responder(res, status, dados) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(dados));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/api/tarefas' && req.method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM tarefas ORDER BY id');
      return responder(res, 200, rows);
    }

    if (req.url === '/api/tarefas' && req.method === 'POST') {
      let corpo = '';
      for await (const parte of req) corpo += parte;
      const { titulo } = JSON.parse(corpo || '{}');
      if (!titulo) return responder(res, 400, { erro: 'Informe o título' });
      const { rows } = await pool.query('INSERT INTO tarefas (titulo) VALUES ($1) RETURNING *', [titulo]);
      return responder(res, 201, rows[0]);
    }

    responder(res, 404, { erro: 'Rota não encontrada' });
  } catch (erro) {
    responder(res, 500, { erro: erro.message });
  }
});

iniciarBanco().then(() => {
  server.listen(3000, () => console.log('API de tarefas rodando na porta 3000'));
});
