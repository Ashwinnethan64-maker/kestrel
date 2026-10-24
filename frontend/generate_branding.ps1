Add-Type -AssemblyName System.Drawing

$srcPath = "public\Kestrel.ico"
$bmp = [System.Drawing.Bitmap]::new($srcPath)
$w = $bmp.Width
$h = $bmp.Height

Write-Host "Source dimensions: $w x $h"

# Create branding directory
if (-not (Test-Path "public\branding")) {
    New-Item -ItemType Directory -Path "public\branding" | Out-Null
}

# 1. Full logo copy
Copy-Item $srcPath "public\branding\kestrel-logo.png" -Force
Write-Host "Saved public\branding\kestrel-logo.png"

# Find eagle emblem bounding box
$minX = $w
$maxX = 0
$minY = $h
$maxY = 0

for ($y = 0; $y -lt [int]($h * 0.65); $y += 2) {
    for ($x = 0; $x -lt $w; $x += 2) {
        $p = $bmp.GetPixel($x, $y)
        # Threshold: if pixel has distinct color (green, white, silver)
        if (($p.R -gt 40 -or $p.G -gt 50 -or $p.B -gt 40) -and $p.A -gt 30) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Eagle Emblem Bounding Box: X=[$minX, $maxX], Y=[$minY, $maxY]"
$cropW = $maxX - $minX
$cropH = $maxY - $minY
Write-Host "Crop dimensions: $cropW x $cropH"

# Pad slightly into a square
$side = [Math]::Max($cropW, $cropH)
$pad = [int]($side * 0.08)
$totalSide = $side + (2 * $pad)

$centerX = [int](($minX + $maxX) / 2)
$centerY = [int](($minY + $maxY) / 2)

$startX = $centerX - [int]($totalSide / 2)
$startY = $centerY - [int]($totalSide / 2)

# Ensure within bounds
if ($startX -lt 0) { $startX = 0 }
if ($startY -lt 0) { $startY = 0 }
if ($startX + $totalSide -gt $w) { $totalSide = $w - $startX }
if ($startY + $totalSide -gt $h) { $totalSide = $h - $startY }

Write-Host "Square crop: ($startX, $startY) size: $totalSide x $totalSide"

# Create Eagle Mark PNG (high resolution 512x512)
$markBmp = New-Object System.Drawing.Bitmap 512, 512
$g = [System.Drawing.Graphics]::FromImage($markBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$srcRect = New-Object System.Drawing.Rectangle $startX, $startY, $totalSide, $totalSide
$destRect = New-Object System.Drawing.Rectangle 0, 0, 512, 512
$g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$markBmp.Save("public\branding\kestrel-mark.png", [System.Drawing.Imaging.ImageFormat]::Png)
$markBmp.Save("public\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved public\branding\kestrel-mark.png and public\favicon.png"

# Create proper 32x32 and 16x16 icon sizes for favicon.ico
$icoBmp = New-Object System.Drawing.Bitmap 32, 32
$g2 = [System.Drawing.Graphics]::FromImage($icoBmp)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g2.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g2.DrawImage($markBmp, 0, 0, 32, 32)
$g2.Dispose()

$icoHandle = $icoBmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($icoHandle)
$stream = [System.IO.File]::OpenWrite("public\favicon.ico")
$icon.Save($stream)
$stream.Close()
$icon.Dispose()
$icoBmp.Dispose()
$markBmp.Dispose()
$bmp.Dispose()

Write-Host "Saved public\favicon.ico"
