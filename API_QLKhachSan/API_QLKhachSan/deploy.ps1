# deploy.ps1 - Tu dong publish va upload len MonsterASP.NET
$FTP_HOST = "site69261.siteasp.net"
$FTP_USER = "site69261"
$FTP_PASS = "q_2J9P#tg=3Q"
$REMOTE_ROOT = "/wwwroot"
$PUBLISH_DIR = "$PSScriptRoot\publish"

# File khong upload de bao toan cai dat production tren server
$SKIP_FILES = @("appsettings.json", "appsettings.Development.json")

function Upload-File($localPath, $remotePath) {
    $url = "ftp://$FTP_HOST$remotePath"
    $request = [System.Net.FtpWebRequest]::Create($url)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
    $request.UseBinary = $true
    $request.UsePassive = $true
    $bytes = [System.IO.File]::ReadAllBytes($localPath)
    $request.ContentLength = $bytes.Length
    $stream = $request.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    try { $request.GetResponse().Close() } catch {}
}

function Create-FtpDir($remotePath) {
    $url = "ftp://$FTP_HOST$remotePath"
    $request = [System.Net.FtpWebRequest]::Create($url)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
    $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
    $request.UsePassive = $true
    try { $request.GetResponse().Close() } catch {}
}

function Delete-FtpFile($remotePath) {
    $url = "ftp://$FTP_HOST$remotePath"
    $request = [System.Net.FtpWebRequest]::Create($url)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::DeleteFile
    $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
    $request.UsePassive = $true
    try { $request.GetResponse().Close() } catch {}
}

function Upload-String($content, $remotePath) {
    $url = "ftp://$FTP_HOST$remotePath"
    $request = [System.Net.FtpWebRequest]::Create($url)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
    $request.UsePassive = $true
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
    $request.ContentLength = $bytes.Length
    $stream = $request.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    try { $request.GetResponse().Close() } catch {}
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  DEPLOY: namha-hotelmanagement" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Buoc 1: Publish
Write-Host "[1/4] Dang publish project..." -ForegroundColor Yellow
dotnet publish "$PSScriptRoot\API_QLKhachSan.csproj" -c Release --self-contained false -o $PUBLISH_DIR --nologo -v quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "     THAT BAI khi publish!" -ForegroundColor Red
    exit 1
}
Write-Host "     Publish thanh cong" -ForegroundColor Green

# Buoc 2: Tat app
Write-Host "[2/4] Dang tat app tren server..." -ForegroundColor Yellow
Upload-String "<html><body><h2>Dang cap nhat, vui long cho...</h2></body></html>" "$REMOTE_ROOT/app_offline.htm"
Start-Sleep -Seconds 2
Write-Host "     App da offline" -ForegroundColor Green

# Buoc 3: Upload files
Write-Host "[3/4] Dang upload files..." -ForegroundColor Yellow
$allFiles = Get-ChildItem -Path $PUBLISH_DIR -Recurse -File | Where-Object { $SKIP_FILES -notcontains $_.Name }
$total = $allFiles.Count
$i = 0

foreach ($file in $allFiles) {
    $i++
    $rel = $file.FullName.Substring($PUBLISH_DIR.Length).Replace("\", "/")
    $remote = "$REMOTE_ROOT$rel"

    $parentDir = $remote.Substring(0, $remote.LastIndexOf("/"))
    if ($parentDir -ne $REMOTE_ROOT) {
        Create-FtpDir $parentDir
    }

    Write-Host "     [$i/$total] $rel" -ForegroundColor Gray
    Upload-File $file.FullName $remote
}
Write-Host "     Upload hoan tat ($total files)" -ForegroundColor Green

# Buoc 4: Bat lai app
Write-Host "[4/4] Dang khoi dong lai app..." -ForegroundColor Yellow
Delete-FtpFile "$REMOTE_ROOT/app_offline.htm"
Write-Host "     App da online" -ForegroundColor Green

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  DEPLOY THANH CONG!" -ForegroundColor Green
Write-Host "  http://namha-hotelmanagement.runasp.net" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
