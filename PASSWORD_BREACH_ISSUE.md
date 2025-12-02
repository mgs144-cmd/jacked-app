# Password Breach Warning - Supabase Security Feature

## What is this?

When a user tries to sign up or reset their password, Supabase checks the password against a database of known breached passwords. If the password was found in a data breach, Supabase will reject it and show the message:

> "Password found in data breach"

## Why does this happen?

This is a **security feature** built into Supabase to protect users from using weak or compromised passwords. It uses the [Have I Been Pwned](https://haveibeenpwned.com/) database to check passwords.

## Can we disable it?

**No, this cannot be disabled.** It's a security feature that Supabase enforces to protect user accounts.

## What should users do?

Users need to:
1. **Choose a stronger password** that hasn't been in a data breach
2. **Use a unique password** that they haven't used elsewhere
3. **Consider using a password manager** to generate strong, unique passwords

## Recommendations for users:

- Use at least 12 characters
- Include uppercase, lowercase, numbers, and symbols
- Don't use common words or phrases
- Don't reuse passwords from other accounts
- Use a password manager (like 1Password, LastPass, or Bitwarden)

## For Clare specifically:

Since Clare is seeing this error, she needs to:
1. Try signing up again with a different, stronger password
2. Or if she's resetting her password, choose a new password that hasn't been in a breach
3. Consider using a password manager to generate a secure password

## Technical Details

This check happens on the Supabase Auth side, not in our application code. We cannot bypass or disable it - it's a security feature that protects all users.

