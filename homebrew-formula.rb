# Homebrew Formula for GhUp
# This file should be placed in: homebrew-ghup/Formula/ghup.rb

class Ghup < Formula
  desc "Beautiful GitHub Account Switcher - Interactive CLI tool for managing multiple GitHub accounts"
  homepage "https://github.com/bangunx/ghup"
  url "https://github.com/bangunx/ghup/releases/download/v1.2.0/ghup-macos.tar.gz"
  sha256 "REPLACE_WITH_ACTUAL_SHA256"
  license "MIT"

  def install
    bin.install "ghup"
  end

  test do
    system "#{bin}/ghup", "--version"
  end
end
