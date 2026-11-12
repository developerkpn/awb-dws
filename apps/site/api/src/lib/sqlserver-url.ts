/** Reads a Prisma-style `sqlserver://host:port;key=value;...` URL into mssql connection settings. */
export function parseSqlServerUrl(url: string) {
  if (!url.startsWith('sqlserver://')) throw new Error('Expected a sqlserver:// URL')

  const [address = '', ...pairs] = url.slice('sqlserver://'.length).split(';')
  const [host = '', port] = address.split(':')

  const settings = new Map(
    pairs
      .filter((pair) => pair.includes('='))
      .map((pair) => {
        const index = pair.indexOf('=')

        return [pair.slice(0, index).trim().toLowerCase(), pair.slice(index + 1).trim()] as const
      }),
  )

  const flag = (key: string, fallback: boolean) =>
    settings.has(key) ? settings.get(key)?.toLowerCase() === 'true' : fallback

  return {
    server: host.split('\\')[0] ?? host,
    port: port ? Number(port) : 1433,
    database: settings.get('database') ?? settings.get('initial catalog'),
    user: settings.get('user') ?? settings.get('username'),
    password: settings.get('password'),
    options: {
      encrypt: flag('encrypt', true),
      trustServerCertificate: flag('trustservercertificate', false),
    },
  }
}
