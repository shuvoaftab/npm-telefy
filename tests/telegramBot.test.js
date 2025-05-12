/**
 * @file telegramBot.test.js
 * @description Jest tests for the Telegram bot notification functionality.
 * @description This file contains unit tests for sendTGMessage, sendTGMessageWithButtons, and getChannels functions.
 * @description It mocks the axios and dotenv libraries to simulate API calls and environment setup.
 * @author Ibrahim Sharif
 * @version 1.1.0
 * @date 2025-05-14
 * @license MIT
 *
 * Usage:
 *   npm run test
 */
import { jest } from '@jest/globals';
import axios from 'axios';
import dotenv from 'dotenv';

// Mock dotenv.config before importing telegramBot.js
jest.spyOn(dotenv, 'config').mockImplementation(() => {});
import { sendTGMessage, sendTGMessageWithButtons, getChannels } from '../telegramBot.js';

describe('Telegram Bot Functions', () => {
  let axiosPostSpy;
  const originalEnv = { ...process.env };
  const channel1 = { name: 'news', token: '123:ABC', chatId: '123456' };
  const channel2 = { name: 'alert', token: '789:XYZ', chatId: '789012' };

  beforeEach(() => {
    // Reset process.env to avoid test interference
    process.env = { ...originalEnv };
    process.env[`CHANNEL_${channel1.name.toUpperCase()}_TOKEN`] = channel1.token;
    process.env[`CHANNEL_${channel1.name.toUpperCase()}_CHAT_ID`] = channel1.chatId;
    process.env[`CHANNEL_${channel2.name.toUpperCase()}_TOKEN`] = channel2.token;
    process.env[`CHANNEL_${channel2.name.toUpperCase()}_CHAT_ID`] = channel2.chatId;

    // Spy on axios.post for controlled mocking
    axiosPostSpy = jest.spyOn(axios, 'post').mockClear();

    // Ensure dotenv.config is mocked
    jest.spyOn(dotenv, 'config').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  describe('sendTGMessage', () => {
    it('sends message to a specific channel', async () => {
      axiosPostSpy.mockResolvedValue({ data: { ok: true } });
      const result = await sendTGMessage('Hello', channel1.name);
      expect(result).toEqual([{ channel: channel1.name, response: { ok: true } }]);
      expect(axiosPostSpy).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${channel1.token}/sendMessage`,
        { chat_id: channel1.chatId, text: 'Hello', parse_mode: 'Markdown' }
      );
    });

    it('sends message to all channels', async () => {
      // Mock success for news, error for alerts (invalid token)
      axiosPostSpy
        .mockResolvedValueOnce({ data: { ok: true } })
        .mockRejectedValueOnce({
          response: { status: 401, data: { description: 'Unauthorized' } },
        });
      await expect(sendTGMessage('Hello to all', 'all')).rejects.toMatchObject({
        name: 'TelegramBotError',
        message: `Unauthorized on channel "${channel2.name}": Unauthorized`,
        suggestion: `Verify the bot token for channel "${channel2.name}" in your .env file.`,
      });
      expect(axiosPostSpy).toHaveBeenCalledTimes(2);
      expect(axiosPostSpy).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${channel1.token}/sendMessage`,
        { chat_id: channel1.chatId, text: 'Hello to all', parse_mode: 'Markdown' }
      );
      expect(axiosPostSpy).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${channel2.token}/sendMessage`,
        { chat_id: channel2.chatId, text: 'Hello to all', parse_mode: 'Markdown' }
      );
    });

    it('throws error when text is missing', async () => {
      await expect(sendTGMessage('', channel1.name)).rejects.toMatchObject({
        name: 'TelegramBotError',
        message: 'Text parameter must be a non-empty string',
        suggestion: 'Provide a valid message text.',
      });
    });

    it('throws error for invalid parse mode', async () => {
      await expect(sendTGMessage('Hello', channel1.name, 'INVALID')).rejects.toMatchObject({
        name: 'TelegramBotError',
        message: 'Invalid parseMode: INVALID',
        suggestion: 'Use one of: Markdown, HTML, MarkdownV2.',
      });
    });

    it('throws error for text exceeding 4096 characters', async () => {
      const longText = 'a'.repeat(4097);
      await expect(sendTGMessage(longText, channel1.name)).rejects.toMatchObject({
        name: 'TelegramBotError',
        message: 'Message text exceeds 4096 characters',
        suggestion: 'Shorten the message to 4096 characters or less.',
      });
    });

    it('throws error for unknown channel', async () => {
      await expect(sendTGMessage('Hello', 'unknown')).rejects.toMatchObject({
        name: 'TelegramBotError',
        message: 'Channel "unknown" not found',
        suggestion: expect.stringContaining(`Available channels: ${channel1.name}, ${channel2.name}.`),
      });
    });

    it('throws error when no channels are configured', async () => {
      jest.resetModules(); // Clear module cache
      process.env = { ...originalEnv }; // Clear environment variables
      jest.spyOn(dotenv, 'config').mockImplementation(() => {});
      const { sendTGMessage } = await import('../telegramBot.js');
      await expect(sendTGMessage('Hello', 'all')).rejects.toMatchObject({
        name: 'TelegramBotError',
        message: 'No channels configured',
        suggestion: expect.stringContaining('Add at least one channel'),
      });
    });

    it('handles 400 Bad Request from Telegram API', async () => {
      axiosPostSpy.mockRejectedValue({
        response: { status: 400, data: { description: 'Bad Request: chat not found' } },
      });
      await expect(sendTGMessage('Hi', channel1.name)).rejects.toMatchObject({
        name: 'TelegramBotError',
        message: `Bad Request on channel "${channel1.name}": Bad Request: chat not found`,
        suggestion: 'Check your message content, parse mode, or button format.',
      });
    });

    it('handles 401 Unauthorized from Telegram API', async () => {
      axiosPostSpy.mockRejectedValue({
        response: { status: 401, data: { description: 'Unauthorized' } },
      });
      await expect(sendTGMessage('Hi', channel1.name)).rejects.toMatchObject({
        name: 'TelegramBotError',
        message: `Unauthorized on channel "${channel1.name}": Unauthorized`,
        suggestion: `Verify the bot token for channel "${channel1.name}" in your .env file.`,
      });
    });

    it('handles 403 Forbidden from Telegram API', async () => {
      axiosPostSpy.mockRejectedValue({
        response: { status: 403, data: { description: 'Forbidden' } },
      });
      await expect(sendTGMessage('Hi', channel1.name)).rejects.toMatchObject({
        name: 'TelegramBotError',
        message: `Forbidden on channel "${channel1.name}": Forbidden`,
        suggestion: `Ensure the bot has permission to send messages to the chat ID for channel "${channel1.name}".`,
      });
    });

    it('handles 404 Not Found from Telegram API', async () => {
      axiosPostSpy.mockRejectedValue({
        response: { status: 404, data: { description: 'Not Found' } },
      });
      await expect(sendTGMessage('Hi', channel1.name)).rejects.toMatchObject({
        name: 'TelegramBotError',
        message: `Not Found on channel "${channel1.name}": Not Found`,
        suggestion: `Check if the chat ID for channel "${channel1.name}" is valid and the bot is added to the chat.`,
      });
    });

    it('handles network errors (no response)', async () => {
      axiosPostSpy.mockRejectedValue({ request: {} });
      await expect(sendTGMessage('Hi', channel1.name)).rejects.toMatchObject({
        name: 'TelegramBotError',
        message: `Network error on channel "${channel1.name}": Could not connect to Telegram API`,
        suggestion: 'Check your internet connection or try again later.',
      });
    });

    it('handles unexpected errors', async () => {
      axiosPostSpy.mockRejectedValue(new Error('Unexpected failure'));
      await expect(sendTGMessage('Hi', channel1.name)).rejects.toMatchObject({
        name: 'TelegramBotError',
        message: `Unexpected error on channel "${channel1.name}": Unexpected failure`,
        suggestion: 'Check your code or report this issue to the package maintainer.',
      });
    });
  });

  describe('sendTGMessageWithButtons', () => {
    it('sends message with buttons to a specific channel', async () => {
      axiosPostSpy.mockResolvedValue({ data: { ok: true } });
      const buttons = [[{ text: 'Visit', url: 'https://example.com' }]];
      const result = await sendTGMessageWithButtons('Click me!', buttons, channel1.name);
      expect(result).toEqual([{ channel: channel1.name, response: { ok: true } }]);
      expect(axiosPostSpy).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${channel1.token}/sendMessage`,
        {
          chat_id: channel1.chatId,
          text: 'Click me!',
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons },
        }
      );
    });

    it('sends message with buttons to all channels', async () => {
      // Mock success for news, error for alerts (invalid token)
      axiosPostSpy
        .mockResolvedValueOnce({ data: { ok: true } })
        .mockRejectedValueOnce({
          response: { status: 401, data: { description: 'Unauthorized' } },
        });
      const buttons = [[{ text: 'Visit', url: 'https://example.com' }]];
      await expect(sendTGMessageWithButtons('Click me!', buttons, 'all')).rejects.toMatchObject({
        name: 'TelegramBotError',
        message: `Unauthorized on channel "${channel2.name}": Unauthorized`,
        suggestion: `Verify the bot token for channel "${channel2.name}" in your .env file.`,
      });
      expect(axiosPostSpy).toHaveBeenCalledTimes(2);
      expect(axiosPostSpy).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${channel1.token}/sendMessage`,
        {
          chat_id: channel1.chatId,
          text: 'Click me!',
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons },
        }
      );
      expect(axiosPostSpy).toHaveBeenCalledWith(
        `https://api.telegram.org/bot${channel2.token}/sendMessage`,
        {
          chat_id: channel2.chatId,
          text: 'Click me!',
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons },
        }
      );
    });

    it('throws error for invalid buttons format', async () => {
      await expect(sendTGMessageWithButtons('Click me!', 'invalid', channel1.name)).rejects.toMatchObject({
        name: 'TelegramBotError',
        message: 'Buttons must be an array of arrays',
        suggestion: 'Provide buttons in the format: [[{ text: "Button", url: "https://example.com" }]].',
      });
    });

    it('throws error for button missing text or url', async () => {
      const buttons = [[{ text: 'Visit' }]]; // Missing url
      await expect(sendTGMessageWithButtons('Click me!', buttons, channel1.name)).rejects.toMatchObject({
        name: 'TelegramBotError',
        message: 'Each button must have text and url properties',
        suggestion: 'Example: { text: "Visit", url: "https://example.com" }.',
      });
    });
  });

  describe('getChannels', () => {
    it('returns a Map of configured channels', () => {
      const channels = getChannels();
      expect(channels).toBeInstanceOf(Map);
      expect(channels.size).toBe(2);
      expect(channels.has(channel1.name)).toBe(true);
      expect(channels.has(channel2.name)).toBe(true);
      expect(channels.get(channel1.name)).toEqual({
        token: channel1.token,
        chatId: channel1.chatId,
        baseUrl: `https://api.telegram.org/bot${channel1.token}`,
      });
      expect(channels.get(channel2.name)).toEqual({
        token: channel2.token,
        chatId: channel2.chatId,
        baseUrl: `https://api.telegram.org/bot${channel2.token}`,
      });
    });
  });
});