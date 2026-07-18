import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { email, namaBarang, namaOrganisasi, kegiatan, waktuPinjam, waktuSelesai, status } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email tujuan tidak ditemukan' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"PK. PMII Sunan Ampel Malang" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Notifikasi ${status} Peminjaman - ${namaBarang}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: ${status === 'Disetujui' ? '#059669' : '#dc2626'}; text-align: center;">Pengajuan Peminjaman ${status}!</h2>
          <p>Halo, pengurus/panitia dari <strong>${namaOrganisasi}</strong>,</p>
          <p>Pengajuan peminjaman inventaris Anda untuk kegiatan <strong>${kegiatan}</strong> telah direspon oleh Admin PMII.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Barang:</strong> ${namaBarang}</p>
            <p style="margin: 0 0 10px 0;"><strong>Tanggal Pinjam:</strong> ${waktuPinjam}</p>
            <p style="margin: 0;"><strong>Tenggat Pengembalian:</strong> ${waktuSelesai}</p>
          </div>

          ${status === 'Disetujui' ? `
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px;">
               <p style="margin: 0; color: #047857;"><strong>PENTING:</strong> Harap tunjukkan email ini kepada pengurus/admin saat pengambilan barang sebagai bukti sah bahwa peminjaman Anda telah di-ACC.</p>
            </div>
          ` : `
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 20px;">
               <p style="margin: 0; color: #b91c1c;">Mohon maaf, pengajuan peminjaman Anda ditolak atau jadwal sedang bentrok. Silakan hubungi admin untuk konfirmasi lebih lanjut.</p>
            </div>
          `}

          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">Ini adalah pesan otomatis dari Sistem Administrasi PMII Sunan Ampel Malang. Harap tidak membalas email ini.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Notifikasi email berhasil dikirim!' }, { status: 200 });

  } catch (error) {
    console.error('Error pengiriman email:', error);
    return NextResponse.json({ error: 'Gagal mengirim email notifikasi.' }, { status: 500 });
  }
}