/********************************************************************************
** 作者： 在路上的张(www.cnblogs.com/gotop)
** 创始时间：2016-6-12
** 描述：
**    chrome插件网页内容注入文件
*********************************************************************************/
var editorText = '';
var downimgCount = 0;
var updateImgCount = 0;

$(function () {
    var syncPicUrl = chrome.extension.getURL('sync.png');
    $("#edit_body img").after("<div id='uploadOutPic' style='line-height:30px'><img src='" + syncPicUrl + "' title='点击同步外部图片' align='left' width='30' height='30'/><span>点击同步外部图片</span></div>");
    $("#uploadOutPic").click(function () {
        downimgCount=0;
        updateImgCount=0;
        //alert("点击了图片");
        $("#uploadOutPic span").text("开始同步，请稍等...");
        editorText = $("#edit_body textarea").val();
        GetMarkDownPic(editorText);
    });
    chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.type == "downComplete") {
            upload(request.response, request.filename, request.url)
            sendResponse({ msg: "receive file complete" });
        }
        else if(request.type=="replaceText")
        {
            ReplaceEditor(request.oldurl, request.newurl);
            sendResponse({ msg: "receive replaceText command" });
        }
    });
});

function GetMarkDownPic(md)
{
    var pattern = /!\[(\S*)\]\((\S*)/g;
    var imgPattern = /\((http:\/\/\S*)\)/;
    str = md;
    var arr = str.match(pattern);
    downimgCount = arr.length;
    for (var i = 0; i <= arr.length; i++) {
        var item = arr[i];
        if (item != null) {
            var img = item.match(imgPattern);
            //向background.js发送下载文件请求
            chrome.extension.sendMessage({ type: "downfile",file:img[1] }, function (response) {
                //console.log(response.msg);
            });
        }
    }
}
function ReplaceEditor(oldUrl,newUrl)
{
    //console.log("oldUrl:" + oldUrl);
    //console.log("newUrl:" + newUrl);
    editorText= editorText.replace(oldUrl, newUrl);
    updateImgCount++;
    if(updateImgCount>=downimgCount)
    {
        $("#edit_body textarea").val(editorText);
        $("#uploadOutPic span").text("同步完成，单击重新同步");
    }
}