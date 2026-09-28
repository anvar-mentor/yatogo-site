# NetAngels: review and deployment procedure

Nothing below has been executed on production. Existing backup:
`/var/www/yatogo_backup_2026-09-28` (reported by the owner, not independently inspected).

Public flow: GitHub → reviewed merge into `server-current` → NetAngels.
Never deploy `main` or `seo-optimization` directly. Before merge, review the complete diff.

The HTML update and nginx query-language routing are one release requirement. Otherwise
UZ/EN still get Russian metadata before JS and private render targets may be public.
Review `nginx-language-map.conf.example` in the `http` context and
`nginx-locations.conf.example` in the existing HTTPS `server` context. Preserve the
actual certificates, headers, ACME configuration and other active server settings.
Do not replace the complete nginx configuration with either snippet.

The examples passed an isolated nginx 1.28.3 Windows syntax and HTTP routing test
(RU/UZ/EN, query preservation, 404, internal-file protection). They have not been run
against the production Ubuntu nginx configuration. Validate
them with `nginx -t` on the server before reloading; stage both repository and nginx
changes during an approved deployment window. Keep the previous nginx config as well
as the site backup. Stop if the real checkout or nginx differs from the assumptions.

## One command per step

Run steps individually and inspect the result before proceeding. The first step is the
only command to send to the owner until they authorize deployment and return its output.

1. Inspect branch and changes. If anything is modified/untracked, stop and preserve it.

   `git -C /var/www/yatogo status --short --branch`

2. Confirm the checked-out branch is exactly server-current.

   `git -C /var/www/yatogo branch --show-current`

3. Confirm origin is the expected repository, using the existing configured SSH key.

   `git -C /var/www/yatogo remote get-url origin`

   Expected: `git@github.com:anvar-mentor/yatogo-site.git`.

4. Fetch without changing working files.

   `git -C /var/www/yatogo fetch origin server-current`

5. Inspect ahead/behind counts. Divergence or unexpected local commits means stop.

   `git -C /var/www/yatogo rev-list --left-right --count HEAD...origin/server-current`

6. Inspect incoming commits. Match the final SHA against the approved merge.

   `git -C /var/www/yatogo log --oneline HEAD..origin/server-current`

7. Review the exact incoming diff, including the verification file and robots/sitemap.

   `git -C /var/www/yatogo diff HEAD..origin/server-current`

8. Save an additional Git recovery reference using a unique release-specific name.
   If that name exists, stop and choose a new one; do not overwrite it.

   `git -C /var/www/yatogo branch backup/pre-seo-release`

9. Recheck cleanliness immediately before the update. Stop if it changed.

   `git -C /var/www/yatogo status --short --branch`

10. Only after the exact fetched commit and nginx plan have been approved, fast-forward.

    `git -C /var/www/yatogo merge --ff-only origin/server-current`

11. After the approved nginx edits, validate the complete server configuration.

    `sudo nginx -t`

12. Only when validation succeeds, activate it.

    `sudo systemctl reload nginx`

13. Confirm HEAD matches the approved release.

    `git -C /var/www/yatogo rev-parse HEAD`

14. Confirm the checkout is clean after deployment.

    `git -C /var/www/yatogo status --short --branch`

Then check raw HTML at `/`, `?lang=ru`, `?lang=uz`, `?lang=en`, canonical and metadata;
404 on an unknown URL and on `/seo/en.html`; HTTP/www redirects; all versioned assets;
robots, sitemap and Yandex verification; desktop/mobile, languages, FAQ, tariffs and
the form without sending a real lead. Add language URLs/hreflang only in a separately
reviewed follow-up once these checks pass. No re-submission to webmaster tools is automatic.

## Rollback

Do not run reset --hard or force-push. Use the saved backup and a reviewed revert commit
in server-current together with restoration of the previous nginx configuration. If
urgent file restoration is required, obtain explicit approval first; the exact command
depends on the actual checkout, backup contents and server config observed at deployment.
