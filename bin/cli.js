#!/usr/bin/env node

/**
 * @file bin/cli.js
 * @description Sends a Telegram message from the command line.
 * @author Ibrahim Sharif
 * @version 1.0.0
 * @date 2025-05-12
 * @license MIT
 *
 * Usage:
 *   telefy "<message>" [--parse-mode <mode>]
 *   npm run start   "<message>" [--parse-mode <mode>]
 */

import { sendTGMessage } from '../telegramBot.js';

// Display usage instructions
function showUsage() {
  console.log(`
    Usage: telefy <message> [--parse-mode <mode>]

    Send a Telegram notification using your bot.

    Arguments:
      message           The message to send (required, max 4096 characters)
      --parse-mode      Parse mode for the message (Markdown, HTML, MarkdownV2, default: Markdown)

    Examples:
      telefy "Hello, Telegram!"
      telefy "Check *this* out!" --parse-mode MarkdownV2

    Ensure you have a .env file in your project root with:
      TELEGRAM_BOT_TOKEN=your_bot_token
      CHAT_ID=your_chat_id

    See .env.sample for details.
    `);
  process.exit(1);
}

// Parse command-line arguments
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  showUsage();
}

let message = '';
let parseMode = 'Markdown';

// Handle arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--parse-mode' && i + 1 < args.length) {
    parseMode = args[i + 1];
    i++; // Skip the next argument
  } else {
    message += (message ? ' ' : '') + args[i];
  }
}

if (!message) {
  console.error('Error: Message is required.');
  showUsage();
}

// Send the message
async function main() {
  try {
    await sendTGMessage(message, parseMode);
    console.log('Message sent successfully!');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.suggestion) {
      console.error(`Suggestion: ${error.suggestion}`);
    }
    process.exit(1);
  }
}

main();