# ReOps Meta Repository

Welcome to the ReOps meta repository. This repository serves as the central hub for cross-cutting concerns, shared resources, and documentation for all ReOps applications.

## Why This Repository Exists

- **Single Entry Point**: New developers can start here for onboarding and getting an overview of the ReOps ecosystem
- **Cross-Cutting Issues**: Houses epics and tasks that span multiple applications or don't belong to any specific repository
- **Shared Resources**: Central location for reusable GitHub Actions workflows and DevOps patterns
- **Active Maintenance Overview**: Clear view of what code we currently care about and actively maintain

> [!IMPORTANT]
> This [ReOps GitHub Project Board](https://github.com/orgs/navikt/projects/186/views/1) is where _all_ issues for ReOps development tasks should be listed.

## Active Applications

The NAIS Console has the de-facto overview of our [currently running and maintained applications](https://console.nav.cloud.nais.io/team/team-researchops/applications), ReOps has more repositories than it has currently running apps, this list helps reduce our focus.

## Creating a New Application

When creating a new ReOps application, follow these steps to ensure consistency across our DevOps practices:

### 1. Set Up Deployment Workflow

Add the following minimal workflow to your new app's `.github/workflows/deploy.yaml`:

```yaml
name: "Deploy"
run-name: "Deploy ${{ github.event_name == 'push' && 'Dev' || github.event.inputs.environment == 'prod' && 'Prod' || 'Dev' }}"
on:
  push:
    branches:
      - "main"
  workflow_dispatch:
    inputs:
      environment:
        description: "Environment to deploy to"
        required: true
        type: choice
        options:
          - dev
          - prod

permissions:
  packages: write      # For building and pushing Docker images
  contents: write      # For creating deployment tags (prod only)
  id-token: write      # For OIDC authentication with NAIS/Google Cloud

jobs:
  deploy:
    uses: navikt/reops-meta/.github/workflows/deploy.yaml@main
    with:
      environment: ${{ github.event.inputs.environment || 'dev' }}
    secrets:
      NAIS_WORKLOAD_IDENTITY_PROVIDER: ${{ secrets.NAIS_WORKLOAD_IDENTITY_PROVIDER }}
      NAIS_MANAGEMENT_PROJECT_ID: ${{ vars.NAIS_MANAGEMENT_PROJECT_ID }}
```

#### Customization

The reusable workflow uses sensible defaults, but you can customize these inputs in the `with:` section if needed:

```yaml
permissions:
  packages: write      # For building and pushing Docker images
  contents: write      # For creating deployment tags (prod only)
  id-token: write      # For OIDC authentication with NAIS/Google Cloud

jobs:
  deploy:
    uses: navikt/reops-meta/.github/workflows/deploy.yaml@main
    with:
      environment: ${{ github.event.inputs.environment || 'dev' }}
      dev_nais_file: .nais/nais-dev.yaml      # default: .nais/nais-dev.yaml
      prod_nais_file: .nais/nais-prod.yaml    # default: .nais/nais-prod.yaml
      dev_cluster: dev-gcp                    # default: dev-gcp
      prod_cluster: prod-gcp                  # default: prod-gcp
      team: team-researchops                  # default: team-researchops
    secrets:
      NAIS_WORKLOAD_IDENTITY_PROVIDER: ${{ secrets.NAIS_WORKLOAD_IDENTITY_PROVIDER }}
      NAIS_MANAGEMENT_PROJECT_ID: ${{ vars.NAIS_MANAGEMENT_PROJECT_ID }}
```

**Available inputs:**
- `environment`: Target environment - `dev` or `prod` (required)
- `dev_nais_file`: Path to your dev NAIS configuration (default: `.nais/nais-dev.yaml`)
- `prod_nais_file`: Path to your prod NAIS configuration (default: `.nais/nais-prod.yaml`)
- `dev_cluster`: NAIS cluster for dev environment (default: `dev-gcp`)
- `prod_cluster`: NAIS cluster for prod environment (default: `prod-gcp`)
- `team`: NAIS team name (default: `team-researchops`)

### 2. Set up digestabot (if your app uses chainguard images)

## Recommended Tools

For optimal development experience with ReOps applications, see our [Tooling Guide](./tooling/README.md).
