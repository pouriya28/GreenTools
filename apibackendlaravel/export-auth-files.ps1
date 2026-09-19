$OutputFile = "auth-files.md"

$Files = @(
    'app\Http\Controllers\Api\V1\Auth\AdminAuthController.php',
    'app\Http\Controllers\Api\V1\Auth\AdminPasswordController.php',
    'app\Http\Controllers\Api\V1\Auth\CustomerOtpController.php',
    'app\Http\Controllers\Api\V1\Auth\OperationPasswordController.php',
    'app\Http\Controllers\Api\V1\Auth\TokenController.php',
    'app\Http\Middleware\CustomerAccessMiddleware.php',
    'app\Http\Middleware\EnsureAccountIsActive.php',
    'app\Http\Middleware\EnsureOperationVerified.php',
    'app\Http\Middleware\ResolveOptionalSanctumUser.php',
    'app\Http\Middleware\StaffAccessMiddleware.php',
    'app\Http\Middleware\VerifyOriginForCookie.php',
    'app\Providers\RateLimiterServiceProvider.php',
    'app\Exceptions\Auth\AccountInactiveException.php',
    'app\Exceptions\Auth\InvalidOperationPasswordException.php',
    'app\Exceptions\Auth\OperationVerificationRequiredException.php',
    'app\Exceptions\Auth\RefreshTokenExpiredException.php',
    'app\Exceptions\Auth\RefreshTokenInvalidException.php',
    'app\Exceptions\Auth\RefreshTokenReusedException.php',
    'routes\api\v1\customer_auth.php',
    'routes\api\v1\staff_auth.php'
 

)


$Content = @()
$Content += "# Auth / OTP Files"
$Content += ""
$Content += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$Content += ""

foreach ($File in $Files) {

    if (-not (Test-Path $File)) {
        Write-Warning "File not found: $File"
        continue
    }

    $Content += "---"
    $Content += ""
    $Content += "## $File"
    $Content += ""
    $Content += '```php'
    $Content += Get-Content -Path $File -Raw
    $Content += '```'
    $Content += ""
}

$Content | Set-Content -Path $OutputFile -Encoding UTF8

Write-Host ""
Write-Host "Export completed:"
Write-Host $OutputFile