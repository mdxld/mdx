---
"@mdxdb/core": patch
"@mdxdb/sqlite": patch
---

Replace custom YAML parser in schema-discovery with robust implementation from mdxld that supports nested objects. Replace regex-based heading parser with unified/remark-based implementation for better AST handling. Fix SQLite database initialization to properly clean up between tests and resolve index conflicts.
