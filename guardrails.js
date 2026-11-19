/**
 * guardrails.js
 * Módulo de segurança e integridade para proteção de entrada/saída:
 * 1. Sanitização contra XSS
 * 2. Detecção e bloqueio de Prompt Injection / Jailbreak / Comandos maliciosos
 * 3. Validação de tamanho e limite de requisições (rate limiting)
 * 4. Validação de regras de negócio (limites numéricos de pedidos)
 */

const Guardrails = (function() {
  const MAX_INPUT_LENGTH = 400;
  const RATE_LIMIT_WINDOW_MS = 10000; // 10 segundos
  const MAX_MESSAGES_PER_WINDOW = 8;
  const messageTimestamps = [];

  // Padrões maliciosos típicos de prompt injection e jailbreak
  const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
    /desconsidere\s+(todas\s+as\s+)?instru[cç][oõ]es/i,
    /esque[çc]a\s+(todas\s+as\s+)?suas\s+regras/i,
    /system\s+prompt/i,
    /\bDAN\b/i,
    /do\s+anything\s+now/i,
    /jailbreak/i,
    /modo\s+desenvolvedor/i,
    /developer\s+mode/i,
    /sudo\s+/i,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /eval\s*\(/i,
    /base64/i,
    /voc[eê]\s+agora\s+[eé]\s+um/i,
    /you\s+are\s+now/i,
    /repita\s+o\s+texto\s+acima/i,
    /show\s+your\s+hidden\s+rules/i,
    /revele\s+(suas|as)\s+instru[cç][oõ]es/i
  ];

  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function validateInput(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') {
      return { valid: false, reason: "Mensagem vazia." };
    }

    const trimmed = rawInput.trim();

    // 1. Limite de tamanho
    if (trimmed.length > MAX_INPUT_LENGTH) {
      return {
        valid: false,
        sanitized: escapeHTML(trimmed.slice(0, 100)) + "...",
        reason: `Mensagem muito longa! Por segurança, envie mensagens com até ${MAX_INPUT_LENGTH} caracteres.`
      };
    }

    // 2. Rate limit (anti flood)
    const now = Date.now();
    while (messageTimestamps.length > 0 && messageTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
      messageTimestamps.shift();
    }
    if (messageTimestamps.length >= MAX_MESSAGES_PER_WINDOW) {
      return {
        valid: false,
        sanitized: escapeHTML(trimmed),
        reason: "Você está enviando mensagens rápido demais. Por favor, aguarde alguns segundos."
      };
    }
    messageTimestamps.push(now);

    // 3. Checagem de Injection / Jailbreak
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        return {
          valid: false,
          sanitized: escapeHTML(trimmed),
          reason: "🛡️ [Aviso de Segurança]: Sua mensagem contém termos ou instruções que violam os guardrails do restaurante. Por favor, faça um pedido ou consulte o cardápio."
        };
      }
    }

    return {
      valid: true,
      sanitized: escapeHTML(trimmed),
      cleanText: trimmed
    };
  }

  return {
    escapeHTML,
    validateInput
  };
})();
