// 这里的 import 是为了获得酒馆的核心功能
// 注意：不同版本的酒馆路径可能不同，为了兼容性，我们尽量使用全局对象
// 如果你的酒馆版本较新，下面这行通常能工作：
import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const EXTENSION_NAME = "st-uno-game";

// 1. 初始化设置
async function loadSettings() {
    // 确保设置对象存在
    extension_settings[EXTENSION_NAME] = extension_settings[EXTENSION_NAME] || {};
    console.log("UNO 插件设置已加载");
}

// 2. 创建界面
function createUI() {
    // 防止重复创建
    if ($('#uno-trigger-btn').length > 0) return;

    // A. 创建一个按钮放在顶部菜单栏 (或者左下角)
    const btnHtml = `
        <div id="uno-trigger-btn" class="menu_button" title="开始 UNO 游戏" style="margin: 5px;">
            <i class="fa-solid fa-dice"></i> UNO
        </div>
    `;
    
    // 尝试插入到顶部栏 (Extensions 菜单旁边)
    // 如果找不到这个位置，就浮动在页面左下角
    if ($('#extensions_menu').length > 0) {
        $('#extensions_menu').after(btnHtml);
    } else {
        $('body').append(btnHtml);
        $('#uno-trigger-btn').css({
            'position': 'fixed',
            'bottom': '10px',
            'left': '10px',
            'z-index': '9999'
        });
    }

    // B. 创建游戏主界面 (默认隐藏)
    const gameHtml = `
        <div id="uno-game-container">
            <h3>🎮 UNO 游戏台</h3>
            <p>界面注入成功！</p>
            <button id="uno-close-btn" class="menu_button">关闭</button>
        </div>
    `;
    $('body').append(gameHtml);

    // C. 绑定事件
    $('#uno-trigger-btn').on('click', function() {
        $('#uno-game-container').fadeIn();
        // 使用 toastr 提示 (酒馆内置)
        if (window.toastr) toastr.info("UNO 游戏界面已打开");
    });

    $('#uno-close-btn').on('click', function() {
        $('#uno-game-container').fadeOut();
    });
}

// 3. 插件入口：等待 jQuery 就绪
jQuery(async () => {
    console.log("🚀 UNO 原生插件正在启动...");
    
    // 加载 CSS (原生插件需要手动注入 CSS link，或者依靠酒馆自动加载)
    // 为了保险，我们手动注入同目录下的 style.css
    // 注意：import.meta.url 获取当前脚本的路径
    const currentScriptUrl = import.meta.url; 
    const cssUrl = currentScriptUrl.replace('index.js', 'style.css');
    
    $('head').append(`<link rel="stylesheet" type="text/css" href="${cssUrl}">`);

    await loadSettings();
    createUI();
    
    console.log("✅ UNO 插件启动完成！请寻找 'UNO' 按钮。");
});
