/**
 * @file telegramBot.js
 * @description A simple Telegram bot API wrapper for sending messages and inline buttons.
 * @description This module provides functions to send messages with optional markdown formatting and inline buttons.
 * @description It handles errors gracefully and provides suggestions for common issues.
 * @description It uses the Telegram Bot API and Axios for HTTP requests.
 * @author Ibrahim Sharif
 * @version 1.0.0
 * @date 2025-05-12
 *
 * Usage:
 *   1. sendTGMessage('Hello, World!') - Sends a simple text message.
 *   2. sendTGMessageWithButtons('Click me!', [[{ text: 'Visit', url: 'https://example.com' }]]) - Sends a message with inline buttons.
 *   3. getBaseUrl() - Returns the base URL for the Telegram API.
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Custom error class for Telegram bot errors
class TelegramBotError extends Error {
  constructor(message, suggestion = '') {
    super(message);
    this.name = 'TelegramBotError';
    this.suggestion = suggestion;
  }
}

// Validate environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!TELEGRAM_BOT_TOKEN) {
  throw new TelegramBotError(
    'TELEGRAM_BOT_TOKEN is not defined',
    'Add TELEGRAM_BOT_TOKEN to your .env file. See .env.sample for details.'
  );
}
if (!CHAT_ID) {
  throw new TelegramBotError(
    'CHAT_ID is not defined',
    'Add CHAT_ID to your .env file. See .env.sample for details.'
  );
}

const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Get the Telegram API base URL.
 * @returns {string} The base URL for the Telegram API.
 */
function getBaseUrl() {
  return BASE_URL;
}

/**
 * Send a simple text message (optional markdown).
 * @param {string} text - Message text (max 4096 characters).
 * @param {string} [parseMode='Markdown'] - Parse mode ('Markdown', 'HTML', 'MarkdownV2').
 * @returns {Promise<Object>} Telegram API response.
 * @throws {TelegramBotError} If validation or API call fails.
 */
async function sendTGMessage(text, parseMode = 'Markdown') {
  // Validate inputs
  if (!text || typeof text !== 'string') {
    throw new TelegramBotError(
      'Text parameter must be a non-empty string',
      'Provide a valid message text.'
    );
  }
  if (text.length > 4096) {
    throw new TelegramBotError(
      'Message text exceeds 4096 characters',
      'Shorten the message to 4096 characters or less.'
    );
  }
  const validParseModes = ['Markdown', 'HTML', 'MarkdownV2'];
  if (!validParseModes.includes(parseMode)) {
    throw new TelegramBotError(
      `Invalid parseMode: ${parseMode}`,
      `Use one of: ${validParseModes.join(', ')}.`
    );
  }

  try {
    const response = await axios.post(`${BASE_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text,
      parse_mode: parseMode,
    });
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

/**
 * Send a message with inline buttons.
 * Buttons = array of arrays: [[{ text: 'Visit', url: 'https://example.com' }]]
 * @param {string} text - Message text (max 4096 characters).
 * @param {Array<Array<{text: string, url: string}>>} [buttons=[[]]] - Inline keyboard buttons.
 * @param {string} [parseMode='Markdown'] - Parse mode ('Markdown', 'HTML', 'MarkdownV2').
 * @returns {Promise<Object>} Telegram API response.
 * @throws {TelegramBotError} If validation or API call fails.
 */
async function sendTGMessageWithButtons(text, buttons = [[]], parseMode = 'Markdown') {
  // Validate inputs
  if (!text || typeof text !== 'string') {
    throw new TelegramBotError(
      'Text parameter must be a non-empty string',
      'Provide a valid message text.'
    );
  }
  if (text.length > 4096) {
    throw new TelegramBotError(
      'Message text exceeds 4096 characters',
      'Shorten the message to 4096 characters or less.'
    );
  }
  const validParseModes = ['Markdown', 'HTML', 'MarkdownV2'];
  if (!validParseModes.includes(parseMode)) {
    throw new TelegramBotError(
      `Invalid parseMode: ${parseMode}`,
      `Use one of: ${validParseModes.join(', ')}.`
    );
  }
  if (!Array.isArray(buttons)) {
    throw new TelegramBotError(
      'Buttons must be an array of arrays',
      'Provide buttons in the format: [[{ text: "Button", url: "https://example.com" }]].'
    );
  }
  for (const row of buttons) {
    if (!Array.isArray(row)) {
      throw new TelegramBotError(
        'Each button row must be an array',
        'Ensure buttons is an array of arrays.'
      );
    }
    for (const button of row) {
      if (!button.text || !button.url) {
        throw new TelegramBotError(
          'Each button must have text and url properties',
          'Example: { text: "Visit", url: "https://example.com" }.'
        );
      }
    }
  }

  try {
    const response = await axios.post(`${BASE_URL}/sendMessage`, {
      chat_id: CHAT_ID,
      text,
      parse_mode: parseMode,
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
    return response.data;
  } catch (error) {
    handleAxiosError(error);
  }
}

/**
 * Handle Axios errors and throw TelegramBotError with specific messages.
 * @param {Error} error - Axios error object.
 * @throws {TelegramBotError} With specific error message and suggestion.
 */
function handleAxiosError(error) {
  if (error.response) {
    // Telegram API returned an error
    const { status, data } = error.response;
    const telegramError = data.description || 'Unknown Telegram API error';

    if (status === 400) {
      throw new TelegramBotError(
        `Bad Request: ${telegramError}`,
        'Check your message content, parse mode, or button format.'
      );
    } else if (status === 401) {
      throw new TelegramBotError(
        `Unauthorized: ${telegramError}`,
        'Verify your TELEGRAM_BOT_TOKEN is correct in the .env file.'
      );
    } else if (status === 403) {
      throw new TelegramBotError(
        `Forbidden: ${telegramError}`,
        'Ensure the bot has permission to send messages to the specified CHAT_ID.'
      );
    } else if (status === 404) {
      throw new TelegramBotError(
        `Not Found: ${telegramError}`,
        'Check if the CHAT_ID is valid and the bot is added to the chat.'
      );
    } else {
      throw new TelegramBotError(
        `Telegram API error: ${telegramError} (Status: ${status})`,
        'Check the Telegram API documentation for details.'
      );
    }
  } else if (error.request) {
    // No response received (network error)
    throw new TelegramBotError(
      'Network error: Could not connect to Telegram API',
      'Check your internet connection or try again later.'
    );
  } else {
    // Other errors (e.g., Axios setup)
    throw new TelegramBotError(
      `Unexpected error: ${error.message}`,
      'Check your code or report this issue to the package maintainer.'
    );
  }
}

export {
  getBaseUrl,
  sendTGMessage,
  sendTGMessageWithButtons,
};