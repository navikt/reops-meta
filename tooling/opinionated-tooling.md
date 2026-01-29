# Opinionated tooling

For all those things you feel are handy, but bespoke. Maybe it's not for everyone... unless?

## utility zsh/bash functions to help search for and generate copy-pastable docker image strings (including the sha256 hash), from both the nav docker chainguard repository, and the open chainguard public repository

<img width="1639" height="366" alt="image" src="https://github.com/user-attachments/assets/c71b87aa-e4ed-48c3-9727-4811ede38e6c" />

### nav_docker_search

dependencies: gcloud installed + `gcloud auth login`

```zsh
nav_docker_search() { 
  IMAGE_NAME="$1"
  REGISTRY="europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no"

  gcloud artifacts docker tags list "$REGISTRY/$IMAGE_NAME" 2>/dev/null | \
    tail -n +3 | \
    grep -vE '^(latest|latest-dev)\s' | \
    awk '{
      tag = $1

      base = tag
      gsub(/-(dev|slim)$/, "", base)
      gsub(/^openjdk-/, "", base)

      split(base, parts, ".")
      major = parts[1]
      minor = parts[2]
      patch = parts[3]

      if (major ~ /^[0-9]+$/ && patch == "") {
        key = major (minor != "" ? "." minor : "")

        is_dev = (tag ~ /-dev$/)
        is_slim = (tag ~ /-slim$/)

        priority = 0
        if (!is_dev && !is_slim) priority = 3
        else if (is_slim) priority = 2
        else if (!is_dev) priority = 1

        if (!(key in best) || priority > best_priority[key]) {
          best[key] = $0
          best_priority[key] = priority
          sort_key = sprintf("%05d.%05d", major, (minor != "" ? minor : 0))
          best_sort[key] = sort_key
        }
      }
    }
    END {
      for (v in best) {
        split(best[v], fields, /[ \t]+/)
        printf "%s %s %s %s\n", best_sort[v], fields[1], fields[2], fields[3]
      }
    }' | \
    sort -rn | \
    head -5 | \
    awk '{printf "%s:%s\n  %s:%s@%s\n", img, $2, $3, $2, $4}' img="$IMAGE_NAME"
}

```

### chainguard_search

dependencies: (crane)[https://github.com/michaelsauter/crane]

```zsh
chainguard_search() {
  if [ -z "$1" ]; then
    echo "Usage: chainguard_search <image-name>"
    return 1
  fi

  local IMAGE_NAME="$1"
  local REGISTRY="cgr.dev/chainguard"

  # Get list of tags and filter to actual image tags (not sha256 refs or attestations)
  local TAGS=$(crane ls "${REGISTRY}/${IMAGE_NAME}" 2>&1 | grep -v 'sha256-' | grep -v '\.att$' | grep -v '\.sig$' | grep -v '\.sbom$')
  
  if [ $? -ne 0 ]; then
    echo "Error: Failed to list tags for ${REGISTRY}/${IMAGE_NAME}"
    echo "$TAGS"
    return 1
  fi

  # Loop through each tag and get its digest
  echo "$TAGS" | while read -r TAG; do
    local DIGEST=$(crane digest "${REGISTRY}/${IMAGE_NAME}:${TAG}" 2>&1)
    
    if [ $? -eq 0 ]; then
      echo "${IMAGE_NAME}:${TAG}"
      echo "  ${REGISTRY}/${IMAGE_NAME}@${DIGEST}"
    fi
  done
}

```

## never forget which context and namespace you are in

A nice CLI improvement that adds `(context/namespace)` to the right side of your shell prompt!

```zsh
get_kube_info() {
  ctx=$(kubectl config current-context 2>/dev/null)
  ns=$(kubectl config view --minify --output 'jsonpath={..namespace}' 2>/dev/null)
  [ -z "$ns" ] && ns="default"
  if [ -n "$ctx" ]; then
    echo "%F{green}($ctx/$ns)%f"
  fi
}
RPROMPT='$(get_kube_info)'
```

Do you use [Tmux](https://github.com/tmux/tmux/wiki) and want it in the tmux status bar instead? ofc its possible! 🤩

`kube_status.sh`
```bash
#!/usr/bin/env bash
ctx=$(kubectl config current-context 2>/dev/null)
ns=$(kubectl config view --minify --output 'jsonpath={..namespace}' 2>/dev/null)
[ -z "$ns" ] && ns="default"
if [ -n "$ctx" ]; then
  printf "#[fg=yellow](%s/%s)#[fg=default]" "$ctx" "$ns"
fi
```

now you can reference it in your `.tmux.conf`:
```conf
set -g status-right "#(path/to/my/tmux/kube_status.sh)#[bold] %Y-%m-%d %H:%M"
```
