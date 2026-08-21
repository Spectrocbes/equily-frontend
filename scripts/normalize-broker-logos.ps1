# Centres the artwork inside each broker logo.
#
# Favicons are not consistently centred: BoursoBank's mark sits 4.3% left of
# centre, which is plainly visible once the logo fills a round frame. Nudging it
# in CSS would mean a per-logo offset table in the component — the kind of
# special case that rots. Fixing the asset keeps the renderer uniform.
#
# Run standalone on the committed assets, or let fetch-broker-logos.ps1 call it
# after downloading, so a refresh never silently reintroduces the miscentring.
# It is a no-op for logos already centred, and never rescales: only translates.
#
# Usage:  powershell -ExecutionPolicy Bypass -File scripts/normalize-broker-logos.ps1

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$dir = "public/assets/logos/brokers"
if (-not (Test-Path $dir)) { Write-Error "not found: $dir"; exit 1 }

# Below this the shift is invisible; re-encoding every file for nothing only
# creates git churn.
$tolerancePct = 1.5
$alphaFloor   = 16

# The app never draws a logo above 44 px, and the largest framing zoom is 1.2x.
# 192 px covers that at 4x pixel density with headroom; beyond it the extra
# bytes can never reach a screen. Sourcing a 2048 px logo is right — shipping
# it is not.
$maxEdge = 192

# Files with a LOGO_FRAMING entry were positioned by hand against the artwork as
# it stands. Auto-centring them afterwards moves the ground under that tuning and
# the two corrections compound, so manual framing wins. Downscaling is still
# applied to them: it is proportional and changes nothing about the framing.
$manifest = Get-Content "src/app/core/constants/broker-logos.ts" -Raw
$block = $manifest.Substring($manifest.IndexOf('const LOGO_FRAMING'),
                             $manifest.IndexOf('function normalise') - $manifest.IndexOf('const LOGO_FRAMING'))
$handFramed = [regex]::Matches($block, "'([\w.-]+\.png)'") | ForEach-Object { $_.Groups[1].Value }
if ($handFramed) { Write-Host "hand-framed, centring skipped: $($handFramed -join ', ')"; Write-Host "" }

$fixed = 0; $skipped = 0; $shrunk = 0

foreach ($file in Get-ChildItem "$dir/*.png" | Sort-Object Name) {
    $bmp = New-Object System.Drawing.Bitmap $file.FullName

    if ([Math]::Max($bmp.Width, $bmp.Height) -gt $maxEdge) {
        $was = "$($bmp.Width)px, $([Math]::Round($file.Length/1KB,1)) KB"
        $ratio = $maxEdge / [Math]::Max($bmp.Width, $bmp.Height)
        $nw = [int][Math]::Round($bmp.Width * $ratio)
        $nh = [int][Math]::Round($bmp.Height * $ratio)
        $small = New-Object System.Drawing.Bitmap $nw, $nh
        $gr = [System.Drawing.Graphics]::FromImage($small)
        $gr.CompositingMode    = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $gr.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gr.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $gr.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gr.DrawImage($bmp, 0, 0, $nw, $nh)
        $gr.Dispose(); $bmp.Dispose()
        $small.Save($file.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
        $small.Dispose()
        $now = Get-Item $file.FullName
        Write-Host ("shrank  {0,-22} {1} -> {2}px, {3} KB" -f $file.BaseName, $was, $maxEdge, [Math]::Round($now.Length/1KB,1))
        $shrunk++
        $bmp = New-Object System.Drawing.Bitmap $file.FullName
    }

    $w = $bmp.Width; $h = $bmp.Height

    $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
    $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
                          [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bytes = New-Object byte[] ($data.Stride * $h)
    [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
    $bmp.UnlockBits($data)

    # Opaque bounding box (BGRA: alpha is the 4th byte of each pixel)
    $x0 = $w; $y0 = $h; $x1 = -1; $y1 = -1
    for ($y = 0; $y -lt $h; $y++) {
        $row = $y * $data.Stride
        for ($x = 0; $x -lt $w; $x++) {
            if ($bytes[$row + $x * 4 + 3] -gt $alphaFloor) {
                if ($x -lt $x0) { $x0 = $x }; if ($x -gt $x1) { $x1 = $x }
                if ($y -lt $y0) { $y0 = $y }; if ($y -gt $y1) { $y1 = $y }
            }
        }
    }

    if ($x1 -lt 0) { $bmp.Dispose(); $skipped++; continue }   # fully transparent
    if ($handFramed -contains $file.Name) { $bmp.Dispose(); $skipped++; continue }

    $dx = ((($x0 + $x1 + 1) / 2) - $w / 2) / $w * 100
    $dy = ((($y0 + $y1 + 1) / 2) - $h / 2) / $h * 100

    if ([Math]::Sqrt($dx * $dx + $dy * $dy) -le $tolerancePct) {
        $bmp.Dispose(); $skipped++; continue
    }

    $bw = $x1 - $x0 + 1; $bh = $y1 - $y0 + 1
    $out = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($out)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $dest = New-Object System.Drawing.Rectangle ([int](($w - $bw) / 2)), ([int](($h - $bh) / 2)), $bw, $bh
    $src  = New-Object System.Drawing.Rectangle $x0, $y0, $bw, $bh
    $g.DrawImage($bmp, $dest, $src, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose(); $bmp.Dispose()

    $out.Save($file.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
    $out.Dispose()

    Write-Host ("centred {0,-22} was off by {1,5:N1}% x / {2,5:N1}% y" -f $file.BaseName, $dx, $dy)
    $fixed++
}

Write-Host ""
Write-Host "shrank $shrunk, centred $fixed, already fine $skipped"
Write-Host ("total: {0:N0} KB" -f ((Get-ChildItem "$dir/*.png" | Measure-Object Length -Sum).Sum / 1KB))
