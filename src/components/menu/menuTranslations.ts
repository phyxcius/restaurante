import { Language } from '../../types';

export interface MenuTexts {
  // Categories
  catAll: string;
  catEntradas: string;
  catMains: string;
  catBebidas: string;
  catPostres: string;

  // Header & Navigation
  mesa: string;
  reelsMode: string;
  gridMode: string;
  lockMenu: string;
  gestureHelp: string;

  // TikTok Reels UI
  tiktokSwipeHint: string;
  tiktokSwipeTutorial: string;
  tapToDismiss: string;
  addToOrder: string;
  addedToOrder: string;
  previousDish: string;
  nextDish: string;
  mute: string;
  unmute: string;
  pause: string;
  play: string;
  share: string;
  likes: string;
  reviews: string;

  // Active Order Bar
  activeOrderTitle: string;
  statusReceived: string;
  statusInKitchen: string;
  statusServed: string;
  callWaiter: string;
  requestBill: string;
  total: string;

  // Cart Drawer
  yourOrder: string;
  clearCart: string;
  cartEmpty: string;
  specialNotes: string;
  yourNameOptional: string;
  paymentMethod: string;
  cash: string;
  posCard: string;
  digitalWallet: string;
  cashGivenQuestion: string;
  estimatedChange: string;
  totalToPay: string;
  sendOrderToKitchen: string;
  viewOrder: string;

  // Lock Screen Gate
  lockScreenTitle: string;
  lockScreenSubtitle: string;
  diningTable: string;
  accessPassword: string;
  unlockAndEnter: string;
  directGuestAccess: string;
  invalidPin: string;

  // Paid / Thank You Screen
  thankYouTitle: string;
  thankYouMessage: string;
  billPaidClosed: string;
  ratingQuestion: string;
  leaveCommentPlaceholder: string;
  submitRating: string;
  ratingSubmittedThanks: string;
  tableLockedNotice: string;
  unlockForNewGuests: string;
  unlockTableModalTitle: string;
  enterWaiterPin: string;
  cancel: string;
  unlock: string;
  invalidMozoPin: string;

  // Centered Notification Modal
  tableNotification: string;
  acceptContinue: string;
  chefAcceptedMessage: string;
  orderReadyMessage: string;
  billRequestedMessage: string;
  waiterCalledMessage: string;
}

export const MENU_TRANSLATIONS: Record<Language, MenuTexts> = {
  es: {
    catAll: 'Todo el Menú',
    catEntradas: 'Entradas',
    catMains: 'Platos de Fondo',
    catBebidas: 'Bebidas & Tragos',
    catPostres: 'Postres',

    mesa: 'Mesa',
    reelsMode: 'Modo Video Reels',
    gridMode: 'Modo Catálogo Cuadrícula',
    lockMenu: 'Bloquear Menú con Clave',
    gestureHelp: 'Ver Dedo Gestual',

    tiktokSwipeHint: 'Desliza hacia arriba o abajo como en TikTok',
    tiktokSwipeTutorial: '👆 Desliza tu dedo hacia arriba o hacia abajo como en TikTok para descubrir cada plato cusqueño',
    tapToDismiss: 'Toca en cualquier parte para continuar',
    addToOrder: 'Agregar al Pedido',
    addedToOrder: '¡Plato agregado a tu pedido!',
    previousDish: 'Plato anterior',
    nextDish: 'Siguiente plato',
    mute: 'Silenciar',
    unmute: 'Activar Sonido',
    pause: 'Pausar',
    play: 'Reproducir',
    share: 'Compartir',
    likes: '1.4k',
    reviews: '86',

    activeOrderTitle: 'Comanda en Proceso',
    statusReceived: '🛎️ Recibida en Sistema',
    statusInKitchen: '👨‍🍳 En Preparación (Cocina)',
    statusServed: '🍽️ ¡Listo para Servir!',
    callWaiter: 'Mozo',
    requestBill: 'Pedir Cuenta',
    total: 'Total',

    yourOrder: 'Tu Pedido en Mesa',
    clearCart: 'Vaciar',
    cartEmpty: 'Tu canasta está vacía. Selecciona tus platos preferidos para ordenar.',
    specialNotes: 'Notas o preferencias para la cocina (sin cebolla, término medio, etc.)...',
    yourNameOptional: 'Tu Nombre (opcional para el ticket):',
    paymentMethod: 'Forma de Pago Prevista:',
    cash: 'Efectivo',
    posCard: 'Tarjeta POS',
    digitalWallet: 'Yape / Plin',
    cashGivenQuestion: '¿Con cuánto efectivo pagarás?',
    estimatedChange: 'Tu vuelto estimado:',
    totalToPay: 'Total a Pagar:',
    sendOrderToKitchen: 'Enviar Comanda a Cocina',
    viewOrder: 'Ver Pedido',

    lockScreenTitle: 'Menú Digital & Salón',
    lockScreenSubtitle: 'Ingreso autorizado con clave de acceso antes de abrir la carta interactiva:',
    diningTable: 'Mesa del Salón:',
    accessPassword: 'Contraseña de Acceso (Mozo / Admin):',
    unlockAndEnter: 'Desbloquear e Ingresar al Menú',
    directGuestAccess: '👉 Ingreso directo como Comensal escaneando QR',
    invalidPin: '⛔ Clave incorrecta. Usa mozo123 o tu PIN autorizado.',

    thankYouTitle: '¡Muchas Gracias por su Preferencia!',
    thankYouMessage: 'Esperamos que haya disfrutado de nuestra auténtica tradición gastronómica. ¡Será un inmenso honor recibirle nuevamente en su casa!',
    billPaidClosed: 'Cuenta Pagada y Cerrada',
    ratingQuestion: '¿Cómo fue su experiencia gastronómica?',
    leaveCommentPlaceholder: 'Déjenos un comentario o felicitación (opcional)...',
    submitRating: 'Enviar Calificación',
    ratingSubmittedThanks: '¡Muchas gracias por valorar nuestro servicio!',
    tableLockedNotice: 'Mesa bloqueada automáticamente al registrar el pago.',
    unlockForNewGuests: '¿Eres el Mozo? Desbloquear para nuevos comensales',
    unlockTableModalTitle: 'Desbloqueo de Mesa',
    enterWaiterPin: 'Ingresa la clave del mozo o administrador para liberar la mesa:',
    cancel: 'Cancelar',
    unlock: 'Desbloquear',
    invalidMozoPin: 'Clave incorrecta (Use mozo123 o clave de admin)',

    tableNotification: 'Notificación de Mesa',
    acceptContinue: 'Aceptar / Continuar',
    chefAcceptedMessage: '👨‍🍳 ¡El Chef aceptó tu pedido! Está en preparación al momento.',
    orderReadyMessage: '🟢 ¡Tu pedido está LISTO! El mozo lo está llevando a tu mesa.',
    billRequestedMessage: '🧾 ¡Has solicitado la cuenta! El mozo se acerca a tu mesa con el comprobante.',
    waiterCalledMessage: '🛎️ ¡Mozo llamado a tu mesa! Un mozo llegará a atenderte.',
  },
  en: {
    catAll: 'Full Menu',
    catEntradas: 'Appetizers',
    catMains: 'Main Courses',
    catBebidas: 'Drinks & Cocktails',
    catPostres: 'Desserts',

    mesa: 'Table',
    reelsMode: 'Reels Video Mode',
    gridMode: 'Grid Catalog Mode',
    lockMenu: 'Lock Menu with PIN',
    gestureHelp: 'View Hand Gesture',

    tiktokSwipeHint: 'Swipe up or down like on TikTok',
    tiktokSwipeTutorial: '👆 Swipe up or down like on TikTok to explore each traditional Andean dish',
    tapToDismiss: 'Tap anywhere to continue',
    addToOrder: 'Add to Order',
    addedToOrder: 'Dish added to your order!',
    previousDish: 'Previous dish',
    nextDish: 'Next dish',
    mute: 'Mute',
    unmute: 'Unmute',
    pause: 'Pause',
    play: 'Play',
    share: 'Share',
    likes: '1.4k',
    reviews: '86',

    activeOrderTitle: 'Active Order in Progress',
    statusReceived: '🛎️ Received in System',
    statusInKitchen: '👨‍🍳 Being Prepared (Kitchen)',
    statusServed: '🍽️ Ready to Serve!',
    callWaiter: 'Waiter',
    requestBill: 'Request Bill',
    total: 'Total',

    yourOrder: 'Your Table Order',
    clearCart: 'Clear',
    cartEmpty: 'Your cart is empty. Pick your favorite dishes to start ordering.',
    specialNotes: 'Notes or preferences for the kitchen (no onions, medium rare, etc.)...',
    yourNameOptional: 'Your Name (optional for receipt):',
    paymentMethod: 'Intended Payment Method:',
    cash: 'Cash',
    posCard: 'POS Card',
    digitalWallet: 'Digital Wallet',
    cashGivenQuestion: 'How much cash will you pay with?',
    estimatedChange: 'Your estimated change:',
    totalToPay: 'Total to Pay:',
    sendOrderToKitchen: 'Send Order to Kitchen',
    viewOrder: 'View Order',

    lockScreenTitle: 'Digital Menu & Dining Room',
    lockScreenSubtitle: 'Authorized access required before viewing interactive video menu:',
    diningTable: 'Dining Room Table:',
    accessPassword: 'Access Password (Waiter / Admin):',
    unlockAndEnter: 'Unlock and Open Menu',
    directGuestAccess: '👉 Direct Guest access by scanning QR',
    invalidPin: '⛔ Incorrect PIN. Use mozo123 or authorized code.',

    thankYouTitle: 'Thank You for Dining With Us!',
    thankYouMessage: 'We hope you enjoyed our authentic Andean gastronomic tradition. It will be our great honor to welcome you back!',
    billPaidClosed: 'Bill Paid & Table Closed',
    ratingQuestion: 'How was your dining experience?',
    leaveCommentPlaceholder: 'Leave us feedback or congratulations (optional)...',
    submitRating: 'Submit Rating',
    ratingSubmittedThanks: 'Thank you very much for rating our service!',
    tableLockedNotice: 'Table automatically locked after payment.',
    unlockForNewGuests: 'Are you the Waiter? Unlock for new guests',
    unlockTableModalTitle: 'Table Unlock',
    enterWaiterPin: 'Enter waiter or admin password to release this table:',
    cancel: 'Cancel',
    unlock: 'Unlock',
    invalidMozoPin: 'Incorrect password (Use mozo123 or admin password)',

    tableNotification: 'Table Notification',
    acceptContinue: 'Accept / Continue',
    chefAcceptedMessage: '👨‍🍳 The Chef accepted your order! It is now being cooked.',
    orderReadyMessage: '🟢 Your order is READY! The waiter is bringing it to your table.',
    billRequestedMessage: '🧾 You requested the bill! The waiter is on their way with the receipt.',
    waiterCalledMessage: '🛎️ Waiter called to your table! Assistance is arriving.',
  },
  fr: {
    catAll: 'Tout le Menu',
    catEntradas: 'Entrées',
    catMains: 'Plats Principaux',
    catBebidas: 'Boissons & Cocktails',
    catPostres: 'Desserts',

    mesa: 'Table',
    reelsMode: 'Mode Vidéo Reels',
    gridMode: 'Mode Catalogue Grille',
    lockMenu: 'Verrouiller le Menu',
    gestureHelp: 'Voir le Geste Tactile',

    tiktokSwipeHint: 'Glissez vers le haut ou le bas comme sur TikTok',
    tiktokSwipeTutorial: '👆 Glissez votre doigt vers le haut ou le bas comme sur TikTok pour découvrir chaque plat',
    tapToDismiss: 'Touchez n\'importe où pour continuer',
    addToOrder: 'Ajouter à la Commande',
    addedToOrder: 'Plat ajouté à votre commande !',
    previousDish: 'Plat précédent',
    nextDish: 'Plat suivant',
    mute: 'Couper le son',
    unmute: 'Activer le son',
    pause: 'Pause',
    play: 'Lecture',
    share: 'Partager',
    likes: '1.4k',
    reviews: '86',

    activeOrderTitle: 'Commande en Cours',
    statusReceived: '🛎️ Reçue par le Système',
    statusInKitchen: '👨‍🍳 En Cuisine (Préparation)',
    statusServed: '🍽️ Prêt à Servir !',
    callWaiter: 'Serveur',
    requestBill: 'L\'Addition',
    total: 'Total',

    yourOrder: 'Votre Commande de Table',
    clearCart: 'Vider',
    cartEmpty: 'Votre panier est vide. Choisissez vos plats préférés.',
    specialNotes: 'Notes ou préférences pour la cuisine (sans oignon, etc.)...',
    yourNameOptional: 'Votre Nom (facultatif pour le ticket) :',
    paymentMethod: 'Mode de Paiement Prévu :',
    cash: 'Espèces',
    posCard: 'Carte Bancaire',
    digitalWallet: 'Paiement Mobile',
    cashGivenQuestion: 'Avec combien d\'espèces allez-vous payer ?',
    estimatedChange: 'Votre monnaie estimée :',
    totalToPay: 'Total à Payer :',
    sendOrderToKitchen: 'Envoyer en Cuisine',
    viewOrder: 'Voir la Commande',

    lockScreenTitle: 'Menu Digital & Salle',
    lockScreenSubtitle: 'Accès sécurisé par mot de passe avant d\'ouvrir le menu interactif :',
    diningTable: 'Table de la Salle :',
    accessPassword: 'Mot de Passe (Serveur / Admin) :',
    unlockAndEnter: 'Déverrouiller et Ouvrir',
    directGuestAccess: '👉 Accès direct Client en scannant le QR',
    invalidPin: '⛔ Code incorrect. Utilisez mozo123 ou code autorisé.',

    thankYouTitle: 'Merci Beaucoup pour Votre Visite !',
    thankYouMessage: 'Nous espérons que vous avez apprécié notre authentique tradition culinaire. Ce sera un immense honneur de vous accueillir à nouveau !',
    billPaidClosed: 'Addition Payée & Table Clôturée',
    ratingQuestion: 'Comment s\'est passée votre expérience ?',
    leaveCommentPlaceholder: 'Laissez-nous un commentaire (facultatif)...',
    submitRating: 'Envoyer l\'Avis',
    ratingSubmittedThanks: 'Merci d\'avoir noté notre service !',
    tableLockedNotice: 'Table verrouillée automatiquement après paiement.',
    unlockForNewGuests: 'Êtes-vous le Serveur ? Déverrouiller la table',
    unlockTableModalTitle: 'Déverrouillage de Table',
    enterWaiterPin: 'Entrez le mot de passe serveur ou administrateur :',
    cancel: 'Annuler',
    unlock: 'Déverrouiller',
    invalidMozoPin: 'Mot de passe incorrect (Utilisez mozo123)',

    tableNotification: 'Notification de Table',
    acceptContinue: 'Accepter / Continuer',
    chefAcceptedMessage: '👨‍🍳 Le Chef a accepté votre commande ! Elle est en préparation.',
    orderReadyMessage: '🟢 Votre commande est PRÊTE ! Le serveur arrive à votre table.',
    billRequestedMessage: '🧾 Vous avez demandé l\'addition ! Le serveur arrive avec la note.',
    waiterCalledMessage: '🛎️ Serveur appelé à votre table ! Il arrive dans un instant.',
  },
  pt: {
    catAll: 'Cardápio Completo',
    catEntradas: 'Entradas',
    catMains: 'Pratos Principais',
    catBebidas: 'Bebidas & Drinques',
    catPostres: 'Sobremesas',

    mesa: 'Mesa',
    reelsMode: 'Modo Vídeo Reels',
    gridMode: 'Modo Catálogo Grade',
    lockMenu: 'Bloquear Cardápio com Senha',
    gestureHelp: 'Ver Gesto com Dedo',

    tiktokSwipeHint: 'Deslize para cima ou para baixo como no TikTok',
    tiktokSwipeTutorial: '👆 Deslize seu dedo para cima ou para baixo como no TikTok para descobrir cada prato cusquenho',
    tapToDismiss: 'Toque em qualquer lugar para continuar',
    addToOrder: 'Adicionar ao Pedido',
    addedToOrder: 'Prato adicionado ao seu pedido!',
    previousDish: 'Prato anterior',
    nextDish: 'Próximo prato',
    mute: 'Silenciar',
    unmute: 'Ativar Som',
    pause: 'Pausar',
    play: 'Reproduzir',
    share: 'Compartilhar',
    likes: '1.4k',
    reviews: '86',

    activeOrderTitle: 'Comanda em Andamento',
    statusReceived: '🛎️ Recebida no Sistema',
    statusInKitchen: '👨‍🍳 Em Preparo (Cozinha)',
    statusServed: '🍽️ Pronto para Servir!',
    callWaiter: 'Garçom',
    requestBill: 'Pedir a Conta',
    total: 'Total',

    yourOrder: 'Seu Pedido na Mesa',
    clearCart: 'Limpar',
    cartEmpty: 'Seu carrinho está vazio. Escolha seus pratos favoritos para pedir.',
    specialNotes: 'Observações para a cozinha (sem cebola, ponto da carne, etc.)...',
    yourNameOptional: 'Seu Nome (opcional para a comanda):',
    paymentMethod: 'Forma de Pagamento Prevista:',
    cash: 'Dinheiro',
    posCard: 'Cartão POS',
    digitalWallet: 'Pix / Carteira Digital',
    cashGivenQuestion: 'Com quanto dinheiro você vai pagar?',
    estimatedChange: 'Seu troco estimado:',
    totalToPay: 'Total a Pagar:',
    sendOrderToKitchen: 'Enviar Comanda à Cozinha',
    viewOrder: 'Ver Pedido',

    lockScreenTitle: 'Cardápio Digital & Salão',
    lockScreenSubtitle: 'Acesso autorizado por senha antes de abrir o cardápio interativo:',
    diningTable: 'Mesa do Salão:',
    accessPassword: 'Senha de Acesso (Garçom / Admin):',
    unlockAndEnter: 'Desbloquear e Abrir Cardápio',
    directGuestAccess: '👉 Acesso direto Cliente escaneando o QR',
    invalidPin: '⛔ Senha incorreta. Use mozo123 ou seu código autorizado.',

    thankYouTitle: 'Muito Obrigado pela Preferência!',
    thankYouMessage: 'Esperamos que tenha apreciado nossa autêntica tradição gastronômica andina. Será uma imensa honra recebê-lo novamente!',
    billPaidClosed: 'Conta Paga & Mesa Encerrada',
    ratingQuestion: 'Como foi sua experiência gastronômica?',
    leaveCommentPlaceholder: 'Deixe um comentário ou avaliação (opcional)...',
    submitRating: 'Enviar Avaliação',
    ratingSubmittedThanks: 'Muito obrigado por avaliar nosso atendimento!',
    tableLockedNotice: 'Mesa bloqueada automaticamente após o pagamento.',
    unlockForNewGuests: 'Você é o Garçom? Desbloquear para novos clientes',
    unlockTableModalTitle: 'Desbloqueio de Mesa',
    enterWaiterPin: 'Digite a senha do garçom ou administrador para liberar:',
    cancel: 'Cancelar',
    unlock: 'Desbloquear',
    invalidMozoPin: 'Senha incorreta (Use mozo123 ou senha de admin)',

    tableNotification: 'Notificação da Mesa',
    acceptContinue: 'Aceitar / Continuar',
    chefAcceptedMessage: '👨‍🍳 O Chef aceitou seu pedido! Está sendo preparado agora.',
    orderReadyMessage: '🟢 Seu pedido está PRONTO! O garçom está levando à sua mesa.',
    billRequestedMessage: '🧾 Você solicitou a conta! O garçom está a caminho com a nota.',
    waiterCalledMessage: '🛎️ Garçom chamado à sua mesa! Ele chegará em instantes.',
  },
};
