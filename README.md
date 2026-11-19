# 🍱 Marmitaria Sabor Caseiro – Chatbot de Vendas Online

> Chatbot inteligente e determinístico (100% client-side, sem necessidade de LLM ou chaves de API externa) para atendimento, escolha de cardápio, personalização de ponto e temperos, e cálculo de pedidos com entrega para uma marmitaria.

🔗 **Link da Aplicação no GitHub Pages:** `https://<SEU_USUARIO>.github.io/sabor-caseiro-marmitas/`

---

## 📋 Funcionalidades Implementadas

| Requisito do Enunciado | Implementação |
|---|---|
| **Sem agente de LLM e sem API key** | Motor conversacional baseado em regras determinísticas (`chat-engine.js`), funcionando 100% no navegador sem custos ou chaves de API. |
| **Realizar vendas para restaurante de marmitas** | Gerenciamento de carrinho em tempo real, adição, remoção e fluxo de checkout com endereço de entrega. |
| **Produtos e preços por unidade por dia** | Cardápio dinâmico (`menu-data.js`) separado por dias da semana com descrição dos ingredientes e preço unitário. |
| **Escolha dos itens por texto** | Compreensão de pedidos em linguagem natural (ex.: *"Quero um bife de vaca bem passado e um suco de laranja"*). |
| **Mudar temperos ou ponto de cozimento** | Reconhece preferências como ponto da carne (*bem passado*, *ao ponto*, *mal passado*), remoção de itens (*sem cebola*, *sem alho*) e temperos (*pouco sal*, *chimichurri*). |
| **Valor total da compra com entrega** | Cálculo automático de subtotal, taxa de entrega fixa de R$ 5,00 e **frete grátis** em pedidos a partir de R$ 40,00. |
| **Guardrails de segurança** | Módulo de proteção (`guardrails.js`) contra tentativas de prompt injection, jailbreak, sanitização anti-XSS e limitação de taxa (anti-flood). |
| **Aplicação Web Client-Side** | Construída com HTML5, CSS3 moderno e Vanilla JavaScript, pronta para publicação no GitHub Pages. |
| **Metodologia Conversacional ELIZA** | Segue a arquitetura clássica de decomposição de padrões com regex, reflexões semânticas e fallbacks empáticos. |

---

## 🗂️ Estrutura de Arquivos

```
sabor-caseiro-marmitas/
├── index.html        # Estrutura da página, layout responsivo e atalhos rápidos
├── style.css         # Visual acolhedor com tema gastronômico e carrinho em tempo real
├── menu-data.js      # Catálogo de produtos, preços unitários e dias da semana
├── guardrails.js     # Validação de segurança, sanitização anti-XSS e bloqueio de injeções
├── chat-engine.js    # Motor conversacional com máquina de estados e cálculo de frete
├── app.js            # Integração dos elementos de UI com o motor de vendas
└── README.md         # Documentação e instruções de deploy
```

---

## 🛡️ Guardrails e Segurança

1. **Sanitização de Entradas (`escapeHTML`)**: Previne ataques XSS ao manipular o DOM.
2. **Bloqueio de Jailbreak e Prompt Injection**: Filtra comandos maliciosos como `ignore previous instructions`, `DAN`, `developer mode`, `system prompt`, entre outros.
3. **Rate Limiting**: Limita o envio excessivo de mensagens para evitar travamento da interface.
4. **Validação de Comprimento**: Mensagens limitadas a 400 caracteres.

---

## 🚀 Como Executar Localmente

Basta abrir o arquivo `index.html` em qualquer navegador web (Google Chrome, Firefox, Microsoft Edge). Não requer instalação de pacotes ou servidores Node.js/Python.

---

## 🌐 Como Publicar no GitHub e Ativar o GitHub Pages

### 1. Criar o repositório
1. Acesse [github.com/new](https://github.com/new).
2. Nomeie o repositório como: **`sabor-caseiro-marmitas`**
3. Marque como **Público** (Public) e clique em **Create repository**.

### 2. Fazer o envio dos arquivos via Git
No terminal, dentro da pasta do projeto:
```bash
cd c:\Users\pedro\Downloads\IA_automação\sabor-caseiro-marmitas
git init
git add .
git commit -m "feat: Chatbot de vendas da Marmitaria Sabor Caseiro"
git branch -M main
git remote add origin https://github.com/<SEU_USUARIO>/sabor-caseiro-marmitas.git
git push -u origin main
```

### 3. Ativar o GitHub Pages
1. No repositório no GitHub, clique em **Settings** (Configurações).
2. Na barra lateral esquerda, clique em **Pages**.
3. Em **Build and deployment** > **Branch**, selecione `main` e a pasta `/(root)`.
4. Clique em **Save**.
5. Em instantes, o link público estará disponível no formato:
   `https://<SEU_USUARIO>.github.io/sabor-caseiro-marmitas/`
