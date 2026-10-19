$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$buildRoot = Join-Path $projectRoot 'dist-itch'
$releaseRoot = Join-Path $projectRoot 'releases'
$zipPath = Join-Path $releaseRoot 'street-bogota-itchio.zip'
$indexPath = Join-Path $buildRoot 'index.html'
if (!(Test-Path -LiteralPath $indexPath)) { throw 'Falta dist-itch/index.html. Ejecuta npm run build:itch.' }
$html = Get-Content -LiteralPath $indexPath -Raw
if ($html -match '(?:src|href)="/(?!/)') { throw 'El HTML contiene una ruta absoluta incompatible con itch.io.' }
for ($track = 1; $track -le 7; $track++) {
  if (!(Test-Path -LiteralPath (Join-Path $buildRoot "assets/music$track.ogg"))) { throw "Falta pista OGG $track." }
}
if (Get-ChildItem -LiteralPath (Join-Path $buildRoot 'assets') -Filter 'music*.mp3') { throw 'El paquete contiene musica MP3 retirada.' }
$files = @(Get-ChildItem -LiteralPath $buildRoot -Recurse -File)
$totalBytes = ($files | Measure-Object -Property Length -Sum).Sum
if ($files.Count -gt 1000 -or $totalBytes -gt 500MB) { throw 'El paquete supera los limites de itch.io.' }
foreach ($file in $files) {
  $relative = $file.FullName.Substring($buildRoot.Length + 1)
  if ($relative.Length -gt 240 -or $file.Length -gt 200MB) { throw "Archivo fuera de limites: $relative" }
}
New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null
Compress-Archive -Path (Join-Path $buildRoot '*') -DestinationPath $zipPath -CompressionLevel Optimal -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
  if ($null -eq $archive.GetEntry('index.html')) { throw 'El ZIP no contiene index.html en la raiz.' }
  if ($archive.Entries.Count -ne $files.Count) { throw 'El ZIP no contiene todos los archivos.' }
} finally { $archive.Dispose() }
Write-Output "ZIP listo: $zipPath"
Write-Output ("{0} archivos; contenido {1:N1} MB; ZIP {2:N1} MB" -f $files.Count, ($totalBytes / 1MB), ((Get-Item -LiteralPath $zipPath).Length / 1MB))
