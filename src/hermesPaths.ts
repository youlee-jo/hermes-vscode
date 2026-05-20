import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * Hermes 홈 경로 후보를 우선순위대로 반환한다.
 *
 * Hermes CLI는 플랫폼과 설치 방식에 따라 `~/.hermes` 또는
 * Windows의 `%LOCALAPPDATA%/hermes`를 사용할 수 있다. VS Code 확장은
 * workspace 쪽에서 실행되므로, 파일을 읽을 때 한 경로만 가정하면
 * 모델/스킬 목록이 비어 보일 수 있다.
 */
export function hermesHomeCandidates(
  home: string = os.homedir(),
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string[] {
  const candidates: string[] = [];
  const add = (candidate?: string): void => {
    if (!candidate) return;
    const normalized = path.normalize(candidate);
    if (!candidates.includes(normalized)) candidates.push(normalized);
  };

  add(env.HERMES_HOME);

  if (platform === 'win32') {
    add(env.LOCALAPPDATA ? path.join(env.LOCALAPPDATA, 'hermes') : undefined);
    add(path.join(home, 'AppData', 'Local', 'hermes'));
  }

  add(path.join(home, '.hermes'));
  return candidates;
}

/**
 * 실제 존재하는 Hermes 홈을 먼저 사용하고, 아직 생성 전이면 첫 번째
 * 후보를 반환한다. 읽기 전용 호출자는 반환 경로의 존재 여부를 따로
 * 확인해야 한다.
 */
export function resolveHermesHome(
  home: string = os.homedir(),
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string {
  const candidates = hermesHomeCandidates(home, env, platform);
  return candidates.find(candidate => fs.existsSync(candidate)) ?? candidates[0];
}

/** Hermes 홈 아래의 파일/디렉터리 경로를 만든다. */
export function hermesPath(
  segments: string[],
  home: string = os.homedir(),
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string {
  return path.join(resolveHermesHome(home, env, platform), ...segments);
}

/** 존재하는 Hermes 파일 경로를 후보 홈에서 찾는다. */
export function findHermesFile(
  segments: string[],
  home: string = os.homedir(),
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string | null {
  for (const candidate of hermesHomeCandidates(home, env, platform)) {
    const filePath = path.join(candidate, ...segments);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}
