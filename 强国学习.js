// ==UserScript==
// @name         强国学习
// @namespace    雪导.
// @version      2.1.1
// @description  问题反馈位置： https://github.com/TechXueXi/techxuexi-js/issues 。 强国学习自动答题，目前实现 每日答题，每周答题，专项答题(操作方法更新为：打开答题页面后，手动刷新下自动开启)
// @author       雪导、天幽
// @require      https://greasyfork.org/scripts/423313-utils%E7%8E%AF%E5%A2%83/code/Utils%E7%8E%AF%E5%A2%83.js?version=911306
// @require      http://cdn.bootcss.com/jquery/1.8.3/jquery.min.js
// @match        https://www.xuexi.cn
// @match        https://www.xuexi.cn/*
// @match        https://pc.xuexi.cn/points/exam-practice.html*
// @match        https://pc.xuexi.cn/points/exam-weekly-detail.html*
// @match        https://pc.xuexi.cn/points/exam-paper-detail.html*
// @match        https://pc.xuexi.cn/points/my-study.html*
// @match        https://pc.xuexi.cn/points/exam-index.html*
// @match        https://pc-api.xuexi.cn/open/api/score/today/queryrate
// @grant        none
// ==/UserScript==
window.onload = async function () {
  const $X = new Utils("学习强国");
  //移除顶部
  const header = document.querySelector("#app > div > div.layout-header");
  if (header != null) {
    header.parentNode.removeChild(header);
    console.log("移除header乱七八糟的dom");
  }
  //移除底部
  const footer = document.querySelector("#app > div > div.layout-footer");
  if (footer != null) {
    footer.parentNode.removeChild(footer);
    console.log("移除footer乱七八糟的dom");
  }

  // 创建问题反馈
  const startQuestionBtn = () => {
    var div = document.createElement("div");
    div.innerHTML = "<span>问题反馈</span>";
    //为div创建属性class = "test"
    var divattr = document.createAttribute("class");
    divattr.value = "question-btn";
    //把属性class = "test"添加到div
    div.setAttributeNode(divattr);
    //为div添加样式
    var style = document.createAttribute("style");
    div.setAttributeNode(style);
    div.style.backgroundColor = "green";
    div.style.color = "#fff";
    div.style.textAlign = "center";
    div.style.width = "80px";
    div.style.borderColor = "#000";
    div.style.marginLeft = "0%";
    div.style.marginTop = "1%";
    document.querySelector(".ant-breadcrumb").appendChild(div);
    $(".question-btn").click(() => {
      window.open("https://gitee.com/qq34347476/tampermonkey/issues");
    });
  };

  // 创建每日答题
  const startDayBtn = () => {
    var div = document.createElement("div");
    div.innerHTML = "<span>每日答题</span>";
    //为div创建属性class = "test"
    var divattr = document.createAttribute("class");
    divattr.value = "start-btn";
    //把属性class = "test"添加到div
    div.setAttributeNode(divattr);
    //为div添加样式
    var style = document.createAttribute("style");
    div.setAttributeNode(style);
    div.style.backgroundColor = "#F00";
    div.style.color = "#fff";
    div.style.textAlign = "center";
    div.style.width = "80px";
    div.style.borderColor = "#000";
    div.style.marginLeft = "0%";
    div.style.marginTop = "1%";
    document.querySelector(".ant-breadcrumb").appendChild(div);
    $(".start-btn").click(() => {
      window.open("https://pc.xuexi.cn/points/exam-practice.html");
    });
  };

  // 创建专项答题
  const startExamBtn = () => {
    var div = document.createElement("div");
    div.innerHTML = "<span>专项答题</span>";
    //为div创建属性class = "test"
    var divattr = document.createAttribute("class");
    divattr.value = "start-btn3";
    //把属性class = "test"添加到div
    div.setAttributeNode(divattr);
    //为div添加样式
    var style = document.createAttribute("style");
    div.setAttributeNode(style);
    div.style.backgroundColor = "#F00";
    div.style.color = "#fff";
    div.style.textAlign = "center";
    div.style.width = "80px";
    div.style.borderColor = "#000";
    div.style.marginLeft = "0%";
    div.style.marginTop = "1%";
    document.querySelector(".ant-breadcrumb").appendChild(div);
    $(".start-btn3").click(() => {
      window.open("https://pc.xuexi.cn/points/exam-paper-list.html");
    });
  };

  // 创建每周答题
  const startWeekBtn = () => {
    var div = document.createElement("div");
    div.innerHTML = "<span>每周答题</span>";
    //为div创建属性class = "test"
    var divattr = document.createAttribute("class");
    divattr.value = "start-btn2";
    //把属性class = "test"添加到div
    div.setAttributeNode(divattr);
    //为div添加样式
    var style = document.createAttribute("style");
    div.setAttributeNode(style);
    div.style.backgroundColor = "#F00";
    div.style.color = "#fff";
    div.style.textAlign = "center";
    div.style.width = "80px";
    div.style.borderColor = "#000";
    div.style.marginLeft = "0%";
    div.style.marginTop = "1%";
    document.querySelector(".ant-breadcrumb").appendChild(div);
    $(".start-btn2").click(() => {
      window.open("https://pc.xuexi.cn/points/exam-weekly-list.html");
    });
  };

  const getBtnDom = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let nextAll = document.querySelectorAll(".ant-btn");
        let next = nextAll[0];

        if (nextAll.length == 2) {
          //俩按钮，说明有个按钮是交卷。
          next = nextAll[1];
        }
        console.log("btn按钮状态", next);
        resolve(next);
      }, 2000);
    });
  };

  const doit = async () => {
    console.log("===========开始答题===========");
    console.log("延时500ms");
    await $X.wait(500);
    const next = await getBtnDom();
    console.log("next", next);

    if (next.disabled) {
      document.querySelector(".tips").click();
      console.log("延时500ms");
      await $X.wait(500);
      if (
        document.querySelector(".ant-popover-inner-content").textContent ===
        "请观看视频"
      ) {
        console.log("需要观看视频");
        alert("请手动作答");
        // window.location.reload()
        return;
      }

      //所有提示
      let allTips = document.querySelectorAll("font[color=red]");

      //单选多选时候的按钮
      let buttons = document.querySelectorAll(".q-answer");

      //填空时候的那个textbox，这里假设只有一个填空
      let textboxs = document.querySelectorAll("input");
      //问题类型
      let qType = document.querySelector(".q-header").textContent;
      console.log("问题类型qType", qType);

      qType = qType.substr(0, 3);
      switch (qType) {
        case "填空题":
          //第几个填空
          let mevent = new Event("input", { bubbles: true });
          if (textboxs.length > 1) {
            //若不止是一个空
            //填空数量和提示数量是否一致
            if (allTips.length == textboxs.length) {
              for (
                let i = 0;
                i < allTips.length;
                i++ //数量一致，则一一对应。
              ) {
                let tip = allTips[i];
                let tipText = tip.textContent;
                if (tipText.length > 0) {
                  //通过设置属性,然后立即让他冒泡这个input事件.
                  //否则1,setattr后,内容消失.
                  //否则2,element.value=124后,属性值value不会改变,所以冒泡也不管用.
                  textboxs[i].setAttribute("value", tipText);
                  textboxs[i].dispatchEvent(mevent);
                }
              }
            } else {
              //若填空数量和提示数量不一致，那么，应该都是提示数量多。

              if (allTips.length > textboxs.length) {
                let lineFeed = document.querySelector(".line-feed").textContent; //这个是提示的所有内容，不仅包含红色答案部分。

                let n = 0; //计数，第几个tip。
                for (
                  let j = 0;
                  j < textboxs.length;
                  j++ //多个填空
                ) {
                  let tipText = allTips[n].textContent;
                  let nextTipText = "";
                  do {
                    tipText += nextTipText;
                    if (n < textboxs.length - 1) {
                      n++;
                      nextTipText = allTips[n].textContent;
                    } else {
                      nextTipText = "结束了，没有了。";
                    }
                  } while (lineFeed.indexOf(tipText + nextTipText));

                  textboxs[j].setAttribute("value", tipText);
                  textboxs[j].dispatchEvent(mevent);
                }
              } else {
                //提示数量少于填空数量，则我无法分析, 回头研究，暂时放弃作答，刷新题库浏览器
                // location.reload()
              }
              return doit();
            }
          } else if (textboxs.length == 1) {
            //只有一个空，直接把所有tips合并。
            let tipText = "";
            for (let i = 0; i < allTips.length; i++) {
              tipText += allTips[i].textContent;
            }
            textboxs[0].setAttribute("value", tipText);
            textboxs[0].dispatchEvent(mevent);
            await $X.wait(500);
            // return doit()
          } else {
            //怕有没空白的情况。  看视频。。
            console.log("填空题，看视频？");
            window.location.href = "http://www.baidu.com";
          }
          return doit();
        case "多选题":
          //循环选项列表。用来点击
          for (let js = 0; js < buttons.length; js++) {
            let cButton = buttons[js];
            for (
              let i = 0;
              i < allTips.length;
              i++ //循环提示列表。
            ) {
              let tip = allTips[i];
              let tipText = tip.textContent;
              if (tipText.length > 0) {
                //提示内容长度大于0
                let cButtonText = cButton.textContent; //选项按钮的内容
                console.log("cButtonText", cButtonText);
                console.log("tipText", tipText);
                //循环对比点击
                if (
                  cButtonText.indexOf(tipText) > -1 ||
                  tipText.indexOf(cButtonText) > -1
                ) {
                  cButton.click();
                }
              }
            }
          }
          return doit();
        case "单选题":
          //单选，所以所有的提示，其实是同一个。有时候，对方提示会分成多个部分。
          //case 块里不能直接用let。所以增加了个if。
          if (true) {
            //把红色提示组合为一条
            let tipText = "";
            for (let i = 0; i < allTips.length; i++) {
              tipText += allTips[i].textContent;
            }

            if (tipText.length > 0) {
              //循环对比后点击 答案是否包含正确答案
              for (let js = 0; js < buttons.length; js++) {
                let cButton = buttons[js];
                let cButtonText = cButton.textContent;
                //通过判断是否相互包含，来确认是不是此选项
                if (
                  cButtonText.indexOf(tipText) > -1 ||
                  tipText.indexOf(cButtonText) > -1
                ) {
                  console.log("延时500选择");
                  await $X.wait(500);
                  cButton.click();
                  await $X.wait(500);
                  console.log("下一步");
                  return doit();
                }
              }

              // 循环对比答案，若不纯在包含答案  则走 这套比对答案逻辑
              console.log("循环比对答案 【相似度】");
              let xiangsidu = []; // 相似度
              let max_xiangsidu = 0;
              let index = 0;
              for (let js = 0; js < buttons.length; js++) {
                let cButton = buttons[js];
                let cButtonText = cButton.textContent;
                //通过判断是否相互包含，来确认是不是此选项
                xiangsidu.push($X.strSimilarity2Percent(tipText, cButtonText));
              }

              max_xiangsidu = $X.getMaxNumOfArr(xiangsidu);
              index = xiangsidu.findIndex((item) => item === max_xiangsidu);
              console.log(`几个答案相似度【$X{max_xiangsidu}】`);
              console.log(`找最相似的答案【$X{index}】`);
              buttons[index].click();
              await $X.wait(500);
              document.querySelector(".ant-btn").click();
              await $X.wait(500);
              return doit();
            }
          }
          break;
        default:
          break;
      }
    } else {
      // 可以点击
      if (
        next.textContent != "再练一次" &&
        next.textContent != "再来一组" &&
        next.textContent != "查看解析"
      ) {
        next.click();
        await $X.wait(500);
        doit();
      } else {
        // 结束
        console.log("答题结束");
        $X.done();
      }
    }
  };
  startQuestionBtn();
  startDayBtn();
  startWeekBtn();
  startExamBtn();
  let btn = document.querySelector(".ant-btn");
  if (btn) {
    if (btn.textContent === "确 定" || btn.textContent === "下一题") {
      await $X.wait(500);
      doit();
    } else {
      location.reload();
    }
  }
};
