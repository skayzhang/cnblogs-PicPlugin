/********************************************************************************
** 作者： 在路上的张(www.cnblogs.com/gotop)
** 创始时间：2016-6-12
** 描述：
**    chrome插件后台运行主程序
*********************************************************************************/
chrome.tabs.onUpdated.addListener(checkForValidUrl);

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        //console.log(sender.tab ?
        //    "from a content script:" + sender.tab.url :
        //    "from the extension");
        if (request.type == "downfile") {
            sendResponse({ msg: "start download flie" });
            downloadFile(request.file, upload, sender)
        }

    }
);

function getDomainFromUrl(url) {
     var host = "null";
     if(typeof url == "undefined" || null == url)
          url = window.location.href;
     var regex = /.*\:\/\/([^\/]*).*/;
     var match = url.match(regex);
     if(typeof match != "undefined" && null != match)
          host = match[1];
     return host;
}

function checkForValidUrl(tabId, changeInfo, tab) {
     /*if(getDomainFromUrl(tab.url).toLowerCase()=="www.cnblogs.com"){
          chrome.pageAction.show(tabId);
     }*/
	 if(tab.url.indexOf("http://i.cnblogs.com/EditPosts.aspx")==0)
	 {
		 chrome.pageAction.show(tabId);
	 }
};

//var wR = chrome.webRequest || chrome.experimental.webRequest; //兼容17之前版本的chrome，若需要使用chrome.experimental，需要在 about:flags 中“启用“实验用。。API”
//if (wR) {
//    wR.onBeforeSendHeaders.addListener(
//        function (details) {
//            if (details.type === 'xmlhttprequest') {
//                var exists = false;
//                for (var i = 0; i < details.requestHeaders.length; ++i) {
//                    if (details.requestHeaders[i].name === 'Referer') {
//                        exists = true;

//                        break;
//                    }
//                }
//                if (!exists) {//不存在 Referer 就添加
//                    details.requestHeaders.push({ name: 'Referer', value: 'http://www.jianshu.com/writer' });
//                }
//                return { requestHeaders: details.requestHeaders };
//            }
//        },
//        { urls: ["http://*.jianshu.com/writer*", "https://*.jianshu.com/writer*", "http://*.cnblogs.com/*"] },//匹配访问的目标url
//        ["blocking", "requestHeaders"]
//    );
//}


function downloadFile(url, success,sender) {
    var myURL = parseURL(url);
    var filename = myURL.file;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = "blob";
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            console.log(xhr.response);
            if (success) success(xhr.response, filename, url,sender);
        }
    };
    xhr.send(null);
}

function upload(blobOrFile, fileName, oldUrl,sender) {
    //console.log(blobOrFile);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://upload.cnblogs.com/imageuploader/processupload?host=www.cnblogs.com&qqfile=' + fileName, true);
    xhr.onload = function (e) {
        var state = this.readyState;
        var responseCode = xhr.status;
        //console.log("request.onload called. readyState: " + state + "; status: " + responseCode);
        if (state == this.DONE && responseCode == 200) {
            var responseData = this.responseText;
            //alert("Success: " + responseData.length + " chars received.");
            //console.log(responseData);
            var data =JSON.parse(responseData);
            if (data.success) {
                //data.message  为上传成功的图片地址
                SendReplaceEditorText(oldUrl, data.message,sender);
            }
        }
    };
    // Listen to the upload progress.
    var progressBar = document.querySelector('progress');
    xhr.upload.onprogress = function (e) {
        /* if (e.lengthComputable) {
             progressBar.value = (e.loaded / e.total) * 100;
             progressBar.textContent = progressBar.value;// Fallback for unsupported browsers.
         }*/
    };
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.setRequestHeader("X-File-Name", fileName);
    xhr.setRequestHeader("X-Mime-Type", getPicMimeType(fileName));
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    //xhr.sendAsBinary(blobOrFile);
    xhr.send(blobOrFile);
}


function SendReplaceEditorText(oldurl,newurl,sender)
{
    chrome.tabs.sendMessage(sender.tab.id, {
        type: "replaceText",
        oldurl: oldurl,
        newurl: newurl
    }, function (response) {
        //console.log(response.msg);
    });
}

function downComplete(response,filename,url,sender)
{
    chrome.tabs.sendMessage(sender.tab.id, {
        type: "downComplete",
        response: response,
        filename: filename,
        url:url
    }, function (response) {
        //console.log(response.msg);
    });
}

function getPicMimeType(fileName)
{
    var ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
    if(ext==".png")
    {
        return "image/png";
    }
    else if(ext==".jpg")
    {
        return "image/jpeg";
    }
    else if(ext==".gif")
    {
        return "image/gif";
    }
    else
    {
        return "image/png";
    }
}

/** 
*@param {string} url 完整的URL地址 
*@returns {object} 自定义的对象 
*@description 用法示例：var myURL = parseURL('http://abc.com:8080/dir/index.html?id=255&m=hello#top');
myURL.file='index.html' 
myURL.hash= 'top' 
myURL.host= 'abc.com' 
myURL.query= '?id=255&m=hello' 
myURL.params= Object = { id: 255, m: hello } 
myURL.path= '/dir/index.html' 
myURL.segments= Array = ['dir', 'index.html'] 
myURL.port= '8080' 
myURL.protocol= 'http' 
myURL.source= 'http://abc.com:8080/dir/index.html?id=255&m=hello#top' 
*/
function parseURL(url) {
    var a = document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':', ''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function () {
            var ret = {},
                seg = a.search.replace(/^\?/, '').split('&'),
                len = seg.length, i = 0, s;
            for (; i < len; i++) {
                if (!seg[i]) { continue; }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [, ''])[1],
        hash: a.hash.replace('#', ''),
        path: a.pathname.replace(/^([^\/])/, '/$1'),
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [, ''])[1],
        segments: a.pathname.replace(/^\//, '').split('/')
    };
}
