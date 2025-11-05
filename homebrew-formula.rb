# Homebrew Formula for GhE
# This file should be placed in: homebrew-ghe/Formula/ghe.rb

class Ghe < Formula
  desc "Beautiful GitHub Account Switcher - Interactive CLI tool for managing multiple GitHub accounts"
  homepage "https://github.com/dwirx/ghe"
  url "https://github.com/dwirx/ghe/releases/download/v1.2.0/ghe-macos.tar.gz"
  sha256 "REPLACE_WITH_ACTUAL_SHA256"
  license "MIT"

  def install
    bin.install "ghe"
  end

  test do
    system "#{bin}/ghe", "--version"
  end
end
