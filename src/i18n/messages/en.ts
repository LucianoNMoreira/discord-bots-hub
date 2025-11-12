const en = {
  common: {
    appName: "Discord Bots Hub",
    tagline: "Centralize bots and forward events to webhooks.",
    nav: {
      bots: "Bots",
    },
    actions: {
      signOut: "Sign out",
      loginSubmit: "Sign in",
      loginSubmitting: "Signing in...",
      loadDiscordData: "Load Discord data",
      loadingDiscordData: "Fetching...",
      createBot: "Create bot",
      creatingBot: "Saving...",
      updateBot: "Update bot",
      updatingBot: "Updating...",
      editBot: "Edit",
      cancel: "Cancel",
      start: "Start",
      stop: "Stop",
      restart: "Restart",
      startAll: "Start all bots",
      stopAll: "Stop all bots",
      refresh: "Refresh",
      removeAvatar: "Remove avatar",
      delete: "Delete",
      deleting: "Deleting...",
      confirmDelete: "Are you sure you want to delete this bot?",
    },
    statuses: {
      authenticated: "Authenticated",
      noneSelected: "None selected",
    },
    labels: {
      username: "Username",
      password: "Password",
      webhookTarget: "Webhook target",
      relayEndpoint: "Relay endpoint",
      guild: "Guild",
      noAvatar: "No avatar",
    },
    placeholders: {
      username: "admin",
      password: "••••••••",
    },
    messages: {
      avatarSuccess: "Avatar uploaded successfully.",
      avatarError: "Failed to upload avatar",
    },
    languages: {
      en: "English",
      es: "Spanish",
      "pt-br": "Portuguese (Brazil)",
    },
  },
  login: {
    heroTagline: "Discord Bots Management",
    heroTitle: "Access control panel",
    heroDescription:
      "Use the credentials provisioned in your environment variables.",
    helpPrompt: "Need help? Read the",
    helpLinkText: "Discord developer docs",
    fields: {
      username: "Username",
      password: "Password",
    },
    errors: {
      invalidPayload: "Invalid credentials payload",
      invalidCredentials: "Invalid username or password",
    },
  },
  bots: {
    heroTitle: "Manage Discord bots",
    heroDescription:
      "Register bots, map their Discord resources and relay all interactions to automation platforms such as n8n.",
    guideTitle: "Quick setup guide",
    guideSteps: [
      "Open the Discord Developer Portal, create/select your application, and copy the bot token.",
      "Enable the intents your automation requires (see details below) and invite the bot to the target guild (see instructions below).",
      "Copy the Server ID from Discord (Developer Mode) and paste it in the Guild ID field.",
      "Paste the bot token and define the target webhook URL.",
      "Configure Discord to send interactions to the relay endpoint displayed below.",
    ],
    intentsTitle: "Enabling Discord Intents",
    intentsDescription:
      "In the Discord Developer Portal, navigate to your application → Bot → Privileged Gateway Intents. Enable the following intents based on your needs:",
    intentsList: [
      "MESSAGE CONTENT INTENT: Required to read message content in channels.",
      "SERVER MEMBERS INTENT: Required to list guild members and their information.",
      "GUILD MEMBERS INTENT: Required to access member lists and user data.",
    ],
    intentsNote:
      "Note: Some intents require verification if your bot is in 100+ servers. Enable only what you need.",
    inviteTitle: "Inviting the Bot to Your Server",
    inviteDescription:
      "To add your bot to a Discord server, use the OAuth2 URL Generator:",
    inviteSteps: [
      "In the Developer Portal, go to OAuth2 → URL Generator.",
      "Select the 'bot' scope under SCOPES.",
      "Under BOT PERMISSIONS, select the permissions your bot needs (e.g., Read Messages, Send Messages, Read Message History).",
      "Copy the generated URL at the bottom of the page.",
      "Open the URL in your browser and select the server where you want to add the bot.",
      "Authorize the bot. It will appear in your server's member list.",
    ],
    relayTitle: "Relay endpoint",
    relayDescription:
      "Configure Discord webhooks or application commands to POST payloads to your relay endpoint. The system forwards requests to the webhook URL defined per bot.",
    registeredTitle: "Registered bots",
    registeredDescription:
      "Keep tokens secure. Tokens are encrypted at rest but you should rotate them when necessary.",
    emptyState: "No bots registered yet. Add one using the form above.",
    editingBot: "Editing bot",
    card: {
      guild: "Guild",
      interactionOriginBadge: "Interaction origin",
      applicationId: "Application ID",
      authorizationUrl: "Authorization URL",
    },
  },
  botForm: {
    fields: {
      name: "Bot name",
      avatar: "Avatar image",
      description: "Description",
      origin: "Interaction origin",
      webhook: "Webhook URL",
      token: "Bot token",
      guildId: "Guild ID",
      applicationId: "Application ID (Client ID)",
    },
    placeholders: {
      name: "Support assistant",
      description: "Short description outlining the bot purpose",
      webhook: "https://your-n8n-instance/webhook/...",
      guildId: "123456789012345678",
      token: "Paste the Discord bot token",
      applicationId: "123456789012345678",
    },
    options: {
      origins: {
        "discord-channel": "Discord channel",
        "discord-user": "Discord direct message",
        hybrid: "Hybrid",
      },
    },
    upload: {
      hint: "Upload a square image (PNG, JPG, GIF, WebP) up to 5MB. It is stored locally in /public/uploads.",
      remove: "Remove avatar",
      invalidType: "Only image files are allowed.",
    },
    metadata: {
      encryptionNotice:
        "The token is encrypted using AES-256-GCM before storage.",
    },
    messages: {
      botCreated: "Bot created successfully",
      botCreationError: "Failed to create bot",
      botUpdated: "Bot updated successfully",
      botUpdateError: "Failed to update bot",
    },
    authUrlHint: "Authorization URL",
  },
  commands: {
    title: "Manage Commands",
    description: "Create and manage Discord slash commands for this bot.",
    listTitle: "Command List",
    listDescription: "Manage bot commands and register them on Discord.",
    newCommand: "New Command",
    editCommand: "Edit Command",
    createCommand: "Create Command",
    updateCommand: "Update Command",
    registerCommands: "Register on Discord",
    registering: "Registering...",
    registered: "Registered",
    noCommands: "No commands registered. Create a command using the form above.",
    commandsCount: "command registered",
    commandsCountPlural: "commands registered",
    fields: {
      name: "Command name",
      description: "Description",
      type: "Type",
      options: "Options (parameters)",
    },
    placeholders: {
      name: "example",
      description: "Command description",
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
      commandCreated: "Command created successfully",
      commandUpdated: "Command updated successfully",
      commandDeleted: "Command deleted successfully",
      commandsRegistered: "commands registered successfully on Discord",
      registerError: "Error registering commands",
      deleteConfirm: "Are you sure you want to delete this command?",
      loading: "Loading commands...",
      loadingCommand: "Loading command...",
    },
  },
};

export type Messages = typeof en;

export default en;


