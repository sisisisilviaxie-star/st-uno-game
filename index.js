// ==========================================
// 📡 UNO 云端加载器 v12.0 (最终版)
// ==========================================
const EXTENSION_NAME = "st_uno_game";
// 你的 GitHub 仓库文件的 CDN 地址 (注意：这是最新文件的直链)
// 如果你更新了 GitHub，这里会自动拉取最新逻辑，无需重装插件
const REMOTE_SCRIPT = "https://cdn.jsdelivr.net/gh/sisisisilviaxie-star/st_uno_game@main/core.js";
const REMOTE_CSS = "https://cdn.jsdelivr.net/gh/sisisisilviaxie-star/st_uno_game@main/style.css";

(async function() {
    console.log("🚀 [UNO] 连接云端引擎中...");

    // 1. 清理旧环境
    $('#uno-launch-btn, #uno-main-view, #uno-cloud-css').remove();
    
    // 2. 等待酒馆就绪
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    while ((!window.SillyTavern || !window.jQuery)) await delay(500);

    // 3. 加载云端 CSS
    const link = document.createElement("link");
    link.id = "uno-cloud-css";
    link.rel = "stylesheet";
    link.href = `${REMOTE_CSS}?t=${Date.now()}`; // 加时间戳强制刷新
    document.head.appendChild(link);

    // 4. 加载云端 JS 核心
    try {
        const response = await fetch(`${REMOTE_SCRIPT}?t=${Date.now()}`);
        if (!response.ok) throw new Error("网络请求失败");
        const scriptContent = await response.text();
        
        // 5. 注入并执行云端代码
        // 我们把 context 传进去，方便云端代码调用
        const runGame = new Function('SillyTavern', 'jQuery', scriptContent);
        runGame(window.SillyTavern, window.jQuery);
        
        if(window.toastr) toastr.success("UNO 云端引擎已同步", "系统");
        console.log("✅ [UNO] 云端代码注入成功");

    } catch (err) {
        console.error("❌ [UNO] 云端加载失败:", err);
        
        // 降级方案：如果云端挂了，显示一个报错按钮
        $('body').append(`
            <div id="uno-launch-btn" style="background:red !important;" title="加载失败">⚠️</div>
        `);
        $(document).on('click', '#uno-launch-btn', ()=>alert(`无法连接到 GitHub CDN。\n请检查网络或仓库设置。\n错误: ${err.message}`));
    }
})();
