const { snapshot } = require("process-list");
var terminate = require('terminate');


function mySelf( value ){
    
    if ((value.path === '/usr/bin/node') && (value.cmdline === 'node app.js') && (value.cpu < 0.99)){
        //console.log("Found right process!");
        return value;
    }
        
}

snapshot('pid', 'ppid', 'name', 'path', 'threads', 'owner','cmdline','priority', 'starttime', 'cpu','utime', 'stime', 'vmem')
.then(tasks =>{
    var process = tasks.filter(mySelf);
    if( process.length ){
        console.log(process.length, " - ", process);
/*
        terminate(process[0].pid, function (err) {
            if (err) { // you will get an error if you did not supply a valid process.pid
              console.log("Oopsy: " + err); // handle errors in your preferred way.
            }
            else {
              console.log('Process ',process[0].pid,' has terminated!'); // terminating the Processes succeeded.
            }
          });
*/
    }
        
    else
        console.log("No process found");
} )