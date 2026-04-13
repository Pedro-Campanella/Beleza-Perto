# Beleza-Perto

MVP de aplicativo para conectar clientes a profissionais e salões de beleza, com busca por serviço, proximidade e avaliação.

## Estrutura do projeto

- `mobile`: aplicativo React Native com Expo.
- `backend`: API Node.js/Express para cadastro, autenticação, perfil e busca.

## Backend (Node.js + Express)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

API em `http://localhost:3333`.

### Endpoints principais

- `GET /health`: status da API.
- `POST /auth/register`: cadastro de cliente, profissional ou salão.
- `POST /auth/login`: login e token JWT.
- `GET /auth/me`: perfil do usuário autenticado.
- `GET /users/me`: perfil autenticado.
- `PUT /users/me`: atualização de perfil.
- `GET /providers`: busca de profissionais/salões por filtros.

## Mobile (React Native com Expo)

```bash
cd mobile
npm install
npm start
```

Para web:

```bash
npx expo install react-dom react-native-web
npm run web
```

### Configuração da URL da API

Edite `mobile/src/config.js`:

- Android Emulator: `http://10.0.2.2:3333`
- iOS Simulator: `http://localhost:3333`
- Dispositivo físico: use o IP da sua máquina no lugar de `localhost`

## Funcionalidades implementadas no MVP

- Cadastro de cliente, profissional e salão.
- Login/autenticação com JWT.
- Atualização de perfil.
- Busca de profissionais e salões por:
  - tipo de serviço,
  - avaliação mínima,
  - raio de distância,
  - ordenação por relevância, distância ou avaliação.
- Dados iniciais de exemplo para testes rápidos.
