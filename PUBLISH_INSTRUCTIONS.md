# 🚀 Cara Publish GhE ke NPM via GitHub Workflow

## Metode 1: Auto Publish (Recommended) - Via VERSION File

Workflow akan otomatis trigger saat VERSION file berubah.

```bash
# 1. Update VERSION file
echo "1.0.0" > VERSION

# 2. Commit dan push
git add VERSION
git commit -m "Release v1.0.0"
git push origin main
```

Workflow `publish-npm.yml` akan otomatis:
- Detect versi dari VERSION file
- Sync version ke package.json dan src/cli.ts
- Build project
- Publish ke NPM

---

## Metode 2: Manual Trigger - Via GitHub UI

1. **Buka GitHub Actions**
   - https://github.com/dwirx/ghe/actions
   - Pilih workflow "Publish ghe to npm"

2. **Klik "Run workflow"**
   - Klik tombol "Run workflow" (kanan atas)
   - Branch: `main`
   - Version: kosongkan (akan ambil dari VERSION file)
   - Klik "Run workflow"

3. **Monitor Progress**
   - Lihat log real-time
   - Tunggu sampai selesai (hijau = sukses)

---

## Metode 3: Manual Trigger - Via GitHub CLI

```bash
# Install GitHub CLI dulu jika belum
# https://cli.github.com/

# Login
gh auth login

# Trigger workflow
gh workflow run "publish-npm.yml" \
  --repo dwirx/ghe \
  --ref main
```

---

## Metode 4: Via Git Tag (Trigger Release + NPM)

```bash
# 1. Create dan push tag
git tag v1.0.0
git push origin v1.0.0
```

Ini akan trigger:
- Workflow `release.yml` → Build binaries + GitHub Release
- Workflow `npm-publish.yml` → Publish ke NPM

---

## Verifikasi Setelah Publish

```bash
# Cek di NPM registry
npm view ghe

# Install dan test
npm install -g ghe
ghe --version

# Atau dengan bun
bun install -g ghe
ghe --version
```

---

## Troubleshooting

### Token Error
```
Error: Unable to authenticate with npm
```
**Solusi**: Pastikan `NPM_TOKEN` sudah di-set di GitHub Secrets

### Version Already Exists
```
Error: ghe@1.0.0 already exists on npm
```
**Solusi**: Bump version di VERSION file (misal 1.0.1)

### Build Failed
```
Error: Build failed
```
**Solusi**: Cek logs, pastikan dependencies ter-install

---

## Status Workflows

Cek status di: https://github.com/dwirx/ghe/actions

- ✅ Hijau = Sukses
- ❌ Merah = Gagal (klik untuk lihat logs)
- 🟡 Kuning = Running

