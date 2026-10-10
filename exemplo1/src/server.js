const http = require('http');
const { somar } = require('./calc');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ mensagem: 'Olá, FATEC! Rodando no Docker.', exemplo: `2 + 3 = ${somar(2, 3)}` }));
});

server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
