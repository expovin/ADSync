var ldap = require('ldapjs');
var log = require('./lib/logHandler');
var repo = require('./lib/repoHandler');
var secret = require('./secret');
var cfg = require("./config");

log.info(" --- STARTING AD Sync PROCESS ---");

const db = new repo(secret.Repository);
var adClient;
 

function ldapConnection(){

    return new Promise ( (fulfill, reject) => {

        log.debug("Ldap Server 				: ",secret.Ldap.Server);
        log.debug("Port      				: ",secret.Ldap.Port);
        log.debug("Base DN 				: ",secret.Ldap.baseDN);
        log.debug("Username 				: ",secret.Ldap.username);
        log.debug("Password 				: ***");
        log.debug("Filter 					: ",secret.Ldap.presalesFilter);
        
        var ldapCompleteServerName=secret.Ldap.Server+":"+secret.Ldap.Port+"/"+secret.Ldap.baseDN;
    
        log.info("Complete Server Name 			: ",ldapCompleteServerName);
        adClient = ldap.createClient({ url: ldapCompleteServerName, reconnect: true });

        adClient.bind(secret.Ldap.username, secret.Ldap.password, function(err) {
            if (err != null) {
                log.error("Error : "+err);
                if (err.name === "InvalidCredentialsError")
                    reject({'Error':'Credential Error'});
                else
                    reject({'Error':'Unknow'});
            } else {
                var opts = {
                    filter: null,
                    scope : 'one'
                } ;

                fulfill({baseDN : secret.Ldap.baseDN, opts : opts});
            }
        })
    })
}

function getUsers(param){
    return new Promise ( (fulfill, reject) => {

        var allFilteredUsers=[];
        log.warn("baseDN: ",param.baseDN, "opts : ",param.opts);

        adClient.search(param.baseDN, param.opts, function(err, res) {

            res.on('searchEntry', function(entry) {
                //log.debug('hit');
                //log.debug('entry: ' + JSON.stringify(entry.object));

                //allFilteredUsers.push(entry.object);
                if(entry.object.objectClass){
                    
                    if(entry.object.objectClass.indexOf("organizationalUnit") !== -1){
                        log.info("dn : ",entry.object.dn," ou : ",entry.object.ou);
                        if( secret.excludedOu.indexOf(entry.object.ou) === -1){
                            log.error(" Looking for organizational unit : ",entry.object.dn," ou : ",entry.object.ou);                       
                            getUsers({baseDN:entry.object.dn, opts:param.opts});
                        }
                            
                        else
                            log.warn("organizationalUnit to exclude from further search --> ",entry.object.dn);
                    }

                    if(entry.object.objectClass.indexOf("person") !== -1){
                        allFilteredUsers.push(entry.object);
                    }
                }

                    
                
            });

            res.on('searchReference', function(referral) {
                log.debug('referral: ' + referral.uris.join());
            });

            res.on('error', function(err) {
                log.warn('searchFailed') ;
                log.err('error: ' + err.message);
                reject("Error getting data from the LDAP Server")
            });
            
            res.on('end', function(result) {
                //log.info(" --- SESSION END ---");
                db.insertUsersFromLDAP(allFilteredUsers);
                fulfill("END SESSION");
            })
            
        })

    })
}


ldapConnection()
.then(getUsers)
.then( (msg) =>{
    log.info(" ---------- "+msg+" ------------ ");
})
.catch( error => {
    log.error("Error : ",error);
})
