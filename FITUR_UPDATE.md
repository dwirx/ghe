# Fitur Notifikasi Update Otomatis

## 📋 Ringkasan

GhUx sekarang dilengkapi dengan **notifikasi update otomatis** yang akan memberitahu Anda ketika versi baru tersedia. Fitur ini memastikan Anda selalu menggunakan versi terbaru dengan fitur dan perbaikan bug terkini.

## 🚀 Cara Kerja

### Pengecekan Otomatis Saat Startup

Setiap kali Anda menjalankan `ghux`, aplikasi akan secara otomatis memeriksa update di latar belakang:

- **Interval Pengecekan**: Sekali setiap 24 jam (di-cache)
- **Non-blocking**: Tidak memperlambat startup aplikasi
- **Silent on Error**: Jika pengecekan gagal, tidak akan mengganggu workflow Anda

### Notifikasi Update

Ketika versi baru tersedia, Anda akan melihat kotak notifikasi cantik dengan informasi:

- Versi saat ini vs versi terbaru
- Indikator tipe update:
  - 🚀 **Major** update (contoh: 1.0.0 → 2.0.0) - Highlight merah
  - ✨ **Minor** update (contoh: 1.0.0 → 1.1.0) - Highlight kuning
  - 🔧 **Patch** update (contoh: 1.0.0 → 1.0.1) - Highlight hijau
- Perintah instalasi untuk berbagai package manager
- Link ke changelog

### Contoh Notifikasi

```
╭─────────────────── Update Available ───────────────────╮
│                                                         │
│  🚀 Update available: 1.0.0 → 2.0.0                   │
│                                                         │
│  Run to update:                                         │
│  npm install -g ghux                                    │
│                                                         │
│  Or with specific package manager:                      │
│  yarn global add ghux                                   │
│  pnpm add -g ghux                                       │
│  bun install -g ghux                                    │
│                                                         │
│  Changelog: https://github.com/dwirx/ghux/releases     │
│                                                         │
╰─────────────────────────────────────────────────────────╯
```

## 🔍 Pengecekan Manual

Anda dapat melakukan pengecekan update secara manual kapan saja menggunakan menu interaktif:

1. Jalankan `ghux`
2. Pilih "🔄 Check for updates" dari menu utama
3. Aplikasi akan memaksa pengecekan (mengabaikan cache) dan menampilkan hasil

## 📦 Cara Update GhUx

### Menggunakan npm (disarankan)

```bash
npm install -g ghux
```

### Menggunakan yarn

```bash
yarn global add ghux
```

### Menggunakan pnpm

```bash
pnpm add -g ghux
```

### Menggunakan bun

```bash
bun install -g ghux
```

### Verifikasi Update

Setelah update, verifikasi versi baru:

```bash
ghux --version
```

## ⚙️ Konfigurasi

Update checker menggunakan pengaturan default berikut:

- **Interval Pengecekan Update**: 24 jam
- **Lokasi Cache**: `~/.config/configstore/update-notifier-ghux.json`
- **Network Timeout**: 5 detik
- **Tampilkan Notifikasi**: Aktif secara default

## 🔒 Privasi

Update checker:

- Hanya terhubung ke npm registry (registry.npmjs.org)
- **TIDAK** mengumpulkan atau mengirim data pengguna
- **TIDAK** melacak statistik penggunaan
- Hanya memeriksa versi package yang dipublikasikan

## 🚫 Menonaktifkan Pengecekan Update

Jika Anda ingin menonaktifkan pengecekan update otomatis, Anda bisa:

### Opsi 1: Environment Variable

Tambahkan ke file shell config Anda (`~/.bashrc`, `~/.zshrc`, dll):

```bash
export NO_UPDATE_NOTIFIER=1
```

Lalu restart terminal atau jalankan:

```bash
source ~/.bashrc  # atau ~/.zshrc
```

### Opsi 2: Hapus Cache (tidak disarankan)

```bash
rm ~/.config/configstore/update-notifier-ghux.json
```

**Catatan**: Pengecekan akan kembali aktif saat aplikasi dijalankan lagi.

## 🔧 Detail Teknis

### Dependencies

- **update-notifier**: Package npm standar industri untuk notifikasi update
- Pengecekan versi dilakukan via npm registry API
- Mengikuti standar semantic versioning (semver)

### Strategi Cache

- Informasi update di-cache selama 24 jam
- Cache disimpan di direktori config pengguna
- Mencegah request network yang berlebihan
- Menghormati pengaturan `updateCheckInterval`

### Error Handling

- Kegagalan network ditangani secara silent
- Parsing error tidak mengganggu aplikasi
- Timeout setelah 5 detik untuk mencegah hanging
- Graceful fallback untuk melanjutkan tanpa pengecekan update

## 🐛 Troubleshooting

### Notifikasi update tidak muncul

1. Cek apakah Anda sudah melihat notifikasi dalam 24 jam terakhir (di-cache)
2. Gunakan opsi "Check for updates" di menu untuk force check
3. Verifikasi koneksi internet
4. Cek apakah environment variable `NO_UPDATE_NOTIFIER` sudah di-set

### Tidak bisa terhubung ke npm registry

- Periksa koneksi internet Anda
- Verifikasi pengaturan firewall/proxy
- Coba akses https://registry.npmjs.org/ghux secara manual di browser

### Masalah cache

Hapus file cache:

```bash
rm ~/.config/configstore/update-notifier-ghux.json
```

Atau di Windows:

```powershell
del %APPDATA%\configstore\update-notifier-ghux.json
```

### Update checker error di corporate network

Jika Anda berada di belakang corporate proxy:

```bash
# Set proxy untuk npm
npm config set proxy http://proxy.perusahaan.com:8080
npm config set https-proxy http://proxy.perusahaan.com:8080

# Atau nonaktifkan update checker
export NO_UPDATE_NOTIFIER=1
```

## 📄 File Terkait

- `src/utils/updateChecker.ts` - Implementasi update checker
- `src/cli.ts` - Integrasi dengan CLI utama
- `package.json` - Metadata package dan dependencies
- `UPDATE_CHECKER.md` - Dokumentasi lengkap dalam bahasa Inggris

## 📚 Lihat Juga

- [Changelog](./CHANGELOG.md) - Riwayat versi
- [Panduan Instalasi](./README.md#installation) - Cara install GhUx
- [GitHub Releases](https://github.com/dwirx/ghux/releases) - Catatan rilis

## 💡 Tips

1. **Selalu update ke versi terbaru** untuk mendapatkan fitur dan perbaikan bug terkini
2. **Baca changelog** sebelum update untuk mengetahui perubahan apa saja
3. **Gunakan semantic versioning** untuk memahami tingkat perubahan:
   - Major (1.0.0 → 2.0.0): Breaking changes, mungkin perlu migrasi
   - Minor (1.0.0 → 1.1.0): Fitur baru, backward compatible
   - Patch (1.0.0 → 1.0.1): Bug fixes, tidak ada perubahan API

## ❓ FAQ

### Apakah update otomatis akan menginstall versi baru?

Tidak. Update checker hanya **memberitahu** Anda tentang versi baru. Anda harus menjalankan perintah update secara manual.

### Berapa lama pengecekan update?

Pengecekan update sangat cepat (biasanya < 1 detik) dan dilakukan di latar belakang sehingga tidak memperlambat aplikasi.

### Apakah aman menggunakan fitur ini?

Ya, sangat aman. Update checker hanya membaca informasi publik dari npm registry dan tidak mengirim data pribadi Anda.

### Apakah berfungsi offline?

Tidak. Update checker memerlukan koneksi internet. Jika offline, pengecekan akan gagal secara silent tanpa mengganggu aplikasi.

### Bagaimana cara update jika tidak punya akses root?

Gunakan opsi `--prefix` untuk npm:

```bash
npm install -g --prefix ~/.local ghux
```

Pastikan `~/.local/bin` ada di PATH Anda.

---

**Dibuat dengan ❤️ untuk komunitas developer Indonesia**