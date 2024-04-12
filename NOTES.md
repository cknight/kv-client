For licensing, check out https://github.com/n8n-io/n8n

Security model

- Should values be logged? (yes, but offer ability to disable)
- Should access to KV Client audit records be restricted? (yes, available only to admin roles)

# ======================= EE = Enterprise edition

TODO Phase 1:

1. Add client<->server integrity checks on delete data? E.g. number of keys check
2. Prepare for JSR a. migrate dependencies b. test Deno.serve() app in jsr c. if b works, then test
   install script around it
3. Adopt Fresh alpha release

TODO Release:

2. Testing ✓
3. How to distribute (jsr hopefully!)

Blocked:

1. Partials for list page navigation (possibly blocked by
   https://github.com/denoland/fresh/issues/2174)
2. Issue with self-hosted connections and invalid URLs
   (https://github.com/denoland/deno/issues/22248)

Phase 2:

1. EE - Browse audit logs
2. Optional OAuth2 authentication
3. Connections filter
4. Introduce configuration
5. Mobile responsiveness
6. Tracking/Analytics
7. Key tree
8. Copy from get/list to file
9. Enforce confirmation of delete all? (type "delete all data" or some such)
10. Store self-hosted connections by session id? E.g. avoid sharing self-hosted connections
    globally? Or some other solution to improve security? Might be annoying if the connection keeps
    disappearing.
11. Abortable list
12. Light mode
13. Analytics (key count tree, min/max sizes?)

Config

- ability to connect to this KV instance, part of role based access
- allow connection id to be marked as production
- restrictions on specific connections or environments:
  - permit read, copy from, copy into, delete, set, 'all'
  - allow connection
  - deny connection
- No global read, no global delete, no global copy/export
- Log level
- Cache time in ms
- Record audit records - yes/no
- Allow values in audit records - yes/no
- EE - maximum execution time? Or maybe maximum entries size?
- EE - maximum memory usage?
- EE - maximum budget for Deploy access read/write?
- EE - require auth?
- EE - role based access definitions (read/write/delete/update/copy/export/import, project
  allowlist, project denylist)

EE - Role based access - Enterprise capability

- Need admin role somehow? Store credentials in KV with short expiry, output to console on startup
  if no admin user. Need recovery option
- Need UI screen to allocate roles to user
- OAuth logins

# DOCS

Installation Connections Keys Values Operations

- Get
- List -- filtering -- search all data
- Set
- Import
- Export Consistency Security
