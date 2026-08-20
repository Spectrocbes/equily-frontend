# Fetches broker logos once and writes them to public/assets/logos/brokers/.
#
# They are committed rather than loaded from the icon service at runtime: a live
# request per logo would tell that third party which institutions each user banks
# with, which is not acceptable for a wealth app. Committing them also makes the
# UI deterministic (a bank rebranding cannot silently change the app) and removes
# a runtime dependency on an undocumented endpoint.
#
# Re-run only to refresh or to add a broker. Existing files are overwritten.
# Afterwards, check the report: the service answers HTTP 200 with a low-resolution
# or generic icon rather than failing, so a green "OK" is not proof of a usable logo.
#
# Usage:  pwsh scripts/fetch-broker-logos.ps1

$ErrorActionPreference = 'Stop'
$outDir = "public/assets/logos/brokers"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

# Keys must match the filenames declared in src/app/core/constants/broker-logos.ts
$brokers = @{
    "bnp-paribas"         = "bnpparibas.com"
    "boursobank"          = "boursobank.com"
    "caisse-depargne"     = "caisseepargne.fr"
    "cic"                 = "cic.fr"
    "credit-agricole"     = "credit-agricole.fr"
    "credit-mutuel"       = "creditmutuel.fr"
    "degiro"              = "degiro.com"
    "fortuneo"            = "fortuneo.fr"
    "freetrade"           = "freetrade.io"
    "hello-bank"          = "hellobank.fr"
    "hsbc"                = "hsbc.com"
    "ing"                 = "ing.com"
    "interactive-brokers" = "interactivebrokers.com"
    "la-banque-postale"   = "labanquepostale.fr"
    "lcl"                 = "lcl.fr"
    "linxea"              = "linxea.com"
    "lydia"               = "lydia-app.com"
    "n26"                 = "n26.com"
    "nalo"                = "nalo.fr"
    "revolut"             = "revolut.com"
    "saxo-bank"           = "home.saxo"
    "societe-generale"    = "societegenerale.com"
    "swissquote"          = "swissquote.com"
    "trade-republic"      = "traderepublic.com"
    "yomoni"              = "yomoni.fr"
    "binance"             = "binance.com"
    "bitfinex"            = "bitfinex.com"
    "bitstamp"            = "bitstamp.net"
    "bybit"               = "bybit.com"
    "coinbase"            = "coinbase.com"
    "crypto-com"          = "crypto.com"
    "gemini"              = "gemini.com"
    "kraken"              = "kraken.com"
    "ledger"              = "ledger.com"
    "okx"                 = "okx.com"
    "trezor"              = "trezor.io"
}
# Not listed: bourse-direct — no domain serves a usable favicon. It resolves to
# initials via NO_LOGO in broker-logos.ts.

Add-Type -AssemblyName System.Drawing
$results = @()

foreach ($broker in $brokers.GetEnumerator() | Sort-Object Name) {
    $path = Join-Path $outDir "$($broker.Key).png"
    try {
        Invoke-WebRequest -Uri "https://www.google.com/s2/favicons?domain=$($broker.Value)&sz=128" `
                          -OutFile $path -UseBasicParsing -ErrorAction Stop
        $img = [System.Drawing.Image]::FromFile($path)
        $w = $img.Width; $img.Dispose()
        $results += [PSCustomObject]@{ Broker = $broker.Key; Width = $w }
    } catch {
        $results += [PSCustomObject]@{ Broker = $broker.Key; Width = 0 }
    }
}

$ok  = $results | Where-Object { $_.Width -ge 128 }
$low = $results | Where-Object { $_.Width -gt 0 -and $_.Width -lt 128 }
$ko  = $results | Where-Object { $_.Width -eq 0 }

Write-Host ""
Write-Host "sharp (>=128px) : $($ok.Count)"
Write-Host "low resolution  : $($low.Count)  $(($low | ForEach-Object { "$($_.Broker)($($_.Width))" }) -join ', ')"
Write-Host "failed          : $($ko.Count)  $(($ko | ForEach-Object { $_.Broker }) -join ', ')"
Write-Host ""
Write-Host "Low-resolution entries are upscaled and look soft. Replacing them with"
Write-Host "the brand's official SVG is the only real fix; favicons have no better source."
