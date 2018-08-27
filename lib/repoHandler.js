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



    insertUsersFromLDAP(users){

        var rows='';
        var numRows=0;
        var sql='';
        log.debug(" ------------------------------ USERS TO INSERT --------------------------------------------");
        log.info("Number of users : ",users.length);
        var sql = "replace into Neo.ldapUsers (trigram, name, CountryISO2,City,title,dn,CountryName, department, departmentNumber, division, manager) values";
        users.forEach( user =>{
            if(secret.departmentNumber.indexOf(user.departmentNumber)>=0){
                numRows++;
                rows += '("'+user.mailNickname+'","'+user.cn+'","'+user.c+'","'+user.l+'","'+user.title+'", \
                "'+user.dn+'","'+user.co+'","'+user.department+'","'+user.departmentNumber+'","'+user.division+'","'+user.manager+'"),';
            }
            
        })
        sql += rows;
        sql = sql.substring(0, sql.length - 1);
        var _this = this;
        if(numRows > 0){
            log.trace("Query :",sql);
            _this.con.query( sql, (err, result)=>{
                if(err) {
                    log.error("Error while adding new User rank : ",err);
                }
        
                log.info("Users have been added");
                        //fulfill({Code: 200, Message : 'User has been added'});
            })
        }
                
    }


}

module.exports = Repo;