For licensing, check out https://github.com/n8n-io/n8n

Security model

- Should values be logged? (yes, but offer ability to disable)
- Should access to KV Client audit records be restricted? (yes, available only to admin roles)

=======================
EE = Enterprise edition
=======================

TODO Phase 1:
1. Import/Export (maybe phase 2?)
2. Support self-hosted KV
3. Validation of inputs => auto enable/disable primary buttons
4. Implement "info" icon on connections page
5. Enforce timeouts for ops
6. Write more tests
7. Validate logout covers everything
8. Failure handling if token expires or is irretrievable
9. Output console warning if KV_CLIENT_ENCRYPTION_KEY is not supplied
10. Do we need userState.connection?  What's it for?

TODO Release:
1. Documentation
2. Testing
3. How to distribute
4. Remove all console.logs
5. Clean up every module (document, imports, formatting)
6. TODO/FIXMEs

Blocked:
10. Partials for list page navigation (possibly blocked by https://github.com/denoland/fresh/issues/2174)

Phase 2:
1. EE - Browse audit logs
2. Optional OAuth2 authentication
3. Connections filter
4. Introduce configuration


Config
* ability to connect to this KV instance, part of role based access
* read only
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