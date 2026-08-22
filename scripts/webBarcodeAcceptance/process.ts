export async function runCommand(
  command: string,
  args: readonly string[],
  cwd: string,
): Promise<void> {
  const child = Bun.spawn([command, ...args], {
    cwd,
    env: { ...Bun.env, CI: '1' },
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const exitCode = await child.exited;
  if (exitCode !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with code ${exitCode}.`);
  }
}
