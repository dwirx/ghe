# Setup NPM Token untuk GitHub Actions

## Langkah 1: Buat NPM Access Token

1. Login ke NPM: https://www.npmjs.com/login
2. Klik avatar Anda (kanan atas) → "Access Tokens"
3. Klik "Generate New Token" → "Classic Token"
4. Pilih "Automation" type
5. Copy token yang dihasilkan

## Langkah 2: Tambahkan Token ke GitHub Secrets

1. Buka repo: https://github.com/dwirx/ghux
2. Klik "Settings" → "Secrets and variables" → "Actions"
3. Klik "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste token dari NPM
6. Klik "Add secret"

## Langkah 3: Verifikasi Token

Token sudah siap digunakan oleh GitHub Actions!
