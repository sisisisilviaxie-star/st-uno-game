// core.js - v13.0 (带自动存档与断点续玩)
(function(ST, $) {
    console.log("🎮 UNO 云端核心 v13.0 (Auto-Save) 已启动");

    // --- 存档键名 ---
    const SAVE_KEY = "st_uno_save_data";

    // --- 辅助：头像路径 ---
    function getAvatar(type) {
        const ctx = ST.getContext();
        if (!ctx) return "";
        if (type === 'user') {
            let av = ctx.userAvatar;
            return av ? (av.includes('/') ? av : `/User Avatars/${av}`) : 'img/user-default.png';
        } else {
            if (ctx.characterId && ctx.characters[ctx.characterId]) {
                let av = ctx.characters[ctx.characterId].avatar;
                return av ? (av.includes('/') ? av : `/characters/${av}`) : "";
            }
            return "";
        }
    }

    // --- UI 结构 ---
    const html = `
    <div id="uno-launch-btn">🎲</div>
    <div id="uno-main-view">
        <div id="ai-mask"><div class="spinner"></div><div id="ai-mask-text">AI 思考中...</div></div>
        <div class="uno-header" id="uno-drag">
            <span style="color:#ffd700">UNO 对战</span>
            <div style="display:flex; gap:10px;">
                <div class="uno-close" id="uno-restart" style="background:#f39c12;" title="重开">↺</div>
                <div class="uno-close" id="uno-hide">✕</div>
            </div>
        </div>
        <div class="uno-table">
            <div class="zone-ai">
                <div class="uno-avatar-box"><img id="ai-img" src=""></div>
                <div class="bubble bubble-ai" id="ai-msg">准备好了吗？</div>
            </div>
            <div class="info-ai">AI 手牌: <span id="ai-count" style="color:gold;font-weight:bold">7</span></div>
            
            <div class="zone-center">
                <div class="card c-red" id="table-card">Start</div>
                <div class="card c-back" id="draw-btn">UNO</div>
            </div>

            <div class="zone-player">
                <div class="bubble bubble-user" id="user-msg">...</div>
                <div class="uno-avatar-box"><img id="user-img" src=""></div>
            </div>
            <div class="hand-area" id="my-hand"></div>
        </div>
        <div class="input-area">
            <input type="text" id="uno-input" placeholder="发送对话...">
            <button id="uno-send">发送</button>
        </div>
    </div>
    `;
    // 防止重复注入
    if(!document.getElementById('uno-main-view')) $('body').append(html);

    // --- 游戏引擎 ---
    class Engine {
        constructor() {
            this.colors = ['red','blue','green','yellow'];
            this.reset();
        }
        
        reset() {
            this.deck = []; this.pHand = []; this.aHand = [];
            this.top = null; this.turn = 'player'; 
        }

        // --- 新增：存档功能 ---
        save() {
            const data = {
                pHand: this.pHand,
                aHand: this.aHand,
                top: this.top,
                turn: this.turn,
                deck: this.deck
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            console.log("[UNO] 游戏已自动保存");
        }

        // --- 新增：读档功能 ---
        load() {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return false;
            try {
                const data = JSON.parse(raw);
                // 简单校验数据完整性
                if(!data.pHand || !data.top) return false;
                
                this.pHand = data.pHand;
                this.aHand = data.aHand;
                this.top = data.top;
                this.turn = data.turn;
                this.deck = data.deck;
                return true;
            } catch(e) {
                console.error("读档失败", e);
                return false;
            }
        }

        init() {
            this.reset();
            this.createDeck();
            this.pHand = this.draw(7);
            this.aHand = this.draw(7);
            this.top = this.draw(1)[0];
            while(isNaN(this.top.val)) { 
                this.deck.push(this.top); this.top = this.draw(1)[0];
            }
            this.save(); // 初始存档
        }

        createDeck() {
            this.colors.forEach(c => {
                for(let i=0;i<=9;i++) this.deck.push({col:c, val:i, type:'num'});
                ['skip','draw2','reverse'].forEach(t => {
                    this.deck.push({col:c, val:t, type:t});
                    this.deck.push({col:c, val:t, type:t});
                });
            });
            this.deck.sort(()=>Math.random()-0.5);
        }

        draw(n) {
            let arr = [];
            for(let i=0;i<n;i++) {
                if(this.deck.length===0) this.createDeck();
                arr.push(this.deck.pop());
            }
            return arr;
        }

        canPlay(c) { return c.col === this.top.col || c.val == this.top.val; }
    }
    const G = new Engine();

    // --- UI 更新 ---
    function update() {
        if(!G.top) return; // 防止空数据报错

        let topT = G.top.val;
        if(topT=='skip') topT='🚫'; if(topT=='draw2') topT='+2'; if(topT=='reverse') topT='⇄';
        $('#table-card').removeClass().addClass(`card c-${G.top.col}`).text(topT);
        $('#ai-count').text(G.aHand.length);

        $('#my-hand').empty();
        G.pHand.forEach((c, i) => {
            let txt = c.val;
            if(txt=='skip') txt='🚫'; if(txt=='draw2') txt='+2'; if(txt=='reverse') txt='⇄';
            const el = $(`<div class="card c-${c.col}">${txt}</div>`);
            
            if(G.turn === 'player') {
                if(G.canPlay(c)) {
                    el.addClass('playable').click(()=>playCard(i));
                } else {
                    el.addClass('disabled');
                }
            } else {
                el.addClass('disabled');
            }
            $('#my-hand').append(el);
        });

        // 每次更新界面时，自动存档
        G.save();
    }

    function say(who, txt) {
        const el = $(who==='ai'?'#ai-msg':'#user-msg');
        el.text(txt).addClass('show');
        setTimeout(()=>el.removeClass('show'), 5000);
    }

    // --- 交互 ---
    async function playCard(idx) {
        if(G.turn !== 'player') return;
        const c = G.pHand[idx];
        G.pHand.splice(idx, 1);
        G.top = c;
        update();

        if(c.type === 'draw2') { G.aHand.push(...G.draw(2)); say('ai', "(+2!)"); }
        if(c.type === 'skip' || c.type === 'reverse') { say('ai', "(跳过)"); return; }

        G.turn = 'ai';
        update();
        await aiTurn();
    }

    $('#draw-btn').click(async ()=>{
        if(G.turn !== 'player') return;
        const c = G.draw(1)[0];
        G.pHand.push(c);
        say('user', `摸到 ${c.col} ${c.val}`);
        
        if(G.canPlay(c)) {
            if(window.toastr) toastr.info("摸到的牌可以出！");
            update();
        } else {
            if(window.toastr) toastr.warning("回合结束");
            update();
            await new Promise(r=>setTimeout(r, 800));
            G.turn = 'ai';
            update();
            await aiTurn();
        }
    });

    async function aiTurn() {
        $('#ai-mask').fadeIn(200);
        const valid = G.aHand.filter(c => G.canPlay(c));
        let move = null;
        
        const special = valid.find(c => c.type !== 'num');
        if(special) move = special;
        else if(valid.length > 0) move = valid[Math.floor(Math.random()*valid.length)];

        // LLM 调用
        const ctx = ST.getContext();
        const char = ctx.characters[ctx.characterId]?.name || "AI";
        const prompt = `[UNO] Roleplay ${char}. Move: ${move ? `${move.col} ${move.val}` : "Draw"}. Short reaction line. JSON: {"speech":"..."}`;
        
        let speech = move ? "出牌！" : "摸牌...";
        try {
            if(ST.generateQuietPrompt) {
                const res = await ST.generateQuietPrompt(prompt, true, false);
                const json = res.match(/\{[\s\S]*\}/);
                if(json) speech = JSON.parse(json[0]).speech;
            }
        } catch(e) {}

        $('#ai-mask').fadeOut(200);
        say('ai', speech);

        if(move) {
            const idx = G.aHand.indexOf(move);
            G.aHand.splice(idx, 1);
            G.top = move;
            if(move.type === 'draw2') G.pHand.push(...G.draw(2));
            if(move.type === 'skip' || move.type === 'reverse') {
                update();
                await new Promise(r=>setTimeout(r, 1000));
                await aiTurn();
                return;
            }
        } else {
            G.aHand.push(...G.draw(1));
        }
        G.turn = 'player';
        update();
    }

    // --- 启动逻辑 ---
    
    // 1. 打开界面时刷新头像
    $('#uno-launch-btn').off('click').on('click', () => {
        $('#ai-img').attr('src', getAvatar('char'));
        $('#user-img').attr('src', getAvatar('user'));
        
        // 尝试读档
        if (G.load()) {
            console.log("✅ 读档成功");
            if(window.toastr) toastr.success("游戏进度已恢复");
        } else {
            console.log("🆕 无存档，新开局");
            G.init();
        }
        
        update();
        $('#uno-main-view').fadeIn();
    });

    // 2. 重置按钮
    $('#uno-restart').click(() => {
        if(confirm("确定要重开一局吗？")) {
            G.init();
            update();
        }
    });

    // 3. 关闭
    $('#uno-hide').click(() => $('#uno-main-view').fadeOut());
    
    // 拖拽
    const h = document.getElementById('uno-drag'), v = document.getElementById('uno-main-view');
    let d=false,x,y,ix,iy;
    h.addEventListener('mousedown',e=>{d=true;x=e.clientX;y=e.clientY;ix=v.offsetLeft;iy=v.offsetTop});
    document.addEventListener('mousemove',e=>{if(d){e.preventDefault();v.style.left=(ix+e.clientX-x)+'px';v.style.top=(iy+e.clientY-y)+'px';v.style.margin=0}});
    document.addEventListener('mouseup',()=>d=false);

})(window.SillyTavern, window.jQuery);
