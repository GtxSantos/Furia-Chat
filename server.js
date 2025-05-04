const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Guardar informações dos usuários
const users = {};
let connectedUsers = 0;

// Dados do jogo simulado
let matchInProgress = false;
let furiaScore = 0;
let opponentScore = 0;
let currentMatch = {
    opponent: 'NAVI',
    map: 'de_inferno',
    tournament: 'BLAST Premier',
    time: '19:00'
};

// Quiz questions
const quizQuestions = [
    {
        question: "Qual jogador da FURIA usa o nickname 'arT'?",
        options: ["Andrei Piovezan", "Kaike Cerato", "Yuri Santos", "Vinicius Figueiredo"],
        correctAnswer: 0
    },
    {
        question: "Em que ano a FURIA foi fundada?",
        options: ["2015", "2016", "2017", "2018"],
        correctAnswer: 2
    },
    {
        question: "Qual foi o primeiro Major que a FURIA participou?",
        options: ["FACEIT Major London 2018", "IEM Katowice 2019", "StarLadder Berlin Major 2019", "PGL Stockholm 2021"],
        correctAnswer: 2
    },
    {
        question: "Quem é o CEO da FURIA?",
        options: ["Jaime Pádua", "André Akkari", "Cris Guedes", "Marcio \"tifa\" Mattos"],
        correctAnswer: 1
    },
    {
        question: "Qual destes jogadores nunca fez parte da lineup principal de CS da FURIA?",
        options: ["KSCERATO", "chelo", "drop", "saffee"],
        correctAnswer: 1
    }
];

// Frases de motivação para o comando /vamoFURIA
const motivationalPhrases = [
    "🔥 Sua energia foi contabilizada! VAMO FURIAAA!",
    "⚡ +1 de energia para o time! Continue apoiando!",
    "💪 O time está sentindo sua torcida! VAMO FURIA!",
    "🚀 Sua voz foi ouvida! FURIA TÁ ON!",
    "🦅 Energia registrada! FURIA não para!"
];

// Ranking dos torcedores
const fanRanks = {
    0: "Iniciante",
    50: "Torcedor Bronze",
    150: "Torcedor Prata",
    300: "Torcedor Ouro", 
    500: "Fanático",
    1000: "Lenda FURIA"
};

// Conexões Socket.io
io.on('connection', (socket) => {
    // Registra novo usuário
    connectedUsers++;
    users[socket.id] = {
        id: socket.id,
        choice: null,
        energy: 0,
        points: 0,
        quizProgress: {
            active: false,
            currentQuestion: 0,
            score: 0
        }
    };
    
    console.log(`⚡ Um fã conectou! Total: ${connectedUsers}`);
    
    // Informa todos sobre o novo usuário
    io.emit('user joined', connectedUsers);
    
    // Quando conecta, manda a mensagem inicial
    socket.emit('chat message', 'Bem-vindo ao FURIA Chat! ⚡ Você quer:\n\n1️⃣ Acompanhar o jogo ao vivo\n2️⃣ Participar da torcida\n3️⃣ Ver bastidores\n4️⃣ Jogar quiz\n\nDigite o número da opção ou clique em um botão abaixo!');

    // Recebe mensagens do usuário
    socket.on('chat message', (msg) => {
        console.log(`Mensagem de ${socket.id}: ${msg}`);
        
        // Primeira escolha - menu principal
        if (!users[socket.id].choice) {
            handleMainMenuChoice(socket, msg);
        } 
        // Já fez escolha inicial, processa comandos e interações
        else {
            handleUserInteraction(socket, msg);
        }
    });

    // Quando usuário desconecta
    socket.on('disconnect', () => {
        console.log(`❌ Um fã saiu. ID: ${socket.id}`);
        delete users[socket.id];
        connectedUsers--;
        io.emit('user left', connectedUsers);
    });
});

// Trata a escolha do menu principal
function handleMainMenuChoice(socket, msg) {
    // Verifica se msg é uma string
    if (typeof msg !== 'string') {
        socket.emit('chat message', '❌ Entrada inválida. Por favor, envie uma mensagem de texto.');
        return;
    }

    // Verifica se é uma escolha válida
    if (msg === '1' || msg === '1️⃣' || msg.toLowerCase() === 'acompanhar o jogo') {
        users[socket.id].choice = 'jogo';
        socket.emit('chat message', '🎯 Você escolheu acompanhar o jogo!\n\nVou te manter atualizado com as informações da partida. Se ela ainda não começou, você receberá um aviso quando iniciar.\n\nVocê também pode usar os seguintes comandos:\n/mvp - Para votar no MVP\n/stats - Para ver estatísticas do jogo');
        
        // Se tiver um jogo em andamento, inicia simulação para este usuário
        if (matchInProgress) {
            socket.emit('match update', {
                type: 'score',
                furiaScore: furiaScore,
                opponentScore: opponentScore
            });
            socket.emit('chat message', `🏁 Partida JÁ EM ANDAMENTO! FURIA ${furiaScore} x ${opponentScore} ${currentMatch.opponent}`);
        } else {
            socket.emit('chat message', `⏱️ Próximo jogo: FURIA vs ${currentMatch.opponent} às ${currentMatch.time} - ${currentMatch.tournament}`);
        }
    } 
    else if (msg === '2' || msg === '2️⃣' || msg.toLowerCase() === 'participar da torcida') {
        users[socket.id].choice = 'torcida';
        socket.emit('chat message', '🎉 Você escolheu participar da torcida!\n\nMande mensagens de apoio e use /vamoFURIA para energizar o time. Quanto mais energia você enviar, mais alto você subirá no ranking de torcedores!\n\nOutros comandos:\n/rank - Veja seu ranking atual\n/energia - Veja quanta energia você já enviou');
    } 
    else if (msg === '3' || msg === '3️⃣' || msg.toLowerCase() === 'ver bastidores') {
        users[socket.id].choice = 'bastidores';
        socket.emit('chat message', '📸 Você escolheu ver bastidores exclusivos!\n\nVou te enviar conteúdos exclusivos dos bastidores da FURIA!\n\nUse /novidades para solicitar mais conteúdo.');
        
        // Envia o primeiro conteúdo de bastidores
        setTimeout(() => {
            socket.emit('chat message', '📹 BASTIDORES: O time fazendo um treino tático especial para o próximo confronto!');
        }, 2000);
        
        setTimeout(() => {
            socket.emit('chat message', '🏆 BASTIDORES: arT e KSCERATO discutindo novas estratégias para o próximo Major!');
        }, 10000);
    } 
    else if (msg === '4' || msg === '4️⃣' || msg.toLowerCase() === 'jogar quiz') {
        users[socket.id].choice = 'quiz';
        socket.emit('chat message', '🧠 Você escolheu jogar o Quiz FURIA!\n\nVamos testar seus conhecimentos sobre o time. Responda corretamente para ganhar pontos e subir no ranking!\n\nDigite /start para começar o quiz!');
    } 
    else {
        socket.emit('chat message', '❓ Opção não reconhecida. Por favor, escolha uma das opções abaixo:\n\n1️⃣ Acompanhar o jogo ao vivo\n2️⃣ Participar da torcida\n3️⃣ Ver bastidores\n4️⃣ Jogar quiz');
    }
}
// Gerencia interações do usuário após a escolha inicial
function handleUserInteraction(socket, msg) {
    const userChoice = users[socket.id].choice;
    
    // Comandos globais disponíveis em qualquer modo
    if (msg.toLowerCase() === '/help' || msg.toLowerCase() === '/ajuda') {
        sendHelpMessage(socket);
        return;
    }
    else if (msg.toLowerCase() === '/menu') {
        users[socket.id].choice = null;
        socket.emit('chat message', 'Voltando ao menu principal. Escolha uma opção:\n\n1️⃣ Acompanhar o jogo ao vivo\n2️⃣ Participar da torcida\n3️⃣ Ver bastidores\n4️⃣ Jogar quiz');
        return;
    }
    
    // Comandos específicos para cada escolha
    switch (userChoice) {
        case 'jogo':
            handleGameMode(socket, msg);
            break;
            
        case 'torcida':
            handleCrowdMode(socket, msg);
            break;
            
        case 'bastidores':
            handleBackstageMode(socket, msg);
            break;
            
        case 'quiz':
            handleQuizMode(socket, msg);
            break;
    }
}

// Modo de acompanhamento de jogo
function handleGameMode(socket, msg) {
    if (msg.toLowerCase() === '/stats' || msg.toLowerCase() === '/estatisticas') {
        // Gera estatísticas aleatórias para simulação
        const stats = generateRandomStats();
        socket.emit('chat message', stats);
    }
    else if (msg.toLowerCase() === '/mvp') {
        socket.emit('chat message', '🏆 VOTAÇÃO DE MVP:\nDigite o número do jogador que você acha que merece ser o MVP:\n\n1) arT\n2) KSCERATO\n3) yuurih\n4) saffee\n5) drop');
    }
    // Votos de MVP
    else if (msg === '1' || msg === '2' || msg === '3' || msg === '4' || msg === '5') {
        const players = ["arT", "KSCERATO", "yuurih", "saffee", "drop"];
        const playerVoted = players[parseInt(msg) - 1];
        socket.emit('chat message', `✅ Você votou em ${playerVoted} como MVP! Obrigado pelo seu voto.`);
        
        // Adiciona pontos para engajamento
        users[socket.id].points += 5;
    }
    else if (msg.toLowerCase() === '/start' && !matchInProgress) {
        socket.emit('chat message', '🔄 Você deseja simular uma partida? Digite /simular para iniciar uma partida simulada!');
    }
    else if (msg.toLowerCase() === '/simular') {
        socket.emit('chat message', '🏁 Iniciando simulação de partida FURIA vs NAVI!');
        // Aciona o cliente para iniciar a simulação de jogo
        socket.emit('match update', {
            type: 'score',
            furiaScore: 0,
            opponentScore: 0
        });
        matchInProgress = true;
    }
    else {
        // Mensagens normais no modo jogo
        socket.emit('chat message', 'Para interagir com o modo jogo, use os comandos:\n/stats - Ver estatísticas\n/mvp - Votar no MVP\n/simular - Simular uma partida');
    }
}

// Modo torcida
function handleCrowdMode(socket, msg) {
    if (msg.toLowerCase() === '/vamofuria') {
        users[socket.id].energy += 1;
        users[socket.id].points += 10;
        
        // Escolhe uma frase aleatória de motivação
        const phrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];
        socket.emit('chat message', phrase);
        
        // Informa a todos que alguém enviou energia (para sensação de comunidade)
        socket.broadcast.emit('chat message', '⚡ Um torcedor enviou energia para o time!');
    }
    else if (msg.toLowerCase() === '/rank') {
        const rank = calculateUserRank(users[socket.id].points);
        socket.emit('chat message', `🏆 SEU RANKING: ${rank}\n📊 Pontos: ${users[socket.id].points}\n⚡ Energia enviada: ${users[socket.id].energy}\n\nContinue interagindo para subir de nível!`);
    }
    else if (msg.toLowerCase() === '/energia') {
        socket.emit('chat message', `⚡ Você já enviou ${users[socket.id].energy} unidades de energia para o time!`);
    }
    else {
        // Mensagens de torcida normais
        // Adiciona pontos para qualquer interação
        users[socket.id].points += 1;
    }
}

// Modo bastidores
function handleBackstageMode(socket, msg) {
    if (msg.toLowerCase() === '/novidades') {
        // Escolhe um conteúdo aleatório de bastidores
        const backstageContent = [
            "🎮 Os jogadores estão testando um novo setup para os próximos jogos!",
            "🍽️ O chef da FURIA preparou uma refeição especial antes do grande jogo!",
            "💪 arT iniciou um novo regime de treinamento físico!",
            "🎯 KSCERATO bateu seu recorde pessoal no treino de hoje!",
            "🧠 O coach guerri está desenvolvendo novas estratégias para surpreender os adversários!"
        ];
        const content = backstageContent[Math.floor(Math.random() * backstageContent.length)];
        socket.emit('chat message', `📸 BASTIDORES EXCLUSIVOS: ${content}`);
        
        // Adiciona pontos para engajamento
        users[socket.id].points += 5;
    }
    else if (msg.toLowerCase() === '/entrevista') {
        socket.emit('chat message', '🎤 ENTREVISTA EXCLUSIVA:\n\n"Estamos muito focados nesse próximo torneio. O time está com uma sinergia incrível e vamos dar o nosso melhor." - arT, capitão da FURIA');
        
        // Adiciona pontos para engajamento
        users[socket.id].points += 3;
    }
    else {
        socket.emit('chat message', 'Para ver mais conteúdo exclusivo, use os comandos:\n/novidades - Ver bastidores recentes\n/entrevista - Ver entrevista com jogadores');
    }
}
function handleQuizMode(socket, msg) {
    const user = users[socket.id];

    if (msg.toLowerCase() === '/start') {
        if (user.quizProgress.active) {
            socket.emit('chat message', '❗ Você já está em um quiz! Responda as perguntas antes de iniciar outro.');
            return;
        }

        user.quizProgress = {
            active: true,
            currentQuestion: 0,
            score: 0
        };

        socket.emit('clear quiz');
        sendQuizQuestion(socket, 0);
        return;
    }

    if (user.quizProgress.active) {
        const questionIndex = user.quizProgress.currentQuestion;

        if (!quizQuestions[questionIndex]) {
            socket.emit('chat message', '❗ Erro: questão não encontrada.');
            user.quizProgress.active = false;
            return;
        }

        if (['1', '2', '3', '4'].includes(msg)) {
            const answer = parseInt(msg) - 1;
            const correct = quizQuestions[questionIndex].correctAnswer;

            if (answer === correct) {
                user.quizProgress.score++;
                socket.emit('chat message', `✅ CORRETO! +1 ponto! Sua pontuação: ${user.quizProgress.score}/${questionIndex + 1}`);
            } else {
                socket.emit('chat message', `❌ INCORRETO! Resposta correta: ${quizQuestions[questionIndex].options[correct]}`);
            }

            user.quizProgress.currentQuestion++;

            if (user.quizProgress.currentQuestion < quizQuestions.length) {
                setTimeout(() => {
                    sendQuizQuestion(socket, user.quizProgress.currentQuestion);
                }, 1000);
            } else {
                socket.emit('chat message', `🏁 Quiz finalizado! Você acertou ${user.quizProgress.score} de ${quizQuestions.length} perguntas.`);
                user.points += user.quizProgress.score * 5;
                user.quizProgress.active = false;
            }
        } else {
            socket.emit('chat message', '❓ Por favor, responda com um número de 1 a 4.');
        }
    }
}


function sendQuizQuestion(socket, index) {
    const question = quizQuestions[index];
    if (question) {
        socket.emit('chat message', `🧠 Pergunta ${index + 1}: ${question.question}\n\n1️⃣ ${question.options[0]}\n2️⃣ ${question.options[1]}\n3️⃣ ${question.options[2]}\n4️⃣ ${question.options[3]}`);
    }
}


// Gera estatísticas aleatórias (simulação)
function generateRandomStats() {
    const players = ["arT", "KSCERATO", "yuurih", "saffee", "drop"];
    let statsText = "📊 ESTATÍSTICAS ATUAIS:\n\n";
    
    players.forEach(player => {
        const kills = Math.floor(Math.random() * 30) + 5;
        const deaths = Math.floor(Math.random() * 20) + 5;
        const adr = Math.floor(Math.random() * 110) + 50;
        statsText += `${player}: ${kills}K / ${deaths}D - ADR: ${adr}\n`;
    });
    
    const mapPool = ["Inferno", "Mirage", "Ancient", "Nuke", "Vertigo", "Overpass", "Anubis"];
    const currentMap = mapPool[Math.floor(Math.random() * mapPool.length)];
    
    statsText += `\nMapa: ${currentMap}\nRounds T: ${furiaScore > 10 ? furiaScore - 10 : furiaScore}\nRounds CT: ${furiaScore > 10 ? 10 : 0}`;
    
    return statsText;
}

// Calcula o ranking do usuário com base nos pontos
function calculateUserRank(points) {
    let highestRank = "Iniciante";
    
    for (const [threshold, rank] of Object.entries(fanRanks)) {
        if (points >= parseInt(threshold) && parseInt(threshold) > 0) {
            highestRank = rank;
        }
    }
    
    return highestRank;
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

// Envia mensagem de ajuda
function sendHelpMessage(socket) {
    const helpMessage = `📢 COMANDOS DISPONÍVEIS:

GERAIS:
/help - Ver esta mensagem de ajuda
/menu - Voltar ao menu principal

MODO JOGO:
/stats - Ver estatísticas do jogo
/mvp - Votar no MVP
/simular - Simular uma partida

MODO TORCIDA:
/vamoFURIA - Enviar energia ao time
/rank - Ver seu ranking atual
/energia - Ver energia total enviada

MODO BASTIDORES:
/novidades - Ver conteúdo exclusivo
/entrevista - Ver entrevistas com jogadores

MODO QUIZ:
/start - Iniciar o quiz
`;

    socket.emit('chat message', helpMessage);
}

// Simular fim de jogo e mandar resumo para todos
function enviarResumoFinal() {
    io.emit('chat message', '🏆 FIM DE JOGO!\n\nMVP: KSCERATO\nDestaques: arT, yuurih\nRanking atualizado dos fãs! 🚀');
    
    // Reseta o estado do jogo
    matchInProgress = false;
    furiaScore = 0;
    opponentScore = 0;
}

// Inicia o servidor
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`⚡ Servidor FURIA Chat rodando na porta ${PORT}`);
});