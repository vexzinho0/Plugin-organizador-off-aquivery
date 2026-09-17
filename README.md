# Archivery Organizer Backend

Backend privado do Archivery Organizer para Roblox Studio Lite.

## Endpoints

- `GET /api/health` - verifica o estado do backend.
- `POST /api/analyze` - recebe uma árvore de Instances e pede à IA um plano seguro de organização.

## Variáveis de ambiente

Configure `GROQ_API_KEY` no ambiente da Vercel. Opcionalmente, defina `GROQ_MODEL`.

O código não contém nenhuma chave real.

## Arquitetura

Studio Lite → Archivery → backend Vercel → Groq → plano JSON → Archivery executa as ações permitidas.

A IA não recebe código-fonte dos scripts e não executa Luau. A primeira versão trabalha apenas com a árvore/metadata enviada pelo cliente.
