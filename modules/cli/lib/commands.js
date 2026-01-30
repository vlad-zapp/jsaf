'use strict';

const fs = require('fs');
const path = require('path');

function init() {
  const configPath = path.join(process.cwd(), 'jsaf.config.js');
  if (fs.existsSync(configPath)) {
    console.log(`Config file already exists: ${configPath}`);
    return;
  }

  const template = `// JSAF Configuration
// This file is loaded via require() — full JS power available.
// Define shared variables, use process.env, conditionals, etc.

const user = process.env.USER || 'admin';
// const key = '~/.ssh/id_ed25519';

module.exports = {
  // Single instance — config has direct values (url, host, etc.)
  // Available as: jenkins.jobs.list(), jenkins.builds.getLatest('job')
  jenkins: {
    url: 'https://jenkins.example.com',
    user,
    // token: process.env.JENKINS_TOKEN,
    // rejectUnauthorized: false,
  },

  // Multiple instances — each value is a config object
  // Available as: ssh.web.exec('uptime'), ssh.db.exec('pg_dump mydb')
  // ssh: {
  //   web: { host: '10.0.1.50', user, privateKey: key },
  //   db: { host: '10.0.1.100', user: 'dbadmin', privateKey: key },
  // },

  k8s: {
    // context: 'production',
    namespace: 'default',
  },

  ssh: {
    // host: '10.0.1.50',
    // user,
    // privateKey: '~/.ssh/id_ed25519',
  },

  docker: {
    socketPath: '/var/run/docker.sock',
    apiVersion: 'v1.47',
  },

  git: {
    // cwd: '/opt/repos/myapp',
  },

  logLevel: 'info',
};
`;

  fs.writeFileSync(configPath, template);
  console.log(`Created: ${configPath}`);
  console.log('Edit this file to configure your JSAF environment.');
}

function help(module) {
  const general = `
JSAF - JavaScript Automation Framework

Usage:
  jsaf                              Launch interactive REPL
  jsaf repl [options]               Launch interactive REPL
  jsaf run <script.js> [options]    Run an automation script
  jsaf init                         Generate starter config (jsaf.config.js)
  jsaf version                      Show version
  jsaf help [module]                Show help

Options:
  --config <path>      Path to jsaf.config.js
  --log-level <level>  Log level: debug, info, warn, error

Modules:
  jenkins   Jenkins CI/CD automation
  k8s       Kubernetes cluster management
  ssh       Remote command execution and file transfer
  docker    Docker container and image management
  git       Git repository operations

REPL Commands:
  .dump <file.js>    Save session to a script file
  .undo              Remove last command from dump buffer
  .buffer            Show current dump buffer
  .reload            Reload config and recreate instances
  .help              Show REPL commands

REPL Tips:
  - All modules are auto-imported (no require needed)
  - Prefix a line with space to exclude it from dump
  - Top-level await is supported
  - Tab completion for all module methods

Config (jsaf.config.js):
  Single instance:    jenkins: { url: '...' }        -> jenkins.jobs.list()
  Multiple instances: ssh: { web: {...}, db: {...} }  -> ssh.web.exec('cmd')
  Raw config access:  config.get('jenkins.url')

Examples:
  jsaf                                  Start REPL
  jsaf run deploy.js
  jsaf run build.js --config prod.js
  jsaf init
`;

  const modules = {
    jenkins: `
@jsaf/jenkins - Jenkins Automation

  // Auto-imported in scripts and REPL (no require needed)
  jenkins.jobs.list()                        List all jobs
  jenkins.jobs.build('name', { params })     Trigger build, returns { job, number, url }
  jenkins.jobs.buildAndWait('name', params)  Trigger and wait for completion
  jenkins.jobs.get('name')                   Get job details
  jenkins.jobs.getConfig('name')             Get XML config
  jenkins.jobs.setConfig('name', xml)        Set XML config
  jenkins.jobs.getPipeline('name')           Get pipeline Groovy script
  jenkins.jobs.setPipeline('name', script)   Set pipeline Groovy script
  jenkins.jobs.create('name', xml)           Create job
  jenkins.jobs.delete('name')                Delete job
  jenkins.jobs.enable('name')                Enable job
  jenkins.jobs.disable('name')               Disable job
  jenkins.jobs.exists('name')                Check existence
  jenkins.jobs.copy('src', 'dest')           Copy job

  jenkins.builds.get('job', number)          Get build info
  jenkins.builds.getLatest('job')            Get last build
  jenkins.builds.getLog('job', number)      Console output
  jenkins.builds.stop('job', number)         Stop build
  jenkins.builds.waitFor('job', num, opts)   Poll until done

  jenkins.nodes.list()                       List nodes
  jenkins.nodes.setOffline('name', reason)   Take offline
  jenkins.nodes.setOnline('name')            Bring online

  jenkins.groovy.exec(script)                Run Groovy script
  jenkins.groovy.execJson(script)            Run & parse JSON
  jenkins.groovy.listPlugins()               List plugins
  jenkins.groovy.getRunningBuilds()          Running builds

  jenkins.request(method, path, opts)        Raw HTTP request
  jenkins.ping()                             Test connectivity

  Multiple instances: jenkins.staging.jobs.list()
  Manual: const j = new Jenkins({ url, user, token })
`,
    k8s: `
@jsaf/k8s - Kubernetes Automation

  k8s.pods.list(ns)                          List pods
  k8s.pods.get(name, ns)                     Get pod
  k8s.pods.getLogs(name, opts)               Pod logs
  k8s.pods.exec(name, cmd, opts)             Exec in pod
  k8s.pods.delete(name, ns)                  Delete pod
  k8s.pods.wait(name, condition, timeout)    Wait for condition

  k8s.deployments.list(ns)                   List deployments
  k8s.deployments.get(name, ns)              Get deployment
  k8s.deployments.scale(name, n, ns)         Scale replicas
  k8s.deployments.restart(name, ns)          Rollout restart
  k8s.deployments.getStatus(name, ns)        Rollout status
  k8s.deployments.setImage(name, ctr, img, ns)  Set image
  k8s.deployments.undo(name, ns)             Rollback

  k8s.services.list(ns)                      List services
  k8s.namespaces.list()                      List namespaces
  k8s.configmaps.list(ns)                    List configmaps
  k8s.secrets.list(ns)                       List secrets

  k8s.apply(manifest)                        Apply YAML/file
  k8s.get(resource, name, opts)              Get any resource
  k8s.delete(resource, name, opts)           Delete any resource
  k8s.describe(resource, name, opts)         Describe resource
  k8s.kubectl(args, opts)                    Raw kubectl
`,
    ssh: `
@jsaf/ssh - SSH Automation

  ssh.exec(command)                          Run command
  ssh.upload(local, remote)                  Upload file (SFTP)
  ssh.download(remote, local)                Download file (SFTP)
  ssh.readFile(path)                         Read remote file
  ssh.writeFile(path, content)               Write remote file
  ssh.listDir(path)                          List directory
  ssh.mkdir(path)                            Create directory
  ssh.close()                                Close connection

  Multiple instances: ssh.web.exec('cmd'), ssh.db.exec('cmd')
  Manual: const s = new SSH({ host, user, privateKey })
`,
    docker: `
@jsaf/docker - Docker Automation

  docker.containers.list(all)                List containers
  docker.containers.run(image, cmd, opts)    Run container
  docker.containers.create(name, config)     Create container
  docker.containers.start(id)                Start
  docker.containers.stop(id)                 Stop
  docker.containers.restart(id)              Restart
  docker.containers.remove(id, opts)         Remove
  docker.containers.getLogs(id, opts)        Logs
  docker.containers.exec(id, cmd)            Exec command
  docker.containers.getStats(id)             Stats
  docker.containers.pause(id)                Pause
  docker.containers.unpause(id)              Unpause

  docker.images.list()                       List images
  docker.images.pull(name, tag)              Pull image
  docker.images.tag(src, repo, tag)          Tag image
  docker.images.push(name, opts)             Push image
  docker.images.remove(name)                 Remove image
  docker.images.search(term)                 Search Docker Hub
  docker.images.prune()                      Remove unused

  docker.volumes.list()                      List volumes
  docker.volumes.create(name)                Create volume
  docker.volumes.remove(name)                Remove volume

  docker.networks.list()                     List networks
  docker.networks.create(name)               Create network
  docker.networks.connect(net, container)    Connect container
  docker.networks.disconnect(net, ctr)       Disconnect

  docker.ping()                              Test connectivity
  docker.getInfo()                           System info
  docker.getVersion()                        Docker version
`,
    git: `
@jsaf/git - Git Automation

  git.clone(url, dest, opts)                 Clone repo
  git.add(files)                             Stage files
  git.commit(message, opts)                  Commit
  git.push(remote, branch, opts)             Push
  git.pull(remote, branch, opts)             Pull
  git.fetch(remote, opts)                    Fetch
  git.tag(name, opts)                        Create tag
  git.getTags()                              List tags
  git.branch(name, opts)                     Create/list branches
  git.checkout(ref)                          Checkout
  git.merge(branch, opts)                    Merge
  git.getStatus()                            Status (porcelain)
  git.getLog(count)                          Log
  git.getDiff(opts)                          Diff
  git.getCurrentBranch()                     Current branch
  git.stash(opts)                            Stash
  git.getRemotes()                           List remotes
  git.getRev(ref)                            Get commit hash
  git.clean(opts)                            Clean working dir
`,
  };

  if (module && modules[module]) {
    console.log(modules[module]);
  } else {
    console.log(general);
  }
}

function version() {
  const pkg = require('../../../package.json');
  console.log(pkg.version);
}

module.exports = { init, help, version };
