'use strict';

class K8sDeployments {
  constructor(client) {
    this.client = client;
  }

  async list(namespace) {
    const path = this.client._path('deployments', null, namespace);
    const data = await this.client.request('GET', path);
    return data.items;
  }

  async get(name, namespace) {
    const path = this.client._path('deployments', name, namespace);
    return this.client.request('GET', path);
  }

  async scale(name, replicas, namespace) {
    const path = this.client._path('deployments', name, namespace, 'scale');
    const scale = await this.client.request('GET', path);
    scale.spec.replicas = replicas;
    return this.client.request('PUT', path, {
      body: JSON.stringify(scale),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async restart(name, namespace) {
    const path = this.client._path('deployments', name, namespace);
    const patch = {
      spec: {
        template: {
          metadata: {
            annotations: {
              'kubectl.kubernetes.io/restartedAt': new Date().toISOString(),
            },
          },
        },
      },
    };
    return this.client.request('PATCH', path, {
      body: JSON.stringify(patch),
      headers: { 'Content-Type': 'application/strategic-merge-patch+json' },
    });
  }

  async status(name, namespace) {
    const deploy = await this.get(name, namespace);
    const s = deploy.status || {};
    return {
      replicas: s.replicas || 0,
      readyReplicas: s.readyReplicas || 0,
      updatedReplicas: s.updatedReplicas || 0,
      availableReplicas: s.availableReplicas || 0,
      conditions: s.conditions || [],
      ready: (s.updatedReplicas === s.replicas) && (s.availableReplicas === s.replicas),
    };
  }

  async image(name, container, image, namespace) {
    const path = this.client._path('deployments', name, namespace);
    const patch = {
      spec: {
        template: {
          spec: {
            containers: [{ name: container, image }],
          },
        },
      },
    };
    return this.client.request('PATCH', path, {
      body: JSON.stringify(patch),
      headers: { 'Content-Type': 'application/strategic-merge-patch+json' },
    });
  }

  async history(name, namespace) {
    const ns = namespace || this.client.namespace;
    const deploy = await this.get(name, ns);
    const uid = deploy.metadata.uid;

    const rsPath = this.client._path('replicasets', null, ns);
    const rsData = await this.client.request('GET', rsPath);

    const owned = (rsData.items || []).filter((rs) =>
      (rs.metadata.ownerReferences || []).some((ref) => ref.uid === uid)
    );

    owned.sort((a, b) => {
      const ra = parseInt(a.metadata.annotations?.['deployment.kubernetes.io/revision'] || '0', 10);
      const rb = parseInt(b.metadata.annotations?.['deployment.kubernetes.io/revision'] || '0', 10);
      return ra - rb;
    });

    return owned.map((rs) => ({
      revision: rs.metadata.annotations?.['deployment.kubernetes.io/revision'] || 'unknown',
      name: rs.metadata.name,
      replicas: rs.status?.replicas || 0,
      image: rs.spec?.template?.spec?.containers?.[0]?.image || '',
      createdAt: rs.metadata.creationTimestamp,
    }));
  }

  async undo(name, namespace) {
    const ns = namespace || this.client.namespace;
    const hist = await this.history(name, ns);
    if (hist.length < 2) {
      throw new Error(`No previous revision to roll back to for deployment ${name}`);
    }
    const previousRsName = hist[hist.length - 2].name;

    const rsPath = this.client._path('replicasets', previousRsName, ns);
    const prevRS = await this.client.request('GET', rsPath);
    const template = prevRS.spec.template;

    const path = this.client._path('deployments', name, ns);
    return this.client.request('PATCH', path, {
      body: JSON.stringify({ spec: { template } }),
      headers: { 'Content-Type': 'application/strategic-merge-patch+json' },
    });
  }
}

module.exports = { K8sDeployments };
