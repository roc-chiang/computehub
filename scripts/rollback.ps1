# 版本回退脚本
# 使用方法: .\scripts\rollback.ps1 -Version v0.8.1

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ComputeHub 版本回退工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否在 Git 仓库中
$gitRepo = git rev-parse --is-inside-work-tree 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "错误: 当前目录不是 Git 仓库！"
    exit 1
}

# 检查版本标签是否存在
Write-Host "检查版本标签..." -ForegroundColor Yellow
$tagExists = git tag -l $Version
if (-not $tagExists) {
    Write-Error "错误: 版本 $Version 不存在！"
    Write-Host ""
    Write-Host "可用的版本标签:" -ForegroundColor Green
    git tag -l
    exit 1
}

Write-Host "✓ 版本 $Version 存在" -ForegroundColor Green
Write-Host ""

# 显示当前版本信息
Write-Host "当前版本信息:" -ForegroundColor Yellow
$currentBranch = git branch --show-current
$currentCommit = git rev-parse --short HEAD
Write-Host "  分支: $currentBranch" -ForegroundColor White
Write-Host "  提交: $currentCommit" -ForegroundColor White
Write-Host ""

# 显示目标版本信息
Write-Host "目标版本信息:" -ForegroundColor Yellow
git show $Version --quiet
Write-Host ""

# 确认操作
Write-Host "警告: 此操作将回退到版本 $Version" -ForegroundColor Red
Write-Host "当前工作将被保存到备份分支中" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "确认继续? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "操作已取消" -ForegroundColor Yellow
    exit 0
}

# 检查是否有未提交的更改
Write-Host ""
Write-Host "检查未提交的更改..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "发现未提交的更改:" -ForegroundColor Red
    git status --short
    Write-Host ""
    $stashConfirm = Read-Host "是否暂存这些更改? (y/N)"
    if ($stashConfirm -eq 'y' -or $stashConfirm -eq 'Y') {
        git stash save "自动暂存 - 回退到 $Version 之前"
        Write-Host "✓ 更改已暂存" -ForegroundColor Green
    } else {
        Write-Error "请先提交或暂存您的更改"
        exit 1
    }
}

# 创建备份分支
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupBranch = "backup-$timestamp"
Write-Host ""
Write-Host "创建备份分支: $backupBranch" -ForegroundColor Yellow
git branch $backupBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ 备份分支已创建" -ForegroundColor Green
} else {
    Write-Error "创建备份分支失败！"
    exit 1
}

# 回退到指定版本
Write-Host ""
Write-Host "回退到版本 $Version..." -ForegroundColor Yellow
git checkout $Version

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✓ 成功回退到版本 $Version" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "备份信息:" -ForegroundColor Cyan
    Write-Host "  备份分支: $backupBranch" -ForegroundColor White
    Write-Host ""
    Write-Host "恢复选项:" -ForegroundColor Cyan
    Write-Host "  返回最新版本: git checkout main" -ForegroundColor White
    Write-Host "  返回备份分支: git checkout $backupBranch" -ForegroundColor White
    Write-Host ""
} else {
    Write-Error "回退失败！"
    exit 1
}
