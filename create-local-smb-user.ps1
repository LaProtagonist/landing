$ErrorActionPreference = 'Stop'

function Assert-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw "Run this script from an elevated PowerShell window (Run as administrator)."
    }
}

function Ensure-ShareAccess {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ShareName,

        [Parameter(Mandatory = $true)]
        [string]$AccountName,

        [Parameter(Mandatory = $true)]
        [ValidateSet('Read', 'Change', 'Full')]
        [string]$AccessRight
    )

    $existing = Get-SmbShareAccess -Name $ShareName
    if (-not ($existing | Where-Object { $_.AccountName -eq $AccountName -and $_.AccessRight -eq $AccessRight -and $_.AccessControlType -eq 'Allow' })) {
        Grant-SmbShareAccess -Name $ShareName -AccountName $AccountName -AccessRight $AccessRight -Force | Out-Null
    }

    $worldSid = New-Object Security.Principal.SecurityIdentifier('S-1-1-0')
    $worldAccount = $worldSid.Translate([Security.Principal.NTAccount]).Value
    if ($existing | Where-Object { $_.AccountName -eq $worldAccount }) {
        Revoke-SmbShareAccess -Name $ShareName -AccountName $worldAccount -Force | Out-Null
    }
}

Assert-Administrator

$userName = 'trbrmrrdr'
$plainPassword = '230490'
$securePassword = ConvertTo-SecureString $plainPassword -AsPlainText -Force
$computerName = $env:COMPUTERNAME
$qualifiedUser = "$computerName\$userName"

$localUser = Get-LocalUser -Name $userName -ErrorAction SilentlyContinue
if (-not $localUser) {
    New-LocalUser `
        -Name $userName `
        -Password $securePassword `
        -FullName 'SMB User' `
        -Description 'SMB access account' `
        -PasswordNeverExpires `
        -UserMayNotChangePassword | Out-Null
}

Enable-LocalUser -Name $userName

$firewallRuleName = 'Codex SMB Inbound 445'
$existingFirewallRule = Get-NetFirewallRule -DisplayName $firewallRuleName -ErrorAction SilentlyContinue
if (-not $existingFirewallRule) {
    New-NetFirewallRule `
        -DisplayName $firewallRuleName `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort 445 `
        -Profile Any | Out-Null
} else {
    Enable-NetFirewallRule -DisplayName $firewallRuleName | Out-Null
}

$profiles = Get-NetConnectionProfile | Where-Object {
    $_.IPv4Connectivity -ne 'Disconnected' -and
    $_.InterfaceAlias -notlike 'VMware*' -and
    $_.InterfaceAlias -notlike 'vEthernet*'
}

foreach ($profile in $profiles) {
    if ($profile.NetworkCategory -ne 'Private') {
        try {
            Set-NetConnectionProfile -InterfaceIndex $profile.InterfaceIndex -NetworkCategory Private
        } catch {
            Write-Warning "Could not switch '$($profile.InterfaceAlias)' to Private: $($_.Exception.Message)"
        }
    }
}

Ensure-ShareAccess -ShareName 'D' -AccountName $qualifiedUser -AccessRight 'Full'
Ensure-ShareAccess -ShareName 'Map' -AccountName $qualifiedUser -AccessRight 'Full'

$aclTargets = @('D:\', 'D:\Map')
foreach ($target in $aclTargets) {
    $acl = Get-Acl $target
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $qualifiedUser,
        'FullControl',
        'ContainerInherit,ObjectInherit',
        'None',
        'Allow'
    )
    $acl.SetAccessRule($rule)
    Set-Acl -Path $target -AclObject $acl
}

$ipAddress = (
    Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -notlike '169.254.*' -and
        $_.IPAddress -notlike '172.16.0.*' -and
        $_.IPAddress -notlike '192.168.116.*' -and
        $_.InterfaceAlias -notlike 'VMware*' -and
        $_.InterfaceAlias -notlike 'vEthernet*'
    } |
    Select-Object -First 1 -ExpandProperty IPAddress
)

Write-Host ''
Write-Host 'SMB local user is ready.'
Write-Host "Username: $qualifiedUser"
Write-Host "Password: $plainPassword"
if ($ipAddress) {
    Write-Host "Connect from Mac: smb://$ipAddress/D"
    Write-Host "Connect from Mac: smb://$ipAddress/Map"
}
