import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class TerminalManager {
  private terminal: vscode.Terminal | null = null;
  private codeCache: Map<string, string> = new Map();

  private ensureTerminal(): vscode.Terminal {
    if (!this.terminal || this.terminal.exitStatus !== undefined) {
      this.terminal = vscode.window.createTerminal({
        name: 'OpenCode Terminal',
        shellPath: this.getShell(),
      });
    }
    return this.terminal;
  }

  async runCode(code: string, language: string): Promise<void> {
    try {
      const workspaceFolder =
        vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ||
        require('os').homedir();

      const fileName = this.getFileName(language);
      const filePath = path.join(workspaceFolder, fileName);

      // Save code to temporary file
      fs.writeFileSync(filePath, code);
      this.codeCache.set(filePath, code);

      const terminal = this.ensureTerminal();
      terminal.show();

      // Execute based on language
      const command = this.getExecutionCommand(language, filePath);
      terminal.sendText(command, true);

      // Auto cleanup after execution
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            this.codeCache.delete(filePath);
          }
        } catch (e) {
          console.error('Error cleaning up temporary file:', e);
        }
      }, 5000);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to run code: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async runCodeInCurrentTerminal(code: string, language: string): Promise<void> {
    try {
      const terminal = this.ensureTerminal();
      terminal.show();

      // Determine how to run based on language
      const commands = this.getRunCommands(code, language);

      for (const cmd of commands) {
        terminal.sendText(cmd, true);
        // Wait a bit between commands
        await this.sleep(500);
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to execute: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private getFileName(language: string): string {
    const timestamp = Date.now();
    const extensions: { [key: string]: string } = {
      python: 'temp_script.py',
      javascript: 'temp_script.js',
      typescript: 'temp_script.ts',
      bash: 'temp_script.sh',
      shell: 'temp_script.sh',
      powershell: 'temp_script.ps1',
      csharp: 'TempScript.cs',
      java: 'TempScript.java',
      cpp: 'temp_script.cpp',
      c: 'temp_script.c',
      go: 'temp_script.go',
      rust: 'temp_script.rs',
      ruby: 'temp_script.rb',
      php: 'temp_script.php',
    };

    return extensions[language] || `temp_script_${timestamp}.txt`;
  }

  private getExecutionCommand(language: string, filePath: string): string {
    const commands: { [key: string]: string } = {
      python: `python "${filePath}"`,
      javascript: `node "${filePath}"`,
      typescript: `ts-node "${filePath}"`,
      bash: `bash "${filePath}"`,
      shell: `sh "${filePath}"`,
      powershell: `powershell -File "${filePath}"`,
      csharp: `dotnet "${filePath}"`,
      java: `java "${filePath}"`,
      cpp: `g++ "${filePath}" -o temp && ./temp`,
      c: `gcc "${filePath}" -o temp && ./temp`,
      go: `go run "${filePath}"`,
      rust: `rustc "${filePath}" && ./temp_script`,
      ruby: `ruby "${filePath}"`,
      php: `php "${filePath}"`,
    };

    return commands[language] || `echo "Language ${language} not fully supported"`;
  }

  private getRunCommands(code: string, language: string): string[] {
    // For simple code snippets, try to execute directly if possible
    if (language === 'python') {
      return [`python -c "${this.escapeShellString(code)}"`];
    } else if (language === 'javascript') {
      return [`node -e "${this.escapeShellString(code)}"`];
    } else if (language === 'bash' || language === 'shell') {
      return [code];
    }

    return [];
  }

  private escapeShellString(str: string): string {
    return str.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
  }

  private getShell(): string {
    const platform = process.platform;
    if (platform === 'win32') {
      return 'powershell.exe';
    } else if (platform === 'darwin') {
      return '/bin/zsh';
    }
    return '/bin/bash';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  showTerminal(): void {
    const terminal = this.ensureTerminal();
    terminal.show();
  }

  sendCommand(command: string): void {
    const terminal = this.ensureTerminal();
    terminal.sendText(command, true);
  }

  clear(): void {
    const terminal = this.ensureTerminal();
    terminal.sendText('clear', true);
  }
}
