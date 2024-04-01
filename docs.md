# KV Client

A web browser based database client for viewing and managing data in Deno KV stores.


# Table of Contents
TODO complete TOC
1. [Connections](#connections)
    * [Local](#local)
    * [Deploy](#deploy)
    * [Self-hosted](#self-hosted)
2. [Working with keys](#working-with-keys)
3. [Working with values](#working-with-values)
    * [Setting natively supported types](#setting-natively-supported-types)
    * [Setting additionally supported types](#setting-additionally-supported-types)
        - [Using Type templates](#using-type-templates)
    * [Viewing key/value entries](#viewing-keyvalue-entries)
    * [Type limitations](#type-limitations)
4. [Operations](#operations)
    * [Get](#get)
    * [List](#list)
        - [Searching](#searching)
        - [Viewing results](#viewing-results)
        - [Operating on results](#operating-on-results)
    * [Set](#set)
    * [Import](#import)
    * [Export](#export)
5. [Consistency and Caching](#consistency-and-caching)
6. [Logs](#logs)
7. [Security](#security)
    * [Session](#session)
    * [Access tokens](#access-tokens)
        - [Deno Deploy tokens](#deno-deploy-tokens)
        - [Self-hosted tokens](#self-hosted-tokens)
        - [Token encryption](#token-encryption)
    * [Auditing](#auditing)

### Installation

```sh
deno run -A -r https://some.url/install (TODO)
```

### Using KV Client
 (TODO)
After installation

It is highly recommended that you create an encryption token for secure storage of access tokens. A
common use case is to set this as an environment variable. See [Token encryption](#token-encryption) below.


# Connections

Before working with KV Client, you must first establish one or more connections. KV Client supports
3 different connection types.

## Local

Local connections are for Deno KV databases located on the same machine as KV Client is running on.
When adding a local connection, KV Client will automatically attempt to discover all databases
automatically created by Deno (through `Deno.openKv()` where a specific location hasn't been used).
For each auto-discovered KV database, a selection of key/value pairs is displayed to help identify
the database. Databases which haven't been auto-discovered may still be used by supplying the exact
location of the database. Local connections setup are shared across all users.

## Deploy

Deploy connections are for all projects hosted in Deno Deploy. To establish these connections you
will need an access token from the Deploy dashboard. You can create a new access token in the
`Settings` tab in Deploy under `Access Tokens`. Once you have an access token, you can connect KV
Client to Deploy KV databases, which auto-populate the connections. Deploy connections are user
specific and are not shared with any other user.

## Self-hosted

Self-hosted KV databases are non-local KV databases which you host yourself, and which are accessed
over an HTTP connection. When creating a connection for a self-hosted database, you will need both
the URL used to access the database as well as the access token specific for the self-hosted
database (this is different from the access token in Deploy). Self-hosted connections are shared
across all users.

**NOTE** There is a current issue with self-hosted instances where if the URL is entered
incorrectly, Deno will forever attempt to connect without failing. If this occurs to you, please
restart KV Client and remove the self-hosted connection with the incorrect URL.

# Working with keys

At the heart of Deno KV are the keys by which the data is indexed. A `Deno.KvKey` is an array of
`Deno.KvKeyPart`. And each `Deno.KvKeyPart` is one of: Uint8Array, string, number, bigint or
boolean. A key may be made up of one part, or many parts, and the parts may be of different types.
In KV Client you also enter keys as an array of parts. KV Client infers the types from the format of
the key part and the array brackets are provided for you. Here are examples of entering keys into
one of the KV Client key fields:

| Deno.KvKey                                         | Input this into KV Client        |
| -------------------------------------------------- | -------------------------------- |
| ["Hello world"]                                    | "Hello world"                    |
| [105834]                                           | 105834                           |
| [18014398509481982n]                               | 18014398509481982n               |
| [true]                                             | true                             |
| [new Uint8Array([255,0,62])]                       | [255,0,62]                       |
| ["orders", 1001, "shipping"]                       | "orders", 1001, "shipping"       |
| ["abc", 123, 456n, false, new Unit8Array([0,1,2])] | "abc", 123, 456n, false, [0,1,2] |

# Working with values

## Setting natively supported types

Native types work everywhere with no special handling required (native in this context is simply a
type which works 'as is' everywhere). They work equally well as the KV value or value of an object,
Map, Array, etc. Examples shown are what you would type for the value in KV Client when setting a
value.

| Type    | Example as KV value    | Example setting value within a data structure |
| ------- | ---------------------- | --------------------------------------------- |
| boolean | true                   | { myBoolean: true }                           |
| null    | null                   | { myNull: null }                              |
| number  | 1234                   | { myNumber: 1234 }                            |
| string* | hello world            | { myString: "hello world" }                   |
| JSON*   | { "myKey": "myValue" } | {myJSON: '{ "myKey": "myValue" }' }           |

\* Note that strings and JSON are unquoted when used as primary KV value and quoted when used within
other data structures

## Setting additionally supported types

In addition to the natively supported types above, KV Client also supports a number of other data
types and data structures. As all values submitted through the UI are essentially strings which are
parsed via a JSON5 parser, types which are not natively supported by JSON5 parsing must be handled
specially. Each has a straightforward shorthand notation for primary KV values, however a longer
notation must be used when embedding within other data structures (e.g object, Map, Array, etc.) in
the format of `{ type: <valueType>, value: <actualValue> }`. Examples shown are what you would type
into KV Client when setting a value.

| KV Value Type | Example as KV value                     | Example setting value within a data structure                            |
| ------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| bigint        | 123456n                                 | { myBigInt: { type: "bigint", value: "1234213421352n" }}                 |
| Array         | [ 1, 2, 3 ]                             | { myArray: [ 1,2,3]}                                                     |
| Map           | [["key1", "value1"],["key2", "value2"]] | { myMap: { type: "Map", value: [["key1", "value1"],["key2", "value2"]]}} |
| Set           | ["key1","key2"]                         | { mySet: { type: "Set", value: ["key1", "key2"] }}                       |
| Date          | 628021800000                            | { myDate: { type: "Date", value: 628021800000}}                          |
|               | 1995-12-17T03:24:00.000Z                | { myDate: { type: "Date", value: "1995-12-17T03:24:00.000Z" }}           |
| object        | { key: "value" }                        | { myObj: { anotherObj: "hello"}}                                         |
| KvU64         | 12345678901234567890n                   | { myKvU64: { type: "KvU64", value: "12345678901234567890" }}             |
| RegExp        | /^([1-9]\d*)$/                          | { myRegExp: { type: "RegExp", value: "/^([1-9]\d*)$/"}}                  |
| Uint8Array    | [232, 0, 123]                           | { myUnit8Array: { type: "Uint8Array", value: [232, 0, 123]}}             |

### Using Type templates

When setting data structures, you must use the long form for non-native types when storing these
within the data structure. For example, if you set a value to `{ x: [1,2,3]}`, is the type of 'x' an
array of numbers? A set? Maybe a Uint8Array? We need more type detail to be included. This is where
long-form values are needed. Example of these are shown in the right hand column of the table above.
However, using these can be tedious, which is where the 'Type templates' comes into play. Let's say
you want to have an array of Date objects. When setting the value, ensure the 'Value Type' is Array.
This will enable the type templates. In the value box, enter the brackets for the array, e.g. `[]`,
place the cursor between the brackets and select 'Date' from the 'Type templates' dropdown and
finally click on 'Insert'. This will insert into the code something like
`{ type: "Date", value: "2024-03-30T20:28:51.332Z" }`. you can now modify the date as needed.
Inserting two dates (don't forget the comma separator) would yield:

```ts
[
  { type: "Date", value: "2024-01-01T00:00:00.000Z" },
  { type: "Date", value: "2024-03-31T23:59:59.999Z" },
];
```

## Viewing key/value entries

Not all types can be set via KV Client. Types whose values can be modified or set are shown above
including how the value would be shown in KV Client. Anything outside the above is rendered to a
string via `JSON5.stringify(kvValue)`. Types are derived from the type itself, or in the case of an
object, from the constructor name.

## Type limitations

- **undefined** - support for undefined values is limited. It is not possible to set a value as
  undefined. If a KV value (or value within a data structure) is undefined, this will display
  correctly on viewing. If however the undefined value is, e.g., a property of an object and you
  modify the object (leaving the undefined property alone), the undefined property is removed from
  the object. E.g. given `{a: 5, b: undefined}` and you set it via the UI to `{a:6, b: undefined}`
  this will save as `{a:6}`.
- **Strings** which are solely a number ending with 'n' are auto-converted to BigInt
- Outside of the specific types listed in the tables above, you can only view and not set these.
  E.g. `Int16Array`, `Uint16Array`, etc.

# Operations

After selecting a connection, you can perform the below operations with it.

## Get

If you know the exact key you wish to work with, this is the ideal operation to use. Enter the key,
and choose 'Get' to fetch the KV entry. This is equivalent to using, e.g. `kv.get(["some key"])`. If
found, the value will be shown below alongside the type of the value. You can then edit, copy (to
another connection) or delete the entry. No caching is used with 'Get' and entries are always
fetched directly from KV.

## List

If you wish to browse or view a range of your KV data, then using the list operation is the best
choice. This is equivalent to using, e.g.
`kv.list({prefix: ["some key"]}, {limit: 10, reverse: false})`.

### Searching

Just like the KV list interface you can specify a prefix, start and/or end key to control which data
is displayed. For details on how to use these, see
https://docs.deno.com/deploy/kv/manual/operations#list. You can also choose how many entries are
returned with 'limit', whether to reverse the results and if you wish to disable the cache when
listing. To see all entries in KV, leave prefix, start and end blank and set 'limit' to 'all'.

### Viewing Results

Results are shown in a table below the search criteria. Rows will show you the key, value and type
of the value. Hovering over a value will show a sneak peak of the value. Clicking on a row will show
you the entry in full. Here you can see the full key and value. Back in the main results table, you
can filter the results with any free text search (this free text searches both the key and value
fields). Note that filtering is only applied to the search results and not to all KV entries. At the
bottom of the results are some stats about where the results came from (e.g. cached or not) and how
long the operation took. Under the table are paging controls and a drop down to select how many rows
to show on a page.

### Operating on Results

Selecting one or more rows through the checkbox on the left will allow you to delete those rows or
copy them to another KV connection. You can also select all rows displayed through the checkbox
column header (note, this only selects visible rows, which may not include all results). If no
checkboxes are selected, you can delete or copy all search results. To modify the value of an entry,
select the row to bring up the entry in full and select 'Edit value'.

## Set

'Set' allows you to insert or overwrite an entry in KV. This is equivalent to
`kv.set(["my key"], { hello: "world"})`. When setting values it will error out by default if the key
already exists. You can override this behavior by unticking the 'Do not overwrite' checkbox.

## Import

Import is used to bring all data from either a file (e.g. a KV database file of type sqlite) or
another KV connection. For both file based and connection based imports, all entries are 'set' into
the working connection. Any existing keys will be overwritten.

## Export

Export is used to create a sqlite file of all data in the connection, downloaded to your device. In
essence, this duplicates your KV store as a local (to you) file. CAUTION: There are no consistency
guarantees with this operation for databases with more than 500 entries. Data is retrieved from the
connection using 'list', which can only guarantee consistency for up to 500 entries per batch. If
you have more entries than this in your store then consistency is not guaranteed between batches. If
the purpose of your export is for backups, then the following options are likely better suited:

- Deploy - See https://docs.deno.com/deploy/kv/manual/backup
- Local or self-hosted - Simply locate the db file(s) and copy it.

If neither are suitable, then you can ensure consistency by taking down service (to ensure no
modifications occur) while you perform the export.

# Consistency and Caching

Strong consistency is used for most operations. Caching is use session specific. E.g. search results
are not globally cached. Operations which modify entires will invalidate the cache.

| Operation | Consistency   | Caching                                        |
| --------- | ------------- | ---------------------------------------------- |
| Get       | Strong        | None                                           |
| List      | Strong (*)    | Results cached for 24 hours                    |
| Set       | Strong        | None                                           |
| Copy      | n/a           | Copied entry or entries referenced from cache  |
| Delete    | n/a           | Deleted entry or entries referenced from cache |
| Import    | Strong        | None                                           |
| Export    | Eventual (**) | None                                           |

\* The list results are strongly consistent within batches of 500, the maximum which you can
retrieve from KV at once. There is no consistency guarantee between batches of 500.

\*\* Eventual consistency is used for Export to take advantage of the higher performance. As this
operation uses `list` to extract the data from the source DB, it's only consistent within batches of
500 keys so you might as well use eventual consistency for it's higher performance

# Logs

Logs are available in the console output. You may set the log level output via the environment
variable `KV_CLIENT_LOG_LEVEL` which defines the minimum level for logging. Valid values are
`"DEBUG", "INFO", "WARN", "ERROR"`.

# Security

KV Client aims to be as secure as possible.

## Session

All users are given sessions controlled by a session-based cookie. You start as an anonymous user,
but can upgrade your session by connecting to your Deno Deploy account with a Deploy access token.
The user menu in the top right allows you to 'Clear data' (for anonymous users) or 'Log out' (for
users connected to Deploy). Both will remove user data from memory, delete Deploy access tokens,
close KV connections and clear any cached data, in addition to removing the old session cookie.

## Access tokens

Connecting to Deploy or self-hosted KV databases requires an access token. These tokens effectively
give root/admin access to the database therefore it is very important to protect these tokens from
exposure. To prevent you having to re-enter your token on every operation, KV Client stores access
tokens in a database which is reused on subsequent KV operations.

### Deno Deploy tokens

Deno Deploy tokens are stored against the session of the user, meaning only the user who added that
token (which was stored against their unique session cookie) can access Deploy using that token.

### Self-hosted tokens

In contrast, self-hosted tokens are stored against the connection and used by anyone with access to
KV Client.

### Token encryption

All tokens are encrypted at rest in the database and never directly accessible to a user. KV Client
protects against token leakage in a multi-user environment by using a mutex when establishing the
connection. Tokens are encrypted using either an in-memory encryption key (generated on process
start) or via a user-supplied value. In-memory keys are lost on process termination requiring Deploy
connectivity to be reestablished and self-hosted connections to be re-entered. It is recommended for
the user to supply an encryption key (aka password) via the `KV_CLIENT_ENCRYPTION_KEY` environment
variable. There are no restrictions on the encryption key/password in length or complexity.

## Auditing

All operations are logged as audits which expire after 30 days. Audits may be found in the KV Client
KV database under the `"audit"` prefix. The user who initiated the operation is included in the
audit, either as anonymous (with session id) or as the Deploy user name. Example audit for user Joe,
who ran `list` for key's prefixed with `"User"`, limiting to 50 results and which took 334ms to
complete:

```javascript
{
  auditType: "list",
  executorId: "Joe Bloggs (jbloggs)",
  prefixKey: "\"User\"",
  startKey: "",
  endKey: "",
  limit: "50",
  reverse: false,
  results: 50,
  readUnitsConsumed: 7,
  connection: "high-chicken-79 (Deploy playground), cc6d1caf-509a-4904-a1a0-5118a585331d",
  infra: "Deploy",
  rtms: 334,
  aborted: false,
}
```
