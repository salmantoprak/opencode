import * as vscode from 'vscode';
import { QwenAPIClient } from '../services/qwenClient';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'opencode.chat';
  private view?: vscode.WebviewView;
  private messages: ChatMessage[] = [];
  private isLoading = false;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private qwenClient: QwenAPIClient
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent();

    webviewView.webview.onDidReceiveMessage((data) => {
      this.handleMessage(data);
    });
  }

  private async handleMessage(data: any): Promise<void> {
    switch (data.type) {
      case 'user-message':
        await this.handleUserMessage(data.message);
        break;
      case 'clear-chat':
        this.messages = [];
        this.qwenClient.clearHistory();
        this.sendToView({
          type: 'chat-cleared',
        });
        break;
      case 'copy-message':
        await vscode.env.clipboard.writeText(data.content);
        vscode.window.showInformationMessage('✅ Copied to clipboard!');
        break;
      case 'insert-code':
        await this.insertCodeToEditor(data.code);
        break;
    }
  }

  private async handleUserMessage(message: string): Promise<void> {
    if (!this.view || this.isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };

    this.messages.push(userMessage);
    this.isLoading = true;

    this.sendToView({
      type: 'user-message',
      message: userMessage,
    });

    try {
      this.sendToView({
        type: 'loading-start',
      });

      const response = await this.qwenClient.chat(message);

      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      this.messages.push(assistantMessage);

      this.sendToView({
        type: 'assistant-message',
        message: assistantMessage,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.sendToView({
        type: 'error',
        error: errorMessage,
      });
    } finally {
      this.isLoading = false;
      this.sendToView({
        type: 'loading-end',
      });
    }
  }

  private async insertCodeToEditor(code: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    await editor.edit((editBuilder) => {
      editBuilder.insert(editor.selection.active, '\n' + code + '\n');
    });

    vscode.window.showInformationMessage('✅ Code inserted!');
  }

  private sendToView(data: any): void {
    if (this.view) {
      this.view.webview.postMessage(data);
    }
  }

  private getHtmlContent(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OpenCode Chat</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          :root {
            --primary: #4ec9b0;
            --primary-dark: #3eb39f;
            --primary-light: #5ed4b8;
            --bg-dark: #1e1e1e;
            --bg-medium: #252526;
            --bg-light: #2d2d30;
            --text-primary: #e0e0e0;
            --text-secondary: #858585;
            --border: #3e3e42;
            --error: #f48771;
            --success: #89d185;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: var(--bg-dark);
            color: var(--text-primary);
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
          }

          .header {
            background: linear-gradient(135deg, #1e1e1e 0%, #252526 100%);
            padding: 16px;
            border-bottom: 1px solid var(--border);
            flex-shrink: 0;
          }

          .header-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 12px;
          }

          .header-title svg {
            width: 20px;
            height: 20px;
          }

          .model-selector {
            display: flex;
            gap: 8px;
            align-items: center;
            font-size: 12px;
            background-color: var(--bg-light);
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid var(--border);
          }

          .model-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--success);
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          .model-name {
            color: var(--primary);
            font-weight: 500;
          }

          .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            scroll-behavior: smooth;
          }

          .messages-container::-webkit-scrollbar {
            width: 8px;
          }

          .messages-container::-webkit-scrollbar-track {
            background: transparent;
          }

          .messages-container::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 4px;
          }

          .messages-container::-webkit-scrollbar-thumb:hover {
            background: var(--text-secondary);
          }

          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--text-secondary);
            text-align: center;
            gap: 16px;
          }

          .empty-state-icon {
            font-size: 48px;
            opacity: 0.5;
          }

          .empty-state-text {
            font-size: 14px;
          }

          .message {
            display: flex;
            gap: 12px;
            animation: slideIn 0.3s ease;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .message.user {
            justify-content: flex-end;
          }

          .message-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
          }

          .message-avatar.user {
            background-color: var(--primary);
            color: var(--bg-dark);
          }

          .message-avatar.assistant {
            background-color: var(--bg-light);
            color: var(--primary);
            border: 2px solid var(--primary);
          }

          .message-content {
            max-width: 85%;
            padding: 12px 16px;
            border-radius: 12px;
            word-wrap: break-word;
            white-space: pre-wrap;
            line-height: 1.5;
            font-size: 14px;
          }

          .message.user .message-content {
            background-color: var(--primary);
            color: var(--bg-dark);
            border-radius: 18px 18px 4px 18px;
          }

          .message.assistant .message-content {
            background-color: var(--bg-light);
            color: var(--text-primary);
            border: 1px solid var(--border);
            border-radius: 4px 18px 18px 18px;
          }

          .message-actions {
            display: flex;
            gap: 6px;
            margin-top: 8px;
            opacity: 0;
            transition: opacity 0.2s;
          }

          .message:hover .message-actions {
            opacity: 1;
          }

          .action-btn {
            width: 28px;
            height: 28px;
            border: 1px solid var(--border);
            background-color: var(--bg-light);
            color: var(--text-secondary);
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            transition: all 0.2s;
          }

          .action-btn:hover {
            background-color: var(--primary);
            color: var(--bg-dark);
            border-color: var(--primary);
          }

          .code-block {
            background-color: #1e1e1e;
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 12px;
            margin: 8px 0;
            overflow-x: auto;
          }

          .code-block-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border);
          }

          .code-block-lang {
            font-size: 12px;
            color: var(--primary);
            font-weight: 500;
          }

          .code-block-copy {
            width: 24px;
            height: 24px;
            border: none;
            background-color: var(--bg-light);
            color: var(--text-secondary);
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
          }

          .code-block-copy:hover {
            background-color: var(--primary);
            color: var(--bg-dark);
          }

          .code-block-content {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 13px;
            color: #9cdcfe;
            line-height: 1.5;
          }

          .loading {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-secondary);
            font-size: 14px;
          }

          .loading-dots {
            display: flex;
            gap: 4px;
          }

          .loading-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: var(--primary);
            animation: loadingBounce 1.4s infinite;
          }

          .loading-dot:nth-child(1) {
            animation-delay: 0s;
          }

          .loading-dot:nth-child(2) {
            animation-delay: 0.2s;
          }

          .loading-dot:nth-child(3) {
            animation-delay: 0.4s;
          }

          @keyframes loadingBounce {
            0%, 80%, 100% {
              transform: translateY(0);
              opacity: 0.5;
            }
            40% {
              transform: translateY(-8px);
              opacity: 1;
            }
          }

          .error-message {
            background-color: rgba(244, 135, 113, 0.1);
            border-left: 3px solid var(--error);
            padding: 12px;
            border-radius: 6px;
            color: var(--error);
            font-size: 13px;
          }

          .input-area {
            padding: 16px;
            border-top: 1px solid var(--border);
            background-color: var(--bg-medium);
            flex-shrink: 0;
            display: flex;
            gap: 8px;
          }

          .input-wrapper {
            flex: 1;
            display: flex;
            gap: 8px;
          }

          .input-field {
            flex: 1;
            background-color: var(--bg-light);
            border: 1px solid var(--border);
            color: var(--text-primary);
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            outline: none;
            resize: none;
            max-height: 100px;
            transition: all 0.2s;
          }

          .input-field:focus {
            background-color: var(--bg-light);
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(78, 201, 176, 0.1);
          }

          .input-field::placeholder {
            color: var(--text-secondary);
          }

          .send-btn, .action-btn-send, .clear-btn {
            padding: 10px 16px;
            background-color: var(--primary);
            color: var(--bg-dark);
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;
          }

          .send-btn:hover {
            background-color: var(--primary-light);
            transform: translateY(-1px);
          }

          .send-btn:active {
            background-color: var(--primary-dark);
            transform: translateY(0);
          }

          .send-btn:disabled {
            background-color: var(--text-secondary);
            cursor: not-allowed;
            opacity: 0.5;
          }

          .clear-btn {
            background-color: transparent;
            color: var(--text-secondary);
            border: 1px solid var(--border);
            padding: 8px 12px;
          }

          .clear-btn:hover {
            background-color: rgba(244, 135, 113, 0.1);
            color: var(--error);
            border-color: var(--error);
          }

          .toolbar {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .divider {
            width: 1px;
            height: 24px;
            background-color: var(--border);
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-title">
            <span>💬</span>
            <span>OpenCode Chat</span>
          </div>
          <div class="model-selector">
            <div class="model-indicator"></div>
            <span class="model-name" id="modelName">Qwen</span>
            <span id="connectionStatus" style="color: var(--success); font-size: 10px;">● Connected</span>
          </div>
        </div>

        <div class="messages-container" id="messagesContainer">
          <div class="empty-state">
            <div class="empty-state-icon">🤖</div>
            <div class="empty-state-text">
              <strong>OpenCode Chat</strong><br>
              AI-powered coding assistant<br>
              <span style="font-size: 12px; color: var(--text-secondary);">Powered by Qwen LLM</span>
            </div>
          </div>
        </div>

        <div class="input-area">
          <div class="input-wrapper">
            <input
              type="text"
              id="messageInput"
              class="input-field"
              placeholder="Ask anything... Generate code, explain, refactor, debug..."
              autocomplete="off"
            />
            <button id="sendBtn" class="send-btn" title="Send (Enter)">Send</button>
          </div>
          <button id="clearBtn" class="clear-btn" title="Clear chat">Clear</button>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          const messagesContainer = document.getElementById('messagesContainer');
          const inputField = document.getElementById('messageInput');
          const sendBtn = document.getElementById('sendBtn');
          const clearBtn = document.getElementById('clearBtn');
          const modelName = document.getElementById('modelName');
          let isLoading = false;

          // Get config from VS Code
          const config = {
            model: 'qwen',
          };

          function createUserMessage(message) {
            const div = document.createElement('div');
            div.className = 'message user';
            
            const content = document.createElement('div');
            content.className = 'message-content';
            content.textContent = message;
            
            div.appendChild(content);
            return div;
          }

          function createAssistantMessage(content) {
            const div = document.createElement('div');
            div.className = 'message assistant';
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar assistant';
            avatar.textContent = '🤖';
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message-content';
            
            // Parse and format content (including code blocks)
            const lines = content.split('\\n');
            let inCodeBlock = false;
            let codeLanguage = 'code';
            let codeContent = '';
            
            const fragment = document.createDocumentFragment();
            
            for (let line of lines) {
              if (line.startsWith('\\`\\`\\`')) {
                if (!inCodeBlock) {
                  inCodeBlock = true;
                  codeLanguage = line.substring(3).trim() || 'code';
                } else {
                  inCodeBlock = false;
                  const codeBlock = document.createElement('div');
                  codeBlock.className = 'code-block';
                  
                  const header = document.createElement('div');
                  header.className = 'code-block-header';
                  header.innerHTML = \`<span class="code-block-lang">\${codeLanguage}</span>\`;
                  
                  const copyBtn = document.createElement('button');
                  copyBtn.className = 'code-block-copy';
                  copyBtn.textContent = '📋';
                  copyBtn.onclick = () => {
                    navigator.clipboard.writeText(codeContent).then(() => {
                      vscode.postMessage({
                        type: 'copy-message',
                        content: codeContent
                      });
                    });
                  };
                  
                  const insertBtn = document.createElement('button');
                  insertBtn.className = 'code-block-copy';
                  insertBtn.textContent = '➕';
                  insertBtn.title = 'Insert to editor';
                  insertBtn.onclick = () => {
                    vscode.postMessage({
                      type: 'insert-code',
                      code: codeContent
                    });
                  };
                  
                  header.appendChild(copyBtn);
                  header.appendChild(insertBtn);
                  codeBlock.appendChild(header);
                  
                  const codeContentDiv = document.createElement('div');
                  codeContentDiv.className = 'code-block-content';
                  codeContentDiv.textContent = codeContent;
                  codeBlock.appendChild(codeContentDiv);
                  
                  fragment.appendChild(codeBlock);
                  codeContent = '';
                }
              } else if (inCodeBlock) {
                codeContent += line + '\\n';
              } else {
                const p = document.createElement('div');
                p.style.marginBottom = '8px';
                p.textContent = line;
                fragment.appendChild(p);
              }
            }
            
            messageDiv.appendChild(fragment);
            
            const actions = document.createElement('div');
            actions.className = 'message-actions';
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'action-btn';
            copyBtn.textContent = '📋';
            copyBtn.title = 'Copy';
            copyBtn.onclick = () => {
              navigator.clipboard.writeText(content).then(() => {
                vscode.postMessage({
                  type: 'copy-message',
                  content: content
                });
              });
            };
            
            actions.appendChild(copyBtn);
            messageDiv.appendChild(actions);
            
            div.appendChild(avatar);
            div.appendChild(messageDiv);
            return div;
          }

          function createLoadingMessage() {
            const div = document.createElement('div');
            div.className = 'message assistant';
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar assistant';
            avatar.textContent = '🤖';
            
            const content = document.createElement('div');
            content.className = 'loading';
            content.innerHTML = '<span>Thinking</span><div class="loading-dots"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div>';
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message-content';
            messageDiv.appendChild(content);
            
            div.appendChild(avatar);
            div.appendChild(messageDiv);
            return div;
          }

          function scrollToBottom() {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }

          function clearEmptyState() {
            const emptyState = messagesContainer.querySelector('.empty-state');
            if (emptyState) {
              emptyState.remove();
            }
          }

          function sendMessage() {
            const message = inputField.value.trim();
            if (!message || isLoading) return;
            
            clearEmptyState();
            messagesContainer.appendChild(createUserMessage(message));
            inputField.value = '';
            inputField.focus();
            scrollToBottom();
            
            vscode.postMessage({
              type: 'user-message',
              message: message
            });
          }

          sendBtn.addEventListener('click', sendMessage);
          inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          });

          clearBtn.addEventListener('click', () => {
            if (confirm('Clear all messages?')) {
              vscode.postMessage({ type: 'clear-chat' });
            }
          });

          window.addEventListener('message', (event) => {
            const data = event.data;
            
            switch (data.type) {
              case 'user-message':
                clearEmptyState();
                messagesContainer.appendChild(createUserMessage(data.message.content));
                scrollToBottom();
                break;
                
              case 'loading-start':
                isLoading = true;
                sendBtn.disabled = true;
                messagesContainer.appendChild(createLoadingMessage());
                scrollToBottom();
                break;
                
              case 'assistant-message':
                isLoading = false;
                sendBtn.disabled = false;
                const loading = messagesContainer.querySelector('.loading');
                if (loading) {
                  loading.closest('.message').remove();
                }
                messagesContainer.appendChild(createAssistantMessage(data.message.content));
                scrollToBottom();
                break;
                
              case 'loading-end':
                isLoading = false;
                sendBtn.disabled = false;
                break;
                
              case 'chat-cleared':
                messagesContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🤖</div><div class="empty-state-text"><strong>OpenCode Chat</strong><br>AI-powered coding assistant</div></div>';
                break;
                
              case 'error':
                isLoading = false;
                sendBtn.disabled = false;
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = '❌ Error: ' + data.error;
                messagesContainer.appendChild(errorDiv);
                scrollToBottom();
                break;
            }
          });

          inputField.focus();
        </script>
      </body>
      </html>
    `;
  }
}
