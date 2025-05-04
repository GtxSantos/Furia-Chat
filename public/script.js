// Configuração inicial para comunicação socket
const socket = io();

// Estado da aplicação
const state = {
  user: {
    id: generateUserId(),
    username: localStorage.getItem('furiaUsername') || null,
    points: parseInt(localStorage.getItem('furiaPoints') || '0'),
    rank: localStorage.getItem('furiaRank') || 'Novato',
    badges: JSON.parse(localStorage.getItem('furiaBadges') || '[]')
  },
  match: {
    active: false,
    currentRound: 0,
    totalRounds: 30,
    furiaScore: 0,
    opponentScore: 0,
    currentOpponent: null,
    map: null,
    timeRemaining: null,
    players: {
      furia: ["arT", "KSCERATO", "yuurih", "saffee", "drop"],
      opponent: []
    }
  },
  chat: {
    messagesLimit: 100
  },
  quiz: {
    active: false,
    currentIndex: 0,
    userScore: 0,
    answered: []
  },
  stream: {
    quality: localStorage.getItem('furiaStreamQuality') || 'auto',
    volume: parseInt(localStorage.getItem('furiaStreamVolume') || '70')
  },
  fans: {
    online: 0,
    recentlyJoined: []
  }
};

// Constantes da aplicação
const RANKS = [
  { name: "Novato", minPoints: 0 },
  { name: "Torcedor Bronze", minPoints: 100 },
  { name: "Torcedor Prata", minPoints: 250 },
  { name: "Torcedor Ouro", minPoints: 500 },
  { name: "Fanático", minPoints: 1000 },
  { name: "Lenda FURIA", minPoints: 2500 }
];

const UPCOMING_MATCHES = [
  { opponent: "Liquid", time: "2025-05-06T21:30:00", tournament: "ESL Pro League" },
  { opponent: "NAVI", time: "2025-05-10T15:00:00", tournament: "IEM Dallas" },
  { opponent: "G2", time: "2025-05-12T18:45:00", tournament: "BLAST Premier" }
];

// Quiz perguntas - expandido com mais perguntas
const QUIZ_QUESTIONS = [
  {
    question: "Qual jogador da FURIA usa o nickname 'arT'?",
    options: ["Andrei Piovezan", "Kaike Cerato", "Yuri Santos", "Vinicius Figueiredo"],
    correctAnswer: 1,
    difficulty: "fácil"
  },
  {
    question: "Em que ano a FURIA foi fundada?",
    options: ["2015", "2016", "2017", "2018"],
    correctAnswer: 2,
    difficulty: "médio"
  },
  {
    question: "Qual foi o primeiro Major que a FURIA participou?",
    options: ["FACEIT Major London 2018", "IEM Katowice 2019", "StarLadder Berlin Major 2019", "PGL Stockholm 2021"],
    correctAnswer: 2,
    difficulty: "médio"
  },
  {
    question: "Quem é o CEO da FURIA?",
    options: ["Jaime Pádua", "André Akkari", "Cris Guedes", "Marcio 'tifa' Mattos"],
    correctAnswer: 1,
    difficulty: "fácil"
  },
  {
    question: "Qual destes jogadores nunca fez parte da lineup principal de CS da FURIA?",
    options: ["KSCERATO", "chelo", "drop", "saffee"],
    correctAnswer: 1,
    difficulty: "médio"
  },
  {
    question: "Qual o melhor resultado da FURIA em um Major de CS:GO?",
    options: ["Campeão", "Vice-campeão", "Semifinal", "Quartas de final"],
    correctAnswer: 3,
    difficulty: "difícil"
  },
  {
    question: "Em qual país nasceu o jogador KSCERATO?",
    options: ["Brasil", "Argentina", "Portugal", "Colômbia"],
    correctAnswer: 1,
    difficulty: "fácil"
  },
  {
    question: "Qual jogador é conhecido como o capitão da equipe de CS da FURIA?",
    options: ["yuurih", "arT", "KSCERATO", "drop"],
    correctAnswer: 1,
    difficulty: "fácil"
  },
  {
    question: "Qual destas organizações NÃO é rival tradicional da FURIA?",
    options: ["MIBR", "paiN Gaming", "INTZ", "Complexity"],
    correctAnswer: 3,
    difficulty: "médio"
  },
  {
    question: "Qual foi o primeiro grande título internacional da FURIA em CS:GO?",
    options: ["BLAST Pro Series", "ESL Pro League", "DreamHack Masters", "ECS Season 7"],
    correctAnswer: 3,
    difficulty: "difícil"
  }
];

// Comandos especiais e seus formatos
const SPECIAL_COMMANDS = {
  "/vamoFURIA": "Envie para dar energia ao time! (+5 pontos)",
  "/rank": "Veja seu ranking atual de fã",
  "/mvp": "Vote no melhor jogador da partida",
  "/help": "Veja todos os comandos disponíveis",
  "/perfil": "Veja seu perfil de torcedor",
  "/top": "Veja o ranking global dos fãs",
  "/quiz": "Inicie um novo quiz para testar seus conhecimentos",
  "/badge": "Veja suas conquistas e emblemas",
  "/bet": "Faça uma aposta no resultado da partida atual"
};

// Emblemas que podem ser conquistados
const BADGES = [
  { id: "quiz_master", name: "Mestre do Quiz", description: "Acerte 100% em um quiz", icon: "🧠" },
  { id: "super_fan", name: "Super Fã", description: "Acumule 1000 pontos", icon: "⭐" },
  { id: "match_predictor", name: "Vidente", description: "Acerte 5 previsões de partidas", icon: "🔮" },
  { id: "early_supporter", name: "Fã da Primeira Hora", description: "Participe de 10 partidas ao vivo", icon: "🏆" },
  { id: "chat_active", name: "Comunicador", description: "Envie 50 mensagens no chat", icon: "💬" }
];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

// Função para inicializar o aplicativo
function initializeApp() {
  // Configura o contador de fãs online
  initializeFanCounter();
  
  // Configura o nome de usuário
  checkUsername();
  
  // Inicializa placar
  updateScoreboard();
  
  // Configura listeners de eventos
  setupEventListeners();
  
  // Verifica próxima partida
  updateNextMatch();
  
  // Exibe mensagem de boas-vindas
  showWelcomeMessage();
  
  // Verifica promoção de ranking
  checkRankPromotion();
  
  // Carrega histórico de mensagens (simulado)
  loadChatHistory();
}

// Verifica e atualizações de nome de usuário
function checkUsername() {
  if (!state.user.username) {
    setTimeout(() => {
      const username = prompt("Bem-vindo ao Chat da FURIA! Como podemos te chamar?", "Torcedor" + Math.floor(Math.random() * 1000));
      if (username && username.trim()) {
        state.user.username = username.trim();
        localStorage.setItem('furiaUsername', state.user.username);
        addMessage(`✅ Bem-vindo, ${state.user.username}! Você ganhou +10 pontos por definir seu nome.`, 'system-message');
        addPoints(10, "Definiu nome de usuário");
      }
    }, 1000);
  }
}

// Inicializa contador de fãs
function initializeFanCounter() {
  const minFans = 150;
  const maxFans = 450;
  state.fans.online = Math.floor(Math.random() * (maxFans - minFans + 1)) + minFans;
  document.getElementById('online-count').textContent = state.fans.online;
  
  // Simula flutuações no número de fãs
  setInterval(() => {
    const change = Math.floor(Math.random() * 5) - 2; // -2 a +2
    state.fans.online = Math.max(minFans, state.fans.online + change);
    document.getElementById('online-count').textContent = state.fans.online;
  }, 30000);
}

// Adiciona event listeners
function setupEventListeners() {
  // Form de envio de mensagem
  document.getElementById('form').addEventListener('submit', handleMessageSubmit);
  
  // Botões de opção
  document.querySelectorAll('.option-button').forEach(button => {
    button.addEventListener('click', handleOptionClick);
  });
  
  // Socket events
  socket.on('chat message', handleIncomingMessage);
  socket.on('match update', handleMatchUpdate);
  socket.on('fan joined', handleFanJoined);
  
  // Botões de volume
  if (document.getElementById('volume-up')) {
    document.getElementById('volume-up').addEventListener('click', () => adjustVolume(10));
  }
  
  if (document.getElementById('volume-down')) {
    document.getElementById('volume-down').addEventListener('click', () => adjustVolume(-10));
  }
}

// Handler para envio de mensagens
function handleMessageSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('input');
  const msg = input.value.trim();
  
  if (msg !== '') {
    // Adiciona a mensagem do usuário com estilo diferente
    addMessage(`${state.user.username || 'Você'}: ${msg}`, 'user-message');
    
    // Processa comandos especiais no cliente
    if (msg.startsWith('/')) {
      processSpecialCommand(msg);
    } else {
      // Detecta palavras-chave para dar pontos
      if (detectKeywords(msg)) {
        addPoints(2, "Mensagem com palavras-chave");
      }
      
      // Envia a mensagem para o servidor
      socket.emit('chat message', {
        text: msg,
        username: state.user.username || 'Anônimo',
        userId: state.user.id
      });
      
      // Verifica conquista de comunicador
      checkChatBadge();
    }
    
    // Limpa o input
    input.value = '';
  }
  
  scrollToBottom();
}

// Detecta palavras-chave
function detectKeywords(msg) {
  const keywords = ['furia', 'kscerato', 'art', 'yuurih', 'saffee', 'drop', 'vamo', 'brasil'];
  const lowercaseMsg = msg.toLowerCase();
  
  return keywords.some(keyword => lowercaseMsg.includes(keyword));
}

// Verifica emblema de comunicador
function checkChatBadge() {
  // Simula contador de mensagens
  const messageCount = parseInt(localStorage.getItem('furiaChatCount') || '0') + 1;
  localStorage.setItem('furiaChatCount', messageCount.toString());
  
  if (messageCount >= 50 && !state.user.badges.includes('chat_active')) {
    state.user.badges.push('chat_active');
    localStorage.setItem('furiaBadges', JSON.stringify(state.user.badges));
    
    const badge = BADGES.find(b => b.id === 'chat_active');
    addMessage(`🎖️ CONQUISTA DESBLOQUEADA: ${badge.icon} ${badge.name} - ${badge.description}`, 'badge-message');
  }
}

// Handler para mensagens recebidas do servidor
function handleIncomingMessage(msg) {
  // Se for um objeto, extrair o texto
  const messageText = typeof msg === 'object' ? msg.text : msg;
  const username = typeof msg === 'object' && msg.username ? msg.username : null;
  
  let className = 'system-message';
  if (username && username !== 'Sistema') {
    className = 'other-message';
  }
  
  addMessage(username ? `${username}: ${messageText}` : messageText, className);
  scrollToBottom();
  
  // Se for uma mensagem de quiz
  if (messageText.includes('QUIZ PERGUNTA') && messageText.includes('1)') && messageText.includes('2)')) {
    state.quiz.active = true;
  }
}

// Handler para updates de partida
function handleMatchUpdate(data) {
  if (data.type === 'score') {
    state.match.furiaScore = data.furiaScore;
    state.match.opponentScore = data.opponentScore;
    updateScoreboard();
  } else if (data.type === 'round') {
    state.match.currentRound = data.round;
    addMessage(`🔄 Round ${data.round}: ${data.message}`, 'match-message');
  } else if (data.type === 'match_end') {
    handleMatchEnd(data);
  }
}

// Handler para novos fãs
function handleFanJoined(data) {
  state.fans.recentlyJoined.push(data.username);
  if (state.fans.recentlyJoined.length > 5) {
    state.fans.recentlyJoined.shift();
  }
  
  // Atualiza contador
  state.fans.online++;
  document.getElementById('online-count').textContent = state.fans.online;
  
  // Exibe mensagem ocasionalmente
  if (Math.random() > 0.7) {
    addMessage(`👋 ${data.username} entrou no chat!`, 'join-message');
  }
}

// Handler para clique em opção
function handleOptionClick(e) {
  const option = this.getAttribute('data-option');
  let optionMessage = '';
  
  if (option === '1') optionMessage = 'acompanhar o jogo';
  else if (option === '2') optionMessage = 'participar da torcida';
  else if (option === '3') optionMessage = 'ver bastidores';
  else if (option === '4') optionMessage = 'jogar quiz';
  
  document.getElementById('input').value = optionMessage;
  document.querySelector('form button').click();
  
  // Se for a opção quiz, inicia um quiz
  if (option === '4') {
    startQuiz();
  } else if (option === '2') {
    // Simula juntar-se à torcida
    addMessage(`🔥 Você se juntou à torcida da FURIA! +5 pontos`, 'system-message');
    addPoints(5, "Juntou-se à torcida");
  } else if (option === '3') {
    // Simula acesso a bastidores
    showBehindTheScenes();
  }
}

// Processa comandos especiais
function processSpecialCommand(msg) {
  const command = msg.toLowerCase().split(' ')[0];
  
  switch (command) {
    case '/vamofuria':
      handleVamoFuria();
      break;
    case '/help':
      showHelp();
      break;
    case '/rank':
      showRank();
      break;
    case '/mvp':
      showMvpVoting();
      break;
    case '/perfil':
      showProfile();
      break;
    case '/top':
      showTopFans();
      break;
    case '/quiz':
      startQuiz();
      break;
    case '/badge':
      showBadges();
      break;
    case '/bet':
      handleBet();
      break;
    default:
      addMessage(`❓ Comando desconhecido. Digite /help para ver os comandos disponíveis.`, 'system-message');
  }
}

// Função para o comando /vamofuria
function handleVamoFuria() {
  // Ativa efeito visual de energia
  const energyBurst = document.getElementById('energy-burst');
  energyBurst.style.display = 'block';
  
  // Reseta a animação e depois esconde o elemento
  setTimeout(() => {
    energyBurst.style.display = 'none';
  }, 1000);
  
  // Adiciona pontos
  addPoints(5, "Comando /vamoFURIA");
  
  // Reproduz o rugido
  try {
    const audio = new Audio('roar.mp3');
    audio.volume = state.stream.volume / 100;
    audio.play();
  } catch (e) {
    console.error("Erro ao reproduzir áudio:", e);
  }
  
  // Atualiza a contagem de fãs online para dar sensação de crescimento
  state.fans.online += Math.floor(Math.random() * 5) + 1;
  document.getElementById('online-count').textContent = state.fans.online;
  
  // Mensagem de incentivo
  addMessage(`🔥 VAMO FURIA! Sua energia foi enviada ao time! +5 pontos`, 'highlight-message');
}

// Função para mostrar help
function showHelp() {
  // Exibe lista de comandos
  let helpText = "📢 COMANDOS DISPONÍVEIS:\n";
  for (const [cmd, desc] of Object.entries(SPECIAL_COMMANDS)) {
    helpText += `${cmd} - ${desc}\n`;
  }
  addMessage(helpText, 'system-message');
}

// Função para mostrar rank
function showRank() {
  const currentRank = getCurrentRank();
  const nextRank = getNextRank();
  
  let rankText = `🏆 SEU RANKING: ${currentRank.name}\n`;
  rankText += `📊 Pontos: ${state.user.points}\n`;
  
  if (nextRank) {
    const pointsNeeded = nextRank.minPoints - state.user.points;
    rankText += `🔼 Próximo nível: ${nextRank.name} (faltam ${pointsNeeded} pontos)\n`;
  } else {
    rankText += `👑 Parabéns! Você atingiu o rank máximo!\n`;
  }
  
  rankText += `⚡ Continue interagindo para subir de nível!`;
  
  addMessage(rankText, 'rank-message');
}

// Obtém rank atual
function getCurrentRank() {
  let currentRank = RANKS[0];
  
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (state.user.points >= RANKS[i].minPoints) {
      currentRank = RANKS[i];
      break;
    }
  }
  
  return currentRank;
}

// Obtém próximo rank
function getNextRank() {
  const currentRank = getCurrentRank();
  const currentIndex = RANKS.findIndex(r => r.name === currentRank.name);
  
  if (currentIndex < RANKS.length - 1) {
    return RANKS[currentIndex + 1];
  }
  
  return null;
}

// Função para mostrar votação MVP
function showMvpVoting() {
  if (!state.match.active) {
    addMessage(`❌ Não há partida ativa no momento para votar no MVP.`, 'system-message');
    return;
  }
  
  // Simula votação para MVP
  let mvpText = "🌟 VOTE NO MVP DA PARTIDA:\n";
  state.match.players.furia.forEach((player, index) => {
    mvpText += `${index + 1}) ${player}\n`;
  });
  addMessage(mvpText, 'system-message');
}

// Função para mostrar perfil
function showProfile() {
  const currentRank = getCurrentRank();
  const nextRank = getNextRank();
  
  let profileText = `👤 PERFIL: ${state.user.username || 'Anônimo'}\n`;
  profileText += `🏆 Rank: ${currentRank.name}\n`;
  profileText += `📊 Pontos: ${state.user.points}\n`;
  
  // Emblemas
  if (state.user.badges.length > 0) {
    profileText += `🎖️ Emblemas: `;
    state.user.badges.forEach(badgeId => {
      const badge = BADGES.find(b => b.id === badgeId);
      if (badge) {
        profileText += `${badge.icon} `;
      }
    });
    profileText += `\n`;
  }
  
  // Progresso
  if (nextRank) {
    const progress = Math.floor(((state.user.points - currentRank.minPoints) / (nextRank.minPoints - currentRank.minPoints)) * 100);
    profileText += `📈 Progresso para ${nextRank.name}: ${progress}%\n`;
  }
  
  profileText += `🕒 Membro desde: ${formatDate(getUserJoinDate())}\n`;
  
  addMessage(profileText, 'profile-message');
}

// Função para mostrar top fãs
function showTopFans() {
  // Simulação de top fãs
  const topFans = [
    { username: "FuriaLover123", points: 3500, rank: "Lenda FURIA" },
    { username: state.user.username || "Você", points: state.user.points, rank: getCurrentRank().name },
    { username: "CSGOmaster", points: 2800, rank: "Lenda FURIA" },
    { username: "BRzada", points: 2200, rank: "Fanático" },
    { username: "ArTfan", points: 1800, rank: "Fanático" }
  ];
  
  // Ordena por pontos
  topFans.sort((a, b) => b.points - a.points);
  
  let message = '🏆 RANKING GLOBAL FURIA:\n';
  topFans.forEach((u, i) => {
    message += `${i + 1}º ${u.username} - ${u.points} pts (${u.rank})\n`;
  });
  
  addMessage(message, 'ranking-message');
}

// Função para mostrar emblemas
function showBadges() {
  if (state.user.badges.length === 0) {
    addMessage(`🎖️ Você ainda não tem emblemas. Continue interagindo para conquistá-los!`, 'system-message');
    return;
  }
  
  let badgesText = `🎖️ SEUS EMBLEMAS:\n`;
  
  state.user.badges.forEach(badgeId => {
    const badge = BADGES.find(b => b.id === badgeId);
    if (badge) {
      badgesText += `${badge.icon} ${badge.name} - ${badge.description}\n`;
    }
  });
  
  badgesText += `\n💪 Continue participando para desbloquear mais emblemas!`;
  
  addMessage(badgesText, 'badge-message');
}

// Função para apostas
function handleBet() {
  if (!state.match.active) {
    addMessage(`❌ Não há partida ativa no momento para apostar.`, 'system-message');
    return;
  }
  
  const betText = `💰 APOSTAR NO RESULTADO:\n`;
  betText += `1) FURIA vence\n`;
  betText += `2) ${state.match.currentOpponent} vence\n`;
  betText += `\nDigite "bet 1" ou "bet 2" seguido do número de pontos (ex: bet 1 50)`;
  
  addMessage(betText, 'system-message');
}

// Inicia um quiz
function startQuiz() {
  // Reseta o estado do quiz
  state.quiz.active = true;
  state.quiz.currentIndex = 0;
  state.quiz.userScore = 0;
  state.quiz.answered = [];
  
  // Embaralha as perguntas e pega 5
  const shuffledQuestions = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random()).slice(0, 5);
  state.quiz.questions = shuffledQuestions;
  
  // Envia primeira pergunta
  sendQuizQuestion(0);
}

// Envia pergunta de quiz
function sendQuizQuestion(index) {
  if (index < state.quiz.questions.length) {
    const q = state.quiz.questions[index];
    let questionText = `🧠 QUIZ PERGUNTA ${index + 1}/${state.quiz.questions.length} (${q.difficulty}):\n\n${q.question}\n\n`;
    q.options.forEach((option, i) => {
      questionText += `${i + 1}) ${option}\n`;
    });
    questionText += "\nDigite o número da resposta (1-4):";
    addMessage(questionText, 'quiz-message');
  }
}

// Processa resposta de quiz
function processQuizAnswer(answerIndex) {
  if (state.quiz.active && state.quiz.currentIndex < state.quiz.questions.length) {
    // Ajusta para índice baseado em zero
    answerIndex = answerIndex - 1;
    
    const currentQuestion = state.quiz.questions[state.quiz.currentIndex];
    let pointsEarned = 10; // Pontos base
    
    // Ajusta pontos pela dificuldade
    if (currentQuestion.difficulty === 'médio') pointsEarned = 15;
    if (currentQuestion.difficulty === 'difícil') pointsEarned = 25;
    
    if (answerIndex === currentQuestion.correctAnswer) {
      state.quiz.userScore++;
      addMessage(`✅ CORRETO! +${pointsEarned} pontos!\nSua pontuação: ${state.quiz.userScore}/${state.quiz.questions.length}`, 'correct-answer');
      addPoints(pointsEarned, "Resposta correta de quiz");
    } else {
      addMessage(`❌ INCORRETO! A resposta certa era: ${currentQuestion.options[currentQuestion.correctAnswer]}\nSua pontuação: ${state.quiz.userScore}/${state.quiz.questions.length}`, 'incorrect-answer');
    }
    
    state.quiz.answered.push({
      question: currentQuestion.question,
      userAnswer: answerIndex,
      correctAnswer: currentQuestion.correctAnswer,
      correct: answerIndex === currentQuestion.correctAnswer
    });
    
    state.quiz.currentIndex++;
    
    // Verifica se há mais perguntas
    if (state.quiz.currentIndex < state.quiz.questions.length) {
      setTimeout(() => {
        sendQuizQuestion(state.quiz.currentIndex);
      }, 1500);
    } else {
      // Quiz finalizado
      setTimeout(() => {
        finishQuiz();
      }, 1500);
    }
  }
}

// Finaliza o quiz e exibe resultados
function finishQuiz() {
  state.quiz.active = false;
  
  const finalMessage = `🏁 QUIZ FINALIZADO!\nSua pontuação final: ${state.quiz.userScore}/${state.quiz.questions.length}\n${getFinalQuizMessage(state.quiz.userScore, state.quiz.questions.length)}`;
  addMessage(finalMessage, 'quiz-result');
  
  // Verifica se o usuário acertou todas as perguntas
  if (state.quiz.userScore === state.quiz.questions.length && !state.user.badges.includes('quiz_master')) {
    state.user.badges.push('quiz_master');
    localStorage.setItem('furiaBadges', JSON.stringify(state.user.badges));
    
    const badge = BADGES.find(b => b.id === 'quiz_master');
    addMessage(`🎖️ CONQUISTA DESBLOQUEADA: ${badge.icon} ${badge.name} - ${badge.description}`, 'badge-message');
  }
  
  // Bônus por completar o quiz
  addPoints(5, "Bônus por completar quiz");
}

// Mensagem final do quiz baseada na pontuação
function getFinalQuizMessage(score, total) {
  const percentage = (score / total) * 100;
  
  if (percentage === 100) {
    return "🏆 INCRÍVEL! Você é um verdadeiro expert na FURIA!";
  } else if (percentage >= 80) {
    return "🔥 ÓTIMO! Você realmente conhece bem o time!";
  } else if (percentage >= 60) {
    return "👍 BOM! Você está no caminho certo para se tornar um fã especialista!";
  } else if (percentage >= 40) {
    return "🙂 RAZOÁVEL! Continue acompanhando o time para aprender mais!";
  } else {
    return "🤔 Continue acompanhando o time! Logo você será um expert!";
  }
}

// Adiciona mensagem ao chat
function addMessage(msg, className = '') {
  const item = document.createElement('li');
  item.textContent = msg;
  item.className = className;
  
  // Adiciona efeito de flash para mensagens importantes
  if (msg.includes('FURIA') && !className.includes('user-message')) {
    item.classList.add('flash-message');
  }
  
  const messages = document.getElementById('messages');
  messages.appendChild(item);
  
  // Limita o número de mensagens para evitar sobrecarga
  while (messages.children.length > state.chat.messagesLimit) {
    messages.removeChild(messages.firstChild);
  }
}

// Função para rolagem automática
function scrollToBottom() {
  const messages = document.getElementById('messages');
  messages.scrollTop = messages.scrollHeight;
}

// Atualiza placar
function updateScoreboard() {
  document.getElementById('score').textContent = `${state.match.furiaScore} - ${state.match.opponentScore}`;
}

// Atualiza informações da próxima partida
function updateNextMatch() {
  const nextMatch = UPCOMING_MATCHES[0];
  const matchDate = new Date(nextMatch.time);
  const formattedTime = matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  document.getElementById('current-match').textContent = `Próximo jogo: FURIA vs ${nextMatch.opponent} - ${formattedTime}`;
}

// Simula atualizações de jogo em tempo real
function startMatchSimulation() {
  if (state.match.active) return;
  
  state.match.active = true;
  state.match.currentOpponent = "NAVI";
  state.match.map = getRandomMap();
  state.match.furiaScore = 0;
  state.match.opponentScore = 0;
  state.match.currentRound = 0;
  
  addMessage(`🏁 PARTIDA INICIADA! FURIA vs ${state.match.currentOpponent} - Mapa: ${state.match.map}`, 'match-start');
  document.getElementById('current-match').textContent = `AO VIVO: FURIA vs ${state.match.currentOpponent} - ${state.match.map}`;
  
  // Simula rounds
  const matchInterval = setInterval(() => {
    state.match.currentRound++;
    
    // Decide quem ganha o round com leve vantagem para FURIA
    const furiaWinsRound = Math.random() > 0.4;
    
    if (furiaWinsRound) {
      state.match.furiaScore++;
      const roundDetails = getRandomRoundDetail(true);
      addMessage(`🔥 Round ${state.match.currentRound}: FURIA vence! [${state.match.furiaScore}-${state.match.opponentScore}] ${roundDetails}`, 'furia-round');
    } else {
      state.match.opponentScore++;
      const roundDetails = getRandomRoundDetail(false);
      addMessage(`😫 Round ${state.match.currentRound}: ${state.match.currentOpponent} vence. [${state.match.furiaScore}-${state.match.opponentScore}] ${roundDetails}`, 'opponent-round');
    }
    
    updateScoreboard();
    
    // Finaliza o jogo se um time chegar a 16 ou se atingir o máximo de rounds
    if (state.match.furiaScore === 16 || state.match.opponentScore === 16 || state.match.currentRound >= state.match.totalRounds) {
      clearInterval(matchInterval);
      handleMatchEnd();
    }
  }, 10000); // 10 segundos entre rounds para simular uma partida real
  
  // Adiciona interações aleatórias durante a partida
  scheduleRandomInteractions();
}

// Finaliza a partida
function handleMatchEnd() {
  const furiaWon = state.match.furiaScore > state.match.opponentScore;
  
  if (furiaWon) {
    addMessage(`🏆 FURIA VENCE! Placar final: ${state.match.furiaScore}-${state.match.opponentScore} 🎉`, 'match-end-win');
    // Bônus de pontos para todos os espectadores
    addPoints(15, "Vitória da FURIA");
  } else {
    addMessage(`😞 FURIA perde. Placar final: ${state.match.furiaScore}-${state.match.opponentScore}`, 'match-end-loss');
    // Pequeno bônus por assistir até o final
    addPoints(5, "Assistiu à partida completa");
  }
  
  // Envia mensagem de MVP e destaques
  setTimeout(() => {
    const mvp = getRandomPlayer();
    const highlights = getRandomHighlights(mvp);
    
    addMessage(`🏆 FIM DE JOGO!\n\nMVP: ${mvp}\nDestaques: ${highlights.join(', ')}\nRanking atualizado dos fãs! 🚀`, 'match-stats');
    
    // Verifica apostas (simulado)
    if (Math.random() > 0.5) {
      addMessage(`💰 Sua aposta foi acertada! +20 pontos`, 'bet-result');
      addPoints(20, "Aposta vencedora");
    }
    
    // Reseta o jogo para a próxima partida
    state.match.active = false;
    updateNextMatch();
  }, 5000);
  
  // Pede feedback sobre a transmissão
  setTimeout(() => {
    addMessage(`📝 O que você achou da transmissão? Digite sua avaliação ou sugestões!`, 'feedback-request');
  }, 8000);
}

// Agenda interações aleatórias durante a partida
function scheduleRandomInteractions() {
  // Simulações de lances importantes
  setTimeout(() => {
    if (state.match.active) {
      const player = getRandomPlayer();
      addMessage(`🎯 WOW! ${player} acaba de fazer uma jogada incrível! Digite /clip para salvar este momento.`, 'highlight-play');
    }
  }, 30000 + Math.random() * 60000);
  
  // Estatísticas interessantes
  setTimeout(() => {
    if (state.match.active) {
      const player = getRandomPlayer();
      const stat = getRandomStat(player);
      addMessage(`📊 ESTATÍSTICA: ${stat}`, 'stat-message');
    }
  }, 45000 + Math.random() * 90000);
  
  // Momento de torcida
  setTimeout(() => {
    if (state.match.active) {
      addMessage(`🔥 MOMENTO DE TORCIDA! Digite /vamoFURIA para energizar o time neste momento crucial!`, 'crowd-moment');
    }
  }, 60000 + Math.random() * 120000);
}

// Exibe bastidores do time
function showBehindTheScenes() {
  const behindScenes = [
    "🎮 Os jogadores estão se aquecendo com aim training antes da partida!",
    "🍽️ A equipe da FURIA segue uma dieta especial durante os torneios para maximizar o desempenho.",
    "🏋️ Treinamento físico é parte da rotina dos jogadores da FURIA para melhorar reflexos e resistência.",
    "📝 O coach está revisando as estratégias finais com o time.",
    "🎧 Os jogadores testam seus equipamentos e ajustam suas configurações pessoais."
  ];
  
  const randomScene = behindScenes[Math.floor(Math.random() * behindScenes.length)];
  addMessage(`👁️ BASTIDORES: ${randomScene}`, 'behind-scenes');
  
  // Adiciona pontos por acessar bastidores
  addPoints(3, "Acesso aos bastidores");
}

// Adiciona pontos ao usuário
function addPoints(points, reason) {
  state.user.points += points;
  localStorage.setItem('furiaPoints', state.user.points.toString());
  
  // Verifica promoção
  checkRankPromotion();
  
  // Verifica emblema de super fã
  if (state.user.points >= 1000 && !state.user.badges.includes('super_fan')) {
    state.user.badges.push('super_fan');
    localStorage.setItem('furiaBadges', JSON.stringify(state.user.badges));
    
    const badge = BADGES.find(b => b.id === 'super_fan');
    addMessage(`🎖️ CONQUISTA DESBLOQUEADA: ${badge.icon} ${badge.name} - ${badge.description}`, 'badge-message');
  }
}

// Verifica promoção de rank
function checkRankPromotion() {
  const currentRank = getCurrentRank();
  
  if (currentRank.name !== state.user.rank) {
    // Usuário subiu de rank
    state.user.rank = currentRank.name;
    localStorage.setItem('furiaRank', state.user.rank);
    
    addMessage(`🏆 PARABÉNS! Você subiu para o rank ${currentRank.name}! Continue interagindo para desbloquear mais vantagens.`, 'rank-up');
  }
}

// Exibe mensagem de boas vindas
function showWelcomeMessage() {
  setTimeout(() => {
    addMessage(`👋 Bem-vindo ao Chat da FURIA Esports!`, 'welcome-message');
    
    if (state.user.username) {
      addMessage(`🔥 Olá ${state.user.username}! É bom ter você de volta! Você tem ${state.user.points} pontos e está no rank ${state.user.rank}.`, 'welcome-message');
    } else {
      addMessage(`💬 Para começar, digite seu nome ou use os botões abaixo para escolher uma opção.`, 'system-message');
    }
    
    addMessage(`📣 Digite /help para ver todos os comandos disponíveis!`, 'system-message');
  }, 500);
}

// Simula carregamento de histórico
function loadChatHistory() {
  const chatHistory = [
    { text: "Bem-vindo ao chat oficial da FURIA!", type: 'system-message' },
    { text: "TorcedorFuria123: Vamos ganhar hoje!", type: 'other-message' },
    { text: "FanáticoCS: /vamoFURIA", type: 'other-message' },
    { text: "CSGOmaster: Quem é o melhor awper do Brasil?", type: 'other-message' },
    { text: "Sistema: A próxima partida da FURIA começa em breve! Fiquem ligados.", type: 'system-message' }
  ];
  
  chatHistory.forEach((msg, index) => {
    setTimeout(() => {
      addMessage(msg.text, msg.type);
      if (index === chatHistory.length - 1) {
        scrollToBottom();
      }
    }, 200 * index);
  });
}

// Ajusta o volume do stream
function adjustVolume(change) {
  state.stream.volume = Math.min(100, Math.max(0, state.stream.volume + change));
  localStorage.setItem('furiaStreamVolume', state.stream.volume.toString());
  
  addMessage(`🔊 Volume do stream: ${state.stream.volume}%`, 'system-message');
}

// Funções utilitárias
function getRandomPlayer() {
  return state.match.players.furia[Math.floor(Math.random() * state.match.players.furia.length)];
}

function getRandomHighlights(exceptPlayer) {
  return state.match.players.furia
    .filter(player => player !== exceptPlayer)
    .sort(() => 0.5 - Math.random())
    .slice(0, 2);
}

function getRandomMap() {
  const maps = ["Mirage", "Inferno", "Nuke", "Ancient", "Vertigo", "Anubis", "Overpass"];
  return maps[Math.floor(Math.random() * maps.length)];
}

function getRandomRoundDetail(furiaSide) {
  const players = state.match.players.furia;
  const player = players[Math.floor(Math.random() * players.length)];
  
  if (furiaSide) {
    const details = [
      `${player} conseguiu um clutch 1v2!`,
      `${player} fez 3 abates nesse round!`,
      `Jogada tática perfeita da FURIA!`,
      `Retake bem executado!`,
      `Ótimo posicionamento da equipe!`
    ];
    return details[Math.floor(Math.random() * details.length)];
  } else {
    const details = [
      `Faltou comunicação nesse round.`,
      `Time adversário com ótimo posicionamento.`,
      `FURIA ficou sem recursos.`,
      `Jogada individual do adversário.`,
      `Timing desfavorável.`
    ];
    return details[Math.floor(Math.random() * details.length)];
  }
}

function getRandomStat(player) {
  const stats = [
    `${player} tem média de 22 abates por mapa neste torneio!`,
    `${player} é o líder em headshots com 68% de taxa!`,
    `A FURIA tem 70% de aproveitamento em pistol rounds!`,
    `${player} já fez 3 aces nesta temporada!`,
    `A FURIA é a equipe com melhor desempenho em clutches (1vX) no torneio!`
  ];
  return stats[Math.floor(Math.random() * stats.length)];
}

function formatDate(date) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getUserJoinDate() {
  // Simula uma data de ingresso
  const joinDateStr = localStorage.getItem('furiaJoinDate');
  
  if (joinDateStr) {
    return new Date(joinDateStr);
  } else {
    // Cria uma data aleatória nos últimos 3 meses
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const randomDate = new Date(threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime()));
    
    localStorage.setItem('furiaJoinDate', randomDate.toISOString());
    return randomDate;
  }
}

function generateUserId() {
  const storedId = localStorage.getItem('furiaUserId');
  if (storedId) return storedId;
  
  const newId = 'user_' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('furiaUserId', newId);
  return newId;
}

// Event listener para processar entradas de quiz e apostas
document.getElementById('input').addEventListener('keyup', function(e) {
  const input = e.target.value.trim();
  
  // Processa respostas de quiz
  if (state.quiz.active && !isNaN(input) && parseInt(input) >= 1 && parseInt(input) <= 4) {
    processQuizAnswer(parseInt(input));
    e.target.value = '';
  }
  
  // Processa apostas
  if (input.startsWith('bet ') && state.match.active) {
    const parts = input.split(' ');
    if (parts.length === 3 && (parts[1] === '1' || parts[1] === '2') && !isNaN(parts[2])) {
      const betChoice = parseInt(parts[1]);
      const betAmount = parseInt(parts[2]);
      
      if (betAmount > 0 && betAmount <= state.user.points) {
        const betTeam = betChoice === 1 ? 'FURIA' : state.match.currentOpponent;
        addMessage(`💰 Aposta registrada: ${betAmount} pontos em ${betTeam}`, 'bet-message');
        
        // Aqui seria necessário armazenar a aposta para verificação posterior
        // Simulação apenas
        e.target.value = '';
      } else {
        addMessage(`❌ Valor de aposta inválido. Você tem ${state.user.points} pontos disponíveis.`, 'system-message');
      }
    }
  }
});

// Inicializa o aplicativo quando o documento estiver pronto