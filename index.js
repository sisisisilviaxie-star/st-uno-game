// 插件配置
const EXTENSION_NAME = "st_uno_game";

(async function() {
    // --- 0. 清理旧环境 ---
    $('#uno-launch-btn').remove();
    $('#uno-main-view').remove();
    $('style[id="uno-css"]').remove();

    console.log("🚀 [UNO] 游戏引擎 v5.0 启动...");

    // --- 1. 游戏逻辑核心 (Model) ---
    // 这部分负责纯数学逻辑，不涉及界面
    class UnoEngine {
        constructor() {
            this.deck = [];       // 牌堆
            this.handPlayer = []; // 玩家手牌
            this.handAI = [];     // AI手牌
            this.topCard = null;  // 场上最上面的牌
            this.turn = 'player'; // 当前回合: 'player' 或 'ai'
            this.colors = ['red', 'yellow', 'blue', 'green'];
        }

        // 初始化一局游戏
        startNewGame() {
            this.deck = this.createDeck();
            this.handPlayer = this.drawCards(7);
            this.handAI = this.drawCards(7);
            this.topCard = this.drawCards(1)[0];
            this.turn = 'player';
            console.log("🃏 新游戏开始，牌堆生成完毕");
        }

        // 生成牌堆 (简化版：只有数字牌)
        createDeck() {
            let deck = [];
            this.colors.forEach(color => {
                for (let i = 0; i <= 9; i++) {
                    deck.push({ color: color, value: i, type: 'number' });
                }
            });
            // 洗牌算法
            return deck.sort(() => Math.random() - 0.5);
        }

        // 抽牌
        drawCards(count) {
            let drawn = [];
            for(let i=0; i<count; i++) {
                if(this.deck.length > 0) drawn.push(this.deck.pop());
            }
            return drawn;
        }

        // AI 思考出牌 (简单的 AI 逻辑)
        aiThink() {
            // 寻找能出的牌
            const matchIndex = this.handAI.findIndex(card => 
                card.color === this.topCard.color || card.value === this.topCard.value
            );

            if (matchIndex !== -1) {
                // 找到牌了，出牌
                const card = this.handAI.splice(matchIndex, 1)[0];
                this.topCard = card;
                this.turn = 'player';
                return { action: 'play', card: card };
            } else {
                // 没牌，抽一张
                const drawn = this.drawCards(1);
                if(drawn.length > 0) this.handAI.push(drawn[0]);
                this.turn = 'player';
                return { action: 'draw', card: null };
            }
        }
    }

    // 实例化游戏引擎
    const Game = new UnoEngine();

    // --- 2. 等待环境 ---
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    while ((!window.SillyTavern || !window.jQuery)) await delay(500);
    const $ = window.jQuery;

    // --- 3. 界面样式 (CSS) ---
    const cssStyles = `
        #uno-launch-btn {
            position: fixed; top: 60px; right: 20px; z-index: 20000;
            width: 45px; height: 45px; background: rgba(0,0,0,0.8); color: gold;
            border: 2px solid gold; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-size: 24px; backdrop-filter: blur(2px);
        }
        #uno-main-view {
            position: fixed; top: 120px; left: 20px; right: 20px;
            max-width: 400px; margin: 0 auto;
            background: #222; border: 2px solid #444; border-radius: 16px;
            z-index: 29999; display: none; flex-direction: column;
            box-shadow: 0 10px 50px black; overflow: hidden;
        }
        .uno-header { padding: 10px; background: #333; display: flex; justify-content: space-between; }
        .uno-table { 
            padding: 20px; min-height: 200px; 
            background: radial-gradient(circle, #3a5a40, #1a2a1e); 
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            position: relative;
        }
        
        /* 卡牌样式 */
        .uno-card {
            width: 60px; height: 90px; background: white; 
            border-radius: 5px; display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: 24px; border: 2px solid white;
            box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
            cursor: pointer; transition: transform 0.2s;
        }
        .uno-card:active { transform: scale(0.9); }
        
        /* 颜色变体 */
        .card-red { background: #ff5555; color: white; }
        .card-blue { background: #5555ff; color: white; }
        .card-green { background: #55aa55; color: white; }
        .card-yellow { background: #ffaa00; color: black; }
        
        /* 区域 */
        .ai-area { position: absolute; top: 10px; display: flex; gap: 5px; }
        .ai-card-back { 
            width: 40px; height: 60px; background: #333; border: 1px solid #666; border-radius: 4px; 
        }
        .player-area { 
            position: absolute; bottom: 10px; 
            display: flex; gap: 5px; overflow-x: auto; max-width: 100%; padding: 5px;
        }
        .center-pile { transform: scale(1.2); }
        
        .uno-btn { padding: 10px; margin: 10px; width: 90%; background: #4CAF50; border:none; color:white; font-weight:bold; border-radius:5px;}
    `;
    $('head').append(`<style id="uno-css">${cssStyles}</style>`);

    // --- 4. 界面结构 (HTML) ---
    $('body').append(`
        <div id="uno-launch-btn">🎲</div>
        <div id="uno-main-view">
            <div class="uno-header" id="uno-drag-handle">
                <span style="color:gold; font-weight:bold;">UNO 竞技场</span>
                <div class="uno-close" style="cursor:pointer;">✕</div>
            </div>
            
            <div class="uno-table">
                <!-- AI 手牌区 (显示背面) -->
                <div class="ai-area" id="ai-hand-view"></div>
                
                <!-- 弃牌堆 (中间) -->
                <div class="center-pile">
                    <div class="uno-card card-red" id="top-card-view">?</div>
                </div>
                
                <!-- 玩家手牌区 -->
                <div class="player-area" id="player-hand-view"></div>
            </div>

            <div id="game-log" style="padding:5px; text-align:center; color:#aaa; font-size:12px;">等待开始...</div>
            <button class="uno-btn" id="btn-start">发牌开局</button>
        </div>
    `);

    // --- 5. 控制器逻辑 (Controller) ---
    
    // 渲染界面
    function renderUI() {
        // 渲染 AI 手牌 (只显示背面数量)
        $('#ai-hand-view').empty();
        Game.handAI.forEach(() => {
            $('#ai-hand-view').append(`<div class="ai-card-back"></div>`);
        });

        // 渲染中间牌
        const top = Game.topCard;
        $('#top-card-view')
            .text(top.value)
            .removeClass().addClass(`uno-card card-${top.color}`);

        // 渲染玩家手牌
        $('#player-hand-view').empty();
        Game.handPlayer.forEach((card, index) => {
            const el = $(`<div class="uno-card card-${card.color}">${card.value}</div>`);
            // 绑定出牌点击事件
            el.on('click', () => handlePlayerMove(index));
            $('#player-hand-view').append(el);
        });
    }

    // 玩家出牌逻辑
    async function handlePlayerMove(index) {
        if (Game.turn !== 'player') return;

        const card = Game.handPlayer[index];
        // 简单规则检查：同色或同数字
        if (card.color !== Game.topCard.color && card.value !== Game.topCard.value) {
            if(window.toastr) toastr.warning("这张牌出不去！颜色或数字不匹配。");
            return;
        }

        // 执行出牌
        Game.handPlayer.splice(index, 1);
        Game.topCard = card;
        Game.turn = 'ai';
        renderUI();
        $('#game-log').text(`你打出了 ${card.color} ${card.value}`);

        // --- 关键：触发 AI 回合 (流式交互) ---
        await triggerAITurn();
    }

    // AI 回合逻辑 (流式交互核心)
    async function triggerAITurn() {
        $('#game-log').text("AI 正在思考...");
        
        // 1. AI 纯逻辑思考
        await delay(1000); // 假装思考一会
        const move = Game.aiThink();
        
        renderUI(); // 先更新界面 (动作)

        // 2. 构造 Prompt (话术)
        let systemPrompt = "";
        if (move.action === 'play') {
            $('#game-log').text(`AI 打出了 ${move.card.color} ${move.card.value}`);
            systemPrompt = `(系统提示: 轮到你了。你打出了一张【${move.card.color} ${move.card.value}】。请简短地回应这一步操作。)`;
        } else {
            $('#game-log').text(`AI 摸了一张牌`);
            systemPrompt = `(系统提示: 轮到你了。你手里没有能出的牌，只好摸了一张。请表现得有点懊恼。)`;
        }

        // 3. 触发酒馆 AI 发言 (通过 Slash Command 设置输入框并发送)
        // 这是一个模拟操作，实际应用中我们会调用 SillyTavern.generate()
        if (window.SillyTavern && window.SillyTavern.eventSource) {
            // 暂时只弹窗提示，下一步我们接 LLM
            if(window.toastr) toastr.info(`AI 想要说: ${systemPrompt}`);
            
            // TODO: 这里将写入真正的 LLM 调用代码
            // await SillyTavern.generateInput(systemPrompt); 
        }
    }

    // --- 6. 绑定基础事件 ---
    $(document).on('click', '#uno-launch-btn', () => $('#uno-main-view').fadeIn());
    $(document).on('click', '.uno-close', () => $('#uno-main-view').fadeOut());
    
    $(document).on('click', '#btn-start', () => {
        Game.startNewGame();
        renderUI();
        $('#btn-start').hide(); // 隐藏开始按钮
        if(window.toastr) toastr.success("游戏开始！轮到你了");
    });

    // 简单的拖拽支持
    const handle = document.getElementById('uno-drag-handle');
    const el = document.getElementById('uno-main-view');
    if(handle && el) {
        let isD = false, sx, sy, ix, iy;
        handle.addEventListener('touchstart', e => { isD=true; sx=e.touches[0].clientX; sy=e.touches[0].clientY; ix=el.offsetLeft; iy=el.offsetTop; });
        handle.addEventListener('touchmove', e => { if(isD) { e.preventDefault(); el.style.left=(ix+e.touches[0].clientX-sx)+'px'; el.style.top=(iy+e.touches[0].clientY-sy)+'px'; } }, {passive:false});
        handle.addEventListener('touchend', () => isD=false);
    }

    console.log("✅ [UNO] 逻辑引擎加载完毕");
})();
