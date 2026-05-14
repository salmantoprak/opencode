import * as vscode from 'vscode';
import { QwenAPIClient } from '../services/qwenClient';
import { v4 as uuidv4 } from 'uuid';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'opencode.chat';
  private view?: vscode.WebviewView;
  private messageId = 0;

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
      case 'message':
        await this.handleChatMessage(data.message);
        break;
      case 'clear':
        this.qwenClient.clearHistory();
        this.sendToView({
          type: 'cleared',
        });
        break;
    }
  }

  private async handleChatMessage(message: string): Promise<void> {
    if (!this.view) {
      return;
    }

    const messageId = uuidv4();
    this.sendToView({
      type: 'user-message',
      id: messageId,
      message: message,
    });

    try {
      this.sendToView({
        type: 'assistant-thinking',
        id: messageId,
      });

      const response = await this.qwenClient.chat(message);

      this.sendToView({
        type: 'assistant-message',
        id: messageId,
        message: response,
      });
    } catch (error) {
      this.sendToView({
        type: 'error',
        id: messageId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private sendToView(data: any): void {
    if (this.view) {
      this.view.webview.postMessage(data);
    }
  }

  private getHtmlContent(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #1e1e1e;
            color: #e0e0e0;
            display: flex;
            flex-direction: column;
            height: 100vh;
          }
          
          .header {
            background-color: #252526;
            padding: 15px;
            border-bottom: 1px solid #3e3e42;
            text-align: center;
            font-weight: bold;
            color: #4ec9b0;
          }
          
          .messages {
            flex: 1;
            overflow-y: auto;
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          
          .message {
            display: flex;
            gap: 10px;
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
            background-color: #2d2d30;
            color: #4ec9b0;
          }
          
          .message-avatar.assistant {
            background-color: #004b72;
            color: #4ec9b0;
          }
          
          .message-content {
            flex: 1;
            background-color: #252526;
            padding: 12px;
            border-radius: 5px;
            word-wrap: break-word;
            white-space: pre-wrap;
            font-size: 13px;
            line-height: 1.5;
            border-left: 3px solid #4ec9b0;
          }
          
          .message.user .message-content {
            background-color: #1e3a3a;
            border-left-color: #4ec9b0;
          }
          
          .thinking {
            color: #858585;
            font-style: italic;
          }
          
          .input-area {
            padding: 12px;
            border-top: 1px solid #3e3e42;
            background-color: #252526;
            display: flex;
            gap: 8px;
          }
          
          .input-field {
            flex: 1;
            background-color: #3e3e42;
            border: 1px solid #3e3e42;
            color: #e0e0e0;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 13px;
            font-family: inherit;
            outline: none;
          }
          
          .input-field:focus {
            background-color: #3e3e42;
            border-color: #4ec9b0;
          }
          
          .btn {
            padding: 8px 16px;
            background-color: #4ec9b0;
            color: #1e1e1e;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 13px;
            transition: background-color 0.2s;
          }
          
          .btn:hover {
            background-color: #5ed4b8;
          }
          
          .btn:active {
            background-color: #3eb39f;
          }
          
          .btn-clear {
            background-color: #d4534f;
            color: white;
          }
          
          .btn-clear:hover {
            background-color: #e0625d;
          }
          
          .error {
            color: #f48771;
            background-color: #5f2c2c;
            padding: 12px;
            border-radius: 4px;
            border-left: 3px solid #f48771;
          }
        </style>
      </head>
      <body>
        <div class="header">
          💬 OpenCode Chat
        </div>
        
        <div class="messages" id="messages"></div>
        
        <div class="input-area">
          <input 
            type="text" 
            id="messageInput" 
            class="input-field" 
            placeholder="Ask anything about code..." 
            autocomplete="off"
          />
          <button id="sendBtn" class="btn">Send</button>
          <button id="clearBtn" class="btn btn-clear">Clear</button>
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          const messagesDiv = document.getElementById('messages');
          const inputField = document.getElementById('messageInput');
          const sendBtn = document.getElementById('sendBtn');
          const clearBtn = document.getElementById('clearBtn');
          
          function createMessage(message, isUser, isThinking = false) {
            const div = document.createElement('div');
            div.className = 'message';
            
            const avatar = document.createElement('div');
            avatar.className = isUser ? 'message-avatar user' : 'message-avatar assistant';
            avatar.textContent = isUser ? '👤' : '🤖';
            
            const content = document.createElement('div');
            content.className = 'message-content';
            if (isThinking) {
              content.classList.add('thinking');
              content.textContent = 'Thinking...';
            } else {
              content.textContent = message;
            }
            
            div.appendChild(avatar);
            div.appendChild(content);
            return div;
          }
          
          function scrollToBottom() {
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          }
          
          function sendMessage() {
            const message = inputField.value.trim();
            if (!message) return;
            
            inputField.value = '';
            vscode.postMessage({
              type: 'message',
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
            vscode.postMessage({ type: 'clear' });
          });
          
          window.addEventListener('message', (event) => {
            const data = event.data;
            
            switch (data.type) {
              case 'user-message':
                messagesDiv.appendChild(createMessage(data.message, true));
                scrollToBottom();
                break;
                
              case 'assistant-thinking':
                messagesDiv.appendChild(createMessage('', false, true));
                scrollToBottom();
                break;
                
              case 'assistant-message':
                const lastMessage = messagesDiv.lastChild;
                if (lastMessage && lastMessage.querySelector('.thinking')) {
                  lastMessage.querySelector('.message-content').textContent = data.message;
                  lastMessage.querySelector('.message-content').classList.remove('thinking');
                } else {
                  messagesDiv.appendChild(createMessage(data.message, false));
                }
                scrollToBottom();
                break;
                
              case 'error':
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error';
                errorDiv.textContent = '❌ Error: ' + data.error;
                messagesDiv.appendChild(errorDiv);
                scrollToBottom();
                break;
                
              case 'cleared':
                messagesDiv.innerHTML = '';
                inputField.focus();
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
