# OpenCode - Qwen AI Agent for VS Code

A powerful and intuitive VS Code extension that brings local Qwen LLM capabilities to your coding environment. Generate, explain, refactor, and run code with precision—all without leaving your editor.

## 🌟 Features

- **💻 Code Generation**: Generate code from natural language descriptions
- **📚 Code Explanation**: Understand complex code snippets instantly
- **🔄 Refactoring**: Improve code quality with intelligent suggestions
- **📖 Documentation**: Auto-generate comprehensive documentation
- **🐛 Bug Detection**: Identify bugs, security issues, and performance problems
- **▶️ Run Code**: Execute code directly in VS Code's integrated terminal
- **💬 AI Chat**: Interactive chat with Qwen for coding assistance
- **⚙️ Easy Configuration**: Simple setup pointing to your local Qwen server

## 🚀 Quick Start

### Prerequisites

1. **Local Qwen LLM Server** running on `http://localhost:1234`
   - You can use [Ollama](https://ollama.ai), [Text Generation WebUI](https://github.com/oobabooga/text-generation-webui), or similar
   - Pull a Qwen model: `ollama pull qwen` or `ollama pull qwen2.5`

2. **VS Code** (1.84+)

### Installation

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "OpenCode"
4. Click Install

### Setup

1. Ensure your Qwen server is running on `http://localhost:1234`
2. Open VS Code settings: `Ctrl+,` / `Cmd+,`
3. Search for "opencode"
4. Configure:
   - **API URL**: `http://localhost:1234` (default)
   - **Model**: `qwen` (or your specific model name)
   - **Max Tokens**: `2048` (adjust as needed)
   - **Temperature**: `0.7` (0.0-2.0)

## ⌨️ Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Generate Code | `Ctrl+Shift+G` | `Cmd+Shift+G` |
| Explain Code | `Ctrl+Shift+E` | `Cmd+Shift+E` |
| Refactor Code | `Ctrl+Shift+R` | `Cmd+Shift+R` |
| Run Code | `Ctrl+Shift+X` | `Cmd+Shift+X` |

Or use the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and search for "OpenCode"

## 📖 Usage Examples

### Generate Code
1. Select text or place cursor where you want code
2. Press `Ctrl+Shift+G` (or use Command Palette)
3. Describe what you want: "Create a function to calculate Fibonacci numbers"
4. Code is inserted and formatted automatically

### Explain Code
1. Select code you want explained
2. Press `Ctrl+Shift+E`
3. Explanation appears in a side panel

### Refactor Code
1. Select code to refactor
2. Press `Ctrl+Shift+R`
3. Optionally specify improvements: "improve performance"
4. Refactored code replaces the selection

### Run Code
1. Select code to execute
2. Press `Ctrl+Shift+X`
3. Code runs in the integrated terminal

### Chat
1. Click the OpenCode icon in the sidebar
2. Open the "OpenCode Chat" panel
3. Ask anything about coding
4. Get instant responses from Qwen

## 🔧 Configuration

All settings are available in VS Code Settings under "OpenCode":

```json
{
  "opencode.apiUrl": "http://localhost:1234",
  "opencode.model": "qwen",
  "opencode.maxTokens": 2048,
  "opencode.temperature": 0.7,
  "opencode.autoSave": true
}
```

## 📋 Supported Languages

- Python
- JavaScript / TypeScript
- Java
- C / C++ / C#
- Go
- Rust
- Ruby
- PHP
- Bash / Shell
- PowerShell
- ...and more!

## 🛠️ Setup Your Qwen Server

### Option 1: Using Ollama (Recommended)

```bash
# Install Ollama from https://ollama.ai

# Pull a Qwen model
ollama pull qwen        # 7B model
ollama pull qwen:13b    # 13B model
ollama pull qwen2.5     # Latest Qwen 2.5

# Run (default port is 11434, but Ollama uses 11434 for API)
# Use with OpenCode by setting API URL to: http://localhost:11434
```

### Option 2: Using Text Generation WebUI

```bash
# Clone and run
git clone https://github.com/oobabooga/text-generation-webui
cd text-generation-webui
python server.py --api

# By default runs on http://localhost:5000
```

## 🐛 Troubleshooting

### "Cannot connect to server"
- Ensure your Qwen server is running
- Check the API URL in settings matches your server
- Try accessing the URL in your browser

### "Model not found"
- Verify the model name matches what's installed on your server
- For Ollama: run `ollama list` to see available models
- Update the "Model" setting in OpenCode

### Slow responses
- Your hardware might be limiting the model
- Try a smaller model (e.g., `qwen` 7B instead of 13B)
- Reduce `maxTokens` in settings for faster (shorter) responses

### Code not running
- Check if the language is supported
- Ensure required runtime is installed (Python, Node.js, etc.)
- View terminal output for errors

## 💡 Tips & Best Practices

1. **Be Specific**: Detailed prompts → Better code
   - ❌ "Make a function"
   - ✅ "Create an async function to fetch data from an API with retry logic and error handling"

2. **Use Comments**: Add context with comments for better results
3. **Select Context**: When generating, select relevant code for better context
4. **Chat First**: Use the chat to brainstorm before generating
5. **Review Output**: Always review generated code for correctness

## 🤝 Contributing

Found a bug? Have a feature request? Open an issue on GitHub:
https://github.com/salmantoprak/opencode/issues

## 📄 License

MIT License - feel free to use and modify!

## 🙏 Acknowledgments

- [Qwen](https://github.com/QwenLM/Qwen) - Powerful open-source LLM
- [Ollama](https://ollama.ai) - Easy local LLM running
- [VS Code API](https://code.visualstudio.com/api) - Extension platform

## 📞 Support

For questions and help:
- 📖 Check the [documentation](https://github.com/salmantoprak/opencode)
- 🐛 Report issues on GitHub
- 💬 Ask in VS Code discussions

---

**Made with ❤️ for developers who value privacy and local AI**
