'use strict';

const { JsafError } = require('@jsaf/core');

class GroovyExecutor {
  constructor(client) {
    this.client = client;
  }

  async exec(script) {
    const body = new URLSearchParams({ script });
    const result = await this.client.request('POST', '/scriptText', {
      body: body.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (typeof result === 'string' && result.includes('Exception:')) {
      const err = new JsafError(`Groovy script failed:\n${result.slice(0, 500)}`);
      err.output = result;
      throw err;
    }
    return result;
  }

  async execJson(script) {
    const wrapped = `
import groovy.json.JsonOutput
def __result = { ${script} }()
println(JsonOutput.toJson(__result))
    `.trim();
    const raw = await this.exec(wrapped);
    return JSON.parse(raw.trim());
  }

  async listPlugins() {
    return this.execJson(`
      Jenkins.instance.pluginManager.plugins.collect { p ->
        [name: p.shortName, version: p.version, active: p.isActive()]
      }
    `);
  }

  async runningBuilds() {
    return this.execJson(`
      Jenkins.instance.getAllItems(hudson.model.Job).collectMany { job ->
        job.builds.findAll { it.isBuilding() }.collect { b ->
          [job: job.fullName, number: b.number, duration: System.currentTimeMillis() - b.startTimeInMillis]
        }
      }
    `);
  }

  async systemMessage() {
    const raw = await this.exec('println(Jenkins.instance.systemMessage ?: "")');
    return raw.trim();
  }

  async setSystemMessage(message) {
    await this.exec(`
      Jenkins.instance.setSystemMessage("${message.replace(/"/g, '\\"')}")
      Jenkins.instance.save()
      println("OK")
    `);
  }

  async quietDown() {
    await this.exec('Jenkins.instance.doQuietDown()');
  }

  async cancelQuietDown() {
    await this.exec('Jenkins.instance.doCancelQuietDown()');
  }
}

module.exports = { GroovyExecutor };
