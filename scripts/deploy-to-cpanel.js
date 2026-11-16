/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Script Otomatisasi Deploy Antigravity -> cPanel (FTP / FTPS)
 */

import * as ftp from 'basic-ftp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Muat Environment Variables (.env.cpanel atau .env)
const cpanelEnvPath = path.join(rootDir, '.env.cpanel');
if (fs.existsSync(cpanelEnvPath)) {
  dotenv.config({ path: cpanelEnvPath });
} else {
  dotenv.config({ path: path.join(rootDir, '.env') });
}

const host = process.env.CPANEL_FTP_HOST || '';
const user = process.env.CPANEL_FTP_USER || '';
const password = process.env.CPANEL_FTP_PASSWORD || '';
const port = parseInt(process.env.CPANEL_FTP_PORT || '21', 10);
const remoteDir = process.env.CPANEL_REMOTE_DIR || 'public_html';
const secure = process.env.CPANEL_FTP_SECURE === 'true';

async function deploy() {
  console.log('\n================================================================');
  console.log('🚀 ANTIGRAVITY -> CPANEL AUTO DEPLOYMENT PIPELINE');
  console.log('================================================================');

  // 2. Validasi Kredensial
  if (!host || !user || !password) {
    console.error('\n⚠️  KREDENSIAL CPANEL BELUM DIISI!');
    console.log('\nSilakan buka file: .env.cpanel di folder utama dan isi:');
    console.log('  CPANEL_FTP_HOST     = (contoh: ftp.domainanda.com atau IP server)');
    console.log('  CPANEL_FTP_USER     = (username cPanel / FTP Anda)');
    console.log('  CPANEL_FTP_PASSWORD = (password cPanel / FTP Anda)');
    console.log('  CPANEL_REMOTE_DIR   = public_html (default)\n');
    console.log('Setelah diisi, jalankan kembali: npm run deploy');
    console.log('================================================================\n');
    process.exit(1);
  }

  // 3. Menjalankan Build Vite Terbaru
  console.log('\n[1/3] 🔨 Mengompilasi kode terbaru dengan Vite (npm run build)...');
  try {
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Gagal mengompilasi kode (build error):', err.message);
    process.exit(1);
  }

  const distDir = path.join(rootDir, 'dist');
  if (!fs.existsSync(distDir)) {
    console.error('❌ Folder dist/ tidak ditemukan setelah build.');
    process.exit(1);
  }

  // 4. Pastikan .htaccess tersalin ke folder dist/
  const htaccessSrc = path.join(rootDir, 'public', '.htaccess');
  const htaccessDest = path.join(distDir, '.htaccess');
  if (fs.existsSync(htaccessSrc) && !fs.existsSync(htaccessDest)) {
    fs.copyFileSync(htaccessSrc, htaccessDest);
    console.log('📄 File .htaccess cPanel otomatis disalin ke dist/');
  }

  // 4b. JANGAN timpa database data live di cPanel (program_states.json, custom_materi.json, quiz_scores.json, registrations.json, pekan_unlock.json, attendance.json, student_accounts.json, attendance_unlock.json, gemini_config.json)
  const runtimeFilesToPreserve = ['program_states.json', 'custom_materi.json', 'quiz_scores.json', 'registrations.json', 'pekan_unlock.json', 'attendance.json', 'student_accounts.json', 'attendance_unlock.json', 'gemini_config.json'];
  for (const file of runtimeFilesToPreserve) {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`🛡️  File runtime data '${file}' dikeluarkan dari dist/ agar database live di cPanel tidak tertimpa.`);
      } catch (e) {
        console.warn(`Peringatan file ${file}:`, e.message);
      }
    }
  }

  // 5. Hubungkan ke Server cPanel via FTP
  console.log(`\n[2/3] 📡 Menghubungkan ke cPanel FTP: ${host}:${port}...`);
  const client = new ftp.Client();
  client.ftp.verbose = false; // Set true jika ingin debug detail

  try {
    await client.access({
      host,
      port,
      user,
      password,
      secure
    });

    console.log('✅ Berhasil terhubung dan terautentikasi ke cPanel!');

    // 6. Masuk / Pastikan Remote Dir dengan deteksi cerdas
    let targetDir = remoteDir;
    try {
      const currentDir = await client.pwd();
      console.log(`📂 Direktori awal FTP: ${currentDir}`);
      const list = await client.list();
      const hasPublicHtml = list.some(item => item.name === 'public_html' && item.isDirectory);
      if (!hasPublicHtml && remoteDir === 'public_html') {
        // Akun FTP kemungkinan dibuat khusus dan sudah langsung mengarah ke folder web domain
        console.log('ℹ️  Folder public_html tidak ada di subfolder; file akan diunggah langsung ke direktori aktif domain.');
        targetDir = '';
      } else if (remoteDir) {
        await client.ensureDir(remoteDir);
      }
    } catch (dirErr) {
      console.log(`ℹ️  Pemberitahuan direktori: ${dirErr.message}`);
    }

    // Unggah seluruh isi dist/ ke targetDir
    console.log(`\n[3/3] 📤 Mengunggah seluruh file ke: ${targetDir ? '/' + targetDir : 'root domain'}...`);
    if (targetDir) {
      await client.uploadFromDir(distDir, targetDir);
    } else {
      await client.uploadFromDir(distDir);
    }

    const nowStr = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date()) + ' WIB';

    console.log('\n================================================================');
    console.log('🎉 DEPLOY KE CPANEL BERHASIL 100%!');
    console.log('================================================================');
    console.log(`✓ Host Target      : ${host}`);
    console.log(`✓ Folder Server    : /${remoteDir}`);
    console.log(`✓ Waktu Deploy     : ${nowStr}`);
    console.log('✓ Halaman Terkirim : index.html, materi.html, latihan.html,');
    console.log('                     pelajar.html, superadmin.html, edit-jadwal.html,');
    console.log('                     login.html, assets bundle, dan .htaccess');
    console.log('\n🌐 Website Anda sekarang sudah LANGSUNG LIVE dan terupdate di cPanel!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ GAGAL MENGUNGGAH KE CPANEL:', err.message);
    console.log('\nTips Penyelesaian:');
    console.log('1. Pastikan Host, Username, dan Password FTP di .env.cpanel sudah benar.');
    console.log('2. Jika menggunakan FTP biasa, pastikan CPANEL_FTP_SECURE=false.');
    console.log('3. Pastikan port 21 tidak diblokir oleh firewall penyedia hosting Anda.\n');
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
