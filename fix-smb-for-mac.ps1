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

$accountName = 'LENOVOALEX\trbrm'
$hostName = $env:COMPUTERNAME

Write-Host "Configuring SMB for $accountName on $hostName..."

$profiles = Get-NetConnectionProfile | Where-Object {
    $_.IPv4Connectivity -ne 'Disconnected' -and
    $_.InterfaceAlias -notlike 'VMware*' -and
    $_.InterfaceAlias -notlike 'vEthernet*' -and
    $_.InterfaceAlias -notlike 'Bluetooth*'
}

foreach ($profile in $profiles) {
    if ($profile.NetworkCategory -ne 'Private') {
        try {
            Set-NetConnectionProfile -InterfaceIndex $profile.InterfaceIndex -NetworkCategory Private
            Write-Host "Switched network profile to Private for interface '$($profile.InterfaceAlias)'."
        } catch {
            Write-Warning "Could not switch interface '$($profile.InterfaceAlias)' to Private: $($_.Exception.Message)"
        }
    }
}

Get-NetFirewallRule -DisplayGroup 'File and Printer Sharing' |
    Where-Object { $_.Direction -eq 'Inbound' } |
    Enable-NetFirewallRule | Out-Null

Set-SmbServerConfiguration -AnnounceServer $true -Force | Out-Null

Ensure-ShareAccess -ShareName 'D' -AccountName $accountName -AccessRight 'Full'
Ensure-ShareAccess -ShareName 'Map' -AccountName $accountName -AccessRight 'Full'

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
Write-Host 'Done.'
Write-Host "Use this username on the Mac: $accountName"
if ($ipAddress) {
    Write-Host "Connect by IP: smb://$ipAddress/D"
    Write-Host "Connect by IP: smb://$ipAddress/Map"
}
Write-Host "Connect by name: smb://$hostName/D"
Write-Host "Connect by name: smb://$hostName/Map"
