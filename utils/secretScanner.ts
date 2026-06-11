export function containsSecrets(content: string): boolean {
  // Broader regex patterns for secrets
  const patterns = [
    /AKIA[0-9A-Z]{16}/, // AWS Access Key
    /sk-[a-zA-Z0-9]{48}/, // OpenAI API Key (Legacy)
    /sk-(proj|svcacct|ant)-[a-zA-Z0-9\-_]+/, // OpenAI Modern Keys & Anthropic Key
    /gh[poa]_[a-zA-Z0-9]{36}/, // GitHub classic tokens
    /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/, // GitHub fine-grained PAT
    /xox[baprs]-[0-9]{10,13}-[a-zA-Z0-9]{24}/, // Slack Tokens
    /BEGIN (RSA|OPENSSH|PGP) PRIVATE KEY/ // Private keys
  ];

  for (const pattern of patterns) {
    if (pattern.test(content)) {
      return true;
    }
  }

  return false;
}

export function isSensitiveFilename(filename: string): boolean {
  const lowerName = filename.toLowerCase();
  return (
    lowerName.startsWith('.env') ||
    lowerName.endsWith('.pem') ||
    lowerName.endsWith('.key') ||
    lowerName === 'credentials.json' ||
    lowerName === 'config.json' ||
    lowerName === 'secrets.yml' ||
    lowerName === 'id_rsa' ||
    lowerName === 'id_ed25519'
  );
}
