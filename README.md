<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./img/logo_stroked.png">
  <source media="(prefers-color-scheme: light)" srcset="./static/logo.png">
  <img alt="KV Client logo" src="./img/logo_stroked.png" width="400">
</picture>

KV Client is a UI interface to your Deno KV databases. This repository hosts the application code
for the client. Documentation and installation instructions for KV Client may be found at
https://kv-client.dev.

## Contributing

After cloning this repo, you can run `deno task hooks:install` which will setup the git pre-commit
hooks for this repo. Details of the hooks can be found in `deno.json`, `hooks:pre-commit` task.
