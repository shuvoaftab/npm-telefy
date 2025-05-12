#!/usr/bin/env node

/**
 * @file bin/cli.js
 * @description Sends a Telegram message from the command line.
 * @author Ibrahim Sharif
 * @version 1.1.0
 * @date 2025-05-13
 * @license MIT
 *
 * Usage:
 *   telefy "<message>" [--channel <name>] [--parse-mode <mode>] [--button <text|url>]
 *   npm run start "<message>" [--channel <name>] [--parse-mode <mode>] [--button <text|url>]
 */

import { sendTGMessage, sendTGMessageWithButtons, getChannels } from '../telegramBot.js';

// Display usage instructions
function showUsage() {
  const channels = getChannels();
  const availableChannels = [...channels.keys()].join(', ') || 'none (configure in .env)';
  console.log(`
Usage: telefy <message> [--channel <name> | --channel=<name> | --all] [--parse-mode <mode>] [--button <text|url>] [--raw]

Send a Telegram notification to one or all configured channels.

Arguments:
  message              The message to send (required, max 4096 characters)
  --channel <name>     Send to a specific channel (e.g., ${availableChannels})
  --channel=<name>     Alternative syntax for specific channel
  --all                Send to all configured channels
  --parse-mode <mode>  Parse mode (markdown, html, markdownv2, default: markdown)
  --parse-mode=<mode>  Parse mode (markdown, html, markdownv2, default: markdown)
  --button <text|url>  Add an inline button (e.g., "Visit|https://example.com")
  --raw                Disable automatic escaping for MarkdownV2

Examples:
  telefy "Hello, Telegram!" --channel news
  telefy "Hello, Telegram!" --channel=news
  telefy "Alert!" --all
  telefy "Check *this* out!" --channel alerts --parse-mode markdownv2
  telefy "Click me!" --channel news --button "Visit|https://example.com"

Ensure you have a .env file in your project root with channel configurations:
  CHANNEL_<name>_TOKEN=your_bot_token
  CHANNEL_<name>_CHAT_ID=your_chat_id

Available channels: ${availableChannels}
See .env.sample for details.
`);
  process.exit(1);
}

// Parse command-line arguments
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  showUsage();
}

let messageParts = [];
let channel = null;
let parseMode = 'Markdown';
let isAll = false;
let buttons = [];
let raw = false;

// Valid options
const validOptions = ['--channel', '--all', '--parse-mode', '--button', '--raw'];

// Handle arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    let [option, value] = arg.split('=');
    if (!validOptions.includes(option)) {
      console.error(`Error: Unknown option "${option}"`);
      showUsage();
    }

    if (option === '--channel') {
      if (value) {
        channel = value;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        channel = args[i + 1];
        i++;
      } else {
        console.error('Error: --channel requires a channel name');
        showUsage();
      }
    } else if (option === '--all') {
      isAll = true;
      channel = 'all';
    } else if (option === '--parse-mode') {
      if (value) {
        parseMode = value;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        parseMode = args[i + 1];
        i++;
      } else {
        console.error('Error: --parse-mode requires a mode (markdown, html, markdownv2)');
        showUsage();
      }
    } else if (option === '--button') {
      let buttonValue = value;
      if (!buttonValue && i + 1 < args.length && !args[i + 1].startsWith('--')) {
        buttonValue = args[i + 1];
        i++;
      }
      if (!buttonValue) {
        console.error('Error: --button requires a value in the format "text|url"');
        showUsage();
      }
      const [text, url] = buttonValue.split('|');
      if (!text || !url) {
        console.error('Error: --button format must be "text|url"');
        showUsage();
      }
      buttons.push([{ text, url }]);
    } else if (option === '--raw') {
      raw = true;
    }
  } else {
    messageParts.push(arg);
  }
}

const message = messageParts.join(' ').trim();
if (!message) {
  console.error('Error: Message is required.');
  showUsage();
}

if (isAll && channel !== 'all') {
  console.error('Error: Cannot use --channel and --all together.');
  showUsage();
}

// Default to the only channel if exactly one is configured
const channels = getChannels();
if (!isAll && !channel && channels.size === 1) {
  channel = [...channels.keys()][0];
}

// Validate channel if specified
if (!isAll && !channel) {
  console.error('Error: Please specify a channel with --channel <name> or use --all.');
  console.error(`Available channels: ${[...channels.keys()].join(', ') || 'none (configure in .env)'}`);
  showUsage();
}

// Map parse modes (case-insensitive)
const parseModes = {
  markdown: 'Markdown',
  html: 'HTML',
  markdownv2: 'MarkdownV2',
};
parseMode = parseModes[parseMode.toLowerCase()];
if (!parseMode) {
  console.error('Error: Invalid parse mode. Use markdown, html, or markdownv2.');
  showUsage();
}

// Escape special characters for MarkdownV2 unless --raw is specified
let finalMessage = message;
if (parseMode === 'MarkdownV2' && !raw) {
  finalMessage = message.replace(/([_*[\]()~`>#+=|{}.!@])/g, '\\$1');
}

// Send the message
async function main() {
  try {
    let results;
    if (buttons.length > 0) {
      results = await sendTGMessageWithButtons(finalMessage, buttons, channel, parseMode);
    } else {
      results = await sendTGMessage(finalMessage, channel, parseMode);
    }
    for (const result of results) {
      console.log(`Message sent successfully to channel "${result.channel}"`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.suggestion) {
      console.error(`Suggestion: ${error.suggestion}`);
    }
    process.exit(1);
  }
}

main();