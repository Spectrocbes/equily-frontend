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

$fixed = 0; $skipped = 0

foreach ($file in Get-ChildItem "$dir/*.png" | Sort-Object Name) {
    $bmp = New-Object System.Drawing.Bitmap $file.FullName
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
Write-Host "centred $fixed, already fine $skipped"
