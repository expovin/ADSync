var ldap = require('ldapjs');
var log = require('./lib/logHandler');
var repo = require('./lib/repoHandler');
var secret = require('./secret');


log.info(" --- STARTING AD Sync PROCESS ---");

const db = new repo(secret.Repository);
