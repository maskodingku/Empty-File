//--- setting port --------
const port = 80;
//--- import module npm ----
const express = require('express');
const bodyParser = require('body-parser');
const isIp = require('is-ip');
const dir = process.cwd();
const app = express();
const sendData = async (res,data,time)=>{
  return new Promise((resolve)=>{
    res.write(data, 'utf8', () => {
      resolve();
    });
  });
};
//--- constructor url ---
app.use((req,res,next)=>{
	const statusIp = isIp(req.hostname);
	let origin = req.protocol+"://"+req.hostname;
	if( statusIp && port!=80){
		origin+=":"+port;
	};
	req.infoUrl = {
		all : origin+req.url,
		origin : origin,
		protocol : req.protocol,
		hostname : req.hostname,
		pathname : req.path,
		query : req.query,
		method : req.method,
		port : port
	};
	next();
});
//------ start ----------
app.use(async (req, res, next)=>{
  const infoUrl = req.infoUrl;
  const path = infoUrl.pathname;
  const query = infoUrl.query;
	let run = true;
  res.on('close', ()=> {
    run=false;
    res.end();
  });
  res.on('finish',()=>{
    run=false;
  });
  if(path=="/download"){
    const file = {};
    if(query.name){
      file.name=query.name;
    }else{
      file.name = "unamed";
    };
    if(query.format){
      file.format=query.format
    }else{
      file.format = "txt";
    };
    if(query.mime){
      file.mime = query.mime;
    }else{
      file.mime = "text/plain";
    };
    if(query.size){
      const numberSize = Number(query.size);
      if(isNaN(numberSize)==true){
        res.end("err download/?size={number}, the query value 'size' must be a number")
      }else{
        file.size = 10;
        const sizeFile = (numberSize).toString(); // gb
        const headers = req.headers;
        let rangeStart = 0;
        let rangeEnd = "*";
        if(headers.range){
          if(headers.range.indexOf("bytes=")==0){
            const range = headers.range.replace("bytes=","");
            const splitRange = range.split("-");
            rangeStart = Number(splitRange[0])+1;
            rangeEnd = splitRange[1];
            if(rangeEnd.length==0){
              rangeEnd = 2 * Number(rangeStart);
              rangeStart=rangeStart-1;
            }
          };
        };
        if(rangeStart==0){
          res.writeHead(200,{
            "Access-Control-Allow-Origin":"*",
            "Content-Type":file.mime,
            "Content-disposition" : "attachment; filename="+file.name+"."+file.format,
            "Connection":"keep-alive",
            "Accept-Ranges": "bytes",
            "Content-Length": sizeFile,
          });
        }else{
          res.writeHead(206,{
            "Access-Control-Allow-Origin":"*",
            "Content-Type":file.mime,
            "Content-disposition" : "attachment; filename="+file.name+"."+file.format,
            "Connection":"keep-alive",
            "Accept-Ranges": "bytes",
            "Content-Range":"bytes "+rangeStart+"-"+rangeEnd+"/"+sizeFile,
            "Content-Length": sizeFile,
          });
        };
        let data="";
        for(let i=0;i<1024;i++){
          data+=" ";
        };
        while (run) {
          await sendData(res,data);
        };
      };
    }else{
      res.writeHead(404);
      res.end("err download/?size={number}, query size not found");
    };
  }else{
	res.writeHead(404);
    res.end(`Format Request : `+infoUrl.origin+`/download?name={name-file}&size={number-size-file-byte}&format={format-size-file}

Example : `+infoUrl.origin+`/download?name=fake-file&size=1048576&format=txt

Design By www.maskoding.com`);
  };
  next();
});
//--- run app ----
app.listen(port,()=>{console.log("server running on port : "+port)});
