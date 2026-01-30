'use strict';

class K8sConfigMaps {
  constructor(k8s) {
    this.k8s = k8s;
  }

  async list(namespace) {
    const data = await this.k8s.kubectlJson(['get', 'configmaps'], { namespace });
    return data.items;
  }

  async get(name, namespace) {
    return this.k8s.kubectlJson(['get', 'configmap', name], { namespace });
  }

  async create(name, data = {}, namespace) {
    const args = ['create', 'configmap', name];
    for (const [key, value] of Object.entries(data)) {
      args.push(`--from-literal=${key}=${value}`);
    }
    return this.k8s.kubectl(args, { namespace });
  }

  async delete(name, namespace) {
    return this.k8s.kubectl(['delete', 'configmap', name], { namespace });
  }
}

module.exports = { K8sConfigMaps };
