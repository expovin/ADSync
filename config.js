module.exports = {

    /** BOT Version */
    ver : "1.0.0",
    /** User Agent */
    UserAgent : "Super Agent/0.0.1",
    /** This is the default language used in the public channel
     * In next versions will be possible to customize languages for the DM
     * for each users
     */
    lang : "default",
  

    /** Log section for the standard log the parameters are:
     *  OutputFileGeneral : The complete path the the log file. 
     *  DefaultLevel : The default log level. Level supported are (Trace, Debug, Info, Warn, Error, Fatal)
     *  maxLogSize : The maximum size in byte for the log file before the file rotation
     *  backups : The maximun number of log files to keep after the rotation
     *  compress : When true the backupped log file will be compressed
     *  appender : The log file appender, will assume the following values:
     *      default --> The log will be write only on the file
     *      out     --> The log will be write only on the standard output (console)
     *      both    --> The log will be write on both, file and console
    */  
    Log : {
        OutputFileGeneral : "./logs/general.log",
        DefaultLevel : "info",
        maxLogSize : 10485760,
        backups : 12,
        compress : true,
        appender:"both"                                     

    }
}
