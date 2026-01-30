'use strict';

class K8sNamespaces {
  constructor(k8s) {
    this.k8s = k8s;
  }

  async list() {
    const data = await this.k8s.kubectlJson(['get', 'namespaces'], { namespace: false });
    return data.items;
  }

  async get(name) {
    return this.k8s.kubectlJson(['get', 'namespace', name], { namespace: false });
  }

  async create(name) {
    return this.k8s.kubectl(['create', 'namespace', name], { namespace: false });
  }

  async delete(name) {
    return this.k8s.kubectl(['delete', 'namespace', name], { namespace: false });
  }
}

module.exports = { K8sNamespaces };
