Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('d:\DzHerba\startup.zip')
$dirs = @{}
$files = 0
foreach ($entry in $zip.Entries) {
    $parts = $entry.FullName.Split('/')
    if ($parts.Length -gt 2 -and $parts[1] -ne '') {
        $dirs[$parts[1]] = $true
    }
    if (-not $entry.FullName.EndsWith('/')) {
        $files++
    }
}
Write-Output ("Total unique plant folders in startup.zip: " + $dirs.Keys.Count)
Write-Output ("Total files in startup.zip: " + $files)
Write-Output ("Total entries in startup.zip: " + $zip.Entries.Count)
$zip.Dispose()
