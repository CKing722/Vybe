param(
  [switch]$Verify
)

$ErrorActionPreference = 'Stop'

function Ensure-Command($Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found on PATH: $Name"
  }
}

Ensure-Command ssh

$sshDir = Join-Path $HOME ".ssh"
$knownHostsPath = Join-Path $sshDir "known_hosts"

New-Item -ItemType Directory -Force -Path $sshDir | Out-Null

function KnownHosts-HasGitHubKey {
  if (-not (Test-Path $knownHostsPath)) { return $false }
  return [bool](Select-String -Path $knownHostsPath -Pattern "^github\.com\s" -ErrorAction SilentlyContinue)
}

if (-not (KnownHosts-HasGitHubKey)) {
  Write-Host "Adding github.com host key to $knownHostsPath"

  $keys = @()
  if (Get-Command ssh-keyscan -ErrorAction SilentlyContinue) {
    try {
      $keys = ssh-keyscan -t ed25519 github.com 2>$null
      if (-not $keys) {
        $keys = ssh-keyscan github.com 2>$null
      }
    } catch {
      $keys = @()
    }
  }

  if (-not $keys) {
    Write-Warning "ssh-keyscan not available or returned no keys. If you run 'ssh -T git@github.com', OpenSSH will prompt to trust the host key interactively."
  } else {
    Add-Content -Path $knownHostsPath -Value $keys
    Write-Host "Host key added."
  }
} else {
  Write-Host "github.com host key already present in $knownHostsPath"
}

if ($Verify) {
  Write-Host "Verifying SSH connectivity to github.com (this checks transport + host key; auth may still fail if keys aren't configured)..."
  try {
    ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -T git@github.com 2>$null | Out-Null
    Write-Host "SSH handshake completed."
  } catch {
    Write-Warning "SSH verification failed. If this is an auth failure, confirm your SSH key is loaded and has access to the repo."
    Write-Warning $_.Exception.Message
  }
}
