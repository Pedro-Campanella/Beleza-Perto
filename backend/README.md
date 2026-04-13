# Backend - Beleza Perto API

API Node.js/Express para o aplicativo de conexão entre clientes, profissionais e salões.

## Funcionalidades MVP

- Cadastro de usuários com papéis:
  - `client`
  - `professional`
  - `salon`
- Login com JWT
- Consulta de perfil autenticado
- Atualização de perfil
- Busca de profissionais/salões por:
  - tipo de serviço
  - avaliação mínima
  - proximidade geográfica
  - ordenação por distância, avaliação ou relevância

## Rodando localmente

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Servidor padrão: `http://localhost:3333`

## Endpoints

### Health
- `GET /health`

### Autenticação
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (Bearer token)

### Usuário autenticado
- `GET /users/me`
- `PUT /users/me`

### Busca pública de profissionais/salões
- `GET /providers`
  - query params:
    - `service` (ex: `unha`)
    - `minRating` (0 a 5)
    - `lat` e `lng`
    - `maxDistanceKm`
    - `sortBy`: `relevance` | `rating` | `distance`

## Observações

- Este MVP usa armazenamento em memória (`src/data/database.js`).
- Para produção, substitua por banco real (PostgreSQL/MongoDB) e valide segurança adicional.
