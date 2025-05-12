/**
 * @file telegramBot.js
 * @description A simple Telegram bot API wrapper for sending messages and inline buttons.
 * @description This module provides functions to send messages with optional markdown formatting and inline buttons.
 * @description It handles errors gracefully and provides suggestions for common issues.
 * @description It uses the Telegram Bot API and Axios for HTTP requests.
 * @author Ibrahim Sharif
 * @version 1.1.0
 * @date 2025-05-12
 * @license MIT
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

// Load and validate channel configurations
const channels = new Map();
const envKeys = Object.keys(process.env);
for (const key of envKeys) {
  if (key.startsWith('CHANNEL_') && key.endsWith('_TOKEN')) {
    const channelName = key.slice(8, -6).toLowerCase(); // Extract name from CHANNEL_<name>_TOKEN
    const token = process.env[key];
    const chatIdKey = `CHANNEL_${channelName.toUpperCase()}_CHAT_ID`;
    const chatId = process.env[chatIdKey];

    if (!token) {
      throw new TelegramBotError(
        `Invalid token for channel "${channelName}"`,
        `Ensure ${key} is set in your .env file.`
      );
    }
    if (!chatId) {
      throw new TelegramBotError(
        `Missing chat ID for channel "${channelName}"`,
        `Set ${chatIdKey} in your .env file. See .env.sample for details.`
      );
    }

    channels.set(channelName, { token, chatId, baseUrl: `https://api.telegram.org/bot${token}` });
  }
}

if (channels.size === 0) {
  throw new TelegramBotError(
    'No channels configured',
    'Add at least one channel with CHANNEL_<name>_TOKEN and CHANNEL_<name>_CHAT_ID in your .env file. See .env.sample.'
  );
}

/**
 * Get all configured channels.
 * @returns {Map<string, {token: string, chatId: string, baseUrl: string}>} Map of channel configurations.
 */
function getChannels() {
  return channels;
}

/**
 * Send a simple text message to one or all channels.
 * @param {string} text - Message text (max 4096 characters).
 * @param {string} [channel='all'] - Target channel name or 'all' for all channels.
 * @param {string} [parseMode='Markdown'] - Parse mode ('Markdown', 'HTML', 'MarkdownV2').
 * @returns {Promise<Object[]>} Array of Telegram API responses.
 * @throws {TelegramBotError} If validation or API call fails.
 */
async function sendTGMessage(text, channel = 'all', parseMode = 'Markdown') {
  // Validate inputs
  validateInputs(text, parseMode);

  const targetChannels = getTargetChannels(channel);
  const results = [];

  for (const [channelName, config] of targetChannels) {
    try {
      const response = await axios.post(`${config.baseUrl}/sendMessage`, {
        chat_id: config.chatId,
        text,
        parse_mode: parseMode,
      });
      results.push({ channel: channelName, response: response.data });
    } catch (error) {
      throw handleAxiosError(error, channelName);
    }
  }

  return results;
}

/**
 * Send a message with inline buttons to one or all channels.
 * @param {string} text - Message text (max 4096 characters).
 * @param {Array<Array<{text: string, url: string}>>} [buttons=[[]]] - Inline keyboard buttons.
 * @param {string} [channel='all'] - Target channel name or 'all' for all channels.
 * @param {string} [parseMode='Markdown'] - Parse mode ('Markdown', 'HTML', 'MarkdownV2').
 * @returns {Promise<Object[]>} Array of Telegram API responses.
 * @throws {TelegramBotError} If validation or API call fails.
 */
async function sendTGMessageWithButtons(text, buttons = [[]], channel = 'all', parseMode = 'Markdown') {
  // Validate inputs
  validateInputs(text, parseMode);
  validateButtons(buttons);

  const targetChannels = getTargetChannels(channel);
  const results = [];

  for (const [channelName, config] of targetChannels) {
    try {
      const response = await axios.post(`${config.baseUrl}/sendMessage`, {
        chat_id: config.chatId,
        text,
        parse_mode: parseMode,
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
      results.push({ channel: channelName, response: response.data });
    } catch (error) {
      throw handleAxiosError(error, channelName);
    }
  }

  return results;
}

/**
 * Validate text and parseMode inputs.
 * @param {string} text - Message text.
 * @param {string} parseMode - Parse mode.
 * @throws {TelegramBotError} If validation fails.
 */
function validateInputs(text, parseMode) {
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
}

/**
 * Validate buttons array.
 * @param {Array<Array<{text: string, url: string}>>} buttons - Inline keyboard buttons.
 * @throws {TelegramBotError} If validation fails.
 */
function validateButtons(buttons) {
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
}

/**
 * Get target channels based on the channel parameter.
 * @param {string} channel - Channel name or 'all'.
 * @returns {Map<string, {token: string, chatId: string, baseUrl: string}>} Map of target channels.
 * @throws {TelegramBotError} If channel is invalid.
 */
function getTargetChannels(channel) {
  if (channel === 'all') {
    return channels;
  }
  const channelName = channel.toLowerCase();
  if (!channels.has(channelName)) {
    throw new TelegramBotError(
      `Channel "${channelName}" not found`,
      `Available channels: ${[...channels.keys()].join(', ')}. Check your .env file.`
    );
  }
  return new Map([[channelName, channels.get(channelName)]]);
}

/**
 * Handle Axios errors and throw TelegramBotError with specific messages.
 * @param {Error} error - Axios error object.
 * @param {string} channelName - Channel name.
 * @returns {TelegramBotError} Specific error with suggestion.
 */
function handleAxiosError(error, channelName) {
  if (error.response) {
    const { status, data } = error.response;
    const telegramError = data.description || 'Unknown Telegram API error';

    if (status === 400) {
      return new TelegramBotError(
        `Bad Request on channel "${channelName}": ${telegramError}`,
        'Check your message content, parse mode, or button format.'
      );
    } else if (status === 401) {
      return new TelegramBotError(
        `Unauthorized on channel "${channelName}": ${telegramError}`,
        `Verify the bot token for channel "${channelName}" in your .env file.`
      );
    } else if (status === 403) {
      return new TelegramBotError(
        `Forbidden on channel "${channelName}": ${telegramError}`,
        `Ensure the bot has permission to send messages to the chat ID for channel "${channelName}".`
      );
    } else if (status === 404) {
      return new TelegramBotError(
        `Not Found on channel "${channelName}": ${telegramError}`,
        `Check if the chat ID for channel "${channelName}" is valid and the bot is added to the chat.`
      );
    } else {
      return new TelegramBotError(
        `Telegram API error on channel "${channelName}": ${telegramError} (Status: ${status})`,
        'Check the Telegram API documentation for details.'
      );
    }
  } else if (error.request) {
    return new TelegramBotError(
      `Network error on channel "${channelName}": Could not connect to Telegram API`,
      'Check your internet connection or try again later.'
    );
  } else {
    return new TelegramBotError(
      `Unexpected error on channel "${channelName}": ${error.message}`,
      'Check your code or report this issue to the package maintainer.'
    );
  }
}

export {
  getChannels,
  sendTGMessage,
  sendTGMessageWithButtons,
};