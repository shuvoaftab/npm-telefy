# telefy

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/shuvoaftab/npm-telefy/blob/main/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/telefy.svg)](https://www.npmjs.com/package/telefy)

A simple but robust npm package to send Telegram notifications via a bot, with CLI support for Node.js applications. Perfect for server notifications, alerts, and automated messages.

## Screenshots

Here are some screenshots showcasing the usage of **telefy**:

### Sending a Message

![Message Example](assets/images/telefy-message.jpg)

### CLI Help Command

![Help Command](assets/images/telefy-help.jpg)

### Running Tests

![Test Example](assets/images/telefy-test.jpg)

## Features

- 📤 **Simple API**: Easy-to-use functions for sending Telegram messages
- 🔘 **Inline Buttons**: Support for adding clickable inline URL buttons
- 📝 **Markdown Support**: Format messages with Markdown, HTML, or MarkdownV2
- 💻 **CLI Tool**: Send messages directly from your command line
- 🚀 **Promise-based**: Modern async/await and Promise support
- 🛡️ **Error Handling**: Detailed error messages with helpful suggestions
- ⚙️ **Environment Variables**: Secure configuration using .env files

## Prerequisites

Before using this package, you'll need:

1. A Telegram Bot Token (get one from [@BotFather](https://t.me/BotFather))
2. Your Chat ID (use [@userinfobot](https://t.me/userinfobot) or [@get_id_bot](https://t.me/get_id_bot))
3. Node.js version 18.0.0 or higher

## Installation

```bash
npm install -g telefy
```

## Configuration

Create a `.env` file in your project root:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
CHAT_ID=your_chat_id_here
```

## Get TELEGRAM_BOT_TOKEN and CHAT_ID

You can easily integrate Telegram notifications into your Node.js app using a Telegram Bot. Here's a step-by-step guide:

### ✅ **Step 1: Create a Telegram Bot**

1. Open Telegram and search for `@BotFather`.
2. Send `/start` then `/newbot`.
3. Follow the prompts to set a name and username.
4. Copy the **Bot Token** you receive.

### ✅ **Step 2: Get Your Chat ID**

1. Start a chat with your new bot on Telegram.
2. Visit this URL in a browser:

```bash
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

3. Send a message to your bot (e.g., "Hi").
4. Check back the JSON response in the browser for `"chat":{"id":YOUR_CHAT_ID}`.

## Usage

### As a Module

```javascript
// ES Module import
import { sendTGMessage, sendTGMessageWithButtons } from 'telefy';

// Send a simple message
sendTGMessage('Hello from my application!')
  .then(() => console.log('Message sent!'))
  .catch(err => console.error('Error:', err.message));

// Send a message with formatting (Markdown)
sendTGMessage('*Bold text* and _italic text_')
  .then(() => console.log('Formatted message sent!'))
  .catch(err => console.error('Error:', err.message));

// Send a message with buttons
const buttons = [
  [
    { text: '📝 Documentation', url: 'https://github.com/shuvoaftab/npm-telefy/docs' },
    { text: '💻 GitHub', url: 'https://github.com/shuvoaftab/npm-telefy' }
  ],
  [
    { text: '🌐 Website', url: 'https://ibrahimsharif.com' }
  ]
];

sendTGMessageWithButtons('Check out these links:', buttons)
  .then(() => console.log('Message with buttons sent!'))
  .catch(err => console.error('Error:', err.message));
```

### Using the CLI Tool

```bash
# Basic usage
telefy "Hello from CLI!"

# With Markdown formatting
telefy "*Important* message with _formatting_"

# With HTML formatting
telefy "<b>Important</b> message with <i>formatting</i>" --parse-mode HTML
```

You can also use npx:

```bash
npx telefy "System alert: Server restarted successfully!"
```

## API Reference

### sendTGMessage(text, parseMode)

Sends a simple text message to Telegram.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| text | string | (required) | Message text (max 4096 characters) |
| parseMode | string | 'Markdown' | Parse mode ('Markdown', 'HTML', 'MarkdownV2') |

Returns: Promise resolving to the Telegram API response

### sendTGMessageWithButtons(text, buttons, parseMode)

Sends a message with inline URL buttons to Telegram.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| text | string | (required) | Message text (max 4096 characters) |
| buttons | Array | [[]] | Array of button rows, each containing button objects with text and url properties |
| parseMode | string | 'Markdown' | Parse mode ('Markdown', 'HTML', 'MarkdownV2') |

Returns: Promise resolving to the Telegram API response

Button format:
```javascript
[
  [{ text: 'Button 1', url: 'https://example.com' }, { text: 'Button 2', url: 'https://example.org' }],
  [{ text: 'Button 3', url: 'https://example.net' }]
]
```

### getBaseUrl()

Returns the base URL for the Telegram API with your bot token.

## Telegram Formatting

### Markdown (Default)

```
*bold text*
_italic text_
`monospace`
[text](URL)
```

### HTML

```
<b>bold text</b>
<i>italic text</i>
<code>monospace</code>
<a href="URL">text</a>
```

### MarkdownV2

```
*bold text*
_italic text_
`monospace`
[text](URL)
```

Note: MarkdownV2 requires escaping special characters with a backslash: \_, \*, \[, \], \(, \), \~, \`, \>, \#, \+, \-, \=, \|, \{, \}, \., \!

## Error Handling

The package provides detailed error messages and suggestions:

```javascript
try {
  await sendTGMessage('Your message');
} catch (error) {
  console.error(`Error: ${error.message}`);
  console.error(`Suggestion: ${error.suggestion}`);
}
```

## CLI Options

```
telefy <message> [--parse-mode <mode>]
```

| Option | Default | Description |
|--------|---------|-------------|
| message | (required) | The message to send (max 4096 characters) |
| --parse-mode | Markdown | Parse mode for the message (Markdown, HTML, MarkdownV2) |

## Use Cases

- Server status notifications
- Application alerts
- Deployment notifications
- Cron job results
- Error reporting
- Database backup confirmations
- User registration notifications
- Order processing updates

## Example: Integration with Express.js

```javascript
import express from 'express';
import { sendTGMessage } from 'telefy';

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  
  // Send Telegram notification when server starts
  sendTGMessage(`🚀 *Server Started*\nThe application server is now running on port ${port}`)
    .then(() => console.log('Start notification sent'))
    .catch(err => console.error('Failed to send notification:', err.message));
});

// Error notification middleware
app.use((err, req, res, next) => {
  sendTGMessage(`❌ *Error Detected*\n\`\`\`\n${err.stack}\n\`\`\``)
    .catch(console.error);
  
  res.status(500).send('Something broke!');
});
```

## Running Tests

```bash
npm run test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository: (`git clone https://github.com/shuvoaftab/npm-telefy.git`)
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Ibrahim Sharif - [Website](https://ibrahimsharif.com)

## Acknowledgements

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Axios](https://axios-http.com/)
- [dotenv](https://github.com/motdotla/dotenv)