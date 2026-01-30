'use strict';

class DockerContainers {
  constructor(client) {
    this.client = client;
  }

  async list(all = false) {
    return this.client.request('GET', `/containers/json?all=${all}`);
  }

  async get(id) {
    return this.client.request('GET', `/containers/${id}/json`);
  }

  async create(name, config) {
    const qs = name ? `?name=${encodeURIComponent(name)}` : '';
    return this.client.request('POST', `/containers/create${qs}`, {
      body: JSON.stringify(config),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async start(id) {
    return this.client.request('POST', `/containers/${id}/start`);
  }

  async stop(id, timeout = 10) {
    return this.client.request('POST', `/containers/${id}/stop?t=${timeout}`);
  }

  async restart(id) {
    return this.client.request('POST', `/containers/${id}/restart`);
  }

  async remove(id, options = {}) {
    const params = new URLSearchParams();
    if (options.force) params.set('force', 'true');
    if (options.volumes) params.set('v', 'true');
    const qs = params.toString();
    return this.client.request('DELETE', `/containers/${id}${qs ? '?' + qs : ''}`);
  }

  async logs(id, options = {}) {
    const params = new URLSearchParams({
      stdout: 'true',
      stderr: 'true',
    });
    if (options.tail) params.set('tail', String(options.tail));
    if (options.since) params.set('since', String(options.since));
    if (options.timestamps) params.set('timestamps', 'true');
    return this.client.request('GET', `/containers/${id}/logs?${params}`);
  }

  async exec(id, command, options = {}) {
    const cmd = Array.isArray(command) ? command : ['sh', '-c', command];
    const execCreate = await this.client.request('POST', `/containers/${id}/exec`, {
      body: JSON.stringify({
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true,
        Tty: options.tty || false,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await this.client.request('POST', `/exec/${execCreate.Id}/start`, {
      body: JSON.stringify({ Detach: false, Tty: options.tty || false }),
      headers: { 'Content-Type': 'application/json' },
    });
    return result;
  }

  async run(image, command, options = {}) {
    const cmd = command
      ? (Array.isArray(command) ? command : ['sh', '-c', command])
      : undefined;
    const config = {
      Image: image,
      ...options.containerConfig,
    };
    if (cmd) config.Cmd = cmd;

    const { Id } = await this.create(options.name || '', config);
    await this.start(Id);
    await this.client.request('POST', `/containers/${Id}/wait`);
    const logs = await this.logs(Id);
    if (options.remove !== false) {
      await this.remove(Id);
    }
    return { id: Id, output: logs };
  }

  async stats(id) {
    return this.client.request('GET', `/containers/${id}/stats?stream=false`);
  }

  async top(id) {
    return this.client.request('GET', `/containers/${id}/top`);
  }

  async rename(id, newName) {
    return this.client.request('POST', `/containers/${id}/rename?name=${encodeURIComponent(newName)}`);
  }

  async pause(id) {
    return this.client.request('POST', `/containers/${id}/pause`);
  }

  async unpause(id) {
    return this.client.request('POST', `/containers/${id}/unpause`);
  }
}

module.exports = { DockerContainers };
