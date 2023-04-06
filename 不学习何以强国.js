// ==UserScript==
// @name         不学习何以强国-beta
// @namespace    http://tampermonkey.net/
// @version      20230318
// @description  问题反馈位置： https://github.com/TechXueXi/techxuexi-js/issues 。读文章,看视频，做习题。
// @author       techxuexi ，荷包蛋。
// @match        https://www.xuexi.cn
// @match        https://www.xuexi.cn/*
// @match        https://pc.xuexi.cn/points/login.html*
// @match        https://pc.xuexi.cn/points/exam-practice.html
// @match        https://pc.xuexi.cn/points/exam-weekly-detail.html?id=*
// @match        https://pc.xuexi.cn/points/exam-weekly-list.html
// @match        https://pc.xuexi.cn/points/exam-paper-detail.html?id=*
// @match        https://pc.xuexi.cn/points/exam-paper-list.html
// @require      https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.5.1.min.js
// @require      https://cdn.jsdelivr.net/npm/blueimp-md5@2.9.0
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_openInTab
// ==/UserScript==
var study_css = ".egg_study_btn{outline:0;border:0;position:fixed;top:5px;left:5px;padding:12px 20px;border-radius:10px;cursor:pointer;background-color:#fff;color:#d90609;font-size:18px;font-weight:bold;text-align:center;box-shadow:0 0 9px #666777}.egg_manual_btn{transition:0.5s;outline:none;border:none;padding:12px 20px;border-radius:10px;cursor:pointer;background-color:#e3484b;color:rgb(255,255,255);font-size:18px;font-weight:bold;text-align:center;}.egg_auto_btn{transition:0.5s;outline:none;border:none;padding:12px 20px;border-radius:10px;cursor:pointer;background-color:#666777;color:rgb(255,255,255);font-size:18px;font-weight:bold;text-align:center;}.egg_setting_box{position:fixed;top:70px;left:5px;padding:12px 20px;border-radius:10px;background-color:#fff;box-shadow:0 0 9px #666777}.egg_setting_item{margin-top:5px;height:30px;width:140px;font-size:16px;display:flex;justify-items:center;justify-content:space-between}input[type='checkbox'].egg_setting_switch{cursor:pointer;margin:0;outline:0;appearance:none;-webkit-appearance:none;-moz-appearance:none;position:relative;width:40px;height:22px;background:#ccc;border-radius:50px;transition:border-color .3s,background-color .3s}input[type='checkbox'].egg_setting_switch::after{content:'';display:inline-block;width:1rem;height:1rem;border-radius:50%;background:#fff;box-shadow:0,0,2px,#999;transition:.4s;top:3px;position:absolute;left:3px}input[type='checkbox'].egg_setting_switch:checked{background:#fd5052}input[type='checkbox'].egg_setting_switch:checked::after{content:'';position:absolute;left:55%;top:3px}";
GM_addStyle(study_css);
//https://www.xuexi.cn/lgdata/3uoe1tg20en0.json
//查询今日完成情况
const SearchSocreUrl = "https://pc-proxy-api.xuexi.cn/delegate/score/days/listScoreProgress?sence=score&deviceType=2";
//重要新闻列表（主）
const NewsUrl1 = "https://www.xuexi.cn/lgdata/1jscb6pu1n2.json";
//学习时评新闻列表
const NewsUrl2 = "https://www.xuexi.cn/lgdata/1ap1igfgdn2.json";
//新闻视频列表
const VideosUrl1 = "https://www.xuexi.cn/lgdata/3o3ufqgl8rsn.json";
//新闻视频列表
const VideosUrl2 = "https://www.xuexi.cn/lgdata/1742g60067k.json";
//每日答题页面
const ExamPracticeUrl = "https://pc.xuexi.cn/points/exam-practice.html";
//每周答题列表API
const ExamWeeklyListUrl = "https://pc-proxy-api.xuexi.cn/api/exam/service/practice/pc/weekly/more?pageNo={pageNo}&pageSize=50";
//专项答题列表API
const ExamPaperListUrl = "https://pc-proxy-api.xuexi.cn/api/exam/service/paper/pc/list?pageSize=50&pageNo={pageNo}";
//题目API（只有每周答题和专项练习）
//const ExamQueryUrl = "https://pc-proxy-api.xuexi.cn/api/exam/service/detail/queryV3?type={type}&id={id}&forced=true";//type=1专项练习，type=2每周答题
//每周答题页面
const ExamWeeklyUrl = "https://pc.xuexi.cn/points/exam-weekly-detail.html?id={id}";
//专项测试页面
const ExamPaperUrl = "https://pc.xuexi.cn/points/exam-paper-detail.html?id={id}";
//文本服务器保存API
const AnswerSaveUrl = "https://a6.qikekeji.com/txt/data/save/";
//文本服务器获取API
const AnswerDetailUrl = "https://a6.qikekeji.com/txt/data/detail/";
//获取当前日期
var currDate = new Date().toISOString().split('T')[0];
var newsNum = 6;
var news = [];
var videoNum = 6;
var videos = [];
//配置
var settings = {};
var settingsDefault = {
    News: true, //0
    Video: true,//1
    ExamPractice: true, //6 每日答题
    ExamWeekly: true,//2 每周答题
    ExamPaper: true,//5 专项练习
    ShowMenu: false, //7 隐藏菜单
    AutoStart: false, //是否加载脚本后自动播放
}
var pause = false;//是否暂停答题
//每周答题当前页码
var examWeeklyPageNo = 1;
//每周答题总页码
var examWeeklyTotalPageCount = null;
//每周答题开启逆序答题: false: 顺序答题; true: 逆序答题
var examWeeklyReverse = false;
//专项答题当前页码
var examPaperPageNo = 1;
//专项答题总页码
var examPaperTotalPageCount = null;
//专项答题开启逆序答题: false: 顺序答题; true: 逆序答题
var examPaperReverse = false;
//每周答题，专项答题 请求rate 限制 每 3000ms 一次
const ratelimitms = 3000;

//默认情况下, chrome 只允许 window.close 关闭 window.open 打开的窗口,所以我们就要用window.open命令,在原地网页打开自身窗口再关上,就可以成功关闭了
function closeWin() {
    try {
        window.opener = window;
        var win = window.open("", "_self");
        win.close();
        top.close();
    } catch (e) {
    }

}

async function sleep( timeMS ) {
    return new Promise( res => setTimeout( res, time ) );
}

/**  模拟鼠标移动  改方法来自https://blog.csdn.net/Wuzihui___/article/details/79952068
 * @param id
 * @param clientX  相对窗口横坐标
 * @param clientY  相对窗口纵坐标
 * @param distance 滑动距离
 */
function dragandDrop(btn_hk, clientX, clientY, distance) {
    var elem = btn_hk,
        k = 0,
        interval;
    iME(elem,"mousedown",0, 0, clientX, clientY);
    let waitTime = Math.floor(Math.random() * (0.005 * 1000 - 0.09 * 1000) + 0.09 * 1000)
    interval = setInterval(function() {
        k++;
        iter(k);
        if (k === distance) {
            clearInterval(interval);
            iME(elem, "mouseup", clientX + k, clientY, 220 + k, 400);
        }
    }, waitTime);
    function iter(y) {
        iME(elem, "mousemove", clientX + y, clientY, clientX + y, clientY);
    }
    function iME(obj, event, screenXArg, screenYArg, clientXArg, clientYArg) {
        var mousemove = document.createEvent("MouseEvent");
        mousemove.initMouseEvent(event, true, true, unsafeWindow, 0, screenXArg, screenYArg, clientXArg, clientYArg, 0, 0, 0, 0, 0, null);
        obj.dispatchEvent(mousemove);
    }
}

/**
 * 随机等待最小到最大之间几秒, 需要await
 * @param {number} minSecond 最短时长
 * @param {number} MaxSecond 最长时长
 * @returns Promise
 */
function waitRandomBetween(minSecond = 2, MaxSecond = 5) {
    if (MaxSecond <= minSecond) {
        MaxSecond = minSecond + 3
    }

    let waitTime = Math.floor(Math.random() * (MaxSecond * 1000 - minSecond * 1000) + minSecond * 1000)
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(`随机等待${waitTime / 1000}秒`)
            resolve()
        }, waitTime)
    })
}

$(document).ready(function () {
    let url = window.location.href;
    if (url == "https://www.xuexi.cn" || url == "https://www.xuexi.cn/" || url == "https://www.xuexi.cn/index.html") {
        let ready = setInterval(function () {
            if (document.getElementsByClassName("text-wrap")[0]) {
                clearInterval(ready);//停止定时器
                //初始化设置
                initSetting();
                //创建"开始学习"按钮
                createStartButton();
            }
        }, 800);
    } else if (url.indexOf("login.html") !== -1) {
        console.log("检测到登录页")
        setTimeout(() => {
            window.scrollTo(0, 1000);
        }, 500);
    }
    else if (typeof GM_getValue("readingUrl") != 'object' && url == GM_getValue("readingUrl")) {
        try {
            let settingTemp = JSON.parse(GM_getValue('studySetting'));
            if (!settingTemp[7]) {
                createTip();//创建学习提示
            }
            reading(0);
        } catch (e) {
            createTip();//创建学习提示
            reading(0);
        }
    } else if (typeof GM_getValue("watchingUrl") != 'object' && url == GM_getValue("watchingUrl")) {
        try {
            let settingTemp = JSON.parse(GM_getValue('studySetting'));
            if (!settingTemp[7]) {
                createTip();//创建学习提示
            }
        } catch (e) {
            createTip();//创建学习提示
        }
        let randNum = 0;
        var checkVideoPlayingInterval = setInterval(function () {
            let temp = getVideoTag();
            if (temp.video) {
                if (!temp.video.muted) {
                    temp.video.muted = true;
                }
                if (temp.video.paused) {
                    temp.video.paused = false;
                    console.log("正在尝试播放视频")
                    if (randNum == 0) {//尝试使用js的方式播放
                        try {
                            temp.video.play();//尝试使用js的方式播放
                        } catch (e) { }
                        randNum++;
                    } else {
                        try {
                            temp.pauseButton.click();//尝试点击播放按钮播放
                        } catch (e) { }
                        randNum--;
                    }
                } else {
                    console.log("成功播放")
                    clearInterval(checkVideoPlayingInterval);
                    reading(1);
                }
            } else {
                console.log("等待加载")
            }
        }, 800);
    } else if (url.indexOf("exam") != -1 && url.indexOf("list") == -1) {
        //答题页面
        let ready = setInterval(function () {
            if (document.getElementsByClassName("title")[0]) {
                clearInterval(ready);//停止定时器
                //创建“手动答题”按钮
                createManualButton();
                //去除答题验证
                //cancelVerify();
                //开始答题
                doingExam();
            }
        }, 500);
    } else {
    }
});


//获取video标签
function getVideoTag() {
    let iframe = document.getElementsByTagName("iframe")[0];
    let video = null;
    let pauseButton = null;
    var u = navigator.userAgent;

    // 视频播放按钮更新
    video = document.getElementsByTagName("video")[0];
    pauseButton = document.getElementsByClassName("prism-big-play-btn")[0];

    return {
        "video": video,
        "pauseButton": pauseButton
    }

    // if (u.indexOf('Mac') > -1) {//Mac
    //     if (iframe != null && iframe.innerHTML) {
    //         //如果有iframe,说明外面的video标签是假的
    //         video = iframe.contentWindow.document.getElementsByTagName("video")[0];
    //         pauseButton = iframe.contentWindow.document.getElementsByClassName("prism-play-btn")[0];
    //     } else {
    //         //否则这个video标签是真的
    //         video = document.getElementsByTagName("video")[0];
    //         pauseButton = document.getElementsByClassName("prism-play-btn")[0];
    //     }
    //     return {
    //         "video": video,
    //         "pauseButton": pauseButton
    //     }
    // }
    // else {
    //     if (iframe) {
    //         //如果有iframe,说明外面的video标签是假的
    //         video = iframe.contentWindow.document.getElementsByTagName("video")[0];
    //         pauseButton = iframe.contentWindow.document.getElementsByClassName("prism-play-btn")[0];
    //     } else {
    //         //否则这个video标签是真的
    //         video = document.getElementsByTagName("video")[0];
    //         pauseButton = document.getElementsByClassName("prism-play-btn")[0];
    //     }
    //     return {
    //         "video": video,
    //         "pauseButton": pauseButton
    //     }
    // }
}

//读新闻或者看视频
//type:0为新闻，1为视频
async function reading(type) {
    //看文章或者视频
    var time = 1;
    if (type == 0) {
        time = parseInt(Math.random() * (100 - 80 + 1) + 80, 10);//80-100秒后关闭页面，看文章
    } else {
        time = parseInt(Math.random() * (250 - 230 + 1) + 230, 10);//230-250秒后关闭页面，看视频
    }
    let firstTime = time - 2;
    let secendTime = 12;
    let scrollLength = document.body.scrollHeight / 2;
    var readingInterval = setInterval(function () {
        time--;
        $("#studyTip").text(time + " 秒后关闭页面");
        if (time <= firstTime) {
            try {
                $("html,body").animate({ scrollTop: 394 }, 1000);
            } catch (e) {
                window.scrollTo(0, 394);
            }
            firstTime = -1;
        }
        if (time <= secendTime) {
            try {
                $("html,body").animate({ scrollTop: scrollLength / 3 }, 1000);
            } catch (e) {
                window.scrollTo(0, scrollLength / 3);
            }
            secendTime = -1;
        }
        if (time <= 0) {
            if (type == 0) {
                GM_setValue('readingUrl', null);
            } else {
                GM_setValue('watchingUrl', null);
            }
            clearInterval(readingInterval);
            closeWin();
        }
    }, 1000);
    //关闭文章或视频页面
}
//创建学习提示
function createTip() {
    let tipInfo = document.createElement("div");
    //添加样式
    tipInfo.setAttribute("id", "studyTip");
    tipInfo.innerText = "正在初始化....";
    tipInfo.style.position = "fixed";
    tipInfo.style.bottom = "15px";
    tipInfo.style.left = "5px";
    tipInfo.style.padding = "12px 14px";
    tipInfo.style.border = "none";
    tipInfo.style.borderRadius = "10px";
    tipInfo.style.backgroundColor = "#222222";
    tipInfo.style.color = "#ffffff";
    tipInfo.style.fontSize = "14px";
    tipInfo.style.fontWeight = "bold";
    //插入节点
    let body = document.getElementsByTagName("body")[0];
    body.append(tipInfo)
}
//等待窗口关闭
function waitingClose(newPage) {
    return new Promise(resolve => {
        let doing = setInterval(function () {
            if (newPage.closed) {
                clearInterval(doing);//停止定时器
                resolve('done');
            }
        }, 1000);
    });
}
//阅读文章
async function readNews() {
    await getNews();
    for (let i = 0; i < news.length; i++) {
        GM_setValue('readingUrl', news[i].url);
        console.log("正在看第" + (i + 1) + "个新闻");
        let newPage = GM_openInTab(news[i].url, { active: true, insert: true, setParent: true });
        await waitingClose(newPage);
        await waitRandomBetween(1, 3);
    }
}
//获取新闻列表
function getNews() {
    return new Promise(resolve => {
        news = new Array();
        let n = 6;
        if (newsNum < 6) {//如果需要学习的新闻数量不到6，也就是已经学过了，但是积分不够，补的
            n = newsNum;
        }
        console.log("还需要看" + n + "个新闻")
        //新闻数量是否足够
        let enough = true;
        //获取重要新闻
        $.ajax({
            type: "GET",
            url: NewsUrl1,
            dataType: "json",
            success: function (data) {
                let j = 0;
                if (n == 6) {//如果今天还没学过，则优先找今天的新闻
                    for (let i = 0; i < n; i++) {
                        //如果有当天日期的,则加入
                        if (data[j].auditTime.indexOf(currDate) != -1) {
                            news.push(data[j]);
                            j++;
                        } else {//否则跳出循环
                            break;
                        }
                    }
                }
                for (j; j < n; j++) {
                    let temp = parseInt(Math.random() * (data.length + 1), 10);
                    news.push(data[temp]);
                }
                resolve('done');
            },
            error: function () {
                news = null;
                resolve('done');
            }
        });
    });
}
//获取视频列表
function getVideos() {
    return new Promise(resolve => {
        videos = new Array();
        let n = 6;
        if (videoNum < 6) {//如果需要学习的视频数量不到6，也就是已经学过了，但是积分不够，补的
            n = videoNum;
        }
        console.log("还需要看" + n + "个视频")
        $.ajax({
            type: "GET",
            url: VideosUrl1,
            dataType: "json",
            success: function (data) {
                let j = 0;
                if (n == 6) {
                    for (let i = 0; i < n; i++) {
                        //如果有当天日期的,则加入
                        if (data[j].auditTime.indexOf(currDate) != -1) {
                            videos.push(data[j]);
                            j++;
                        } else {//否则跳出循环
                            break;
                        }
                    }
                }
                for (j; j < n; j++) {
                    let temp = parseInt(Math.random() * (data.length + 1), 10);
                    videos.push(data[temp]);
                }
                resolve('done');
            },
            error: function () {
                videos = [];
                resolve('done');
            }
        });
    });
}
//看学习视频
async function watchVideo() {
    await getVideos();
    for (let i = 0; i < videos.length; i++) {
        GM_setValue('watchingUrl', videos[i].url);
        console.log("正在观看第" + (i + 1) + "个视频");
        let newPage = GM_openInTab(videos[i].url, { active: true, insert: true, setParent: true })
        await waitingClose(newPage);
        await waitRandomBetween(1, 3);
    }
}
//做每日答题
function doExamPractice() {
    return new Promise(resolve => {
        console.log("正在完成每日答题")
        let newPage = GM_openInTab(ExamPracticeUrl, { active: true, insert: true, setParent: true });
        let doing = setInterval(function () {
            if (newPage.closed) {
                clearInterval(doing);//停止定时器
                resolve('done');
            }
        }, 1000);
    });
}

//fix code = 429
async function waitingDependStartTime(startTime) {
    let remainms = Date.now() - startTime;
    if (remainms < ratelimitms) {
        let second = (ratelimitms - remainms) / 1000
        await waitRandomBetween(second + 1, second + 3)
    }
}
//初始化专项答题总页数属性
async function InitExamPaperAttr() {
    let startTime = Date.now();
    var data = await getExamPaperByPageNo(1); // 默认从第一页获取全部页属性
    if (data) {
        // 初始化总页码
        examPaperTotalPageCount = data.totalPageCount;
        // 若专项答题逆序, 则从最后一页开始
        if (examPaperReverse) {
            examPaperPageNo = examPaperTotalPageCount;
        }
    }
    await waitingDependStartTime(startTime);
}

//获取指定页数的专项答题列表
function getExamPaperByPageNo(examPaperPageNoParam) {
    return new Promise(function (resolve) {
        $.ajax({
            type: "GET",
            url: ExamPaperListUrl.replace("{pageNo}", examPaperPageNoParam),
            xhrFields: {
                withCredentials: true //如果没有这个请求失败
            },
            dataType: "json",
            success: function (data) {
                data = decodeURIComponent(escape(window.atob(data.data_str.replace(/-/g, "+").replace(/_/g, "/"))));
                //JSON格式化
                data = JSON.parse(data);
                resolve(data);
            },
            error: function () {
                resolve(new Array());
            }
        });
    })
}

//查询专项答题列表看看还有没有没做过的，有则返回id
async function findExamPaper() {
    var continueFind = true;
    var examPaperId = null;
    console.log("初始化专项答题属性");
    await InitExamPaperAttr();
    console.log("正在寻找未完成的专项答题");
    while (continueFind) {
        let startTime = Date.now();

        await getExamPaperByPageNo(examPaperPageNo).then(async (data) => {
            if (data) {
                let examPapers = data.list;//获取专项答题的列表
                if (examPaperReverse) {
                    // 若开启逆序答题, 则反转专项答题列表
                    console.log("专项答题,开启逆序模式,从最早的题目开始答题");
                    examPapers.reverse();
                }
                for (let j = 0; j < examPapers.length; j++) {
                    //遍历查询有没有没做过的
                    if (examPapers[j].status != 2) {//status： 1为"开始答题" , 2为"重新答题"
                        //如果不是"重新答题"，则可以做
                        examPaperId = examPapers[j].id;
                        continueFind = false;
                        break;
                    }
                }
                if (!continueFind) {
                } else {
                    //增加页码 (若开启逆序翻页, 则减少页码)
                    examPaperPageNo += examPaperReverse ? -1 : 1;
                    if (examPaperTotalPageCount == null
                        || examPaperPageNo > examPaperTotalPageCount
                        || examPaperPageNo < 1) {
                        //已经找完所有页码，还是没找到，不再继续查找
                        continueFind = false;
                    }
                }
            } else {
                continueFind = false;
            }
            //fix code = 429
            await waitingDependStartTime(startTime);
        })
    }
    return examPaperId;
}

//做专项答题
function doExamPaper() {
    return new Promise(function (resolve) {
        //查找有没有没做过的专项答题，有则返回ID
        findExamPaper().then(examPaperId => {
            if (examPaperId != null) {
                console.log("正在做专项答题")
                let newPage = GM_openInTab(ExamPaperUrl.replace("{id}", examPaperId), { active: true, insert: true, setParent: true });
                let doing = setInterval(function () {
                    if (newPage.closed) {
                        clearInterval(doing);//停止定时器
                        resolve('done');
                    }
                }, 1000);
            } else {
                console.log("没有找到未完成的专项答题，跳过")
                resolve('noTest');
            }
        });
    })
}

//初始化每周答题总页数属性
async function InitExamWeeklyAttr() {
    let startTime = Date.now();
    var data = await getExamWeeklyByPageNo(1); // 默认从第一页获取全部页属性
    if (data) {
        // 初始化总页码
        examWeeklyTotalPageCount = data.totalPageCount;
        // 若每周答题逆序, 则从最后一页开始
        if (examWeeklyReverse) {
            examWeeklyPageNo = examWeeklyTotalPageCount;
        }
    }
    await waitingDependStartTime(startTime);
}

//获取指定页数的每周答题列表
function getExamWeeklyByPageNo(examWeeklyPageNoParam) {
    return new Promise(function (resolve) {
        $.ajax({
            type: "GET",
            url: ExamWeeklyListUrl.replace("{pageNo}", examWeeklyPageNoParam),
            xhrFields: {
                withCredentials: true //如果没有这个请求失败
            },
            dataType: "json",
            success: function (data) {
                data = decodeURIComponent(escape(window.atob(data.data_str.replace(/-/g, "+").replace(/_/g, "/"))));
                //JSON格式化
                data = JSON.parse(data);
                resolve(data);
            },
            error: function () {
                resolve(new Array());
            }
        });
    })
}

//查询每周答题列表看看还有没有没做过的，有则返回id
async function findExamWeekly() {
    var continueFind = true;
    var examWeeklyId = null;
    console.log("初始化每周答题");
    await InitExamWeeklyAttr();
    console.log("正在寻找未完成的每周答题");
    while (continueFind) {
        let startTime = Date.now();
        await getExamWeeklyByPageNo(examWeeklyPageNo).then(async (data) => {
            if (data) {
                if (examWeeklyReverse) {
                    // 若开启逆序答题, 则反转列表
                    console.log("每周答题,开启逆序模式,从最早的题目开始答题");
                    data.list.reverse();
                }
                for (let i = 0; i < data.list.length; i++) {
                    let examWeeks = data.list[i].practices;//获取每周的测试列表
                    if (examWeeklyReverse) {
                        // 若开启逆序, 则反转每周的测试列表
                        examWeeks.reverse();
                    }
                    for (let j = 0; j < examWeeks.length; j++) {
                        //遍历查询有没有没做过的
                        if (examWeeks[j].status != 2) {//status： 1为"开始答题" , 2为"重新答题"
                            //如果不是"重新答题"，则可以做
                            examWeeklyId = examWeeks[j].id;
                            continueFind = false;
                            break;
                        }
                    }
                    if (!continueFind) {
                        //如果已经找到了，则退出循环
                        break;
                    }
                }
                if (!continueFind) {
                } else {
                    //增加页码
                    examWeeklyPageNo += examWeeklyReverse ? -1 : 1;
                    if (examWeeklyTotalPageCount == null
                        || examWeeklyPageNo > examWeeklyTotalPageCount
                        || examWeeklyPageNo < 1) {
                        //已经找完所有页码，还是没找到，不再继续查找
                        continueFind = false;
                    }
                }
            } else {
                continueFind = false;
            }

            //fix code = 429
            await waitingDependStartTime(startTime);
        })
    }
    return examWeeklyId;
}
//做每周答题
function doExamWeekly() {
    return new Promise(function (resolve) {
        //查找有没有没做过的每周测试，有则返回ID
        //examWeeklyId = 147;//测试题目
        findExamWeekly().then(examWeeklyId => {
            if (examWeeklyId != null) {
                console.log("正在做每周答题")
                let newPage = GM_openInTab(ExamWeeklyUrl.replace("{id}", examWeeklyId), { active: true, insert: true, setParent: true });
                let doing = setInterval(function () {
                    if (newPage.closed) {
                        clearInterval(doing);//停止定时器
                        resolve('done');
                    }
                }, 1000);
            } else {
                console.log("没有找到未完成的每周答题，跳过")
                resolve('noTest');
            }
        });
    })
}
//获取答题按钮
function getNextButton() {
    return new Promise(function (resolve) {
        let nextInterVal = setInterval(() => {
            let nextAll = document.querySelectorAll(".ant-btn");
            let next = nextAll[0];
            if (nextAll.length == 2) {
                next = nextAll[1];
            }
            if (next.textContent) {
                clearInterval(nextInterVal);//停止定时器
                resolve(next);
            }
        }, 800);
    })
}
//暂停锁
function doingPause() {
    return new Promise(function (resolve) {
        let doing = setInterval(function () {
            if (!pause) {
                clearInterval(doing);//停止定时器
                resolve('done');
            }
            console.log("等待")
        }, 500);
    })
}
//答题过程(整合)
async function doingExam() {
    let nextButton = null;
    let qNum = 0;//题号,第一题从0开始算
    let shouldSaveAnswer = false;
    let huakuai = setInterval(function() {
        // console.log('检测是否有滑块');
        if (document.getElementsByClassName('nc_iconfont btn_slide')[0] != null) {
            console.log("出现滑块验证，等待滑块验证");
            dragandDrop(document.getElementsByClassName('nc_iconfont btn_slide')[0], 0, 0, 300);
            // #swiper_valid > div > span > a:nth-child(1)
        }
        // console.log('检测是否有刷新');
        document.querySelector("#swiper_valid > div > span > a:nth-child(1)")?.click();
    },1000)
    while (true) {
        //先等等再开始做题
        await waitRandomBetween(2, 5);
        await doingPause();
        nextButton = await getNextButton();
        if (document.getElementsByClassName('nc_iconfont btn_slide')[0] != null) {
            dragandDrop(document.getElementsByClassName('nc_iconfont btn_slide')[0], 0, 0, 300);
        }
        if (nextButton.textContent == "再练一次" || nextButton.textContent == "再来一组" || nextButton.textContent == "查看解析") {
            break;
        }
        try {
            document.querySelector(".tips").click();
        } catch (e) {
            console.log(e);
        }
        //所有提示
        var allTips = document.querySelectorAll("font[color=red]");
        await waitRandomBetween(2, 3);
        //选项按钮
        var allbuttons = document.querySelectorAll(".q-answer");
        //获取所有填空
        var blanks = document.querySelectorAll("input[type=text][class=blank]");
        try {
            //获取问题类型
            var questionType = document.querySelector(".q-header").textContent;
            questionType = questionType.substr(0, 3)
        } catch (e) {
        }
        var results = [];
        switch (questionType) {
            case "填空题": {
                //第几个填空
                var inputBubblesEvent = new Event('input', { bubbles: true });
                if (blanks.length > 1) {//如果有多个填空
                    if (allTips.length == 0) {//如果没有提示，先获取看看有没有答案
                        try {//尝试点击视频播放按钮,播不播都没关系
                            document.getElementsByClassName("outter")[0].click();
                        } catch (e) { }
                        //生成秘钥
                        let key = getKey();
                        //尝试获取答案
                        let answerData = await getAnswer(key);
                        if (answerData.status == 0 || answerData == "error") {//没有答案
                            for (let i = 0; i < blanks.length; i++) {//没答案，随便填点东西
                                blanks[i].setAttribute("value", i);
                                //必须要阻止事件，不然无效
                                blanks[i].dispatchEvent(inputBubblesEvent);
                            }
                            shouldSaveAnswer = true;//答完保存答案
                        } else {//获取到了答案
                            //格式化
                            answerData = JSON.parse(answerData.data.txt_content);
                            answerData = answerData[0].content;
                            //因为有多个空，所以有多个答案，先切割
                            answerData = answerData.split(";");
                            for (let i = 0; i < answerData.length; i++) {//将答案填入
                                blanks[i].setAttribute("value", answerData[i]);
                                blanks[i].dispatchEvent(inputBubblesEvent);
                            }
                        }
                    } else if (allTips.length == blanks.length) {
                        //如果填空数量和提示数量一致
                        for (let i = 0; i < allTips.length; i++) {
                            //将答案填写到对应的空中
                            let answer = allTips[i].textContent;
                            if (answer && answer.length > 0) {
                                blanks[i].setAttribute("value", answer);
                                blanks[i].dispatchEvent(inputBubblesEvent);
                            } else {
                                //发生了错误，只好随便填一下
                                blanks[i].setAttribute("value", i);
                                blanks[i].dispatchEvent(inputBubblesEvent);
                            }
                        }
                    } else if (allTips.length > blanks.length) {
                        //若提示数量比填空的数量多
                        //直接将所有答案整合填进去
                        let answer = "";
                        for (let i = 0; i < allTips.length; allTips++) {
                            answer += allTips[i].textContent();
                        }
                        for (let j = 0; j < blanks.length; j++) {
                            blanks[j].setAttribute("value", answer);
                            blanks[j].dispatchEvent(inputBubblesEvent);
                        }
                    } else {
                        //一般不会跑到这，如果到这了输出一下，表示惊讶
                        console.log("居然跑到了这里")
                    }
                } else if (blanks.length == 1) {//只有一个空，直接把所有tips合并。
                    let answer = "";
                    if (allTips.length != 0) {//如果有提示
                        for (let i = 0; i < allTips.length; i++) {
                            answer += allTips[i].textContent;
                        }
                    } else {
                        try {//尝试点击视频播放按钮,不过播不播都没关系
                            document.querySelector('video').play();
                        } catch (e) { }
                        let key = getKey();
                        let answerData = await getAnswer(key);
                        if (answerData.status == 0 || answerData == "error") {
                            //没有获取到答案
                            answer = "不知道";
                            //没有其他人做过这道视频题，所以需要答完保存答案，这样其他人遇到就能做对
                            shouldSaveAnswer = true;
                        } else {
                            //有答案
                            answerData = JSON.parse(answerData.data.txt_content);
                            answer = answerData[0].content;
                        }
                    }
                    blanks[0].setAttribute("value", answer);
                    blanks[0].dispatchEvent(inputBubblesEvent);
                    break;
                }
                else {
                    //怕有没空白的情况。
                }
                break;
            }
            case "多选题": {
                results = [];
                let hasButton = false;
                for (let i = 0; i < allTips.length; i++) {
                    let tip = allTips[i];
                    let answer = tip.textContent;
                    if (answer && answer.length > 0) {
                        for (let j = 0; j < allbuttons.length; j++) {
                            //获取按钮
                            let selectButton = allbuttons[j];
                            //获取按钮的上的答案
                            let buttonAnswer = selectButton.textContent;
                            if (buttonAnswer == answer || buttonAnswer.indexOf(answer) != -1 || answer.indexOf(buttonAnswer) != -1) {
                                hasButton = true;
                                if (!$(selectButton).hasClass("chosen")) {
                                    selectButton.click();
                                }
                                break;
                            }
                        }
                    }
                }
                if (!hasButton) {
                    allbuttons[0].click();
                }
                break;
            }
            case "单选题": {
                let results = [];
                let answer = "";
                for (let i = 0; i < allTips.length; i++) {
                    answer += allTips[i].textContent;
                }
                if (answer && answer.length > 0) {
                    let hasButton = false;
                    for (let i = 0; i < allbuttons.length; i++) {
                        let radioButton = allbuttons[i];
                        let buttonAnswer = radioButton.textContent;
                        //对比答案
                        if (buttonAnswer == answer || buttonAnswer.indexOf(answer) != -1 || answer.indexOf(buttonAnswer) != -1) {
                            hasButton = true;
                            radioButton.click();
                            break;
                        }
                    }
                    if (!hasButton) {
                        //没找到按钮，随便选一个
                        allbuttons[0].click();
                    }
                } else {
                    //没答案，随便选一个
                    try {
                        allbuttons[0].click();
                    } catch(e) {
                        console.log(e);
                    }
                }
                break;
            }
            default:
                break;
        }
        qNum++;
        nextButton = await getNextButton();
        if (nextButton.textContent != "再练一次" && nextButton.textContent != "再来一组" && nextButton.textContent != "查看解析") {
            nextButton.click();
            if (shouldSaveAnswer) {//如果应该保存答案
                let key = getKey();//获取key
                let answerTemp = document.getElementsByClassName("answer")[0].innerText;
                let reg = new RegExp(' ', "g")
                let answer = "";
                try {//从字符串中拿出答案
                    answer = answerTemp.split("：")[1];
                    answer = answer.replace(reg, ";");
                } catch (e) {
                    answer = answerTemp;
                }
                await saveAnswer(key, answer);
                shouldSaveAnswer = false;
            }
        } else {
            //已经做完，跳出循环
            break;
        }
    }
    closeWin();
}
//获取关键字
function getKey() {
    //获取题目的文本内容
    let key = document.getElementsByClassName("q-body")[0].innerText;
    //外部引用md5加密
    key = md5(key);
    console.log(key)
    return key;
}
//保存答案
function saveAnswer(key, value) {
    return new Promise(function (resolve) {
        value = [{ "title": key, "content": value }];
        value = JSON.stringify(value);
        $.ajax({
            type: "POST",
            url: AnswerSaveUrl,
            data: {
                txt_name: key,
                txt_content: value,
                password: "",
                v_id: ""
            },
            dataType: "json",
            success: function (data) {
                resolve(data);
            },
            error: function () {
                resolve("error");
            }
        });
    })
}
//获取答案
function getAnswer(key) {
    return new Promise(function (resolve) {
        $.ajax({
            type: "POST",
            url: AnswerDetailUrl,
            data: {
                txt_name: key,
                password: ""
            },
            dataType: "json",
            success: function (data) {
                resolve(data);
            },
            error: function () {
                resolve("error");
            }
        });
    })
}
//去除答题验证
function cancelVerify() {
    try {
        let verifyBox = document.getElementById("nc_mask");
        verifyBox.id = "egg_nc_mask";
        verifyBox.innerHTML = "";
        verifyBox.remove();
    } catch (e) {
        console.log("去除验证失败");
    }
}
//查询今日完成情况
function getToday() {
    return new Promise(function (resolve) {
        $.ajax({
            type: "GET",
            url: SearchSocreUrl,
            xhrFields: {
                withCredentials: true //如果没有这个请求失败
            },
            dataType: "json",
            success: function (temp) {
                resolve(temp.data.taskProgress);
            },
            error: function () {
                resolve(new Array());
            }
        });
    })
}
//初始化配置
function initSetting() {
    try {
        let settingTemp = JSON.parse(GM_getValue('studySetting'));
        if (settingTemp != null && Object.prototype.toString.call(settingTemp) === '[object Object]') {
            // 增加判断是否为旧数组类型缓存
            settings = settingTemp;
        } else {
            settings = JSON.parse(JSON.stringify(settingsDefault));
        }
    } catch (e) {
        //没有则直接初始化
        settings = JSON.parse(JSON.stringify(settingsDefault));
    }
}
//创建“手动答题”按钮
function createManualButton() {
    let title = document.getElementsByClassName("title")[0];
    let manualButton = document.createElement("button");
    manualButton.setAttribute("id", "manualButton");
    manualButton.innerText = "关闭自动答题";
    manualButton.className = "egg_auto_btn";
    //添加事件监听
    try {// Chrome、FireFox、Opera、Safari、IE9.0及其以上版本
        manualButton.addEventListener("click", clickManualButton, false);
    } catch (e) {
        try {// IE8.0及其以下版本
            manualButton.attachEvent('onclick', clickManualButton);
        } catch (e) {// 早期浏览器
            console.log("不学习何以强国error: 手动答题按钮绑定事件失败")
        }
    }
    //插入节点
    title.parentNode.insertBefore(manualButton, title.nextSibling);
}
//点击手动学习按钮
function clickManualButton() {
    let manualButton = document.getElementById("manualButton");
    if (manualButton.innerText == "关闭自动答题") {
        manualButton.innerText = "开启自动答题";
        manualButton.className = "egg_manual_btn";
        pause = true;
    } else {
        manualButton.innerText = "关闭自动答题";
        manualButton.className = "egg_auto_btn";
        pause = false;
    }
}
//创建“开始学习”按钮和配置
function createStartButton() {
    let base = document.createElement("div");
    var baseInfo = "";
    baseInfo += "<form id=\"settingData\" class=\"egg_menu\" action=\"\" target=\"_blank\" onsubmit=\"return false\"><div class=\"egg_setting_box\"><div class=\"egg_setting_item\"><label>新闻<\/label><input class=\"egg_setting_switch\" type=\"checkbox\" name=\"News\" " + (settings.News ? 'checked' : '') + "\/>				<\/div>				<div class=\"egg_setting_item\">					<label>视频<\/label>					<input class=\"egg_setting_switch\" type=\"checkbox\" name=\"Video\" " + (settings.Video ? 'checked' : '') + "\/>				<\/div>				<div class=\"egg_setting_item\">					<label>每日答题<\/label>					<input class=\"egg_setting_switch\" type=\"checkbox\" name=\"ExamPractice\" " + (settings.ExamPractice ? 'checked' : '') + "\/>				<\/div>	<div class=\"egg_setting_item\">					<label>专项练习<\/label>					<input class=\"egg_setting_switch\" type=\"checkbox\" name=\"ExamPaper\" " + (settings.ExamPaper ? 'checked' : '') + "\/><\/div><hr \/><div title='Tip:开始学习后，隐藏相关页面和提示（不隐藏答题中的关闭自动答题按钮）' class=\"egg_setting_item\"> <label>运行隐藏<\/label> <input class=\"egg_setting_switch\" type=\"checkbox\" name=\"ShowMenu\"" + (settings.ShowMenu ? 'checked' : '') + "/></div>" +
        "<div title='Tip:进入学习首页5秒后自动开始学习' class=\"egg_setting_item\"> <label>自动开始<\/label> <input class=\"egg_setting_switch\" type=\"checkbox\" name=\"AutoStart\"" + (settings.AutoStart ? 'checked' : '') + "/></div>"
        +
        "<a style=\"text-decoration: none;\" title=\"视频不自动播放？点此查看解决办法\" target=\"blank\" href=\"https://docs.qq.com/doc/DZllGcGlJUG1qT3Vx\"><div style=\"color:#5F5F5F;font-size:14px;\" class=\"egg_setting_item\"><label style=\"cursor: pointer;\">视频不自动播放?<\/label><\/div><\/a><\/div><\/form>";
    base.innerHTML = baseInfo;
    let body = document.getElementsByTagName("body")[0];
    body.append(base)
    let startButton = document.createElement("button");
    startButton.setAttribute("id", "startButton");
    startButton.innerText = "开始学习";
    startButton.className = "egg_study_btn egg_menu";
    //添加事件监听
    try {// Chrome、FireFox、Opera、Safari、IE9.0及其以上版本
        startButton.addEventListener("click", start, false);
    } catch (e) {
        try {// IE8.0及其以下版本
            startButton.attachEvent('onclick', start);
        } catch (e) {// 早期浏览器
            console.log("不学习何以强国error: 开始学习按钮绑定事件失败")
        }
    }
    //插入节点
    body.append(startButton)

    if (settings.AutoStart) {
        setTimeout(() => {
            if (startButton.innerText === "开始学习") {
                start()
            }
        }, 5000)
    }
}
//保存配置
function saveSetting() {
    let form = document.getElementById("settingData");
    let formData = new FormData(form);
    settings.News = (formData.get('News') != null);
    settings.Video = (formData.get('Video') != null);
    settings.ExamPractice = (formData.get('ExamPractice') != null);
    settings.ExamWeekly = (formData.get('ExamWeekly') != null);
    settings.ExamPaper = (formData.get('ExamPaper') != null);
    settings.ShowMenu = (formData.get('ShowMenu') != null);//运行时是否要隐藏
    settings.AutoStart = (formData.get('AutoStart') != null);//是否自动启动
    GM_setValue('studySetting', JSON.stringify(settings));
}
//是否显示目录
function showMenu(isShow = true) {
    let items = document.getElementsByClassName("egg_menu");
    for (let i = 0; i < items.length; i++) {
        items[i].style.display = isShow ? "block" : "none";
    }
}
//开始
async function start() {
    //保存配置
    console.log("初始化...")
    saveSetting();
    let loggedBox = document.querySelectorAll("a[class='logged-link']")[0];
    console.log("检查是否登录...")
    if (loggedBox && loggedBox.innerText) {
        let startButton = document.getElementById("startButton");
        startButton.innerText = "正在学习";
        startButton.style.cursor = "default";
        startButton.setAttribute("disabled", true);
        if (settings.ShowMenu) {
            showMenu(false);
        }
        let taskProgress = null;
        let continueToDo = true;
        let tasks = [false, false, false, false, false]
        while (continueToDo) {
            //查询今天还有什么任务没做完
            console.log("检查今天还有什么任务没做完")
            taskProgress = await getToday();
            if (taskProgress != null) {
                console.log("开始学习")

                // 显示目前得分
                /*
                let eggSettingItems = document.getElementsByClassName("egg_setting_item");
                console.log(eggSettingItems[0].children[0].innerHTML);
                eggSettingItems[0].children[0].innerHTML += ' ' + taskProgress[0].currentScore + '/' + taskProgress[0].dayMaxScore;
                eggSettingItems[1].children[0].innerHTML += ' ' + ( taskProgress[1].currentScore + taskProgress[2].currentScore ) + '/' + ( taskProgress[1].dayMaxScore + taskProgress[2].dayMaxScore );
                eggSettingItems[2].children[0].innerHTML += ' ' + taskProgress[5].currentScore + '/' + taskProgress[5].dayMaxScore;
                eggSettingItems[3].children[0].innerHTML += ' ' + taskProgress[4].currentScore + '/' + taskProgress[4].dayMaxScore;
                */
                //检查新闻
                if (settings.News && taskProgress[0].currentScore != taskProgress[0].dayMaxScore) {
                    tasks[0] = false;//只要还有要做的，就当做没完成
                    newsNum = taskProgress[0].dayMaxScore - taskProgress[0].currentScore;//还需要看多少个新闻
                    console.log("1.看新闻");
                    await readNews();
                } else {
                    tasks[0] = true;
                }

                //检查视频
                let temp = parseInt(taskProgress[1].dayMaxScore - taskProgress[1].currentScore);
                let temp2 = parseInt(taskProgress[2].dayMaxScore - taskProgress[2].currentScore);
                if (settings.Video && (temp != 0 || temp2 != 0)) {
                    tasks[1] = false;//只要还有要做的，就当做没完成
                    videoNum = temp > temp2 ? temp : temp2;//还需要看多少个视频
                    console.log("2.看视频");
                    await watchVideo();
                } else {
                    tasks[1] = true;
                }

                //检查每日答题
                if (settings.ExamPractice && taskProgress[5].currentScore != taskProgress[5].dayMaxScore) {
                    tasks[2] = false;//只要还有要做的，就当做没完成
                    console.log("3.做每日答题");
                    await doExamPractice();
                } else {
                    tasks[2] = true;
                }
                tasks[3] = true
                /*
                //检查每周答题
                if (settings.ExamWeekly && taskProgress[2].currentScore == 0) {
                    tasks[3] = false;//只要还有要做的，就当做没完成
                    console.log("4.做每周答题");
                    let result = await doExamWeekly();
                    if (result == "noTest") {
                        //如果是全都完成了，已经没有能做的了
                        tasks[3] = true;
                    }
                } else {
                    tasks[3] = true;
                }*/

                //检查专项练习
                if (settings.ExamPaper && taskProgress[4].currentScore == 0) {
                    tasks[4] = false;//只要还有要做的，就当做没完成
                    console.log("5.做专项练习");
                    let result = await doExamPaper();
                    if (result == "noTest") {
                        //如果是全都完成了，已经没有能做的了
                        tasks[4] = true;
                    }
                } else {
                    tasks[4] = true;
                }

                if (tasks[0] && tasks[1] && tasks[2] && tasks[3] && tasks[4]) {
                    //如果检查都做完了，就不用继续了
                    continueToDo = false;
                }
            } else {
                alert("发生意外错误")
                continueToDo = false;
            }
            console.log("continueToDo : " + continueToDo)
        }
        console.log("已完成")
        startButton.innerText = "已完成";
        startButton.style.color = "#c7c7c7";
        if (settings.ShowMenu) {
            showMenu()
        }
    } else {
        //提醒登录
        // alert("请先登录");

        //修改为跳转到登陆页
        let loggedButton = document.querySelectorAll("a[class='icon login-icon']")[0];
        loggedButton.click()
        setTimeout(() => {
            closeWin()
        }, 2000);
    }
    return false;
}
