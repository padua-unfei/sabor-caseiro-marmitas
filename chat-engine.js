/**
 * chat-engine.js
 * Motor conversacional determinístico inspirado na metodologia de decomposição clássica,
 * modelado especificamente para atendimento de pedidos na Marmitaria Sabor Caseiro.
 * 
 * Totalmente client-side, 0% dependência de LLM, 0% chaves de API externa.
 * Recursos:
 * - Regras de Decomposição (regex e captura de padrões)
 * - Reflexões semânticas para conversação empática
 * - Máquina de Estados para rastreamento de Carrinho e Finalização de Pedido
 * - Extração de Entidades (Itens, Quantidades, Ponto da Carne, Modificação de Temperos e Remoções)
 */

class MarmitaOrderEngine {
  constructor() {
    this.selectedDay = new Date().getDay(); // Dia atual da semana (0-6)
    this.cart = []; // Itens no pedido
    this.customerAddress = "";
    this.stage = "NORMAL"; // 'NORMAL', 'ASK_ADDRESS', 'CONFIRMED'
    
    // Regras de substituição e reflexão semântica
    this.reflections = [
      { from: /\beu quero\b/gi, to: "você quer" },
      { from: /\beu gostaria\b/gi, to: "você gostaria" },
      { from: /\bmeu\b/gi, to: "seu" },
      { from: /\bmeus\b/gi, to: "seus" },
      { from: /\bminha\b/gi, to: "sua" },
      { from: /\bminhas\b/gi, to: "suas" },
      { from: /\bme da\b/gi, to: "te dar" },
      { from: /\bme vê\b/gi, to: "te servir" }
    ];

    // Respostas reflexivas caso o cliente faça perguntas fora do contexto gastronômico
    this.reflectiveFallbacks = [
      "Interessante você dizer isso. Como você se sente hoje em relação ao seu almoço?",
      "Compreendo o que você quer dizer. Que tal aproveitarmos para saborear uma refeição caseira quentinha?",
      "Você sempre pensa dessa maneira quando está com fome?",
      "Entendo seu ponto. Você acredita que saborear uma refeição quentinha ajudaria nesse momento?",
      "Conte-me mais sobre isso. Mas antes, já deu uma olhada nas opções de marmitas frescas de hoje?",
      "O que você gostaria de almoçar hoje enquanto organizamos as ideias?"
    ];
    this.fallbackIndex = 0;
  }

  setDay(dayIndex) {
    this.selectedDay = parseInt(dayIndex, 10);
  }

  getDayName() {
    return WEEKDAYS[this.selectedDay];
  }

  getTodayMenuItems() {
    return getMenuForDay(this.selectedDay);
  }

  // Sanitização interna de texto para comparação
  normalize(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  // Extração de detalhes (ponto, temperos, remoções)
  extractCustomizations(text) {
    const norm = this.normalize(text);
    const custom = {
      ponto: null,
      temperos: null,
      remocoes: []
    };

    // Ponto da carne
    if (norm.includes("bem passada") || norm.includes("bem passado")) {
      custom.ponto = "Bem passado(a)";
    } else if (norm.includes("mal passada") || norm.includes("mal passado")) {
      custom.ponto = "Mal passado(a)";
    } else if (norm.includes("ao ponto") || norm.includes("ponto")) {
      custom.ponto = "Ao ponto";
    }

    // Remoções ("sem cebola", "sem alho", "sem sal", "sem pimenta", "remover cebolas")
    const semMatches = text.match(/(?:sem|remover|tira|retirar|tirar|dispensar)\s+([a-zA-Záéíóúãõç\s]+?)(?:,|\.|\be\b|\bcom\b|\bmas\b|$)/gi);
    if (semMatches) {
      semMatches.forEach(m => {
        const item = m.replace(/^(?:sem|remover|tira|retirar|tirar|dispensar)\s+/i, '').trim();
        if (item.length > 2 && item.length < 30) {
          custom.remocoes.push(item);
        }
      });
    }

    // Temperos adicionais ou trocas ("com pouco sal", "com muito tempero", "com chimichurri", "trocar tempero por X")
    const temperoMatch = text.match(/(?:tempero|temperos|com molho|com toque de|bastante|pouco)\s+([a-zA-Záéíóúãõç\s]+?)(?:,|\.|\be\b|\bsem\b|$)/i);
    if (temperoMatch) {
      custom.temperos = temperoMatch[0].trim();
    }

    return custom;
  }

  // Detecta se uma mensagem quer customizar o ÚLTIMO item do carrinho
  applyCustomizationToLastItem(text) {
    if (this.cart.length === 0) return null;
    const lastItem = this.cart[this.cart.length - 1];
    const extracted = this.extractCustomizations(text);

    let changed = false;
    let details = [];

    if (extracted.ponto) {
      lastItem.custom.ponto = extracted.ponto;
      changed = true;
      details.push(`Ponto: **${extracted.ponto}**`);
    }
    if (extracted.temperos) {
      lastItem.custom.temperos = extracted.temperos;
      changed = true;
      details.push(`Tempero: **${extracted.temperos}**`);
    }
    if (extracted.remocoes.length > 0) {
      extracted.remocoes.forEach(r => {
        if (!lastItem.custom.remocoes.includes(r)) {
          lastItem.custom.remocoes.push(r);
        }
      });
      changed = true;
      details.push(`Remover: **${lastItem.custom.remocoes.join(", ")}**`);
    }

    if (changed) {
      return {
        item: lastItem,
        details: details.join(" | ")
      };
    }
    return null;
  }

  // Tenta encontrar menção a itens do menu
  detectMenuItems(text) {
    const norm = this.normalize(text);
    const todayItems = this.getTodayMenuItems();
    const matches = [];

    for (const item of todayItems) {
      let found = false;
      for (const alias of item.aliases) {
        const normAlias = this.normalize(alias);
        const regex = new RegExp(`\\b${normAlias}\\b`, 'i');
        if (regex.test(norm)) {
          found = true;
          break;
        }
      }
      if (found) {
        matches.push(item);
      }
    }

    return matches;
  }

  // Extrai quantidade indicada no texto
  extractQuantity(text) {
    const norm = this.normalize(text);
    const numberWords = {
      "um": 1, "uma": 1, "dois": 2, "duas": 2, "tres": 3, "três": 3,
      "quatro": 4, "cinco": 5, "seis": 6, "sete": 7, "oito": 8, "nove": 9, "dez": 10
    };

    const digitMatch = norm.match(/\b(\d+)\b/);
    if (digitMatch) {
      const n = parseInt(digitMatch[1], 10);
      if (n > 0 && n <= 50) return n;
    }

    for (const [word, val] of Object.entries(numberWords)) {
      const reg = new RegExp(`\\b${word}\\b`, 'i');
      if (reg.test(norm)) return val;
    }

    return 1;
  }

  // Adiciona ao carrinho
  addToCart(item, qty = 1, custom = {}) {
    const existingIndex = this.cart.findIndex(c => 
      c.id === item.id && 
      JSON.stringify(c.custom) === JSON.stringify(custom)
    );

    if (existingIndex >= 0) {
      this.cart[existingIndex].qty += qty;
    } else {
      this.cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: qty,
        custom: {
          ponto: custom.ponto || item.defaultSpecs.ponto,
          temperos: custom.temperos || item.defaultSpecs.temperos,
          remocoes: custom.remocoes ? [...custom.remocoes] : []
        }
      });
    }
  }

  // Remove do carrinho
  removeFromCart(query) {
    const norm = this.normalize(query);
    const idx = this.cart.findIndex(item => this.normalize(item.name).includes(norm));
    if (idx >= 0) {
      const removed = this.cart.splice(idx, 1)[0];
      return removed;
    }
    return null;
  }

  clearCart() {
    this.cart = [];
    this.stage = "NORMAL";
  }

  calculateTotals() {
    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const delivery = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0.00 : DELIVERY_FEE;
    const total = subtotal + delivery;
    return {
      subtotal,
      delivery,
      total,
      isFreeDelivery: subtotal >= FREE_DELIVERY_THRESHOLD && subtotal > 0
    };
  }

  generateCartSummaryHtml() {
    if (this.cart.length === 0) {
      return `Seu carrinho está vazio no momento. Que tal escolher uma das opções do cardápio de hoje?`;
    }

    const totals = this.calculateTotals();
    let rows = this.cart.map((item) => {
      let customDetails = [];
      if (item.custom.ponto && item.custom.ponto !== "Padrão") {
        customDetails.push(`🥩 Ponto: ${item.custom.ponto}`);
      }
      if (item.custom.remocoes && item.custom.remocoes.length > 0) {
        customDetails.push(`🚫 Sem: ${item.custom.remocoes.join(", ")}`);
      }
      if (item.custom.temperos) {
        customDetails.push(`🧂 Tempero: ${item.custom.temperos}`);
      }

      const customHtml = customDetails.length > 0 
        ? `<div class="cart-custom-details">${customDetails.join(" • ")}</div>` 
        : '';

      return `
        <div class="cart-summary-item">
          <div class="cart-item-header">
            <strong>${item.qty}x ${item.name}</strong>
            <span class="cart-item-price">R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}</span>
          </div>
          ${customHtml}
        </div>
      `;
    }).join("");

    const deliveryText = totals.isFreeDelivery 
      ? `<span class="tag-free">GRÁTIS (compras acima de R$ ${FREE_DELIVERY_THRESHOLD.toFixed(2).replace('.', ',')})</span>`
      : `R$ ${totals.delivery.toFixed(2).replace('.', ',')}`;

    return `
      <div class="order-summary-box">
        <div class="summary-title">🧾 Resumo do seu Pedido</div>
        <div class="summary-items">${rows}</div>
        <div class="summary-totals">
          <div class="summary-row"><span>Subtotal:</span> <strong>R$ ${totals.subtotal.toFixed(2).replace('.', ',')}</strong></div>
          <div class="summary-row"><span>Taxa de Entrega:</span> <strong>${deliveryText}</strong></div>
          <div class="summary-divider"></div>
          <div class="summary-row total-highlight"><span>Total a pagar:</span> <strong>R$ ${totals.total.toFixed(2).replace('.', ',')}</strong></div>
        </div>
      </div>
    `;
  }

  // Gera o cardápio formatado em HTML
  generateMenuHtml() {
    const todayItems = this.getTodayMenuItems();
    const dayName = this.getDayName();

    const marmitas = todayItems.filter(i => i.category === "Marmitas");
    const bebidas = todayItems.filter(i => i.category === "Bebidas");
    const sobremesas = todayItems.filter(i => i.category === "Sobremesas");

    const renderList = (list) => list.map(i => `
      <div class="menu-item-row" onclick="window.quickOrder('${i.id}')" title="Clique para pedir este item">
        <div class="menu-item-info">
          <span class="menu-item-name">${i.name}</span>
          <span class="menu-item-desc">${i.description}</span>
        </div>
        <div class="menu-item-action">
          <span class="menu-item-price">R$ ${i.price.toFixed(2).replace('.', ',')}</span>
          <button class="btn-quick-add" aria-label="Pedir ${i.name}">+ Pedir</button>
        </div>
      </div>
    `).join("");

    return `
      <div class="menu-display-card">
        <div class="menu-display-header">
          <h3>📅 Cardápio de ${dayName}</h3>
          <p class="menu-subtitle">Preços por unidade. Altere temperos e ponto de cozimento livremente!</p>
        </div>

        <div class="menu-section">
          <h4>🍱 Marmitas do Dia</h4>
          <div class="menu-list">${renderList(marmitas)}</div>
        </div>

        <div class="menu-section">
          <h4>🥤 Bebidas Geladas</h4>
          <div class="menu-list">${renderList(bebidas)}</div>
        </div>

        <div class="menu-section">
          <h4>🍮 Sobremesas</h4>
          <div class="menu-list">${renderList(sobremesas)}</div>
        </div>

        <div class="delivery-notice-pill">
          🛵 Taxa de entrega fixa: R$ ${DELIVERY_FEE.toFixed(2).replace('.', ',')} | <strong>Entrega GRÁTIS a partir de R$ ${FREE_DELIVERY_THRESHOLD.toFixed(2).replace('.', ',')}!</strong>
        </div>
      </div>
    `;
  }

  /**
   * Processamento central de mensagens
   */
  process(userMessage) {
    const norm = this.normalize(userMessage);

    // ESTÁGIO: AGUARDANDO ENDEREÇO
    if (this.stage === "ASK_ADDRESS") {
      if (norm.length < 5 || norm === "cancelar" || norm === "nao") {
        this.stage = "NORMAL";
        return {
          text: "Sem problemas, finalização cancelada. Você pode continuar modificando ou adicionando itens ao seu carrinho. O que manda?",
          cartUpdated: false
        };
      }

      this.customerAddress = userMessage;
      this.stage = "CONFIRMED";
      const summary = this.generateCartSummaryHtml();

      const responseText = `
        <div class="confirmation-success">
          🎉 <strong>Pedido Confirmado com Sucesso!</strong>
          <p>A Marmitaria Sabor Caseiro já recebeu o seu pedido e o preparo já começou com todo carinho!</p>
          <p>📍 <strong>Endereço de entrega:</strong> ${Guardrails.escapeHTML(this.customerAddress)}</p>
          ${summary}
          <p class="delivery-time-estimate">⏱️ <em>Tempo estimado de entrega: 30 a 45 minutos. Pagamento na entrega (Cartão, Dinheiro ou PIX).</em></p>
          <div style="margin-top:12px;">
            <button class="btn-new-order" onclick="window.startNewOrder()">Fazer Novo Pedido</button>
          </div>
        </div>
      `;

      return {
        text: responseText,
        cartUpdated: true,
        orderFinished: true
      };
    }

    // 1. REGRAS: SAUDAÇÕES
    if (/^(oi|ola|olá|bom dia|boa tarde|boa noite|e ai|e aí|hey|opa)\b/i.test(norm)) {
      const dayName = this.getDayName();
      return {
        text: `Olá! Bem-vindo à <strong>Marmitaria Sabor Caseiro</strong>! 🍱✨<br><br>Hoje é <strong>${dayName}</strong> e nosso cardápio está repleto de delícias frescas.<br><br>Como posso ajudar você hoje? Você pode digitar <em>"ver cardápio"</em>, pedir diretamente (ex: <em>"Quero um bife de vaca bem passado sem cebola"</em>) ou tirar dúvidas sobre entregas e temperos!`,
        cartUpdated: false
      };
    }

    // 2. REGRAS: VER CARDÁPIO / PREÇOS
    if (/(cardapio|cardápio|menu|opcoes|opções|o que tem|precos|preços|itens disponiveis|itens disponíveis)/i.test(norm)) {
      return {
        text: `Com prazer! Aqui está o nosso cardápio completo de <strong>${this.getDayName()}</strong> com os respectivos preços por unidade:<br>${this.generateMenuHtml()}<br>Para pedir, basta escrever aqui o que deseja e como prefere o tempero ou cozimento!`,
        cartUpdated: false
      };
    }

    // 3. REGRAS: CONSULTA DE VALOR TOTAL / CARRINHO / CONTA
    if (/(quanto deu|valor total|ver carrinho|meu pedido|fechar conta|total|quanto custa a entrega|taxa de entrega)/i.test(norm) && !/(quero|adicionar|mais|marmita|bife)/i.test(norm)) {
      if (this.cart.length === 0) {
        return {
          text: `Você ainda não colocou nenhum item no seu pedido.<br>A taxa de entrega é <strong>R$ ${DELIVERY_FEE.toFixed(2).replace('.', ',')}</strong> (e sai <strong>GRÁTIS</strong> para pedidos a partir de R$ ${FREE_DELIVERY_THRESHOLD.toFixed(2).replace('.', ',')})!<br><br>Gostaria de ver o cardápio de hoje para escolher sua marmita?`,
          cartUpdated: false
        };
      }
      return {
        text: `Aqui está o detalhamento atual do seu pedido:<br>${this.generateCartSummaryHtml()}<br>Você deseja <strong>finalizar o pedido</strong> ou gostaria de pedir mais alguma coisa?`,
        cartUpdated: false
      };
    }

    // 4. REGRAS: FINALIZAR PEDIDO
    if (/(finalizar|fechar pedido|concluir|pode enviar|entregar|quero fechar|pedir a conta)/i.test(norm)) {
      if (this.cart.length === 0) {
        return {
          text: `Seu carrinho ainda está vazio! Que tal pedir uma saborosa marmita antes de fechar o pedido? Digite <em>"ver cardápio"</em> para conferir as opções de hoje.`,
          cartUpdated: false
        };
      }
      this.stage = "ASK_ADDRESS";
      const totals = this.calculateTotals();
      return {
        text: `
          Excelente escolha! Estamos prontos para fechar seu pedido no valor total de <strong>R$ ${totals.total.toFixed(2).replace('.', ',')}</strong>.<br><br>
          📍 Por favor, <strong>digite seu endereço completo de entrega</strong> (Rua, Número, Bairro e Ponto de Referência):
        `,
        cartUpdated: false
      };
    }

    // 5. REGRAS: LIMPAR CARRINHO / CANCELAR
    if (/(limpar carrinho|esvaziar|cancelar pedido|recomecar|recomeçar)/i.test(norm)) {
      this.clearCart();
      return {
        text: `Carrinho limpo com sucesso! Podemos começar um novo pedido do zero quando quiser.`,
        cartUpdated: true
      };
    }

    // 6. REGRAS: REMOVER ITEM ESPECÍFICO
    if (/(remover|tirar|cancelar)\s+(o|a|meu|minha)?\s*(bife|frango|tilapia|tilápia|feijoada|lasanha|omelete|suco|coca|pudim|mousse)/i.test(norm)) {
      const match = norm.match(/(bife|frango|tilapia|tilápia|feijoada|lasanha|omelete|suco|coca|pudim|mousse)/i);
      if (match) {
        const removed = this.removeFromCart(match[1]);
        if (removed) {
          return {
            text: `Pronto! Removi <strong>${removed.name}</strong> do seu pedido.<br>${this.generateCartSummaryHtml()}`,
            cartUpdated: true
          };
        } else {
          return {
            text: `Não encontrei ${match[1]} no seu carrinho atual. Você pode dizer "ver carrinho" para conferir o que já pediu.`,
            cartUpdated: false
          };
        }
      }
    }

    // 7. DETECÇÃO DE PEDIDO COM ITENS E CUSTOMIZAÇÕES
    const detectedItems = this.detectMenuItems(userMessage);
    const custom = this.extractCustomizations(userMessage);
    const qty = this.extractQuantity(userMessage);

    if (detectedItems.length > 0) {
      const addedNames = [];

      for (const item of detectedItems) {
        this.addToCart(item, qty, custom);
        addedNames.push(`${qty}x ${item.name}`);
      }

      let customRemarks = [];
      if (custom.ponto) customRemarks.push(`ponto: <em>${custom.ponto}</em>`);
      if (custom.temperos) customRemarks.push(`tempero: <em>${custom.temperos}</em>`);
      if (custom.remocoes.length > 0) customRemarks.push(`sem: <em>${custom.remocoes.join(", ")}</em>`);

      const remarksText = customRemarks.length > 0 
        ? `<br>✨ <strong>Ajustes personalizados aplicados:</strong> ${customRemarks.join(" | ")}`
        : '';

      return {
        text: `
          Adicionei <strong>${addedNames.join(" e ")}</strong> ao seu pedido com sucesso!${remarksText}<br>
          ${this.generateCartSummaryHtml()}
          <br>Você deseja adicionar mais algum item, bebida ou sobremesa, alterar algo ou podemos <strong>finalizar o pedido</strong>?
        `,
        cartUpdated: true
      };
    }

    // 8. CUSTOMIZAÇÃO RETROATIVA ("mudar ponto para bem passado", "sem cebola por favor")
    const updatedLast = this.applyCustomizationToLastItem(userMessage);
    if (updatedLast) {
      return {
        text: `
          Anotado e alterado! Atualizei a personalização de <strong>${updatedLast.item.name}</strong>:<br>
          👉 ${updatedLast.details}<br>
          ${this.generateCartSummaryHtml()}
        `,
        cartUpdated: true
      };
    }

    // 9. PERGUNTAS SOBRE TEMPEROS E INGREDIENTES
    if (/(tempero|temperos|alho|cebola|sal|pimenta|ponto|cozimento)/i.test(norm)) {
      return {
        text: `Aqui na Marmitaria Sabor Caseiro você tem total controle! 🧂🍳<br>Você pode nos dizer exatamente como gosta da sua comida:
          <ul>
            <li><strong>Ponto da carne:</strong> Mal passada, ao ponto ou bem passada;</li>
            <li><strong>Ingredientes:</strong> Remover cebola, alho, pimenta, bacon, etc;</li>
            <li><strong>Temperos:</strong> Mais suave, pouco sal, ervas finas ou toque da casa.</li>
          </ul>
          Qual item você gostaria de pedir com sua preferência?`,
        cartUpdated: false
      };
    }

    // 10. AGRADECIMENTO OU FEEDBACK
    if (/(obrigado|obrigada|valeu|muito bom|perfeito|show|otimo|ótimo)/i.test(norm)) {
      return {
        text: `É sempre um prazer atender você! Se precisar de mais alguma coisa para o seu almoço ou quiser finalizar seu pedido, estou à sua disposição.`,
        cartUpdated: false
      };
    }

    // 11. FALLBACK REFLEXIVO
    let reflectiveReply = this.reflectiveFallbacks[this.fallbackIndex % this.reflectiveFallbacks.length];
    this.fallbackIndex++;

    for (const ref of this.reflections) {
      if (ref.from.test(userMessage)) {
        const transformed = userMessage.replace(ref.from, ref.to);
        reflectiveReply = `Você me disse que "${Guardrails.escapeHTML(transformed)}". Conte-me: como podemos transformar isso em uma boa refeição para hoje? Experimente pedir uma marmita fresquinha!`;
        break;
      }
    }

    return {
      text: `${reflectiveReply}<br><br><small style="color:var(--text-muted)">💡 Dica rápida: Você pode digitar <em>"ver cardápio"</em> ou pedir diretamente como <em>"1 bife de vaca sem cebola e bem passado"</em>.</small>`,
      cartUpdated: false
    };
  }
}
