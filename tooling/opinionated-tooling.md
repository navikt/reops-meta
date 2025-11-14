# Opinionated tooling

For all those things you feel are handy, but bespoke. Maybe it's not for everyone... unless?

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
