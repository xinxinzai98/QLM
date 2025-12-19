# 物料管理系统 - PowerShell一键启动脚本（根目录版本）
# 此脚本会调用 scripts/windows/start.ps1

$scriptPath = Join-Path $PSScriptRoot "scripts\windows\start.ps1"
& $scriptPath

