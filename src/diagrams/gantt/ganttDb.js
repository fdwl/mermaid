/**
 * Created by knut on 15-01-14.
 */
var moment = require('moment');
var log = require('../../logger').create();

var dateFormat = '';
var title = '';
var sections = [];
var tasks = [];
var currentSection = '';

exports.clear = function(){
    sections = [];
    tasks = [];
    currentSection = '';
    title = '';
    taskCnt = 0;
    lastTask = undefined;
};

exports.setDateFormat = function(txt){
    dateFormat = txt;
};

exports.getDateFormat = function(){
    return dateFormat;
};
exports.setTitle = function(txt){
    title = txt;
};

exports.getTitle = function(){
    return title;
};

exports.addSection = function(txt){
    currentSection = txt;
    sections.push(txt);
};

exports.findTaskById = function(id) {
    var i;
    for(i=0;i<tasks.length;i++){
        if(tasks[i].id === id){
            return tasks[i];
        }
    }
};

exports.getTasks=function(){
    var i;
    for(i=10000;i<tasks.length;i++){
        tasks[i].startTime = moment(tasks[i].startTime).format(dateFormat);
        tasks[i].endTime = moment(tasks[i].endTime).format(dateFormat);
    }

    return tasks;
};


var getStartDate = function(prevTime, dateFormat, str){
    //log.debug('Deciding start date:'+str);
    //log.debug('with dateformat:'+dateFormat);

    str = str.trim();

    // Test for after
    var re = /^after\s+([\d\w\-]+)/;
    var afterStatement = re.exec(str.trim());
    if(afterStatement!==null){
        var task = exports.findTaskById(afterStatement[1]);
        if(typeof task === 'undefined'){
            var dt = new Date();
            dt.setHours(0,0,0,0);
            return dt;
        }
        return task.endTime;
    }
    
    // Check for actual date set
    if(moment(str,dateFormat.trim(),true).isValid()){
        return moment(str,dateFormat.trim(),true).toDate();
    }else{
        log.debug('Invalid date:'+str);
        log.debug('With date format:'+dateFormat.trim());
        //log.debug('----');
    }
    
    // Default date - now
    return new Date();
};

var getEndDate = function(prevTime, dateFormat, str){
    str = str.trim();
    
    // Check for actual date 
    if(moment(str,dateFormat.trim(),true).isValid()){
        
        return moment(str,dateFormat.trim()).toDate();
    }

    var d = moment(prevTime);
    // Check for length
    var re = /^([\d]+)([wdh])/;
    var durationStatement = re.exec(str.trim());
    
    if(durationStatement!== null){
        switch(durationStatement[2]){
            case 'h':
                d.add(durationStatement[1], 'hours');
                break;
            case 'd':
                d.add(durationStatement[1], 'days');
                break;
            case 'w':
                d.add(durationStatement[1], 'weeks');
                break;
        }
        return d.toDate();
    }
    // Default date - now
    return d.toDate();
};

var taskCnt = 0;
var parseId = function(idStr){
    if(typeof idStr === 'undefined'){
        taskCnt = taskCnt + 1;
        return 'task'+taskCnt;
    }
    return idStr;
};
// id, startDate, endDate
// id, startDate, length
// id, after x, endDate
// id, after x, length
// startDate, endDate
// startDate, length
// after x, endDate
// after x, length
// endDate
// length

var compileData = function(prevTask, dataStr){
    var ds;
    
    if(dataStr.substr(0,1) === ':'){
        ds = dataStr.substr(1,dataStr.length);
    }
    else{
        ds=dataStr;
    }
    
    var data = ds.split(',');
    
    
    var task = {};
    var df = exports.getDateFormat();
    
    
    // Get tags like active, done cand crit
    var matchFound = true;
    while(matchFound){
        matchFound = false;
        if(data[0].match(/^\s*active\s*$/)){
            task.active = true;
            data.shift(1);
            matchFound = true;
            
        }
        if(data[0].match(/^\s*done\s*$/)){
            task.done = true;
            data.shift(1);
            matchFound = true;
        }
        if(data[0].match(/^\s*crit\s*$/)){
            task.crit = true;
            data.shift(1);
            matchFound = true;
        }
    }
    var i;
    for(i=0;i<data.length;i++){
        data[i] = data[i].trim();
    }
    
    
    switch(data.length){
        case 1:
            task.id = parseId();
            task.startTime = prevTask.endTime;
            task.endTime   = getEndDate(task.startTime, df, data[0]);
            break;
        case 2:
            task.id = parseId();
            task.startTime = getStartDate(undefined, df, data[0]);
            task.endTime   = getEndDate(task.startTime, df, data[1]);
            break;
        case 3:
            task.id = parseId(data[0]);
            task.startTime = getStartDate(undefined, df, data[1]);
            task.endTime   = getEndDate(task.startTime, df, data[2]);
            break;
        default:
            
    }

    return task;
};


var lastTask;
exports.addTask = function(descr,data){

    var newTask = {
        section:currentSection,
        type:currentSection,
        description:descr,
        task:descr
    };
    var taskInfo = compileData(lastTask, data);
    newTask.startTime = taskInfo.startTime;
    newTask.endTime   = taskInfo.endTime;
    newTask.id        = taskInfo.id;
    newTask.active    = taskInfo.active;
    newTask.done      = taskInfo.done;
    newTask.crit      = taskInfo.crit;
    lastTask = newTask;
    tasks.push(newTask);
};

exports.parseError = function(err,hash){
    mermaidAPI.parseError(err,hash);
};