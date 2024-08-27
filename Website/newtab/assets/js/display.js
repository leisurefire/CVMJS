//display 是网站的主函数，包含了滚动条监听，和平滑滚动
  $(document).on('ready', function() {
  'use strict';
  var timer;
  var ico_img = 0;
  var removeNum = 0;
  var style_list = document.createElement('style');
  var maxSize = 12;
    //Pre-loader
  $(window).on('load', function() {
    layerFun();
    $('.loader').fadeOut();
    $('.preloader').delay(250).fadeOut('slow');
    var image = addEventListener("mousemove", function (e) {
      $("#image").css({"top": e.y +20,"left": e.x+20});
    });

    $("div").click(function(){
      $("#menu").css({"opacity":"0","transform":"scale(.8)"});
      timer = setTimeout(function(){
        $("#menu").css({"display":"none"});
      },321);
      $("#default_menu").css({"opacity":"0","transform":"scale(.8)"});
      timer = setTimeout(function(){
        $("#default_menu").css({"display":"none"});
      },321);
    });
    var el = document.getElementById('mask');
    var ops = {
        delay: 320, 
        draggable: "#border-layer", 
        ghostClass: "ghost",
        dragClass: 'drag',
        dataIdAttr: "data-id", 
        forceFallback: true,
        onChoose: function (evt) { 
          var image = addEventListener("mousemove", function (e) {
            $("#image").css({"top": e.y +20,"left": e.x+20});
          }); 
          var moveNum= evt.oldIndex + 1;
          $(".border-layer").css({"display":"none"});
          $("#collected #icons #content:nth-child("+ moveNum +")").css({"opacity":"0","pointer-events":"none"});
          $("#image").css({"background-image":"url(data:image/png;base64," + localStorage.getItem("icon_" + moveNum + "_ico") +")"});
          timer=setTimeout(function(){
            $("#image").css({"transform":"scale(1.2)","opacity":"1"});
          },30);
          $("#image").css({"display":"block"});
        },
        onUnchoose: function (evt) {
          var image = null; 
          var moveNum= evt.oldIndex + 1;
          $(".border-layer").css({"display":"inline","transform":"scale(1)"});
          $("#image").css({"transform":"scale(0.6)","opacity":"0"});
          timer=setTimeout(function(){
            $("#image").css({"display":"none"});
          },321);
          $("#collected #icons #content:nth-child("+ moveNum +")").css({"opacity":"1","pointer-events":"all"});
          style_list.remove();
        },
        onEnd: function (evt) {
          var image = null; 
          var moveNum= evt.oldIndex + 1;
          var arr = sortable.toArray();
          var temp_name = localStorage.getItem("icon_" + moveNum + "_name");
          var temp_url = localStorage.getItem("icon_" + moveNum + "_url");
          var temp_ico = localStorage.getItem("icon_" + moveNum + "_ico");
          var iconNum = localStorage.getItem("iconNum");
          for(var i = 0; i < iconNum; i++){
              if( arr[i] == moveNum && i+1 > moveNum){
                for(var j = moveNum; j <= i; j++){
                    localStorage.setItem("icon_" + j + "_name", localStorage.getItem("icon_" + (j+1) + "_name"));
                    localStorage.setItem("icon_" + j + "_url", localStorage.getItem("icon_" + (j+1) + "_url"));
                    localStorage.setItem("icon_" + j + "_ico", localStorage.getItem("icon_" + (j+1) + "_ico"));
                }
                localStorage.setItem("icon_" + (i+1) + "_name", temp_name);
                localStorage.setItem("icon_" + (i+1) + "_url", temp_url);
                localStorage.setItem("icon_" + (i+1) + "_ico", temp_ico);
              }
              if( arr[i] == moveNum && i+1 < moveNum){
                for(var j = moveNum; j >= i+2; j--){
                    localStorage.setItem("icon_" + j + "_name", localStorage.getItem("icon_" + (j-1) + "_name"));
                    localStorage.setItem("icon_" + j + "_url", localStorage.getItem("icon_" + (j-1) + "_url"));
                    localStorage.setItem("icon_" + j + "_ico", localStorage.getItem("icon_" + (j-1) + "_ico"));
                }
                localStorage.setItem("icon_" + (i+1) + "_name", temp_name);
                localStorage.setItem("icon_" + (i+1) + "_url", temp_url);
                localStorage.setItem("icon_" + (i+1) + "_ico", temp_ico);
              }
          }
          for(var i = 1; i <= iconNum; i++){
            $(".border-layer:nth-child(" + i + ")").attr("data-id",i);
            $("#collected #icons #content:first-child").remove();
            var $newIcon= $('<button id="content">'+ localStorage.getItem("icon_" + i + "_name") +'</button>');
            $("#collected #icons").append($newIcon);
          }
          for(var i = 1; i <= iconNum; i++){
            $("#collected #icons #content:nth-child(" + i + ")").css({"background-image":"url(data:image/png;base64," + localStorage.getItem("icon_" + i + "_ico") +")"});
          }
          var moveNum= evt.oldIndex + 1;
          $(".border-layer").css({"display":"inline","transform":"scale(1)"});
          $("#image").css({"transform":"scale(0.6)","opacity":"0"});
            timer=setTimeout(function(){
              $("#image").css({"display":"none"});
            },321);
          $("#collected #icons #content:nth-child("+ moveNum +")").css({"opacity":"1","pointer-events":"all"});
          style_list.remove();
        },};
    var sortable = Sortable.create(el, ops);
  });

  $('#collected').bind('contextmenu',function(e){return false;});
  $("#collected").mousedown(function(e){
      if(e.target.tagName == "BUTTON"){
        return false;
      }
      if(e.button ==2){
        $("#menu").css({"opacity":"0","transform":"scale(.8)"});
          timer = setTimeout(function(){
            $("#menu").css({"display":"none"});
        },240);
        if($("#default_menu").css("opacity") == 1){
            $("#default_menu").css({"opacity":"0","transform":"scale(0.6)"});
            timer = setTimeout(function(){
              $("#default_menu").css({"opacity":"1","transform":"scale(1)"});
              $("#default_menu").css({"left": "" + e.clientX + "px"});
              $("#default_menu").css({"top": "" + e.clientY + "px"});
              $("#default_menu ul #id").text( $("#collected #icons #content:nth-child(" + removeNum +")").text() );
            },240);
            return true;
        }
        $("#default_menu").css({"display":"block"});
        timer = setTimeout(function(){
          $("#default_menu").css({"opacity":"1","transform":"scale(1)"});
          $("#default_menu").css({"left": "" + e.clientX + "px"});
          $("#default_menu").css({"top": "" + e.clientY + "px"});
          $("#default_menu ul #id").text( $("#collected #icons #content:nth-child(" + removeNum +")").text() );
        },1);
        return true;
      }
    });

    var Error = function(title,waitTime = 1200){
      $("#error").css({"display":"block"});
      $("#error .title").text( title );
      timer = setTimeout(function(){
        $("#error").css({"opacity":"1"});
        timer = setTimeout(function(){
          $("#error ul").css({"transform":"scale(1)","opacity":"1"});
            timer = setTimeout(function(){
            $("#error ul").css({"transform":"scale(0.6)","opacity":"0"});
              timer = setTimeout(function(){
              $("#error").css({"opacity":"0"});
                timer = setTimeout(function(){
                $("#error").css({"display":"none"});
                },321);
              },321);
          },waitTime);
        },321);
      },1);
    };
   document.querySelector("#mask").addEventListener("mousemove", function(ev){
    var x = ev.pageX;
    var y = ev.pageY;
    $(".border-layer").css({"display":"inline"});
    for(var i = 1; i<= 12; i++){
      $(".border-layer:nth-child("+ i +")").css({"-webkit-mask-position": (x -  $(".border-layer:nth-child("+ i +")")[0].getBoundingClientRect().x - 60) +"px " + (y - $(".border-layer:nth-child("+ i +")")[0].getBoundingClientRect().y - 60) + "px"});
    }
  });
  function layerFun(){
   $("#collected #addnew").click(function(){
      iconAddAlert();
   });
   $(".border-layer").unbind();
   $(".border-layer").mouseenter(function(){
      var j = $(".border-layer").index(this) + 1;
      $(".border-layer:nth-child("+ j +")").css({"transform":"scale(1.2)","opacity":"1"});
      $("#collected #icons #content:nth-child(" + j +")").css({"transform":"scale(1.2)","background-blend-mode":"normal"});
    });
   $(".border-layer").mouseleave(function(){
      var j = $(".border-layer").index(this) + 1;
      $(".border-layer:nth-child("+ j +")").css({"transform":"scale(1)","opacity":"0"});
      $("#collected #icons #content:nth-child(" + j +")").css({"transform":"scale(1)","background-blend-mode":"normal"});
    });
   $('.border-layer').bind('contextmenu',function(e){return false;});
   $(".border-layer").unbind("mousedown");
    $(".border-layer").mousedown(function(e){
      $("#default_menu").css({"opacity":"0","transform":"scale(.8)"});
      timer = setTimeout(function(){
        $("#default_menu").css({"display":"none"});
      },240);
      var j = $(".border-layer").index(this) + 1;
      style_list.innerHTML = '.ghost{background-image:url(data:image/png;base64,' + localStorage.getItem("icon_" + j + "_ico") +');}';
      document.head.appendChild(style_list);
      if(e.button ==2){
        removeNum = $(".border-layer").index(this) + 1;
        if($("#menu").css("opacity") == 1){
            $("#menu").css({"opacity":"0","transform":"scale(0.6)"});
            timer = setTimeout(function(){
              $("#menu").css({"opacity":"1","transform":"scale(1)"});
              $("#menu").css({"left": "" + e.clientX + "px"});
              $("#menu").css({"top": "" + e.clientY + "px"});
              $("#menu ul #id").text( $("#collected #icons #content:nth-child(" + removeNum +")").text() );
            },240);
            return true;
        }
        $("#menu").css({"display":"block"});
        timer = setTimeout(function(){
          $("#menu").css({"opacity":"1","transform":"scale(1)"});
          $("#menu").css({"left": "" + e.clientX + "px"});
          $("#menu").css({"top": "" + e.clientY + "px"});
          $("#menu ul #id").text( $("#collected #icons #content:nth-child(" + removeNum +")").text() );
        },1);
        return true;
      }
      $(".border-layer:nth-child("+ j +")").css({"transform":"scale(0.9)","opacity":"0"});
      $("#collected #icons #content:nth-child(" + j +")").css({"transform":"scale(0.9)","background-blend-mode":"multiply"});
    });
    $(".border-layer").mouseup(function(){
      var j = $(".border-layer").index(this) + 1;
      $(".border-layer:nth-child("+ j +")").css({"transform":"scale(1)","opacity":"1"});
      $("#collected #icons #content:nth-child(" + j +")").css({"transform":"scale(1)","background-blend-mode":"normal"});
    });
    $(".border-layer").click(function(){
      var j = $(".border-layer").index(this) + 1;
      window.open( localStorage.getItem("icon_" + j + "_url"));
    });
    $(".border-layer").focus(function(){
      var j = $(".border-layer").index(this) + 1;
      $(".border-layer").bind("keydown", function (e) {
      let theEvent = e || window.event;
      let keyCode = theEvent.keyCode || theEvent.which || theEvent.charCode;
      if (keyCode == 46) {
        removeNum = j;
        iconRemoveAlert();
        return false;
      }
    });
    $(".border-layer").blur(function(){
      var j = $(".border-layer").index(this) + 1;
      $("#collected #icons #content:nth-child(" + j +")").css({"box-shadow":"0 0 0 0 rgba(208,160,98,.72)"});
    });
      $("#collected #icons #content:nth-child(" + j +")").css({"box-shadow":"0 0 0 4.2px rgba(208,160,98,.72)"});
    });
  };

    $("#recommended #content").click(function(){
      var j = $("#recommended #content").index(this) + 2;
      window.open( $("#recommended #content:nth-child("+j+")").text() );
    });

    $("#searchbar #box").focus(function(){
      clearTimeout(timer);
      $(".feature").css({"transform":"scale(0.8)","opacity":"0", "margin-top":"12vh"});
      $("#backblur").css({"background-color":"rgba(0,0,0,.32)", "position":"absolute","backdrop-filter":"blur(20px)"});
      $("#searchbar").css({"margin-top":"16vh","transform":"scale(1.1)"});
      $("body").css({"background-color":"rgba(0,0,0,.16)","position":"fixed","background-size":"100%"});
      timer = setTimeout(function(){
        $(".feature").css({"pointer-events":"none"});
        if($("#searchicons").css("opacity") == 0){
          $("#searchicons").css({"transform":"scale(0.8)","opacity":"0","display":"grid"});
          timer = setTimeout(function(){
            $("#searchicons").css({"transform":"scale(1)","opacity":"1","display":"grid"});
          }, 321);
        }
      }, 321);
    });

    $("#searchicons button").blur(function(){
        $("#searchbar #box").blur();
    });
    
    $("#backblur").click(function(){
      $("#searchbar ul").css({"height":"6vh"}); 
      $("#searchbar #box").val("");
      $("#searchbar").css({"margin-top":"12vh","transform":"scale(1)"});
      timer = setTimeout(function(){
        timer = setTimeout(function(){
        $("#searchbar ul li:nth-child(n+3)").remove();
        }, 321); 
        $(".feature").css({"transform":"scale(1)","opacity":"1", "margin-top":"2.4vh","pointer-events":"all"});
        $("#backblur").css({"background-color":"rgba(0,0,0,0)", "position":"absolute","backdrop-filter":"blur(0px)"});  
        $("body").css({"background-color":"rgba(0,0,0,0)","position":"static","background-size":"106%"});
      }, 240);    
    });
    $("#baidu").addClass("active");
    var attach = "http://www.baidu.com/s?wd=";
    $("#searchbar #box").bind("keyup", function (e) {
      $("#searchbar ul").css({"height":"6vh"}); 
      var content = $(this).val();
      var theEvent = e || window.event;
      var keyCode = theEvent.keyCode || theEvent.which || theEvent.charCode;
      var sugurl = "http://suggestion.baidu.com/su?wd=#content#&cb=window.baidu.sug";
      sugurl = sugurl.replace("#content#", content);
      window.baidu = {
        sug: function(json) {
          $("#searchbar ul li:nth-child(n+3)").remove();
          var a = json.s;
          var $newTran= $('<li class="tran">' + "经由 DeepL 在线翻译“" + content +'”</li>');  
          $("#searchbar ul").append($newTran);
          $("#baidu").click(function(){
            $('#searchbar ul li a').not($(this).children()).removeClass("active");
            $(this).addClass("active");
            attach = "http://www.baidu.com/s?wd=";
          });
          $("#google").click(function(){
            $('#searchbar ul li a').not($(this).children()).removeClass("active");
            $(this).addClass("active");
            attach = "https://www.google.com.hk/search?q=";
          });
          $("#bing").click(function(){
            $('#searchbar ul li a').not($(this).children()).removeClass("active");
            $(this).addClass("active");
            attach = "https://cn.bing.com/search?q=";
          });
          for(var i in a){
              if(i<=10){
                var l = a[i];
                var $newList = $('<li>' + l +'</li>');  
                $("#searchbar ul").append($newList);
              }  
          }
          $("#searchbar ul li:nth-child(3)").click(function(){
            var pattern = "[\u4e00-\u9fa5]"; 
            if(content.match(pattern)){
              window.open("https://www.deepl.com/translator#zh/en/" + content);
            }
            else{
              window.open("https://www.deepl.com/translator#en/zh/" + content);
            }
          });
          $("#searchbar ul li:nth-child(n+4)").click(function(){
            var key = $(this).text();
            window.open( attach + key );
          });
          var h = $('#searchbar ul').children().length - 1;
          if(h>2)
          $("#searchbar ul").css({"height":"calc(8.4vh + " + h + " * 4.8vh)"}); 
          else if(h>1)
          $("#searchbar ul").css({"height":"calc(7.8vh + " + h + " * 4.8vh)"}); 
          else
          $("#searchbar ul").css({"height":"calc(7.2vh + " + h + " * 4.8vh)"});   
        }
      }
      var script = document.createElement("script");
      script.src = sugurl;
      document.getElementsByTagName("head")[0].appendChild(script);
      
      if (keyCode == 9) {
        $(".icon:nth-child(1)").focus();
        return false;
      }
      if (keyCode == 27) {
        $(".border-layer:nth-child(1)").focus();
      }
      if (keyCode == 13) {
        window.open( attach + content + "");
      }
      if (content == ""){
        $("#searchbar ul li:nth-child(n+3)").remove();
      }
    });
    $(".icon:last-child").bind("keydown", function (e) {
      var content = $(this).val();
      let theEvent = e || window.event;
      let keyCode = theEvent.keyCode || theEvent.which || theEvent.charCode;
      if (keyCode == 9) {
        $(".border-layer:nth-child(1)").focus();
        return false;
      }
    });
    $("#open").click(function(){
      var url = localStorage.getItem("icon_" + removeNum +"_url");
      window.open(url);
    });
    $("#share").click(function(){
      shareAlert();
    });
    $("#url_copy").click(function(){
      Error("已拷贝。");
      var url = localStorage.getItem("icon_" + removeNum +"_url");
      navigator.clipboard.writeText(url);
    });
    $("#icon_edit").click(function(){
      iconEditAlert();
    });
    $("#icon_add").click(function(){
      iconAddAlert();
    });
    $("#settings").click(function(){
      $("#setting").css({"display":"block"});
      $("#alert .icon").css({"display":"none"});
      timer = setTimeout(function(){
        $("#setting").css({"opacity":"1"});
        timer = setTimeout(function(){
          $("#alert .button .no").focus();
          $("#setting ul").css({"transform":"scale(1)","opacity":"1"});
          },321)
        },1)
      });
    $("#icon_remove").click(function(){
      iconRemoveAlert();
    });
    $("#alert .button .yes").click(function(){
      iconRemove();
    });
    $("#alert .button .no").click(function(){
      iconRemoveCancel();
    });
    $("#collected #pull").click(function(){
      $("#change").click();
    });
    $("#collected #addnew").click(function(){
      $("#add").click();
    });
    $("#change").click(function(){
      var text = $("#change").text();
      if( text == "展开收藏"){
        //if(localStorage.getItem("iconNum") <= 5){
        //Error("列表不足两行，无需展开。");
        //};
        $("#collected").css({"height":"calc(10.8vw + 48px)"});
        $("#collected #icons #content:nth-child(n+7)").css({"transform":"scale(0.6)"});
        $("#collected #pull").css({"transform":"rotate(90deg) rotateY(180deg)"});
        timer = setTimeout(function(){
          $("#collected #icons #content:nth-child(n+7)").css({"transform":"scale(1)"});
          $("#mask").css({"height":"calc(20vh + 16px)","overflow-y":"visible"});
          $("#collected #icons").css({"height":"calc(20vh + 16px)","overflow-y":"visible"});
          $("#change").text("折叠收藏");
        },321);
        if( localStorage.getItem("iconNum") >= 6  && localStorage.getItem("iconNum") < 12){
          $("#collected #add").css({"transform":"scale(0.6)","opacity":"0"});
          timer = setTimeout(function(){
            $("#collected #add").css({"display":"block"});
            timer = setTimeout(function(){
              $("#collected #add").css({"transform":"scale(1)","opacity":"1"});
            },321);
          },1); 
        }
      }
      if( text == "折叠收藏"){
        $("#mask").css({"height":"calc(10vh + 32px)","overflow-y":"hidden"});
        $("#collected").css({"height":"calc(5.4vw + 32px)"});
        $("#collected #icons").css({"height":"calc(6vw + 16px)","overflow-y":"hidden"});
        $("#collected #pull").css({"transform":"rotate(90deg) rotateY(0deg)"});
        timer = setTimeout(function(){
          $("#change").text("展开收藏");
        },321);
        if( localStorage.getItem("iconNum") >= 6){
          $("#collected #add").css({"transform":"scale(0.6)","opacity":"0"});
          timer = setTimeout(function(){
            $("#collected #add").css({"display":"none"});
          },120); 
        }
      }
    });
    $("#refresh").click(function(){
      window.location.reload();
    });
    var shareAlert = function(){
      $("#alert").css({"display":"block"});
      $("#alert .icon").css({"display":"none"});
      $("#alert p").text("闲惬畅享");
      $("#alert .title").text("闲惬畅享");
      $("#alert .title").css({"margin-top":"8vh"});
      $("#alert .description").text("已为您复制用于分享的代码。\n在添加菜单中，选择“从分享添加”以便快速还原分享内容。");
      var $newElement = $('<li class="button"><button class="no">关闭</button></li>');
      $("#alert ul").append($newElement);
      $("#alert .button").css({"background-image":"none"});
      timer = setTimeout(function(){
        $("#alert").css({"opacity":"1"});
        timer = setTimeout(function(){
          $("#alert .button .no").focus();
          $("#alert ul").css({"transform":"scale(1)","opacity":"1"});
        },321)
      },1)
    };


    var iconRemoveAlert = function(){
      $("#alert").css({"display":"block"});
      $("#alert .icon").css({"display":"block"});
      $("#alert .icon").css({"background-image":"url(data:image/png;base64," + localStorage.getItem("icon_" + removeNum + "_ico") +")"});
      $("#alert .title").text("要移除“" + $("#collected #icons #content:nth-child(" + removeNum +")").text() +"”吗？");
      $("#alert .description").text("您随时可以再次添加。");
      $("#alert .button").css({"background-image":"linear-gradient(to right, rgba(0,0,0,0) calc(50% - 0.5px), rgba(0,0,0,.16) 50%, rgba(0,0,0,0) calc(50% + 0.5px))"});
      timer = setTimeout(function(){
        $("#alert").css({"opacity":"1"});
        timer = setTimeout(function(){
          $("#alert .button .no").focus();
          $("#alert ul").css({"transform":"scale(1)","opacity":"1"});
        },321)
      },1)
    };
    $("#alert .button .yes").bind("keydown", function (e) {
      let theEvent = e || window.event;
      let keyCode = theEvent.keyCode || theEvent.which || theEvent.charCode;
      if (keyCode == 9) {
        $("#alert .button .no").focus();
        return false;
      }
    });
    $("#alert").bind("keydown", function (e) {
      let theEvent = e || window.event;
      let keyCode = theEvent.keyCode || theEvent.which || theEvent.charCode;
      if (keyCode == 27) {
        iconRemoveCancel();
        return false;
      }
    });
    var iconRemoveCancel = function(){
      $("#alert ul").css({"transform":"scale(.64)","opacity":"0"});
      timer = setTimeout(function(){
        $("#alert").css({"opacity":"0"});
        timer = setTimeout(function(){
          $("#alert").css({"display":"none"});
          $("#alert .title").css({"margin-top":"2vh"});
        },321)
      },1)
      $(".border-layer:nth-child("+ removeNum +")").focus();
        removeNum = 0;
    };
    var iconRemove = function(){
      $("#alert ul").css({"transform":"scale(.64)","opacity":"0"});
      timer = setTimeout(function(){
        $("#alert").css({"opacity":"0"});
        timer = setTimeout(function(){
          $("#alert").css({"display":"none"});
        },321)
      },1);
      Error( "“" + localStorage.getItem("icon_" + removeNum + "_name") + "”已被移除。");
      var x = $("#collected #icons #content:last-child").position().top;
      var y = $("#collected #icons #content:last-child").position().left;
      var px = $("#collected").position().top;
      var py = $("#collected").position().left;
      $("#collected #icons #content:nth-child(" + removeNum + ")").remove();
      $(".border-layer:nth-child("+ removeNum +")").remove();
      var iconNum = localStorage.getItem("iconNum");
      for(var i =removeNum; i< iconNum; i++){
        localStorage.setItem("icon_" +i +"_name", localStorage.getItem("icon_" + (i + 1) + "_name"));
        localStorage.setItem("icon_" +i +"_url", localStorage.getItem("icon_" + (i + 1) + "_url"));
        localStorage.setItem("icon_" +i +"_ico", localStorage.getItem("icon_" + (i + 1) + "_ico"));
      }
      localStorage.removeItem("icon_" + iconNum + "_name");
      localStorage.removeItem("icon_" + iconNum + "_url");
      iconNum--;
      localStorage.setItem("iconNum", iconNum);
      $(".temp").remove();
      $("#collected #add").css({"display":"block","opacity":"1","transform":"scale(1)","top": "calc(" + (x-px) +"px - 2.4vh + 16px)" , "left": "calc(" + (y+py) +"px - 24vw)"});
      removeNum = 0;
    };
    var iconEditAlert = function(){
      $("#edit .button .yes").off("click");
      $("#edit .button .yes").click(function(){
        iconEdit();
      });
      $("#edit .button .no").click(function(){
        iconEditCancel();
      });
      $("#edit").css({"display":"block"});
      $("#edit .title").text("编辑“" + localStorage.getItem("icon_" + removeNum +"_name") +"”的应用信息...");
      $("#edit .name input").val( localStorage.getItem("icon_" + removeNum +"_name") );
      $("#edit .url input").val( localStorage.getItem("icon_" + removeNum +"_url") );

      timer = setTimeout(function(){
        $("#edit").css({"opacity":"1"});
        timer = setTimeout(function(){
          $("#edit .button .yes").focus();
          $("#edit ul").css({"transform":"scale(1)","opacity":"1"});
        },321)
      },1)
    };
    $("#edit .ico .file").click(function () {
        $("#edit .ico #ico_file").click();
    });
    $("#edit .button .yes").bind("keydown", function (e) {
      let theEvent = e || window.event;
      let keyCode = theEvent.keyCode || theEvent.which || theEvent.charCode;
      if (keyCode == 9) {
        $("#edit .name input").focus();
        return false;
      }
    });
    $("#edit").bind("keydown", function (e) {
      let theEvent = e || window.event;
      let keyCode = theEvent.keyCode || theEvent.which || theEvent.charCode;
      if (keyCode == 27) {
        iconEditCancel();
        return false;
      }
    });
    var iconEditCancel = function(){
      $("#edit ul").css({"transform":"scale(.64)","opacity":"0"});
      timer = setTimeout(function(){
        $("#edit").css({"opacity":"0"});
        timer = setTimeout(function(){
          $("#edit").css({"display":"none"});
          $("#edit .ico input").val("");
          $("#edit .ico .preview").css({"background-image":"none"});
          $("#edit .ico button").text("选择图像");
        },321)
      },1)
      $(".border-layer:nth-child("+ removeNum +")").focus();
        removeNum = 0;
        ico_img = 0;
    };
    var iconEdit = function(){
      if($("#edit .name input").val()){
        localStorage.setItem("icon_" + removeNum +"_name", $("#edit .name input").val() );
        $("#collected #icons #content:nth-child(" + removeNum + ")").text($("#edit .name input").val());
      }
      if($("#edit .url input").val()){
        localStorage.setItem("icon_" + removeNum +"_url", $("#edit .url input").val() );
      }
      var length = ico_img.length;
      var file_length = length - ( length / 8) * 2;
      if(ico_img){
        if( file_length < 320000){
        localStorage.setItem("icon_" + removeNum +"_ico", ico_img);
        $("#collected #icons #content:nth-child("+ removeNum +")").css({"background-image":"url(data:image/png;base64," + localStorage.getItem("icon_" + removeNum + "_ico") +")"});
        }
        else {
          Error("您选择的图标规格过大。");
          $("#edit .button .yes").blur();
          return false;
        }
      }
      $("#edit ul").css({"transform":"scale(.64)","opacity":"0"});
      timer = setTimeout(function(){
        $("#edit").css({"opacity":"0"});
        timer = setTimeout(function(){
          $("#edit").css({"display":"none"});
          $("#edit .ico input").val("");
          $("#edit .ico button").text("选择图像");
          $("#edit .ico .preview").css({"background-image":"none"});
        },321)
      },1);
      ico_img = 0;
      removeNum = 0;

    };
    var iconAddAlert = function (){
      if( localStorage.getItem("iconNum") == 12){
        Error("您的收藏已满。");
        return false;
      }
      $("#edit .button .yes").off("click");
      $("#edit .button .yes").click(function(){
        iconAdd();
      });
      $("#edit .button .no").click(function(){
        iconEditCancel();
      });
      $("#edit").css({"display":"block"});
      $("#edit .title").text("添加收藏...");
      $("#edit .name input").val("");
      $("#edit .url input").val("");
      $("#edit .ico input").val("");
      timer = setTimeout(function(){
        $("#edit").css({"opacity":"1"});
        timer = setTimeout(function(){
          $("#edit .button .yes").focus();
          $("#edit ul").css({"transform":"scale(1)","opacity":"1"});
        },321)
      },1)
    };
    $("#edit .button .yes").bind("keydown", function (e) {
      let theEvent = e || window.event;
      let keyCode = theEvent.keyCode || theEvent.which || theEvent.charCode;
      if (keyCode == 9) {
        $("#edit .name input").focus();
        return false;
      }
    });
    $("#edit").bind("keydown", function (e) {
      let theEvent = e || window.event;
      let keyCode = theEvent.keyCode || theEvent.which || theEvent.charCode;
      if (keyCode == 27) {
        iconEditCancel();
        return false;
      }
    });
    $("#edit #ico_file").on('input',function(e){
      $("#edit .ico .preview").focus();
      var post = $("#edit .ico input").val().lastIndexOf("\\");
      $("#edit .ico button").text($("#edit .ico input").val().substring(post+1));
      var fileObj = document.getElementById('ico_file').files[0];
      var reader = new FileReader();
      reader.readAsDataURL(fileObj)
      reader.onload = function(e) {
        var arr = e.target.result.indexOf("base64,");
        arr = arr + 7;
        ico_img = e.target.result.substring(arr, e.target.result.length);
        $("#edit .ico .preview").css({"background-image":"url(data:image/png;base64," + ico_img +")"});
      }
    });
    var iconAdd = function(){
      var iconNum = localStorage.getItem("iconNum");
      iconNum++;
      if($("#edit .name input").val()){
        localStorage.setItem("icon_" + iconNum +"_name", $("#edit .name input").val() );
        $("#collected #icons #content:nth-child(" + iconNum + ")").text($("#edit .name input").val());
      }
      else{
        Error("请输入应用名称。");
        $("#edit .button .yes").blur();
        return false;
      }
      if($("#edit .url input").val()){
        localStorage.setItem("icon_" + iconNum +"_url", $("#edit .url input").val() );
      }
      else{
        Error("请输入应用链接。");
        $("#edit .button .yes").blur();
        return false;
      }
      var length = ico_img.length;
      var file_length = length - ( length / 8) * 2;
      if( ico_img == 0 ) {
        Error("请选择图标。");
        $("#edit .button .yes").blur();
        return false;
      }
      if( file_length < 320000){
        localStorage.setItem("icon_" + iconNum +"_ico", ico_img);
        $("#collected #icons #content:nth-child("+ iconNum +")").css({"background-image":"url(data:image/png;base64," + localStorage.getItem("icon_" + removeNum + "_ico") +")"});
      }
      else {
        Error("您选择的图标规格过大。");
        $("#edit .button .yes").blur();
        return false;
      }
      localStorage.setItem("iconNum", iconNum);
      $("#edit ul").css({"transform":"scale(.64)","opacity":"0"});
      timer = setTimeout(function(){
        $("#edit").css({"opacity":"0"});
        timer = setTimeout(function(){
          $("#edit").css({"display":"none"});
          $("#edit .ico input").val("");
          $("#edit .ico button").text("选择图像");
          $("#edit .ico .preview").css({"background-image":"none"});
        },321)
      },1);
      var $newIcon= $('<button id="content">'+ localStorage.getItem("icon_" + iconNum + "_name") +'</button>');
      var $newLayer= $('<button class="border-layer" id="border-layer" data-id="' + iconNum +'"></button>');
      $("#collected #icons").append($newIcon);
      $("#collected #icons #content:nth-child("+ iconNum +")").css({"background-image":"url(data:image/png;base64," + localStorage.getItem("icon_" + iconNum + "_ico") +")"});
      $("#collected #mask").append($newLayer);
      layerFun();
      if(iconNum < 12) {
        var $newTemp = $('<button id="content" class="temp"></button>');
        $("#collected #icons").append($newTemp);
        var x = $(".temp").position().top;
        var y = $(".temp").position().left;
        var px = $("#collected").position().top;
        var py = $("#collected").position().left;
        $(".temp").remove();
        $("#collected #add").css({"top": "calc(" + (x-px) +"px - 2.4vh + 16px)" , "left": "calc(" + (y+py) +"px - 24vw)"});
      }
      else{
        $("#collected #add").css({"display": "none"});
      }
      if(iconNum == 6){
        $("#change").click();
      }
    };
    $("#service .button .yes").click(function(){
      localStorage.setItem("reset", "0");
      $("#service ul").css({"transform":"scale(.64)","opacity":"0"});
      timer = setTimeout(function(){
        $("#service").css({"opacity":"0"});
        timer = setTimeout(function(){
          $("#service").css({"display":"none"});
        },321)
      },1);
    });
    $("#service .button .no").click(function(){
      window.close();
    });
});