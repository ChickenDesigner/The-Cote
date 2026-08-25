$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8765

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".md"   = "text/plain; charset=utf-8"
  ".txt"  = "text/plain; charset=utf-8"
  ".gif"  = "image/gif"
  ".png"  = "image/png"
  ".json" = "application/json"
}

$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port)
$listener.Start()
Write-Host "serving $root on http://localhost:$port/"

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $buf = New-Object byte[] 4096
    $n = $stream.Read($buf, 0, $buf.Length)
    $req = [System.Text.Encoding]::ASCII.GetString($buf, 0, $n)
    $first = ($req -split "`r`n")[0]
    $parts = $first -split " "
    $url = "/"
    if ($parts.Length -ge 2) { $url = $parts[1] }
    $url = ($url -split "\?")[0]
    if ($url -eq "/") { $url = "/index.html" }
    $rel = $url.TrimStart("/") -replace "/", "\"
    $full = Join-Path $root $rel

    if ((Test-Path $full -PathType Leaf) -and $full.StartsWith($root)) {
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $ct = "application/octet-stream"
      if ($mime.ContainsKey($ext)) { $ct = $mime[$ext] }
      $head = "HTTP/1.1 200 OK`r`nContent-Type: $ct`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
    } else {
      $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 not found: $url")
      $head = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
    }

    $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
    $stream.Write($hb, 0, $hb.Length)
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Flush()
  } catch {
  } finally {
    $client.Close()
  }
}
