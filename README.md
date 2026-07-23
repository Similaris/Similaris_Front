# Similaris — Frontend (Interface Web)

Interface web do **Similaris**, protótipo para apoio à detecção de plágio com foco em análise lexical, semântica e processamento em lote.

Projeto desenvolvido como Trabalho de Graduação (TG) do Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas da **Faculdade de Tecnologia de Indaiatuba — Dr. Archimedes Lamoglia (FATEC Indaiatuba / Centro Paula Souza)**.

**Autores:**
- Pedro Henrique Denny Ré
- Rafael Tadeu Praça

**Orientador:** Prof. Me. Michel Moron Munhoz

---

## Descrição

O frontend é a camada de interação do usuário com o sistema, construído como uma SPA (Single Page Application) em React com tipagem em TypeScript. A comunicação com o servidor FastAPI é realizada por meio da biblioteca Axios, responsável pelas chamadas à API REST.

A interface contempla os três casos de uso principais do protótipo:

- **UC01 — Envio de documentos:** upload de um ou mais arquivos (PDF/DOCX) para análise em lote;
- **UC02 — Acompanhamento do processamento:** visualização do status das análises em andamento (pendente, processando, concluído);
- **UC03 — Visualização de relatórios:** apresentação dos percentuais de similaridade e dos trechos suspeitos, comparando o documento enviado com as fontes da base de referência.

O objetivo é oferecer telas limpas e intuitivas, apresentando os resultados de forma clara ao avaliador — sempre como **apoio à análise humana**, e não como veredito definitivo de plágio.

## Tecnologias

| Componente | Tecnologia |
|---|---|
| Biblioteca de UI | React 19 |
| Linguagem | TypeScript |
| Build tool / dev server | Vite |
| Cliente HTTP | Axios |

## Estrutura de pastas

```
frontend/
├── src/
│   ├── main.tsx         # Ponto de entrada da aplicação
│   ├── App.tsx          # Componente raiz (status de conexão com a API)
│   ├── App.css          # Estilos globais
│   └── api/
│       └── client.ts    # Instância Axios e funções de acesso à API
├── .env                 # VITE_API_URL (endereço do backend)
├── index.html
├── package.json
└── README.md
```

## Como executar

Pré-requisitos: Node.js 20+ e o backend em execução (porta 8000).

```powershell
# 1. Instalar as dependências
npm install

# 2. Iniciar o servidor de desenvolvimento
npm run dev
```

A aplicação ficará disponível em `http://localhost:5173` (ou na próxima porta livre, ex.: `5174`).

## Configuração

A URL da API é definida no arquivo `.env`:

```
VITE_API_URL=http://localhost:8000/api
```

Ao abrir a aplicação, a tela inicial exibe o estado da conexão com o servidor:

- 🟢 **Backend conectado** — API respondendo normalmente;
- 🟡 **Conectando...** — requisição em andamento;
- 🔴 **Backend indisponível** — verifique se o servidor FastAPI está em execução.

---

## Padrão de commits

As mensagens de commit são validadas por um hook (`.githooks/commit-msg`) no formato **Conventional Commits**:

```
prefixo: descrição em minúsculo        (máx. 72 caracteres na primeira linha)
```

Prefixos aceitos: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`. Exemplo: `feat: adiciona tela de envio de documentos`.

Após clonar o repositório, ative a validação com:

```powershell
git config core.hooksPath .githooks
```

---

FATEC Indaiatuba — Dr. Archimedes Lamoglia · Centro Estadual de Educação Tecnológica Paula Souza · 2025/2026
