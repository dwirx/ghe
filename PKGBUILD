# PKGBUILD for Arch Linux AUR
# This file should be uploaded to AUR as ghe-bin

pkgname=ghe-bin
pkgver=1.2.0
pkgrel=1
pkgdesc="Beautiful GitHub Account Switcher - Interactive CLI tool for managing multiple GitHub accounts"
arch=('x86_64' 'aarch64')
url="https://github.com/dwirx/ghe"
license=('MIT')
depends=('git' 'openssh')
optdepends=('curl: for token authentication testing')
provides=('ghe')
conflicts=('ghe')
source_x86_64=("https://github.com/dwirx/ghe/releases/download/v${pkgver}/ghe")
source_aarch64=("https://github.com/dwirx/ghe/releases/download/v${pkgver}/ghe-linux-arm64")
sha256sums_x86_64=('REPLACE_WITH_ACTUAL_SHA256')
sha256sums_aarch64=('REPLACE_WITH_ACTUAL_SHA256')

package() {
    if [[ "$CARCH" == "x86_64" ]]; then
        install -Dm755 "${srcdir}/ghe" "${pkgdir}/usr/bin/ghe"
    elif [[ "$CARCH" == "aarch64" ]]; then
        install -Dm755 "${srcdir}/ghe-linux-arm64" "${pkgdir}/usr/bin/ghe"
    fi
}
