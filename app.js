/**
 * app.js
 * Orquestrador da interface do usuário (UI), eventos e sincronização com o Motor de Pedidos.
 */

document.addEventListener("DOMContentLoaded", () => {
  const engine = new MarmitaOrderEngine();

  // Elementos do DOM
  const chatMessages = document.getElementById("chatMessages");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const daySelector = document.getElementById("daySelector");
  const sidebarCartList = document.getElementById("sidebarCartList");
  const sidebarTotals = document.getElementById("sidebarTotals");
  const sidebarMenuMini = document.getElementById("sidebarMenuMini");
  const cartBadge = document.getElementById("cartBadge");

  // Configuração inicial do dia da semana
  const currentDay = new Date().getDay();
  daySelector.value = currentDay;
  engine.setDay(currentDay);

  // Renderiza a sidebar inicial
  updateSidebarMenu();
  updateSidebarCart();

  // Mensagem inicial de boas-vindas
  setTimeout(() => {
    addBotMessage(`
      Olá! Seja muito bem-vindo à <strong>Marmitaria Sabor Caseiro</strong>! 🍱✨<br><br>
      Hoje é <strong>${engine.getDayName()}</strong> e nossas panelas estão cheias de pratos deliciosos e frescos.<br><br>
      Aqui você pode:<br>
      • Clicar ou digitar <em>"Ver Cardápio"</em> para ver todos os pratos e preços de hoje;<br>
      • Fazer pedidos por texto, por exemplo: <em>"Quero 1 bife de vaca bem passado e sem cebola"</em>;<br>
      • Ajustar o ponto da carne ou retirar temperos (alho, sal, etc.);<br>
      • Consultar o total com taxa de entrega a qualquer instante!<br><br>
      O que você gostaria de saborear hoje no seu almoço?
    `);
  }, 400);

  // Função para enviar mensagem
  function handleSendMessage() {
    const rawText = userInput.value;
    if (!rawText.trim()) return;

    // 1. Passa pelos Guardrails
    const validation = Guardrails.validateInput(rawText);
    userInput.value = "";

    if (!validation.valid) {
      addUserMessage(validation.sanitized || rawText);
      addBotMessage(validation.reason);
      return;
    }

    // 2. Exibe mensagem do usuário
    addUserMessage(validation.cleanText);

    // 3. Simula tempo de digitação suave (estilo chat natural)
    showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator();
      const response = engine.process(validation.cleanText);
      addBotMessage(response.text);

      if (response.cartUpdated) {
        updateSidebarCart();
      }
    }, 450);
  }

  // Event Listeners
  sendBtn.addEventListener("click", handleSendMessage);
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // Mudança do dia da semana pelo seletor
  daySelector.addEventListener("change", (e) => {
    const newDay = parseInt(e.target.value, 10);
    engine.setDay(newDay);
    updateSidebarMenu();
    addBotMessage(`📅 Você alterou o dia para <strong>${engine.getDayName()}</strong>. O cardápio disponível foi atualizado! Digite <em>"ver cardápio"</em> para conferir os itens deste dia.`);
  });

  // Funções Globais expostas no window para os botões inline
  window.quickOrder = function(itemId) {
    const item = MENU_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    // Injeta comando no chat
    addUserMessage(`Quero pedir ${item.name}`);
    showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator();
      const response = engine.process(`Quero ${item.name}`);
      addBotMessage(response.text);
      updateSidebarCart();
    }, 400);
  };

  window.sendQuickPrompt = function(promptText) {
    userInput.value = promptText;
    handleSendMessage();
  };

  window.startNewOrder = function() {
    engine.clearCart();
    updateSidebarCart();
    addBotMessage(`Novo pedido iniciado! O que você deseja almoçar hoje?`);
  };

  window.finishOrderFromSidebar = function() {
    addUserMessage("Finalizar pedido");
    showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator();
      const res = engine.process("finalizar pedido");
      addBotMessage(res.text);
    }, 350);
  };

  // Funções de UI
  function addUserMessage(text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "message user";
    msgDiv.innerHTML = `
      <div class="msg-avatar">👤</div>
      <div class="msg-bubble">${Guardrails.escapeHTML(text)}</div>
    `;
    chatMessages.appendChild(msgDiv);
    scrollToBottom();
  }

  function addBotMessage(htmlContent) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "message bot";
    msgDiv.innerHTML = `
      <div class="msg-avatar">🍱</div>
      <div class="msg-bubble">${htmlContent}</div>
    `;
    chatMessages.appendChild(msgDiv);
    scrollToBottom();
  }

  function showTypingIndicator() {
    const typing = document.createElement("div");
    typing.id = "typingIndicator";
    typing.className = "message bot";
    typing.innerHTML = `
      <div class="msg-avatar">🍱</div>
      <div class="msg-bubble" style="color:var(--text-muted); font-style: italic;">
        Marmitaria Sabor Caseiro está preparando a resposta...
      </div>
    `;
    chatMessages.appendChild(typing);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const ind = document.getElementById("typingIndicator");
    if (ind) ind.remove();
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function updateSidebarMenu() {
    const todayItems = engine.getTodayMenuItems();
    sidebarMenuMini.innerHTML = todayItems.map(item => `
      <div class="quick-menu-card" onclick="window.quickOrder('${item.id}')" title="Clique para pedir">
        <span class="name">${item.name}</span>
        <span class="price">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
      </div>
    `).join("");
  }

  function updateSidebarCart() {
    const totals = engine.calculateTotals();
    const count = engine.cart.reduce((sum, i) => sum + i.qty, 0);
    cartBadge.textContent = count;

    if (engine.cart.length === 0) {
      sidebarCartList.innerHTML = `<div class="cart-empty-state">Nenhum item adicionado ainda. Peça pelo chat ou clique nos itens acima!</div>`;
      sidebarTotals.innerHTML = "";
      return;
    }

    sidebarCartList.innerHTML = engine.cart.map(item => {
      let notes = [];
      if (item.custom.ponto && item.custom.ponto !== "Padrão") notes.push(item.custom.ponto);
      if (item.custom.remocoes.length > 0) notes.push(`sem ${item.custom.remocoes.join(', ')}`);
      if (item.custom.temperos) notes.push(item.custom.temperos);

      return `
        <div class="sidebar-cart-item">
          <div class="sidebar-cart-row">
            <strong>${item.qty}x ${item.name}</strong>
            <span>R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}</span>
          </div>
          ${notes.length > 0 ? `<div class="sidebar-cart-custom">↳ ${notes.join(' • ')}</div>` : ''}
        </div>
      `;
    }).join("");

    const deliveryLabel = totals.isFreeDelivery 
      ? `<span class="tag-free">GRÁTIS</span>` 
      : `R$ ${totals.delivery.toFixed(2).replace('.', ',')}`;

    sidebarTotals.innerHTML = `
      <div class="sidebar-totals-box">
        <div class="row"><span>Subtotal:</span> <strong>R$ ${totals.subtotal.toFixed(2).replace('.', ',')}</strong></div>
        <div class="row"><span>Entrega:</span> <strong>${deliveryLabel}</strong></div>
        <div class="row total-line"><span>Total:</span> <strong>R$ ${totals.total.toFixed(2).replace('.', ',')}</strong></div>
        <button class="btn-sidebar-finish" onclick="window.finishOrderFromSidebar()">
          <span>Finalizar Pedido</span> ➔
        </button>
      </div>
    `;
  }
});
