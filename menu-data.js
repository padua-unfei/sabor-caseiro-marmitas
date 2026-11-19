/**
 * menu-data.js
 * Cardápio completo organizado por dias da semana e categorias.
 */

const DELIVERY_FEE = 5.00;
const FREE_DELIVERY_THRESHOLD = 40.00;

const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado"
];

// Cardápio completo
const MENU_ITEMS = [
  // SEGUNDA (1), QUARTA (3), SEXTA (5)
  {
    id: "frango_grelhado",
    name: "Frango Grelhado",
    aliases: ["frango grelhado", "frango", "file de frango", "filé de frango", "peito de frango"],
    description: "Peito de frango grelhado no azeite e ervas finas, arroz branco, feijão carioca e salada fresca.",
    price: 19.90,
    category: "Marmitas",
    availableDays: [1, 3, 5],
    defaultSpecs: {
      ponto: "Padrão",
      temperos: "Ervas finas, alho e azeite",
      remocoes: []
    },
    allowedCustomizations: ["ponto", "temperos", "cebola", "alho", "sal", "pimenta", "feijao", "arroz", "salada"]
  },
  {
    id: "file_tilapia",
    name: "Filé de Tilápia",
    aliases: ["tilapia", "tilápia", "file de tilapia", "peixe"],
    description: "Filé de tilápia grelhada com toque de limão e alecrim, arroz, purê de batata cremoso e legumes no vapor.",
    price: 23.50,
    category: "Marmitas",
    availableDays: [1, 5],
    defaultSpecs: {
      ponto: "Ao ponto",
      temperos: "Limão, alecrim e azeite",
      remocoes: []
    },
    allowedCustomizations: ["ponto", "temperos", "limao", "alho", "pure", "legumes"]
  },

  // TERÇA (2), QUINTA (4)
  {
    id: "bife_vaca",
    name: "Bife de Vaca",
    aliases: ["bife de vaca", "bife", "bife bovino", "carne bovina", "bife acebolado", "carne"],
    description: "Bife bovino macio acebolado, servido com arroz soltinho, feijão caseiro, farofa crocante e batatas.",
    price: 24.00,
    category: "Marmitas",
    availableDays: [2, 4],
    defaultSpecs: {
      ponto: "Ao ponto",
      temperos: "Alho, sal grosso e cheiro verde",
      remocoes: []
    },
    allowedCustomizations: ["ponto", "cebola", "temperos", "alho", "sal", "farofa", "feijao", "arroz"]
  },
  {
    id: "frango_ensopado",
    name: "Frango Ensopado",
    aliases: ["frango ensopado", "ensopado", "coxa de frango"],
    description: "Sobrecoxa suculenta cozida lentamente com batatas e cenouras em molho caseiro de tomate.",
    price: 20.00,
    category: "Marmitas",
    availableDays: [2, 6],
    defaultSpecs: {
      ponto: "Bem cozido",
      temperos: "Páprica doce, cebolinha e alho",
      remocoes: []
    },
    allowedCustomizations: ["temperos", "cebola", "alho", "batata", "cenoura", "molho"]
  },

  // QUARTA (3), SÁBADO (6)
  {
    id: "feijoada",
    name: "Feijoada Completa",
    aliases: ["feijoada", "feijoada completa", "feijuca"],
    description: "Feijão preto com carnes nobres selecionadas, arroz branco, couve refogada no alho, farofa e laranja.",
    price: 27.90,
    category: "Marmitas",
    availableDays: [3, 6],
    defaultSpecs: {
      ponto: "Tradicional",
      temperos: "Louro, alho e pimenta leve",
      remocoes: []
    },
    allowedCustomizations: ["temperos", "alho", "bacon", "couve", "farofa", "laranja", "pimenta"]
  },

  // QUINTA (4)
  {
    id: "lasanha_bolonhesa",
    name: "Lasanha à Bolonhesa",
    aliases: ["lasanha", "lasanha bolonhesa", "lasanha a bolonhesa"],
    description: "Camadas artesanais de massa, molho bolonhesa encorpado de carne bovina, presunto e bastante queijo gratinado.",
    price: 22.90,
    category: "Marmitas",
    availableDays: [4],
    defaultSpecs: {
      ponto: "Gratinado",
      temperos: "Manjericão e orégano fresco",
      remocoes: []
    },
    allowedCustomizations: ["queijo", "molho", "temperos", "oregano"]
  },

  // SEXTA (5)
  {
    id: "strogonoff_frango",
    name: "Strogonoff de Frango",
    aliases: ["strogonoff", "estrogonofe", "strogonoff de frango"],
    description: "Tiras macias de frango em molho cremoso com champignon e toque de mostarda djon, arroz e batata palha.",
    price: 21.50,
    category: "Marmitas",
    availableDays: [5],
    defaultSpecs: {
      ponto: "Cremoso",
      temperos: "Toque de noz-moscada e mostarda",
      remocoes: []
    },
    allowedCustomizations: ["champignon", "batata palha", "temperos", "mostarda"]
  },

  // SÁBADO (6)
  {
    id: "picanha_grelhada",
    name: "Picanha Grelhada",
    aliases: ["picanha", "picanha grelhada"],
    description: "Cortes de picanha maturada grelhados no ponto certo, arroz biro-biro, mandioca frita e vinagrete.",
    price: 32.90,
    category: "Marmitas",
    availableDays: [6],
    defaultSpecs: {
      ponto: "Ao ponto para mal passada",
      temperos: "Sal grosso de parrilla e chimichurri",
      remocoes: []
    },
    allowedCustomizations: ["ponto", "temperos", "chimichurri", "mandioca", "vinagrete", "cebola"]
  },

  // DOMINGO (0)
  {
    id: "costela_assada",
    name: "Costela Bovina Assada",
    aliases: ["costela", "costela assada", "costela bovina"],
    description: "Costela desmanchando assada em baixa temperatura com mandioca na manteiga de garrafa, arroz e farofa de ovos.",
    price: 29.90,
    category: "Marmitas",
    availableDays: [0],
    defaultSpecs: {
      ponto: "Desmanchando (bem passada)",
      temperos: "Alho rústico e alecrim",
      remocoes: []
    },
    allowedCustomizations: ["ponto", "temperos", "mandioca", "alho", "manteiga", "farofa"]
  },

  // TODOS OS DIAS (0,1,2,3,4,5,6)
  {
    id: "marmita_vegetariana",
    name: "Marmita Vegetariana",
    aliases: ["vegetariana", "marmita vegetariana", "veggie", "legumes"],
    description: "Mix colorido de legumes grelhados com cogumelos salteados, arroz integral, lentilha temperada e chips de batata doce.",
    price: 19.00,
    category: "Marmitas",
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    defaultSpecs: {
      ponto: "Al dente",
      temperos: "Ervas de Provence, azeite extra virgem e alho poró",
      remocoes: []
    },
    allowedCustomizations: ["cogumelos", "alho poro", "temperos", "cebola", "sal"]
  },
  {
    id: "omelete_fit",
    name: "Omelete Fit com Queijo",
    aliases: ["omelete", "omelete fit", "omelet"],
    description: "Omelete leve com 3 ovos caipiras, queijo branco, tomate cereja, orégano, acompanhado de salada verde.",
    price: 16.50,
    category: "Marmitas",
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    defaultSpecs: {
      ponto: "Fofinho / úmido",
      temperos: "Orégano fresco, cheiro verde e pitada de sal",
      remocoes: []
    },
    allowedCustomizations: ["ponto", "queijo", "tomate", "temperos", "sal", "cebola"]
  },

  // BEBIDAS (Todos os dias)
  {
    id: "suco_laranja",
    name: "Suco Natural de Laranja 500ml",
    aliases: ["suco de laranja", "suco laranja", "laranja 500ml"],
    description: "Suco 100% fruta espremido na hora, gelado e refrescante.",
    price: 7.50,
    category: "Bebidas",
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    defaultSpecs: {
      ponto: "Gelado",
      temperos: "Natural sem açúcar",
      remocoes: []
    },
    allowedCustomizations: ["acucar", "gelo", "adocante"]
  },
  {
    id: "suco_maracuja",
    name: "Suco Natural de Maracujá 500ml",
    aliases: ["suco de maracuja", "suco de maracujá", "suco maracuja"],
    description: "Suco natural batido na hora com polpa fresca.",
    price: 8.00,
    category: "Bebidas",
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    defaultSpecs: {
      ponto: "Gelado",
      temperos: "Adoçado moderadamente",
      remocoes: []
    },
    allowedCustomizations: ["acucar", "gelo", "adocante"]
  },
  {
    id: "coca_lata",
    name: "Coca-Cola Lata 350ml",
    aliases: ["coca", "coca cola", "coca-cola", "refrigerante coca"],
    description: "Refrigerante em lata 350ml bem gelado.",
    price: 5.50,
    category: "Bebidas",
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    defaultSpecs: {
      ponto: "Gelada",
      temperos: "Padrão de fábrica",
      remocoes: []
    },
    allowedCustomizations: []
  },
  {
    id: "coca_zero",
    name: "Coca-Cola Zero Lata 350ml",
    aliases: ["coca zero", "coca-cola zero", "refrigerante zero"],
    description: "Refrigerante sem açúcar em lata 350ml.",
    price: 5.50,
    category: "Bebidas",
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    defaultSpecs: {
      ponto: "Gelada",
      temperos: "Padrão de fábrica",
      remocoes: []
    },
    allowedCustomizations: []
  },
  {
    id: "agua_sem_gas",
    name: "Água Mineral 500ml",
    aliases: ["agua", "água", "agua mineral", "agua sem gas"],
    description: "Água mineral pura e refrescante.",
    price: 3.50,
    category: "Bebidas",
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    defaultSpecs: {
      ponto: "Gelada",
      temperos: "Sem gás",
      remocoes: []
    },
    allowedCustomizations: ["gelada", "temperatura ambiente"]
  },

  // SOBREMESAS (Todos os dias)
  {
    id: "pudim_leite",
    name: "Pudim de Leite Condensado",
    aliases: ["pudim", "pudim de leite", "sobremesa pudim"],
    description: "Fatia generosa de pudim tradicional com calda caramelizada da casa.",
    price: 7.00,
    category: "Sobremesas",
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    defaultSpecs: {
      ponto: "Geladinho e cremoso",
      temperos: "Calda de caramelo artesanal",
      remocoes: []
    },
    allowedCustomizations: ["calda"]
  },
  {
    id: "mousse_maracuja",
    name: "Mousse de Maracujá",
    aliases: ["mousse", "mousse de maracuja", "mousse de maracujá"],
    description: "Mousse aerado de maracujá coberto com redução artesanal de sementinhas.",
    price: 6.50,
    category: "Sobremesas",
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    defaultSpecs: {
      ponto: "Gelado",
      temperos: "Calda com sementes",
      remocoes: []
    },
    allowedCustomizations: ["sementes"]
  }
];

function getMenuForDay(dayIndex) {
  return MENU_ITEMS.filter(item => item.availableDays.includes(dayIndex));
}

function findMenuItemByName(term) {
  const clean = term.toLowerCase().trim();
  return MENU_ITEMS.find(item => {
    if (item.name.toLowerCase() === clean) return true;
    if (item.aliases.some(a => clean.includes(a) || a.includes(clean))) return true;
    return false;
  });
}
