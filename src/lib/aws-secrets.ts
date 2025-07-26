import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const secretManagerClient = new SecretsManagerClient({ region: "us-east-1" });

export async function getSecret(secretName: string): Promise<string | undefined> {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretManagerClient.send(command);

    if (response.SecretString) {
      return response.SecretString;
    }
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error);
  }

  return undefined;
}
