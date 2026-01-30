'use strict';

const { Client } = require('ssh2');
const { Config, Logger, JsafError, AuthError, CommandError, ConfigError } = require('@jsaf/core');
const fs = require('fs');
const path = require('path');
const os = require('os');

class SSH {
  constructor(options = {}) {
    const cfg = new Config();
    this.host = options.host || cfg.get('ssh.host');
    this.port = options.port || cfg.get('ssh.port', 22);
    this.user = options.user || cfg.get('ssh.user', process.env.USER);
    this.password = options.password || cfg.get('ssh.password');
    this.privateKey = options.privateKey || cfg.get('ssh.privateKey');
    this.passphrase = options.passphrase || cfg.get('ssh.passphrase');
    this.logger = options.logger || new Logger(options.logLevel || cfg.get('ssh.logLevel', 'info'));

    this._conn = null;
    this._sftp = null;
  }

  async connect() {
    if (this._conn) return this._conn;
    if (!this.host) {
      throw new ConfigError('host', 'No SSH host configured. Set "host" in your config or pass it to the constructor.');
    }
    if (!this.privateKey && !this.password) {
      throw new ConfigError('privateKey/password', 'No SSH authentication configured. Set "privateKey" or "password" in your config.');
    }
    return new Promise((resolve, reject) => {
      const conn = new Client();
      const connOpts = {
        host: this.host,
        port: this.port,
        username: this.user,
      };

      if (this.privateKey) {
        const keyPath = this.privateKey.startsWith('~')
          ? path.join(os.homedir(), this.privateKey.slice(1))
          : this.privateKey;
        try {
          connOpts.privateKey = fs.readFileSync(keyPath);
        } catch (err) {
          reject(new JsafError(`Failed to read SSH key: ${keyPath}: ${err.message}`));
          return;
        }
        if (this.passphrase) connOpts.passphrase = this.passphrase;
      } else if (this.password) {
        connOpts.password = this.password;
      }

      conn.on('ready', () => {
        this.logger.debug(`SSH connected to ${this.host}:${this.port}`);
        this._conn = conn;
        resolve(conn);
      });
      conn.on('error', (err) => {
        if (err.level === 'client-authentication') {
          reject(new AuthError(`${this.user}@${this.host}`));
        } else {
          reject(new JsafError(`SSH connection failed: ${err.message}`, { host: this.host }));
        }
      });
      conn.connect(connOpts);
    });
  }

  async exec(command, options = {}) {
    const conn = await this.connect();
    this.logger.debug(`SSH exec: ${command}`);
    return new Promise((resolve, reject) => {
      conn.exec(command, (err, stream) => {
        if (err) {
          reject(new JsafError(`SSH exec failed: ${err.message}`));
          return;
        }
        let stdout = '';
        let stderr = '';
        stream.on('data', (d) => { stdout += d; });
        stream.stderr.on('data', (d) => { stderr += d; });
        stream.on('close', (code) => {
          if (code !== 0 && !options.ignoreExitCode) {
            reject(new CommandError(command, code, stderr));
          } else {
            resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: code });
          }
        });
      });
    });
  }

  async upload(localPath, remotePath) {
    const sftp = await this._getSftp();
    this.logger.debug(`SFTP upload: ${localPath} -> ${remotePath}`);
    return new Promise((resolve, reject) => {
      sftp.fastPut(localPath, remotePath, (err) => {
        if (err) reject(new JsafError(`Upload failed: ${err.message}`));
        else resolve({ local: localPath, remote: remotePath });
      });
    });
  }

  async download(remotePath, localPath) {
    const sftp = await this._getSftp();
    this.logger.debug(`SFTP download: ${remotePath} -> ${localPath}`);
    return new Promise((resolve, reject) => {
      sftp.fastGet(remotePath, localPath, (err) => {
        if (err) reject(new JsafError(`Download failed: ${err.message}`));
        else resolve({ remote: remotePath, local: localPath });
      });
    });
  }

  async readFile(remotePath) {
    const sftp = await this._getSftp();
    return new Promise((resolve, reject) => {
      let data = '';
      const rs = sftp.createReadStream(remotePath);
      rs.on('data', (chunk) => { data += chunk; });
      rs.on('end', () => resolve(data));
      rs.on('error', (err) => reject(new JsafError(`Failed to read ${remotePath}: ${err.message}`)));
    });
  }

  async writeFile(remotePath, content) {
    const sftp = await this._getSftp();
    return new Promise((resolve, reject) => {
      const ws = sftp.createWriteStream(remotePath);
      ws.on('error', (err) => reject(new JsafError(`Failed to write ${remotePath}: ${err.message}`)));
      ws.end(content, () => resolve({ remote: remotePath }));
    });
  }

  async listDir(remotePath) {
    const sftp = await this._getSftp();
    return new Promise((resolve, reject) => {
      sftp.readdir(remotePath, (err, list) => {
        if (err) reject(new JsafError(`Failed to list ${remotePath}: ${err.message}`));
        else resolve(list.map((item) => ({
          name: item.filename,
          size: item.attrs.size,
          isDirectory: item.attrs.isDirectory(),
          modified: new Date(item.attrs.mtime * 1000),
        })));
      });
    });
  }

  async mkdir(remotePath, recursive = true) {
    if (recursive) {
      // Use exec to leverage mkdir -p on the remote
      return this.exec(`mkdir -p "${remotePath}"`);
    }
    const sftp = await this._getSftp();
    return new Promise((resolve, reject) => {
      sftp.mkdir(remotePath, (err) => {
        if (err) reject(new JsafError(`Failed to create directory ${remotePath}: ${err.message}`));
        else resolve({ remote: remotePath });
      });
    });
  }

  async close() {
    if (this._conn) {
      this._conn.end();
      this._conn = null;
      this._sftp = null;
      this.logger.debug('SSH connection closed');
    }
  }

  async _getSftp() {
    if (this._sftp) return this._sftp;
    const conn = await this.connect();
    return new Promise((resolve, reject) => {
      conn.sftp((err, sftp) => {
        if (err) reject(new JsafError(`SFTP initialization failed: ${err.message}`));
        else {
          this._sftp = sftp;
          resolve(sftp);
        }
      });
    });
  }
}

module.exports = { SSH };
