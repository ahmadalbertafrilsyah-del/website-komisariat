import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Portal Berita PMII';

    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', color: 'white', padding: '60px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '30px', fontWeight: 'bold', color: '#60a5fa' }}>PMII Sunan Ampel Malang</span>
          </div>
          <h1 style={{ fontSize: '64px', fontWeight: 'black', lineHeight: 1.2, margin: 0, maxWidth: '900px' }}>
            {title}
          </h1>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e) {
    return new Response(`Gagal menghasilkan gambar`, { status: 500 });
  }
}