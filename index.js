// 插件名称
const EXTENSION_NAME = "st_uno_game";

// 使用立即执行函数，不依赖 import，确保云端环境绝对稳定
(async function() {
    console.log("🚀 [UNO] 插件正在加载...");

    // 1. 等待酒馆核心加载 (最长等待 10 秒)
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    let attempts = 0;
    while ((!window.SillyTavern || !window.jQuery) && attempts < 20) {
        await delay(500);
        attempts++;
    }

    if (!window.jQuery) {
        console.error("❌ [UNO] jQuery 未加载，插件停止运行");
        return;
    }

    const $ = window.jQuery;

    // 2. 注入 CSS (针对移动端优化的版本)
    const cssStyles = `
        /* 启动按钮 (骰子) */
        #uno-launch-btn {
            position: fixed; 
            top: 10px; 
            right: 90px; /* 稍微往左挪一点，避开原有按钮 */
            z-index: 20000;
            width: 35px; 
            height: 35px;
            background: rgba(0,0,0,0.6); 
            color: white;
            border: 1px solid rgba(255,255,255,0.3); 
            border-radius: 50%;
            display: flex; 
            align-items: center; 
            justify-content: center;
            cursor: pointer; 
            font-size: 1.2em; 
            transition: 0.2s;
            backdrop-filter: blur(4px);
        }
        #uno-launch-btn:hover { 
            background: var(--SmartThemeQuoteColor, #000); 
            transform: scale(1.1); 
            border-color: gold; 
        }
        
        /* 游戏主窗口 */
        #uno-main-view {
            position: fixed; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%); /* 绝对居中 */
            
            /* --- 核心修复 --- */
            width: 90%;           /* 手机端占宽 90% */
            max-width: 400px;     /* 电脑端限制宽度 */
            max-height: 75vh;     /* 高度最多占屏幕 75%，防止顶到状态栏 */
            overflow-y: auto;     /* 内容多了可以滚动 */
            /* ---------------- */

            padding: 20px;
            background: rgba(30, 30, 40, 0.95); 
            border: 1px solid #555; 
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.8);
            z-index: 29999;       /* 层级极高，覆盖一切 */
            color: #eee; 
            text-align: center;
            display: none;        /* 默认隐藏 */
            backdrop-filter: blur(10px);
        }

        /* 标题栏 */
        .uno-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #555;
            padding-bottom: 10px;
            margin-bottom: 15px;
            font-size: 1.1em;
            font-weight: bold;
        }

        /* 通用按钮 */
        .uno-btn {
            margin-top: 15px; 
            padding: 10px 20px;
            background: var(--SmartThemeQuoteColor, #2a9d8f); 
            color: white; 
            border: none; 
            border-radius: 8px;
            cursor: pointer; 
            font-size: 14px;
            width: 100%;
            font-weight: bold;
        }
        .uno-btn:active { transform: scale(0.98); }
        
        /* 关闭按钮 */
        #uno-close { cursor: pointer; padding: 5px; opacity: 0.8; }
        #uno-close:hover { opacity: 1; color: #ff5555; }
    `;
    $('head').append(`<style>${cssStyles}</style>`);

    // 3. 注入 HTML 结构
    if ($('#uno-launch-btn').length === 0) {
        $('body').append(`
            <!-- 悬浮入口 -->
            <div id="uno-launch-btn" title="打开 UNO">🎲</div>

            <!-- 主界面 -->
            <div id="uno-main-view">
                <div class="uno-header">
                    <span>UNO Game Table</span>
                    <div id="uno-close">❌</div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 40px;">🃏</div>
                    <p style="margin: 5px 0; font-size: 0.9em; opacity: 0.8;">当前对手</p>
                    <h3 id="uno-char-name" style="color: #ffd700; margin: 0;">...</h3>
                </div>

                <div id="uno-debug-info" style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; font-size:0.85em; text-align:left;">
                    等待连接...
                </div>

                <button id="uno-test-action" class="uno-btn">开始测试</button>
            </div>
        `);
    }

    // 4. 绑定事件
    
    // 打开界面
    $(document).on('click', '#uno-launch-btn', function() {
        // 获取角色名
        let charName = "未找到角色";
        let userName = "玩家";
        
        if (window.SillyTavern && window.SillyTavern.getContext) {
            const ctx = window.SillyTavern.getContext();
            if (ctx.characterId && ctx.characters) {
                charName = ctx.characters[ctx.characterId].name;
            }
            if (ctx.name1) {
                userName = ctx.name1;
            }
        }
        
        $('#uno-char-name').text(charName);
        $('#uno-debug-info').html(`✅ 已连接<br>玩家: ${userName}<br>状态: 界面位置修正完毕`);
        $('#uno-main-view').fadeIn(200);
    });

    // 关闭界面
    $(document).on('click', '#uno-close', function() {
        $('#uno-main-view').fadeOut(200);
    });

    // 按钮点击反馈
    $(document).on('click', '#uno-test-action', function() {
        $(this).text("✨ 运行中...");
        setTimeout(() => {
            $(this).text("再次测试");
            if(window.toastr) toastr.success("交互响应正常！");
        }, 500);
    });

    console.log("✅ [UNO] 启动成功 (v2 修正版)");
})();
