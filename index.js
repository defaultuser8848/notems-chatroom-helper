// ==UserScript==
// @name         Note.ms聊天室辅助
// @namespace    http://tampermonkey.net/
// @version      1.2.1
// @description  用于实现基于Note.ms的聊天室的快速消息编辑等辅助功能。
// @author       Defaultuser6
// @match        https://note.ms/*
// @match        https://note.re/*
// @match        https://note.ect.fyi/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @license      Mozilla
// @downloadURL https://update.greasyfork.org/scripts/504208/Notems%E8%81%8A%E5%A4%A9%E5%AE%A4%E8%BE%85%E5%8A%A9.user.js
// @updateURL https://update.greasyfork.org/scripts/504208/Notems%E8%81%8A%E5%A4%A9%E5%AE%A4%E8%BE%85%E5%8A%A9.meta.js
// ==/UserScript==

function safereload()
{
    document.write("正在刷新...");
    location.reload();
}

function firstrun()
{
    localStorage.setItem("chatroomhelper-chatrooms","[]");
    localStorage.setItem("chatroomhelper-message-cache","");
    localStorage.setItem("chatroomhelper-state","0");
    localStorage.setItem("chatroomhelper-nickname","匿名用户"+Math.round(Math.random()*10000).toString());
}
function enable(){
    var name=document.location.pathname.slice(1,100);
    var lst=JSON.parse(localStorage.getItem('chatroomhelper-chatrooms'));
    lst.push(name);
    localStorage.setItem("chatroomhelper-chatrooms",JSON.stringify(lst));
    safereload();
}
function _fmt_num(x)
{
    if(x<10)return "0"+x;
    return ""+x;
}
function get_format_time()
{
    var now=new Date();
    return `${now.getFullYear()}/${_fmt_num(now.getMonth()+1)}/${_fmt_num(now.getDate())} ${_fmt_num(now.getHours())}:${_fmt_num(now.getMinutes())}`;
}
async function get_realtime_content()
{
    var raw=await (await fetch("")).text();
    var ele=document.createElement('div');
    ele.innerHTML=raw;
    return ele.getElementsByClassName("content")[0].value;
}
function dynamic_update(){
    return get_realtime_content().then(function(tmp){document.getElementsByClassName("content")[0].value=tmp});
}
function openmenu(){
    var toolsource=`<html><head><title>聊天室工具</title><script>setInterval(()=>{if(!window.opener)window.close();},500)</script><meta http-equiv="Content-Type"content="text/html;charset=utf-8"/></head><body><div style="outline: 1px dashed gray;"><h3><center>信息编辑器</center></h3><label>昵称</label><input id="nickname"><br><br><label>内容</label><textarea id="content"style="width:80%;height:100px;"></textarea><br><br><button id="submit">发送！</button></div><div><a id="disable"href="javascript:void(0)">禁用聊天室功能</a><br><a id="download"href="javascript:void(0)">下载页面备份</a><br><a id="update" href="javascript:void(0)">更新实时页面内容</a><br><a id="clear" href="javascript:void(0)">清除本工具全部数据（不可撤销）</a></div></body></html>`

    var win=window.open("about:blank","",
                        `popup=yes,width=600,height=400`);
    win.document.write(toolsource);
    win.document.getElementById("nickname").value=localStorage.getItem('chatroomhelper-nickname');
    win.document.getElementById("submit").onclick=async function(){
        var nickname=win.document.getElementById("nickname").value;
        localStorage.setItem('chatroomhelper-nickname',nickname);
        var now=new Date();
        var time_st=get_format_time();
        var message=`\n${nickname}[${time_st}]:\n${win.document.getElementById("content").value}`;
        win.document.getElementById("content").value="";
        localStorage.setItem('chatroomhelper-message-cache',message);
        await dynamic_update();
        postmsg();
    };
    win.document.getElementById("download").onclick=function(){
        var content=document.getElementsByClassName("content")[0].value;
        var obj=new Blob([content],{type:"text/plain;charset=utf-8"});
        var u=URL.createObjectURL(obj);
        var tmp=document.createElement('a')
        tmp.href=u;
        tmp.download=`${document.location.pathname.slice(1,100)}-backup ${get_format_time().replaceAll("/","-").replaceAll(':','.')}.txt`;
        tmp.click();
        URL.revokeObjectURL(u);
    };
    win.document.getElementById("clear").onclick=function(){localStorage.clear();win.close();safereload();};
    win.document.getElementById("disable").onclick=function(){
        var lst=JSON.parse(localStorage.getItem('chatroomhelper-chatrooms'));
        lst=lst.filter((item)=>item!=location.pathname.slice(1,100));
        localStorage.setItem("chatroomhelper-chatrooms",JSON.stringify(lst));
        win.close();
        safereload();
    }
    win.document.getElementById("update").onclick=async()=>await dynamic_update();
}
function init()
{
    if(localStorage.getItem("chatroomhelper-first-run") == null)
    {
        localStorage.setItem("chatroomhelper-first-run","1");
        firstrun();
    }
    var parent=document.querySelector("div.flag");
    var button=document.createElement("a");
    parent.appendChild(button);
    var name=document.location.pathname.slice(1,100);
    if(JSON.parse(localStorage.getItem('chatroomhelper-chatrooms')).indexOf(name)==-1)
    {
        button.onclick=enable;
        button.innerText="这是一个聊天室";
    }
    else
    {
        button.onclick=openmenu;
        button.innerText="打开聊天室工具";
    }
}
function postmsg()
{
    if(!localStorage.getItem("chatroomhelper-message-cache"))return;
    var message=localStorage.getItem("chatroomhelper-message-cache");

    var content=document.getElementsByClassName("content")[0].value.split("\n");
    var ln=-1;
    for(var i=0;i<content.length;i++)
    {
        //console.log(content[i]);
        if(content[i].startsWith("=‌="))
        {
            ln=i;
            break;
        }
    }
   // console.log(ln);
    if(ln==-1){
        alert("没有找到定位标识，请手动添加定位标识后重试。");
        return ;
    }

    var newcontent=content.slice(0,ln).concat(message.split('\n')).concat(content.slice(ln,100000000)).join('\n');
    document.getElementsByClassName("content")[0].value=newcontent;
    localStorage.setItem("chatroomhelper-message-cache","");
    //setTimeout(()=>safereload(),10000);
}
(function() {
    'use strict';
    init();
    postmsg();
    // Your code here...
})();
