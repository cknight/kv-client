For licensing, check out https://github.com/n8n-io/n8n

Security model

- Should values be logged? (yes, but offer ability to disable)
- Should access to KV Client audit records be restricted? (yes, available only to admin roles)

=======================
EE = Enterprise edition
=======================


TODO Phase 1:
1. TODO/FIXMEs
2. Import/Export (maybe phase 2?)
3. Test thoroughly
4. Support self-hosted KV
5. Documentation
6. How to distribute
7. Validation of inputs => auto enable/disable primary buttons
8. Reload of DB sizes on connections page
9. Implement "info" icon on connections page
10. Enforce timeouts for ops
11. Clean up every module (document, imports, formatting)
12. Write more tests
13. Validate logout covers everything

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