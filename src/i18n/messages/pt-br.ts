const ptBr = {
  common: {
    appName: "Discord Bots Hub",
    tagline: "Centralize bots e encaminhe eventos para webhooks.",
    nav: {
      bots: "Bots",
    },
    actions: {
      signOut: "Sair",
      loginSubmit: "Entrar",
      loginSubmitting: "Entrando...",
      loadDiscordData: "Carregar dados do Discord",
      loadingDiscordData: "Carregando...",
      createBot: "Criar bot",
      creatingBot: "Salvando...",
      updateBot: "Atualizar bot",
      updatingBot: "Atualizando...",
      editBot: "Editar",
      cancel: "Cancelar",
      start: "Iniciar",
      stop: "Parar",
      restart: "Reiniciar",
      startAll: "Iniciar todos os bots",
      stopAll: "Parar todos os bots",
      refresh: "Atualizar",
      removeAvatar: "Remover avatar",
      delete: "Remover",
      deleting: "Removendo...",
      confirmDelete: "Tem certeza que deseja remover este bot?",
    },
    statuses: {
      authenticated: "Autenticado",
      noneSelected: "Nenhum selecionado",
    },
    labels: {
      username: "Usuário",
      password: "Senha",
      webhookTarget: "Webhook de destino",
      relayEndpoint: "Endpoint de relay",
      guild: "Servidor",
      noAvatar: "Sem avatar",
    },
    placeholders: {
      username: "admin",
      password: "••••••••",
    },
    messages: {
      avatarSuccess: "Avatar enviado com sucesso.",
      avatarError: "Falha ao enviar o avatar",
    },
    languages: {
      en: "Inglês",
      es: "Espanhol",
      "pt-br": "Português (Brasil)",
    },
  },
  login: {
    heroTagline: "Gestão de bots do Discord",
    heroTitle: "Painel de acesso",
    heroDescription:
      "Use as credenciais configuradas nas variáveis de ambiente.",
    helpPrompt: "Precisa de ajuda? Leia a",
    helpLinkText: "documentação de desenvolvedores do Discord",
    fields: {
      username: "Usuário",
      password: "Senha",
    },
    errors: {
      invalidPayload: "Dados de credenciais inválidos",
      invalidCredentials: "Usuário ou senha incorretos",
    },
  },
  bots: {
    heroTitle: "Gerencie bots do Discord",
    heroDescription:
      "Cadastre bots, mapeie recursos do Discord e encaminhe interações para plataformas de automação como o n8n.",
    guideTitle: "Guia rápido",
    guideSteps: [
      "Abra o Portal de Desenvolvedores do Discord, crie ou selecione a aplicação e copie o token do bot.",
      "Ative os intents necessários (veja detalhes abaixo) e convide o bot para o servidor desejado (veja instruções abaixo).",
      "Copie o ID do servidor no Discord (modo desenvolvedor) e cole no campo ID do servidor.",
      "Cole o token do bot e defina a URL do webhook de destino.",
      "Configure o Discord para enviar interações ao endpoint de relay exibido abaixo.",
    ],
    intentsTitle: "Ativando Intents do Discord",
    intentsDescription:
      "No Portal de Desenvolvedores do Discord, navegue até sua aplicação → Bot → Privileged Gateway Intents. Ative os seguintes intents conforme sua necessidade:",
    intentsList: [
      "MESSAGE CONTENT INTENT: Necessário para ler o conteúdo de mensagens em canais.",
      "SERVER MEMBERS INTENT: Necessário para listar membros do servidor e suas informações.",
      "GUILD MEMBERS INTENT: Necessário para acessar listas de membros e dados de usuários.",
    ],
    intentsNote:
      "Nota: Alguns intents exigem verificação se seu bot estiver em 100+ servidores. Ative apenas o que precisar.",
    inviteTitle: "Convidando o Bot para seu Servidor",
    inviteDescription:
      "Para adicionar seu bot a um servidor do Discord, use o Gerador de URL OAuth2:",
    inviteSteps: [
      "No Portal de Desenvolvedores, vá em OAuth2 → URL Generator.",
      "Selecione o escopo 'bot' em SCOPES.",
      "Em BOT PERMISSIONS, selecione as permissões que seu bot precisa (ex: Ler Mensagens, Enviar Mensagens, Ler Histórico de Mensagens).",
      "Copie a URL gerada na parte inferior da página.",
      "Abra a URL no navegador e selecione o servidor onde deseja adicionar o bot.",
      "Autorize o bot. Ele aparecerá na lista de membros do seu servidor.",
    ],
    relayTitle: "Endpoint de relay",
    relayDescription:
      "Configure webhooks ou comandos de aplicação do Discord para enviar requisições POST ao endpoint de relay. O sistema encaminha a requisição para o webhook definido por bot.",
    registeredTitle: "Bots cadastrados",
    registeredDescription:
      "Mantenha os tokens seguros. Eles são criptografados em repouso, mas devem ser rotacionados quando necessário.",
    emptyState: "Nenhum bot cadastrado ainda. Adicione um pelo formulário acima.",
    editingBot: "Editando bot",
    card: {
      guild: "Servidor",
      interactionOriginBadge: "Origem da interação",
      applicationId: "ID da aplicação",
      authorizationUrl: "URL de autorização",
    },
  },
  botForm: {
    fields: {
      name: "Nome do bot",
      avatar: "Imagem do avatar",
      description: "Descrição",
      origin: "Origem da interação",
      webhook: "URL do webhook",
      token: "Token do bot",
      guildId: "ID do servidor",
      applicationId: "ID da aplicação (Client ID)",
    },
    placeholders: {
      name: "Assistente de suporte",
      description: "Breve descrição sobre o objetivo do bot",
      webhook: "https://sua-instancia-n8n/webhook/...",
      guildId: "123456789012345678",
      token: "Cole o token do bot do Discord",
      applicationId: "123456789012345678",
    },
    options: {
      origins: {
        "discord-channel": "Canal do Discord",
        "discord-user": "Mensagem direta",
        hybrid: "Híbrido",
      },
    },
    upload: {
      hint: "Envie uma imagem quadrada (PNG, JPG, GIF, WebP) de até 5MB. O arquivo fica em /public/uploads.",
      remove: "Remover avatar",
      invalidType: "Apenas arquivos de imagem são permitidos.",
    },
    metadata: {
      encryptionNotice:
        "O token é criptografado com AES-256-GCM antes de ser armazenado.",
    },
    messages: {
      botCreated: "Bot criado com sucesso",
      botCreationError: "Erro ao criar o bot",
      botUpdated: "Bot atualizado com sucesso",
      botUpdateError: "Erro ao atualizar o bot",
    },
    authUrlHint: "URL de autorização",
  },
  commands: {
    title: "Gerenciar Comandos",
    description: "Crie e gerencie comandos slash do Discord para este bot.",
    listTitle: "Lista de Comandos",
    listDescription: "Gerencie os comandos do bot e registre-os no Discord.",
    newCommand: "Novo Comando",
    editCommand: "Editar Comando",
    createCommand: "Criar Comando",
    updateCommand: "Atualizar Comando",
    registerCommands: "Registrar no Discord",
    registering: "Registrando...",
    registered: "Registrado",
    noCommands: "Nenhum comando cadastrado. Crie um comando usando o formulário acima.",
    commandsCount: "comando cadastrado",
    commandsCountPlural: "comandos cadastrados",
    fields: {
      name: "Nome do comando",
      description: "Descrição",
      type: "Tipo",
      options: "Opções (parâmetros)",
    },
    placeholders: {
      name: "exemplo",
      description: "Descrição do comando",
    },
    types: {
      chatInput: "Chat Input (Slash Command)",
      user: "User Command",
      message: "Message Command",
    },
    optionTypes: {
      subCommand: "Sub Command",
      subCommandGroup: "Sub Command Group",
      string: "String",
      integer: "Integer",
      boolean: "Boolean",
      user: "User",
      channel: "Channel",
      role: "Role",
      mentionable: "Mentionable",
      number: "Number",
      attachment: "Attachment",
    },
    messages: {
      commandCreated: "Comando criado com sucesso",
      commandUpdated: "Comando atualizado com sucesso",
      commandDeleted: "Comando removido com sucesso",
      commandsRegistered: "comandos registrados com sucesso no Discord",
      registerError: "Erro ao registrar comandos",
      deleteConfirm: "Tem certeza que deseja remover este comando?",
      loading: "Carregando comandos...",
      loadingCommand: "Carregando comando...",
    },
  },
};

export default ptBr;


