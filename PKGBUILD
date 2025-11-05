# PKGBUILD for Arch Linux AUR
# This file should be uploaded to AUR as ghup-bin

pkgname=ghup-bin
pkgver=1.2.0
pkgrel=1
pkgdesc="Beautiful GitHub Account Switcher - Interactive CLI tool for managing multiple GitHub accounts"
arch=('x86_64' 'aarch64')
url="https://github.com/bangunx/ghup"
license=('MIT')
depends=('git' 'openssh')
optdepends=('curl: for token authentication testing')
provides=('ghup')
conflicts=('ghup')
source_x86_64=("https://github.com/bangunx/ghup/releases/download/v${pkgver}/ghup")
source_aarch64=("https://github.com/bangunx/ghup/releases/download/v${pkgver}/ghup-linux-arm64")
sha256sums_x86_64=('REPLACE_WITH_ACTUAL_SHA256')
sha256sums_aarch64=('REPLACE_WITH_ACTUAL_SHA256')

package() {
    if [[ "$CARCH" == "x86_64" ]]; then
        install -Dm755 "${srcdir}/ghup" "${pkgdir}/usr/bin/ghup"
    elif [[ "$CARCH" == "aarch64" ]]; then
        install -Dm755 "${srcdir}/ghup-linux-arm64" "${pkgdir}/usr/bin/ghup"
    fi
}
