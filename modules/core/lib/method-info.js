'use strict';

// Method descriptions organized by module name.
// Keys are method paths relative to the module client (e.g. 'jobs.build').
// Values are either a string (description only) or { desc, args: { paramName: description } }.
const DOCS = {
  jenkins: {
    'ping': { desc: 'Test connectivity to Jenkins', returns: '{ mode, description }' },
    'request': { desc: 'Raw HTTP request to Jenkins API', args: {
      method: 'HTTP method (GET, POST, etc.)',
      urlPath: 'API endpoint path',
      options: 'Request options (body, headers, etc.)',
    }, returns: 'object | string' },
    'jobs.list': { desc: 'List all jobs', args: { folder: 'Folder path (optional)' }, returns: '{ name, color, url }[]' },
    'jobs.get': { desc: 'Get job details', args: { name: 'Job name or folder/path' }, returns: 'object' },
    'jobs.build': { desc: 'Trigger a build', args: {
      name: 'Job name or folder/path',
      params: 'Build parameters { KEY: value }',
    }, returns: '{ triggered, job }' },
    'jobs.config': { desc: 'Get job XML configuration', args: { name: 'Job name' }, returns: 'string (XML)' },
    'jobs.create': { desc: 'Create a job from XML config', args: { name: 'Job name', xmlConfig: 'Job XML configuration string' }, returns: 'string' },
    'jobs.delete': { desc: 'Delete a job', args: { name: 'Job name' }, returns: 'string' },
    'jobs.enable': { desc: 'Enable a disabled job', args: { name: 'Job name' }, returns: 'string' },
    'jobs.disable': { desc: 'Disable a job', args: { name: 'Job name' }, returns: 'string' },
    'jobs.exists': { desc: 'Check if a job exists', args: { name: 'Job name' }, returns: 'boolean' },
    'jobs.copy': { desc: 'Copy a job', args: { existingName: 'Source job name', newName: 'Destination job name' }, returns: 'string' },
    'builds.get': { desc: 'Get build details', args: { jobName: 'Job name', buildNumber: 'Build number' }, returns: 'object' },
    'builds.latest': { desc: 'Get the latest build', args: { jobName: 'Job name' }, returns: 'object' },
    'builds.log': { desc: 'Get console output text', args: { jobName: 'Job name', buildNumber: 'Build number' }, returns: 'string' },
    'builds.stop': { desc: 'Stop a running build', args: { jobName: 'Job name', buildNumber: 'Build number' }, returns: 'string' },
    'builds.waitFor': { desc: 'Poll until build finishes', args: {
      jobName: 'Job name',
      buildNumber: 'Build number',
      options: '{ timeout, interval } in ms',
    }, returns: 'object (completed build)' },
    'nodes.list': { desc: 'List all agents/nodes', returns: '{ displayName, offline, idle, numExecutors }[]' },
    'nodes.get': { desc: 'Get node details', args: { name: 'Node name' }, returns: 'object' },
    'nodes.offline': { desc: 'Take a node offline', args: { name: 'Node name', reason: 'Offline reason message' }, returns: 'string' },
    'nodes.online': { desc: 'Bring a node online', args: { name: 'Node name' }, returns: 'string' },
    'credentials.list': { desc: 'List credentials', args: { domain: 'Credential domain (default: _)' }, returns: '{ id, typeName, displayName }[]' },
    'credentials.get': { desc: 'Get credential details', args: { id: 'Credential ID', domain: 'Credential domain' }, returns: 'object' },
    'credentials.create': { desc: 'Create a credential', args: { xmlConfig: 'Credential XML', domain: 'Credential domain' }, returns: 'string' },
    'credentials.delete': { desc: 'Delete a credential', args: { id: 'Credential ID', domain: 'Credential domain' }, returns: 'string' },
    'groovy.exec': { desc: 'Execute a Groovy script on Jenkins', args: { script: 'Groovy source code string' }, returns: 'string' },
    'groovy.execJson': { desc: 'Execute Groovy and parse JSON result', args: { script: 'Groovy script that prints JSON' }, returns: 'object' },
    'groovy.listPlugins': { desc: 'List installed plugins via Groovy', returns: '{ name, version, active }[]' },
    'groovy.runningBuilds': { desc: 'List currently running builds', returns: '{ job, number, duration }[]' },
    'groovy.systemMessage': { desc: 'Get the Jenkins system message', returns: 'string' },
    'groovy.setSystemMessage': { desc: 'Set the Jenkins system message', args: { message: 'New system message HTML' }, returns: 'void' },
    'groovy.quietDown': { desc: 'Put Jenkins into quiet-down mode', returns: 'void' },
    'groovy.cancelQuietDown': { desc: 'Cancel quiet-down mode', returns: 'void' },
  },

  k8s: {
    'kubectl': { desc: 'Run a raw kubectl command', args: { args: 'Array of kubectl arguments', options: 'Exec options' }, returns: '{ stdout, stderr }' },
    'kubectlJson': { desc: 'Run kubectl with -o json and parse result', args: { args: 'Array of kubectl arguments', options: 'Exec options' }, returns: 'object' },
    'apply': { desc: 'Apply a manifest file or YAML string', args: { manifest: 'File path or YAML content', options: 'Apply options' }, returns: '{ stdout, stderr }' },
    'delete': { desc: 'Delete a resource', args: { resource: 'Resource type (pod, svc, etc.)', name: 'Resource name', options: '{ namespace }' }, returns: '{ stdout, stderr }' },
    'get': { desc: 'Get a resource as JSON', args: { resource: 'Resource type', name: 'Resource name', options: '{ namespace }' }, returns: 'object' },
    'describe': { desc: 'Describe a resource', args: { resource: 'Resource type', name: 'Resource name', options: '{ namespace }' }, returns: 'string' },
    'pods.list': { desc: 'List pods', args: { namespace: 'Namespace (default: from config)' }, returns: 'object[]' },
    'pods.get': { desc: 'Get pod details', args: { name: 'Pod name', namespace: 'Namespace' }, returns: 'object' },
    'pods.logs': { desc: 'Get pod logs', args: { name: 'Pod name', options: '{ container, follow, tail, since }' }, returns: 'string' },
    'pods.exec': { desc: 'Execute command in a pod', args: { name: 'Pod name', command: 'Command string or array', options: '{ container, namespace }' }, returns: 'string' },
    'pods.delete': { desc: 'Delete a pod', args: { name: 'Pod name', namespace: 'Namespace' }, returns: '{ stdout, stderr }' },
    'pods.wait': { desc: 'Wait for pod condition', args: { name: 'Pod name', condition: 'Ready, Completed, etc.', timeout: 'Seconds', namespace: 'Namespace' }, returns: '{ stdout, stderr }' },
    'deployments.list': { desc: 'List deployments', args: { namespace: 'Namespace' }, returns: 'object[]' },
    'deployments.get': { desc: 'Get deployment details', args: { name: 'Deployment name', namespace: 'Namespace' }, returns: 'object' },
    'deployments.scale': { desc: 'Scale a deployment', args: { name: 'Deployment name', replicas: 'Number of replicas', namespace: 'Namespace' }, returns: '{ stdout, stderr }' },
    'deployments.restart': { desc: 'Rollout restart', args: { name: 'Deployment name', namespace: 'Namespace' }, returns: '{ stdout, stderr }' },
    'deployments.status': { desc: 'Rollout status', args: { name: 'Deployment name', namespace: 'Namespace' }, returns: 'string' },
    'deployments.image': { desc: 'Update container image', args: { name: 'Deployment', container: 'Container name', image: 'New image:tag', namespace: 'Namespace' }, returns: '{ stdout, stderr }' },
    'deployments.history': { desc: 'Rollout history', args: { name: 'Deployment name', namespace: 'Namespace' }, returns: 'string' },
    'deployments.undo': { desc: 'Rollback deployment', args: { name: 'Deployment name', namespace: 'Namespace' }, returns: '{ stdout, stderr }' },
    'services.list': { desc: 'List services', args: { namespace: 'Namespace' }, returns: 'object[]' },
    'services.get': { desc: 'Get service details', args: { name: 'Service name', namespace: 'Namespace' }, returns: 'object' },
    'services.delete': { desc: 'Delete a service', args: { name: 'Service name', namespace: 'Namespace' }, returns: '{ stdout, stderr }' },
    'namespaces.list': { desc: 'List all namespaces', returns: 'object[]' },
    'namespaces.get': { desc: 'Get namespace details', args: { name: 'Namespace name' }, returns: 'object' },
    'namespaces.create': { desc: 'Create a namespace', args: { name: 'Namespace name' }, returns: '{ stdout, stderr }' },
    'namespaces.delete': { desc: 'Delete a namespace', args: { name: 'Namespace name' }, returns: '{ stdout, stderr }' },
    'configmaps.list': { desc: 'List configmaps', args: { namespace: 'Namespace' }, returns: 'object[]' },
    'configmaps.get': { desc: 'Get configmap', args: { name: 'ConfigMap name', namespace: 'Namespace' }, returns: 'object' },
    'configmaps.create': { desc: 'Create configmap', args: { name: 'ConfigMap name', data: 'Key-value data object', namespace: 'Namespace' }, returns: '{ stdout, stderr }' },
    'configmaps.delete': { desc: 'Delete configmap', args: { name: 'ConfigMap name', namespace: 'Namespace' }, returns: '{ stdout, stderr }' },
    'secrets.list': { desc: 'List secrets', args: { namespace: 'Namespace' }, returns: 'object[]' },
    'secrets.get': { desc: 'Get secret', args: { name: 'Secret name', namespace: 'Namespace' }, returns: 'object' },
    'secrets.create': { desc: 'Create secret', args: { name: 'Secret name', data: 'Key-value data object', namespace: 'Namespace' }, returns: '{ stdout, stderr }' },
    'secrets.delete': { desc: 'Delete secret', args: { name: 'Secret name', namespace: 'Namespace' }, returns: '{ stdout, stderr }' },
  },

  ssh: {
    'connect': { desc: 'Establish SSH connection (automatic on first command)', returns: 'void' },
    'exec': { desc: 'Execute a remote command', args: { command: 'Shell command string', options: 'Exec options' }, returns: '{ stdout, stderr, code }' },
    'upload': { desc: 'Upload file via SFTP', args: { localPath: 'Local file path', remotePath: 'Remote destination path' }, returns: 'void' },
    'download': { desc: 'Download file via SFTP', args: { remotePath: 'Remote file path', localPath: 'Local destination path' }, returns: 'void' },
    'readFile': { desc: 'Read a remote file as string', args: { remotePath: 'Remote file path' }, returns: 'string' },
    'writeFile': { desc: 'Write content to a remote file', args: { remotePath: 'Remote file path', content: 'File content (string or Buffer)' }, returns: 'void' },
    'listDir': { desc: 'List directory contents', args: { remotePath: 'Remote directory path' }, returns: '{ filename, longname, attrs }[]' },
    'mkdir': { desc: 'Create remote directory', args: { remotePath: 'Remote directory path', recursive: 'Create parents (default: true)' }, returns: 'void' },
    'close': { desc: 'Close the SSH connection', returns: 'void' },
  },

  docker: {
    'request': { desc: 'Raw HTTP request to Docker API', args: {
      method: 'HTTP method (GET, POST, DELETE)',
      urlPath: 'API endpoint path',
      options: 'Request options (body, headers, etc.)',
    }, returns: 'object | string' },
    'ping': { desc: 'Test Docker daemon connectivity', returns: 'string' },
    'info': { desc: 'Get Docker system information', returns: 'object' },
    'version': { desc: 'Get Docker version details', returns: 'object' },
    'containers.list': { desc: 'List containers', args: { all: 'Include stopped (default: false)' }, returns: 'object[]' },
    'containers.get': { desc: 'Get container details', args: { id: 'Container ID or name' }, returns: 'object' },
    'containers.create': { desc: 'Create a container', args: { name: 'Container name', config: 'Container config { Image, Cmd, Env, ... }' }, returns: '{ Id, Warnings }' },
    'containers.start': { desc: 'Start a container', args: { id: 'Container ID or name' }, returns: 'string' },
    'containers.stop': { desc: 'Stop a container', args: { id: 'Container ID or name', timeout: 'Seconds before kill' }, returns: 'string' },
    'containers.restart': { desc: 'Restart a container', args: { id: 'Container ID or name' }, returns: 'string' },
    'containers.remove': { desc: 'Remove a container', args: { id: 'Container ID or name', options: '{ force, v (volumes) }' }, returns: 'string' },
    'containers.logs': { desc: 'Get container logs', args: { id: 'Container ID or name', options: '{ stdout, stderr, tail, since }' }, returns: 'string' },
    'containers.exec': { desc: 'Execute command in container', args: { id: 'Container ID or name', command: 'Command string or array', options: 'Exec options' }, returns: 'string' },
    'containers.run': { desc: 'Create, start, wait, and return logs', args: { image: 'Docker image', command: 'Command to run', options: '{ name, remove, containerConfig }' }, returns: '{ id, output }' },
    'containers.stats': { desc: 'Get resource usage stats', args: { id: 'Container ID or name' }, returns: 'object' },
    'containers.top': { desc: 'List processes in container', args: { id: 'Container ID or name' }, returns: '{ Titles, Processes }' },
    'containers.rename': { desc: 'Rename a container', args: { id: 'Container ID or name', newName: 'New name' }, returns: 'string' },
    'containers.pause': { desc: 'Pause a container', args: { id: 'Container ID or name' }, returns: 'string' },
    'containers.unpause': { desc: 'Unpause a container', args: { id: 'Container ID or name' }, returns: 'string' },
    'images.list': { desc: 'List all images', args: { options: 'Filter options' }, returns: 'object[]' },
    'images.get': { desc: 'Get image details', args: { name: 'Image name or ID' }, returns: 'object' },
    'images.pull': { desc: 'Pull an image from registry', args: { image: 'Image name', tag: 'Tag (default: latest)' }, returns: 'string' },
    'images.tag': { desc: 'Tag an image', args: { source: 'Source image', repo: 'Repository name', tag: 'New tag' }, returns: 'string' },
    'images.push': { desc: 'Push image to registry', args: { name: 'Image name', options: 'Auth and tag options' }, returns: 'string' },
    'images.remove': { desc: 'Remove an image', args: { name: 'Image name or ID', options: '{ force, noprune }' }, returns: 'object[]' },
    'images.history': { desc: 'Get image layer history', args: { name: 'Image name or ID' }, returns: 'object[]' },
    'images.search': { desc: 'Search Docker Hub', args: { term: 'Search term' }, returns: 'object[]' },
    'images.prune': { desc: 'Remove unused images', args: { options: 'Prune options' }, returns: '{ ImagesDeleted, SpaceReclaimed }' },
    'volumes.list': { desc: 'List all volumes', returns: 'object[]' },
    'volumes.get': { desc: 'Get volume details', args: { name: 'Volume name' }, returns: 'object' },
    'volumes.create': { desc: 'Create a volume', args: { name: 'Volume name', options: 'Driver and options' }, returns: 'object' },
    'volumes.remove': { desc: 'Remove a volume', args: { name: 'Volume name', force: 'Force remove' }, returns: 'string' },
    'volumes.prune': { desc: 'Remove unused volumes', returns: '{ VolumesDeleted, SpaceReclaimed }' },
    'networks.list': { desc: 'List all networks', returns: 'object[]' },
    'networks.get': { desc: 'Get network details', args: { id: 'Network name or ID' }, returns: 'object' },
    'networks.create': { desc: 'Create a network', args: { name: 'Network name', options: 'Driver and options' }, returns: '{ Id, Warning }' },
    'networks.remove': { desc: 'Remove a network', args: { id: 'Network name or ID' }, returns: 'string' },
    'networks.connect': { desc: 'Connect container to network', args: { networkId: 'Network name/ID', containerId: 'Container name/ID' }, returns: 'string' },
    'networks.disconnect': { desc: 'Disconnect container from network', args: { networkId: 'Network name/ID', containerId: 'Container name/ID', force: 'Force disconnect' }, returns: 'string' },
    'networks.prune': { desc: 'Remove unused networks', returns: '{ NetworksDeleted }' },
  },

  git: {
    'clone': { desc: 'Clone a repository', args: { url: 'Repository URL', dest: 'Local directory', options: '{ depth, branch, ... }' }, returns: '{ stdout, stderr }' },
    'add': { desc: 'Stage files', args: { files: 'File path(s) — string or array' }, returns: '{ stdout, stderr }' },
    'commit': { desc: 'Create a commit', args: { message: 'Commit message', options: '{ amend, author, ... }' }, returns: '{ stdout, stderr }' },
    'push': { desc: 'Push to remote', args: { remote: 'Remote name', branch: 'Branch', options: '{ force, tags, ... }' }, returns: '{ stdout, stderr }' },
    'pull': { desc: 'Pull from remote', args: { remote: 'Remote name', branch: 'Branch', options: '{ rebase, ... }' }, returns: '{ stdout, stderr }' },
    'fetch': { desc: 'Fetch from remote', args: { remote: 'Remote name', options: '{ prune, tags, ... }' }, returns: '{ stdout, stderr }' },
    'tag': { desc: 'Create a tag', args: { name: 'Tag name', options: '{ message, annotate, ... }' }, returns: '{ stdout, stderr }' },
    'tags': { desc: 'List all tags', returns: 'string[]' },
    'branch': { desc: 'Create or list branches', args: { name: 'Branch name (omit to list)', options: '{ delete, ... }' }, returns: 'string[] | { stdout, stderr }' },
    'checkout': { desc: 'Checkout a branch or ref', args: { ref: 'Branch, tag, or commit hash' }, returns: '{ stdout, stderr }' },
    'merge': { desc: 'Merge a branch', args: { branch: 'Branch to merge', options: '{ noFf, squash, ... }' }, returns: '{ stdout, stderr }' },
    'status': { desc: 'Show working tree status (porcelain)', returns: '{ status, file }[]' },
    'log': { desc: 'Show commit history', args: { count: 'Number of commits (default: 10)' }, returns: '{ hash, author, email, subject, date }[]' },
    'diff': { desc: 'Show changes', args: { options: '{ staged, path, ... }' }, returns: 'string' },
    'stash': { desc: 'Stash changes', args: { options: 'Subcommand: pop, list, drop, etc.' }, returns: '{ stdout, stderr }' },
    'currentBranch': { desc: 'Get current branch name', returns: 'string' },
    'remoteUrl': { desc: 'Get remote URL', args: { remote: 'Remote name (default: origin)' }, returns: 'string' },
    'remotes': { desc: 'List remote repositories', returns: '{ name, url, type }[]' },
    'clean': { desc: 'Remove untracked files', args: { options: '{ force, directories, ... }' }, returns: '{ stdout, stderr }' },
    'rev': { desc: 'Get commit hash for a ref', args: { ref: 'Branch, tag, HEAD, etc.' }, returns: 'string' },
  },
};

const MODULE_NAMES = new Set(Object.keys(DOCS));

/**
 * Extract parameter names from a function's source code.
 */
function extractParams(fn) {
  const src = fn.toString();
  const start = src.indexOf('(');
  if (start === -1) return [];

  // Find matching close paren (handles nested parens in defaults)
  let depth = 1;
  let i = start + 1;
  for (; i < src.length && depth > 0; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')') depth--;
  }

  const inner = src.slice(start + 1, i - 1).trim();
  if (!inner) return [];

  // Split by top-level commas
  const params = [];
  let current = '';
  depth = 0;
  for (const ch of inner) {
    if ('({['.includes(ch)) depth++;
    else if (')}]'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) {
      params.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) params.push(current.trim());

  return params.map((p) => {
    const hasDefault = p.includes('=');
    const name = p.split(/\s*=/)[0].trim();
    return hasDefault ? name + '?' : name;
  });
}

/**
 * Look up the doc entry for a method given its module name and
 * relative path within the module (e.g. 'jobs.build').
 */
function lookupDoc(moduleName, methodPath) {
  const moduleDocs = DOCS[moduleName];
  if (!moduleDocs) return null;
  const entry = moduleDocs[methodPath];
  if (!entry) return null;
  if (typeof entry === 'string') return { desc: entry, args: {}, returns: '' };
  return { desc: entry.desc || '', args: entry.args || {}, returns: entry.returns || '' };
}

/**
 * Given a context and a dotted path (e.g. 'jenkins.staging.jobs.build'),
 * resolve the value and return method info.
 *
 * Returns:
 *   { type: 'function', path, params, desc, argDescs }
 *   { type: 'object', path, methods: [{ name, params, desc }] }
 *   null if path doesn't resolve
 */
function resolveInfo(context, path) {
  const parts = path.split('.');

  // Resolve to the actual value in the context
  let value = context;
  for (const part of parts) {
    if (value == null) return null;
    value = value[part];
    if (value === undefined) return null;
  }

  // Determine the module name and method path relative to the module client.
  // For multi-instance (jenkins.staging.jobs.build), skip the instance name.
  const moduleName = parts[0];
  let relParts;
  if (MODULE_NAMES.has(moduleName)) {
    const moduleValue = context[moduleName];
    const proto = Object.getPrototypeOf(moduleValue);
    const isNamespace = !proto || proto === Object.prototype;
    relParts = isNamespace ? parts.slice(2) : parts.slice(1);
  } else {
    relParts = parts.slice(1);
  }
  const relPath = relParts.join('.');

  if (typeof value === 'function') {
    const params = extractParams(value);
    const doc = MODULE_NAMES.has(moduleName) ? lookupDoc(moduleName, relPath) : null;
    return {
      type: 'function',
      path,
      params,
      desc: doc?.desc || '',
      argDescs: doc?.args || {},
      returns: doc?.returns || '',
    };
  }

  if (typeof value === 'object' && value !== null) {
    const methods = collectMethods(value, moduleName, relPath);
    return { type: 'object', path, methods };
  }

  return null;
}

/**
 * Collect all public methods on an object (own properties + prototype),
 * including methods on sub-resource objects (one level deep).
 */
// Properties that are internal infrastructure, not user-facing API
const INTERNAL_PROPS = new Set(['logger', 'client', 'auth', 'baseUrl']);

function collectMethods(obj, moduleName, baseRelPath) {
  const methods = [];
  const seen = new Set();

  function add(displayName, fn, relPath) {
    if (seen.has(displayName)) return;
    seen.add(displayName);
    const params = extractParams(fn);
    const doc = MODULE_NAMES.has(moduleName) ? lookupDoc(moduleName, relPath) : null;
    methods.push({ name: displayName, params, desc: doc?.desc || '' });
  }

  // Prototype methods first (direct methods like ping, request)
  const proto = Object.getPrototypeOf(obj);
  if (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor' || key.startsWith('_')) continue;
      if (typeof obj[key] === 'function') {
        const rel = baseRelPath ? `${baseRelPath}.${key}` : key;
        add(key, obj[key], rel);
      }
    }
  }

  // Own enumerable properties (sub-resources + any own methods)
  for (const key of Object.keys(obj)) {
    if (key.startsWith('_') || INTERNAL_PROPS.has(key)) continue;
    const val = obj[key];
    if (typeof val === 'function') {
      const rel = baseRelPath ? `${baseRelPath}.${key}` : key;
      add(key, val, rel);
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      // Sub-resource object (e.g. jenkins.jobs, docker.containers)
      const subProto = Object.getPrototypeOf(val);
      if (subProto && subProto !== Object.prototype) {
        for (const subKey of Object.getOwnPropertyNames(subProto)) {
          if (subKey === 'constructor' || subKey.startsWith('_')) continue;
          if (typeof val[subKey] === 'function') {
            const rel = baseRelPath ? `${baseRelPath}.${key}.${subKey}` : `${key}.${subKey}`;
            add(`${key}.${subKey}`, val[subKey], rel);
          }
        }
      }
    }
  }

  return methods;
}

/**
 * Format info for display in the REPL.
 */
function formatInfo(info) {
  if (!info) return '  No info available.';

  if (info.type === 'function') {
    const sig = `${info.path}(${info.params.join(', ')})`;
    let out = `\n  ${sig}`;
    if (info.desc) out += `\n  ${info.desc}`;
    if (info.returns) out += `\n  Returns: ${info.returns}`;
    const argKeys = Object.keys(info.argDescs);
    if (argKeys.length > 0) {
      out += '\n';
      const maxLen = Math.max(...argKeys.map((k) => k.length));
      for (const [arg, desc] of Object.entries(info.argDescs)) {
        out += `\n    ${arg.padEnd(maxLen + 2)} ${desc}`;
      }
    }
    return out + '\n';
  }

  if (info.type === 'object') {
    let out = `\n  ${info.path}\n`;
    if (info.methods.length === 0) {
      out += '    (no methods)\n';
    } else {
      const sigs = info.methods.map((m) => `${m.name}(${m.params.join(', ')})`);
      const maxLen = Math.max(...sigs.map((s) => s.length));
      for (let i = 0; i < info.methods.length; i++) {
        out += `\n    ${sigs[i].padEnd(maxLen + 3)} ${info.methods[i].desc}`;
      }
      out += '\n';
    }
    return out;
  }

  return '  No info available.';
}

/**
 * Generate structured documentation data for all modules.
 * Uses DOCS as the authoritative source, enriched with live parameter names
 * from context instances when available.
 */
function generateDocsData(context) {
  const modules = [];

  for (const [moduleName, moduleDocs] of Object.entries(DOCS)) {
    // Try to get the live instance for extractParams
    const instance = context ? context[moduleName] : null;

    const methods = [];
    for (const [methodPath, doc] of Object.entries(moduleDocs)) {
      const desc = typeof doc === 'string' ? doc : (doc.desc || '');
      const argDescs = typeof doc === 'object' && doc.args ? doc.args : {};
      const returns = typeof doc === 'object' && doc.returns ? doc.returns : '';

      // Try to extract real param names from the live function
      let params = [];
      if (instance) {
        const fn = resolvePath(instance, methodPath);
        if (typeof fn === 'function') {
          params = extractParams(fn);
        }
      }
      // Fallback: use arg description keys as param names
      if (params.length === 0 && Object.keys(argDescs).length > 0) {
        params = Object.keys(argDescs);
      }

      const signature = `${methodPath}(${params.join(', ')})`;
      const args = Object.entries(argDescs).map(([name, adesc]) => ({ name, desc: adesc }));

      methods.push({
        path: methodPath,
        fullPath: `${moduleName}.${methodPath}`,
        signature,
        desc,
        args,
        returns,
      });
    }

    modules.push({ module: moduleName, methods });
  }

  return modules;
}

/**
 * Walk a dotted path on an object to find a nested value.
 */
function resolvePath(obj, dotPath) {
  let cur = obj;
  for (const part of dotPath.split('.')) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

module.exports = { resolveInfo, formatInfo, extractParams, generateDocsData, DOCS };
