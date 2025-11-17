package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// --------------------- 数据结构迁移 ---------------------

type CardUpgradeInfo struct {
    Chance    float64 `json:"chance"`
    CoinCost  int     `json:"coinCost"`
    Insurance int     `json:"insurance"`
}

var cardUpgradeDict = map[int]CardUpgradeInfo{
    0: {100, 300, 1},
    1: {100, 600, 1},
    2: {96.15, 1000, 1},
    3: {69.37, 1500, 1},
    4: {49.02, 2000, 1},
    5: {38.42, 3000, 1},
    6: {32.41, 4500, 1},
    7: {28.58, 6000, 1},
    8: {24.65, 8000, 1},
    9: {0, 0, 1},
}
// --------------------- TextTemplate 对应 ---------------------

var TextTemplate = map[string]interface{}{
    "ABOUT":                     "关于本游戏",
    "ABOUT_INFO":                "美食大战老鼠JS是一款第三方非营利性性质的、旨在学习编程知识的同人游戏。\n加入交流群 680829382 获取更多资讯！",
    "FETCH_GET_CHANCE_METHOD":   "GETCHANCE",
    "FETCH_SAVE_ARCHIVE_METHOD": "SAVEARCHIVE",
    "GAME_NAME":                  "CVMJS Beta",
    "GAME_STAR_DEG_MAX":          9,
    "GAME_STAR_DEG_MIN":          0,
    "SERVER_ERROR_CODE_000":      "请输入通行证名称",
    "SERVER_ERROR_CODE_001":      "请输入通行证密码",
    "SERVER_ERROR_CODE_002":      "此通行证信息不可用",
    "SERVER_ERROR_CODE_003":      "登录实践过多",
    "SERVER_ERROR_CODE_004":      "身份信息已失效，请重新登录",
    "SERVER_ERROR_CODE_005":      "服务器响应请求后，未提供新的令牌",
    "SERVER_ERROR_CODE_233":      "无法处理的服务器错误码",
    "SERVER_SUCCESS_CODE_000":    "已完成云同步",
    "STORAGE_ACCOUNT_NAME":       "LEISUREACCOUNT",
    "UPDATE_ANNOUNCEMENT":        "更新公告",
    "UPDATE_ANNOUNCEMENT_TEXT": []string{
        "v1.2.0 重大更新",
        "·组件重构，提供更好的性能；",
        "·缓存图像文件到本地，加速游戏载入过程；",
        "·其他游戏内核更新。",
    },
    "USERNAME": "通行证名称",
}

// --------------------- main server ---------------------

func main() {
    router := gin.Default()

        // -------- 处理 Flask before_request 等价功能 --------
    // router.Use(func(c *gin.Context) {
    //     if cc := c.GetHeader("Cache-Control"); strings.Contains(cc, "no-cache") {
    //         c.Data(428, "text/html; charset=utf-8",
    //             []byte("<h2>428 Precondition Required</h2><p>服务需要缓存才能运行。<br>Caching needed for this service.</p>"))
    //         c.Abort()
    //         return
    //     }
    //     c.Next()
    // })

    // -------- 静态文件服务 --------
    router.StaticFS("/static", http.Dir("static"))
	
    // -------- /beta/ 返回模板 --------
    router.LoadHTMLGlob("templates/*")

    router.GET("/beta/", func(c *gin.Context) {
        c.HTML(http.StatusOK, "index.html", TextTemplate)
    })

    fmt.Println("Server running on http://localhost:5000")
    router.Run(":5000")
}