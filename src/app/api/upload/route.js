import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    // Ubah file menjadi format Buffer agar bisa dibaca Node.js
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Proses upload ke Cloudinary secara asinkronus
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'pmii_komisariat' }, // Nama folder di Cloudinary
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    // Kembalikan URL gambar/file yang sudah online
    return NextResponse.json({ url: result.secure_url }, { status: 200 });

  } catch (error) {
    console.error('Error uploading to cloudinary:', error);
    return NextResponse.json({ error: 'Gagal mengunggah file' }, { status: 500 });
  }
}