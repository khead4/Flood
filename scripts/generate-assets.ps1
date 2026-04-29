Add-Type -AssemblyName System.Drawing

$assetDir = Join-Path (Split-Path -Parent $PSScriptRoot) "assets"
if (-not (Test-Path -LiteralPath $assetDir)) {
  New-Item -ItemType Directory -Path $assetDir | Out-Null
}

function New-Canvas {
  param([int]$Width, [int]$Height)
  $bitmap = New-Object System.Drawing.Bitmap $Width, $Height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Dispose-Canvas {
  param($Canvas)
  $Canvas.Graphics.Dispose()
  $Canvas.Bitmap.Dispose()
}

function Add-Background {
  param($G, [int]$Width, [int]$Height, [string]$Top, [string]$Bottom)
  $rect = New-Object System.Drawing.Rectangle 0, 0, $Width, $Height
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.ColorTranslator]::FromHtml($Top)), ([System.Drawing.ColorTranslator]::FromHtml($Bottom)), 90
  $G.FillRectangle($brush, $rect)
  $brush.Dispose()
}

function Add-Line {
  param($G, [int]$X1, [int]$Y1, [int]$X2, [int]$Y2, [string]$Color, [int]$Width)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($Color)), $Width
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $G.DrawLine($pen, $X1, $Y1, $X2, $Y2)
  $pen.Dispose()
}

function Add-FilledRect {
  param($G, [int]$X, [int]$Y, [int]$W, [int]$H, [string]$Color)
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($Color))
  $G.FillRectangle($brush, $X, $Y, $W, $H)
  $brush.Dispose()
}

function Add-FilledEllipse {
  param($G, [int]$X, [int]$Y, [int]$W, [int]$H, [string]$Color)
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($Color))
  $G.FillEllipse($brush, $X, $Y, $W, $H)
  $brush.Dispose()
}

function Add-StrokedEllipse {
  param($G, [int]$X, [int]$Y, [int]$W, [int]$H, [string]$Color, [int]$Width)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($Color)), $Width
  $G.DrawEllipse($pen, $X, $Y, $W, $H)
  $pen.Dispose()
}

function Add-Text {
  param($G, [string]$Text, [int]$X, [int]$Y, [int]$Size, [string]$Color, [string]$Weight = "Regular")
  $style = if ($Weight -eq "Bold") { [System.Drawing.FontStyle]::Bold } else { [System.Drawing.FontStyle]::Regular }
  $font = New-Object System.Drawing.Font "Segoe UI", $Size, $style
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($Color))
  $G.DrawString($Text, $font, $brush, $X, $Y)
  $font.Dispose()
  $brush.Dispose()
}

function Save-Canvas {
  param($Canvas, [string]$Name)
  $path = Join-Path $assetDir $Name
  $Canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

$canvas = New-Canvas 1800 1000
$g = $canvas.Graphics
Add-Background $g 1800 1000 "#082026" "#15313a"
for ($x = 0; $x -lt 1800; $x += 90) { Add-Line $g $x 0 $x 1000 "#1f4650" 1 }
for ($y = 0; $y -lt 1000; $y += 90) { Add-Line $g 0 $y 1800 $y "#1f4650" 1 }
Add-FilledRect $g 0 735 1800 265 "#10272d"
Add-FilledRect $g 1180 450 95 285 "#1e4752"
Add-FilledRect $g 1288 390 125 345 "#275965"
Add-FilledRect $g 1432 520 78 215 "#1c414d"
Add-FilledRect $g 1535 420 110 315 "#244f59"
Add-FilledRect $g 1670 575 78 160 "#1c414d"
for ($x = 1200; $x -lt 1620; $x += 42) {
  for ($y = 475; $y -lt 700; $y += 42) {
    Add-FilledRect $g $x $y 14 14 "#7fbfb6"
  }
}
Add-Line $g 140 790 1680 790 "#48c7b9" 16
Add-Line $g 330 850 1480 850 "#c7972d" 11
Add-FilledRect $g 1020 660 330 94 "#e8f6f2"
Add-FilledRect $g 1055 612 160 48 "#e8f6f2"
Add-FilledRect $g 1062 705 40 40 "#0f766e"
Add-FilledRect $g 1252 705 40 40 "#0f766e"
Add-Text $g "H2" 1112 630 42 "#0f4f4a" "Bold"
Add-FilledEllipse $g 420 250 118 118 "#8ce0d2"
Add-FilledEllipse $g 615 165 118 118 "#8ce0d2"
Add-FilledEllipse $g 705 325 118 118 "#8ce0d2"
Add-Line $g 520 295 630 225 "#e7fbf8" 10
Add-Line $g 720 330 670 265 "#e7fbf8" 10
Add-StrokedEllipse $g 330 100 600 450 "#7fbfb6" 4
Add-StrokedEllipse $g 365 135 530 380 "#c7972d" 3
Add-FilledRect $g 210 530 190 205 "#f2f5f8"
Add-FilledEllipse $g 180 500 250 70 "#f2f5f8"
Add-FilledEllipse $g 180 698 250 70 "#f2f5f8"
Add-Line $g 210 540 400 725 "#0f766e" 8
Add-Line $g 400 540 210 725 "#0f766e" 8
Add-Line $g 280 540 280 725 "#b5482a" 6
Add-Line $g 1495 300 1495 650 "#c7972d" 8
Add-Line $g 1495 300 1415 400 "#c7972d" 7
Add-Line $g 1495 300 1585 405 "#c7972d" 7
Add-Line $g 1495 300 1490 190 "#c7972d" 7
Save-Canvas $canvas "hydrogen-hero.png"
Dispose-Canvas $canvas

$canvas = New-Canvas 1200 750
$g = $canvas.Graphics
Add-Background $g 1200 750 "#dfeff2" "#f9fbf7"
Add-FilledRect $g 0 560 1200 190 "#d7ded8"
Add-FilledRect $g 80 250 430 310 "#ffffff"
Add-FilledRect $g 110 285 370 75 "#0f766e"
Add-FilledRect $g 125 380 155 74 "#dfeff2"
Add-FilledRect $g 310 380 145 74 "#dfeff2"
Add-FilledEllipse $g 135 500 75 75 "#172026"
Add-FilledEllipse $g 380 500 75 75 "#172026"
Add-FilledEllipse $g 158 523 30 30 "#8ce0d2"
Add-FilledEllipse $g 403 523 30 30 "#8ce0d2"
Add-Text $g "H2" 350 295 38 "#ffffff" "Bold"
Add-FilledRect $g 630 330 260 210 "#f7f8f4"
Add-FilledEllipse $g 600 300 320 90 "#f7f8f4"
Add-FilledEllipse $g 600 492 320 90 "#f7f8f4"
Add-Line $g 632 342 888 530 "#2563eb" 8
Add-Line $g 888 342 632 530 "#2563eb" 8
Add-Line $g 725 342 725 530 "#0f766e" 6
Add-Line $g 520 450 630 450 "#48c7b9" 12
Add-Line $g 890 450 1050 450 "#48c7b9" 12
Add-FilledRect $g 980 265 80 295 "#244f59"
Add-FilledRect $g 1070 210 70 350 "#1e4752"
for ($x = 995; $x -lt 1125; $x += 34) {
  for ($y = 290; $y -lt 520; $y += 38) {
    Add-FilledRect $g $x $y 12 12 "#c7972d"
  }
}
Add-Text $g "fuel cell transit depot" 82 645 34 "#172026" "Bold"
Save-Canvas $canvas "transit-fuel-cell.png"
Dispose-Canvas $canvas

$canvas = New-Canvas 1200 750
$g = $canvas.Graphics
Add-Background $g 1200 750 "#eef6f2" "#f8f9f5"
Add-FilledRect $g 0 595 1200 155 "#b9c7bd"
Add-FilledRect $g 0 675 1200 75 "#8a6b4e"
Add-FilledEllipse $g 430 640 360 95 "#6f553e"
Add-Text $g "salt cavern" 520 660 22 "#f7f8f4" "Bold"
Add-FilledRect $g 110 360 160 235 "#ffffff"
Add-FilledRect $g 290 300 145 295 "#ffffff"
Add-FilledRect $g 455 395 120 200 "#ffffff"
Add-FilledRect $g 720 325 220 270 "#ffffff"
Add-FilledRect $g 765 270 132 55 "#ffffff"
Add-FilledRect $g 765 470 130 55 "#0f766e"
Add-Text $g "H2" 802 280 40 "#0f766e" "Bold"
for ($x = 135; $x -lt 555; $x += 50) {
  for ($y = 385; $y -lt 560; $y += 45) {
    Add-FilledRect $g $x $y 16 16 "#2563eb"
  }
}
Add-Line $g 110 615 1050 615 "#0f766e" 14
Add-Line $g 240 615 430 678 "#0f766e" 10
Add-Line $g 740 615 640 678 "#0f766e" 10
Add-Line $g 205 320 205 170 "#c7972d" 8
Add-Line $g 205 170 125 230 "#c7972d" 7
Add-Line $g 205 170 285 230 "#c7972d" 7
Add-Line $g 205 170 205 80 "#c7972d" 7
Add-FilledRect $g 955 445 150 90 "#e8f6f2"
Add-FilledRect $g 975 420 80 28 "#e8f6f2"
Add-FilledRect $g 982 510 24 24 "#172026"
Add-FilledRect $g 1065 510 24 24 "#172026"
Add-Text $g "bus" 990 430 24 "#0f4f4a" "Bold"
Add-Text $g "production to storage to demand" 90 105 34 "#172026" "Bold"
Save-Canvas $canvas "infrastructure-flow.png"
Dispose-Canvas $canvas
