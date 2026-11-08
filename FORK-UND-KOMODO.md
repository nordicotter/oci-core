# Eigenen OCI-Core-Fork anlegen, Übersetzung übernehmen und über Komodo nutzen

Dieses Archiv enthält den Quellcode-Snapshot vom **3. November 2026** mit einer dreisprachigen Oberfläche (Deutsch, Englisch, Chinesisch). Es ersetzt **nicht** die vorhandenen Docker-Daten und enthält keine Oracle-Zugangsdaten.

## 1. Fork auf GitHub anlegen

1. Im Browser `https://github.com/jsongmax/oci-core` öffnen und oben rechts auf **Fork** klicken.
2. Einen Namen wählen, zum Beispiel `oci-core`; Standardbranch `main` beibehalten. **Create fork** klicken.
3. Im eigenen GitHub-Fork unter **Actions** die Workflows aktivieren, sofern GitHub danach fragt. Der Workflow `.github/workflows/docker.yml` erstellt ein Container-Image.

## 2. Diese Änderungen in den Fork übernehmen

### Variante A: Komplettes ZIP übernehmen (einfach, identischer Quellcode-Stand)

Auf deinem Rechner (Git muss installiert sein):

```bash
# <DEIN-GITHUB-NAME> durch deinen GitHub-Namen ersetzen
git clone https://github.com/<DEIN-GITHUB-NAME>/oci-core.git
cd oci-core

# Archiv entpacken, den Archivpfad an deinen Downloadordner anpassen
unzip ~/Downloads/oci-core-de-en-zh.zip -d /tmp/oci-core-l10n
cp -a /tmp/oci-core-l10n/oci-core-main/. .

git status
# Änderungen kontrollieren, bevor du sie übernimmst
git add .
git commit -m "Add German and English interface translations"
git push origin main
```

**Wichtig:** Das Archiv basiert auf dem mitgelieferten Upstream-Snapshot. Wenn dein Fork inzwischen neuere Änderungen hat, kann das vollständige Kopieren neue Dateien überschreiben. In diesem Fall **Variante B** verwenden und Konflikte einzeln prüfen.

### Variante B: Nur die Änderungen als Patch (empfohlen bei neuerem Upstream)

Die beiliegende Datei `oci-core-i18n.patch` ist ein Git-Diff gegen den mitgelieferten Original-Snapshot. Sie enthält nur geänderte beziehungsweise neue Dateien. Im geklonten Fork:

```bash
# Im Verzeichnis des geklonten Forks:
git apply --check ~/Downloads/oci-core-i18n.patch
git apply ~/Downloads/oci-core-i18n.patch
git status
# Bei Abweichungen vom Snapshot kann der Patch Konflikte melden.
git add .
git commit -m "Add German and English interface translations"
git push origin main
```

Falls `git apply --check` scheitert, den Patch **nicht erzwingen**. Dann mit einem Branch vom passenden Upstream-Stand arbeiten oder die wenigen betroffenen Dateien manuell zusammenführen.

## 3. Docker-Image automatisch auf GitHub bauen

Nach einem Push auf `main` auf **Actions → Docker** schauen. Nach einem erfolgreichen Build ist das Image unter folgender Adresse erreichbar:

```text
ghcr.io/<dein-github-name-klein-geschrieben>/oci-core:edge
```

Der Workflow wandelt den Repository-Namen automatisch in Kleinbuchstaben um (GHCR verlangt das). Wenn der Package-Eintrag noch privat ist, in GitHub unter dem veröffentlichten Package die **Package settings → Change package visibility → Public** öffnen. Alternativ muss Docker am Host mit einem Token angemeldet werden, der das private Package lesen darf.

**Hinweis:** Das GitHub-Image wird erst nach erfolgreichem GitHub-Action-Build verfügbar sein. Das ZIP enthält keine fertige Docker-Image-Datei.

## 4. Bestehenden Komodo-Stack aktualisieren

Vorher unbedingt die vorhandenen Schlüssel und Daten sichern:

```bash
sudo tar -C /etc/komodo/stacks/oci_core -czf /root/oci-core-data-backup-$(date +%Y%m%d).tar.gz data
```

In **Komodo → Stacks → oci_core → Compose** nur das Image auf deinen Fork ändern. Beispiel mit deiner WireGuard-IP:

```yaml
services:
  oci-core:
    image: ghcr.io/<dein-github-name-klein-geschrieben>/oci-core:edge
    container_name: oci-core
    restart: unless-stopped
    environment:
      OCICORE_ADDR: "0.0.0.0:8080"
      OCICORE_DATA_DIR: "/app/data"
      TZ: "Europe/Berlin"
    ports:
      - "10.11.12.6:8080:8080"
    volumes:
      - /etc/komodo/stacks/oci_core/data:/app/data
```

In Komodo dann **Pull image / Redeploy** ausführen. Die bestehende Datenbank und `master.key` bleiben unter `/etc/komodo/stacks/oci_core/data` erhalten. Der OCI-Core-Container verwendet weiterhin UID/GID `10001`. Der Speicherordner muss für diese UID beschreibbar sein.

Anschließend prüfen:

```bash
docker logs --tail 50 oci-core
docker inspect oci-core --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

Das Webinterface sollte weiterhin unter `http://10.11.12.6:8080` nur aus deinem WireGuard-Netz erreichbar sein. Die Oracle-API-Anfragen behalten ihr bisheriges Routing. Zusätzlich den Zugriff per Firewall nur für gewünschte VPN-Clients zulassen; ein Host-IP-Portbinding allein ist je nach Docker-/Firewall-Konfiguration keine vollständige Zugriffskontrolle.

## 5. Später aktualisieren

Der Workflow veröffentlicht auf jeden Push nach `main` wieder `:edge`. Komodo kann das Image neu ziehen und den Stack neu starten. Für reproduzierbare Deployments besser eine feste Version oder einen Image-Digest pinnen. Nicht versehentlich `master.key` löschen oder ein leeres Datenverzeichnis mounten.

## 6. Änderungen an den Originalautor anbieten (optional)

In deinem Fork **Contribute → Open pull request** wählen. Als Ziel `jsongmax/oci-core:main` und als Quelle deinen Fork/Branch auswählen. Den PR mit Tests, Screenshots und der Erklärung der Sprachschicht beschreiben. Ein Merge durch den Projektbetreiber ist nicht garantiert.

## Einschränkungen

Das Frontend wurde anhand der verfügbaren Quelltexte weitgehend lokalisiert. Der vollständige npm-/Docker-Build und die UI-Durchsicht unter echten Laufzeitbedingungen können hier ohne Zugriff auf die npm-Abhängigkeiten nicht abschließend bestätigt werden. Falls unerwartete chinesische Fehlermeldungen auftauchen, sind das wahrscheinlich noch nicht erfasste Backend-Fehler oder neue dynamische Texte; siehe `TRANSLATIONS.md`.
