const express = require('express');
var multer  = require('multer')
let fs = require("fs");
var ObsClient = require('esdk-obs-nodejs');
var sd = require('silly-datetime');
const md5 = require('md5');
var sizeOf = require('image-size');

const app = express();
const port = 3000;


const path = '/tmp/upload';



app.listen(port, () => console.log(`upload-api listening at http://localhost:${port}`));

var obsClient = new ObsClient(JSON.parse(fs.readFileSync('/mnt/config/token/huaweicloud/obs.json')));
//var obsClient_Beijing = new ObsClient(JSON.parse(fs.readFileSync('/mnt/config/token/huaweicloud/obs-beijing.json')));


app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.post('/', multer({
    //设置文件存储路径
    dest: path
}).array('file', 100), function (req, res, next) {  //这里10表示最大支持的文件上传数目
    res.set({
        'content-type': 'application/json; charset=utf-8'
    });
    let files = req.files;
    if (files.length === 0) {
        res.render("error", {code: 400, message: "Empty Upload!!", data: []});
        return
    } else {
        let o = {
            code: 200,
            message: "success",
            data: []
        };
        for (var i in files) {
            let file = files[i];

            let prefix = sd.format(new Date(), 'YYYY-MM-DD') + '/'+(req.query.hasOwnProperty('fp')?req.query.fp:'default')+'/' + file.originalname.replace(/\s/g, '_');

            obsClient.putObject({
               Bucket : 'ushio-storage',
               Key : prefix,
               SourceFile : path+'/'+file.filename  // localfile为待上传的本地文件路径，需要指定到具体的文件名
            }, (err, result) => {
               if(err){
                      o.code = 500;
                      o.message = 'Error-->' + err;
               }else{
                      o.message = 'Status-->' + result.CommonMsg.Status;
               }
               fs.unlink(path+'/'+file.filename, (err)=>{
                    if(err){
                        o.code = 201;
                        o.message = 'Fail to remove TMP file..';
                    }
               });
                if(o.data.length == files.length) {
             //       res.end(JSON.stringify(o));
                }
            });
            o.data.push('https://storage.yimian.xyz/'+prefix);

            //获取文件基本信息
            /*
            fileInfo.mimetype = file.mimetype;
            fileInfo.originalname = file.originalname;
            fileInfo.size = file.size;
            fileInfo.path = file.path;
            */
        }
        // 设置响应类型及编码
        res.end(JSON.stringify(o));
    }
});






app.post('/imgbed', multer({
    //设置文件存储路径
    dest: path
}).array('file', 100), function (req, res, next) {  //这里10表示最大支持的文件上传数目
    res.set({
        'content-type': 'application/json; charset=utf-8'
    });
    let files = req.files;
    if (files.length === 0) {
        res.render("error", {code: 400, message: "Empty Upload!!", data: []});
        return
    } else {
        let o = {
            code: 200,
            message: "success",
            data: []
        };
        for (var i in files) {
            let file = files[i];
            if(file.mimetype.indexOf('image') == -1){
                o.code = 502;
                o.message = 'Not Image';
                o.data = [];
                break;
            }
            //fs.renameSync(path+'/'+file.filename, path+'/'+ file.originalname);
            size = sizeOf(path+'/'+ file.filename);

            let prefix = 'imgbed/' + 'img_' + md5(sd.format(new Date(), 'YYYY-MM-DD-HH-mm-ss')+file.filename).substring(0, 7)
                + '_' + size.width +'x'+ size.height+'_'+'8'+'_null_normal.jpeg';

            obsClient.putObject({
               Bucket : 'yimian-image',
               Key : prefix,
               SourceFile : path+'/'+file.filename  // localfile为待上传的本地文件路径，需要指定到具体的文件名
            }, (err, result) => {
               if(err){
                      o.code = 500;
                      o.message = 'Error-->' + err;
               }else{
                      o.message = 'Status-->' + result.CommonMsg.Status;
                      if(result.CommonMsg.Status != '200'){
                        o.code = 504;
                      }
               }
               fs.unlink(path+'/'+file.filename, (err)=>{
                    if(err){
                        o.code = 201;
                        o.message = 'Fail to remove TMP file..';
                    }
               });
                if(o.data.length == files.length){
                    res.end(JSON.stringify(o));
                }
            });


            o.data.push('https://api.yimian.xyz/img/?path='+prefix);

            //获取文件基本信息
            /*
            fileInfo.mimetype = file.mimetype;
            fileInfo.originalname = file.originalname;
            fileInfo.size = file.size;
            fileInfo.path = file.path;
            */
        }
        // 设置响应类型及编码
        //res.end(JSON.stringify(o));
    }
});
