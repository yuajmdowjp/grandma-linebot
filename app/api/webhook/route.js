// app/api/webhook/route.js
import crypto from 'crypto';

// 驗簽函式
function validateSignature(body, channelSecret, signature) {
  if (!signature) return false;
  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(body, 'utf8')
    .digest('base64');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

// LINE 會用 POST 打這個 endpoint
export async function POST(req) {
  const body = await req.text(); // 一定要用 text()
  const signature = req.headers.get('x-line-signature') || '';

  // 驗簽失敗 → 回 400
  if (!validateSignature(body, process.env.LINE_CHANNEL_SECRET, signature)) {
    return new Response('Invalid signature', { status: 400 });
  }

  // 先不處理任何邏輯，只要能回 200 讓 Verify 過關
  return new Response('OK', { status: 200 });
}

// 可選：給自己測試用，GET /api/webhook 會回 200 OK
export async function GET() {
  return new Response('OK', { status: 200 });
}

// Next.js 設定
export const runtime = 'nodejs';        // 用 Node runtime，比較好用 crypto
export const dynamic = 'force-dynamic';
