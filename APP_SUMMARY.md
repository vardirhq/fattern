# Fattern - Local-First Invoice & Expense Manager

## Tagline
**Fattern** – En moderne fakturerings- og utgiftsadministrasjonsapplikasjon for freelancere og små bedrifter. Alt lagres lokalt på din maskin – ingen innlogging, ingen avhengighet av skyen.

## Hva er Fattern?

Fattern er en desktop-applikasjon designet spesielt for norske freelancere og små bedrifter som trenger en enkel, kraftfull og privat løsning for å administrere fakturaer, utgifter og kunder. I motsetning til cloud-baserte løsninger, lagrer Fattern all data lokalt på din maskin i en SQLite-database – full kontroll og fullt privatliv.

## Hovedfunksjoner

### 📊 Dashboard og Oversikt
- **Finansiell oversikt**: Se inntekter, utgifter, forfalte fakturaer og innkrevingsgrad på et øyeblikk
- **Aktivitetsfeed**: Kronologisk oversikt over alle finansielle hendelser
- **Kundestatistikk**: Se hvilke kunder som genererer mest omsetning
- **Budsjettår**: Organiser og spore finansene dine etter budsjettår

### 💰 Fakturaadministrasjon
- **Full CRUD-funksjonalitet**: Opprett, rediger og slett fakturaer enkelt
- **3-panel editor**: Intuitiv fakturaeditor med separate paneler for kunder, fakturainnhold og produkter
- **Automatiske beregninger**: Subtotal, MVA og total beregnes automatisk
- **Statussporing**: Følg fakturastatus (utkast, sendt, betalt, forfalt, kansellert)
- **PDF-generering**: Generer profesjonelle PDF-fakturaer med én klikk
- **Tilpassede maler**: Visuell maleditor for å designe dine egne fakturaer
- **Fakturanummering**: Automatisk sekvensiell nummerering med årlig nullstilling

### 🛍️ Produktadministrasjon
- **Produktkatalog**: Bygg en database med produkter og tjenester
- **Detaljert informasjon**: Navn, SKU, beskrivelse, pris, MVA-sats, enhet
- **Bildeopplasting**: Legg til bilder for visuell produktkatalog
- **Aktive/Inaktive**: Deaktiver produkter i stedet for å slette dem
- **Fleksibel visning**: Veksle mellom tabell- og kortvisning

### 👥 Kundeadministrasjon
- **Komplett kundedatabase**: Lagre all kundeinformasjon på ett sted
- **Kontaktinformasjon**: Navn, kontaktperson, e-post, telefon, adresse
- **Organisasjonsnummer**: Lagre org.nr. for norske bedrifter
- **MVA-fritak**: Marker kunder som MVA-fritatt
- **Bildeopplasting**: Legg til logoer eller bilder av kunder
- **Fleksibel visning**: Veksle mellom tabell- og kortvisning

### 📅 Budsjettår
- **Periodeadministrasjon**: Definer og administrer budsjettår
- **Aktivt år**: Sett et aktivt budsjettår for filtrering og rapportering
- **Datoområder**: Definer start- og sluttdatoer for hvert år
- **Full kontroll**: Opprett, rediger og slett budsjettår etter behov

### 🎨 Tilpassede Fakturamaler
- **Visuell editor**: Drag-and-drop maleditor med canvas
- **Elementtyper**: Tekst, feltbindinger, bilder og tabeller
- **Omfattende styling**: Typografi, farger, bakgrunner, rammer, skygger
- **Forhåndsvisning**: Se hvordan fakturaen ser ut før generering
- **Undo/Redo**: Angre og gjør om endringer
- **Tastatursnarveier**: Effektiv redigering med tastatursnarveier
- **PDF-eksport**: Eksporter maler direkte til PDF

### 📈 Rapportering og Analyse
- **Inntekt vs. Utgifter**: Se oversikt over inntekter og utgifter
- **Innkrevingsgrad**: Spor hvor mange fakturaer som er betalt
- **Forfalte fakturaer**: Identifiser fakturaer som trenger oppmerksomhet
- **Kundestatistikk**: Se hvilke kunder som genererer mest omsetning
- **Tidslinje**: Kronologisk oversikt over alle finansielle hendelser

### ⚙️ Innstillinger og Konfigurasjon
- **Selskapsinformasjon**: Administrer selskapets detaljer
- **Standardvisninger**: Sett standard visning for produkter og kunder
- **Maladministrasjon**: Administrer fakturamaler
- **Innstillinger**: Tilpass appen etter dine behov

## Tekniske Høydepunkter

### Lokal-Først Arkitektur
- **SQLite-database**: All data lagres lokalt på din maskin
- **Ingen cloud-avhengighet**: Fungerer helt offline
- **Full privatliv**: Din data forblir din – ingen tredjeparter
- **Automatisk sikkerhetskopi**: Data lagres i `~/Fattern/data/`

### Moderne Teknologi
- **Electron**: Tverrplattform desktop-applikasjon
- **React**: Moderne, responsiv brukergrensesnitt
- **Ren CSS**: Designsystem med tokens, uten CSS-rammeverk (se `docs/design-system/`)
- **SQLite**: Rask og pålitelig lokal database

### Brukeropplevelse
- **Intuitivt design**: Ren og moderne brukergrensesnitt
- **Sorterbare tabeller**: Klikk på kolonneoverskrifter for å sortere
- **Toast-varsler**: Tydelige varsler for alle operasjoner
- **Tastatursnarveier**: Effektiv navigering og redigering
- **Responsivt**: Optimalisert for desktop-bruk

## Hvem er Fattern for?

### Primærmålgruppe
- **Freelancere**: Designere, utviklere, konsulenter og andre selvstendige
- **Små bedrifter**: Bedrifter med 1-10 ansatte
- **Norske bedrifter**: Spesielt designet for norsk faktureringspraksis

### Ideell for deg hvis du:
- Trenger en enkel løsning for fakturering og utgiftsadministrasjon
- Setter pris på privatliv og lokal kontroll over data
- Vil unngå månedlige abonnementskostnader
- Trenger en offline-løsning
- Ønsker en norsk applikasjon med norsk format (dd.mm.yyyy, norske valutaer)

## Hva gjør Fattern unik?

### 🔒 Privatliv og Sikkerhet
- **100% lokal lagring**: All data forblir på din maskin
- **Ingen innlogging**: Ingen kontoer, ingen passord å huske
- **Ingen cloud-synkronisering**: Full kontroll over dine data
- **Offline-først**: Fungerer perfekt uten internett

### 🎨 Design og Brukeropplevelse
- **Moderne design**: Inspirert av norsk designestetikk
- **Intuitivt grensesnitt**: Enkelt å lære, raskt å bruke
- **Tilpassbare maler**: Design dine egne fakturaer med visuell editor
- **Rask ytelse**: Lokal database betyr lynrask respons

### 💪 Kraft og Fleksibilitet
- **Full CRUD**: Opprett, les, oppdater og slett alt
- **Automatiske beregninger**: Ingen manuelle beregninger nødvendig
- **Fleksibel organisering**: Organiser etter budsjettår
- **Omfattende rapportering**: Se hele bildet av din økonomi

### 🇳🇴 Norsk-Først
- **Norsk format**: Datoer (dd.mm.yyyy), valutaer og praksis
- **Norsk språk**: Fullt oversatt til norsk (bokmål)
- **Norsk fakturering**: Støtter norsk faktureringspraksis
- **Organisasjonsnummer**: Spesielt støtte for norske org.nr.

## Systemkrav

- **Operativsystem**: Windows, macOS eller Linux
- **Minne**: 4GB RAM (8GB anbefalt)
- **Lagring**: ~100MB for applikasjonen + plass for database og eksporter
- **Skjerm**: Minimum 1024px bredde anbefales

## Installasjon og Oppstart

1. **Last ned**: Last ned Fattern for ditt operativsystem
2. **Installer**: Kjør installasjonsprogrammet
3. **Start opp**: Åpne appen og fullfør første oppsett
4. **Legg til selskap**: Fyll inn selskapets informasjon
5. **Kom i gang**: Begynn å legge til kunder, produkter og fakturaer

## Data og Sikkerhet

- **Lokal lagring**: All data lagres i `~/Fattern/data/` på din maskin
- **SQLite-database**: Industri-standard databaseformat
- **Ingen ekstern kommunikasjon**: Appen kommuniserer ikke med eksterne servere
- **Sikkerhetskopi**: Ta sikkerhetskopi av `~/Fattern/`-mappen for å sikkerhetskopiere alt

## Fremtidige Funksjoner

Fattern er under aktiv utvikling. Planlagte funksjoner inkluderer:
- Utgiftsadministrasjon med full CRUD
- Avanserte rapporter og diagrammer
- Søk og filtrering
- Dataeksport (CSV, Excel)
- Gjentakende fakturaer
- E-postintegrasjon
- Flerspråklig støtte (engelsk)

## Lisens og Pris

Fattern er designet som en lokal-først løsning. Sjekk prosjektets GitHub-side for oppdatert informasjon om lisens og distribusjon.

## Støtte og Dokumentasjon

- **Brukerguide**: Komplett wiki inkludert i appen
- **Changelog**: Se alle endringer og forbedringer
- **GitHub**: Rapporter problemer eller foreslå funksjoner

---

**Fattern** – Enklere fakturering. Mer privatliv. Full kontroll.

