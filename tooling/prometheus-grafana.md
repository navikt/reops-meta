# Guide: Opprette Grafana-dashboards (ReOps)

Denne guiden beskriver hvordan du:
1) eksponerer Prometheus-metrikker fra appen,  
2) aktiverer scraping i NAIS,  
3) finner/verifiserer metrikker i Prometheus, og  
4) bygger paneler i Grafana.

---

## 1) Eksponer metrikker fra appen

NAIS forventer interne endepunkt (f.eks. helse og Prometheus) under `/internal/`.

Sørg for at appen eksponerer metrikker på:

- `GET /internal/prometheus`

> Tips: Verifiser lokalt eller i dev at endepunktet svarer med Prometheus-format (plain text).

---

## 2) Aktiver Prometheus-scraping i NAIS

Legg til `prometheus`-seksjonen i NAIS-manifestet slik at Prometheus vet hvor den skal hente metrikker.

Minimal eksempel:

```yaml
spec:
  prometheus:
    enabled: true
    path: /internal/prometheus
```

Dette gjør at Prometheus kaller appen på `/internal/prometheus` og samler inn metrikker.
---

## 3) Finn og verifiser metrikker i Prometheus

Bruk Prometheus Query UI for å se hvilke metrikker som faktisk er tilgjengelige:

- https://prometheus.prod-gcp.nav.cloud.nais.io/query

Eksempel (PromQL):

```promql
kafka_events_processed_total{namespace="team-researchops", app="reops-umami-consumer"}
```

Forklaring:
- `kafka_events_processed_total` = metrikknavn
- `{ ... }` = filtre (labels) for å avgrense
- `namespace="team-researchops"` = kun metrikker fra team-namespace
- `app="reops-umami-consumer"` = kun metrikker fra denne appen

> Tips: Start med kun metrikknavnet, og legg til labels gradvis for å se hva som matcher.

---

## 4) Lag panel i Grafana

Gå til ReOps-området i Grafana:

- https://grafana.nav.cloud.nais.io/dashboards/f/pqL7u4N7z/researchops

Du kan enten:
- lage et nytt dashboard, eller
- legge til paneler i et eksisterende dashboard

### Steg-for-steg (panel)

1. Åpne dashboard
2. Klikk **Add** → **Visualize**
3. Velg graf-type (ofte **Time series**)
4. På panelet: klikk **…** → **Edit**
5. Velg riktig **data source**:
   - `gcp-prod` eller `gcp-dev`
6. Velg **Code** (ofte enklere enn *Builder*)
7. Skriv PromQL-spørringen og juster visualisering/legend etter behov

Eksempel-query i Grafana (PromQL):

```promql
sum by (type) (
  increase(
    kafka_events_total{
      topic="team-researchops.reops-insight-event",
      namespace="team-researchops",
      app="reops-event-proxy"
    }[$__range]
  )
)
```

Notater:
- `$__range` = tidsintervallet valgt i dashboardet
- `increase(...)` = antall hendelser i tidsvinduet
- `sum by (type)` = summerer og grupperer per label (her: `type`)

> Tips: Hvis grafen blir “spiky”, prøv `rate(...[$__rate_interval])` for per-sekund visning i stedet for totalsum i perioden.

