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
7. Border of value editor should be gray if non-editable (and blue if editable).  Check other fields as well.
8. Implement disabled button color?
9. Documentation
10. How to distribute
11. Splash page?
12. Connections filter
13. Fix authentication token routing bug
14. Hide access to KV Client DB
15. Introduce config file
16. Validation of inputs => auto enable/disable primary buttons

Phase 2:
1. Browse audit logs
2. Optional OAuth2 authentication