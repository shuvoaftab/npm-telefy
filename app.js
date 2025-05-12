/**
 * @file app.js
 * @description A simple Telegram bot notification example.
 * @description This script demonstrates how to send a Telegram message using the Telegram Bot API.
 * @description It uses the sendTGMessage and sendTGMessageWithButtons functions from telegramBot.js.
 * @author Ibrahim Sharif
 * @version 1.1.0
 * @date 2025-05-12
 * @license MIT
 * 
 */

import { sendTGMessage, sendTGMessageWithButtons } from 'telefy';

function sendTelegramNotification() {
  const result = 1;

  if (result === 1) {
    // Markdown message
    sendTGMessage('*Alert:* `Working({})` successfully: *1*')
      .then(() => console.log('Markdown message sent.'))
      .catch(console.error);

    // Buttons
    const buttons = [
      [
        { text: '💼 Experiences', url: 'https://ibrahimsharif.com/#resume' },
        { text: '🎁 Skillset', url: 'https://ibrahimsharif.com/#skillset' }
      ]
    ];
    sendTGMessageWithButtons('*Read the docs:*', buttons)
      .then(() => console.log('Message with buttons sent.'))
      .catch(console.error);
  }
}

sendTelegramNotification();