/**
 * @file telegramBot.test.js
 * @description JEST tests for the Telegram bot notification functionality.
 * @description This file contains unit tests for the sendTGMessage function.
 * @description It mocks the axios library to simulate API calls and verify the behavior of the function.
 * @author Ibrahim Sharif
 * @version 1.0.0
 * @date 2025-05-12
 *
 * Usage:
 *   npm run test
 */
import { jest } from '@jest/globals';
import { sendTGMessage } from '../telegramBot.js';
import axios from 'axios';

jest.mock('axios');
axios.post = jest.fn();

describe('sendTGMessage', () => {
  it('sends a message successfully', async () => {
    axios.post.mockResolvedValue({ data: { ok: true } });
    const result = await sendTGMessage('Test');
    expect(result.ok).toBe(true);
  });
});