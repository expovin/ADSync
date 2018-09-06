'use strict'
var mysql = require('mysql');
var log = require('./logHandler');
var secret = require('../secret');

class Repo {
    constructor (connection) {
        this.con = mysql.createConnection({
            host: connection.host,
            user: connection.user,
            password: connection.password
        });

        this.con.connect(function(err) {
            if (err){
                log.error("Error connecting to database ",host," with user ",user);
                throw err;
            } 

            log.info("Connected to the Database");
        });
    }


    lookUpCountry(countryIn) {
        var _this = this;
        return new Promise ((fulfill, reject ) => {
            log.debug("Change country denomination");
            var sql="Select countryOut from Neo.ldapCountryLookup where countryIn='"+countryIn+"'";
                log.debug(sql);
                _this.con.query( sql, (err, result)=>{
                    if(err) {
                        log.error("Error while getting country transcode : ",err);
                        reject({Code: 500, Message : 'Error while getting country transcode : ',err});
                    }
                    else {
                        if(result[0]){
                            log.debug("Countery ",countryIn," need to be change with ",result[0].countryOut);
                            fulfill(result[0].countryOut);                  
                        }
                        else {
                            log.debug("Country ",countryIn," need no to be change");
                            fulfill(countryIn); 
                        }
                    }
                })                
            //fulfill(newUsers);
        })
    }

    insertUsersFromLDAP_StatementPreparation(users){
        var _this = this;
        var promises=[];
        var numRows=0;
        var rows='';
        var sql='';
        return new Promise ((fulfill, reject ) => {
            var rows='';
            var sql='';
            log.debug(" ------------------------------ USERS TO INSERT --------------------------------------------");
            log.info("Number of users : ",users.length);
            var sql = "replace into Neo.ldapUsers (trigram, name, CountryISO2,City,title,dn,CountryName, department, departmentNumber, division, manager) values";
            users.forEach( user =>{                
                if(secret.departmentNumber.indexOf(user.departmentNumber)>=0){
                    numRows++;
                    promises.push(
                        _this.lookUpCountry(user.co)
                        .then( CountryOut =>{
                            rows += '("'+user.mailNickname+'","'+user.cn+'","'+user.c+'","'+user.l+'","'+user.title+'", \
                            "'+user.dn+'","'+CountryOut+'","'+user.department+'","'+user.departmentNumber+'","'+user.division+'","'+user.manager+'"),';
                        })                        
                    );
                }
            });
            Promise.all(promises)
            .then( () =>{
                sql += rows;
                sql = sql.substring(0, sql.length - 1);
                log.info("SQL : ",sql);
                fulfill(sql);
            })
            .catch( error =>{
                log.err("Error while preparing insert statement : ",error);
            })             
        });        
    }

    insertUsersFromLDAP(users){

        var _this = this;
        var numRows=1;
        return new Promise ((fulfill, reject ) => {
            
            _this.insertUsersFromLDAP_StatementPreparation(users)
            .then( sql => {
                var last = sql.substring(sql.length - 5);
                if(last !== "value"){
                    log.trace("Query :",sql);
                    _this.con.query( sql, (err, result)=>{
                        if(err) {
                            log.error("Error while adding new User rank : ",err);
                            reject({Code: 500, Message : 'Error adding users : ',err});
                        }
                        else {
                            log.info("Users have been added");
                            fulfill({Code: 200, Message : 'User has been added', numRows:numRows});
                        }
                    })
                }
            })

        });
                
    }


}

module.exports = Repo;