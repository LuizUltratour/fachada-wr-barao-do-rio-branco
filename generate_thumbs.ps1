<#
  generate_thumbs.ps1 — Gerador de thumbnails (Windows, sem dependencias).
  Usa System.Drawing (GDI+). Espelha assets\ em assets\thumbs\ como JPEG.

  - Max 900px no maior lado, JPEG qualidade 82.
  - Excecao: plantas\ vai a 2400px. O card de plantas exibe o thumb em tela cheia
    (as implantacoes tem ~6000px de largura), e a 900px o desenho saia borrado.
  - Achata sobre fundo branco (seguro para PNG de plantas com transparencia).
  - Ignora thumbs\, videos\, design\ (chrome da UI) e fachada-interativa-assets\ (usada em tamanho real).

  Uso:
    ./generate_thumbs.ps1          # gera apenas os que faltam / desatualizados
    ./generate_thumbs.ps1 -Force   # regenera todos
#>
param([switch]$Force)

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$assets    = Join-Path $PSScriptRoot 'assets'
$thumbRoot = Join-Path $assets 'thumbs'
$MAX         = 900.0
$MAX_PLANTAS = 2400.0
$Q           = 82

$jpgEnc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Q)

$imgs = Get-ChildItem -LiteralPath $assets -Recurse -File |
        Where-Object { $_.Extension -match '(?i)\.(jpe?g|png)$' -and
                       $_.FullName -notmatch '\\thumbs\\' -and $_.FullName -notmatch '\\videos\\' -and
                       $_.FullName -notmatch '\\design\\' -and
                       $_.FullName -notmatch '\\fachada-interativa-assets\\' }

$made = 0; $skip = 0; $totalOrig = 0.0; $totalThumb = 0.0
foreach ($f in $imgs) {
  $rel = $f.FullName.Substring($assets.Length).TrimStart('\')   # ex: Plantas\corporativo\subsolo.png
  $relLower = $rel.ToLower()
  $relJpg = [System.IO.Path]::ChangeExtension($relLower, '.jpg')
  $dest = Join-Path $thumbRoot $relJpg
  $destDir = Split-Path $dest -Parent
  if (-not (Test-Path -LiteralPath $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }

  if (-not $Force -and (Test-Path -LiteralPath $dest) -and ((Get-Item -LiteralPath $dest).LastWriteTime -ge $f.LastWriteTime)) { $skip++; continue }

  try {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    $max = if ($relLower.StartsWith('plantas\')) { $MAX_PLANTAS } else { $MAX }
    $scale = [Math]::Min($max/$img.Width, $max/$img.Height)
    if ($scale -gt 1) { $scale = 1 }
    $w = [int]($img.Width*$scale); $h = [int]($img.Height*$scale)
    $bmp = New-Object System.Drawing.Bitmap($w,$h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::White)               # achata transparencia sobre branco
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($img, 0, 0, $w, $h)
    $bmp.Save($dest, $jpgEnc, $encParams)
    $g.Dispose(); $bmp.Dispose(); $img.Dispose()
    $totalOrig  += $f.Length
    $totalThumb += (Get-Item -LiteralPath $dest).Length
    $made++
    Write-Host ("  {0}  ->  {1} KB" -f $relJpg, [Math]::Round((Get-Item -LiteralPath $dest).Length/1KB))
  } catch {
    Write-Host "ERRO em $rel : $($_.Exception.Message)" -ForegroundColor Red
  }
}
Write-Host ("Gerados: {0} | Pulados: {1}" -f $made, $skip) -ForegroundColor Green
if ($made -gt 0) {
  Write-Host ("Origem somada: {0} MB  ->  Thumbs: {1} MB" -f [Math]::Round($totalOrig/1MB,1), [Math]::Round($totalThumb/1MB,1)) -ForegroundColor Cyan
}