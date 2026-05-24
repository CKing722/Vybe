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

function Add-GitHubHostKeyViaKeyscan {
  if (-not (Get-Command ssh-keyscan -ErrorAction SilentlyContinue)) { return $false }

  $keys = @()
  try {
    $keys = ssh-keyscan -T 10 -t ed25519 github.com 2>$null
    if (-not $keys) {
      $keys = ssh-keyscan -T 10 github.com 2>$null
    }
  } catch {
    $keys = @()
  }

  if (-not $keys) { return $false }

  Add-Content -Path $knownHostsPath -Value $keys
  return $true
}

function Add-GitHubHostKeyViaSshAcceptNew {
  try {
    # On some Windows OpenSSH builds, `ssh-keyscan` can fail negotiating modern KEX with github.com.
    # `StrictHostKeyChecking=accept-new` adds the host key safely without interactive prompts.
    ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new -o KexAlgorithms=curve25519-sha256 -T git@github.com 2>$null | Out-Null
  } catch {
    # Auth can fail (Permission denied) and that's OK; the goal is host key bootstrapping.
  }

  return (KnownHosts-HasGitHubKey)
}

if (-not (KnownHosts-HasGitHubKey)) {
  Write-Host "Bootstrapping github.com host key in $knownHostsPath"

  $added = Add-GitHubHostKeyViaKeyscan
  if (-not $added) {
    $added = Add-GitHubHostKeyViaSshAcceptNew
  }

  if ($added) {
    Write-Host "Host key present."
  } else {
    Write-Warning "Unable to add github.com host key automatically. If you run 'ssh -T git@github.com', OpenSSH may prompt to trust the host key interactively."
  }
} else {
  Write-Host "github.com host key already present in $knownHostsPath"
}

if ($Verify) {
  Write-Host "Verifying SSH connectivity to github.com (this checks transport + host key; auth may still fail if keys aren't configured)..."
  try {
    ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=yes -T git@github.com 2>$null | Out-Null
    Write-Host "SSH handshake completed."
  } catch {
    Write-Warning "SSH verification failed. If this is an auth failure, confirm your SSH key is loaded and has access to the repo."
    Write-Warning $_.Exception.Message
  }
}
