// 你的 GitHub 仓库 CDN 基础地址
const CDN_BASE = "https://cdn.jsdelivr.net/gh/sisisisilviaxie-star/st-uno-game@main/";

(function() {
    // 1. 立即执行的调试日志
    console.log("🚀 [UNO] 插件脚本开始执行...");

    // 2. 定义加载函数
    function loadResources() {
        // 加载 CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `${CDN_BASE}style.css?v=${Date.now()}`;
        document.head.appendChild(link);

        // 加载 Core JS
        const script = document.createElement("script");
        script.src = `${CDN_BASE}core.js?v=${Date.now()}`;
        script.async = true;
        
        script.onload = () => {
            console.log("✅ [UNO] 核心代码加载成功");
            // 尝试使用酒馆内置的通知系统
            if (window.toastr) {
                toastr.success("UNO 游戏资源已加载", "系统消息");
            } else {
                alert("UNO 资源加载成功！");
            }
        };
        
        script.onerror = (e) => {
            console.error("❌ [UNO] 资源加载失败", e);
            alert("UNO 资源加载失败，请检查控制台 (F12)");
        };

        document.body.appendChild(script);
    }

    // 3. 确保 DOM 加载完毕后再执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadResources);
    } else {
        loadResources();
    }
})();
