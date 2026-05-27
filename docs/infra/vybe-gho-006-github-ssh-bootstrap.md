# VYBE-GHO-006 — GitHub SSH Bootstrap (Windows)

This repo is configured with an SSH remote:

```bash
git remote -v
# origin  git@github.com:CKing722/vybe-platform.git (fetch)
# origin  git@github.com:CKing722/vybe-platform.git (push)
```

If `git push` (or `ssh -T git@github.com`) fails with:

```text
git@github.com: Permission denied (publickey).
```

then the local public key being offered is not authorized on the GitHub account (or repo deploy keys).

## Current Key On This Machine

Private key:

`C:\Users\Damon\.ssh\id_ed25519`

Public key:

`C:\Users\Damon\.ssh\id_ed25519.pub`

Fingerprint:

```text
SHA256:mywC0fylDrxjkRV/a4Xab6yqvrwer9k59W1lEi/HIEo
```

## Damon Action (One-Time)

Add the public key to GitHub for the account that owns `CKing722/vybe-platform`:

1. Open GitHub → **Settings** → **SSH and GPG keys**
2. Click **New SSH key**
3. Type: **Authentication**
4. Paste the contents of `C:\Users\Damon\.ssh\id_ed25519.pub`
5. Save

Alternative: add it as a **deploy key** on the repo (with write access) instead of adding it to the account.

## Validate

After the key is added, these should succeed:

```bash
ssh -T git@github.com
git ls-remote origin
```

