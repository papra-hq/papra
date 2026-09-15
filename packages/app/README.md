# Papra application package

This package contains Papra application, which is distributed as Docker images.

## Versioning

This package uses year-based versioning with the format `YY.MINOR.PATCH`:

- `YY`: The last two digits of the release year.
- `MINOR`: The next feature release within that year. Incrementing this number resets `PATCH` to `0`.
- `PATCH`: A maintenance release for the current minor version, including bug and security fixes.

Versions move forwards along a single release line. Papra doesn't publish maintenance or security patches for older `YY.MINOR` versions.

### Examples

These examples show how application versions progress:

- `26.6.0`: A feature release published in 2026.
- `26.6.1`: A maintenance release for `26.6.0`.
- `26.7.0`: The next feature release in 2026.
- `27.0.0`: The first release in 2027.
