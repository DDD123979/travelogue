' ============================================================
'  游迹 · 一键启动（静默版，不弹任何终端窗口）
'
'  双击本文件：后台启动 Redis 与后端服务，就绪后自动打开浏览器。
'  日志：logs\redis.log、logs\server.log
'  停止：双击 停止游迹.bat
'
'  可选参数：--no-browser  只启动服务，不自动打开浏览器
' ============================================================
Option Explicit

Const REDIS_PORT  = 6379
Const SERVER_PORT = 8080
Const WAIT_SEC    = 90
Const LOCK_SEC    = 180

Dim fso, sh, q
Dim base, logsDir, redisDir, serverDir, jarPath, lockPath, redisLog, serverLog
Dim noBrowser, ts, ready, waited, started, i

Set fso = CreateObject("Scripting.FileSystemObject")
Set sh  = CreateObject("WScript.Shell")
q = Chr(34)   ' 双引号，用来给路径加引号

noBrowser = False
For i = 0 To WScript.Arguments.Count - 1
    If LCase(WScript.Arguments(i)) = "--no-browser" Then
        noBrowser = True
    End If
Next

base      = fso.GetParentFolderName(WScript.ScriptFullName)
logsDir   = fso.BuildPath(base, "logs")
redisDir  = fso.BuildPath(base, "travel-server\redis")
serverDir = fso.BuildPath(base, "travel-server")
jarPath   = fso.BuildPath(serverDir, "target\travel-server-1.0.0.jar")
lockPath  = fso.BuildPath(logsDir, ".launching")
redisLog  = fso.BuildPath(logsDir, "redis.log")
serverLog = fso.BuildPath(logsDir, "server.log")

If Not fso.FolderExists(logsDir) Then
    fso.CreateFolder logsDir
End If

' ---- 防连点：启动过程中再次双击则直接提示并退出 ----
On Error Resume Next
If fso.FileExists(lockPath) Then
    If DateDiff("s", fso.GetFile(lockPath).DateLastModified, Now()) < LOCK_SEC Then
        If Not noBrowser Then
            MsgBox "游迹正在启动中，稍等一会儿，就绪后浏览器会自动打开。", 64, "游迹"
        End If
        WScript.Quit 0
    End If
End If
On Error GoTo 0

Set ts = fso.CreateTextFile(lockPath, True)
ts.WriteLine Now()
ts.Close

' ---- 1) Redis ----
If Not PortListening(REDIS_PORT) Then
    sh.Run "cmd /c cd /d " & q & redisDir & q & " && redis-server.exe redis.conf > " & q & redisLog & q & " 2>&1", 0, False
    WScript.Sleep 2000
End If

' ---- 2) 后端 jar（缺了就先编译一次，编译窗口保持可见）----
If Not fso.FileExists(jarPath) Then
    sh.Run "cmd /c cd /d " & q & serverDir & q & " && mvn -B clean package -DskipTests", 1, True
    If Not fso.FileExists(jarPath) Then
        On Error Resume Next
        fso.DeleteFile lockPath, True
        On Error GoTo 0
        MsgBox "编译失败，没能生成 travel-server-1.0.0.jar。" & vbCrLf & vbCrLf & _
               "请看编译窗口里的报错，修好后再双击本文件。", 16, "游迹 · 启动失败"
        WScript.Quit 1
    End If
End If

' ---- 3) 后端（隐藏窗口启动，输出写入日志）----
started = False
If Not PortListening(SERVER_PORT) Then
    sh.Run "cmd /c cd /d " & q & serverDir & q & " && java -jar " & q & jarPath & q & " > " & q & serverLog & q & " 2>&1", 0, False
    started = True
End If

If started And Not noBrowser Then
    sh.Popup "正在启动游迹，就绪后会自动打开浏览器 ...", 4, "游迹", 64
End If

' ---- 4) 等后端就绪 ----
ready  = PortListening(SERVER_PORT)
waited = 0
Do While (Not ready) And (waited < WAIT_SEC)
    WScript.Sleep 1000
    waited = waited + 1
    ready = PortListening(SERVER_PORT)
Loop

On Error Resume Next
fso.DeleteFile lockPath, True
On Error GoTo 0

' ---- 5) 打开浏览器 / 超时提示 ----
If ready Then
    If Not noBrowser Then
        sh.Run "http://localhost:8080", 1, False
    Else
        WScript.Echo "已就绪：http://localhost:8080"
    End If
Else
    If noBrowser Then
        WScript.Echo "启动超时，日志：" & serverLog
    Else
        MsgBox "等了 " & WAIT_SEC & " 秒，后端还是没起来。" & vbCrLf & vbCrLf & _
               "常见原因：MySQL 没启动、8080 端口被占用。" & vbCrLf & _
               "详细日志：" & serverLog, 48, "游迹 · 启动超时"
    End If
End If

' ============================================================
'  端口是否已被监听（用 netstat 判断，和原来的 bat 一个思路）
' ============================================================
Function PortListening(port)
    Dim rc
    rc = sh.Run("cmd /c netstat -an | findstr /c:" & q & ":" & port & " " & q & _
                " | findstr /i " & q & "LISTENING" & q & " >nul", 0, True)
    PortListening = (rc = 0)
End Function
