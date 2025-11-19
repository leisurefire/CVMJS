
# 获取当前用户PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

# 添加libwebp到PATH (如果尚未添加)
$libwebpPath = "C:\Users\leisu\AppData\Local\Microsoft\WinGet\Packages\Google.Libwebp_Microsoft.Winget.Source_8wekyb3d8bbwe\libwebp-1.6.0-windows-x64\bin"
if ($currentPath -notlike "*$libwebpPath*") {
    $newPath = $currentPath + ";" + $libwebpPath
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "✓ PATH已更新 (用户级)" -ForegroundColor Green
} else {
    Write-Host "✓ PATH中已包含libwebp目录" -ForegroundColor Yellow
}

# 刷新当前会话的环境变量
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Write-Host "✓ 环境变量已刷新" -ForegroundColor Green

# 验证
Write-Host "`n验证安装:" -ForegroundColor Cyan
img2webp -version
