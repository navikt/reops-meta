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

Create `.github/workflows/deploy.yaml` in your repository with the following content:

```yaml
name: "Deploy"
run-name: "Deploy ${{ github.event_name == 'push' && 'Dev' || github.event.inputs.environment == 'prod' && 'Prod' || 'Dev' }}"
on:
  push:
    branches:
      - "main"  # TODO: Change to "master" if your repo uses master branch
  workflow_dispatch:
    inputs:
      environment:
        description: "Environment to deploy to"
        required: true
        type: choice
        options:
          - dev
          - prod

jobs:
  build:
    name: "build"
    runs-on: "ubuntu-latest"
    permissions:
      packages: write
      contents: read
      id-token: write
    steps:
      - uses: "actions/checkout@v4"
      
      # TODO: Add any build steps here (e.g., Node.js setup, dependency installation, compilation)
      # Example for Node.js projects:
      # - uses: "actions/setup-node@v4"
      #   with:
      #     node-version: 22
      #     registry-url: "https://npm.pkg.github.com"
      #     cache: "yarn"
      # - name: "Install dependencies"
      #   run: "yarn install"
      #   env:
      #     NODE_AUTH_TOKEN: ${{ secrets.READER_TOKEN }}
      # - name: "Build application"
      #   run: "yarn build"
      # - name: "Remove devDependencies (prevents Go CVEs from esbuild in SBOM)"
      #   run: "yarn workspaces focus --production"
      #   env:
      #     NODE_AUTH_TOKEN: ${{ secrets.READER_TOKEN }}

      - name: "Build and push"
        uses: nais/docker-build-push@v0
        id: docker-build-push
        with:
          team: team-researchops
          identity_provider: ${{ secrets.NAIS_WORKLOAD_IDENTITY_PROVIDER }}
          project_id: ${{ vars.NAIS_MANAGEMENT_PROJECT_ID }}

    outputs:
      image: ${{ steps.docker-build-push.outputs.image }}

  deploy-dev:
    if: github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'dev')
    needs: build
    runs-on: "ubuntu-latest"
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: "actions/checkout@v4"
      - name: "Deploy to Dev"
        uses: "nais/deploy/actions/deploy@v2"
        env:
          CLUSTER: "prod-gcp"  # TODO: Change to "dev-gcp" if your dev environment uses dev-gcp cluster
          RESOURCE: .nais/nais-dev.yaml  # TODO: Adjust path if your NAIS config is in a different location
          VAR: image=${{ needs.build.outputs.image }},version=${{ github.sha }}

  deploy-prod:
    if: github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'prod'
    needs: build
    runs-on: "ubuntu-latest"
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: "actions/checkout@v4"
      - name: "Deploy to Prod"
        uses: "nais/deploy/actions/deploy@v2"
        env:
          CLUSTER: "prod-gcp"
          RESOURCE: .nais/nais-prod.yaml  # TODO: Adjust path if your NAIS config is in a different location
          VAR: image=${{ needs.build.outputs.image }},version=${{ github.sha }}
      - name: "Create deployment tag"
        if: success()
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          TAG_NAME="prod-$(date -u +'%Y.%m.%d-%H%M%S')"
          git tag -a "$TAG_NAME" -m "Production deployment of ${{ github.sha }}"
          git push origin "$TAG_NAME"
```

#### Customization Checklist

After copying the template above, review and customize these items:

1. **Branch name**: Update `branches: - "main"` if your repository uses `master` or another branch
2. **Build steps**: Add any build steps needed for your application (Node.js, Go, Java, etc.)
3. **Dev cluster**: Change `CLUSTER: "prod-gcp"` in `deploy-dev` job if your dev environment uses a different cluster
4. **NAIS config paths**: Update `.nais/nais-dev.yaml` and `.nais/nais-prod.yaml` if your configs are in different locations

### 2. Set up digestabot (if your app uses chainguard images)

## Recommended Tools

For optimal development experience with ReOps applications, see our [Tooling Guide](./tooling/README.md).
