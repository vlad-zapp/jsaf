# JSAF

JavaScript Automation Framework for DevOps. Interactive REPL and script runner for Jenkins, Kubernetes, Docker, SSH, Git, and Gerrit.

## Quick Start

Download the latest binary from [Releases](https://github.com/vlad-zapp/jsaf/releases), extract, and run:

```bash
# Linux / macOS
tar xzf jsaf-linux-x64.tar.gz
chmod +x jsaf
./jsaf
```

```powershell
# Windows
Expand-Archive jsaf-win-x64.zip
.\jsaf.exe
```

Generate a starter config:

```bash
jsaf init
```

This creates `jsaf.config.js` where you configure your infrastructure:

```js
module.exports = {
  jenkins: {
    url: 'https://jenkins.example.com',
    user: 'admin',
    token: process.env.JENKINS_TOKEN,
  },
  k8s: {
    context: 'production',
    namespace: 'default',
  },
  ssh: {
    web: { host: '10.0.1.10', user: 'deploy', privateKeyPath: '~/.ssh/id_rsa' },
    db:  { host: '10.0.1.20', user: 'deploy', privateKeyPath: '~/.ssh/id_rsa' },
  },
  docker: {
    socketPath: '/var/run/docker.sock',
  },
  git: {
    cwd: '/opt/repos/myapp',
  },
  gerrit: {
    host: 'gerrit.example.com',
    port: 29418,
    user: 'ci',
    privateKey: '~/.ssh/id_rsa',
  },
};
```

## Usage

### REPL

```bash
jsaf              # launch interactive REPL
jsaf --config /path/to/jsaf.config.js
```

The REPL provides TAB completion, method signatures, and built-in documentation:

```
jsaf> await jenkins.jobs.list()
jsaf> await docker.containers.list(true)
jsaf> await ssh.web.exec('uptime')
jsaf> .info jenkins.jobs       # show all job methods
jsaf> .info docker.containers  # show all container methods
```

Press **F1** to open API docs in your browser.

### Scripts

```bash
jsaf run deploy.js
```

Scripts have all modules pre-imported and support top-level `await`:

```js
// deploy.js
const jobs = await jenkins.jobs.list();
const running = jobs.filter(j => j.color === 'blue_anime');
console.log('Running builds:', running.map(j => j.name));

const { job, number, url } = await jenkins.jobs.build('my-app', { BRANCH: 'main' });
console.log('Build started:', url);
const build = await jenkins.builds.waitFor(job, number);
console.log('Result:', build.result);

await ssh.web.exec('systemctl restart myapp');
```

### REPL Commands

| Command | Description |
|---------|-------------|
| `.info <path>` | Show method signatures and docs |
| `.dump <file.js>` | Save session commands to a script file |
| `.undo` | Remove last command from dump buffer |
| `.buffer` | Show recorded commands |
| `.reload` | Reload config and modules |

Prefix a line with a space to exclude it from `.dump` output.

## Modules

### Jenkins

```js
// Jobs
await jenkins.jobs.list()
await jenkins.jobs.list('folder/subfolder')
await jenkins.jobs.build('my-job', { BRANCH: 'main', DEPLOY: 'true' })  // { job, number, url }
await jenkins.jobs.buildAndWait('my-job', { BRANCH: 'main' })           // completed build object
await jenkins.jobs.getConfig('my-job')        // XML config
await jenkins.jobs.setConfig('my-job', xml)   // update XML config
await jenkins.jobs.getPipeline('my-job')      // Groovy script
await jenkins.jobs.setPipeline('my-job', script) // update Groovy script
await jenkins.jobs.create('new-job', xmlStr)
await jenkins.jobs.delete('old-job')
await jenkins.jobs.enable('my-job')
await jenkins.jobs.disable('my-job')
await jenkins.jobs.exists('my-job')           // returns boolean
await jenkins.jobs.copy('template-job', 'new-job')

// Builds
await jenkins.builds.get('my-job', 42)
await jenkins.builds.getLatest('my-job')
await jenkins.builds.getLog('my-job', 42)     // console output
await jenkins.builds.stop('my-job', 42)
await jenkins.builds.waitFor('my-job', 42, { timeout: 300000 })

// Nodes
await jenkins.nodes.list()
await jenkins.nodes.get('agent-01')
await jenkins.nodes.setOffline('agent-01', 'maintenance')
await jenkins.nodes.setOnline('agent-01')

// Credentials
await jenkins.credentials.list()
await jenkins.credentials.get('my-cred-id')
await jenkins.credentials.create(xmlConfig)
await jenkins.credentials.delete('my-cred-id')

// Groovy
await jenkins.groovy.exec('println Jenkins.instance.numExecutors')
await jenkins.groovy.execJson('Jenkins.instance.pluginManager.plugins.size()')
await jenkins.groovy.listPlugins()
await jenkins.groovy.getRunningBuilds()
await jenkins.groovy.getSystemMessage()
await jenkins.groovy.quietDown()
await jenkins.groovy.cancelQuietDown()
```

### Kubernetes

```js
// Raw kubectl
await k8s.kubectl(['get', 'pods', '-l', 'app=web'])
await k8s.kubectlJson(['get', 'deployments'])
await k8s.apply('manifest.yaml')
await k8s.apply(yamlString)
await k8s.delete('pod', 'my-pod')
await k8s.get('service', 'my-svc')
await k8s.describe('pod', 'my-pod')

// Pods
await k8s.pods.list()
await k8s.pods.get('my-pod')
await k8s.pods.getLogs('my-pod', { tail: 100, container: 'app' })
await k8s.pods.exec('my-pod', 'ls -la /app')
await k8s.pods.delete('my-pod')
await k8s.pods.wait('my-pod', 'Ready', 120)

// Deployments
await k8s.deployments.list()
await k8s.deployments.get('my-app')
await k8s.deployments.scale('my-app', 3)
await k8s.deployments.restart('my-app')
await k8s.deployments.getStatus('my-app')
await k8s.deployments.setImage('my-app', 'app', 'myapp:v2')
await k8s.deployments.getHistory('my-app')
await k8s.deployments.undo('my-app')

// Services, Namespaces, ConfigMaps, Secrets
await k8s.services.list()
await k8s.namespaces.create('staging')
await k8s.configmaps.create('my-config', { KEY: 'value' })
await k8s.secrets.create('my-secret', { PASSWORD: 's3cret' })
```

### Docker

```js
// System
await docker.ping()
await docker.getInfo()
await docker.getVersion()

// Containers
await docker.containers.list()
await docker.containers.list(true)             // include stopped
await docker.containers.get('my-container')
await docker.containers.run('alpine', 'echo hello')
await docker.containers.create('my-app', { Image: 'nginx' })
await docker.containers.start('abc123')
await docker.containers.stop('abc123')
await docker.containers.restart('abc123')
await docker.containers.remove('abc123', { force: true })
await docker.containers.getLogs('abc123', { tail: 50 })
await docker.containers.exec('abc123', 'ps aux')
await docker.containers.getStats('abc123')
await docker.containers.getTop('abc123')
await docker.containers.rename('abc123', 'new-name')
await docker.containers.pause('abc123')
await docker.containers.unpause('abc123')

// Images
await docker.images.list()
await docker.images.pull('nginx', '1.25')
await docker.images.tag('nginx:1.25', 'myregistry/nginx', 'latest')
await docker.images.push('myregistry/nginx')
await docker.images.remove('old-image')
await docker.images.getHistory('nginx')
await docker.images.search('redis')
await docker.images.prune()

// Volumes & Networks
await docker.volumes.list()
await docker.volumes.create('my-vol')
await docker.volumes.remove('my-vol')
await docker.networks.list()
await docker.networks.create('my-net')
await docker.networks.connect('my-net', 'my-container')
await docker.networks.disconnect('my-net', 'my-container')
```

### SSH

```js
// Multiple hosts via config
await ssh.web.exec('uptime')
await ssh.db.exec('pg_dump mydb > /tmp/backup.sql')

// File operations
await ssh.web.upload('./local-file.txt', '/remote/path/file.txt')
await ssh.web.download('/remote/log.txt', './local-log.txt')
await ssh.web.readFile('/etc/hostname')
await ssh.web.writeFile('/tmp/data.txt', 'file contents')
await ssh.web.listDir('/var/log')
await ssh.web.mkdir('/opt/myapp/data')

// Connection is automatic on first command, but can be explicit
await ssh.web.connect()
await ssh.web.close()
```

### Git

```js
await git.clone('https://github.com/user/repo.git', './repo')
await git.getStatus()                          // [{ status, file }]
await git.add('.')
await git.commit('fix: resolve login bug')
await git.push()
await git.pull()
await git.fetch('origin', { prune: true })

await git.branch()                             // list branches
await git.branch('feature/new')                // create + checkout
await git.checkout('main')
await git.merge('feature/new', { noFf: true })

await git.tag('v1.0.0', { message: 'Release 1.0' })
await git.getTags()
await git.getLog(5)                            // [{ hash, author, subject, date }]
await git.getDiff({ staged: true })
await git.stash()
await git.stash({ pop: true })
await git.getCurrentBranch()
await git.getRemoteUrl()
await git.getRemotes()
await git.getRev('HEAD')
```

### Gerrit

Gerrit module communicates via SSH (port 29418), not REST API.

```js
// Config
// gerrit: { host: 'gerrit.example.com', port: 29418, user: 'ci', privateKey: '~/.ssh/id_rsa' }

// Query changes
await gerrit.changes.query('status:open project:myproject')
await gerrit.changes.query('owner:self is:open', { currentPatchSet: true, files: true })
await gerrit.changes.get(12345)                              // single change detail

// Review & approve
await gerrit.changes.review(12345, 3, {
  labels: { 'Code-Review': 2, 'Verified': 1 },
  message: 'LGTM',
})
await gerrit.changes.approve(12345, 3)                       // Code-Review +2
await gerrit.changes.approve(12345, 3, { submit: true })     // +2 and merge
await gerrit.changes.reject(12345, 3, { message: 'Needs work' })
await gerrit.changes.verify(12345, 3, 1)                     // Verified +1
await gerrit.changes.verify(12345, 3, -1)                    // Verified -1

// Merge, abandon, restore, rebase
await gerrit.changes.submit(12345, 3)
await gerrit.changes.abandon(12345, 3, 'Superseded by 12346')
await gerrit.changes.restore(12345, 3)
await gerrit.changes.rebase(12345, 3)

// Reviewers
await gerrit.changes.addReviewers(12345, 'alice@example.com', 'bob@example.com')
await gerrit.changes.removeReviewers(12345, 'alice@example.com')
await gerrit.changes.setTopic(12345, 'feature-auth')

// Projects
await gerrit.projects.list()
await gerrit.projects.list({ match: 'myteam', state: 'ACTIVE' })
await gerrit.projects.create('new-project', {
  branch: 'main', emptyCommit: true, description: 'My project',
})
await gerrit.projects.createBranch('myproject', 'release-1.0', 'main')

// Groups
await gerrit.groups.list()
await gerrit.groups.list({ user: 'alice', verbose: true })
await gerrit.groups.getMembers('Developers')
await gerrit.groups.create('My Team', {
  description: 'Dev team', members: ['alice', 'bob'],
})
await gerrit.groups.addMembers('My Team', 'charlie')
await gerrit.groups.removeMembers('My Team', 'charlie')

// Server info
await gerrit.getVersion()

// Raw command
await gerrit.exec('ls-projects --format json')
```

## Configuration

### Config File

JSAF uses JavaScript config files (`jsaf.config.js`), giving you full programmatic control:

```js
const shared = { user: 'deploy', privateKeyPath: '~/.ssh/id_rsa' };

module.exports = {
  jenkins: {
    url: process.env.JENKINS_URL || 'https://jenkins.local',
    user: 'admin',
    token: process.env.JENKINS_TOKEN,
    rejectUnauthorized: false,   // self-signed certs
  },
  ssh: {
    web:     { ...shared, host: '10.0.1.10' },
    db:      { ...shared, host: '10.0.1.20' },
    bastion: { ...shared, host: '10.0.1.1', port: 2222 },
  },
};
```

### Environment Variables

Any config value can be overridden with `JSAF_` prefixed env vars:

```bash
JSAF_JENKINS_URL=https://jenkins.prod.com jsaf
JSAF_JENKINS_TOKEN=abc123 jsaf run deploy.js
```

### Single vs Multiple Instances

Each module can be configured as either a **single instance** or **multiple named instances**. JSAF detects which mode you want automatically based on the shape of your config object.

**Single instance** — config keys are direct settings (strings, numbers, booleans):

```js
module.exports = {
  jenkins: {
    url: 'https://jenkins.example.com',
    user: 'admin',
    token: process.env.JENKINS_TOKEN,
  },
};
```

```
jsaf> await jenkins.jobs.list()
jsaf> await jenkins.builds.get('my-job', 42)
```

**Multiple instances** — every config key is a named object, each representing a separate instance:

```js
module.exports = {
  jenkins: {
    staging: { url: 'https://jenkins-staging.com', user: 'admin', token: '...' },
    prod:    { url: 'https://jenkins-prod.com', user: 'admin', token: '...' },
  },
};
```

```
jsaf> await jenkins.staging.jobs.list()
jsaf> await jenkins.prod.builds.get('deploy', 5)
```

The detection rule is simple: if any value in the module config is a primitive (string, number, boolean, null, or array), it's treated as a single instance. If every value is a plain object, each one becomes a named instance. This applies to all modules — Jenkins, K8s, Docker, SSH, Git, and Gerrit.

You can mix modes across modules. For example, a single Jenkins but multiple SSH hosts:

```js
module.exports = {
  jenkins: {
    url: 'https://jenkins.example.com',
    user: 'admin',
    token: process.env.JENKINS_TOKEN,
  },
  ssh: {
    web: { host: '10.0.1.10', user: 'deploy', privateKeyPath: '~/.ssh/id_rsa' },
    db:  { host: '10.0.1.20', user: 'deploy', privateKeyPath: '~/.ssh/id_rsa' },
  },
};
```

```
jsaf> await jenkins.jobs.list()          // single instance — direct access
jsaf> await ssh.web.exec('uptime')       // multi instance — access by name
jsaf> await ssh.db.exec('pg_isready')
```

## CLI Reference

```
jsaf                          Launch REPL
jsaf run <script.js>          Run a script
jsaf init                     Generate jsaf.config.js
jsaf help [module]            Show help
jsaf version                  Show version

Options:
  --config <path>             Config file path
  --log-level <level>         debug | info | warn | error
```

## Building from Source

```bash
git clone https://github.com/vlad-zapp/jsaf.git
cd jsaf
npm install
npm run build
```

Binaries are output to `dist/`:
- `jsaf-linux-x64`
- `jsaf-macos-x64`
- `jsaf-macos-arm64`
- `jsaf-win-x64.exe`

## License

ISC
