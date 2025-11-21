// app/api/line/webhook/route.ts
import { createClient } from '@libsql/client';
import crypto from 'crypto';

// 黑客松專用驗簽（永遠不會壞版）
function lineVerifySignature(body: string, channelSecret: string, signature: string): boolean {
  const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-line-signature') ?? '';

  // 驗簽
  if (!lineVerifySignature(body, process.env.LINE_CHANNEL_SECRET!, signature)) {
    return new Response('Invalid signature', { status: 400 });
  }

// 黑客松救命神招：直接用 any 跳過 TypeScript 檢查（現場最常用）
const payload: any = await request.json();
const events = payload.events || [];
const event = events[0];

if (!event) {
  return new Response('No event', { status: 200 });
}

  if (event.type === 'postback') {
    const data = event.postback.data;

    if (data === 'ORDER_LOW_SUGAR') {
      await turso.execute({
        sql: `INSERT INTO orders (user_id, meal_type, status, created_at) 
              VALUES (?, ?, 'pending', datetime('now', '+8 hours'))`,
        args: [event.source.userId, 'low_sugar'],
      });

      await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          replyToken: event.replyToken,
          messages: [{
            type: 'text',
            text: '阿嬤～您的低醣餐訂好囉！\n預計12:00前送到喔❤️',
          }],
        }),
      });
    }
  }

  return new Response('OK');
}

export const runtime = 'edge';  // 超重要！一定要加這行