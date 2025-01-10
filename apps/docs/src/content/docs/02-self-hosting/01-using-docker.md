---
title: Installing Papra using Docker
description: Self-host Papra using Docker.
slug: self-hosting/using-docker
---

Papra can be easily installed and run using Docker. This method is recommended for users who want a quick and straightforward way to deploy their own instance of Papra with minimal setup.

## Prerequisites

Before you begin, ensure that you have Docker installed on your system. You can download and install Docker from the official Docker website.

## Root and Rootless installation

Papra can be installed in two different ways:

- **Root**: This is the default installation method. It requires root privileges to run. The images are suffixed with `-root` like `corentinth/papra:latest-root` or `corentinth/papra:1.0.0-root`.
- **Rootless**: This method does not require root privileges to run. The images are suffixed with `-rootless` like `corentinth/papra:latest-rootless` or `corentinth/papra:1.0.0-rootless`.

## Image Sources

Papra Docker images are available on both **Docker Hub** and **GitHub Container Registry** (GHCR). You can choose the source that best suits your needs.

```bash frame="none"
# Using Docker Hub
docker pull corentinth/papra:latest-root
docker pull corentinth/papra:latest-rootless

# Using GitHub Container Registry
docker pull ghcr.io/papra-hq/papra:latest-root
docker pull ghcr.io/papra-hq/papra:latest-rootless
```

## Basic Usage

```bash frame="none"
docker run -d --name papra --restart unless-stopped -p 1221:1221 ghcr.io/papra-hq/papra:latest-root
```
