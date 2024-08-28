package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

var UserTable = map[string]*UserBehavior{}

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

func getTimestamp() int64 {
    return time.Now().Unix()
}

func getToken(parameter string, timestamp int64) string {
    date := fmt.Sprintf("%d", timestamp)
    data := parameter + date

    h := sha256.Sum256([]byte(data))
    part := hex.EncodeToString(h[:])[:8]

    h2 := sha256.Sum256([]byte(part))
    return hex.EncodeToString(h2[:])[:12]
}

type UpgradeDetail struct {
    NeedChance    float64 `json:"needChance"`
    OverallChance float64 `json:"overallChance"`
}

type UserBehavior struct {
    Username          string
    LoginTime         time.Time
    ActionTime        time.Time
    Archive           map[string]interface{}
    UpgradeTableDetail []UpgradeDetail
    UpgradeSuccess    int
    UpgradeFail       int
    UpgradeLastOutcome bool
    LoginAttempts      int
}

func (u *UserBehavior) RecordUpgradeDetails(need, overall float64) bool {
    u.UpgradeTableDetail = append(u.UpgradeTableDetail, UpgradeDetail{
        NeedChance:    need,
        OverallChance: overall,
    })

    u.UpgradeLastOutcome = false
    if overall >= need {
        u.UpgradeSuccess++
        if need >= 50 {
            u.UpgradeLastOutcome = true
        }
    } else {
        u.UpgradeFail++
    }
    return true
}

func (u *UserBehavior) TimeCheck() float64 {
    return u.ActionTime.Sub(u.LoginTime).Seconds()
}

func (u *UserBehavior) ExpireCheck(out *time.Time) bool {
    var diff float64
    if out != nil {
        diff = out.Sub(u.ActionTime).Seconds()
    } else {
        diff = u.TimeCheck()
    }
    return diff > 3600
}

func (u *UserBehavior) Remove() {
    delete(UserTable, u.Username)
}

type TimeInfo struct {
    Timestamp int64 `json:"timestamp"`
    Year      int   `json:"year"`
    Month     int   `json:"month"`
    Day       int   `json:"day"`
    Hour      int   `json:"hour"`
    Minute    int   `json:"minute"`
}

func NewTimeInfo() *TimeInfo {
    ts := getTimestamp()
    t := time.Unix(ts, 0)
    return &TimeInfo{
        Timestamp: ts,
        Year:      t.Year(),
        Month:     int(t.Month()),
        Day:       t.Day(),
        Hour:      t.Hour(),
        Minute:    t.Minute(),
    }
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