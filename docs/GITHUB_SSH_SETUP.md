# GitHub SSH Setup (Windows)

If `git` commands fail with `Host key verification failed` for `github.com`, your OpenSSH `known_hosts` file likely does not yet trust GitHub's host key on this machine.

## Quick Fix

From the repo root, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-github-ssh.ps1 -Verify
```

Then re-try:

```powershell
git ls-remote origin
```

## Notes

- This does **not** create the GitHub repository or grant access. It only fixes the host trust/bootstrap step.
- If `ssh -T git@github.com` still fails after this, it's usually because your SSH key isn't configured or doesn't have repo access.
