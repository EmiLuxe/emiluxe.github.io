Add-Type -AssemblyName System.Drawing

function New-BarIcon {
  param([int]$Size, [string]$Path)
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(255, 99, 102, 241))
  $fontSize = [int]($Size * 0.45)
  $font = New-Object System.Drawing.Font('Arial', $fontSize, [System.Drawing.FontStyle]::Bold)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF 0, 0, $Size, $Size
  $g.DrawString('B', $font, [System.Drawing.Brushes]::White, $rect, $sf)
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

New-BarIcon -Size 192 -Path "$PSScriptRoot\..\icons\icon-192.png"
New-BarIcon -Size 512 -Path "$PSScriptRoot\..\icons\icon-512.png"
