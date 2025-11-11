const es = {
  common: {
    appName: "Discord Bots Hub",
    tagline: "Centraliza bots y reenvía eventos a webhooks.",
    nav: {
      bots: "Bots",
    },
    actions: {
      signOut: "Cerrar sesión",
      loginSubmit: "Iniciar sesión",
      loginSubmitting: "Iniciando...",
      loadDiscordData: "Cargar datos de Discord",
      loadingDiscordData: "Cargando...",
      createBot: "Crear bot",
      creatingBot: "Guardando...",
      updateBot: "Actualizar bot",
      updatingBot: "Actualizando...",
      editBot: "Editar",
      cancel: "Cancelar",
      start: "Iniciar",
      stop: "Detener",
      restart: "Reiniciar",
      startAll: "Iniciar todos los bots",
      stopAll: "Detener todos los bots",
      refresh: "Actualizar",
      removeAvatar: "Eliminar avatar",
      delete: "Eliminar",
      deleting: "Eliminando...",
      confirmDelete: "¿Estás seguro de que deseas eliminar este bot?",
    },
    statuses: {
      authenticated: "Autenticado",
      noneSelected: "Nada seleccionado",
    },
    labels: {
      username: "Usuario",
      password: "Contraseña",
      webhookTarget: "Webhook de destino",
      relayEndpoint: "Endpoint de relay",
      guild: "Servidor",
      noAvatar: "Sin avatar",
    },
    placeholders: {
      username: "admin",
      password: "••••••••",
    },
    messages: {
      avatarSuccess: "Avatar subido correctamente.",
      avatarError: "Error al subir el avatar",
    },
    languages: {
      en: "Inglés",
      es: "Español",
      "pt-br": "Portugués (Brasil)",
    },
  },
  login: {
    heroTagline: "Gestión de bots de Discord",
    heroTitle: "Panel de acceso",
    heroDescription:
      "Usa las credenciales configuradas en tus variables de entorno.",
    helpPrompt: "¿Necesitas ayuda? Lee la",
    helpLinkText: "documentación de desarrolladores de Discord",
    fields: {
      username: "Usuario",
      password: "Contraseña",
    },
    errors: {
      invalidPayload: "Datos de credenciales inválidos",
      invalidCredentials: "Usuario o contraseña inválidos",
    },
  },
  bots: {
    heroTitle: "Administra bots de Discord",
    heroDescription:
      "Registra bots, asigna sus recursos de Discord y reenvía todas las interacciones a plataformas de automatización como n8n.",
    guideTitle: "Guía rápida",
    guideSteps: [
      "Abre el Portal de Desarrolladores de Discord, crea o selecciona tu aplicación y copia el token del bot.",
      "Activa los intents necesarios (ver detalles abajo) e invita el bot al servidor objetivo (ver instrucciones abajo).",
      "Copia el ID del servidor desde Discord (modo desarrollador) y pégalo en el campo ID del servidor.",
      "Pega el token del bot y define la URL del webhook de destino.",
      "Configura Discord para enviar interacciones al endpoint de relay mostrado abajo.",
    ],
    intentsTitle: "Activando Intents de Discord",
    intentsDescription:
      "En el Portal de Desarrolladores de Discord, navega a tu aplicación → Bot → Privileged Gateway Intents. Activa los siguientes intents según tus necesidades:",
    intentsList: [
      "MESSAGE CONTENT INTENT: Requerido para leer el contenido de mensajes en canales.",
      "SERVER MEMBERS INTENT: Requerido para listar miembros del servidor y su información.",
      "GUILD MEMBERS INTENT: Requerido para acceder a listas de miembros y datos de usuarios.",
    ],
    intentsNote:
      "Nota: Algunos intents requieren verificación si tu bot está en 100+ servidores. Activa solo lo que necesites.",
    inviteTitle: "Invitar el Bot a tu Servidor",
    inviteDescription:
      "Para agregar tu bot a un servidor de Discord, usa el Generador de URL OAuth2:",
    inviteSteps: [
      "En el Portal de Desarrolladores, ve a OAuth2 → URL Generator.",
      "Selecciona el scope 'bot' en SCOPES.",
      "En BOT PERMISSIONS, selecciona los permisos que tu bot necesita (ej: Leer Mensajes, Enviar Mensajes, Leer Historial de Mensajes).",
      "Copia la URL generada al final de la página.",
      "Abre la URL en tu navegador y selecciona el servidor donde quieres agregar el bot.",
      "Autoriza el bot. Aparecerá en la lista de miembros de tu servidor.",
    ],
    relayTitle: "Endpoint de relay",
    relayDescription:
      "Configura webhooks de Discord o comandos de aplicación para enviar solicitudes POST a tu endpoint de relay. El sistema reenvía la petición al webhook definido por bot.",
    registeredTitle: "Bots registrados",
    registeredDescription:
      "Mantén los tokens seguros. Los tokens se cifran en reposo pero deberías rotarlos cuando sea necesario.",
    emptyState: "Aún no hay bots registrados. Agrega uno usando el formulario.",
    editingBot: "Editando bot",
    card: {
      guild: "Servidor",
      interactionOriginBadge: "Origen de interacción",
      authorizationUrl: "URL de autorización",
    },
  },
  botForm: {
    fields: {
      name: "Nombre del bot",
      avatar: "Imagen del avatar",
      description: "Descripción",
      origin: "Origen de interacción",
      webhook: "URL del webhook",
      token: "Token del bot",
      guildId: "ID del servidor",
      applicationId: "ID de la aplicación (Client ID)",
    },
    placeholders: {
      name: "Asistente de soporte",
      description: "Breve descripción del propósito del bot",
      webhook: "https://tu-instancia-n8n/webhook/...",
      guildId: "123456789012345678",
      token: "Pega el token del bot de Discord",
      applicationId: "123456789012345678",
    },
    options: {
      origins: {
        "discord-channel": "Canal de Discord",
        "discord-user": "Mensaje directo",
        hybrid: "Híbrido",
      },
    },
    upload: {
      hint: "Sube una imagen cuadrada (PNG, JPG, GIF, WebP) de hasta 5MB. Se guarda localmente en /public/uploads.",
      remove: "Eliminar avatar",
      invalidType: "Solo se permiten archivos de imagen.",
    },
    metadata: {
      encryptionNotice:
        "El token se cifra con AES-256-GCM antes de almacenarse.",
    },
    messages: {
      botCreated: "Bot creado correctamente",
      botCreationError: "Error al crear el bot",
      botUpdated: "Bot actualizado correctamente",
      botUpdateError: "Error al actualizar el bot",
    },
    authUrlHint: "URL de autorización",
  },
};

export default es;


