'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { parse: parseYaml } = require('aq');

/**
 * Load and parse a kubeconfig file, resolving the active context
 * to extract server URL, CA cert, and authentication credentials.
 *
 * @param {object} options
 * @param {string} [options.kubeconfig] - Path to kubeconfig file
 * @param {string} [options.context]    - Context name to use
 * @returns {{ server, ca, token, clientCert, clientKey, namespace, skipTLS, execPlugin }}
 */
function loadKubeconfig(options = {}) {
  const kubeconfigPath = options.kubeconfig
    || process.env.KUBECONFIG
    || path.join(os.homedir(), '.kube', 'config');

  const raw = fs.readFileSync(kubeconfigPath, 'utf8');
  const config = parseYaml(raw, 'yaml');

  // Resolve context
  const contextName = options.context || config['current-context'];
  if (!contextName) {
    throw new Error('No Kubernetes context specified and no current-context in kubeconfig');
  }

  const contextEntry = (config.contexts || []).find((c) => c.name === contextName);
  if (!contextEntry) {
    throw new Error(`Context "${contextName}" not found in kubeconfig`);
  }
  const ctx = contextEntry.context;

  // Resolve cluster
  const clusterEntry = (config.clusters || []).find((c) => c.name === ctx.cluster);
  if (!clusterEntry) {
    throw new Error(`Cluster "${ctx.cluster}" not found in kubeconfig`);
  }
  const cluster = clusterEntry.cluster;

  // Resolve user
  const userEntry = (config.users || []).find((u) => u.name === ctx.user);
  if (!userEntry) {
    throw new Error(`User "${ctx.user}" not found in kubeconfig`);
  }
  const user = userEntry.user;

  // Extract cluster info
  const server = cluster.server;
  const skipTLS = cluster['insecure-skip-tls-verify'] === true;

  let ca = null;
  if (cluster['certificate-authority-data']) {
    ca = Buffer.from(cluster['certificate-authority-data'], 'base64');
  } else if (cluster['certificate-authority']) {
    ca = fs.readFileSync(cluster['certificate-authority']);
  }

  // Extract user credentials (priority: token > client cert > exec plugin)
  let token = null;
  let clientCert = null;
  let clientKey = null;
  let execPlugin = null;

  if (user.token) {
    token = user.token;
  }

  if (user['client-certificate-data']) {
    clientCert = Buffer.from(user['client-certificate-data'], 'base64');
  } else if (user['client-certificate']) {
    clientCert = fs.readFileSync(user['client-certificate']);
  }

  if (user['client-key-data']) {
    clientKey = Buffer.from(user['client-key-data'], 'base64');
  } else if (user['client-key']) {
    clientKey = fs.readFileSync(user['client-key']);
  }

  if (!token && !clientCert && user.exec) {
    execPlugin = user.exec;
  }

  const namespace = ctx.namespace || 'default';

  return { server, ca, token, clientCert, clientKey, namespace, skipTLS, execPlugin };
}

/**
 * Run an exec-based credential plugin (e.g. aws eks get-token)
 * and return the token / client cert from the ExecCredential response.
 */
async function execCredentialPlugin(execConfig) {
  const { exec } = require('@jsaf/core');
  const env = { ...process.env };
  if (execConfig.env) {
    for (const { name, value } of execConfig.env) {
      env[name] = value;
    }
  }
  const { stdout } = await exec(execConfig.command, execConfig.args || [], {
    env,
    timeout: 10000,
  });
  const cred = JSON.parse(stdout);
  const status = cred.status || {};
  return {
    token: status.token || null,
    clientCert: status.clientCertificateData ? Buffer.from(status.clientCertificateData) : null,
    clientKey: status.clientKeyData ? Buffer.from(status.clientKeyData) : null,
    expiration: status.expirationTimestamp ? new Date(status.expirationTimestamp) : null,
  };
}

module.exports = { loadKubeconfig, execCredentialPlugin };
