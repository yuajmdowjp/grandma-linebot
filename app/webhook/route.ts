// 極陽春驗活版（先用這個保證 Verify 成功）
export async function POST(req: Request) {
  return new Response('OK', { status: 200 });
}
export const runtime = 'edge';
export const dynamic = 'force-dynamic';