'use strict';

class K8sServices {
  constructor(k8s) {
    this.k8s = k8s;
  }

  async list(namespace) {
    const data = await this.k8s.kubectlJson(['get', 'services'], { namespace });
    return data.items;
  }

  async get(name, namespace) {
    return this.k8s.kubectlJson(['get', 'service', name], { namespace });
  }

  async delete(name, namespace) {
    return this.k8s.kubectl(['delete', 'service', name], { namespace });
  }
}

module.exports = { K8sServices };
