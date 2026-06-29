import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { LangTypes } from 'src/common/enums';
import { execSync, exec as execCallback } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const exec = promisify(execCallback);

interface FileEntry {
  path: string;
  content: string;
}

@Injectable()
export class RunCodeService {
  private projectsDir = path.resolve('/tmp', 'code-collab-projects');

  private getProjectDir(roomId: string) {
    return path.join(this.projectsDir, roomId);
  }

  private getHashPath(roomId: string) {
    return path.join(this.getProjectDir(roomId), '.package-hash');
  }

  private hashPackageJson(files: FileEntry[]): string | null {
    const pkg = files.find((f) => f.path === 'package.json');
    if (!pkg) return null;
    return crypto.createHash('md5').update(pkg.content).digest('hex');
  }

  private ensureDir(dir: string) {
    fs.mkdirSync(dir, { recursive: true });
  }

  private writeProjectFiles(roomId: string, files: FileEntry[]) {
    const projectDir = this.getProjectDir(roomId);
    this.ensureDir(projectDir);

    for (const file of files) {
      const filePath = path.join(projectDir, file.path);
      this.ensureDir(path.dirname(filePath));
      fs.writeFileSync(filePath, file.content, 'utf-8');
    }

    return projectDir;
  }

  private needsInstall(roomId: string, hash: string): boolean {
    const hashPath = this.getHashPath(roomId);
    try {
      const existing = fs.readFileSync(hashPath, 'utf-8');
      return existing !== hash;
    } catch {
      return true;
    }
  }

  private saveHash(roomId: string, hash: string) {
    this.ensureDir(this.getProjectDir(roomId));
    fs.writeFileSync(this.getHashPath(roomId), hash, 'utf-8');
  }

  private findEntryPoint(files: FileEntry[]): string {
    const pkg = files.find((f) => f.path === 'package.json');
    if (pkg) {
      try {
        const parsed = JSON.parse(pkg.content);
        if (parsed.main) return parsed.main;
      } catch {}
    }
    if (files.some((f) => f.path === 'index.js')) return 'index.js';
    if (files.some((f) => f.path === 'index.mjs')) return 'index.mjs';
    if (files.some((f) => f.path === 'server.js')) return 'server.js';
    if (files.some((f) => f.path === 'app.js')) return 'app.js';
    const jsFile = files.find((f) => f.path.endsWith('.js') || f.path.endsWith('.mjs'));
    return jsFile?.path || 'index.js';
  }

  async runCode(code: string, language: LangTypes) {
    const baseUrl = process.env.CODE_EXECUTION_ENGINE_API || 'http://127.0.0.1:3000';
    const res = await axios.post(
      `${baseUrl}/api/execute`,
      { code, language },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return res.data;
  }

  async runProject(files: FileEntry[]): Promise<{ output: string }> {
    const hasPackageJson = files.some((f) => f.path === 'package.json');

    if (!hasPackageJson) {
      return { output: 'No package.json found. Add a package.json to define your project.' };
    }

    const roomId = crypto.createHash('md5').update(JSON.stringify(files)).digest('hex').slice(0, 12);
    const entryPoint = this.findEntryPoint(files);
    const hash = this.hashPackageJson(files);

    this.writeProjectFiles(roomId, files);

    if (hash && this.needsInstall(roomId, hash)) {
      try {
        const projectDir = this.getProjectDir(roomId);
        execSync('npm install --production --no-audit --no-fund', {
          cwd: projectDir,
          timeout: 120_000,
          stdio: 'pipe',
        });
        this.saveHash(roomId, hash);
      } catch (err: any) {
        return {
          output: `npm install failed:\n${err.stderr?.toString() || err.message}`,
        };
      }
    }

    try {
      const projectDir = this.getProjectDir(roomId);
      const { stdout, stderr } = await exec(`node ${entryPoint}`, {
        cwd: projectDir,
        timeout: 30_000,
        maxBuffer: 1_024 * 1_024,
      });
      return { output: stdout + (stderr ? `\n${stderr}` : '') };
    } catch (err: any) {
      const stderr = err.stderr || err.message || '';
      const stdout = err.stdout || '';
      return { output: stdout + (stdout && stderr ? '\n' : '') + stderr };
    }
  }
}
