; =====================================================================
; DzHerba - Script Inno Setup 6
; Encyclopédie Digitale & IA de la Flore Médicinale d'Algérie
; =====================================================================

#define MyAppName "DzHerba"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "DzHerba"
#define MyAppURL "http://localhost:8080"

[Setup]
AppId={{D37E84B1-2C9A-4E38-B5A1-92A540E9D001}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName=C:\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=no
InfoBeforeFile=assets\infobefore.txt
InfoAfterFile=assets\infoafter.txt
OutputDir=dist
OutputBaseFilename=DzHerba-Setup-v{#MyAppVersion}
SetupIconFile=assets\app.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog
CloseApplications=force
RestartApplications=no
UninstallDisplayIcon={app}\assets\app.ico

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; 1. Icone principale et rapport
Source: "assets\app.ico"; DestDir: "{app}\assets"; Flags: ignoreversion
Source: "assets\infoafter.txt"; DestDir: "{app}"; DestName: "RAPPORT_INSTALLATION.txt"; Flags: ignoreversion
Source: "assets\nssm.exe"; DestDir: "{app}\bin"; Flags: ignoreversion

; 2. Runtime Node.js autonome embarqué (Exécution 100% portable)
Source: "C:\Program Files\nodejs\node.exe"; DestDir: "{app}\bin"; Flags: ignoreversion

; 3. Scripts de gestion & initialisation
Source: "scripts\*"; DestDir: "{app}\scripts"; Flags: ignoreversion recursesubdirs createallsubdirs

; 4. Backend Express API
Source: "..\server\*"; DestDir: "{app}\server"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*.log,logs\*,uploads\*"

; 5. Frontend React (Build de Production optimisé)
Source: "..\web\dist\*"; DestDir: "{app}\web\dist"; Flags: ignoreversion recursesubdirs createallsubdirs

; 6. Données floristiques et galerie de 1 661 photos réelles
Source: "..\data\*"; DestDir: "{app}\data"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\startup\startup\*"; DestDir: "{app}\startup\startup"; Flags: ignoreversion recursesubdirs createallsubdirs

; 7. Serveur de Base de Données MySQL / MariaDB Portable Embarqué (Si MySQL n'existe pas sur la machine)
Source: "mysql\*"; DestDir: "{app}\mysql"; Flags: ignoreversion recursesubdirs createallsubdirs

[Dirs]
Name: "{app}\bin"
Name: "{app}\server\uploads"
Name: "{app}\mysql\data"

[Icons]
; Menu Démarrer
Name: "{group}\DzHerba - Lancer la Plateforme"; Filename: "{app}\scripts\start-dzherba.bat"; IconFilename: "{app}\assets\app.ico"; Comment: "Démarrer le serveur et ouvrir DzHerba"
Name: "{group}\DzHerba - Ouvrir dans le Navigateur"; Filename: "{app}\scripts\open-dzherba.bat"; IconFilename: "{app}\assets\app.ico"; Comment: "Ouvrir l'application Web"
Name: "{group}\DzHerba - Arrêter les Services"; Filename: "{app}\scripts\stop-dzherba.bat"; IconFilename: "{app}\assets\app.ico"; Comment: "Arrêter les serveurs DzHerba"
Name: "{group}\DzHerba - Initialiser Base de Données"; Filename: "{app}\scripts\init-database.bat"; Comment: "Vérifier et initialiser le schéma MySQL"
Name: "{group}\DzHerba - Rapport d'Installation"; Filename: "{app}\RAPPORT_INSTALLATION.txt"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"; IconFilename: "{app}\assets\app.ico"

; Raccourcis Bureau
Name: "{autodesktop}\DzHerba"; Filename: "{app}\scripts\start-dzherba.bat"; IconFilename: "{app}\assets\app.ico"; Tasks: desktopicon; Comment: "Lancer DzHerba (Flore Médicinale d'Algérie)"

[Run]
; Initialisation silencieuse de la base de données au post-install
Filename: "{app}\bin\node.exe"; Parameters: """{app}\scripts\setup-dzherba-db.js"""; Description: "Initialisation de la base locale MySQL"; Flags: runhidden
; Lancer DzHerba à la fin de l'installation
Filename: "{app}\scripts\start-dzherba.bat"; Description: "Lancer DzHerba maintenant (http://localhost:8080)"; Flags: nowait postinstall skipifsilent shellexec

[UninstallRun]
Filename: "{app}\scripts\stop-dzherba.bat"; RunOnceId: "StopDzHerbaProcesses"; Flags: runhidden
