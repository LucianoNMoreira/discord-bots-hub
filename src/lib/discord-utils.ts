/**
 * Gera a URL de autorização OAuth2 do Discord para adicionar o bot a um servidor
 * @param applicationId - O ID da aplicação (client_id) do bot no Discord
 * @param permissions - Permissões numéricas do bot (padrão: 66560)
 * @returns URL de autorização OAuth2
 */
export function generateDiscordAuthUrl(
  applicationId: string,
  permissions: number = 66560,
): string {
  if (!applicationId) {
    throw new Error("Application ID is required");
  }

  const baseUrl = "https://discord.com/oauth2/authorize";
  const params = new URLSearchParams({
    client_id: applicationId,
    permissions: permissions.toString(),
    scope: "bot applications.commands",
  });

  return `${baseUrl}?${params.toString()}`;
}

