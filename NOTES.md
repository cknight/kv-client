For licensing, check out https://github.com/n8n-io/n8n

Security model

- Should values be logged? (yes, but offer ability to disable)
- Should access to KV Client audit records be restricted? (yes, available only to admin roles)

=======================
EE = Enterprise edition
=======================

TODO Phase 1:
4. Implement "info" icon on connections page
6. Write (lots) more tests
7. Validate logout covers everything
8. Failure handling if token expires or is irretrievable
9. Output console warning if KV_CLIENT_ENCRYPTION_KEY is not supplied
11. Abortable list - Requires REST based list
13. Offer format as JSON button in entry popup for strings
14. Rework unit consumed to be bytes consumed.  Work out units consumed in UI, but store raw bytes in DB.
15. Detect and error out if running in Deploy
18. See Delete/Copy-Data/Key dialogs and isProd.  Change env from string to infra.

TODO Release:
1. Documentation
2. Testing
3. How to distribute
4. Remove all console.logs
5. Clean up every module (document, imports, formatting)
6. TODO/FIXMEs

Blocked:
1. Partials for list page navigation (possibly blocked by https://github.com/denoland/fresh/issues/2174)
2. Issue with self-hosted connections and invalid URLs (https://github.com/denoland/deno/issues/22248)

Phase 2:
1. EE - Browse audit logs
2. Optional OAuth2 authentication
3. Connections filter
4. Introduce configuration
5. Mobile responsiveness
6. Tracking/Analytics
7. Key tree
8. Copy from get/list to file


Config
* ability to connect to this KV instance, part of role based access
* allow connection id to be marked as production
* restrictions on specific connections or environments:
   - permit read, copy from, copy into, delete, set, 'all'
   - allow connection
   - deny connection
* No global read, no global delete, no global copy/export
* Log level
* Cache time in ms
* Record audit records - yes/no
* Allow values in audit records - yes/no
* EE - maximum execution time?  Or maybe maximum entries size?
* EE - maximum memory usage?
* EE - maximum budget for Deploy access read/write?
* EE - require auth?
* EE - role based access definitions (read/write/delete/update/copy/export/import, project allowlist, project denylist)

EE - Role based access - Enterprise capability
* Need admin role somehow? Store credentials in KV with short expiry, output to console on startup if no admin user.  Need recovery option
* Need UI screen to allocate roles to user