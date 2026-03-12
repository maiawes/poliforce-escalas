# Poliforce Escalas

Webapp responsivo para controle de escalas dos agentes da Poliforce com Next.js, TypeScript, Tailwind CSS e Firebase Firestore.

## Estrutura de pastas

```text
src/
  app/                rotas do App Router
  components/         componentes por área do sistema
  hooks/              subscriptions e bootstrap do Firestore
  lib/firebase/       inicialização e operações com Firestore
  lib/shifts/         regras de cálculo, agregações e exportações
  lib/utils/          helpers genéricos
  types/              tipos compartilhados
```

## Configuração do Firebase

1. Crie um projeto no Firebase e habilite o Firestore.
2. Use as variáveis do arquivo `.env.local`.
3. Se quiser acesso sem autenticação, publique regras compatíveis usando [`firestore.rules`](/Users/wesleymaia/Documents/EscalasAgentes/firestore.rules).

## Variáveis de ambiente

As variáveis ficam em `.env.local` para desenvolvimento e em `.env.example` como referência.

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Publicando na Vercel

1. Envie o projeto para um repositório Git.
2. Importe o repositório na Vercel.
3. Cadastre as mesmas variáveis de ambiente do `.env.local` na Vercel.
4. Faça o deploy.

## Funcionalidades entregues

- Dashboard com totais do mês, atalhos e ranking por agente
- Cadastro e edição de escalas simples ou divididas
- Cálculo automático de horas e valores proporcionais
- Visão mensal com filtros, exclusão e duplicação
- Página individual por agente com evolução e estimativa
- Relatórios em tempo real com gráficos
- Tela estilo planilha
- Exportação em PDF e Excel
- Configurações administrativas de valores e horários
- Seed inicial dos agentes e settings no Firestore
