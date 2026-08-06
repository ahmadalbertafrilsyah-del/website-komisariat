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
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f2f5f7; padding: 30px 10px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.05);">
            
            <!-- Header E-Ticket -->
            <div style="background-color: ${status === 'Disetujui' ? '#1ba0e2' : '#dc2626'}; color: #ffffff; padding: 25px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px;">E-TICKET PEMINJAMAN</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Status: <strong>${status.toUpperCase()}</strong></p>
            </div>

            <!-- Body E-Ticket -->
            <div style="padding: 30px;">
              <p style="color: #475569; font-size: 15px; margin-top: 0;">Halo, Pengurus/Panitia <strong>${namaOrganisasi}</strong>,</p>
              <p style="color: #475569; font-size: 15px; line-height: 1.6;">Pengajuan peminjaman inventaris Anda untuk kegiatan <strong>${kegiatan}</strong> telah diperbarui oleh Admin.</p>

              <!-- Ticket Details -->
              <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="font-size: 12px; color: #64748b; text-transform: uppercase;">Barang Dipinjam</span><br/>
                      <strong style="font-size: 16px; color: #1e293b;">${namaBarang}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="font-size: 12px; color: #64748b; text-transform: uppercase;">Tanggal & Waktu Pengambilan</span><br/>
                      <strong style="font-size: 15px; color: #1e293b;">${waktuPinjam}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="font-size: 12px; color: #64748b; text-transform: uppercase;">Tenggat Pengembalian</span><br/>
                      <strong style="font-size: 15px; color: #1e293b;">${waktuSelesai}</strong>
                    </td>
                  </tr>
                </table>
              </div>

              ${status === 'Disetujui' ? `
                <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px;">
                   <p style="margin: 0; color: #047857; font-size: 14px;"><strong>PENTING:</strong> Tunjukkan e-ticket ini kepada admin saat pengambilan barang sebagai bukti sah penyewaan/peminjaman.</p>
                </div>
              ` : `
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 4px;">
                   <p style="margin: 0; color: #b91c1c; font-size: 14px;">Mohon maaf, pengajuan Anda tidak dapat diproses. Jadwal mungkin bentrok atau syarat tidak terpenuhi.</p>
                </div>
              `}
            </div>
            
            <!-- Footer E-Ticket -->
            <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-top: 1px dashed #cbd5e1;">
              <p style="color: #64748b; font-size: 11px; margin: 0;">Sistem Administrasi Otomatis &bull; PMII Sunan Ampel Malang</p>
            </div>
          </div>
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