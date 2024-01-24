For licensing, check out https://github.com/n8n-io/n8n

Security model

- Should values be logged? (yes, but offer ability to disable)
- Should access to KV Client audit records be restricted? (yes, available only to admin roles)

Change 'isDeploy' in Audit records to kvType (Local, Deploy, Managed)

TODO:
1. TODO/FIXMEs
2. Import/Export (maybe phase 2?)
3. Test thoroughly
4. Support self-hosted KV
9. Documentation
10. How to distribute
11. Splash page? (to what purpose?)
14. Hide access to KV Client DB (configurable)
15. Introduce config file
16. Validation of inputs => auto enable/disable primary buttons
17. Reload of DB sizes on connections page
18. Implement "info" icon on connections page
19. Implement 'export' icon on connections page (or defer to import/export tab?)

Blocked:
17. Partials for list page navigation (possibly blocked by https://github.com/denoland/fresh/issues/2174)

Phase 2:
1. Browse audit logs
2. Optional OAuth2 authentication
3. Connections filter
