Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = 'd:\DzHerba\startup.zip'
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)

$found = @()
foreach ($entry in $zip.Entries) {
    if ($entry.FullName -match 'borago' -or $entry.FullName -match '/31/' -or $entry.FullName -match '\\31\\') {
        $found += $entry.FullName
    }
}
$zip.Dispose()

Write-Output ("Matches in startup.zip: " + $found.Count)
$found | ForEach-Object { Write-Output $_ }

$dir31 = Test-Path 'd:\DzHerba\startup\startup\31'
Write-Output ("Physical d:\DzHerba\startup\startup\31 exists: " + $dir31)

$searchDisk = Get-ChildItem -Path "d:\DzHerba" -Recurse -Filter "*borago*" -ErrorAction SilentlyContinue
Write-Output ("Files or folders containing 'borago' in d:\DzHerba: " + $searchDisk.Count)
$searchDisk | ForEach-Object { Write-Output $_.FullName }
