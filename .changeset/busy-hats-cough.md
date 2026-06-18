---
'@papra/app': patch
---

Replace the AWS S3 SDK (`@aws-sdk/client-s3` + `@aws-sdk/lib-storage`) with the zero-dependency `s3mini` for document S3 storage. This removes 97 transitive packages (~23 MB unpacked) from the server, replacing them with a single more performant and dependency-free package.
