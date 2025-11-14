# ReOps Developer Tooling Guide

Handy tools and setup for working with ReOps applications.

## Kubernetes Tools

### [kubectl](https://kubernetes.io/docs/reference/kubectl/)

The Kubernetes command-line tool for interacting with clusters.

**Usage:**
```bash
# Get pods in current namespace
kubectl get pods

# Get logs from a pod
kubectl logs <pod-name>

# Describe a pod (useful for debugging)
kubectl describe pod <pod-name>

# Port forward to access a service locally
kubectl port-forward <pod-name> 8080:8080
```

### [kubectx + kubens](https://github.com/ahmetb/kubectx)

Fast context and namespace switching for kubectl.

**Usage:**
```bash
# List and switch contexts
kubectx                    # List all contexts
kubectx <context-name>     # Switch to a context
kubectx -                  # Switch to previous context

# List and switch namespaces
kubens                     # List all namespaces
kubens <namespace-name>    # Switch to a namespace
kubens -                   # Switch to previous namespace
```

## [NAIS CLI](https://doc.nais.io/operate/cli/#nais-cli)

The NAIS command-line tool for managing applications on the NAIS platform.

**Usage:**
```bash
# Validate NAIS manifests
nais validate <nais-yaml-file>

# Get information about your application
nais app get <app-name>

# View logs
nais logs <app-name>
```
**Documentation:** https://doc.nais.io/

## [Colima](https://github.com/abiosoft/colima)

For local development and testing containerized applications.

