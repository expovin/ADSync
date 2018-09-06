var ldap = require('ldapjs');
var log = require('./lib/logHandler');
var repo = require('./lib/repoHandler');
var secret = require('./secret');
var cfg = require("./config");
var parallel = require("async/parallel");

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

function getUsers(param, callback){

    var allFilteredUsers=[];
    log.debug("baseDN: ",param.baseDN, "opts : ",param.opts);

    //return new Promise ( (fulfill, reject) =>{
        adClient.search(param.baseDN, param.opts, function(err, res) {

            res.on('searchEntry', function(entry) {
    
                if(entry.object.objectClass){
                    
                    if(entry.object.objectClass.indexOf("organizationalUnit") !== -1){
                        log.info("dn : ",entry.object.dn," ou : ",entry.object.ou);
                        if( secret.excludedOu.indexOf(entry.object.ou) === -1){
                            log.debug(" Looking for organizational unit : ",entry.object.dn," ou : ",entry.object.ou);                       
                            getUsers({baseDN:entry.object.dn, opts:param.opts}, callback);
                            /*
                            .then( (numUsers) =>{
                                log.info("IN ----->",numUsers);
                                return(numUsers);
                            })
                            */
                        }
                            
                        else
                            log.debug("organizationalUnit to exclude from further search --> ",entry.object.dn);
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
                callback("Error getting data from the LDAP Server");
                //reject("Error getting data from the LDAP Server")
            });
            
            res.on('end', function(result) {
                //log.info(" --- SESSION END ---");

                db.insertUsersFromLDAP(allFilteredUsers)
                .then( result =>{      
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("----------- Num User inserted",result.numRows," ----------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");          
                    callback(null,result.numRows);
                    //fulfill(result.numRows);
                })
                .catch( err =>{
                    log.warn("Warning insert User : ",err);
                })
                
            })
            
        })
    //})
}


ldapConnection()
.then( (param) => {
    parallel(
        { 
            one : 
                    getUsers(param, function(err, result) {
                        if(err){
                            log.error("Error getting Users");
                            return 0;
                        }
                        log.info("TERMINATO CICLO getUser");
                        return(result);
                    })
                
            },

            function(err,results) {
                if(err){
                    log.err('error: ' + err);
                }
                else{
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("----------- LDAP Traverse ended -------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                    log.info("---------------------------------------------------");
                }
                    
            }
    )
})
.catch( error => {
    log.error("Error : ",error);
})
