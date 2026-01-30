'use strict';

class K8sDeployments {
  constructor(k8s) {
    this.k8s = k8s;
  }

  async list(namespace) {
    const data = await this.k8s.kubectlJson(['get', 'deployments'], { namespace });
    return data.items;
  }

  async get(name, namespace) {
    return this.k8s.kubectlJson(['get', 'deployment', name], { namespace });
  }

  async scale(name, replicas, namespace) {
    return this.k8s.kubectl(
      ['scale', 'deployment', name, `--replicas=${replicas}`],
      { namespace }
    );
  }

  async restart(name, namespace) {
    return this.k8s.kubectl(
      ['rollout', 'restart', 'deployment', name],
      { namespace }
    );
  }

  async status(name, namespace) {
    const { stdout } = await this.k8s.kubectl(
      ['rollout', 'status', 'deployment', name],
      { namespace }
    );
    return stdout;
  }

  async image(name, container, image, namespace) {
    return this.k8s.kubectl(
      ['set', 'image', `deployment/${name}`, `${container}=${image}`],
      { namespace }
    );
  }

  async history(name, namespace) {
    const { stdout } = await this.k8s.kubectl(
      ['rollout', 'history', 'deployment', name],
      { namespace }
    );
    return stdout;
  }

  async undo(name, namespace) {
    return this.k8s.kubectl(
      ['rollout', 'undo', 'deployment', name],
      { namespace }
    );
  }
}

module.exports = { K8sDeployments };
