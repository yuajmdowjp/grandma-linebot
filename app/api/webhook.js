// app/api/webhook/route.js
import crypto from 'crypto';

// 最強驗簽函式（黑客松救命版）
function validateSignature(body, channelSecret, signature) {
  if (!signature) return false;
  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(body, 'utf8')
    .digest('base64');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

// 主程式
export async function POST(req) {
  const body = await req.text();                                   // 關鍵！一定要用 text()
  const signature = req.headers.get('x-line-signature') || '';

  // 驗簽失敗直接 400
  if (!validateSignature(body, process.env.LINE_CHANNEL_SECRET, signature)) {
    return new Response('Invalid signature', { status: 400 });
  }

  // 這裡先不處理任何邏輯，只回 200（先讓 Verify 過最重要）
  // 等 Verify 綠燈後你再慢慢加 postback、訂餐、Turso 之類的
  return new Response('OK', { status: 200 });
}

// 下面這兩行絕對不能少！！
export const runtime = 'edge';
export const dynamic = 'force-dynamic';