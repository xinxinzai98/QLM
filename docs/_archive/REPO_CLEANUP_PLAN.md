# Repository Cleanup Plan

## 1. Directory Structure Optimization

**Goal**: clear separation of concerns (Src, Docs, Ops, Scripts).

### 1.1 Move Root Scripts to `scripts/`
- `start.bat` -> `scripts/windows/start.bat`
- `start.ps1` -> `scripts/windows/start.ps1`
- `install-dependencies.bat` -> `scripts/windows/install-dependencies.bat`
- `fix-vulnerabilities.bat` -> `scripts/windows/fix-vulnerabilities.bat`
- `start.sh` -> `scripts/start.sh`
- `deploy_to_aliyun.sh` -> `scripts/deploy_to_aliyun.sh`
- `fix-vulnerabilities.sh` -> `scripts/fix-vulnerabilities.sh`

### 1.2 Archive Old Reports
- `docs/reports/` -> `docs/_archive/reports/`
- Reason: Historical artifacts interfere with current documentation navigation.

### 1.3 Consolidate Ops
- Ensure `ops/` contains Nginx configs.
- `Dockerfile` & `docker-compose*.yml` stay in Root (Standard convention for Docker).

## 2. Documentation Reorganization
- `docs/api/` -> Keep
- `docs/deployment/` -> Keep
- `docs/development/` -> Keep
- `docs/user-guide/` -> Keep
- `docs/USER_ADMIN_MANUAL.md` -> Move to `docs/user-guide/` or Keep if it's the main entry.
- `docs/TECHNICAL_ARCHITECTURE.md` -> Keep.

## 3. Execution Steps
1. Create directories: `scripts/windows`, `docs/_archive`.
2. Move files.
3. Update `README.md` to point to new script locations.
