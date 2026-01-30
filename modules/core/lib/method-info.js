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
    'jobs.buildAndWait': { desc: 'Trigger a build and wait for completion', args: {
      name: 'Job name or folder/path',
      params: 'Build parameters { KEY: value }',
      options: '{ timeout, interval } in ms',
    }, returns: 'object (completed build)' },
    'jobs.getConfig': { desc: 'Get job XML configuration', args: { name: 'Job name' }, returns: 'string (XML)' },
    'jobs.setConfig': { desc: 'Set job XML configuration', args: { name: 'Job name', xmlConfig: 'Job XML configuration string' }, returns: 'string' },
    'jobs.getPipeline': { desc: 'Get pipeline job Groovy script', args: { name: 'Job name' }, returns: 'string (Groovy script)' },
    'jobs.setPipeline': { desc: 'Set pipeline job Groovy script', args: { name: 'Job name', script: 'Groovy script string' }, returns: 'string' },
    'jobs.create': { desc: 'Create a job from XML config', args: { name: 'Job name', xmlConfig: 'Job XML configuration string' }, returns: 'string' },
    'jobs.delete': { desc: 'Delete a job', args: { name: 'Job name' }, returns: 'string' },
    'jobs.enable': { desc: 'Enable a disabled job', args: { name: 'Job name' }, returns: 'string' },
    'jobs.disable': { desc: 'Disable a job', args: { name: 'Job name' }, returns: 'string' },
    'jobs.exists': { desc: 'Check if a job exists', args: { name: 'Job name' }, returns: 'boolean' },
    'jobs.copy': { desc: 'Copy a job', args: { existingName: 'Source job name', newName: 'Destination job name' }, returns: 'string' },
    'builds.get': { desc: 'Get build details', args: { jobName: 'Job name', buildNumber: 'Build number' }, returns: 'object' },
    'builds.getLatest': { desc: 'Get the latest build', args: { jobName: 'Job name' }, returns: 'object' },
    'builds.getLog': { desc: 'Get console output text', args: { jobName: 'Job name', buildNumber: 'Build number' }, returns: 'string' },
    'builds.stop': { desc: 'Stop a running build', args: { jobName: 'Job name', buildNumber: 'Build number' }, returns: 'string' },
    'builds.waitFor': { desc: 'Poll until build finishes', args: {
      jobName: 'Job name',
      buildNumber: 'Build number',
      options: '{ timeout, interval } in ms',
    }, returns: 'object (completed build)' },
    'nodes.list': { desc: 'List all agents/nodes', returns: '{ displayName, offline, idle, numExecutors }[]' },
    'nodes.get': { desc: 'Get node details', args: { name: 'Node name' }, returns: 'object' },
    'nodes.setOffline': { desc: 'Take a node offline', args: { name: 'Node name', reason: 'Offline reason message' }, returns: 'string' },
    'nodes.setOnline': { desc: 'Bring a node online', args: { name: 'Node name' }, returns: 'string' },
    'credentials.list': { desc: 'List credentials', args: { domain: 'Credential domain (default: _)' }, returns: '{ id, typeName, displayName }[]' },
    'credentials.get': { desc: 'Get credential details', args: { id: 'Credential ID', domain: 'Credential domain' }, returns: 'object' },
    'credentials.create': { desc: 'Create a credential', args: { xmlConfig: 'Credential XML', domain: 'Credential domain' }, returns: 'string' },
    'credentials.delete': { desc: 'Delete a credential', args: { id: 'Credential ID', domain: 'Credential domain' }, returns: 'string' },
    'groovy.exec': { desc: 'Execute a Groovy script on Jenkins', args: { script: 'Groovy source code string' }, returns: 'string' },
    'groovy.execJson': { desc: 'Execute Groovy and parse JSON result', args: { script: 'Groovy script that prints JSON' }, returns: 'object' },
    'groovy.listPlugins': { desc: 'List installed plugins via Groovy', returns: '{ name, version, active }[]' },
    'groovy.getRunningBuilds': { desc: 'Get currently running builds', returns: '{ job, number, duration }[]' },
    'groovy.getSystemMessage': { desc: 'Get the Jenkins system message', returns: 'string' },
    'groovy.setSystemMessage': { desc: 'Set the Jenkins system message', args: { message: 'New system message HTML' }, returns: 'void' },
    'groovy.quietDown': { desc: 'Put Jenkins into quiet-down mode', returns: 'void' },
    'groovy.cancelQuietDown': { desc: 'Cancel quiet-down mode', returns: 'void' },
  },

  k8s: {
    'ping': { desc: 'Test connectivity to the Kubernetes cluster', returns: 'object' },
    'getVersion': { desc: 'Get cluster version info (cached)', returns: '{ major, minor, gitVersion, platform }' },
    'request': { desc: 'Raw HTTP request to the Kubernetes API', args: {
      method: 'HTTP method (GET, POST, PUT, PATCH, DELETE)',
      urlPath: 'API endpoint path',
      options: 'Request options (body, headers, etc.)',
    }, returns: 'object | string' },
    'get': { desc: 'Get a single resource by type and name', args: { resource: 'Resource type (pods, deployments, etc.)', name: 'Resource name', options: '{ namespace }' }, returns: 'object' },
    'list': { desc: 'List resources of a given type', args: { resource: 'Resource type', options: '{ namespace, labelSelector, fieldSelector }' }, returns: 'object (with .items)' },
    'delete': { desc: 'Delete a resource', args: { resource: 'Resource type', name: 'Resource name', options: '{ namespace, force }' }, returns: 'object' },
    'apply': { desc: 'Apply a manifest (server-side apply on 1.16+, create-or-update fallback)', args: { manifest: 'Manifest object, YAML/JSON string, or file path', options: '{ namespace, fieldManager, force }' }, returns: 'object' },
    'describe': { desc: 'Get resource details with related events', args: { resource: 'Resource type', name: 'Resource name', options: '{ namespace }' }, returns: '{ resource, events }' },
    'pods.list': { desc: 'List pods', args: { namespace: 'Namespace (default: from config)' }, returns: 'object[]' },
    'pods.get': { desc: 'Get pod details', args: { name: 'Pod name', namespace: 'Namespace' }, returns: 'object' },
    'pods.getLogs': { desc: 'Get pod logs', args: { name: 'Pod name', options: '{ container, previous, tail, since, namespace }' }, returns: 'string' },
    'pods.exec': { desc: 'Not implemented (requires WebSocket)', returns: 'throws Error' },
    'pods.delete': { desc: 'Delete a pod', args: { name: 'Pod name', namespace: 'Namespace' }, returns: 'object' },
    'pods.wait': { desc: 'Wait for pod condition', args: { name: 'Pod name', condition: 'Ready, Completed, etc.', timeout: 'Seconds (default: 120)', namespace: 'Namespace' }, returns: 'object (pod)' },
    'deployments.list': { desc: 'List deployments', args: { namespace: 'Namespace' }, returns: 'object[]' },
    'deployments.get': { desc: 'Get deployment details', args: { name: 'Deployment name', namespace: 'Namespace' }, returns: 'object' },
    'deployments.scale': { desc: 'Scale a deployment', args: { name: 'Deployment name', replicas: 'Number of replicas', namespace: 'Namespace' }, returns: 'object' },
    'deployments.restart': { desc: 'Rollout restart', args: { name: 'Deployment name', namespace: 'Namespace' }, returns: 'object' },
    'deployments.getStatus': { desc: 'Get deployment rollout status', args: { name: 'Deployment name', namespace: 'Namespace' }, returns: '{ replicas, readyReplicas, updatedReplicas, availableReplicas, conditions, ready }' },
    'deployments.setImage': { desc: 'Set container image', args: { name: 'Deployment', container: 'Container name', image: 'New image:tag', namespace: 'Namespace' }, returns: 'object' },
    'deployments.getHistory': { desc: 'Get rollout history', args: { name: 'Deployment name', namespace: 'Namespace' }, returns: '{ revision, name, replicas, image, createdAt }[]' },
    'deployments.undo': { desc: 'Rollback to previous revision', args: { name: 'Deployment name', namespace: 'Namespace' }, returns: 'object' },
    'services.list': { desc: 'List services', args: { namespace: 'Namespace' }, returns: 'object[]' },
    'services.get': { desc: 'Get service details', args: { name: 'Service name', namespace: 'Namespace' }, returns: 'object' },
    'services.delete': { desc: 'Delete a service', args: { name: 'Service name', namespace: 'Namespace' }, returns: 'object' },
    'namespaces.list': { desc: 'List all namespaces', returns: 'object[]' },
    'namespaces.get': { desc: 'Get namespace details', args: { name: 'Namespace name' }, returns: 'object' },
    'namespaces.create': { desc: 'Create a namespace', args: { name: 'Namespace name' }, returns: 'object' },
    'namespaces.delete': { desc: 'Delete a namespace', args: { name: 'Namespace name' }, returns: 'object' },
    'configmaps.list': { desc: 'List configmaps', args: { namespace: 'Namespace' }, returns: 'object[]' },
    'configmaps.get': { desc: 'Get configmap', args: { name: 'ConfigMap name', namespace: 'Namespace' }, returns: 'object' },
    'configmaps.create': { desc: 'Create configmap', args: { name: 'ConfigMap name', data: 'Key-value data object', namespace: 'Namespace' }, returns: 'object' },
    'configmaps.delete': { desc: 'Delete configmap', args: { name: 'ConfigMap name', namespace: 'Namespace' }, returns: 'object' },
    'secrets.list': { desc: 'List secrets', args: { namespace: 'Namespace' }, returns: 'object[]' },
    'secrets.get': { desc: 'Get secret', args: { name: 'Secret name', namespace: 'Namespace' }, returns: 'object' },
    'secrets.create': { desc: 'Create secret (values auto-base64-encoded)', args: { name: 'Secret name', data: 'Key-value data object', namespace: 'Namespace' }, returns: 'object' },
    'secrets.delete': { desc: 'Delete secret', args: { name: 'Secret name', namespace: 'Namespace' }, returns: 'object' },
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
    'getInfo': { desc: 'Get Docker system information', returns: 'object' },
    'getVersion': { desc: 'Get Docker version details', returns: 'object' },
    'containers.list': { desc: 'List containers', args: { all: 'Include stopped (default: false)' }, returns: 'object[]' },
    'containers.get': { desc: 'Get container details', args: { id: 'Container ID or name' }, returns: 'object' },
    'containers.create': { desc: 'Create a container', args: { name: 'Container name', config: 'Container config { Image, Cmd, Env, ... }' }, returns: '{ Id, Warnings }' },
    'containers.start': { desc: 'Start a container', args: { id: 'Container ID or name' }, returns: 'string' },
    'containers.stop': { desc: 'Stop a container', args: { id: 'Container ID or name', timeout: 'Seconds before kill' }, returns: 'string' },
    'containers.restart': { desc: 'Restart a container', args: { id: 'Container ID or name' }, returns: 'string' },
    'containers.remove': { desc: 'Remove a container', args: { id: 'Container ID or name', options: '{ force, v (volumes) }' }, returns: 'string' },
    'containers.getLogs': { desc: 'Get container logs', args: { id: 'Container ID or name', options: '{ stdout, stderr, tail, since }' }, returns: 'string' },
    'containers.exec': { desc: 'Execute command in container', args: { id: 'Container ID or name', command: 'Command string or array', options: 'Exec options' }, returns: 'string' },
    'containers.run': { desc: 'Create, start, wait, and return logs', args: { image: 'Docker image', command: 'Command to run', options: '{ name, remove, containerConfig }' }, returns: '{ id, output }' },
    'containers.getStats': { desc: 'Get resource usage stats', args: { id: 'Container ID or name' }, returns: 'object' },
    'containers.getTop': { desc: 'Get processes in container', args: { id: 'Container ID or name' }, returns: '{ Titles, Processes }' },
    'containers.rename': { desc: 'Rename a container', args: { id: 'Container ID or name', newName: 'New name' }, returns: 'string' },
    'containers.pause': { desc: 'Pause a container', args: { id: 'Container ID or name' }, returns: 'string' },
    'containers.unpause': { desc: 'Unpause a container', args: { id: 'Container ID or name' }, returns: 'string' },
    'images.list': { desc: 'List all images', args: { options: 'Filter options' }, returns: 'object[]' },
    'images.get': { desc: 'Get image details', args: { name: 'Image name or ID' }, returns: 'object' },
    'images.pull': { desc: 'Pull an image from registry', args: { image: 'Image name', tag: 'Tag (default: latest)' }, returns: 'string' },
    'images.tag': { desc: 'Tag an image', args: { source: 'Source image', repo: 'Repository name', tag: 'New tag' }, returns: 'string' },
    'images.push': { desc: 'Push image to registry', args: { name: 'Image name', options: 'Auth and tag options' }, returns: 'string' },
    'images.remove': { desc: 'Remove an image', args: { name: 'Image name or ID', options: '{ force, noprune }' }, returns: 'object[]' },
    'images.getHistory': { desc: 'Get image layer history', args: { name: 'Image name or ID' }, returns: 'object[]' },
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
    'getTags': { desc: 'Get all tags', returns: 'string[]' },
    'branch': { desc: 'Create or list branches', args: { name: 'Branch name (omit to list)', options: '{ delete, ... }' }, returns: 'string[] | { stdout, stderr }' },
    'checkout': { desc: 'Checkout a branch or ref', args: { ref: 'Branch, tag, or commit hash' }, returns: '{ stdout, stderr }' },
    'merge': { desc: 'Merge a branch', args: { branch: 'Branch to merge', options: '{ noFf, squash, ... }' }, returns: '{ stdout, stderr }' },
    'getStatus': { desc: 'Get working tree status (porcelain)', returns: '{ status, file }[]' },
    'getLog': { desc: 'Get commit history', args: { count: 'Number of commits (default: 10)' }, returns: '{ hash, author, email, subject, date }[]' },
    'getDiff': { desc: 'Get changes', args: { options: '{ staged, path, ... }' }, returns: 'string' },
    'stash': { desc: 'Stash changes', args: { options: 'Subcommand: pop, list, drop, etc.' }, returns: '{ stdout, stderr }' },
    'getCurrentBranch': { desc: 'Get current branch name', returns: 'string' },
    'getRemoteUrl': { desc: 'Get remote URL', args: { remote: 'Remote name (default: origin)' }, returns: 'string' },
    'getRemotes': { desc: 'Get remote repositories', returns: '{ name, url, type }[]' },
    'clean': { desc: 'Remove untracked files', args: { options: '{ force, directories, ... }' }, returns: '{ stdout, stderr }' },
    'getRev': { desc: 'Get commit hash for a ref', args: { ref: 'Branch, tag, HEAD, etc.' }, returns: 'string' },
  },

  aq: {
    'parse': { desc: 'Parse a string into a JS object (auto-detects format)', args: {
      input: 'Input string (JSON, YAML, XML, TOML, INI)',
      format: 'Format name (optional, auto-detects if omitted)',
    }, returns: 'object' },
    'encode': { desc: 'Serialize a JS object to a string in the given format', args: {
      data: 'JS object to serialize',
      format: 'Output format: json, yaml, xml, toml, ini',
    }, returns: 'string' },
    'tracked': { desc: 'Wrap object in Proxy for chain-based comment/anchor manipulation', args: {
      obj: 'Object to wrap',
    }, returns: 'Proxy' },
    'aqFindByLocator': { desc: 'Find values using a custom locator function', args: {
      locator: '(parent, name, value) => boolean',
      root: 'Root object to search (optional)',
    }, returns: '{ path, value }[]' },
    'aqFindByName': { desc: 'Find by property name (regex pattern)', args: {
      locator: 'Regex pattern string',
    }, returns: '{ path, value }[]' },
    'aqFindByFullName': { desc: 'Find by full dotted path (regex pattern)', args: {
      locator: 'Regex pattern string',
    }, returns: '{ path, value }[]' },
    'aqFindByValue': { desc: 'Find by string value (regex pattern)', args: {
      locator: 'Regex pattern string',
    }, returns: '{ path, value }[]' },
    'aqDiff': { desc: 'Compare multiple objects and highlight differences', args: {
      '...objects': 'Two or more objects to compare',
    }, returns: 'object (diff tree)' },
    'aqComments': { desc: 'Get comment metadata from a parsed object', args: {
      key: 'Property name (optional, returns all if omitted)',
    }, returns: 'CommentMap | CommentEntry | undefined' },
    'aqAnchors': { desc: 'Get anchor/alias metadata from a parsed YAML object', args: {
      key: 'Property name (optional, returns all if omitted)',
    }, returns: 'AnchorMap | AnchorEntry | undefined' },
  },

  gerrit: {
    'exec': { desc: 'Run a raw gerrit SSH command', args: { cmd: 'Gerrit command string' }, returns: 'string' },
    'getVersion': { desc: 'Get Gerrit server version', returns: 'string' },
    'close': { desc: 'Close the SSH connection', returns: 'void' },
    'changes.query': { desc: 'Search changes', args: {
      q: 'Query string (Gerrit search syntax)',
      options: '{ currentPatchSet, patchSets, files, comments, commitMessage, allApprovals, allReviewers, limit, start }',
    }, returns: 'object[]' },
    'changes.get': { desc: 'Get a single change by ID', args: {
      changeId: 'Change number or Change-Id',
      options: 'Query options (same as query)',
    }, returns: 'object | null' },
    'changes.review': { desc: 'Set labels and add review comment', args: {
      change: 'Change number',
      patchSet: 'Patch set number',
      options: '{ labels: { Name: score }, message, notify, submit, tag }',
    }, returns: 'void' },
    'changes.approve': { desc: 'Approve with Code-Review +2', args: {
      change: 'Change number',
      patchSet: 'Patch set number',
      options: '{ message, submit }',
    }, returns: 'void' },
    'changes.reject': { desc: 'Reject with Code-Review -2', args: {
      change: 'Change number',
      patchSet: 'Patch set number',
      options: '{ message }',
    }, returns: 'void' },
    'changes.verify': { desc: 'Set Verified label', args: {
      change: 'Change number',
      patchSet: 'Patch set number',
      score: '+1 or -1 (default: +1)',
    }, returns: 'void' },
    'changes.submit': { desc: 'Submit (merge) a change', args: {
      change: 'Change number',
      patchSet: 'Patch set number',
    }, returns: 'void' },
    'changes.abandon': { desc: 'Abandon a change', args: {
      change: 'Change number',
      patchSet: 'Patch set number',
      message: 'Reason (optional)',
    }, returns: 'void' },
    'changes.restore': { desc: 'Restore an abandoned change', args: {
      change: 'Change number',
      patchSet: 'Patch set number',
      message: 'Comment (optional)',
    }, returns: 'void' },
    'changes.rebase': { desc: 'Rebase a change', args: {
      change: 'Change number',
      patchSet: 'Patch set number',
    }, returns: 'void' },
    'changes.addReviewers': { desc: 'Add reviewers to a change', args: {
      change: 'Change number',
      reviewers: 'Email(s) or username(s)',
    }, returns: 'void' },
    'changes.removeReviewers': { desc: 'Remove reviewers from a change', args: {
      change: 'Change number',
      reviewers: 'Email(s) or username(s)',
    }, returns: 'void' },
    'changes.setTopic': { desc: 'Set topic on a change', args: {
      change: 'Change number',
      topic: 'Topic string',
    }, returns: 'void' },
    'projects.list': { desc: 'List projects', args: {
      options: '{ match, prefix, type, state, description, limit, start }',
    }, returns: 'object' },
    'projects.create': { desc: 'Create a project', args: {
      name: 'Project name',
      options: '{ branch, parent, description, submitType, emptyCommit, owner, permissionsOnly }',
    }, returns: 'void' },
    'projects.createBranch': { desc: 'Create a branch in a project', args: {
      project: 'Project name',
      branch: 'Branch name',
      revision: 'Base revision or branch',
    }, returns: 'void' },
    'groups.list': { desc: 'List groups', args: {
      options: '{ project, user, owned, verbose }',
    }, returns: 'string[] | object[]' },
    'groups.getMembers': { desc: 'Get group members', args: {
      group: 'Group name',
      options: '{ recursive }',
    }, returns: '{ id, username, full_name, email }[]' },
    'groups.create': { desc: 'Create a group', args: {
      name: 'Group name',
      options: '{ owner, description, members, visibleToAll }',
    }, returns: 'void' },
    'groups.addMembers': { desc: 'Add members to a group', args: {
      group: 'Group name',
      members: 'Username(s) to add',
    }, returns: 'void' },
    'groups.removeMembers': { desc: 'Remove members from a group', args: {
      group: 'Group name',
      members: 'Username(s) to remove',
    }, returns: 'void' },
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
