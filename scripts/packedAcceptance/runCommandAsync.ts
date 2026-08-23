interface CommandOptions {
  readonly capture?: boolean;
  readonly env?: Readonly<Record<string, string>>;
}

export async function runCommandAsync(
  command: string,
  args: readonly string[],
  cwd: string,
  options: CommandOptions = {},
): Promise<string> {
  const process = Bun.spawn([command, ...args], {
    cwd,
    env: { ...Bun.env, CI: '1', ...options.env },
    stdout: options.capture ? 'pipe' : 'inherit',
    stderr: 'inherit',
  });
  const output = options.capture ? await new Response(process.stdout).text() : '';
  const exitCode = await process.exited;
  if (exitCode !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${exitCode}.`);
  }
  return output.trim();
}
